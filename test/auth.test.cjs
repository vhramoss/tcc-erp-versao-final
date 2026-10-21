require('ts-node/register/transpile-only');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { SignJWT, decodeJwt } = require('jose');
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const { AuthService } = require('../src/modules/auth/auth.service.ts');
const { TokensService } = require('../src/modules/auth/tokens.service.ts');
const { hashSenha, verificarSenha } = require('../src/modules/auth/senhas.ts');
const { AppModule } = require('../src/app.module.ts');
const { PrismaService } = require('../src/prisma/prisma.service.ts');
const { SanitizeInterceptor } = require('../src/common/interceptors/sanitize.interceptor.ts');
const { AcessosService } = require('../src/modules/auth/acessos.service.ts');
const { AuthLimiteGuard, PermissoesGuard } = require('../src/modules/auth/auth.guards.ts');
const { Reflector } = require('@nestjs/core');

process.env.JWT_ACCESS_SECRET = 'access-secret-somente-para-teste-123456789';
process.env.JWT_REFRESH_SECRET = 'refresh-secret-somente-para-teste-123456789';
const senha = '  senha de teste com espaços  ';
const status401 = e => e.getStatus?.() === 401;
const senhaHash = hashSenha(senha);

function combina(row, where) {
  return row && Object.entries(where).every(([key, value]) => {
    if (value && typeof value === 'object' && 'gt' in value) return row[key] > value.gt;
    return row[key] === value;
  });
}
async function ambiente() {
  const usuario = { id: randomUUID(), idEmpresa: randomUUID(), username: 'operador', password: await senhaHash, ativo: true,
    departamentoId: randomUUID(), permissoes: [{ permissao: { nome: 'produtos.ler' } }, { permissao: { nome: 'financeiro.ler' } }],
    departamento: { permissoes: [{ permissao: { nome: 'produtos.ler' } }] },
  };
  const sessoes = [];
  const consultas = [];
  const prisma = {
    usuario: {
      findFirst: async ({ where }) => combina(usuario, where) ? usuario : null,
      updateMany: async ({ where, data }) => { if (!combina(usuario, where)) return { count: 0 }; Object.assign(usuario, data); return { count: 1 }; },
    },
    sessaoRefresh: {
      create: async ({ data }) => { const s = { revogadoEm: null, ...data }; sessoes.push(s); return s; },
      findFirst: async ({ where, include }) => { const s = sessoes.find(s => combina(s, where)); return s ? { ...s, ...(include ? { usuario } : {}) } : null; },
      updateMany: async ({ where, data }) => { const rows = sessoes.filter(s => combina(s, where)); rows.forEach(s => Object.assign(s, data)); return { count: rows.length }; },
    },
    produto: { findMany: async ({ where }) => { consultas.push(where); return []; } },
    $queryRaw: async () => [],
  };
  // Serializa as transações simulando o lock da linha de usuário. Não testa PostgreSQL.
  let fila = Promise.resolve();
  prisma.$transaction = fn => {
    const execucao = fila.then(() => fn(prisma));
    fila = execucao.catch(() => {});
    return execucao;
  };
  const tokens = new TokensService();
  const auth = new AuthService(prisma, tokens);
  const login = () => auth.login({ idEmpresa: usuario.idEmpresa, username: usuario.username, senha });
  return { usuario, sessoes, prisma, tokens, auth, login, consultas };
}

test('scrypt usa salt individual, valida senha exata e recusa texto legado', async () => {
  const hash = await senhaHash;
  assert.notEqual(hash, await hashSenha(senha));
  assert.equal(await verificarSenha(senha, hash), true);
  assert.equal(await verificarSenha(senha.trim(), hash), false);
  assert.equal(await verificarSenha('DEV-ONLY-NOT-A-REAL-HASH', 'DEV-ONLY-NOT-A-REAL-HASH'), false);
});
test('login emite JWTs distintos e só guarda hash do refresh; permissões são interseção', async () => {
  const a = await ambiente(); const par = await a.login();
  assert.equal(par.expiresIn, 900);
  assert.ok(par.refreshExpiresIn >= 604799);
  assert.equal(a.sessoes[0].tokenHash, a.tokens.hash(par.refreshToken));
  assert.notEqual(a.sessoes[0].tokenHash, par.refreshToken);
  const user = await a.auth.autenticar(par.accessToken);
  assert.deepEqual(user.permissoes, ['produtos.ler']);
  assert.equal(user.idEmpresa, a.usuario.idEmpresa);
  assert.equal(user.password, undefined);
  assert.equal(decodeJwt(par.accessToken).password, undefined);
  a.usuario.departamento.permissoes = [];
  assert.deepEqual((await a.auth.autenticar(par.accessToken)).permissoes, []);
});
test('login rejeita senha errada, usuário inativo e empresa diferente', async () => {
  const a = await ambiente();
  for (const dto of [
    { idEmpresa: a.usuario.idEmpresa, username: 'operador', senha: 'errada' },
    { idEmpresa: randomUUID(), username: 'operador', senha },
  ]) await assert.rejects(a.auth.login(dto), status401);
  a.usuario.ativo = false;
  await assert.rejects(a.login(), status401);
  assert.equal(a.sessoes.length, 0);
});
test('refresh rotaciona, preserva expiração absoluta e replay revoga a sessão', async () => {
  const a = await ambiente(); const original = await a.login();
  const novo = await a.auth.renovar(original.refreshToken);
  assert.notEqual(novo.refreshToken, original.refreshToken);
  assert.equal(decodeJwt(original.refreshToken).exp, decodeJwt(novo.refreshToken).exp);
  await a.auth.autenticar(novo.accessToken);
  await assert.rejects(a.auth.renovar(original.refreshToken), status401);
  assert.ok(a.sessoes[0].revogadoEm);
  await assert.rejects(a.auth.autenticar(novo.accessToken), status401);
  await assert.rejects(a.auth.renovar(novo.refreshToken), status401);
});
test('duas renovações concorrentes não reutilizam refresh', async () => {
  const a = await ambiente(); const par = await a.login();
  const respostas = await Promise.allSettled([a.auth.renovar(par.refreshToken), a.auth.renovar(par.refreshToken)]);
  assert.equal(respostas.filter(r => r.status === 'fulfilled').length, 1);
  assert.ok(a.sessoes[0].revogadoEm);
});
test('logout invalida acesso imediatamente; inativação e senha nova encerram sessões', async () => {
  const a = await ambiente(); const par = await a.login(); const user = await a.auth.autenticar(par.accessToken);
  await a.auth.sair(user);
  await assert.rejects(a.auth.autenticar(par.accessToken), status401);
  await assert.rejects(a.auth.renovar(par.refreshToken), status401);
  const segunda = await a.login(); a.usuario.ativo = false;
  await assert.rejects(a.auth.autenticar(segunda.accessToken), status401);
  await assert.rejects(a.auth.renovar(segunda.refreshToken), status401);
  a.usuario.ativo = true;
  await a.auth.trocarSenha(user, { senhaAtual: senha, novaSenha: 'outra senha segura 123' });
  assert.equal(await verificarSenha('outra senha segura 123', a.usuario.password), true);
  await assert.rejects(a.auth.autenticar(segunda.accessToken), status401);
});
test('JWT rejeita adulteração, expiração, emissor/audiência e tipo incorretos', async () => {
  const a = await ambiente(); const par = await a.login();
  await assert.rejects(a.auth.autenticar(par.refreshToken), status401);
  await assert.rejects(a.auth.renovar(par.accessToken), status401);
  const partes = par.accessToken.split('.');
  partes[1] = Buffer.from(JSON.stringify({ ...decodeJwt(par.accessToken), idEmpresa: randomUUID() })).toString('base64url');
  await assert.rejects(a.auth.autenticar(partes.join('.')), status401);
  const claims = decodeJwt(par.accessToken);
  for (const alteracao of [{ exp: 1 }, { iss: 'outro' }, { aud: 'outro' }, { tipo: 'refresh' }, { sid: 'invalido' }]) {
    const token = await new SignJWT({ ...claims, ...alteracao }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).sign(Buffer.from(process.env.JWT_ACCESS_SECRET));
    await assert.rejects(a.auth.autenticar(token), status401);
  }
  const inseguro = `${partes[0]}.${partes[1]}.`;
  await assert.rejects(a.auth.autenticar(inseguro), status401);
});
test('HTTP real: headers antigos não autenticam, JWT isola tenant e permissões protegem rotas', async t => {
  const a = await ambiente();
  const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(a.prisma).compile();
  const app = module.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new SanitizeInterceptor());
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  const base = await app.getUrl();
  const request = (path, options = {}) => fetch(base + path, options);
  const login = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idEmpresa: a.usuario.idEmpresa, username: 'operador', senha }) });
  assert.equal(login.status, 201); // Inclui espaços na senha: interceptor deve preservá-los.
  assert.equal(login.headers.get('cache-control'), 'no-store');
  const par = await login.json();
  assert.equal((await request('/produtos', { headers: { 'x-empresa-id': a.usuario.idEmpresa, 'x-user-id': a.usuario.id } })).status, 401);
  const headers = { Authorization: `Bearer ${par.accessToken}`, 'x-empresa-id': randomUUID(), 'x-user-id': randomUUID() };
  assert.equal((await request('/produtos', { headers })).status, 200);
  assert.equal(a.consultas.at(-1).idEmpresa, a.usuario.idEmpresa);
  assert.equal((await request('/financeiro/fluxo-caixa', { headers })).status, 403);
  assert.equal((await request('/acessos/usuarios', { headers })).status, 403);
  assert.equal((await request('/produtos', { method: 'POST', headers })).status, 403);
  assert.equal((await request('/auth/me', { headers: { Authorization: `Bearer ${par.refreshToken}` } })).status, 401);
  assert.equal((await request('/auth/logout', { method: 'POST', headers })).status, 201);
  assert.equal((await request('/produtos', { headers })).status, 401);
});

test('gestão de acessos rejeita pessoa e departamento externos e permissões fora do setor', async () => {
  const user = { id: randomUUID(), idEmpresa: randomUUID(), departamentoId: randomUUID() };
  const setor = { id: randomUUID(), idEmpresa: user.idEmpresa, permissoes: [{ permissao: { nome: 'produtos.ler' } }] };
  const pessoaId = randomUUID();
  let gravacoes = 0;
  const tx = {
    $queryRaw: async () => [],
    departamento: { findFirst: async ({ where }) => combina(setor, where) ? setor : null },
    pessoa: { findFirst: async () => null },
    permissao: { upsert: async ({ where }) => ({ id: randomUUID(), nome: where.nome }) },
    usuario: {
      findFirst: async ({ where }) => where.id === user.id && where.idEmpresa === user.idEmpresa ? {
        ...user, ativo: true,
        permissoes: ['acessos.gerenciar', 'produtos.ler', 'financeiro.gerenciar'].map(nome => ({ permissao: { nome } })),
        departamento: { permissoes: ['acessos.gerenciar', 'produtos.ler', 'financeiro.gerenciar'].map(nome => ({ permissao: { nome } })) },
      } : null,
      create: async () => { gravacoes++; },
    },
  };
  const service = new AcessosService({ $transaction: fn => fn(tx) });
  const dto = { pessoaId, departamentoId: setor.id, username: 'novo', senha, permissoes: ['produtos.ler'] };
  await assert.rejects(service.criarUsuario(user, dto), e => e.getStatus() === 400);
  await assert.rejects(service.criarUsuario(user, { ...dto, departamentoId: randomUUID() }), e => e.getStatus() === 400);
  await assert.rejects(service.criarUsuario(user, { ...dto, permissoes: ['financeiro.gerenciar'] }), e => e.getStatus() === 400);
  assert.equal(gravacoes, 0);
});
test('mudança de departamento limpa permissões individuais e revoga sessões', async () => {
  const user = { id: randomUUID(), idEmpresa: randomUUID() };
  const alvo = { id: randomUUID(), idEmpresa: user.idEmpresa, departamentoId: randomUUID() };
  const novoSetor = randomUUID();
  const efeitos = [];
  const tx = {
    $queryRaw: async () => [],
    usuario: {
      findFirst: async ({ where }) => combina(alvo, where) ? alvo : null,
      update: async ({ where, data, select }) => {
        assert.equal(where.idEmpresa, user.idEmpresa);
        assert.equal(select.password, undefined);
        return { ...alvo, ...data, permissoes: [{ permissaoId: 'antiga' }] };
      },
    },
    departamento: { findFirst: async ({ where }) => where.id === novoSetor && where.idEmpresa === user.idEmpresa ? { permissoes: [] } : null },
    usuarioPermissao: { deleteMany: async ({ where }) => efeitos.push(['permissoes', where]) },
    sessaoRefresh: { updateMany: async ({ where }) => efeitos.push(['sessoes', where]) },
  };
  const service = new AcessosService({ $transaction: fn => fn(tx) });
  const resultado = await service.atualizarUsuario(user, alvo.id, { departamentoId: novoSetor });
  assert.deepEqual(resultado.permissoes, []);
  assert.equal(efeitos.length, 2);
  for (const [, where] of efeitos) { assert.equal(where.usuarioId, alvo.id); assert.equal(where.idEmpresa, user.idEmpresa); }
  await assert.rejects(service.atualizarUsuario(user, randomUUID(), { ativo: false }), e => e.getStatus() === 404);
});
test('limite de tentativas e negação por padrão de rota sem permissão', () => {
  const limite = new AuthLimiteGuard();
  const ctx = { switchToHttp: () => ({ getRequest: () => ({ socket: { remoteAddress: '127.0.0.1' } }) }) };
  for (let i = 0; i < 20; i++) assert.equal(limite.canActivate(ctx), true);
  assert.throws(() => limite.canActivate(ctx), e => e.getStatus() === 429);
  const guard = new PermissoesGuard(new Reflector());
  const contexto = { getHandler: () => function rota() {}, getClass: () => class SemPolitica {}, switchToHttp: () => ({ getRequest: () => ({ method: 'GET', user: { permissoes: ['produtos.ler'] } }) }) };
  assert.throws(() => guard.canActivate(contexto), e => e.getStatus() === 403);
});

test('HTTP: leitura, listagem, edição e exclusão respeitam empresa mesmo com permissão', async t => {
  const a = await ambiente();
  const direitos = ['clientes.ler', 'clientes.gerenciar'].map(nome => ({ permissao: { nome } }));
  a.usuario.permissoes = direitos;
  a.usuario.departamento.permissoes = direitos;
  const proprio = { id: randomUUID(), idEmpresa: a.usuario.idEmpresa, pessoaId: randomUUID() };
  const externo = { id: randomUUID(), idEmpresa: randomUUID(), pessoaId: randomUUID() };
  let clientes = [proprio, externo];
  const alteracoes = [];
  a.prisma.cliente = {
    findFirst: async ({ where }) => clientes.find(c => combina(c, where)),
    findMany: async ({ where }) => clientes.filter(c => combina(c, where)),
    delete: async ({ where }) => { alteracoes.push(['delete', where.id]); clientes = clientes.filter(c => c.id !== where.id); return { id: where.id }; },
  };
  a.prisma.pessoa = { update: async ({ where, data }) => { alteracoes.push(['update', where.id]); return { id: where.id, ...data }; } };
  a.prisma.pedido = { count: async () => 0 };
  const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(a.prisma).compile();
  const app = module.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0, '127.0.0.1'); t.after(() => app.close());
  const base = await app.getUrl(), par = await a.login();
  const headers = { Authorization: `Bearer ${par.accessToken}`, 'Content-Type': 'application/json', 'x-empresa-id': externo.idEmpresa };
  const request = (id, method = 'GET', data) => fetch(`${base}/clientes/${id}`, { method, headers, ...(data ? { body: JSON.stringify(data) } : {}) });
  const lista = await fetch(`${base}/clientes`, { headers });
  assert.deepEqual((await lista.json()).map(c => c.id), [proprio.id]);
  assert.equal((await request(proprio.id)).status, 200);
  assert.equal((await request(proprio.id, 'HEAD')).status, 200);
  for (const method of ['GET', 'HEAD', 'PUT', 'DELETE']) {
    const res = await request(externo.id, method, method === 'PUT' ? { nome: 'invasao' } : undefined);
    assert.equal(res.status, 404, method);
  }
  assert.deepEqual(alteracoes, []);
  assert.equal((await request(proprio.id, 'PUT', { nome: 'nome', idEmpresa: externo.idEmpresa })).status, 400);
  assert.deepEqual(alteracoes, []);
  assert.equal((await request(proprio.id, 'PUT', { nome: 'nome autorizado' })).status, 200);
  assert.equal((await request(proprio.id, 'DELETE')).status, 200);
  assert.deepEqual(alteracoes, [['update', proprio.pessoaId], ['delete', proprio.id]]);
  assert.equal(clientes[0].id, externo.id);
});

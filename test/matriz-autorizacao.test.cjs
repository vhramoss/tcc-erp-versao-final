require('ts-node/register/transpile-only');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { RequestMethod } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const { PATH_METADATA, METHOD_METADATA } = require('@nestjs/common/constants');
const { AppModule } = require('../src/app.module.ts');
const { JwtAuthGuard, PermissoesGuard } = require('../src/modules/auth/auth.guards.ts');
const { PUBLICA, AUTENTICADO, RECURSO } = require('../src/modules/auth/auth.decorators.ts');
const esperada = require('./matriz-autorizacao.json');
const reflector = new Reflector();
const controllers = new Set(), visitados = new Set();
function visitar(modulo) {
  if (visitados.has(modulo)) return;
  visitados.add(modulo);
  for (const c of Reflect.getMetadata('controllers', modulo) ?? []) controllers.add(c);
  for (const m of Reflect.getMetadata('imports', modulo) ?? []) visitar(m.module ?? m);
}
visitar(AppModule);
const rotas = new Map();
for (const controller of controllers) {
  for (const nome of Object.getOwnPropertyNames(controller.prototype)) {
    const handler = controller.prototype[nome];
    const metodo = Reflect.getMetadata(METHOD_METADATA, handler);
    if (metodo === undefined) continue;
    const caminho = '/' + [Reflect.getMetadata(PATH_METADATA, controller), Reflect.getMetadata(PATH_METADATA, handler)].join('/').split('/').filter(Boolean).join('/');
    const chave = `${RequestMethod[metodo]} ${caminho}`;
    assert.ok(!rotas.has(chave), `Rota duplicada: ${chave}`);
    rotas.set(chave, { controller, handler, method: RequestMethod[metodo] });
  }
}
test('matriz cobre exatamente todas as rotas registradas no AppModule', () => {
  assert.deepEqual([...rotas.keys()].sort(), Object.keys(esperada).sort());
});
for (const [rota, politica] of Object.entries(esperada)) {
  test(`autorização: ${rota} exige ${politica}`, async () => {
    const { controller, handler, method } = rotas.get(rota);
    const alvos = [handler, controller];
    const declarada = reflector.getAllAndOverride(PUBLICA, alvos) ? 'publica'
      : reflector.getAllAndOverride(AUTENTICADO, alvos) ? 'autenticado'
      : `${reflector.getAllAndOverride(RECURSO, alvos)}.${method === 'GET' ? 'ler' : 'gerenciar'}`;
    assert.equal(declarada, politica);
    const request = { method, headers: {} };
    const ctx = { getClass: () => controller, getHandler: () => handler, switchToHttp: () => ({ getRequest: () => request }) };
    const auth = new JwtAuthGuard(reflector, { autenticar: async () => ({ id: 'usuario', idEmpresa: 'empresa', permissoes: [] }) });
    const permissoes = new PermissoesGuard(reflector);
    if (politica === 'publica') {
      assert.equal(await auth.canActivate(ctx), true);
      assert.equal(permissoes.canActivate(ctx), true);
      return;
    }
    await assert.rejects(auth.canActivate(ctx), e => e.getStatus() === 401);
    request.headers.authorization = 'Bearer token-do-teste';
    await auth.canActivate(ctx);
    if (politica === 'autenticado') { assert.equal(permissoes.canActivate(ctx), true); return; }
    assert.throws(() => permissoes.canActivate(ctx), e => e.getStatus() === 403);
    request.user.permissoes = [politica.endsWith('.ler') ? politica.replace('.ler', '.gerenciar') : politica.replace('.gerenciar', '.ler')];
    assert.throws(() => permissoes.canActivate(ctx), e => e.getStatus() === 403);
    request.user.permissoes = [politica];
    assert.equal(permissoes.canActivate(ctx), true);
    if (method === 'GET') {
      request.method = 'HEAD';
      assert.equal(permissoes.canActivate(ctx), true);
      request.user.permissoes = [];
      assert.throws(() => permissoes.canActivate(ctx), e => e.getStatus() === 403);
    }
  });
}

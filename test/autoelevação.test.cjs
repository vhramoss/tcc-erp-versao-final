require('ts-node/register/transpile-only');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AcessosService } = require('../src/modules/auth/acessos.service.ts');
const concessoes = nomes => nomes.map(nome => ({ permissao: { nome } }));
const proibido = erro => erro.getStatus?.() === 403;

function ambiente() {
  const gestores = [
    { id: 'limitado', idEmpresa: 'empresa', ativo: true, departamentoId: 'setor-limitado', permissoes: concessoes(['acessos.gerenciar']), departamento: { permissoes: concessoes(['acessos.gerenciar', 'financeiro.gerenciar']) } },
    { id: 'aprovador', idEmpresa: 'empresa', ativo: true, departamentoId: 'setor-aprovador', permissoes: concessoes(['acessos.gerenciar', 'financeiro.gerenciar']), departamento: { permissoes: concessoes(['acessos.gerenciar', 'financeiro.gerenciar']) } },
  ];
  const gravacoes = [];
  const tx = {
    $queryRaw: async () => [],
    usuario: {
      findFirst: async ({ where }) => gestores.find(g => g.id === where.id && g.idEmpresa === where.idEmpresa && (!where.ativo || g.ativo)),
    },
    departamento: { findFirst: async ({ where }) => where.idEmpresa === 'empresa' ? { id: where.id, permissoes: concessoes(['acessos.gerenciar', 'financeiro.gerenciar']) } : null },
    permissao: { upsert: async ({ where }) => ({ id: where.nome, nome: where.nome }) },
    usuarioPermissao: { deleteMany: async () => gravacoes.push('delete usuario'), createMany: async () => gravacoes.push('create usuario') },
    departamentoPermissao: { deleteMany: async () => gravacoes.push('delete departamento'), createMany: async () => gravacoes.push('create departamento') },
  };
  return { service: new AcessosService({ $transaction: fn => fn(tx) }), gestores, gravacoes };
}
test('gestor não amplia suas permissões individuais nem altera o próprio departamento', async () => {
  const a = ambiente(), user = a.gestores[0];
  await assert.rejects(a.service.definirUsuario(user, user.id, ['acessos.gerenciar', 'financeiro.gerenciar']), proibido);
  await assert.rejects(a.service.definirDepartamento(user, user.departamentoId, ['acessos.gerenciar', 'financeiro.gerenciar']), proibido);
  // Mesmo sem ampliação, não pode alterar unilateralmente o próprio setor.
  await assert.rejects(a.service.definirDepartamento(user, user.departamentoId, ['acessos.gerenciar']), proibido);
  assert.deepEqual(a.gravacoes, []);
});
test('departamento e direitos do gestor são relidos: contexto antigo não autoriza autoalteração', async () => {
  const a = ambiente(), atual = a.gestores[1];
  await assert.rejects(a.service.definirDepartamento({ ...atual, departamentoId: 'setor-antigo' }, atual.departamentoId, ['acessos.gerenciar']), proibido);
  atual.ativo = false;
  await assert.rejects(a.service.definirUsuario(atual, 'limitado', ['acessos.gerenciar']), proibido);
  assert.deepEqual(a.gravacoes, []);
});
test('gestor não concede a terceiros ou a outro setor uma permissão que não possui', async () => {
  const a = ambiente(), user = a.gestores[0];
  await assert.rejects(a.service.definirUsuario(user, 'aprovador', ['financeiro.gerenciar']), proibido);
  await assert.rejects(a.service.definirDepartamento(user, 'outro-setor', ['financeiro.gerenciar']), proibido);
  // Nem uma conta nova pode servir para contornar o teto de delegação.
  await assert.rejects(a.service.criarUsuario(user, { pessoaId: 'nova-pessoa', departamentoId: 'outro-setor', username: 'atalho', senha: 'senha de teste segura', permissoes: ['acessos.gerenciar', 'financeiro.gerenciar'] }), proibido);
  assert.deepEqual(a.gravacoes, []);
});
test('permissão individual fora do departamento não pode ser delegada', async () => {
  const a = ambiente(), user = a.gestores[0];
  user.permissoes = concessoes(['acessos.gerenciar', 'financeiro.gerenciar']);
  user.departamento.permissoes = concessoes(['acessos.gerenciar']);
  await assert.rejects(a.service.definirDepartamento(user, 'outro-setor', ['financeiro.gerenciar']), proibido);
  assert.deepEqual(a.gravacoes, []);
});
test('outro gestor, de outro departamento e com a permissão, pode efetuar a concessão', async () => {
  const a = ambiente(), aprovador = a.gestores[1];
  await a.service.definirDepartamento(aprovador, 'setor-limitado', ['acessos.gerenciar', 'financeiro.gerenciar']);
  await a.service.definirUsuario(aprovador, 'limitado', ['acessos.gerenciar', 'financeiro.gerenciar']);
  assert.deepEqual(a.gravacoes, ['delete departamento', 'create departamento', 'delete usuario', 'create usuario']);
});

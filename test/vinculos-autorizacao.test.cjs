require('ts-node/register/transpile-only');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PedidosService } = require('../src/modules/pedidos/pedidos.service.ts');
const { StatusService } = require('../src/modules/pedidos/status.service.ts');
const { ComprasService } = require('../src/modules/compras/compras.service.ts');
const { FinanceiroService } = require('../src/modules/financeiro/services/financeiro.service.ts');
const { AcessosService } = require('../src/modules/auth/acessos.service.ts');

test('IDs externos não permitem consultar ou alterar pedido, item, compra, status, financeiro e acessos', async () => {
  for (const [empresa, outra] of [['empresa-a', 'empresa-b'], ['empresa-b', 'empresa-a']]) {
    const user = { id: 'gestor', idEmpresa: empresa };
    let escritas = 0;
    const externo = { id: 'externo', idEmpresa: outra };
    const repo = {
      findFirst: async ({ where }) => Object.entries(where).every(([k, v]) => externo[k] === v) ? externo : null,
      update: async () => escritas++, updateMany: async () => { escritas++; return { count: 1 }; },
      deleteMany: async () => escritas++, createMany: async () => escritas++,
    };
    const prisma = {
      pedido: repo, compra: repo, statusPedido: repo, statusProduto: repo, transacaoFinanceira: repo, departamento: repo,
      usuario: { ...repo, findFirst: async ({ where }) => where.id === user.id && where.idEmpresa === empresa ? { ...user, ativo: true } : repo.findFirst({ where }) },
      $queryRaw: async () => [],
    };
    prisma.$transaction = fn => fn(prisma);
    const financeiro = new FinanceiroService(prisma), pedidos = new PedidosService(prisma, {}, financeiro);
    const status = new StatusService(prisma), compras = new ComprasService(prisma, {}), acessos = new AcessosService(prisma);
    const operacoes = [
      () => pedidos.buscar(user, 'externo'),
      () => pedidos.alterarStatus(user, 'externo', 'status'),
      () => pedidos.alterarStatusItem(user, 'externo', 'item', 'status'),
      () => compras.buscar(user, 'externo'),
      () => status.atualizarPedido(user, 'externo', { nome: 'invasao' }),
      () => status.atualizarProduto(user, 'externo', { nome: 'invasao' }),
      () => financeiro.darBaixa(user, 'externo'),
      () => financeiro.cancelar(user, 'externo'),
      () => acessos.definirDepartamento(user, 'externo', []),
      () => acessos.definirUsuario(user, 'externo', []),
      () => acessos.atualizarUsuario(user, 'externo', { ativo: false }),
    ];
    for (const operacao of operacoes) await assert.rejects(operacao(), erro => erro.getStatus?.() === 404);
    assert.equal(escritas, 0);
  }
});

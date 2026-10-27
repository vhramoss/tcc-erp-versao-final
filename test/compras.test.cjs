require('ts-node/register/transpile-only');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EstoqueService } = require('../src/modules/estoque/estoque.service.ts');
const { ComprasService } = require('../src/modules/compras/compras.service.ts');
const { FinanceiroService } = require('../src/modules/financeiro/services/financeiro.service.ts');
const user = { id: 1, idEmpresa: 1 };
const fornecedorCnpj = '98765432000198';

// Repositório em memória com snapshot por transação. Exercita os serviços reais;
// não substitui teste de locks e constraints em PostgreSQL.
function ambiente() {
  let estado = { compras: [], itensCompra: [], saldos: {}, movimentos: [], financeiros: [] };
  const config = { falharFinanceiro: false, fornecedorOutraEmpresa: false };
  const produtos = [2, 10].map((id) => ({ id, idEmpresa: user.idEmpresa, nome: id, estoqueMinimo: '0', alertaEstoqueAtivo: true, unidadeMedida: { sigla: 'UN' } }));
  const unico = (lista, data, campo = 'referencia') => {
    if (lista.some((i) => i.idEmpresa === data.idEmpresa && i[campo] === data[campo])) throw new Error('Duplicado');
    const item = { ...data, id: lista.length + 1 }; lista.push(item); return item;
  };
  const repositorio = () => ({
    usuario: { findFirst: async ({ where }) => where.id === user.id && where.idEmpresa === user.idEmpresa ? user : null },
    fornecedor: { findFirst: async ({ where }) => !config.fornecedorOutraEmpresa && where.idEmpresa === user.idEmpresa ? { id: 1, pessoa: { cpfCnpj: fornecedorCnpj } } : null },
    almoxarifado: { findFirst: async ({ where }) => where.idEmpresa === user.idEmpresa ? { id: 1, nome: 'Depósito' } : null },
    produto: {
      findFirst: async ({ where }) => produtos.find((p) => p.id === where.id && p.idEmpresa === where.idEmpresa),
      findMany: async ({ where }) => produtos.filter((p) => p.idEmpresa === where.idEmpresa && where.id.in.includes(p.id)),
    },
    compra: { create: async ({ data }) => unico(estado.compras, data) },
    itemCompra: { createMany: async ({ data }) => { estado.itensCompra.push(...data); return { count: data.length }; } },
    estoque: {
      upsert: async ({ create }) => estado.saldos[create.produtoId] ??= { ...create, id: create.produtoId, quantidade: '0' },
      findUnique: async ({ where }) => estado.saldos[where.id],
      findUniqueOrThrow: async ({ where }) => estado.saldos[where.id],
      update: async ({ where, data }) => Object.assign(estado.saldos[where.id], data),
      aggregate: async ({ where }) => ({ _sum: { quantidade: estado.saldos[where.produtoId]?.quantidade ?? '0' } }),
    },
    estoqueMovimento: {
      create: async ({ data }) => { estado.movimentos.push(data); return data; },
      findFirst: async ({ where }) => estado.movimentos.find((m) => m.estoqueId === where.estoqueId),
    },
    transacaoFinanceira: { create: async ({ data }) => {
      if (config.falharFinanceiro) throw new Error('Falha financeira simulada');
      estado.financeiros.push(data); return data;
    } },
    $queryRaw: async () => [],
  });
  const prisma = { ...repositorio(), $transaction: async (callback) => {
    const antes = structuredClone(estado);
    try { return await callback(repositorio()); } catch (erro) { estado = antes; throw erro; }
  } };
  const estoque = new EstoqueService(prisma);
  return { compras: new ComprasService(prisma, estoque), estado: () => estado, config };
}
const compra = (overrides = {}) => ({ referencia: 'C-1', fornecedorId: 1, almoxarifadoId: 1, dataVencimento: '2026-10-30', itens: [{ produtoId: 2, quantidade: 2, valorUnitario: 10.25 }], ...overrides });


test('compra recebida registra itens, aumenta estoque e gera conta a pagar exata', async () => {
  const a = ambiente();
  const resposta = await a.compras.criar(user, compra({ acrescimos: 2, desconto: 0.50 }));
  assert.equal(resposta.valorTotal, '22.00');
  assert.equal(a.estado().saldos[2].quantidade, '2.000');
  assert.equal(a.estado().movimentos[0].compraId, resposta.id);
  assert.equal(a.estado().itensCompra[0].idEmpresa, user.idEmpresa);
  assert.equal(a.estado().financeiros[0].valor, '22.00');
  assert.equal(a.estado().financeiros[0].tipo, 'DESPESA');
  assert.equal(a.estado().financeiros[0].status, 'PENDENTE');
});
test('falha financeira desfaz compra, itens e movimentações', async () => {
  const a = ambiente(); a.config.falharFinanceiro = true;
  await assert.rejects(a.compras.criar(user, compra()), /Falha financeira/);
  assert.equal(a.estado().compras.length, 0);
  assert.equal(a.estado().itensCompra.length, 0);
  assert.equal(a.estado().movimentos.length, 0);
  assert.deepEqual(a.estado().saldos, {});
});
test('fornecedor e produto de outra empresa não geram compra nem estoque', async () => {
  const a = ambiente(); a.config.fornecedorOutraEmpresa = true;
  await assert.rejects(a.compras.criar(user, compra()), (e) => e.getStatus() === 400);
  a.config.fornecedorOutraEmpresa = false;
  await assert.rejects(a.compras.criar(user, compra({ itens: [{ produtoId: 999, quantidade: 1, valorUnitario: 10 }] })), (e) => e.getStatus() === 400);
  assert.equal(a.estado().compras.length, 0);
});
test('referência repetida não duplica estoque ou financeiro', async () => {
  const a = ambiente(); await a.compras.criar(user, compra());
  await assert.rejects(a.compras.criar(user, compra()), /Duplicado/);
  assert.equal(a.estado().saldos[2].quantidade, '2.000');
  assert.equal(a.estado().financeiros.length, 1);
});
test('datas inválidas e total negativo são rejeitados', async () => {
  const a = ambiente();
  for (const dto of [compra({ dataVencimento: '2026-02-30' }), compra({ desconto: 100 })]) {
    await assert.rejects(a.compras.criar(user, dto), (e) => e.getStatus() === 400);
  }
});
test('conta a pagar da compra não pode ser cancelada isoladamente', async () => {
  const financeiro = new FinanceiroService({ transacaoFinanceira: { findFirst: async () => ({ compraId: 'compra', status: 'PENDENTE' }) } });
  await assert.rejects(financeiro.cancelar(user, 'financeiro'), (e) => e.getStatus() === 400);
});

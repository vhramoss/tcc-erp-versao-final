require('ts-node/register/transpile-only');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EstoqueService } = require('../src/modules/estoque/estoque.service.ts');
const { PedidosService } = require('../src/modules/pedidos/pedidos.service.ts');
const { FinanceiroService } = require('../src/modules/financeiro/services/financeiro.service.ts');
const user = { id: 1, idEmpresa: 1 };

// Repositório em memória com snapshot por transação. Exercita os serviços reais;
// não substitui teste de locks e constraints em PostgreSQL.
function ambiente() {
  let sequenciaPedido = 0;
  let estado = { pedidosDados: [], itensPedido: [], saldos: Object.fromEntries([2, 10].map(id => [id, { id, produtoId: id, quantidade: '5.000' }])), movimentos: [], financeiros: [] };
  const config = { falharFinanceiro: false, conflitoFinanceiro: false };
  const produtos = [2, 10].map((id) => ({ id, idEmpresa: user.idEmpresa, nome: id, precoCusto: '4.00', precos: [{ precoVenda: '10.25' }], estoqueMinimo: '0', alertaEstoqueAtivo: true, unidadeMedida: { sigla: 'UN' } }));
  const unico = (lista, data, campo = 'referencia') => {
    if (lista.some((i) => i.idEmpresa === data.idEmpresa && i[campo] === data[campo])) throw new Error('Duplicado');
    const item = { ...data, id: data.id ?? lista.length + 1 }; lista.push(item); return item;
  };
  const statuses = [
    { id: 1, ehInicial: true }, { id: 2 },
    { id: 3, ehFinal: true }, { id: 4, ehFinal: true, ehCancelamento: true },
  ].map(s => ({ ...s, idEmpresa: user.idEmpresa, ativo: true }));
  const match = (row, where) => row && Object.entries(where).every(([key, value]) => row[key] === value);
  const hydrate = row => row && ({ ...row, status: statuses.find(s => s.id === row.statusId), itens: estado.itensPedido.filter(i => i.pedidoId === row.id), financeiro: estado.financeiros.find(f => f.pedidoId === row.id) });
  const repositorio = () => ({
    cliente: { findFirst: async ({ where }) => where.id === 1 && where.idEmpresa === user.idEmpresa ? { id: 1 } : null },
    statusPedido: { findMany: async ({ where }) => statuses.filter(s => match(s, where)), findFirst: async ({ where }) => statuses.find(s => match(s, where)) },
    statusProduto: { findMany: async () => [{ id: 1 }], findFirst: async ({ where }) => where.id === 1 ? { id: 1 } : null },
    formaPagamento: { findFirst: async () => null },
    planoContas: { findFirst: async () => null },
    centroCusto: { findFirst: async () => null },
    pedido: {
      create: async ({ data }) => unico(estado.pedidosDados, data),
      findFirst: async ({ where }) => hydrate(estado.pedidosDados.find(p => match(p, where))),
      findFirstOrThrow: async ({ where }) => hydrate(estado.pedidosDados.find(p => match(p, where))),
      update: async ({ where, data }) => hydrate(Object.assign(estado.pedidosDados.find(p => match(p, where)), data)),
    },
    itemPedido: {
      createMany: async ({ data }) => { estado.itensPedido.push(...data.map((i, n) => ({ ...i, id: n + 1 }))); },
      update: async ({ where, data }) => Object.assign(estado.itensPedido.find(i => match(i, where)), data),
    },
    usuario: { findFirst: async ({ where }) => where.id === user.id && where.idEmpresa === user.idEmpresa ? user : null },
    almoxarifado: { findFirst: async ({ where }) => where.idEmpresa === user.idEmpresa ? { id: 1, nome: 'Depósito' } : null },
    produto: {
      findFirst: async ({ where }) => produtos.find((p) => p.id === where.id && p.idEmpresa === where.idEmpresa),
      findMany: async ({ where }) => produtos.filter((p) => p.idEmpresa === where.idEmpresa && where.id.in.includes(p.id)),
    },
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
    transacaoFinanceira: {
      findFirst: async ({ where }) => estado.financeiros.find(f => match(f, where)),
      updateMany: async ({ where, data }) => {
        const rows = config.conflitoFinanceiro ? [] : estado.financeiros.filter(f => match(f, where));
        rows.forEach(f => Object.assign(f, data)); return { count: rows.length };
      },
      create: async ({ data }) => {
      if (config.falharFinanceiro) throw new Error('Falha financeira simulada');
      const row = { ...data, id: 1 }; estado.financeiros.push(row); return row;
    } },
    $queryRaw: async (sql) => sql.join('').includes('nextval') ? [{ id: ++sequenciaPedido }] : [],
  });
  const prisma = { ...repositorio(), $transaction: async (callback) => {
    const antes = structuredClone(estado);
    try { return await callback(repositorio()); } catch (erro) { estado = antes; throw erro; }
  } };
  const estoque = new EstoqueService(prisma);
  return { pedidos: new PedidosService(prisma, estoque, new FinanceiroService(prisma)), estado: () => estado, config, produtos };
}
const pedido = (overrides = {}) => ({ referencia: 'P-1', clienteId: 1, almoxarifadoId: 1, dataVencimento: '2026-10-30', itens: [{ produtoId: 2, quantidade: 5, valorUnitario: 10.25 }], ...overrides });

test('pedido integra itens, baixa, alerta e receita pendente com valor decimal exato', async () => {
  const a = ambiente(); const resultado = await a.pedidos.criar(user, pedido());
  assert.equal(resultado.valorTotal, '51.25');
  assert.equal(resultado.statusId, 1);
  assert.equal(resultado.alertas.length, 1);
  assert.equal(a.estado().saldos[2].quantidade, '0.000');
  assert.equal(a.estado().movimentos[0].pedidoId, resultado.id);
  assert.equal(a.estado().itensPedido[0].idEmpresa, user.idEmpresa);
  assert.equal(a.estado().financeiros[0].valor, '51.25');
  assert.equal(a.estado().financeiros[0].tipo, 'RECEITA');
  assert.equal(a.estado().financeiros[0].status, 'PENDENTE');
});
test('falta de estoque no segundo produto desfaz o pedido inteiro', async () => {
  const a = ambiente(); const antes = structuredClone(a.estado());
  await assert.rejects(a.pedidos.criar(user, pedido({ itens: [
    { produtoId: 2, quantidade: 2, valorUnitario: 10.25 },
    { produtoId: 10, quantidade: 6, valorUnitario: 10.25 },
  ] })), e => e.getStatus() === 400);
  assert.deepEqual(a.estado(), antes);
});
test('falha financeira desfaz pedido, itens, movimentos e saldos', async () => {
  const a = ambiente(); const antes = structuredClone(a.estado()); a.config.falharFinanceiro = true;
  await assert.rejects(a.pedidos.criar(user, pedido()), /Falha financeira/);
  assert.deepEqual(a.estado(), antes);
});
test('referencia repetida nao duplica baixa nem receita', async () => {
  const a = ambiente(); await a.pedidos.criar(user, pedido()); const antes = structuredClone(a.estado());
  await assert.rejects(a.pedidos.criar(user, pedido()), /Duplicado/);
  assert.deepEqual(a.estado(), antes);
});
test('vinculos externos, status final e dados invalidos nao deixam efeitos', async () => {
  const a = ambiente(); const antes = structuredClone(a.estado());
  const casos = [ { clienteId: 999 }, { statusId: 999 }, { statusId: 3 },
    { formaPagamentoId: 999 }, { planoContasId: 999 }, { centroCustoId: 999 },
    { dataVencimento: '2026-02-30' },
    { itens: [{ produtoId: 999, quantidade: 1, valorUnitario: 10.25 }] },
    { itens: [{ produtoId: 2, quantidade: 0, valorUnitario: 10.25 }] },
    { itens: [pedido().itens[0], pedido().itens[0]] },
  ];
  for (const caso of casos) {
    await assert.rejects(a.pedidos.criar(user, pedido(caso)), e => e.getStatus() === 400);
    assert.deepEqual(a.estado(), antes);
  }
});
test('status comum nao movimenta; cancelamento devolve estoque e cancela receita uma vez', async () => {
  const a = ambiente(); const p = await a.pedidos.criar(user, pedido());
  await a.pedidos.alterarStatus(user, p.id, 2);
  assert.equal(a.estado().movimentos.length, 1);
  await a.pedidos.alterarStatus(user, p.id, 4);
  await a.pedidos.alterarStatus(user, p.id, 4);
  assert.equal(a.estado().saldos[2].quantidade, '5.000');
  assert.equal(a.estado().financeiros[0].status, 'CANCELADO');
  assert.equal(a.estado().movimentos.length, 2);
  await assert.rejects(a.pedidos.alterarStatus(user, p.id, 1), e => e.getStatus() === 400);
});
test('recebimento pago ou conflito na baixa impede cancelamento e reposicao', async () => {
  for (const pago of [true, false]) {
    const a = ambiente(); const p = await a.pedidos.criar(user, pedido());
    if (pago) a.estado().financeiros[0].status = 'PAGO'; else a.config.conflitoFinanceiro = true;
    const antes = structuredClone(a.estado());
    await assert.rejects(a.pedidos.alterarStatus(user, p.id, 4), e => e.getStatus() === 400);
    assert.deepEqual(a.estado(), antes);
  }
});
test('status do item respeita pedido e empresa sem alterar estoque', async () => {
  const a = ambiente(); const p = await a.pedidos.criar(user, pedido());
  await a.pedidos.alterarStatusItem(user, p.id, 1, 1);
  await assert.rejects(a.pedidos.alterarStatusItem(user, p.id, 999, 1), e => e.getStatus() === 404);
  await assert.rejects(a.pedidos.buscar({ ...user, idEmpresa: 999 }, p.id), e => e.getStatus() === 404);
  assert.equal(a.estado().movimentos.length, 1);
});


test('preço adulterado é rejeitado e omissão usa preço cadastrado', async () => {
  const a = ambiente(); const antes = structuredClone(a.estado());
  await assert.rejects(a.pedidos.criar(user, pedido({ itens: [{ produtoId: 2, quantidade: 1, valorUnitario: 0.01 }] })), /preço informado/);
  assert.deepEqual(a.estado(), antes);
  const p = await a.pedidos.criar(user, pedido({ itens: [{ produtoId: 2, quantidade: 1 }] }));
  assert.equal(p.valorTotal, '10.25');
  assert.equal(p.itens[0].custoUnitario, '4.00');
  a.produtos[0].precoCusto = '8.00';
  assert.equal((await a.pedidos.buscar(user, p.id)).itens[0].custoUnitario, '4.00');
});
test('preço ausente ou abaixo do custo bloqueia a venda sem efeitos', async () => {
  for (const precos of [[], [{ precoVenda: '3.00' }]]) {
    const a = ambiente(); a.produtos[0].precos = precos; const antes = structuredClone(a.estado());
    await assert.rejects(a.pedidos.criar(user, pedido({ itens: [{ produtoId: 2, quantidade: 1 }] })), e => e.getStatus() === 400);
    assert.deepEqual(a.estado(), antes);
  }
});
test('preço igual ao custo é permitido e referência pode ser automática', async () => {
  const a = ambiente(); a.produtos[0].precoCusto = '10.25';
  const p = await a.pedidos.criar(user, pedido({ referencia: undefined }));
  assert.equal(p.referencia, `PED-${String(p.id).padStart(6, '0')}`);
  assert.equal(typeof p.id, 'number');
  assert.equal(p.itens[0].custoUnitario, p.itens[0].valorUnitario);
});
test('status inicial não pode ser desativado; reativação continua disponível', async () => {
  const { StatusService } = require('../src/modules/pedidos/status.service.ts');
  const status = { id: 1, idEmpresa: user.idEmpresa, ehInicial: true, ativo: false };
  const tx = { $queryRaw: async () => [], statusPedido: {
    findFirst: async () => status,
    update: async ({ data }) => Object.assign(status, data),
  } };
  const service = new StatusService({ $transaction: async fn => fn(tx) });
  await assert.rejects(service.atualizarPedido(user, 1, { ativo: false }), /outro status inicial/);
  assert.equal((await service.atualizarPedido(user, 1, { ativo: true })).ativo, true);
});

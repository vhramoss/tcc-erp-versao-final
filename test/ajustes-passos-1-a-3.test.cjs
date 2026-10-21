if (!process.env.TCC_TEST_BUILD) require('ts-node/register/transpile-only');
require('reflect-metadata');
const path = require('node:path');
const source = (file) => process.env.TCC_TEST_BUILD
  ? path.join(process.env.TCC_TEST_BUILD, `${file}.js`)
  : path.join(__dirname, '../src', `${file}.ts`);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Decimal = require('decimal.js');

// Estes testes exercitam as regras sem abrir conexão com o PostgreSQL.
const prismaPath = require.resolve(source('prisma/prisma.service'));
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: { PrismaService: class {} } };
const { inicioDoDia, meioDoDia, fimDoDia } = require(source('common/utils/datas'));
const { estaNoMinimoOuAbaixo } = require(source('modules/estoque/estoque-regras'));
const { EstoqueService } = require(source('modules/estoque/estoque.service'));
const { EstoqueAlertService } = require(source('modules/estoque/estoque-alert.service'));
const { FinanceiroService } = require(source('modules/financeiro/services/financeiro.service'));
const user = { id: 'usuario-a', idEmpresa: 'empresa-a' };

test('datas impossíveis são rejeitadas, incluindo fevereiro em ano não bissexto', () => {
  for (const converter of [inicioDoDia, meioDoDia, fimDoDia]) {
    for (const data of ['2026-02-30', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', '19/10/2026', '']) {
      assert.ok(Number.isNaN(converter(data).getTime()), data);
    }
    assert.ok(!Number.isNaN(converter('2024-02-29').getTime()));
  }
  assert.equal(inicioDoDia('2026-10-19').toISOString(), '2026-10-19T03:00:00.000Z');
  assert.equal(fimDoDia('2026-10-19').toISOString(), '2026-10-20T02:59:59.999Z');
});

test('alerta inclui igualdade e mínimo zero, respeitando a desativação explícita', () => {
  for (const [saldo, minimo, ativo, esperado] of [
    [0, 0, true, true], [5, 5, true, true], [4, 5, true, true],
    [6, 5, true, false], [0, 0, false, false], [0, 5, false, false],
  ]) assert.equal(estaNoMinimoOuAbaixo(new Decimal(saldo), new Decimal(minimo), ativo), esperado);
});

test('consulta de alertas filtra monitoramento e inclui produto sem saldo com mínimo zero', async () => {
  const service = new EstoqueAlertService({ produto: { findMany: async ({ where }) => {
    assert.deepEqual(where, { idEmpresa: user.idEmpresa, alertaEstoqueAtivo: true });
    return [{ id: 'produto', estoqueMinimo: new Decimal(0), alertaEstoqueAtivo: true, estoques: [] }];
  } } });
  const alertas = await service.getProdutosAbaixoDoMinimo(user);
  assert.equal(alertas.length, 1);
  assert.equal(alertas[0].saldoAtual, 0);
});

test('usuário de outra empresa é rejeitado antes de qualquer alteração de estoque', async () => {
  const tx = {
    usuario: { findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: user.id, idEmpresa: user.idEmpresa });
      return null;
    } },
    produto: { findFirst: async () => ({ id: 'produto' }) },
    almoxarifado: { findFirst: async () => ({ id: 'deposito' }) },
    estoque: { upsert: async () => assert.fail('Não deve gravar estoque') },
  };
  await assert.rejects(new EstoqueService({}).aplicarMovimentacao(tx,
    { idEmpresa: user.idEmpresa, usuarioId: user.id },
    { produtoId: 'produto', almoxarifadoId: 'deposito', quantidade: 1, tipo: 'ENTRADA', observacao: 'Compra' }),
    (erro) => erro.getStatus() === 400);
});

function financeiro() {
  const gravacoes = [];
  const prisma = { transacaoFinanceira: {
    create: async ({ data }) => { gravacoes.push(data); return data; },
    findFirst: async () => ({ id: 'transacao', status: 'PENDENTE' }),
    updateMany: async ({ where, data }) => {
      assert.equal(where.idEmpresa, user.idEmpresa);
      gravacoes.push(data); return { count: 1 };
    },
  } };
  return { service: new FinanceiroService(prisma), gravacoes };
}
const transacao = { descricao: 'Venda', valor: 100, tipo: 'RECEITA', dataVencimento: '2026-10-01' };

test('criação paga e baixa preservam a data efetiva informada', async () => {
  const { service, gravacoes } = financeiro();
  await service.criarTransacao(user, { ...transacao, status: 'PAGO', dataPagamento: '2026-09-30' });
  await service.darBaixa(user, 'transacao', '2026-09-30');
  for (const data of gravacoes) assert.equal(data.dataPagamento.toISOString(), '2026-09-30T15:00:00.000Z');
});

test('sem data informada, pagamento continua usando o instante atual', async () => {
  const { service, gravacoes } = financeiro();
  const antes = Date.now();
  await service.criarTransacao(user, { ...transacao, status: 'PAGO' });
  await service.darBaixa(user, 'transacao');
  for (const data of gravacoes) assert.ok(data.dataPagamento.getTime() >= antes && data.dataPagamento.getTime() <= Date.now());
});

test('pendente não aceita data de pagamento e datas inválidas não chegam à gravação', async () => {
  const { service, gravacoes } = financeiro();
  for (const dto of [
    { ...transacao, dataPagamento: '2026-10-01' },
    { ...transacao, dataVencimento: '2026-02-30' },
    { ...transacao, status: 'PAGO', dataPagamento: '2026-02-30' },
  ]) await assert.rejects(service.criarTransacao(user, dto), (erro) => erro.getStatus() === 400);
  await assert.rejects(service.darBaixa(user, 'transacao', '2026-02-30'), (erro) => erro.getStatus() === 400);
  await assert.rejects(service.getFluxoCaixa(user, '2026-02-30', '2026-03-31'), (erro) => erro.getStatus() === 400);
  await assert.rejects(service.listar(user, { dataInicio: '2026-02-30' }), (erro) => erro.getStatus() === 400);
  assert.equal(gravacoes.length, 0);
});

test('fluxo realizado filtra a data de pagamento e mantém o saldo por período', async () => {
  const tx = { transacaoFinanceira: { groupBy: async ({ where }) => {
    assert.equal(where.idEmpresa, user.idEmpresa);
    if (where.status === 'PAGO') {
      assert.equal(where.dataPagamento.gte.toISOString(), '2026-09-01T03:00:00.000Z');
      assert.equal(where.dataPagamento.lte.toISOString(), '2026-10-01T02:59:59.999Z');
      return [{ tipo: 'RECEITA', _sum: { valor: '100.00' } }, { tipo: 'DESPESA', _sum: { valor: '30.00' } }];
    }
    return [];
  } } };
  const service = new FinanceiroService({ $transaction: async (callback) => callback(tx) });
  const resumo = await service.getFluxoCaixa(user, '2026-09-01', '2026-09-30');
  assert.equal(resumo.realizado.saldoLiquido, 70);
});

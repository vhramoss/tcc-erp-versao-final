require('ts-node/register/transpile-only');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FinanceiroService } = require('../src/modules/financeiro/services/financeiro.service.ts');
const { EstoqueService } = require('../src/modules/estoque/estoque.service.ts');

const user = { id: 'usuario', idEmpresa: 'empresa' };

test('baixa entre as consultas não duplica receita no fluxo de caixa', async () => {
  let statusAtual = 'PENDENTE';
  let consultas = 0;
  const prisma = {
    transacaoFinanceira: { groupBy: async () => assert.fail('Consulta fora da transação') },
    $transaction: async (callback, options) => {
      const snapshot = statusAtual;
      const tx = { transacaoFinanceira: { groupBy: async ({ where }) => {
        assert.equal(where.idEmpresa, user.idEmpresa);
        const statusVisivel = options?.isolationLevel === 'RepeatableRead' ? snapshot : statusAtual;
        // Simula o commit de outra conexão após a leitura dos pendentes.
        if (++consultas === 1) statusAtual = 'PAGO';
        return where.status === statusVisivel && !where.dataVencimento?.lt
          ? [{ tipo: 'RECEITA', _sum: { valor: '100.00' } }] : [];
      } } };
      return callback(tx);
    },
  };
  const resumo = await new FinanceiroService(prisma).getFluxoCaixa(user, '2026-10-01', '2026-10-31');
  assert.equal(statusAtual, 'PAGO');
  assert.equal(consultas, 3);
  assert.equal(resumo.previsto.totalReceitas, 100);
  assert.equal(resumo.realizado.totalReceitas, 0);
  assert.equal(resumo.saldoProjetado, 100);
});

function sinal() {
  let resolver;
  const promise = new Promise((resolve) => { resolver = resolve; });
  return { promise, resolver };
}

// Simula commits, visibilidade ReadCommitted e espera pelo lock do produto.
// Não substitui os testes de integração dos locks no PostgreSQL.
function estoqueConcorrente() {
  const saldos = { A: 5, B: 5 };
  const segundaIniciada = sinal();
  let fila = Promise.resolve();
  let numero = 0;
  const prisma = { $transaction: async (callback, options) => {
    assert.equal(options?.isolationLevel, 'ReadCommitted');
    const ordem = ++numero;
    let deposito, local, liberar;
    const tx = {
      usuario: { findFirst: async () => ({ id: user.id }) },
      produto: { findFirst: async () => ({ id: 'produto', nome: 'Produto', estoqueMinimo: '5', alertaEstoqueAtivo: true }) },
      almoxarifado: { findFirst: async ({ where }) => ({ id: where.id, nome: where.id }) },
      $queryRaw: async (partes, ...parametros) => {
        const sql = partes.join('?');
        if (sql.includes('FROM "Produto"') && sql.includes('FOR NO KEY UPDATE')) {
          assert.deepEqual(parametros, ['produto', user.idEmpresa]);
          if (ordem === 2) segundaIniciada.resolver();
          const anterior = fila;
          const atual = sinal(); fila = atual.promise;
          await anterior;
          liberar = atual.resolver;
        }
        return [];
      },
      estoque: {
        upsert: async ({ create }) => { deposito = create.almoxarifadoId; local = saldos[deposito]; return { id: deposito }; },
        findUnique: async () => ({ id: deposito, quantidade: String(local) }),
        update: async ({ data }) => { local = Number(data.quantidade); },
        aggregate: async () => {
          if (ordem === 2) segundaIniciada.resolver();
          await segundaIniciada.promise;
          return { _sum: { quantidade: local + saldos[deposito === 'A' ? 'B' : 'A'] } };
        },
      },
      estoqueMovimento: { create: async () => ({}) },
    };
    try {
      const resultado = await callback(tx);
      saldos[deposito] = local; // Commit antes de liberar o produto.
      return resultado;
    } finally { liberar?.(); }
  } };
  return { service: new EstoqueService(prisma), saldos };
}

test('saídas simultâneas em depósitos diferentes disparam alerta pelo saldo consolidado', { timeout: 5000 }, async () => {
  const { service, saldos } = estoqueConcorrente();
  const respostas = await Promise.all(['A', 'B'].map((almoxarifadoId) => service.registrarMovimentacao(user, {
    produtoId: 'produto', almoxarifadoId, tipo: 'SAIDA', quantidade: 3, observacao: 'Saída manual',
  })));
  assert.deepEqual(saldos, { A: 2, B: 2 });
  assert.equal(respostas[0].alerta, undefined);
  assert.equal(respostas[1].alerta?.alerta, true);
  assert.equal(respostas[1].alerta?.qtdAtual, 4);
});

test('saídas simultâneas também alertam ao atingir exatamente o mínimo', { timeout: 5000 }, async () => {
  const { service, saldos } = estoqueConcorrente();
  const respostas = await Promise.all(['A', 'B'].map((almoxarifadoId, i) => service.registrarMovimentacao(user, {
    produtoId: 'produto', almoxarifadoId, tipo: 'SAIDA', quantidade: i === 0 ? 3 : 2, observacao: 'Saída manual',
  })));
  assert.equal(saldos.A + saldos.B, 5);
  assert.equal(respostas[1].alerta?.qtdAtual, 5);
});

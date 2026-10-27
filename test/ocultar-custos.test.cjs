require('ts-node/register/transpile-only');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Decimal = require('decimal.js');
const { of, firstValueFrom } = require('rxjs');
const { OcultarCustosInterceptor, removerCustos } = require('../src/common/interceptors/ocultar-custos.interceptor.ts');

const dados = () => ({
  id: 'p1', precoCusto: new Decimal('40.00'), precos: [{ precoVenda: '100.00' }],
  itens: [{ produtoId: 'a', valorUnitario: '100.00', custoUnitario: '40.00', criado: new Date('2026-01-01T00:00:00Z') }],
});
const executar = (permissoes, resposta) => {
  const ctx = { switchToHttp: () => ({ getRequest: () => ({ user: permissoes ? { permissoes } : undefined }) }) };
  return firstValueFrom(new OcultarCustosInterceptor().intercept(ctx, { handle: () => of(resposta) }));
};

test('sem financeiro.ler: custos somem em qualquer nível, preço de venda e datas permanecem', async () => {
  const saida = await executar(['pedidos.ler', 'produtos.ler'], dados());
  assert.equal('precoCusto' in saida, false);
  assert.equal('custoUnitario' in saida.itens[0], false);
  assert.equal(saida.itens[0].valorUnitario, '100.00');
  assert.equal(saida.precos[0].precoVenda, '100.00');
  assert.ok(saida.itens[0].criado instanceof Date);
});

test('com financeiro.ler: a resposta passa intacta (mesma referência)', async () => {
  const original = dados();
  assert.equal(await executar(['financeiro.ler'], original), original);
});

test('sem identidade (rotas públicas) também não vaza custo e não quebra', async () => {
  assert.deepEqual(await executar(undefined, { accessToken: 'x' }), { accessToken: 'x' });
  assert.equal('precoCusto' in await executar(undefined, { precoCusto: 1 }), false);
});

test('Decimal e Date não são destruídos pela limpeza', () => {
  const d = new Decimal('1.50');
  assert.equal(removerCustos({ valor: d }).valor, d);
  assert.deepEqual(removerCustos([1, 'a', null]), [1, 'a', null]);
});

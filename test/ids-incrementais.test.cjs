require('ts-node/register/transpile-only');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ValidationPipe } = require('@nestjs/common');
const { IdBancoPipe } = require('../src/common/decorators/id-banco.decorator.ts');
const { CreatePedidoDto, FiltroPedidosDto } = require('../src/modules/pedidos/pedidos.dto.ts');
const { LoginDto } = require('../src/modules/auth/auth.dto.ts');
const validacao = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const validar = (metatype, value, type = 'body') => validacao.transform(value, { metatype, type });
test('IDs de rota rejeitam UUID, fração, sinal, zero, booleano e overflow', () => {
  const pipe = new IdBancoPipe();
  for (const v of [1, 2147483647, '1', '2147483647']) assert.equal(pipe.transform(v), Number(v));
  for (const v of [0, -1, 1.5, 2147483648, true, false, null, '', ' ', '01', '1e2', '+1', '1.0', '1abc', '550e8400-e29b-41d4-a716-446655440000']) assert.throws(() => pipe.transform(v), e => e.getStatus() === 400);
});
test('IDs numéricos são validados em corpo, filtros e itens aninhados', async () => {
  const base = { clienteId: 1, almoxarifadoId: 2, dataVencimento: '2026-12-01', itens: [{ produtoId: 3, quantidade: 1 }] };
  assert.equal((await validar(CreatePedidoDto, base)).itens[0].produtoId, 3);
  const filtro = await validar(FiltroPedidosDto, { clienteId: '1', statusId: '2' }, 'query');
  assert.equal(filtro.clienteId, 1); assert.equal(filtro.statusId, 2);
  for (const produtoId of [0, -1, 1.5, true, '', 'abc', 2147483648]) await assert.rejects(validar(CreatePedidoDto, { ...base, itens: [{ produtoId, quantidade: 1 }] }), e => e.getStatus() === 400);
  await assert.rejects(validar(CreatePedidoDto, { ...base, id: 123 }), e => e.getStatus() === 400);
});
test('login mantém CNPJ textual e aceita ID numérico da empresa', async () => {
  const login = { username: 'dev', senha: 'senha' };
  assert.equal((await validar(LoginDto, { ...login, cnpj: '00000000000191' })).cnpj, '00000000000191');
  assert.equal((await validar(LoginDto, { ...login, idEmpresa: 1 })).idEmpresa, 1);
  await assert.rejects(validar(LoginDto, { ...login, idEmpresa: '550e8400-e29b-41d4-a716-446655440000' }), e => e.getStatus() === 400);
});

test('movimentação de estoque aceita IDs numéricos e rejeita IDs inválidos', async () => {
  const { CreateMovimentacaoDto } = require('../src/modules/estoque/dto/movimentacao.dto.ts');
  const base = { produtoId: 1, almoxarifadoId: 2, quantidade: 3, tipo: 'ENTRADA', observacao: 'Teste' };
  const dto = await validar(CreateMovimentacaoDto, base);
  assert.equal(dto.produtoId, 1); assert.equal(dto.almoxarifadoId, 2);
  for (const produtoId of [0, -1, true, 'uuid']) await assert.rejects(validar(CreateMovimentacaoDto, { ...base, produtoId }), e => e.getStatus() === 400);
});

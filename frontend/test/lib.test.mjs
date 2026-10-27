// Testes unitários das funções puras de formatação e tradução (rodam sem servidor).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arredondar, brl, dataBR, fimDoMes, hojeISO, iniciais, inicioDoMes, lerDecimal, mascaraCnpj, mascaraDocumento, normalizar, numero, paraNumero, somarDias } from '../src/lib/format.ts';
import { traduzirMensagem, traduzirMensagens } from '../src/lib/mensagens.ts';

const sp = (v) => v.replace(/\s/g, ' ');

test('moeda e números: valores decimais do backend chegam como texto', () => {
  assert.equal(sp(brl('300.00')), 'R$ 300,00');
  assert.equal(sp(brl(1234.5)), 'R$ 1.234,50');
  assert.equal(sp(brl(null)), 'R$ 0,00');
  assert.equal(numero('1234.567', 3), '1.234,567');
  assert.equal(paraNumero('abc'), 0);
});

test('lerDecimal aceita vírgula brasileira e ponto, rejeita lixo', () => {
  assert.equal(lerDecimal('1.234,56'), 1234.56);
  assert.equal(lerDecimal('10,5'), 10.5);
  assert.equal(lerDecimal('10.5'), 10.5);
  assert.equal(lerDecimal(' 7 '), 7);
  assert.ok(Number.isNaN(lerDecimal('')));
  assert.ok(Number.isNaN(lerDecimal('12abc')));
});

test('arredondar evita o clássico 1.005 e 0.1+0.2', () => {
  assert.equal(arredondar(1.005), 1.01);
  assert.equal(arredondar(0.1 + 0.2), 0.3);
  assert.equal(arredondar(0.333 * 10.01), 3.33);
});

test('datas: "AAAA-MM-DD" não sofre deslocamento de fuso e ISO usa São Paulo', () => {
  assert.equal(dataBR('2026-12-10'), '10/12/2026');
  assert.equal(dataBR('2026-12-10T15:00:00.000Z'), '10/12/2026'); // vencimento guardado às 12h de SP
  assert.equal(dataBR('2026-12-11T02:00:00.000Z'), '10/12/2026'); // 23h de SP ainda é dia 10
  assert.equal(dataBR(null), '—');
});

test('aritmética de dias e limites do mês (inclui virada de ano e bissexto)', () => {
  assert.equal(somarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(somarDias('2026-03-01', -1), '2026-02-28');
  assert.equal(fimDoMes('2028-02-10'), '2028-02-29');
  assert.equal(fimDoMes('2026-12-05'), '2026-12-31');
  assert.equal(inicioDoMes('2026-10-23'), '2026-10-01');
  assert.match(hojeISO(), /^\d{4}-\d{2}-\d{2}$/);
});

test('máscaras de CNPJ e CPF/CNPJ', () => {
  assert.equal(mascaraCnpj('00000000000191'), '00.000.000/0001-91');
  assert.equal(mascaraCnpj('0000'), '00.00');
  assert.equal(mascaraDocumento('12345678901'), '123.456.789-01');
  assert.equal(mascaraDocumento('00000000000191'), '00.000.000/0001-91');
});

test('busca tolerante e iniciais', () => {
  assert.equal(normalizar('Café Ção'), 'cafe cao');
  assert.equal(iniciais('Ana Souza Lima'), 'AS');
  assert.equal(iniciais(undefined), '?');
});

test('mensagens do class-validator viram frases em português com o nome do campo', () => {
  assert.equal(traduzirMensagem('nome should not be empty'), 'Preencha o campo "Nome".');
  assert.equal(traduzirMensagem('email must be an email'), 'Informe um e-mail válido.');
  assert.equal(traduzirMensagem('itens.0.quantidade must not be less than 0.001'), '"Item 1 · Quantidade": o valor mínimo é 0.001.');
  assert.equal(traduzirMensagem('clienteId must be an integer number'), 'Selecione uma opção válida em "Cliente".');
  assert.equal(traduzirMensagem('property foo should not exist'), 'O campo "foo" não é aceito nesta operação.');
  assert.equal(traduzirMensagem('Saldo insuficiente em "Depósito"'), 'Saldo insuficiente em "Depósito"'); // já em português: preservada
  assert.deepEqual(traduzirMensagens(['senha should not be empty', 'x']), ['Preencha o campo "Senha".', 'x']);
  assert.deepEqual(traduzirMensagens(undefined), []);
});

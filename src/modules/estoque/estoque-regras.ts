import Decimal from 'decimal.js';

/**
 * REGRA ÚNICA DE ALERTA DE ESTOQUE MÍNIMO (usada pela movimentação e pelo endpoint de alertas).
 *
 * - O mínimo é configurado por PRODUTO, então o saldo comparado é a SOMA de todos os
 *   almoxarifados ativos.
 * - Mínimo = 0 significa "sem monitoramento" (é o valor padrão do cadastro). Sem essa
 *   exceção, todo produto novo, sem estoque, apareceria como alerta.
 * - Alerta quando o saldo ATINGE ou fica ABAIXO do mínimo (<=), conforme o objetivo (a) do TCC.
 */
export function estaNoMinimoOuAbaixo(saldoTotal: Decimal, estoqueMinimo: Decimal): boolean {
  return estoqueMinimo.gt(0) && saldoTotal.lte(estoqueMinimo);
}

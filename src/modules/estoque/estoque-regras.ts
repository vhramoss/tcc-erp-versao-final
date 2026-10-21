import Decimal from 'decimal.js';

/** O mínimo zero é válido; produtos sem reposição podem desativar o alerta. */
export function estaNoMinimoOuAbaixo(
  saldoTotal: Decimal,
  estoqueMinimo: Decimal,
  alertaEstoqueAtivo: boolean,
): boolean {
  return alertaEstoqueAtivo && saldoTotal.lte(estoqueMinimo);
}

/**
 * Datas de negócio (vencimento, período do fluxo de caixa) trafegam como "AAAA-MM-DD"
 * e são interpretadas no fuso de São Paulo (UTC-3, sem horário de verão desde 2019).
 * Isso evita dois erros clássicos: o dia final ficar de fora do período (meia-noite UTC)
 * e uma data exibir o dia anterior por causa do fuso.
 */
const OFFSET_SP = '-03:00';

export const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

export function inicioDoDia(data: string): Date {
  return new Date(`${data}T00:00:00.000${OFFSET_SP}`);
}

export function fimDoDia(data: string): Date {
  return new Date(`${data}T23:59:59.999${OFFSET_SP}`);
}

/** Meio-dia local: usado para guardar vencimentos, resistente a qualquer fuso de exibição. */
export function meioDoDia(data: string): Date {
  return new Date(`${data}T12:00:00.000${OFFSET_SP}`);
}

/** Data de hoje em São Paulo no formato AAAA-MM-DD. */
export function hojeLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

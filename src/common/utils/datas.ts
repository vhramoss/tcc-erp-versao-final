/**
 * Datas de negócio (vencimento, período do fluxo de caixa) trafegam como "AAAA-MM-DD"
 * e são interpretadas no fuso de São Paulo (UTC-3, sem horário de verão desde 2019).
 * Isso evita dois erros clássicos: o dia final ficar de fora do período (meia-noite UTC)
 * e uma data exibir o dia anterior por causa do fuso.
 */
const OFFSET_SP = '-03:00';

export const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

function converterData(data: string, horario: string): Date {
  if (typeof data !== 'string' || !REGEX_DATA.test(data)) return new Date(NaN);
  const calendario = new Date(`${data}T00:00:00.000Z`);
  if (Number.isNaN(calendario.getTime()) || calendario.toISOString().slice(0, 10) !== data) {
    return new Date(NaN);
  }
  return new Date(`${data}T${horario}${OFFSET_SP}`);
}

export function inicioDoDia(data: string): Date {
  return converterData(data, '00:00:00.000');
}

export function fimDoDia(data: string): Date {
  return converterData(data, '23:59:59.999');
}

/** Meio-dia local: usado para guardar vencimentos, resistente a qualquer fuso de exibição. */
export function meioDoDia(data: string): Date {
  return converterData(data, '12:00:00.000');
}

/** Data de hoje em São Paulo no formato AAAA-MM-DD. */
export function hojeLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

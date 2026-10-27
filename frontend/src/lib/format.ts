// Formatação e conversões. Datas de negócio (vencimento, período) são "AAAA-MM-DD" no fuso de São Paulo.
const TZ = 'America/Sao_Paulo';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const paraNumero = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const brl = (v: unknown) => moeda.format(paraNumero(v));

export const numero = (v: unknown, casas = 0) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas }).format(paraNumero(v));

export const percentual = (v: unknown) => `${numero(v, 1)}%`;

const ehDataSimples = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/** "2026-12-10" ou ISO com hora → "10/12/2026" (no fuso de São Paulo). */
export function dataBR(v?: string | null): string {
  if (!v) return '—';
  if (ehDataSimples(v)) return `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export function dataHoraBR(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

/** Data de hoje em São Paulo, "AAAA-MM-DD". */
export const hojeISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

export const inicioDoMes = (iso: string) => `${iso.slice(0, 8)}01`;

export function fimDoMes(iso: string): string {
  const [a, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

/** Dia curto para eixos de gráfico: "2026-12-10" → "10/12". */
export const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export const soDigitos = (v: string) => v.replace(/\D/g, '');

export function mascaraCnpj(v: string): string {
  const d = soDigitos(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function mascaraDocumento(v: string): string {
  const d = soDigitos(v).slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return mascaraCnpj(d);
}

/** Aceita "1.234,56" ou "1234.56". Devolve NaN se não for número. */
export function lerDecimal(texto: string): number {
  const t = texto.trim();
  if (!t) return NaN;
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  return /^-?\d+(\.\d+)?$/.test(normal) ? Number(normal) : NaN;
}

export const arredondar = (n: number, casas = 2) => Math.round((n + Number.EPSILON) * 10 ** casas) / 10 ** casas;

/** Remove acentos e caixa, para buscas tolerantes ("cafe" encontra "Café"). */
export const normalizar = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const iniciais = (nome?: string) =>
  (nome ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

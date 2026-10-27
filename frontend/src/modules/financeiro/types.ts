import type { Decimal } from '@/lib/tipos';

export type TipoTransacao = 'RECEITA' | 'DESPESA';
export type StatusTransacao = 'PENDENTE' | 'PAGO' | 'CANCELADO';

export interface Transacao {
  id: number;
  descricao: string;
  valor: Decimal;
  tipo: TipoTransacao;
  status: StatusTransacao;
  dataVencimento: string;
  dataPagamento: string | null;
  pedidoId: number | null;
  compraId?: number | null;
  planoContas?: { id: number; codigo: string; nome: string } | null;
  centroCusto?: { id: number; nome: string } | null;
  formaPagamento?: { id: number; nome: string } | null;
  /** Calculado pelo servidor: pendente com vencimento anterior a hoje. */
  atrasado: boolean;
}

export interface TotaisFinanceiros { totalReceitas: number; totalDespesas: number; saldoLiquido: number }

export interface FluxoCaixa {
  periodo: { inicio: string; fim: string };
  previsto: TotaisFinanceiros;
  realizado: TotaisFinanceiros;
  saldoProjetado: number;
  emAtraso: TotaisFinanceiros;
}

export interface PlanoContas { id: number; codigo: string; nome: string; tipo: TipoTransacao }
export interface CentroCusto { id: number; nome: string }
export interface FormaPagamento { id: number; nome: string; ativo: boolean }

export interface NovaTransacao {
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataVencimento: string;
  status?: 'PENDENTE' | 'PAGO';
  planoContasId?: number;
  centroCustoId?: number;
  formaPagamentoId?: number;
}

export interface FiltroTransacoes {
  tipo?: TipoTransacao;
  status?: StatusTransacao;
  dataInicio?: string;
  dataFim?: string;
  page: number;
  limit: number;
}

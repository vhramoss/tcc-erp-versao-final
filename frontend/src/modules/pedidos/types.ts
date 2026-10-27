import type { Decimal, Pessoa } from '@/lib/tipos';

export interface StatusPedido { id: number; nome: string; ordem: number; ehInicial: boolean; ehFinal: boolean; ehCancelamento: boolean; ativo: boolean }
export interface StatusProduto { id: number; nome: string; ordem: number; ativo: boolean }

export interface FinanceiroPedido {
  id: number;
  valor: Decimal;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  dataVencimento: string;
  dataPagamento: string | null;
  descricao: string;
}

export interface ItemPedido {
  id: number;
  produtoId: number;
  produto: { id: number; nome: string; sku: string };
  quantidade: Decimal;
  valorUnitario: Decimal;
  /** Ausente para quem não tem financeiro.ler. */
  custoUnitario?: Decimal;
  valorTotal: Decimal;
  statusId: number | null;
  status: { id: number; nome: string } | null;
}

export interface Pedido {
  id: number;
  referencia: string;
  clienteId: number;
  almoxarifadoId: number;
  formaPagamentoId: number | null;
  statusId: number;
  dataPedido: string;
  valorTotal: Decimal;
  observacao: string | null;
  cliente: { id: number; pessoa: Pessoa };
  status: StatusPedido;
  financeiro: FinanceiroPedido | null;
  itens?: ItemPedido[];
}

export interface AlertaDoPedido { produtoId: number; alerta: boolean; mensagem: string; qtdAtual: number; estoqueMinimo: number }
export interface PedidoCriado extends Pedido { alertas: AlertaDoPedido[] }

export interface NovoPedido {
  referencia?: string;
  clienteId: number;
  almoxarifadoId: number;
  dataVencimento: string;
  formaPagamentoId?: number;
  observacao?: string;
  itens: { produtoId: number; quantidade: number }[];
}

export interface FiltroPedidos { statusId?: number; clienteId?: number; dataInicio?: string; dataFim?: string; page: number; limit: number }

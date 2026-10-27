import type { Decimal, Pessoa } from '@/lib/tipos';
import type { FinanceiroPedido } from '@/modules/pedidos/types';

export interface Fornecedor { id: number; pessoaId: number; pessoa: Pessoa }

export interface ItemCompra { id: number; produtoId: number; sequencia: number; quantidade: Decimal; valorUnitario: Decimal; valorTotal: Decimal }

export interface Compra {
  id: number;
  referencia: string;
  fornecedorId: number;
  almoxarifadoId: number;
  valorTotal: Decimal;
  acrescimos: Decimal;
  desconto: Decimal;
  notaNumero: string | null;
  notaSerie: string | null;
  notaChave: string | null;
  notaEmissao: string | null;
  observacao: string | null;
  createdAt: string;
  fornecedor: { id: number; pessoa: Pessoa };
  financeiro: FinanceiroPedido | null;
  itens?: ItemCompra[];
}

export interface NovaCompra {
  referencia: string;
  fornecedorId: number;
  almoxarifadoId: number;
  dataVencimento: string;
  formaPagamentoId?: number;
  observacao?: string;
  acrescimos?: number;
  desconto?: number;
  itens: { produtoId: number; quantidade: number; valorUnitario: number }[];
  nota?: { numero: string; serie: string; dataEmissao: string; chave?: string };
}

export interface CompraCriada extends Compra { alertas: { produtoId: number; alerta: boolean; mensagem: string }[] }

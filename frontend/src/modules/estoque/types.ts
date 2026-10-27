import type { Decimal } from '@/lib/tipos';

export interface Almoxarifado { id: number; nome: string; ativo: boolean }

export interface SaldoProduto {
  produtoId: number;
  nome: string;
  sku: string;
  unidade: string;
  saldoTotal: number;
  estoqueMinimo: number;
  alertaEstoqueAtivo: boolean;
  noMinimoOuAbaixo: boolean;
  almoxarifados: { almoxarifadoId: number; almoxarifado: string; ativo: boolean; quantidade: number }[];
}

export interface Movimento {
  id: number;
  tipo: 'ENTRADA' | 'SAIDA';
  qtdAnterior: Decimal;
  qtdModificada: Decimal;
  qtdPosterior: Decimal;
  observacao: string;
  createdAt: string;
  pedidoId: number | null;
  compraId: number | null;
  estoque: { produto: { id: number; nome: string; sku: string }; almoxarifado: { id: number; nome: string } };
  usuario: { username: string };
}

export interface AlertaEstoque {
  produtoId: number;
  sku: string;
  nome: string;
  saldoAtual: number;
  estoqueMinimo: number;
  abaixoDoMinimo: boolean;
  almoxarifados: { almoxarifadoId: number; almoxarifado: string; quantidade: number }[];
}

export interface ResultadoMovimentacao {
  sucesso: boolean;
  novoSaldo: number;
  almoxarifadoId: number;
  alerta?: { alerta: boolean; mensagem: string; qtdAtual: number; estoqueMinimo: number };
}

export interface NovaMovimentacao {
  produtoId: number;
  almoxarifadoId: number;
  quantidade: number;
  tipo: 'ENTRADA' | 'SAIDA';
  observacao: string;
}

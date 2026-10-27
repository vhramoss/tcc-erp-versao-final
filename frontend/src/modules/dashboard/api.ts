'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LinhaProduto { produtoId: number; nome: string; sku: string; quantidade: number; receita: number; lucro: number | null; margemPercentual: number | null }

export interface Indicadores {
  periodo: { inicio: string; fim: string };
  podeVerMargem: boolean;
  vendas: { pedidos: number; faturamento: number; ticketMedio: number; lucroBruto: number | null; margemPercentual: number | null };
  serieDiaria: { data: string; pedidos: number; faturamento: number }[];
  maisVendidos: LinhaProduto[];
  menosVendidos: LinhaProduto[];
  encalhados: { produtoId: number; nome: string; sku: string; saldo: number; capitalParado: number | null }[];
  estoque: { produtosNoMinimoOuAbaixo: number };
}

export const useIndicadores = (inicio: string, fim: string, habilitado: boolean) =>
  useQuery({ queryKey: ['dashboard', 'indicadores', inicio, fim], queryFn: () => api<Indicadores>('/dashboard/indicadores', { query: { dataInicio: inicio, dataFim: fim } }), enabled: habilitado && !!inicio && !!fim && inicio <= fim, placeholderData: keepPreviousData });

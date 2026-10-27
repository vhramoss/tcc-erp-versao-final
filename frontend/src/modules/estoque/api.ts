'use client';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { invalidarOperacional } from '@/lib/query';
import type { Paginado } from '@/lib/tipos';
import type { AlertaEstoque, Almoxarifado, Movimento, NovaMovimentacao, ResultadoMovimentacao, SaldoProduto } from './types';

export const useSaldos = (f: { busca?: string; page: number; limit: number }) =>
  useQuery({ queryKey: ['estoque', 'saldos', f], queryFn: () => api<Paginado<SaldoProduto>>('/estoque/saldos', { query: f }), placeholderData: keepPreviousData });

export const useMovimentos = (f: { produtoId?: number; almoxarifadoId?: number; page: number; limit: number }) =>
  useQuery({ queryKey: ['estoque', 'movimentos', f], queryFn: () => api<Paginado<Movimento>>('/estoque/movimentos', { query: f }), placeholderData: keepPreviousData });

export const useAlertas = (habilitado = true) => useQuery({ queryKey: ['estoque', 'alertas'], queryFn: () => api<AlertaEstoque[]>('/estoque/alertas'), enabled: habilitado });

export const useAlmoxarifados = (habilitado = true) => useQuery({ queryKey: ['estoque', 'almoxarifados'], queryFn: () => api<Almoxarifado[]>('/almoxarifados'), enabled: habilitado });

export function useMovimentar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: NovaMovimentacao) => api<ResultadoMovimentacao>('/estoque/movimentacao', { method: 'POST', body: d }),
    onSuccess: () => invalidarOperacional(qc),
  });
}

export function useCriarAlmoxarifado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: { nome: string; ativo?: boolean }) => api<Almoxarifado>('/almoxarifados', { method: 'POST', body: d }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estoque', 'almoxarifados'] }),
  });
}

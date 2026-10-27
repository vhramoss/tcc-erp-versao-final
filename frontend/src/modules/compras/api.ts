'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { invalidarOperacional } from '@/lib/query';
import type { DadosPessoa } from '@/modules/clientes/types';
import type { Compra, CompraCriada, Fornecedor, NovaCompra } from './types';

export const useCompras = () => useQuery({ queryKey: ['compras', 'lista'], queryFn: () => api<Compra[]>('/compras') });
export const useCompra = (id: number | null) => useQuery({ queryKey: ['compras', 'detalhe', id], queryFn: () => api<Compra>(`/compras/${id}`), enabled: !!id });
export const useFornecedores = (habilitado = true) => useQuery({ queryKey: ['compras', 'fornecedores'], queryFn: () => api<Fornecedor[]>('/fornecedores'), enabled: habilitado });

/** Compra = entrada no estoque + conta a pagar, na mesma transação do servidor. */
export function useCriarCompra() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: NovaCompra) => api<CompraCriada>('/compras', { method: 'POST', body: d }), onSuccess: () => invalidarOperacional(qc) });
}

export function useCriarFornecedor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: DadosPessoa) => api<Fornecedor>('/fornecedores', { method: 'POST', body: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ['compras', 'fornecedores'] }) });
}

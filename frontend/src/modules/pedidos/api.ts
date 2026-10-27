'use client';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { invalidarOperacional } from '@/lib/query';
import type { Paginado } from '@/lib/tipos';
import type { FiltroPedidos, NovoPedido, Pedido, PedidoCriado, StatusPedido, StatusProduto } from './types';

export const usePedidos = (f: FiltroPedidos) =>
  useQuery({ queryKey: ['pedidos', 'lista', f], queryFn: () => api<Paginado<Pedido>>('/pedidos', { query: { ...f } }), placeholderData: keepPreviousData });

export const usePedido = (id: number) => useQuery({ queryKey: ['pedidos', 'detalhe', id], queryFn: () => api<Pedido>(`/pedidos/${id}`) });

export const useStatusPedidos = () => useQuery({ queryKey: ['pedidos', 'status', 'pedido'], queryFn: () => api<StatusPedido[]>('/pedidos/status/pedido') });
export const useStatusProdutos = () => useQuery({ queryKey: ['pedidos', 'status', 'produto'], queryFn: () => api<StatusProduto[]>('/pedidos/status/produto') });

/** Criar pedido é uma transação única no servidor: grava itens, baixa o estoque e gera a conta a receber. */
export function useCriarPedido() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: NovoPedido) => api<PedidoCriado>('/pedidos', { method: 'POST', body: d }), onSuccess: () => invalidarOperacional(qc) });
}

/** Cancelar (status de cancelamento) estorna o estoque e cancela o lançamento financeiro. */
export function useAlterarStatusPedido(id: number) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (statusId: number) => api<Pedido>(`/pedidos/${id}/status`, { method: 'PATCH', body: { statusId } }), onSuccess: () => invalidarOperacional(qc) });
}

export function useAlterarStatusItem(pedidoId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, statusId }: { itemId: number; statusId: number }) => api(`/pedidos/${pedidoId}/itens/${itemId}/status`, { method: 'PATCH', body: { statusId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos'] }),
  });
}

export function useSalvarStatus(tipo: 'pedido' | 'produto') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id?: number; dados: Record<string, unknown> }) =>
      id ? api(`/pedidos/status/${tipo}/${id}`, { method: 'PATCH', body: dados }) : api(`/pedidos/status/${tipo}`, { method: 'POST', body: dados }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos', 'status'] }),
  });
}

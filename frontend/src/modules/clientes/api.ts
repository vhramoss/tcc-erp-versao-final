'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Cliente, DadosPessoa } from './types';

export const useClientes = (habilitado = true) => useQuery({ queryKey: ['clientes', 'lista'], queryFn: () => api<Cliente[]>('/clientes'), enabled: habilitado });

export function useSalvarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id?: number; dados: Partial<DadosPessoa> }) =>
      id ? api(`/clientes/${id}`, { method: 'PUT', body: dados }) : api<Cliente>('/clientes', { method: 'POST', body: dados }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useExcluirCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/clientes/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

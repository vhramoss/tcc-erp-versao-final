'use client';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { invalidarOperacional } from '@/lib/query';
import type { Paginado } from '@/lib/tipos';
import type { CentroCusto, FiltroTransacoes, FluxoCaixa, FormaPagamento, NovaTransacao, PlanoContas, Transacao } from './types';

export const useTransacoes = (f: FiltroTransacoes) =>
  useQuery({ queryKey: ['financeiro', 'transacoes', f], queryFn: () => api<Paginado<Transacao>>('/financeiro/transacoes', { query: { ...f } }), placeholderData: keepPreviousData });

export const useFluxoCaixa = (dataInicio: string, dataFim: string, habilitado = true) =>
  useQuery({ queryKey: ['financeiro', 'fluxo', dataInicio, dataFim], queryFn: () => api<FluxoCaixa>('/financeiro/fluxo-caixa', { query: { dataInicio, dataFim } }), enabled: habilitado && !!dataInicio && !!dataFim && dataInicio <= dataFim });

export const usePlanosContas = (habilitado = true) => useQuery({ queryKey: ['financeiro', 'planos'], queryFn: () => api<PlanoContas[]>('/plano-contas'), enabled: habilitado });
export const useCentrosCusto = (habilitado = true) => useQuery({ queryKey: ['financeiro', 'centros'], queryFn: () => api<CentroCusto[]>('/centros-custo'), enabled: habilitado });
export const useFormasPagamento = (habilitado = true) => useQuery({ queryKey: ['financeiro', 'formas'], queryFn: () => api<FormaPagamento[]>('/formas-pagamento'), enabled: habilitado });

export function useCriarTransacao() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: NovaTransacao) => api<Transacao>('/financeiro/transacao', { method: 'POST', body: d }), onSuccess: () => invalidarOperacional(qc) });
}

/** Dar baixa = registrar o pagamento ou recebimento. Também atualiza a situação do pedido de origem. */
export function useDarBaixa() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => api<Transacao>(`/financeiro/baixa/${id}`, { method: 'PATCH' }), onSuccess: () => invalidarOperacional(qc) });
}

export function useCancelarTransacao() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => api<Transacao>(`/financeiro/cancelar/${id}`, { method: 'PATCH' }), onSuccess: () => invalidarOperacional(qc) });
}

function useCriarTesouraria<TIn, TOut>(caminho: string, chave: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: TIn) => api<TOut>(caminho, { method: 'POST', body: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ['financeiro', chave] }) });
}
export const useCriarPlano = () => useCriarTesouraria<{ codigo: string; nome: string; tipo: string }, PlanoContas>('/plano-contas', 'planos');
export const useCriarCentro = () => useCriarTesouraria<{ nome: string }, CentroCusto>('/centros-custo', 'centros');
export const useCriarForma = () => useCriarTesouraria<{ nome: string; ativo?: boolean }, FormaPagamento>('/formas-pagamento', 'formas');

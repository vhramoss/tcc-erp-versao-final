'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { podeGerenciar, podeLer, type Me, type Recurso } from './permissoes';

export const meKey = ['me'] as const;

/** Usuário logado (nome, empresa, departamento e permissões efetivas). */
export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: () => api<Me>('/auth/me'), staleTime: 60_000, retry: false });
}

/** Atalhos de permissão para a tela. O backend continua sendo quem de fato autoriza. */
export function useCan() {
  const { data: me } = useMe();
  return {
    me,
    ler: (r: Recurso) => podeLer(me, r),
    gerenciar: (r: Recurso) => podeGerenciar(me, r),
    /** Custos e margens só chegam do servidor para quem tem financeiro.ler. */
    verCustos: podeLer(me, 'financeiro'),
  };
}

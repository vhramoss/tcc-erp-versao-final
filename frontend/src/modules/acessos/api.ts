'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DepartamentoAcesso, NovoUsuario, UsuarioAcesso } from './types';

export const useDepartamentos = () => useQuery({ queryKey: ['acessos', 'departamentos'], queryFn: () => api<DepartamentoAcesso[]>('/acessos/departamentos') });
export const useUsuarios = () => useQuery({ queryKey: ['acessos', 'usuarios'], queryFn: () => api<UsuarioAcesso[]>('/acessos/usuarios') });

/** O catálogo pode vir como lista de nomes ou de objetos; normalizamos para nomes. */
export const useCatalogo = () => useQuery({
  queryKey: ['acessos', 'catalogo'],
  queryFn: async () => {
    const dados = await api<(string | { nome: string })[]>('/acessos/permissoes');
    return dados.map((p) => (typeof p === 'string' ? p : p.nome));
  },
  staleTime: 5 * 60_000,
});

function useAcao<TIn>(fn: (d: TIn) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['acessos'] });
      // As permissões efetivas do próprio usuário podem ter mudado.
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export const useCriarDepartamento = () => useAcao((d: { nome: string; sigla?: string }) => api('/acessos/departamentos', { method: 'POST', body: d }));
export const useDefinirPermissoesDepartamento = () => useAcao(({ id, permissoes }: { id: number; permissoes: string[] }) => api(`/acessos/departamentos/${id}/permissoes`, { method: 'PUT', body: { permissoes } }));
export const useCriarUsuario = () => useAcao((d: NovoUsuario) => api('/acessos/usuarios', { method: 'POST', body: d }));
export const useDefinirPermissoesUsuario = () => useAcao(({ id, permissoes }: { id: number; permissoes: string[] }) => api(`/acessos/usuarios/${id}/permissoes`, { method: 'PUT', body: { permissoes } }));
export const useAtualizarUsuario = () => useAcao(({ id, dados }: { id: number; dados: { ativo?: boolean; departamentoId?: number } }) => api(`/acessos/usuarios/${id}`, { method: 'PATCH', body: dados }));

import { MutationCache, QueryClient, type QueryClient as QC } from '@tanstack/react-query';
import { ApiError } from './api';
import { toast } from '@/components/ui/toast';

export function criarQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      // Erros de qualquer operação viram aviso na tela, a menos que a mutação peça silêncio (meta.silencioso).
      onError: (erro, _v, _c, mutacao) => {
        if (mutacao.meta?.silencioso) return;
        if (erro instanceof ApiError && erro.status === 401) return;
        toast.erro(erro instanceof ApiError ? erro.message : 'Não foi possível concluir a operação.');
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 20_000,
        refetchOnWindowFocus: false,
        retry: (tentativas, erro) => !(erro instanceof ApiError && erro.status > 0 && erro.status < 500) && tentativas < 2,
      },
    },
  });
}

/** Pedidos, compras e movimentações mexem em estoque, financeiro e indicadores ao mesmo tempo. */
export function invalidarOperacional(qc: QC) {
  for (const chave of ['pedidos', 'compras', 'estoque', 'financeiro', 'dashboard', 'produtos']) {
    void qc.invalidateQueries({ queryKey: [chave] });
  }
}

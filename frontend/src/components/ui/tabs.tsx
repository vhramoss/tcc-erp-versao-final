'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Aba { chave: string; rotulo: string; icone?: ReactNode; contagem?: number }

export function Tabs({ abas, ativa, onChange }: { abas: Aba[]; ativa: string; onChange: (chave: string) => void }) {
  return (
    <div role="tablist" className="scroll-thin -mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-line px-1">
      {abas.map((a) => {
        const selecionada = a.chave === ativa;
        return (
          <button key={a.chave} role="tab" type="button" aria-selected={selecionada} onClick={() => onChange(a.chave)}
            className={cn('relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition',
              selecionada ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-fg')}>
            {a.icone}
            {a.rotulo}
            {a.contagem !== undefined && <span className="rounded-full bg-surface-2 px-1.5 text-[11px] text-muted">{a.contagem}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A aba ativa fica na URL (?aba=...): dá para recarregar, voltar e compartilhar o link. */
export function useAba(padrao: string, validas: string[]): [string, (chave: string) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const caminho = usePathname();
  const atual = params.get('aba');
  const ativa = atual && validas.includes(atual) ? atual : padrao;
  const trocar = useCallback((chave: string) => {
    const novo = new URLSearchParams(params.toString());
    if (chave === padrao) novo.delete('aba'); else novo.set('aba', chave);
    const texto = novo.toString();
    router.replace(texto ? `${caminho}?${texto}` : caminho, { scroll: false });
  }, [params, padrao, router, caminho]);
  return [ativa, trocar];
}

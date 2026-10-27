'use client';
import { KeyRound, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { encerrarSessao } from '@/lib/api';
import { iniciais } from '@/lib/format';
import { useMe } from '@/lib/use-auth';
import { ThemeToggle } from './theme-toggle';

export function Topbar({ aoAbrirMenu }: { aoAbrirMenu: () => void }) {
  const { data: me } = useMe();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
      <Button variante="ghost" tamanho="icon" className="lg:hidden" onClick={aoAbrirMenu} aria-label="Abrir menu"><Menu className="size-5" /></Button>
      <div className="flex-1" />
      <ThemeToggle />
      <div ref={raiz} className="relative">
        <button type="button" onClick={() => setAberto((v) => !v)} aria-haspopup="menu" aria-expanded={aberto}
          className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition hover:bg-surface-2">
          <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{iniciais(me?.nome ?? me?.username)}</span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[10rem] truncate text-sm font-medium">{me?.nome ?? me?.username ?? '…'}</span>
            <span className="block max-w-[10rem] truncate text-xs text-muted">{me?.departamento?.nome ?? 'Sem departamento'}</span>
          </span>
        </button>
        {aberto && (
          <div role="menu" className="absolute right-0 mt-2 w-60 animate-pop-in overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop">
            <div className="border-b border-line px-3 pb-2.5 pt-2">
              <p className="truncate text-sm font-medium">{me?.nome ?? me?.username}</p>
              <p className="truncate text-xs text-muted">{me?.email ?? `@${me?.username ?? ''}`}</p>
            </div>
            <Link role="menuitem" href="/perfil" onClick={() => setAberto(false)} className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-surface-2"><KeyRound className="size-4 text-muted" />Minha conta e senha</Link>
            <button role="menuitem" type="button" onClick={() => void encerrarSessao('sair')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"><LogOut className="size-4" />Sair</button>
          </div>
        )}
      </div>
    </header>
  );
}

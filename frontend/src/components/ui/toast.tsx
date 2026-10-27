'use client';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

type Tipo = 'sucesso' | 'erro' | 'aviso' | 'info';
interface Aviso { id: number; tipo: Tipo; texto: string; detalhe?: string }

// Barramento simples: qualquer código (inclusive fora do React, como o cache de mutações) pode avisar o usuário.
const ouvintes = new Set<(a: Aviso) => void>();
let contador = 0;
const emitir = (tipo: Tipo) => (texto: string, detalhe?: string) => ouvintes.forEach((o) => o({ id: ++contador, tipo, texto, detalhe }));
export const toast = { sucesso: emitir('sucesso'), erro: emitir('erro'), aviso: emitir('aviso'), info: emitir('info') };

const estilos: Record<Tipo, { icone: typeof Info; classe: string }> = {
  sucesso: { icone: CheckCircle2, classe: 'text-success' },
  erro: { icone: XCircle, classe: 'text-danger' },
  aviso: { icone: AlertTriangle, classe: 'text-warning' },
  info: { icone: Info, classe: 'text-info' },
};

export function Toaster() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    const ouvir = (a: Aviso) => {
      setAvisos((atual) => [...atual.slice(-3), a]);
      setTimeout(() => setAvisos((atual) => atual.filter((x) => x.id !== a.id)), a.tipo === 'erro' || a.detalhe ? 8000 : 4500);
    };
    ouvintes.add(ouvir);
    return () => void ouvintes.delete(ouvir);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
      {avisos.map((a) => {
        const { icone: Icone, classe } = estilos[a.tipo];
        return (
          <div key={a.id} role={a.tipo === 'erro' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-pop">
            <Icone className={cn('mt-0.5 size-5 shrink-0', classe)} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{a.texto}</p>
              {a.detalhe && <p className="mt-0.5 whitespace-pre-line text-xs text-muted">{a.detalhe}</p>}
            </div>
            <button type="button" aria-label="Fechar aviso" onClick={() => setAvisos((x) => x.filter((i) => i.id !== a.id))} className="rounded p-0.5 text-muted hover:text-fg">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

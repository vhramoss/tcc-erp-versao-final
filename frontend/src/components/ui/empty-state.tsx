import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props { icone?: LucideIcon; titulo: string; descricao?: string; acao?: ReactNode }

export function EmptyState({ icone: Icone = Inbox, titulo, descricao, acao }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted"><Icone className="size-6" aria-hidden /></div>
      <h3 className="text-sm font-semibold">{titulo}</h3>
      {descricao && <p className="mt-1 max-w-sm text-xs text-muted">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function ErrorState({ mensagem, onRetry }: { mensagem?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm font-semibold text-danger">Não foi possível carregar</p>
      <p className="mt-1 max-w-sm text-xs text-muted">{mensagem ?? 'Ocorreu um erro inesperado.'}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface-2">Tentar novamente</button>}
    </div>
  );
}

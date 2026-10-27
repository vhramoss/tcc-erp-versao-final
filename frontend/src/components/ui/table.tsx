import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { EmptyState, ErrorState } from './empty-state';
import { Skeleton } from './skeleton';

export interface Coluna<T> {
  chave: string;
  titulo: string;
  render: (linha: T) => ReactNode;
  alinhar?: 'left' | 'right' | 'center';
  className?: string;
  /** Esconde a coluna em telas menores que o breakpoint informado. */
  ocultarAte?: 'sm' | 'md' | 'lg';
}

interface Props<T> {
  colunas: Coluna<T>[];
  linhas?: T[];
  chaveLinha: (linha: T) => string | number;
  carregando?: boolean;
  erro?: string | null;
  onRetry?: () => void;
  aoClicar?: (linha: T) => void;
  vazio?: { titulo: string; descricao?: string; acao?: ReactNode };
}

const ocultar = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };
const alinhamento = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function DataTable<T>({ colunas, linhas, chaveLinha, carregando, erro, onRetry, aoClicar, vazio }: Props<T>) {
  if (erro) return <ErrorState mensagem={erro} onRetry={onRetry} />;
  if (!carregando && linhas && linhas.length === 0) return <EmptyState titulo={vazio?.titulo ?? 'Nada por aqui ainda'} descricao={vazio?.descricao} acao={vazio?.acao} />;

  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm sm:min-w-0">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            {colunas.map((c) => (
              <th key={c.chave} scope="col" className={cn('whitespace-nowrap px-4 py-3 font-medium', alinhamento[c.alinhar ?? 'left'], c.ocultarAte && ocultar[c.ocultarAte], c.className)}>{c.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {carregando
            ? Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>{colunas.map((c) => <td key={c.chave} className={cn('px-4 py-3.5', c.ocultarAte && ocultar[c.ocultarAte])}><Skeleton className="h-4 w-full max-w-[9rem]" /></td>)}</tr>
              ))
            : linhas?.map((linha) => (
                <tr key={chaveLinha(linha)} onClick={aoClicar ? () => aoClicar(linha) : undefined}
                  className={cn('transition-colors', aoClicar && 'cursor-pointer hover:bg-surface-2/70')}>
                  {colunas.map((c) => (
                    <td key={c.chave} className={cn('px-4 py-3 align-middle', alinhamento[c.alinhar ?? 'left'], c.ocultarAte && ocultar[c.ocultarAte], c.className)}>{c.render(linha)}</td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

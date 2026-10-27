'use client';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { Button } from './button';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  tamanho?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  rodape?: ReactNode;
}

const larguras = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ aberto, onFechar, titulo, descricao, tamanho = 'md', children, rodape }: ModalProps) {
  const tituloId = useId();
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const alvo = caixa.current?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
    (alvo ?? caixa.current)?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
      if (e.key !== 'Tab' || !caixa.current) return;
      // Mantém o foco dentro do diálogo.
      const itens = [...caixa.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!itens.length) return;
      const primeiro = itens[0], ultimo = itens[itens.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [aberto, onFechar]);

  if (!aberto || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div ref={caixa} role="dialog" aria-modal="true" aria-labelledby={tituloId} tabIndex={-1}
        className={cn('flex max-h-[92vh] w-full animate-pop-in flex-col rounded-t-2xl border border-line bg-surface shadow-pop outline-none sm:rounded-2xl', larguras[tamanho])}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={tituloId} className="text-base font-semibold">{titulo}</h2>
            {descricao && <p className="mt-0.5 text-xs text-muted">{descricao}</p>}
          </div>
          <Button variante="ghost" tamanho="icon" onClick={onFechar} aria-label="Fechar"><X className="size-4" /></Button>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {rodape && <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/50 px-5 py-3 sm:flex-row sm:justify-end">{rodape}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmProps {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
  titulo: string;
  mensagem: ReactNode;
  confirmar?: string;
  perigo?: boolean;
  carregando?: boolean;
}

export function ConfirmDialog({ aberto, onFechar, onConfirmar, titulo, mensagem, confirmar = 'Confirmar', perigo, carregando }: ConfirmProps) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo} tamanho="sm"
      rodape={<>
        <Button variante="outline" onClick={onFechar} disabled={carregando}>Cancelar</Button>
        <Button variante={perigo ? 'danger' : 'primary'} onClick={onConfirmar} carregando={carregando}>{confirmar}</Button>
      </>}>
      <div className="text-sm text-muted">{mensagem}</div>
    </Modal>
  );
}

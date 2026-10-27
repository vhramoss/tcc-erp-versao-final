'use client';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { normalizar } from '@/lib/format';
import { Field } from './field';

export interface Opcao { valor: string | number; rotulo: string; detalhe?: string }

interface Props {
  rotulo?: string;
  opcoes: Opcao[];
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  carregando?: boolean;
  disabled?: boolean;
  obrigatorio?: boolean;
  erro?: string;
  dica?: string;
  className?: string;
}

/** Lista pesquisável (acentos e caixa são ignorados). Teclado: setas, Enter e Esc. */
export function SearchSelect({ rotulo, opcoes, valor, onChange, placeholder = 'Selecione…', carregando, disabled, obrigatorio, erro, dica, className }: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [foco, setFoco] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const listaId = useId();

  const selecionada = opcoes.find((o) => String(o.valor) === valor);
  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    const lista = termo ? opcoes.filter((o) => normalizar(`${o.rotulo} ${o.detalhe ?? ''}`).includes(termo)) : opcoes;
    return lista.slice(0, 60);
  }, [opcoes, busca]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false); };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);

  const escolher = (o: Opcao) => { onChange(String(o.valor)); setAberto(false); setBusca(''); };

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAberto(true); setFoco((f) => Math.min(f + 1, filtradas.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFoco((f) => Math.max(f - 1, 0)); }
    else if (e.key === 'Enter' && aberto) { e.preventDefault(); if (filtradas[foco]) escolher(filtradas[foco]); }
    else if (e.key === 'Escape') setAberto(false);
  };

  return (
    <Field rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio} className={className}>
      {(id, desc) => (
        <div ref={raiz} className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id={id} role="combobox" aria-expanded={aberto} aria-controls={listaId} aria-autocomplete="list" aria-invalid={!!erro} aria-describedby={desc}
              disabled={disabled} autoComplete="off"
              value={aberto ? busca : (selecionada?.rotulo ?? '')}
              placeholder={carregando ? 'Carregando…' : placeholder}
              onFocus={() => { setAberto(true); setBusca(''); setFoco(0); }}
              onChange={(e) => { setBusca(e.target.value); setAberto(true); setFoco(0); }}
              onKeyDown={aoTeclar}
              className={cn('h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-9 text-sm shadow-sm transition placeholder:text-muted/70 hover:border-muted/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70', erro && 'border-danger')} />
            <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          </div>
          {aberto && (
            <ul id={listaId} role="listbox" className="scroll-thin absolute z-30 mt-1.5 max-h-64 w-full animate-pop-in overflow-auto rounded-xl border border-line bg-surface p-1 shadow-pop">
              {filtradas.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted">Nenhum resultado</li>}
              {filtradas.map((o, i) => (
                <li key={o.valor} role="option" aria-selected={String(o.valor) === valor}
                  onMouseDown={(e) => { e.preventDefault(); escolher(o); }} onMouseEnter={() => setFoco(i)}
                  className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm', i === foco && 'bg-surface-2')}>
                  <span className="min-w-0"><span className="block truncate">{o.rotulo}</span>{o.detalhe && <span className="block truncate text-xs text-muted">{o.detalhe}</span>}</span>
                  {String(o.valor) === valor && <Check className="size-4 shrink-0 text-brand" aria-hidden />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Field>
  );
}

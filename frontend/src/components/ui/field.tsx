import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const controle =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg shadow-sm transition placeholder:text-muted/70 hover:border-muted/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70 aria-[invalid=true]:border-danger';

interface FieldProps {
  rotulo?: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
  className?: string;
  children: (id: string, descricao?: string) => ReactNode;
}

/** Rótulo + controle + dica/erro, com ids ligados para leitores de tela. */
export function Field({ rotulo, erro, dica, obrigatorio, className, children }: FieldProps) {
  const id = useId();
  const descId = erro || dica ? `${id}-desc` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      {rotulo && (
        <label htmlFor={id} className="block text-xs font-medium text-fg/90">
          {rotulo}
          {obrigatorio && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
        </label>
      )}
      {children(id, descId)}
      {(erro || dica) && (
        <p id={descId} className={cn('text-xs', erro ? 'text-danger' : 'text-muted')}>
          {erro ?? dica}
        </p>
      )}
    </div>
  );
}

interface BaseProps { rotulo?: string; erro?: string; dica?: string; obrigatorio?: boolean }

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & BaseProps>(function Input(
  { rotulo, erro, dica, obrigatorio, className, ...resto },
  ref,
) {
  return (
    <Field rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio} className={className}>
      {(id, desc) => <input ref={ref} id={id} aria-invalid={!!erro} aria-describedby={desc} required={obrigatorio} className={cn(controle, 'h-10')} {...resto} />}
    </Field>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & BaseProps>(function Select(
  { rotulo, erro, dica, obrigatorio, className, children, ...resto },
  ref,
) {
  return (
    <Field rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio} className={className}>
      {(id, desc) => (
        <select ref={ref} id={id} aria-invalid={!!erro} aria-describedby={desc} required={obrigatorio} className={cn(controle, 'h-10 pr-8')} {...resto}>
          {children}
        </select>
      )}
    </Field>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps>(function Textarea(
  { rotulo, erro, dica, obrigatorio, className, ...resto },
  ref,
) {
  return (
    <Field rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio} className={className}>
      {(id, desc) => <textarea ref={ref} id={id} aria-invalid={!!erro} aria-describedby={desc} required={obrigatorio} rows={3} className={cn(controle, 'py-2')} {...resto} />}
    </Field>
  );
});

interface SwitchProps { rotulo: string; descricao?: string; valor: boolean; onChange: (v: boolean) => void; disabled?: boolean }

export function Switch({ rotulo, descricao, valor, onChange, disabled }: SwitchProps) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', disabled && 'cursor-not-allowed opacity-60')}>
      <button type="button" role="switch" aria-checked={valor} disabled={disabled} onClick={() => onChange(!valor)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full border border-line transition', valor ? 'bg-brand' : 'bg-surface-2')}>
        <span className={cn('absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform', valor && 'translate-x-5')} />
      </button>
      <span>
        <span className="block text-sm font-medium">{rotulo}</span>
        {descricao && <span className="block text-xs text-muted">{descricao}</span>}
      </span>
    </label>
  );
}

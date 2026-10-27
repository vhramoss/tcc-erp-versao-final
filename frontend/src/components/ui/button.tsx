import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variante = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Tamanho = 'sm' | 'md' | 'lg' | 'icon';

const variantes: Record<Variante, string> = {
  primary: 'bg-brand text-brand-fg shadow-sm hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-2 text-fg hover:bg-line/70',
  outline: 'border border-line bg-surface text-fg hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-danger text-white shadow-sm hover:brightness-110 active:brightness-95',
};
const tamanhos: Record<Tamanho, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
  icon: 'size-9 justify-center',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  icone?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variante = 'primary', tamanho = 'md', carregando, icone, className, children, disabled, type = 'button', ...resto },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || carregando}
      className={cn('inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-medium transition disabled:pointer-events-none disabled:opacity-50', variantes[variante], tamanhos[tamanho], className)}
      {...resto}
    >
      {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icone}
      {children}
    </button>
  );
});

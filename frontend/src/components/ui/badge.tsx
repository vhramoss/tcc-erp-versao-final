import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Tom = 'neutro' | 'marca' | 'sucesso' | 'alerta' | 'perigo' | 'info';

const tons: Record<Tom, string> = {
  neutro: 'bg-surface-2 text-muted',
  marca: 'bg-brand-soft text-brand',
  sucesso: 'bg-success-soft text-success',
  alerta: 'bg-warning-soft text-warning',
  perigo: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

export function Badge({ tom = 'neutro', children, className }: { tom?: Tom; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', tons[tom], className)}>{children}</span>;
}

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from './card';
import { Skeleton } from './skeleton';

type Tom = 'marca' | 'sucesso' | 'alerta' | 'perigo' | 'info';
const tons: Record<Tom, string> = { marca: 'bg-brand-soft text-brand', sucesso: 'bg-success-soft text-success', alerta: 'bg-warning-soft text-warning', perigo: 'bg-danger-soft text-danger', info: 'bg-info-soft text-info' };

interface Props { titulo: string; valor?: string; detalhe?: string; icone: LucideIcon; tom?: Tom; carregando?: boolean; destaque?: boolean }

export function StatCard({ titulo, valor, detalhe, icone: Icone, tom = 'marca', carregando, destaque }: Props) {
  return (
    <Card className={cn('p-5', destaque && 'border-brand/40 ring-1 ring-brand/20')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{titulo}</p>
          {carregando ? <Skeleton className="mt-2 h-7 w-28" /> : <p className="num mt-1.5 truncate text-2xl font-semibold tracking-tight">{valor ?? '—'}</p>}
          {detalhe && !carregando && <p className="mt-1 text-xs text-muted">{detalhe}</p>}
        </div>
        <div className={cn('grid size-10 shrink-0 place-items-center rounded-xl', tons[tom])}><Icone className="size-5" aria-hidden /></div>
      </div>
    </Card>
  );
}

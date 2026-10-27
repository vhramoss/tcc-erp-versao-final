import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-line bg-surface shadow-card', className)} {...resto} />;
}

interface CardHeaderProps { titulo: string; descricao?: string; acao?: ReactNode; className?: string }

export function CardHeader({ titulo, descricao, acao, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {descricao && <p className="mt-0.5 text-xs text-muted">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

export const CardBody = ({ className, ...resto }: HTMLAttributes<HTMLDivElement>) => <div className={cn('p-5', className)} {...resto} />;

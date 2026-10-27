import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cn('animate-pulse rounded-md bg-surface-2', className)} />;

export const Spinner = ({ className }: { className?: string }) => <Loader2 aria-label="Carregando" className={cn('size-5 animate-spin text-muted', className)} />;

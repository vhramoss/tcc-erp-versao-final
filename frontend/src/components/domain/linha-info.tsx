import type { ReactNode } from 'react';

/** Par rótulo/valor usado em cartões de detalhe. */
export function LinhaInfo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted">{rotulo}</dt>
      <dd className="min-w-0 text-right font-medium">{children}</dd>
    </div>
  );
}

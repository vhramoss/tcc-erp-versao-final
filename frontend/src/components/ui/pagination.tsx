import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface Props { page: number; limit: number; total: number; onPage: (p: number) => void }

export function Pagination({ page, limit, total, onPage }: Props) {
  const paginas = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return total > 0 ? <p className="border-t border-line px-4 py-3 text-xs text-muted">{total} {total === 1 ? 'registro' : 'registros'}</p> : null;
  const de = (page - 1) * limit + 1;
  const ate = Math.min(page * limit, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-xs text-muted">Mostrando {de}–{ate} de {total}</p>
      <div className="flex items-center gap-2">
        <Button variante="outline" tamanho="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} icone={<ChevronLeft className="size-4" />}>Anterior</Button>
        <span className="num text-xs text-muted">{page} / {paginas}</span>
        <Button variante="outline" tamanho="sm" disabled={page >= paginas} onClick={() => onPage(page + 1)}>Próxima<ChevronRight className="size-4" /></Button>
      </div>
    </div>
  );
}

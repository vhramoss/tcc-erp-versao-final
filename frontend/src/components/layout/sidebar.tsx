'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useCan } from '@/lib/use-auth';
import { ICONE_MARCA, MENU } from './nav';

const NOME_APP = process.env.NEXT_PUBLIC_APP_NAME ?? 'ERP PME';

export function Sidebar({ aoNavegar }: { aoNavegar?: () => void }) {
  const caminho = usePathname();
  const { me, ler } = useCan();
  const visiveis = MENU.filter((i) => !i.recurso || ler(i.recurso));
  const grupos = [...new Set(visiveis.map((i) => i.grupo))];
  const ativo = (href: string) => (href === '/' ? caminho === '/' : caminho === href || caminho.startsWith(`${href}/`));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg shadow-sm"><ICONE_MARCA className="size-5" aria-hidden /></div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">{NOME_APP}</p>
          <p className="truncate text-xs text-muted">{me?.empresa?.nome ?? ' '}</p>
        </div>
      </div>
      <nav aria-label="Principal" className="scroll-thin flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {grupos.map((grupo) => (
          <div key={grupo}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">{grupo}</p>
            <ul className="space-y-0.5">
              {visiveis.filter((i) => i.grupo === grupo).map(({ href, rotulo, icone: Icone }) => (
                <li key={href}>
                  <Link href={href} onClick={aoNavegar} aria-current={ativo(href) ? 'page' : undefined}
                    className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition', ativo(href) ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface-2 hover:text-fg')}>
                    <Icone className="size-[18px]" aria-hidden />
                    {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

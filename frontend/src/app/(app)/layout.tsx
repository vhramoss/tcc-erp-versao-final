'use client';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Skeleton } from '@/components/ui';
import { useMe } from '@/lib/use-auth';

/** Casco das páginas autenticadas: menu lateral (gaveta no celular), barra superior e conteúdo. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const caminho = usePathname();
  const { isPending } = useMe();

  useEffect(() => setMenu(false), [caminho]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-surface lg:block"><Sidebar /></aside>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenu(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-in border-r border-line bg-surface shadow-pop"><Sidebar aoNavegar={() => setMenu(false)} /></aside>
        </div>
      )}
      <div className="lg:pl-64">
        <Topbar aoAbrirMenu={() => setMenu(true)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {isPending ? (
            <div className="space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-40 w-full" /></div>
          ) : (
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>{children}</Suspense>
          )}
        </main>
      </div>
    </div>
  );
}

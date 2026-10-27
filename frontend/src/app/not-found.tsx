import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div><p className="text-5xl font-semibold text-brand">404</p><h1 className="mt-3 text-xl font-semibold">Página não encontrada</h1><p className="mt-1 text-sm text-muted">O endereço não existe ou foi movido.</p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg">Voltar ao painel</Link></div>
    </main>
  );
}

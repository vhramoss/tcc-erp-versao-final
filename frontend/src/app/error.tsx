'use client';
export default function ErroGlobal({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div><h1 className="text-xl font-semibold">Algo deu errado</h1><p className="mt-1 text-sm text-muted">Ocorreu um erro inesperado ao exibir esta página.</p>
        <button type="button" onClick={reset} className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg">Tentar novamente</button></div>
    </main>
  );
}

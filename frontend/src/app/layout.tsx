import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

const nome = process.env.NEXT_PUBLIC_APP_NAME ?? 'ERP PME';

export const metadata: Metadata = {
  title: { default: nome, template: `%s · ${nome}` },
  description: 'Gestão de estoque, pedidos, clientes e financeiro para pequenas empresas.',
};
export const viewport: Viewport = { themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f5f6fa' }, { media: '(prefers-color-scheme: dark)', color: '#0c0f17' }] };

// Aplica o tema salvo antes da primeira pintura, evitando o "flash" claro no modo escuro.
const temaInicial = `try{var t=localStorage.getItem('erp-tema');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaInicial }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

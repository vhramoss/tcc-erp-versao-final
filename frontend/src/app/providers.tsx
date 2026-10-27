'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { criarQueryClient } from '@/lib/query';
import { Toaster } from '@/components/ui/toast';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(criarQueryClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}

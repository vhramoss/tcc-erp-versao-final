'use client';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';

export function ThemeToggle() {
  const [escuro, setEscuro] = useState(false);
  useEffect(() => setEscuro(document.documentElement.classList.contains('dark')), []);

  const alternar = () => {
    const proximo = !escuro;
    document.documentElement.classList.toggle('dark', proximo);
    try { localStorage.setItem('erp-tema', proximo ? 'dark' : 'light'); } catch { /* armazenamento indisponível */ }
    setEscuro(proximo);
  };

  return (
    <Button variante="ghost" tamanho="icon" onClick={alternar} aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}>
      {escuro ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </Button>
  );
}

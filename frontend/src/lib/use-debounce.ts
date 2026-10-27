'use client';
import { useEffect, useState } from 'react';

export function useDebounce<T>(valor: T, atrasoMs = 300): T {
  const [atual, setAtual] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtual(valor), atrasoMs);
    return () => clearTimeout(t);
  }, [valor, atrasoMs]);
  return atual;
}

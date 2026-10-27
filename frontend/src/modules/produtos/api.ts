'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Categoria, Marca, NovoProduto, Produto, UnidadeMedida } from './types';

export const useProdutos = (habilitado = true) => useQuery({ queryKey: ['produtos', 'lista'], queryFn: () => api<Produto[]>('/produtos'), enabled: habilitado });
export const useCategorias = () => useQuery({ queryKey: ['produtos', 'categorias'], queryFn: () => api<Categoria[]>('/produtos/categorias') });
export const useMarcas = () => useQuery({ queryKey: ['produtos', 'marcas'], queryFn: () => api<Marca[]>('/produtos/marcas') });
export const useUnidades = () => useQuery({ queryKey: ['produtos', 'unidades'], queryFn: () => api<UnidadeMedida[]>('/produtos/unidades-medida') });

function useCriar<TIn, TOut>(caminho: string, chave: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: TIn) => api<TOut>(caminho, { method: 'POST', body: dados }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['produtos', chave] }),
  });
}

export const useCriarProduto = () => useCriar<NovoProduto, Produto>('/produtos', 'lista');
export const useCriarCategoria = () => useCriar<{ nome: string }, Categoria>('/produtos/categoria', 'categorias');
export const useCriarMarca = () => useCriar<{ nome: string }, Marca>('/produtos/marca', 'marcas');
export const useCriarUnidade = () => useCriar<{ sigla: string; nome: string }, UnidadeMedida>('/produtos/unidade-medida', 'unidades');

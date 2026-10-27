import type { Decimal } from '@/lib/tipos';

export interface Categoria { id: number; nome: string }
export interface Marca { id: number; nome: string }
export interface UnidadeMedida { id: number; sigla: string; nome: string }
export interface PrecoProduto { id: number; nomeTabela: string; precoVenda: Decimal }

export interface Produto {
  id: number;
  nome: string;
  descricao?: string | null;
  sku: string;
  referencia?: string | null;
  cor?: string | null;
  /** Ausente para quem não tem financeiro.ler (o servidor remove). */
  precoCusto?: Decimal;
  estoqueMinimo: Decimal;
  alertaEstoqueAtivo: boolean;
  categoria: Categoria;
  unidadeMedida: UnidadeMedida;
  marca: Marca | null;
  precos: PrecoProduto[];
}

export interface NovoProduto {
  nome: string;
  sku: string;
  descricao?: string;
  referencia?: string;
  cor?: string;
  precoCusto: number;
  precoVenda: number;
  estoqueMinimo: number;
  alertaEstoqueAtivo: boolean;
  categoriaId: number;
  unidadeMedidaId: number;
  marcaId?: number;
}

/** O pedido usa o preço da tabela "Padrão" (o backend não aceita preço diferente do cadastro). */
export const precoPadrao = (p: Pick<Produto, 'precos'>) => p.precos.find((x) => x.nomeTabela === 'Padrão')?.precoVenda;

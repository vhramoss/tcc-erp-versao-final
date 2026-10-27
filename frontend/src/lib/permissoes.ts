export const RECURSOS = ['produtos', 'estoque', 'financeiro', 'clientes', 'pedidos', 'compras', 'acessos'] as const;
export type Recurso = (typeof RECURSOS)[number];

export const ROTULO_RECURSO: Record<Recurso, string> = {
  produtos: 'Produtos', estoque: 'Estoque', financeiro: 'Financeiro', clientes: 'Clientes',
  pedidos: 'Pedidos', compras: 'Compras', acessos: 'Acessos',
};

export interface Me {
  id: number;
  idEmpresa: number;
  username?: string;
  nome?: string;
  email?: string;
  empresa?: { id: number; nome: string; cnpj: string };
  departamento?: { id: number; nome: string; sigla?: string | null } | null;
  permissoes: string[];
}

/** Espelha a regra do backend: GET exige `<recurso>.ler`; qualquer alteração exige `<recurso>.gerenciar`. */
export const podeLer = (me: Me | undefined, recurso: Recurso) => !!me?.permissoes?.includes(`${recurso}.ler`);
export const podeGerenciar = (me: Me | undefined, recurso: Recurso) => !!me?.permissoes?.includes(`${recurso}.gerenciar`);

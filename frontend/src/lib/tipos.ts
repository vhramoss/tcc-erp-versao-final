// Tipos compartilhados. Colunas decimais chegam do backend como TEXTO ("300.00"); use paraNumero() para calcular.
export type Decimal = string;

export interface Paginado<T> { items: T[]; total: number; page: number; limit: number }

export interface Pessoa {
  id: number;
  nome: string;
  email: string;
  cpfCnpj: string;
  telefone?: string | null;
  endereco?: string | null;
  tipo: 'FISICA' | 'JURIDICA';
}

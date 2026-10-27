import type { Pessoa } from '@/lib/tipos';

export interface Cliente { id: number; pessoaId: number; pessoa: Pessoa }
export type DadosPessoa = Omit<Pessoa, 'id'>;

import { SetMetadata } from '@nestjs/common';
export const PUBLICA = 'auth:publica';
export const AUTENTICADO = 'auth:autenticado';
export const RECURSO = 'auth:recurso';
export const Publica = () => SetMetadata(PUBLICA, true);
export const Autenticado = () => SetMetadata(AUTENTICADO, true);
export const Recurso = (nome: string) => SetMetadata(RECURSO, nome);
export const RECURSOS = ['produtos', 'estoque', 'financeiro', 'clientes', 'pedidos', 'compras', 'acessos'] as const;
export const PERMISSOES = RECURSOS.flatMap(r => [`${r}.ler`, `${r}.gerenciar`]);

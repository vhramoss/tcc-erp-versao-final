export interface PermissaoRef { permissao: { id: number; nome: string } }

export interface DepartamentoAcesso { id: number; nome: string; sigla?: string | null; permissoes: PermissaoRef[] }

export interface UsuarioAcesso {
  id: number;
  username: string;
  ativo: boolean;
  pessoaId: number;
  departamentoId: number | null;
  pessoa?: { nome: string; email: string };
  permissoes: PermissaoRef[];
}

export interface NovoUsuario {
  username: string;
  senha: string;
  departamentoId?: number;
  permissoes: string[];
  pessoa: { nome: string; email: string; cpfCnpj: string; tipo: 'FISICA' | 'JURIDICA' };
}

export const nomesDe = (lista: PermissaoRef[]) => lista.map((p) => p.permissao.nome);

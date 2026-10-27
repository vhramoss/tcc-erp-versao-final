import { traduzirMensagens } from './mensagens';

/** Erro de API já com mensagens prontas para exibir. */
export class ApiError extends Error {
  constructor(public status: number, message: string, public detalhes: string[] = []) {
    super(message);
    this.name = 'ApiError';
  }
}

const CABECALHOS = { 'x-requested-with': 'erp-web' } as const;
let encerrando = false;

/** Sessão inválida: apaga os cookies no servidor e volta ao login (uma única vez, mesmo com várias chamadas falhando juntas). */
export async function encerrarSessao(motivo: 'expirada' | 'sair' = 'expirada', todos = false) {
  if (encerrando) return;
  encerrando = true;
  await fetch(`/api/auth/logout${todos ? '?todos=1' : ''}`, { method: 'POST', headers: CABECALHOS }).catch(() => null);
  window.location.assign(motivo === 'expirada' ? '/login?expirada=1' : '/login');
}

type Consulta = Record<string, string | number | boolean | null | undefined>;

function montarUrl(caminho: string, query?: Consulta) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  const texto = params.toString();
  return `/api${caminho}${texto ? `?${texto}` : ''}`;
}

/**
 * Chamada ao backend através do BFF (/api). Devolve o campo `data` do envelope { success, data }.
 * Lança ApiError com a mensagem do servidor traduzida.
 */
export async function api<T = unknown>(
  caminho: string,
  opcoes: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; query?: Consulta; signal?: AbortSignal } = {},
): Promise<T> {
  const { method = 'GET', body, query, signal } = opcoes;
  let resposta: Response;
  try {
    resposta = await fetch(montarUrl(caminho, query), {
      method,
      headers: { ...CABECALHOS, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
    });
  } catch (erro) {
    if ((erro as Error).name === 'AbortError') throw erro;
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet e tente novamente.');
  }

  const texto = await resposta.text();
  let json: { data?: T; message?: unknown } | null = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = null;
  }

  if (!resposta.ok) {
    if (resposta.status === 401) void encerrarSessao('expirada');
    const detalhes = traduzirMensagens(json?.message);
    const padrao: Record<number, string> = {
      400: 'Dados inválidos.', 403: 'Você não tem permissão para esta operação.', 404: 'Registro não encontrado.',
      409: 'Este registro conflita com outro já existente.', 429: 'Muitas tentativas. Aguarde um instante.', 503: 'Servidor indisponível.',
    };
    throw new ApiError(resposta.status, detalhes[0] ?? padrao[resposta.status] ?? 'Não foi possível concluir a operação.', detalhes);
  }
  return (json && 'data' in json ? json.data : json) as T;
}

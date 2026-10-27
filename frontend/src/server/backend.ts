import { API_URL } from './config';
import type { TokenPair } from './session';

interface Chamada {
  method: string;
  body?: string;
  token?: string;
  ip?: string;
}

/** Chamada servidor→servidor ao backend NestJS. Repassa o IP real para o limitador de tentativas de login. */
export function chamarApi(caminho: string, { method, body, token, ip }: Chamada): Promise<Response> {
  return fetch(`${API_URL}${caminho}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(ip ? { 'x-forwarded-for': ip } : {}),
    },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
}

/**
 * Renovação com "voo único". O backend rotaciona o refresh token a cada uso e trata a reutilização
 * como roubo (revoga a sessão). Várias requisições do navegador expiram juntas, então todas que
 * carregam o MESMO refresh token compartilham uma única chamada; o resultado fica em cache por 15 s
 * para requisições que já estavam a caminho com o cookie antigo.
 */
const renovacoes = new Map<string, Promise<TokenPair | null>>();

export function renovarSessao(refreshToken: string, ip?: string): Promise<TokenPair | null> {
  const emAndamento = renovacoes.get(refreshToken);
  if (emAndamento) return emAndamento;

  const promessa = (async () => {
    const resposta = await chamarApi('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }), ip });
    if (!resposta.ok) return null;
    const json = (await resposta.json()) as { data?: TokenPair };
    return json.data ?? null;
  })().catch(() => null);

  renovacoes.set(refreshToken, promessa);
  setTimeout(() => renovacoes.delete(refreshToken), 15_000).unref?.();
  return promessa;
}

/** IP do cliente informado pelo proxy reverso. Configure o proxy para SOBRESCREVER X-Forwarded-For. */
export function ipDoCliente(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || '127.0.0.1';
}

import { cookies } from 'next/headers';
import { COOKIE, COOKIE_SECURE } from './config';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

const base = { httpOnly: true, sameSite: 'lax' as const, secure: COOKIE_SECURE };

/**
 * Tokens ficam em cookies httpOnly (JavaScript do navegador não consegue lê-los).
 * Access e refresh só viajam para /api; o cookie "erp_s" (sem o token) existe apenas para o
 * middleware saber se há sessão e redirecionar páginas.
 */
export async function gravarSessao(par: TokenPair) {
  const jar = await cookies();
  jar.set(COOKIE.access, par.accessToken, { ...base, path: '/api', maxAge: par.expiresIn });
  jar.set(COOKIE.refresh, par.refreshToken, { ...base, path: '/api', maxAge: par.refreshExpiresIn });
  jar.set(COOKIE.sessao, '1', { ...base, path: '/', maxAge: par.refreshExpiresIn });
}

export async function limparSessao() {
  const jar = await cookies();
  jar.set(COOKIE.access, '', { ...base, path: '/api', maxAge: 0 });
  jar.set(COOKIE.refresh, '', { ...base, path: '/api', maxAge: 0 });
  jar.set(COOKIE.sessao, '', { ...base, path: '/', maxAge: 0 });
}

export async function lerTokens() {
  const jar = await cookies();
  return { access: jar.get(COOKIE.access)?.value, refresh: jar.get(COOKIE.refresh)?.value };
}

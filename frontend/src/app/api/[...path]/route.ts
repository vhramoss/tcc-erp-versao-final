import { NextRequest, NextResponse } from 'next/server';
import { chamarApi, ipDoCliente, renovarSessao } from '@/server/backend';
import { gravarSessao, lerTokens, limparSessao } from '@/server/session';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ path: string[] }> };

const semCache = { 'cache-control': 'no-store' };
const resposta = (status: number, message: string) => NextResponse.json({ success: false, statusCode: status, message }, { status, headers: semCache });

/**
 * Proxy autenticado: /api/<rota> → backend /<rota>.
 *  - injeta o access token (cookie httpOnly) como Bearer;
 *  - se o access expirou (cookie ausente ou 401), renova uma vez com voo único e repete a chamada;
 *  - login e refresh NÃO passam por aqui (têm rota própria; o refresh token nunca chega ao navegador);
 *  - métodos que alteram dados exigem cabeçalho x-requested-with e Origin igual ao host (CSRF).
 */
async function proxy(req: NextRequest, ctx: Contexto) {
  const { path } = await ctx.params;
  const alvo = '/' + path.map(encodeURIComponent).join('/');
  if (/^\/auth\/(login|refresh)(\/|$)/.test(alvo)) return resposta(404, 'Rota indisponível.');

  const leitura = req.method === 'GET' || req.method === 'HEAD';
  if (!leitura) {
    const origem = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    if (req.headers.get('x-requested-with') !== 'erp-web' || (origem && new URL(origem).host !== host)) {
      return resposta(403, 'Requisição bloqueada pela proteção CSRF.');
    }
  }

  const ip = ipDoCliente(req.headers);
  const { access, refresh } = await lerTokens();
  let token = access;
  let renovado = null as Awaited<ReturnType<typeof renovarSessao>>;

  if (!token && refresh) {
    renovado = await renovarSessao(refresh, ip);
    token = renovado?.accessToken;
  }
  if (!token) {
    await limparSessao();
    return resposta(401, 'Sessão expirada. Faça login novamente.');
  }

  const corpo = leitura ? undefined : await req.text();
  const chamar = (t: string) => chamarApi(alvo + req.nextUrl.search, { method: req.method, body: corpo || undefined, token: t, ip });

  let retorno: Response;
  try {
    retorno = await chamar(token);
    if (retorno.status === 401 && refresh && !renovado) {
      renovado = await renovarSessao(refresh, ip);
      if (renovado) retorno = await chamar(renovado.accessToken);
    }
  } catch {
    return resposta(503, 'Servidor indisponível. Tente novamente em instantes.');
  }

  if (retorno.status === 401) {
    await limparSessao();
    return resposta(401, 'Sessão expirada. Faça login novamente.');
  }
  if (renovado) await gravarSessao(renovado);

  const texto = await retorno.text();
  return new NextResponse(texto || null, {
    status: retorno.status,
    headers: { 'content-type': retorno.headers.get('content-type') ?? 'application/json', ...semCache },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };

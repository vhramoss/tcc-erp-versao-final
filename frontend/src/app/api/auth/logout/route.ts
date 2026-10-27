import { NextRequest, NextResponse } from 'next/server';
import { chamarApi, ipDoCliente } from '@/server/backend';
import { lerTokens, limparSessao } from '@/server/session';

export const dynamic = 'force-dynamic';

/** Encerra a sessão no backend (revoga o refresh token) e apaga os cookies, mesmo se o backend falhar. */
export async function POST(req: NextRequest) {
  const { access } = await lerTokens();
  const todos = req.nextUrl.searchParams.get('todos') === '1';
  if (access) {
    await chamarApi(todos ? '/auth/logout-todos' : '/auth/logout', { method: 'POST', token: access, ip: ipDoCliente(req.headers) }).catch(() => null);
  }
  await limparSessao();
  return NextResponse.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
}

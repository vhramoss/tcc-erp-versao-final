import { NextRequest, NextResponse } from 'next/server';
import { chamarApi, ipDoCliente } from '@/server/backend';
import { gravarSessao, type TokenPair } from '@/server/session';

export const dynamic = 'force-dynamic';

const semCache = { 'cache-control': 'no-store' };

/** Login: o backend devolve os tokens, o BFF os guarda em cookies httpOnly e responde só { ok: true }. */
export async function POST(req: NextRequest) {
  if (req.headers.get('x-requested-with') !== 'erp-web') return NextResponse.json({ message: 'Requisição inválida.' }, { status: 403 });

  let corpo: { cnpj?: unknown; username?: unknown; senha?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ message: 'Corpo inválido.' }, { status: 400, headers: semCache });
  }
  const cnpj = String(corpo.cnpj ?? '').replace(/\D/g, '');
  if (typeof corpo.username !== 'string' || typeof corpo.senha !== 'string' || !corpo.username || !corpo.senha) {
    return NextResponse.json({ message: 'Informe empresa, usuário e senha.' }, { status: 400, headers: semCache });
  }

  let resposta: Response;
  try {
    resposta = await chamarApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cnpj, username: corpo.username.trim(), senha: corpo.senha }),
      ip: ipDoCliente(req.headers),
    });
  } catch {
    return NextResponse.json({ message: 'Servidor indisponível. Tente novamente em instantes.' }, { status: 503, headers: semCache });
  }

  const json = (await resposta.json().catch(() => ({}))) as { data?: TokenPair; message?: string | string[] };
  if (!resposta.ok || !json.data) {
    const message = Array.isArray(json.message) ? json.message.join('; ') : (json.message ?? 'Não foi possível entrar.');
    return NextResponse.json({ message }, { status: resposta.status === 400 ? 400 : resposta.status, headers: semCache });
  }

  await gravarSessao(json.data);
  return NextResponse.json({ ok: true }, { headers: semCache });
}

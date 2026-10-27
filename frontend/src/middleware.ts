import { NextResponse, type NextRequest } from 'next/server';

// Protege as PÁGINAS pela presença do cookie de sessão. A validade real do token é verificada pelo
// backend a cada chamada; se estiver vencida, o cliente chama /api/auth/logout e volta ao login.
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const logado = req.cookies.has('erp_s');

  if (pathname === '/login') {
    if (logado && !searchParams.has('expirada')) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }
  if (!logado) {
    const destino = new URL('/login', req.url);
    if (pathname !== '/') destino.searchParams.set('next', pathname + req.nextUrl.search);
    return NextResponse.redirect(destino);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)'] };

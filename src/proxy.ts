import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, isValidSessionToken } from '@/lib/adminSession';

/**
 * El panel (/admin) solo se abre con una sesión válida. Sin sesión, se va a la pantalla
 * de ingreso. La página del panel vuelve a verificar la sesión (doble control).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/admin/ingresar')) return NextResponse.next();
  if (isValidSessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = '/admin/ingresar';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};

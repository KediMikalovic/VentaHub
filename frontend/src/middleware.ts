import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cookie üzerinden token kontrolü
  const token = request.cookies.get('access_token');

  // Token yoksa ve kullanıcı /dashboard altındaysa login'e gönder
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Token varsa yola devam et
  return NextResponse.next();
}

// Sadece /dashboard ve altındaki rotalarda middleware'in çalışmasını sağlıyoruz (Matcher Rule)
export const config = {
  matcher: ['/dashboard/:path*'],
};

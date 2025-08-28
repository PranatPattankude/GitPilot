import { NextResponse, type NextRequest } from 'next/server';

// This middleware is intentionally left empty.
// You can add logic here to handle redirects, authentication, etc.

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

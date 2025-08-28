import { NextResponse, type NextRequest } from 'next/server';

// This middleware is intentionally left empty as we are handling
// authentication state on the client-side in the page and layout components.
// In a production application, you would likely use this middleware to verify
// a session cookie.

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};

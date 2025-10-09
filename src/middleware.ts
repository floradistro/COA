import { NextResponse } from 'next/server'

// Note: Supabase stores sessions in localStorage by default, not cookies
// So we rely on client-side ProtectedRoute component for route protection
// This middleware is kept minimal to avoid unnecessary redirects
export async function middleware() {
  // Allow all requests through - client-side ProtectedRoute handles auth
  // This is the same Supabase backend as Quantix, just different login pages
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)'],
}


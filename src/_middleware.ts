// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/auth',
    '/about-us',
    '/',
    '/find-freelance',
    '/project-board',
    '/images', // เพิ่มเส้นทางรูปภาพให้เป็น public
  ];

  // Check if the current path is in the public routes
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If it's an image path, allow access without authentication
  if (pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    return NextResponse.next();
  }

  // If authenticated and trying to access auth page
  if (token && pathname === '/auth') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If not authenticated and trying to access a protected route
  if (!token && !isPublicRoute) {
    const redirectUrl = new URL('/auth?state=login', request.url);
    // Add the callback url to redirect after login
    redirectUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Define which routes this middleware should run for
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes that handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|public|api).*)',
  ],
};
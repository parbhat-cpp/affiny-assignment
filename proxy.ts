import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const proxy = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/api/auth/login', '/api/auth/signup'];
  
  // Check if the route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Protected routes (like /app)
  if (pathname.startsWith('/app')) {
    const token = request.cookies.get('authToken')?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
};

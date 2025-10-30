import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from './auth';

export function withAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const token = getTokenFromRequest(request);
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const user = verifyToken(token);
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      return handler(request, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

export function withAdminAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return withAuth(async (request: NextRequest, user: any) => {
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    return handler(request, user);
  });
}

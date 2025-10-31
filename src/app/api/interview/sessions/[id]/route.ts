import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 14+ vs 13)
    const resolvedParams = params instanceof Promise ? await params : params;
    const sessionId = resolvedParams.id;

    // Authenticate user
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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { phase, status, completedAt } = body;

    // Verify the session belongs to the user's company
    const existingSession = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        role: {
          companyId: user.companyId
        }
      }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Update session
    const updateData: any = {};
    if (phase) updateData.phase = phase;
    if (status) updateData.status = status;
    if (completedAt) updateData.completedAt = new Date(completedAt);

    const updatedSession = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        role: true,
        interviewResponses: true
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating interview session:', error);
    return NextResponse.json(
      { error: 'Failed to update interview session' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 14+ vs 13)
    const resolvedParams = params instanceof Promise ? await params : params;
    const sessionId = resolvedParams.id;

    // Authenticate user
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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Fetch session
    const session = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        role: {
          companyId: user.companyId
        }
      },
      include: {
        role: true,
        interviewResponses: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching interview session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview session' },
      { status: 500 }
    );
  }
}


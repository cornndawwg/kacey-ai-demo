import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { sessionId, question, response, transcript, audioUrl, phase, tag, confidence } = body;

    if (!sessionId || !question) {
      return NextResponse.json(
        { error: 'Session ID and question are required' },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user's company
    const session = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        role: {
          companyId: user.companyId
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    const interviewResponse = await prisma.interviewResponse.create({
      data: {
        sessionId,
        question,
        response,
        transcript,
        audioUrl,
        phase,
        tag,
        confidence
      }
    });

    return NextResponse.json(interviewResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating interview response:', error);
    return NextResponse.json(
      { error: 'Failed to create interview response' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { id, response, transcript, confidence } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Response ID is required' },
        { status: 400 }
      );
    }

    // Verify the response belongs to the user's company
    const existingResponse = await prisma.interviewResponse.findFirst({
      where: {
        id,
        session: {
          role: {
            companyId: user.companyId
          }
        }
      }
    });

    if (!existingResponse) {
      return NextResponse.json(
        { error: 'Response not found or access denied' },
        { status: 404 }
      );
    }

    const updatedResponse = await prisma.interviewResponse.update({
      where: { id },
      data: {
        response,
        transcript,
        confidence
      }
    });

    return NextResponse.json(updatedResponse);
  } catch (error) {
    console.error('Error updating interview response:', error);
    return NextResponse.json(
      { error: 'Failed to update interview response' },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: {
        role: {
          companyId: user.companyId
        }
      },
      include: {
        role: true,
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { roleId, title } = body;

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Verify the role belongs to the user's company
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        companyId: user.companyId
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found or access denied' },
        { status: 404 }
      );
    }

    const session = await prisma.chatSession.create({
      data: {
        roleId,
        title: title || `Chat with ${role.title}`
      },
      include: {
        role: true
      }
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const roleId = resolvedParams.id;

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

    const body = await request.json();
    const { title, description, departmentId } = body;

    // Verify role belongs to user's company
    const existing = await prisma.role.findFirst({
      where: {
        id: roleId,
        companyId: user.companyId
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Role not found or access denied' },
        { status: 404 }
      );
    }

    // If departmentId is provided, verify it belongs to the user's company
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          companyId: user.companyId
        }
      });

      if (!department) {
        return NextResponse.json(
          { error: 'Department not found or access denied' },
          { status: 404 }
        );
      }
    }

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: {
        title,
        description,
        departmentId: departmentId || null
      },
      include: {
        department: true
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating role:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A role with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const roleId = resolvedParams.id;

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

    // Verify role belongs to user's company
    const existing = await prisma.role.findFirst({
      where: {
        id: roleId,
        companyId: user.companyId
      },
      include: {
        _count: {
          select: {
            interviewSessions: true,
            chatSessions: true,
            knowledgeArtifacts: true
          }
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Role not found or access denied' },
        { status: 404 }
      );
    }

    // Check if role has associated data
    const hasData = existing._count.interviewSessions > 0 || 
                   existing._count.chatSessions > 0 || 
                   existing._count.knowledgeArtifacts > 0;

    if (hasData) {
      return NextResponse.json(
        { error: 'Cannot delete role with associated interviews, chats, or artifacts. Please remove them first.' },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: roleId }
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}


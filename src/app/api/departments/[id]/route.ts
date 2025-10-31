import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const departmentId = resolvedParams.id;

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
    const { name, description } = body;

    // Verify department belongs to user's company
    const existing = await prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId: user.companyId
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Department not found or access denied' },
        { status: 404 }
      );
    }

    const updated = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name,
        description
      },
      include: {
        roles: true
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating department:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A department with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update department' },
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
    const departmentId = resolvedParams.id;

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

    // Verify department belongs to user's company
    const existing = await prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId: user.companyId
      },
      include: {
        roles: true
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Department not found or access denied' },
        { status: 404 }
      );
    }

    // Check if department has roles
    if (existing.roles.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with associated roles. Please reassign or delete roles first.' },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id: departmentId }
    });

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}


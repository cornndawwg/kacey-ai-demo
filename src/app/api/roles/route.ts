import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const roles = await prisma.role.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        department: true,
        interviewSessions: {
          include: {
            interviewResponses: true
          }
        },
        chatSessions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { title, description, departmentId } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
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

    const role = await prisma.role.create({
      data: {
        title,
        description,
        companyId: user.companyId!,
        departmentId: departmentId || null
      },
      include: {
        department: true
      }
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error: any) {
    console.error('Error creating role:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A role with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
});

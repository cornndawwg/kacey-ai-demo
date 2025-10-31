import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const departments = await prisma.department.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        roles: {
          include: {
            _count: {
              select: {
                interviewSessions: true,
                chatSessions: true,
                knowledgeArtifacts: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        description,
        companyId: user.companyId!
      },
      include: {
        roles: true
      }
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A department with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
});


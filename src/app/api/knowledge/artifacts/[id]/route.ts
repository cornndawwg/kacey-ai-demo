import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    const artifactId = params.id;

    if (!artifactId) {
      return NextResponse.json(
        { error: 'Artifact ID is required' },
        { status: 400 }
      );
    }

    const artifact = await prisma.knowledgeArtifact.findFirst({
      where: {
        id: artifactId,
        role: {
          companyId: user.companyId
        }
      },
      include: {
        knowledgeChunks: {
          orderBy: {
            chunkIndex: 'asc'
          }
        }
      }
    });

    if (!artifact) {
      return NextResponse.json(
        { error: 'Artifact not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(artifact);
  } catch (error) {
    console.error('Error fetching artifact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artifact' },
      { status: 500 }
    );
  }
});


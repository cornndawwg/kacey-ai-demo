import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 14+ vs 13)
    const resolvedParams = params instanceof Promise ? await params : params;
    const artifactId = resolvedParams.id;

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
}

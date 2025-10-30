import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { parseDocument, chunkText } from '@/lib/document-parser';

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const roleId = formData.get('roleId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Parse the document
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseDocument(buffer, file.type, file.name);

    // Create knowledge artifact
    const artifact = await prisma.knowledgeArtifact.create({
      data: {
        title: title || file.name,
        description: description || '',
        type: getArtifactType(file.type, file.name),
        content: parsed.content,
        metadata: parsed.metadata,
        roleId: roleId || null
      }
    });

    // Create chunks
    const chunks = chunkText(parsed.content, 500, 50);
    const chunkPromises = chunks.map((chunk, index) =>
      prisma.knowledgeChunk.create({
        data: {
          artifactId: artifact.id,
          content: chunk,
          chunkIndex: index,
          tokenCount: chunk.split(/\s+/).length,
          metadata: {
            artifactTitle: artifact.title,
            artifactType: artifact.type
          }
        }
      })
    );

    const createdChunks = await Promise.all(chunkPromises);

    return NextResponse.json({
      artifact,
      chunks: createdChunks,
      message: 'Document processed successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const artifacts = await prisma.knowledgeArtifact.findMany({
      where: {
        role: {
          companyId: user.companyId
        }
      },
      include: {
        chunks: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(artifacts);
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artifacts' },
      { status: 500 }
    );
  }
});

function getArtifactType(mimeType: string, filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (mimeType) {
    case 'application/pdf':
      return 'PDF';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return 'DOCX';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return 'XLSX';
    case 'text/csv':
      return 'CSV';
    case 'text/html':
      return 'HTML';
    case 'text/plain':
      return 'TXT';
    default:
      switch (extension) {
        case 'pdf':
          return 'PDF';
        case 'docx':
        case 'doc':
          return 'DOCX';
        case 'xlsx':
        case 'xls':
          return 'XLSX';
        case 'csv':
          return 'CSV';
        case 'html':
        case 'htm':
          return 'HTML';
        case 'txt':
          return 'TXT';
        default:
          return 'OTHER';
      }
  }
}

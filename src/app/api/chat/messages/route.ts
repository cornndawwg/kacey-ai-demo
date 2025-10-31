import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { searchSimilarChunks } from '@/lib/embeddings';
import { generateChatResponse } from '@/lib/openai';

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { sessionId, message, roleId } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user's company
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        role: {
          companyId: user.companyId
        }
      },
      include: {
        role: true,
        chatMessages: {
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

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: message
      }
    });

    // Search for relevant context
    // Use the roleId from the session if not provided
    const searchRoleId = roleId || session.roleId;
    console.log(`Chat message - session.roleId: ${session.roleId}, provided roleId: ${roleId}, using searchRoleId: ${searchRoleId}`);
    
    let similarChunks: Array<{ chunk: any; similarity: number }> = [];
    
    try {
      similarChunks = await searchSimilarChunks(message, 10, searchRoleId);
      console.log(`Found ${similarChunks.length} similar chunks for query: "${message.substring(0, 50)}..."`);
      
      if (similarChunks.length === 0) {
        console.warn('No chunks found! Checking if embeddings exist...');
        // Check if we have any embeddings at all
        const allEmbeddings = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM embeddings
        `;
        console.log(`Total embeddings available: ${allEmbeddings[0]?.count || 0}`);
        
        // Check if we have chunks for this role
        if (searchRoleId) {
          const roleChunks = await prisma.knowledgeChunk.findMany({
            where: {
              artifact: {
                roleId: searchRoleId
              }
            },
            include: {
              artifact: true
            },
            take: 5
          });
          console.log(`Found ${roleChunks.length} chunks for roleId ${searchRoleId}`);
          if (roleChunks.length > 0) {
            console.log(`Sample artifact: ${roleChunks[0]?.artifact?.title}`);
          }
        }
      }
    } catch (error) {
      console.error('Error searching similar chunks:', error);
      // Continue with empty context if search fails
      similarChunks = [];
    }
    
    // Map chunks to context format
    const contextChunks = similarChunks.map(result => ({
      content: result.chunk.content,
      metadata: {
        artifactTitle: result.chunk.metadata?.artifactTitle || result.chunk.metadata?.artifactTitle,
        artifactType: result.chunk.metadata?.artifactType || result.chunk.metadata?.artifactType,
        similarity: result.similarity
      }
    }));

    // Generate AI response
    const conversationHistory = session.chatMessages.map((msg: { role: string; content: string }) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content
    }));

    const aiResponse = await generateChatResponse(
      [
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      contextChunks
    );

    // Save AI response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: aiResponse.message,
        sources: aiResponse.sources,
        confidence: aiResponse.confidence
      }
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
      sources: aiResponse.sources
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
});

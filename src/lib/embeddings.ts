import OpenAI from 'openai';
import { prisma } from './prisma';
import { EmbeddingResult } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function generateEmbeddingsForChunk(chunkId: string): Promise<void> {
  try {
    const chunk = await prisma.knowledgeChunk.findUnique({
      where: { id: chunkId }
    });

    if (!chunk) {
      throw new Error('Chunk not found');
    }

    // Generate embedding
    const embedding = await generateEmbedding(chunk.content);

    // Store in database with pgvector
    await prisma.$executeRaw`
      INSERT INTO embeddings (id, "chunkId", vector, model, "createdAt")
      VALUES (${chunkId}, ${chunkId}, ${JSON.stringify(embedding)}::vector, 'text-embedding-3-small', NOW())
      ON CONFLICT (id) DO UPDATE SET
        vector = ${JSON.stringify(embedding)}::vector,
        model = 'text-embedding-3-small'
    `;

  } catch (error) {
    console.error('Error generating embeddings for chunk:', error);
    throw error;
  }
}

export async function generateEmbeddingsForArtifact(artifactId: string): Promise<void> {
  try {
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { artifactId }
    });

    for (const chunk of chunks) {
      await generateEmbeddingsForChunk(chunk.id);
    }

  } catch (error) {
    console.error('Error generating embeddings for artifact:', error);
    throw error;
  }
}

export async function searchSimilarChunks(
  query: string,
  limit: number = 10,
  roleId?: string
): Promise<Array<{
  chunk: any;
  similarity: number;
}>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar chunks using pgvector
    const results = await prisma.$queryRaw`
      SELECT 
        c.*,
        e.vector,
        1 - (e.vector <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      FROM knowledge_chunks c
      JOIN embeddings e ON c.id = e."chunkId"
      ${roleId ? prisma.$queryRaw`WHERE c."artifactId" IN (
        SELECT id FROM knowledge_artifacts WHERE "roleId" = ${roleId}
      )` : prisma.$queryRaw``}
      ORDER BY e.vector <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `;

    return results as Array<{
      chunk: any;
      similarity: number;
    }>;

  } catch (error) {
    console.error('Error searching similar chunks:', error);
    throw new Error('Failed to search similar chunks');
  }
}

export async function batchGenerateEmbeddings(): Promise<void> {
  try {
    // Find chunks without embeddings
    const chunksWithoutEmbeddings = await prisma.knowledgeChunk.findMany({
      where: {
        embeddings: {
          none: {}
        }
      },
      take: 100 // Process in batches
    });

    console.log(`Processing ${chunksWithoutEmbeddings.length} chunks without embeddings`);

    for (const chunk of chunksWithoutEmbeddings) {
      try {
        await generateEmbeddingsForChunk(chunk.id);
        console.log(`Generated embedding for chunk ${chunk.id}`);
      } catch (error) {
        console.error(`Failed to generate embedding for chunk ${chunk.id}:`, error);
      }
    }

  } catch (error) {
    console.error('Error in batch embedding generation:', error);
    throw error;
  }
}

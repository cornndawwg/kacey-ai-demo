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
    // Use chunkId as id for ON CONFLICT to work properly
    await prisma.$executeRaw`
      INSERT INTO embeddings (id, "chunkId", vector, model, "createdAt")
      VALUES (${chunkId}, ${chunkId}, ${JSON.stringify(embedding)}::vector, 'text-embedding-3-small', NOW())
      ON CONFLICT ("chunkId") DO UPDATE SET
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
    console.log(`Searching for: "${query}", roleId: ${roleId || 'none'}, limit: ${limit}`);
    
    // Check if embeddings exist first
    const embeddingsCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM embeddings
    `;
    console.log(`Total embeddings in database: ${embeddingsCount[0]?.count || 0}`);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingJson = JSON.stringify(queryEmbedding);
    console.log(`Generated query embedding of length: ${queryEmbedding.length}`);

    // Build query based on whether roleId is provided
    let results: any[];
    
    if (roleId) {
      console.log(`Searching with role filter: ${roleId}`);
      // Search with role filter
      // Note: Don't select e.vector directly - Prisma can't deserialize pgvector type
      // We only need the similarity score and chunk data
      results = await prisma.$queryRaw`
        SELECT
          c.*,
          1 - (e.vector <=> ${embeddingJson}::vector) as similarity
        FROM knowledge_chunks c
        JOIN embeddings e ON c.id = e."chunkId"
        JOIN knowledge_artifacts a ON c."artifactId" = a.id
        WHERE a."roleId" = ${roleId}
        ORDER BY e.vector <=> ${embeddingJson}::vector
        LIMIT ${limit}
      `;
    } else {
      console.log('Searching without role filter');
      // Search without role filter
      // Note: Don't select e.vector directly - Prisma can't deserialize pgvector type
      // We only need the similarity score and chunk data
      results = await prisma.$queryRaw`
        SELECT
          c.*,
          1 - (e.vector <=> ${embeddingJson}::vector) as similarity
        FROM knowledge_chunks c
        JOIN embeddings e ON c.id = e."chunkId"
        ORDER BY e.vector <=> ${embeddingJson}::vector
        LIMIT ${limit}
      `;
    }

    console.log(`Found ${results.length} results from search`);
    if (results.length > 0) {
      console.log(`Top result similarity: ${results[0]?.similarity}`);
      console.log(`Top result chunk preview: ${results[0]?.content?.substring(0, 100)}...`);
    }

    // Map results to the expected format
    // Note: We no longer select vector in the query, so we don't need to destructure it
    return results.map((row: any) => {
      const { similarity, ...chunk } = row;
      return {
        chunk,
        similarity: parseFloat(similarity) || 0
      };
    });

  } catch (error) {
    console.error('Error searching similar chunks:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    
    // Return empty array instead of throwing if tables don't exist yet
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes('relation "embeddings" does not exist') ||
      errorMessage.includes('relation "knowledge_chunks" does not exist') ||
      errorMessage.includes('relation "knowledge_artifacts" does not exist')
    ) {
      console.warn('Database tables do not exist yet, returning empty results. Please seed the database.');
      return [];
    }
    
    // If it's a Prisma error with code P2010 (raw query error), check the message
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      const metaMessage = prismaError.meta?.message || '';
      
      if (prismaError.code === 'P2010' && metaMessage.includes('does not exist')) {
        console.warn('Database tables missing, returning empty results. Please seed the database.');
        return [];
      }
      
      // Also check for P2021 (table does not exist) errors
      if (prismaError.code === 'P2021') {
        console.warn('Prisma table not found error, returning empty results. Please seed the database.');
        return [];
      }
    }
    
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

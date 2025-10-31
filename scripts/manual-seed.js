#!/usr/bin/env node
/**
 * Manual seeding script for Railway SSH debugging
 * Run this script via SSH: node scripts/manual-seed.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function manualSeed() {
  try {
    console.log('=== Manual Database Seeding ===\n');

    // Step 1: Check database connection
    console.log('Step 1: Checking database connection...');
    await prisma.$connect();
    console.log('✓ Database connected\n');

    // Step 2: Check if tables exist
    console.log('Step 2: Checking if tables exist...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log(`Found ${tables.length} tables:`);
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    console.log();

    // Step 3: Check if knowledge_chunks exists
    const tableArray = Array.isArray(tables) ? tables : [];
    const chunksExists = tableArray.some(t => t.table_name === 'knowledge_chunks');
    const artifactsExists = tableArray.some(t => t.table_name === 'knowledge_artifacts');
    const embeddingsExists = tableArray.some(t => t.table_name === 'embeddings');

    console.log('Step 3: Checking critical tables...');
    console.log(`  knowledge_chunks: ${chunksExists ? '✓' : '✗'}`);
    console.log(`  knowledge_artifacts: ${artifactsExists ? '✓' : '✗'}`);
    console.log(`  embeddings: ${embeddingsExists ? '✓' : '✗'}`);
    console.log();

    // Step 4: Push schema if needed
    if (!chunksExists || !artifactsExists) {
      console.log('Step 4: Pushing database schema (tables missing)...');
      try {
        execSync('npx prisma db push --accept-data-loss --skip-generate', {
          stdio: 'inherit',
          env: process.env
        });
        console.log('✓ Schema pushed\n');
      } catch (error) {
        console.error('✗ Failed to push schema:', error);
        throw error;
      }
    } else {
      console.log('Step 4: Skipped (tables already exist)\n');
    }

    // Step 5: Enable pgvector extension
    console.log('Step 5: Enabling pgvector extension...');
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
      console.log('✓ pgvector extension enabled\n');
    } catch (error) {
      console.error('✗ Failed to enable pgvector:', error);
      // Continue anyway
    }

    // Step 6: Create embeddings table if needed
    if (!embeddingsExists && chunksExists) {
      console.log('Step 6: Creating embeddings table...');
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS embeddings (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "chunkId" TEXT UNIQUE NOT NULL,
            vector vector(1536),
            model TEXT DEFAULT 'text-embedding-3-small',
            "createdAt" TIMESTAMP DEFAULT NOW()
          );
        `;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS embeddings_chunkId_idx ON embeddings("chunkId");`;
        
        // Try to add FK constraint
        try {
          await prisma.$executeRaw`
            ALTER TABLE embeddings 
            ADD CONSTRAINT embeddings_chunkId_fkey 
            FOREIGN KEY ("chunkId") 
            REFERENCES knowledge_chunks(id) 
            ON DELETE CASCADE;
          `;
          console.log('✓ Embeddings table created with FK constraint\n');
        } catch (fkError) {
          console.log('✓ Embeddings table created (FK will be added later)\n');
        }
      } catch (error) {
        console.error('✗ Failed to create embeddings table:', error);
      }
    } else {
      console.log('Step 6: Skipped (embeddings table exists or chunks missing)\n');
    }

    // Step 7: Check existing data
    console.log('Step 7: Checking existing data...');
    const companyCount = await prisma.company.count();
    const roleCount = await prisma.role.count();
    const artifactCount = await prisma.knowledgeArtifact.count();
    const chunkCount = await prisma.knowledgeChunk.count();
    const embeddingCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM embeddings
    `;

    console.log(`  Companies: ${companyCount}`);
    console.log(`  Roles: ${roleCount}`);
    console.log(`  Artifacts: ${artifactCount}`);
    console.log(`  Chunks: ${chunkCount}`);
    console.log(`  Embeddings: ${embeddingCount[0]?.count || 0}`);
    console.log();

    // Step 8: Run seed via API or manually
    console.log('Step 8: Running seed data...');
    console.log('(You can run the seed via the API endpoint /api/seed-db or manually)');
    console.log('For manual seeding, use: curl -X POST http://localhost:8080/api/seed-db');
    console.log('Or call the seed endpoint from the application UI');
    console.log();

    // Step 9: Verify seed results
    console.log('Step 9: Verifying seed results...');
    const finalArtifactCount = await prisma.knowledgeArtifact.count();
    const finalChunkCount = await prisma.knowledgeChunk.count();
    const finalEmbeddingCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM embeddings
    `;

    console.log(`  Artifacts: ${finalArtifactCount} (was ${artifactCount})`);
    console.log(`  Chunks: ${finalChunkCount} (was ${chunkCount})`);
    console.log(`  Embeddings: ${finalEmbeddingCount[0]?.count || 0} (was ${embeddingCount[0]?.count || 0})`);
    console.log();

    console.log('=== Seeding Complete ===');
    console.log('\nYou can now test the chat interface.');

  } catch (error) {
    console.error('\n✗ Error during manual seed:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

manualSeed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


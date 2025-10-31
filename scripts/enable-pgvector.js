#!/usr/bin/env node
/**
 * Enable pgvector extension using Prisma (no psql needed)
 * Run: node scripts/enable-pgvector.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enablePgvector() {
  try {
    console.log('=== Enabling pgvector Extension ===\n');

    // Check if extension already exists
    const extensions = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname = 'vector';
    `;

    const extArray = Array.isArray(extensions) ? extensions : [];
    
    if (extArray.length > 0) {
      console.log('✓ pgvector extension is already enabled');
    } else {
      console.log('Enabling pgvector extension...');
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
      console.log('✓ pgvector extension enabled successfully');
    }

    // Verify it's enabled
    const verifyExt = await prisma.$queryRaw`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
    `;
    const verifyArray = Array.isArray(verifyExt) ? verifyExt : [];
    if (verifyArray.length > 0) {
      console.log(`✓ Extension version: ${verifyArray[0].extversion || 'unknown'}`);
    }

    console.log('\n=== Complete ===');

  } catch (error) {
    console.error('\n✗ Error enabling pgvector:', error);
    console.error('Details:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enablePgvector().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


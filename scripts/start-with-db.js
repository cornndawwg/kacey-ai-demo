#!/usr/bin/env node
const { execSync } = require('child_process');
const { spawn } = require('child_process');

async function startWithDb() {
  try {
    console.log('Pushing database schema...');
    // Force push schema - use --force-reset to ensure tables are created
    // Accept data loss for embeddings table since it's managed separately
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss --force-reset', { 
        stdio: 'inherit',
        env: process.env
      });
    } catch (forceError) {
      // If force-reset fails, try without it
      console.log('Force reset failed, trying normal push...');
      execSync('npx prisma db push --skip-generate --accept-data-loss', { 
        stdio: 'inherit',
        env: process.env
      });
    }
    console.log('Database schema pushed successfully');
    
    // Verify tables exist
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Check if knowledge_chunks exists
      const chunksCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'knowledge_chunks'
        );
      `;
      
      if (!chunksCheck[0]?.exists) {
        console.warn('WARNING: knowledge_chunks table still missing after push!');
        console.warn('Tables may not have been created. Try seeding the database.');
      } else {
        console.log('Verified: knowledge_chunks table exists');
      }
      
      await prisma.$disconnect();
    } catch (checkError) {
      console.error('Could not verify database state:', checkError.message);
    }
  } catch (error) {
    console.error('Warning: Database push failed, but continuing with server start...');
    console.error(error.message);
  }

  console.log('Starting Next.js server...');
  const server = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });

  server.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  server.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Forward termination signals
  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    server.kill('SIGINT');
  });
}

startWithDb();


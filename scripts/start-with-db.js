#!/usr/bin/env node
const { execSync } = require('child_process');
const { spawn } = require('child_process');

async function startWithDb() {
  try {
    console.log('Pushing database schema...');
    // Accept data loss for embeddings table since it's managed separately
    execSync('npx prisma db push --skip-generate --accept-data-loss', { 
      stdio: 'inherit',
      env: process.env
    });
    console.log('Database schema pushed successfully');
  } catch (error) {
    console.error('Warning: Database push failed, but continuing with server start...');
    console.error(error.message);
    
    // Try to create missing tables manually if push completely failed
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
        console.log('Knowledge chunks table missing, but Prisma push should have created it.');
        console.log('You may need to seed the database using the /api/seed-db endpoint.');
      }
      
      await prisma.$disconnect();
    } catch (checkError) {
      console.error('Could not check database state:', checkError.message);
    }
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


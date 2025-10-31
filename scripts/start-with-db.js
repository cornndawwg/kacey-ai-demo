#!/usr/bin/env node
const { execSync } = require('child_process');
const { spawn } = require('child_process');

async function startWithDb() {
  try {
    console.log('Pushing database schema...');
    execSync('npx prisma db push --skip-generate', { 
      stdio: 'inherit',
      env: process.env
    });
    console.log('Database schema pushed successfully');
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


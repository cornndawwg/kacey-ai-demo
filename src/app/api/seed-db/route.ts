import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { seedDemoData } from '@/lib/seed-data';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database seeding...');

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (connectError) {
      console.error('Database connection failed:', connectError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          details: connectError instanceof Error ? connectError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Try to query a table to see if schema exists
    try {
      await prisma.company.findFirst();
      console.log('Database schema exists');
    } catch (schemaError: any) {
      // If schema doesn't exist, try to inform user
      if (schemaError.code === 'P2021' || schemaError.message?.includes('does not exist')) {
        console.error('Database tables do not exist. Please run: npx prisma db push');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database tables do not exist',
            details: 'Please ensure the database schema has been pushed. Run: npx prisma db push',
            hint: 'On Railway, you may need to run prisma db push during deployment'
          },
          { status: 500 }
        );
      }
      throw schemaError;
    }

    // Ensure pgvector extension is enabled and embeddings table has vector type
    try {
      console.log('Setting up pgvector extension...');
      // Enable pgvector extension
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
      
      // Check if embeddings table exists and has the correct structure
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'embeddings'
        );
      `;
      
      const exists = (tableExists as any[])[0]?.exists;
      
      if (!exists) {
        // Create embeddings table with vector type
        console.log('Creating embeddings table with vector type...');
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS embeddings (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "chunkId" TEXT UNIQUE NOT NULL,
            vector vector(1536),
            model TEXT DEFAULT 'text-embedding-3-small',
            "createdAt" TIMESTAMP DEFAULT NOW(),
            CONSTRAINT embeddings_chunkId_fkey FOREIGN KEY ("chunkId") REFERENCES knowledge_chunks(id) ON DELETE CASCADE
          );
        `;
        
        // Create index
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS embeddings_chunkId_idx ON embeddings("chunkId");`;
        console.log('Embeddings table created successfully');
      } else {
        // Check if vector column exists and is the right type
        const columnCheck = await prisma.$queryRaw`
          SELECT data_type FROM information_schema.columns 
          WHERE table_name = 'embeddings' AND column_name = 'vector';
        `;
        
        const columnType = (columnCheck as any[])[0]?.data_type;
        
        if (columnType !== 'USER-DEFINED' || !columnType) {
          console.log('Updating embeddings table to use vector type...');
          // Drop the old column and recreate with vector type
          await prisma.$executeRaw`ALTER TABLE embeddings DROP COLUMN IF EXISTS vector;`;
          await prisma.$executeRaw`ALTER TABLE embeddings ADD COLUMN vector vector(1536);`;
          console.log('Embeddings table updated to use vector type');
        } else {
          console.log('Embeddings table already has vector type');
        }
      }
    } catch (pgvectorError: any) {
      console.error('Error setting up pgvector:', pgvectorError);
      // Continue anyway - might already be set up
    }

    // Create demo company
    const company = await prisma.company.upsert({
      where: { name: 'TechCorp Demo' },
      update: {},
      create: { name: 'TechCorp Demo' }
    });

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@kacey-ai.com' },
      update: {},
      create: {
        email: 'admin@kacey-ai.com',
        password: adminPassword,
        role: 'ADMIN',
        companyId: company.id
      }
    });

    // Create employee user
    const employeePassword = await hashPassword('admin123');
    const employeeUser = await prisma.user.upsert({
      where: { email: 'employee@kacey-ai.com' },
      update: {},
      create: {
        email: 'employee@kacey-ai.com',
        password: employeePassword,
        role: 'EMPLOYEE',
        companyId: company.id
      }
    });

    // Seed demo data (company, role, artifacts, interviews)
    const seedResult = await seedDemoData();
    
    console.log('Database seeding completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        company: company.name,
        users: {
          admin: adminUser.email,
          employee: employeeUser.email
        },
        seedData: seedResult
      },
      credentials: {
        admin: 'admin@kacey-ai.com / admin123',
        employee: 'employee@kacey-ai.com / admin123'
      }
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

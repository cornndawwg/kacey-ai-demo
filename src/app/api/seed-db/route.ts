import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { seedDemoData } from '@/lib/seed-data';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database seeding...');

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
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

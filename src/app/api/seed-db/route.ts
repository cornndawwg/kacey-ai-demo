import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('ðŸŒ± Starting database seeding...');

    // Create demo company
    const company = await prisma.company.upsert({
      where: { name: 'TechCorp Demo' },
      update: {},
      create: { name: 'TechCorp Demo' }
    });
    console.log('âœ… Created company:', company.name);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@kacey-ai.com' },
      update: {},
      create: {
        email: 'admin@kacey-ai.com',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company.id
      }
    });
    console.log('âœ… Created admin user:', adminUser.email);

    // Create employee user
    const employeeUser = await prisma.user.upsert({
      where: { email: 'employee@kacey-ai.com' },
      update: {},
      create: {
        email: 'employee@kacey-ai.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
        companyId: company.id
      }
    });
    console.log('âœ… Created employee user:', employeeUser.email);

    console.log('ðŸŽ‰ Database seeding completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      credentials: {
        admin: 'admin@kacey-ai.com / admin123',
        employee: 'employee@kacey-ai.com / admin123'
      }
    });

  } catch (error) {
    console.error('âŒ Error seeding database:', error);
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

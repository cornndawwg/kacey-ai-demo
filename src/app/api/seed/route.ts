import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware';
import { seedDemoData } from '@/lib/seed-data';

export const POST = withAdminAuth(async (request: NextRequest, user: any) => {
  try {
    const result = await seedDemoData();
    
    return NextResponse.json({
      message: 'Demo data seeded successfully',
      data: result
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json(
      { error: 'Failed to seed demo data' },
      { status: 500 }
    );
  }
});

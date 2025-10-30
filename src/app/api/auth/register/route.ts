import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { hashPassword, createAuthResponse } from '../../../lib/auth';
import { RegisterData } from '../../../../types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json();
    const { email, password, role, companyName } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create or find company
    let company;
    if (companyName) {
      company = await prisma.company.upsert({
        where: { name: companyName },
        update: {},
        create: { name: companyName }
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        companyId: company?.id
      },
      include: { company: true }
    });

    // Create auth response
    const authResponse = createAuthResponse({
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'EMPLOYEE',
      companyId: user.companyId || undefined
    });

    return NextResponse.json(authResponse, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
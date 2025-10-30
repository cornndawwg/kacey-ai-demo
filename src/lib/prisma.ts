// Import PrismaClient from generated location (Railway requires custom output path)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - TypeScript module resolution for custom Prisma output path
import { PrismaClient } from '../../node_modules/.prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

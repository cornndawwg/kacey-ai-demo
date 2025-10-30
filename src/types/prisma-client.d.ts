// Type declaration for Prisma client with custom output path
// This makes TypeScript recognize PrismaClient when importing from the generated location
declare module '../../node_modules/.prisma/client' {
  // Re-export everything that Prisma generates
  export * from '@prisma/client/runtime';
}

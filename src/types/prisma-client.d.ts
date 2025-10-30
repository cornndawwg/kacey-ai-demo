// Type declaration for @prisma/client with custom output path
// This makes TypeScript recognize PrismaClient when the client is generated to a custom location

declare module '@prisma/client' {
  // Import the actual types from the generated location
  // Use dynamic import to avoid circular dependency issues
  import type * as GeneratedPrisma from '../../node_modules/.prisma/client';
  
  // Re-export PrismaClient
  export const PrismaClient: typeof GeneratedPrisma.PrismaClient;
  export type PrismaClient = GeneratedPrisma.PrismaClient;
  
  // Re-export all other types
  export * from '../../node_modules/.prisma/client';
}

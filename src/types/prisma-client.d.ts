// Type declaration for Prisma client with custom output path
// Tells TypeScript that the module at this path exists and exports PrismaClient
// The actual types are in the generated Prisma client files

declare module '../../node_modules/.prisma/client' {
  import type { PrismaClient as BasePrismaClient } from '@prisma/client';
  
  export { BasePrismaClient as PrismaClient };
  
  // Also export all other Prisma types
  export type PrismaClient = BasePrismaClient;
}

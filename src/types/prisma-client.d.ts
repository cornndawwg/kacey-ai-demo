// Type declaration for @prisma/client with custom output path
// Prisma generates to node_modules/.prisma/client, this tells TypeScript where to find it

declare module '@prisma/client' {
  // The actual PrismaClient class and types are generated in node_modules/.prisma/client
  // This declaration tells TypeScript to look there for the types
  // We can't use a relative path import here, so we reference it differently
  
  // Declare that PrismaClient exists and is a constructor
  // TypeScript will merge this with any existing types it finds
  export class PrismaClient {
    constructor(options?: any);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    [key: string]: any;
  }
  
  // All other Prisma types come from the generated files
  // TypeScript will automatically find them in node_modules/.prisma/client
}

// Type declaration to make @prisma/client work with custom output path
// This tells TypeScript that @prisma/client re-exports from the generated location

declare module '@prisma/client' {
  // Re-export everything from the generated Prisma client
  // TypeScript will find the actual types in node_modules/.prisma/client
  export * from '../../node_modules/.prisma/client';
}

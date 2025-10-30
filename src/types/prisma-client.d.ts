// Type declarations for Prisma client with custom output path
// Map @prisma/client to generated location
declare module '@prisma/client' {
  export * from '../../node_modules/.prisma/client';
}

// Also declare the direct path module
declare module '../../node_modules/.prisma/client' {
  export * from '@prisma/client/runtime/library';
  export * from '.prisma/client';
}


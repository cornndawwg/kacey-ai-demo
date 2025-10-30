// Type declaration for @prisma/client with custom output path
// Tells TypeScript where to find PrismaClient when using custom output location

declare module '@prisma/client' {
  export { PrismaClient, Prisma } from '../../node_modules/.prisma/client/index';
  export * from '../../node_modules/.prisma/client/index';
}


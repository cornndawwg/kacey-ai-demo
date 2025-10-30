// Type declaration for Prisma client with custom output path
// This tells TypeScript that the module at '../../node_modules/.prisma/client' exists
// The actual types come from Prisma's generated files, we just need TypeScript to recognize the module path

declare module '../../node_modules/.prisma/client' {
  // TypeScript will automatically pick up the actual generated types
  // We just need to declare that this module path exists
  const PrismaClient: new (options?: any) => any;
  export { PrismaClient };
}

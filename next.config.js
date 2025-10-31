/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx', 'cheerio', '@prisma/client', '.prisma/client'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    // Map @prisma/client and .prisma/client to generated location for custom output path
    const prismaClientPath = require('path').resolve(__dirname, 'node_modules/.prisma/client');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@prisma/client': prismaClientPath,
      // Alias .prisma/client (used by @prisma/client internal requires)
      '.prisma/client': prismaClientPath,
      // Also alias the specific default path that @prisma/client/default.js requires
      '.prisma/client/default': require('path').resolve(prismaClientPath, 'default'),
      // Alias for client.ts -> client.js resolution
      [require('path').resolve(prismaClientPath, 'client')]: require('path').resolve(prismaClientPath, 'client.ts'),
    };
    
    // Add support for TypeScript files in the Prisma client directory
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Ensure TypeScript files in .prisma/client are transpiled
    config.module.rules.push({
      test: /\.ts$/,
      include: [prismaClientPath],
      use: {
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {
            module: 'commonjs',
            target: 'es2020',
          },
        },
      },
    });
    
    return config;
  },
}

module.exports = nextConfig

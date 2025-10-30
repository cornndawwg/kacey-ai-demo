/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx', 'cheerio'],
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
      '.prisma/client/default': require('path').resolve(prismaClientPath, 'index'),
    };
    return config;
  },
}

module.exports = nextConfig

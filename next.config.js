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
      // Also alias .prisma/client (used by @prisma/client internal requires)
      // The leading dot is important - this matches the require path in @prisma/client/default.js
      '.prisma/client': prismaClientPath,
      // Also try without the leading dot
      'prisma/client': prismaClientPath,
    };
    
    // Ensure .prisma/client can be resolved as a module
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      require('path').resolve(__dirname, 'node_modules'),
    ];
    return config;
  },
}

module.exports = nextConfig

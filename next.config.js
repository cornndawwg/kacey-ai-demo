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
    // Ensure Prisma client is resolved correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      // Map both @prisma/client and direct path to generated location
      '@prisma/client': require('path').resolve(__dirname, 'node_modules/.prisma/client'),
    };
    return config;
  },
}

module.exports = nextConfig

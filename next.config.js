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
    // Map @prisma/client to generated client location
    config.resolve.alias = {
      ...config.resolve.alias,
      '@prisma/client': require('path').resolve(__dirname, 'node_modules/.prisma/client'),
    };
    return config;
  },
}

module.exports = nextConfig

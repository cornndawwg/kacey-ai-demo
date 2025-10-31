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
    };
    
    // Enable transpilation of TypeScript files in .prisma/client
    // Next.js will use SWC to transpile these files
    config.module = config.module || {};
    const originalRules = config.module.rules || [];
    
    // Find the TypeScript rule and modify it to include .prisma/client
    config.module.rules = originalRules.map((rule) => {
      if (rule && rule.test && rule.test.toString().includes('tsx?') && rule.use && Array.isArray(rule.use)) {
        return {
          ...rule,
          include: [
            ...(rule.include || []),
            prismaClientPath,
          ],
        };
      }
      return rule;
    });
    
    return config;
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages that should not be bundled (server-side only)
  serverExternalPackages: [
    'pdf-parse',
    'mammoth',
    'xlsx',
    'cheerio',
    '@prisma/client',
  ],
  
  // Turbopack configuration (Next.js 16 default)
  turbopack: {
    // Empty config to silence the Turbopack/webpack warning
    // Turbopack handles most things automatically
  },
}

module.exports = nextConfig

// Post-Prisma generate script to ensure @prisma/client can find the generated client
// This creates the structure that @prisma/client expects for custom output paths

const fs = require('fs');
const path = require('path');

const generatedPath = path.resolve(__dirname, '../node_modules/.prisma/client');
const defaultJsPath = path.resolve(generatedPath, 'default.js');
const indexJsPath = path.resolve(generatedPath, 'index.js');
const indexDtsPath = path.resolve(generatedPath, 'index.d.ts');

console.log('Post-Prisma generate: Checking generated client structure...');
console.log('Generated path:', generatedPath);
console.log('index.js exists:', fs.existsSync(indexJsPath));
console.log('default.js exists:', fs.existsSync(defaultJsPath));

// Always ensure default.js exists (recreate if needed)
if (!fs.existsSync(generatedPath)) {
  console.error('❌ Generated Prisma client path does not exist:', generatedPath);
  process.exit(1);
}

// List all files in the generated directory for debugging
const files = fs.readdirSync(generatedPath);
console.log('Files in generated client:', files.slice(0, 10));

// Prisma generates client.js (or client.ts compiled to JS) as the entry point
// Find the main entry file - Prisma uses client.js/client.ts, not index.js
const entryFile = files.find(f => f === 'client.js' || f === 'client.ts' || f === 'client.mjs');
console.log('Entry file found:', entryFile);

// If no compiled JS version, try to find the compiled version or use client.ts
let entryPoint = 'client';
if (entryFile) {
  entryPoint = entryFile.replace(/\.(js|ts|mjs)$/, '');
} else {
  // Prisma generates client.ts, which gets compiled to client.js
  // Use 'client' as the entry point (Node.js will resolve client.js or client)
  entryPoint = 'client';
  console.log('Using default entry point: client');
}

// Create default.js that re-exports from the client entry file
const defaultContent = `// Auto-generated file for @prisma/client compatibility with custom output path
// This file allows @prisma/client/default.js to require('.prisma/client/default')
module.exports = require('./${entryPoint}');
`;

fs.writeFileSync(defaultJsPath, defaultContent);
console.log('✅ Created default.js that re-exports from', entryPoint);

// Also create default.d.ts if client.ts exists
const clientTsPath = path.resolve(generatedPath, 'client.ts');
if (fs.existsSync(clientTsPath)) {
  const defaultDtsContent = `// Auto-generated type definitions
export * from './client';
`;
  fs.writeFileSync(path.resolve(generatedPath, 'default.d.ts'), defaultDtsContent);
  console.log('✅ Created default.d.ts');
}


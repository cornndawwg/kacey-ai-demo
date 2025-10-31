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

// Prisma generates client.ts, but we need to check if there's a compiled JS version
// Check for both client.js (compiled) and client.ts (source)
const clientJsExists = files.includes('client.js');
const clientTsExists = files.includes('client.ts');
console.log('client.js exists:', clientJsExists);
console.log('client.ts exists:', clientTsExists);

let entryPoint;
if (clientJsExists) {
  // Use the compiled JS version if it exists
  entryPoint = 'client';
  console.log('Using client.js as entry point');
} else if (clientTsExists) {
  // Prisma generates client.ts, but Node.js can't require .ts files directly
  // We need to check what Prisma actually exports or create a wrapper
  // Let's check the package.json in the generated client to see the main entry
  const packageJsonPath = path.resolve(generatedPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    entryPoint = packageJson.main || packageJson.exports?.['.'] || 'index';
    console.log('Using package.json main:', entryPoint);
  } else {
    // Check if there's an index.js that might be the entry
    if (files.includes('index.js')) {
      entryPoint = 'index';
      console.log('Using index.js as entry point');
    } else {
      // Fallback: try to read client.ts and create a wrapper that works
      // Actually, Prisma's generated client.ts might export things we can use
      // But at runtime, we need JS. Let's check what's in the package.json of @prisma/client
      entryPoint = 'client';
      console.log('Using client as entry point (will be resolved by bundler/transpiler)');
    }
  }
} else {
  console.error('❌ No client.js or client.ts found in generated client');
  process.exit(1);
}

// Create default.js that re-exports from the client entry file
// Since Prisma generates .ts files but we need JS at runtime, we'll use require
// and let the TypeScript compiler/bundler handle it, or use dynamic require
const defaultContent = `// Auto-generated file for @prisma/client compatibility with custom output path
// This file allows @prisma/client/default.js to require('.prisma/client/default')

// Try to require client.js first, then fall back to client
let clientModule;
try {
  clientModule = require('./client.js');
} catch (e) {
  try {
    // If client.js doesn't exist, try requiring without extension (for .ts files that are transpiled)
    clientModule = require('./client');
  } catch (e2) {
    // Final fallback: try index
    clientModule = require('./index');
  }
}

module.exports = clientModule;
`;

fs.writeFileSync(defaultJsPath, defaultContent);
console.log('✅ Created default.js that tries to require from client with fallbacks');

// Also create default.d.ts if client.ts exists
const clientTsPath = path.resolve(generatedPath, 'client.ts');
if (fs.existsSync(clientTsPath)) {
  const defaultDtsContent = `// Auto-generated type definitions
export * from './client';
`;
  fs.writeFileSync(path.resolve(generatedPath, 'default.d.ts'), defaultDtsContent);
  console.log('✅ Created default.d.ts');
}


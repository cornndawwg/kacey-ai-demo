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

// Prisma generates client.ts, but Node.js needs JS at runtime
// Check what files exist and find the actual entry point
const clientJsExists = files.includes('client.js');
const clientTsExists = files.includes('client.ts');
const indexJsExists = files.includes('index.js');
console.log('client.js exists:', clientJsExists);
console.log('client.ts exists:', clientTsExists);
console.log('index.js exists:', indexJsExists);

// Check for package.json to see what Prisma considers the main entry
const packageJsonPath = path.resolve(generatedPath, 'package.json');
let packageJson = null;
if (fs.existsSync(packageJsonPath)) {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('package.json main:', packageJson.main);
  console.log('package.json exports:', packageJson.exports);
}

// Prisma with custom output path should generate index.js that re-exports from client
// If index.js doesn't exist, we need to create it
if (!indexJsExists && clientTsExists) {
  // Create index.js that re-exports from client.ts
  // Since Prisma generates client.ts, we need to check if there's a way to load it
  // Actually, Prisma might generate the client in a way that Next.js/webpack can handle
  // But at runtime, we need JS. Let's check if there's a compiled version or use a workaround
  // The key is that @prisma/client expects to load from .prisma/client, and it should handle TS
  // But for now, let's just re-export from client - Next.js should handle the transpilation
  const indexContent = `// Auto-generated index.js for Prisma client
// This file re-exports from client.ts, which is the generated Prisma client
// Note: client.ts will be transpiled by Next.js/webpack at build time
module.exports = require('./client');
`;
  const indexJsPath = path.resolve(generatedPath, 'index.js');
  fs.writeFileSync(indexJsPath, indexContent);
  console.log('✅ Created index.js that re-exports from client');
  
  // Also create index.d.ts for TypeScript
  if (fs.existsSync(path.resolve(generatedPath, 'client.ts'))) {
    const indexDtsContent = `// Auto-generated index.d.ts for Prisma client
export * from './client';
`;
    fs.writeFileSync(path.resolve(generatedPath, 'index.d.ts'), indexDtsContent);
    console.log('✅ Created index.d.ts');
  }
}

// Now create default.js that re-exports from index.js (or client.js if index doesn't exist)
// The default.js file is what @prisma/client/default.js requires
let defaultContent;
if (indexJsExists || (!indexJsExists && clientTsExists)) {
  // Use index.js as the entry point (this is what Prisma expects)
  defaultContent = `// Auto-generated file for @prisma/client compatibility with custom output path
// This file allows @prisma/client/default.js to require('.prisma/client/default')
module.exports = require('./index');
`;
} else if (clientJsExists) {
  // Fallback to client.js if index.js doesn't exist
  defaultContent = `// Auto-generated file for @prisma/client compatibility with custom output path
module.exports = require('./client');
`;
} else {
  console.error('❌ No suitable entry point found (index.js, client.js, or client.ts)');
  process.exit(1);
}

fs.writeFileSync(defaultJsPath, defaultContent);
console.log('✅ Created default.js that re-exports from', indexJsExists || (!indexJsExists && clientTsExists) ? 'index' : 'client');

// Also create default.d.ts if client.ts exists
const clientTsPath = path.resolve(generatedPath, 'client.ts');
if (fs.existsSync(clientTsPath)) {
  const defaultDtsContent = `// Auto-generated type definitions
export * from './client';
`;
  fs.writeFileSync(path.resolve(generatedPath, 'default.d.ts'), defaultDtsContent);
  console.log('✅ Created default.d.ts');
}


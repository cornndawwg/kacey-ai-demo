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

// Find the main entry file (could be index.js, index.mjs, or something else)
const entryFile = files.find(f => f.startsWith('index.') && (f.endsWith('.js') || f.endsWith('.mjs')));
console.log('Entry file found:', entryFile);

if (!entryFile) {
  console.error('❌ No entry file (index.js or index.mjs) found in generated client');
  process.exit(1);
}

// Create default.js that re-exports from the entry file
const entryName = entryFile.replace(/\.(js|mjs)$/, '');
const defaultContent = `// Auto-generated file for @prisma/client compatibility with custom output path
// This file allows @prisma/client/default.js to require('.prisma/client/default')
module.exports = require('./${entryName}');
`;

fs.writeFileSync(defaultJsPath, defaultContent);
console.log('✅ Created default.js that re-exports from', entryFile);

// Also create default.d.ts if index.d.ts exists
if (fs.existsSync(indexDtsPath)) {
  const defaultDtsContent = `// Auto-generated type definitions
export * from './index';
`;
  fs.writeFileSync(path.resolve(generatedPath, 'default.d.ts'), defaultDtsContent);
  console.log('✅ Created default.d.ts');
}


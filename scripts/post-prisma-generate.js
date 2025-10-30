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

// Check if default.js exists, if not create it
if (!fs.existsSync(defaultJsPath)) {
  // Create default.js that re-exports everything from index.js
  const defaultContent = `// Auto-generated file for @prisma/client compatibility with custom output path
// This file allows @prisma/client/default.js to require('.prisma/client/default')
module.exports = require('./index');
`;
  
  fs.writeFileSync(defaultJsPath, defaultContent);
  console.log('✅ Created default.js');
  
  // Also create default.d.ts if index.d.ts exists
  if (fs.existsSync(indexDtsPath)) {
    const defaultDtsContent = `// Auto-generated type definitions
export * from './index';
`;
    fs.writeFileSync(path.resolve(generatedPath, 'default.d.ts'), defaultDtsContent);
    console.log('✅ Created default.d.ts');
  }
} else {
  console.log('✅ default.js already exists');
}


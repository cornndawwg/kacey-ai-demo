// Post-Prun generate script to ensure @prisma/client can find the generated client
// This creates the structure that @prisma/client expects for custom output paths

const fs = require('fs');
const path = require('path');

const generatedPath = path.resolve(__dirname, '../node_modules/.prisma/client');
const defaultJsPath = path.resolve(generatedPath, 'default.js');
const indexJsPath = path.resolve(generatedPath, 'index.js');

// Check if default.js exists, if not create it as a re-export from index.js
if (!fs.existsSync(defaultJsPath) && fs.existsSync(indexJsPath)) {
  // Read the index.js to see what it exports
  const indexContent = fs.readFileSync(indexJsPath, 'utf8');
  
  // Create default.js that re-exports everything from index.js
  const defaultContent = `// Auto-generated file for @prisma/client compatibility
module.exports = require('./index');
`;
  
  fs.writeFileSync(defaultJsPath, defaultContent);
  console.log('Created default.js for Prisma client compatibility');
}


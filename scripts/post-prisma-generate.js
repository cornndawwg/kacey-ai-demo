// Post-Prisma generate script to ensure @prisma/client can find the generated client
// This creates the structure that @prisma/client expects for custom output paths

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
// Note: We may need to create client.js from client.ts
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

// Prisma generates client.ts but Node.js needs client.js at runtime
// We need to compile client.ts to client.js, or create a wrapper
// Since TypeScript is available, let's check if we can use ts-node or just create a wrapper
// Actually, let's try a different approach: create index.js that directly re-exports
// from the models/index that Prisma generates, or we compile client.ts

// First, let's check if we can find what Prisma actually exports
const clientTsPath = path.resolve(generatedPath, 'client.ts');
const clientJsPath = path.resolve(generatedPath, 'client.js');

// If client.ts exists but client.js doesn't, we need to compile it
if (clientTsExists && !clientJsExists) {
  console.log('⚠️  client.ts exists but client.js does not - Node.js cannot require .ts files');
  console.log('Compiling client.ts to client.js using TypeScript compiler...');
  
  try {
    // Use TypeScript compiler to compile client.ts to client.js
    // First check if tsc is available
    const tscPath = path.resolve(__dirname, '../node_modules/.bin/tsc');
    const tscExists = fs.existsSync(tscPath) || require.resolve('typescript');
    
    if (tscExists) {
      // Create a temporary tsconfig for compilation
      const tempTsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          declaration: false,
          outDir: generatedPath,
          rootDir: generatedPath,
          strict: false,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
        },
        include: ['client.ts'],
      };
      
      const tempTsConfigPath = path.resolve(generatedPath, 'temp-tsconfig.json');
      fs.writeFileSync(tempTsConfigPath, JSON.stringify(tempTsConfig, null, 2));
      
      try {
        // Try to compile using tsc
        execSync(`npx tsc --project ${tempTsConfigPath}`, {
          cwd: generatedPath,
          stdio: 'pipe',
        });
        
        // Check if client.js was created
        if (fs.existsSync(clientJsPath)) {
          console.log('✅ Compiled client.ts to client.js using TypeScript');
          fs.unlinkSync(tempTsConfigPath); // Clean up
        } else {
          throw new Error('TypeScript compilation did not produce client.js');
        }
      } catch (compileError) {
        console.log('⚠️  TypeScript compilation failed, using fallback wrapper');
        fs.unlinkSync(tempTsConfigPath); // Clean up
        throw compileError;
      }
    } else {
      throw new Error('TypeScript compiler not found');
    }
  } catch (error) {
    console.log('⚠️  Could not compile client.ts, creating CommonJS wrapper');
    // Fallback: create a wrapper that uses the internal models/index that Prisma generates
    // Prisma generates client.ts but also generates compiled files in the internal directory
    const modelsPath = path.resolve(generatedPath, 'models');
    if (fs.existsSync(modelsPath)) {
      // Try to use models/index.js or models/index.ts
      const modelsIndexJs = path.resolve(modelsPath, 'index.js');
      const modelsIndexTs = path.resolve(modelsPath, 'index.ts');
      
      if (fs.existsSync(modelsIndexJs)) {
        const clientJsContent = `// Auto-generated client.js wrapper for Prisma client
// Re-exports from Prisma's generated models
module.exports = require('./models/index');
`;
        fs.writeFileSync(clientJsPath, clientJsContent);
        console.log('✅ Created client.js wrapper using models/index.js');
      } else {
        // Final fallback: simple re-export (webpack will need to handle this)
        const clientJsContent = `// Auto-generated client.js wrapper for Prisma client
// WARNING: This requires webpack to transpile client.ts during build
// If you see errors, ensure webpack is configured to handle .ts files in .prisma/client
module.exports = require('./client.ts');
`;
        fs.writeFileSync(clientJsPath, clientJsContent);
        console.log('⚠️  Created fallback client.js wrapper (requires webpack transpilation)');
      }
    } else {
      // Last resort fallback
      const clientJsContent = `// Auto-generated client.js wrapper
module.exports = require('./client.ts');
`;
      fs.writeFileSync(clientJsPath, clientJsContent);
      console.log('⚠️  Created minimal client.js wrapper');
    }
  }
}

// Prisma with custom output path should generate index.js that re-exports from client
// If index.js doesn't exist, we need to create it
if (!indexJsExists && (clientJsExists || clientTsExists)) {
  // Create index.js that re-exports from client
  // Now we can require './client' because we created client.js above
  const indexContent = `// Auto-generated index.js for Prisma client
// This file re-exports from client, which is the generated Prisma client
// Using CommonJS format since this will be required by default.js (CommonJS)
module.exports = require('./client');
`;
  const indexJsPath = path.resolve(generatedPath, 'index.js');
  fs.writeFileSync(indexJsPath, indexContent);
  console.log('✅ Created index.js (CommonJS) that requires client');
  
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
// CRITICAL: @prisma/client/default.js uses CommonJS (require()), so default.js MUST be CommonJS
// But index.js uses ES modules, so we need to handle the interop
let defaultContent;
if (indexJsExists || (!indexJsExists && clientTsExists)) {
  // Use index.js as the entry point (this is what Prisma expects)
  // default.js must be CommonJS since it's required by CommonJS code
  // We'll use a pattern that loads the ES module using createRequire or similar
  // Actually, webpack/Next.js should handle this, but let's use a compatible pattern
  defaultContent = `// Auto-generated file for @prisma/client compatibility with custom output path
// This file allows @prisma/client/default.js to require('.prisma/client/default')
// CRITICAL: Must be CommonJS since it's required by @prisma/client (CommonJS)
// The actual module is ES modules, but webpack will handle the interop
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
// Note: clientTsPath was already declared above on line 54
if (fs.existsSync(clientTsPath)) {
  const defaultDtsContent = `// Auto-generated type definitions
export * from './client';
`;
  fs.writeFileSync(path.resolve(generatedPath, 'default.d.ts'), defaultDtsContent);
  console.log('✅ Created default.d.ts');
}


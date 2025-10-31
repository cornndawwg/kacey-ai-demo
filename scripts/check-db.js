#!/usr/bin/env node
/**
 * Quick database check script for Railway SSH debugging
 * Run: node scripts/check-db.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== Database Status Check ===\n');

    // Check connection
    console.log('1. Database Connection:');
    await prisma.$connect();
    console.log('   ✓ Connected\n');

    // Check tables
    console.log('2. Tables in Database:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tableNames = Array.isArray(tables) ? tables.map(t => t.table_name) : [];
    console.log(`   Found ${tableNames.length} tables:`);
    tableNames.forEach(name => console.log(`     - ${name}`));
    console.log();

    // Check critical tables (both lowercase and capitalized versions)
    console.log('3. Critical Tables Status:');
    const criticalTables = ['knowledge_chunks', 'knowledge_artifacts', 'embeddings', 'roles', 'users', 'companies'];
    const criticalTablesUpper = ['KnowledgeChunk', 'KnowledgeArtifact', 'Embedding', 'Role', 'User', 'Company'];
    for (let i = 0; i < criticalTables.length; i++) {
      const tableName = criticalTables[i];
      const tableNameUpper = criticalTablesUpper[i];
      const exists = tableNames.includes(tableName) || tableNames.includes(tableNameUpper);
      console.log(`   ${exists ? '✓' : '✗'} ${tableName} ${exists && tableNames.includes(tableNameUpper) ? '(found as ' + tableNameUpper + ')' : ''}`);
    }
    console.log();

    // Check pgvector extension
    console.log('4. PostgreSQL Extensions:');
    const extensions = await prisma.$queryRaw`
      SELECT extname FROM pg_extension;
    `;
    const extNames = Array.isArray(extensions) ? extensions.map(e => e.extname) : [];
    console.log(`   Extensions: ${extNames.join(', ')}`);
    console.log(`   pgvector: ${extNames.includes('vector') ? '✓' : '✗'}`);
    console.log();

    // Check data counts
    if (tableNames.includes('knowledge_chunks')) {
      console.log('5. Data Counts:');
      try {
        const companyCount = await prisma.company.count();
        const roleCount = await prisma.role.count();
        const artifactCount = await prisma.knowledgeArtifact.count();
        const chunkCount = await prisma.knowledgeChunk.count();
        
        console.log(`   Companies: ${companyCount}`);
        console.log(`   Roles: ${roleCount}`);
        console.log(`   Artifacts: ${artifactCount}`);
        console.log(`   Chunks: ${chunkCount}`);
        
        if (tableNames.includes('embeddings')) {
          const embeddingCount = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM embeddings
          `;
          const embeddingResult = Array.isArray(embeddingCount) ? embeddingCount[0] : null;
          console.log(`   Embeddings: ${embeddingResult?.count || 0}`);
        } else {
          console.log(`   Embeddings: Table does not exist`);
        }
      } catch (error) {
        console.log(`   Error counting data: ${error instanceof Error ? error.message : String(error)}`);
      }
      console.log();
    }

    console.log('=== Check Complete ===');
    console.log('\nNext steps:');
    if (!tableNames.includes('knowledge_chunks')) {
      console.log('  - Run: npx prisma db push --accept-data-loss');
    }
    if (!extNames.includes('vector')) {
      console.log('  - Enable pgvector: psql $DATABASE_URL_PRIVATE -c "CREATE EXTENSION vector;"');
    }
    if (tableNames.includes('knowledge_chunks') && (!tableNames.includes('embeddings'))) {
      console.log('  - Create embeddings table (check seed-db route code)');
    }
    if (tableNames.includes('knowledge_chunks') && tableNames.length < 5) {
      console.log('  - Seed database: curl -X POST http://localhost:8080/api/seed-db');
    }

  } catch (error) {
    console.error('\n✗ Error:', error);
    console.error('Details:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase().catch(console.error);


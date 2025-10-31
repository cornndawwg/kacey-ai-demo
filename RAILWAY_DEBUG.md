# Railway SSH Debugging Guide

## How to SSH into Railway

1. **Using Railway CLI:**
   ```bash
   railway link
   railway ssh
   ```

2. **Or via Railway Dashboard:**
   - Go to your service in Railway dashboard
   - Click on the service
   - Go to "Connect" tab
   - Click "Generate SSH Command"
   - Copy and run the command in your terminal

## Manual Debugging Commands

Once you're SSH'd into the Railway service, run these commands:

### 1. Check Current Directory
```bash
pwd
ls -la
```

### 2. Check Environment Variables
```bash
echo $DATABASE_URL_PRIVATE
echo $OPENAI_API_KEY
echo $JWT_SECRET
```

### 3. Check Database Tables
```bash
# Connect to PostgreSQL
psql $DATABASE_URL_PRIVATE

# Then run these SQL commands:
\dt                    # List all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
SELECT COUNT(*) FROM knowledge_chunks;
SELECT COUNT(*) FROM embeddings;
\q                     # Exit psql
```

### 4. Run Prisma Commands
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema
npm run db:push --accept-data-loss

# Or directly:
npx prisma db push --accept-data-loss --skip-generate
```

### 5. Check Prisma Schema Status
```bash
npx prisma db pull
npx prisma validate
```

### 6. Run Manual Seed Script
```bash
# Make sure you're in the app directory
cd /app  # or wherever the app is deployed

# Run the manual seed script
node scripts/manual-seed.js
```

### 7. Test Database Connection Directly
```bash
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => console.log('Connected!')).catch(e => console.error('Error:', e)).finally(() => p.\$disconnect());"
```

### 8. Check if pgvector Extension is Enabled
```bash
psql $DATABASE_URL_PRIVATE -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### 9. List All Tables with Row Counts
```bash
psql $DATABASE_URL_PRIVATE -c "
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM pg_catalog.pg_class WHERE relname = tablename) as row_count
FROM pg_catalog.pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
"
```

### 10. Check Embeddings Table Structure
```bash
psql $DATABASE_URL_PRIVATE -c "\d embeddings"
```

## Common Issues and Fixes

### Issue: Tables don't exist
```bash
npx prisma db push --accept-data-loss --skip-generate
```

### Issue: Embeddings table missing
The embeddings table needs to be created manually with the vector type. Check the seed-db route code.

### Issue: pgvector extension not enabled
```bash
psql $DATABASE_URL_PRIVATE -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Issue: Prisma client not generated
```bash
npm run prisma:generate
```

## Quick Test of Seed Endpoint

From the app directory, you can also test the API endpoint:
```bash
curl -X POST http://localhost:8080/api/seed-db \
  -H "Content-Type: application/json"
```

## Next Steps After Fixing

1. Check Railway logs: `railway logs` or view in dashboard
2. Test the seed endpoint via the UI
3. Test the chat to see if it finds knowledge base data
4. Check embeddings were created successfully


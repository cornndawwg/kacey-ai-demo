import { prisma } from './prisma';
import { generateEmbeddingsForArtifact, generateEmbeddingsForChunk } from './embeddings';

export async function seedDemoData() {
  try {
    // Verify knowledge_chunks table exists before proceeding
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'knowledge_chunks'
        );
      `;
      const tableExists = (tableCheck as any[])[0]?.exists;
      
      if (!tableExists) {
        console.error('ERROR: knowledge_chunks table does not exist! Cannot seed data.');
        console.error('Please ensure the database schema has been pushed first.');
        throw new Error('knowledge_chunks table does not exist. Run prisma db push first.');
      }
      console.log('Verified: knowledge_chunks table exists');
    } catch (checkError) {
      console.error('Error checking for knowledge_chunks table:', checkError);
      throw checkError;
    }

    // Create demo company
    const company = await prisma.company.upsert({
      where: { name: 'TechCorp Demo' },
      update: {},
      create: { name: 'TechCorp Demo' }
    });

    // Create IT Director role
    const role = await prisma.role.upsert({
      where: { 
        title_companyId: {
          title: 'IT Director',
          companyId: company.id
        }
      },
      update: {},
      create: {
        title: 'IT Director',
        description: 'Oversees all IT operations, infrastructure, and technology strategy',
        companyId: company.id
      }
    });

    // Create sample knowledge artifacts
    const artifacts = [
      {
        title: 'IT Infrastructure Overview',
        description: 'Complete overview of company IT infrastructure, servers, and network topology',
        type: 'PDF' as const,
        content: `IT Infrastructure Overview

Server Infrastructure:
- Primary Data Center: Located in Building A, Room 101
- Backup Data Center: Located in Building B, Room 205
- Main Servers: 3x Dell PowerEdge R750 servers running VMware vSphere
- Database Servers: 2x SQL Server 2019 instances with Always On availability groups
- Web Servers: 4x IIS servers behind load balancer
- File Servers: 2x Windows Server 2019 with DFS replication

Network Topology:
- Core Switch: Cisco Catalyst 9300 series
- Access Switches: 12x Cisco Catalyst 2960-X
- Firewall: Fortinet FortiGate 600E
- Wireless: Cisco Aironet 2800 series access points
- Internet: Dual 1Gbps connections with failover

Security Measures:
- Active Directory with multi-factor authentication
- Endpoint protection: CrowdStrike Falcon
- Email security: Microsoft Defender for Office 365
- Backup: Veeam Backup & Replication with 30-day retention
- Monitoring: SolarWinds NPM and SAM

Key Contacts:
- Network Administrator: John Smith (ext. 1234)
- Database Administrator: Sarah Johnson (ext. 5678)
- Security Specialist: Mike Chen (ext. 9012)`,
        metadata: {
          wordCount: 156,
          pages: 1,
          lastUpdated: '2024-01-15'
        }
      },
      {
        title: 'Incident Response Procedures',
        description: 'Step-by-step procedures for handling IT incidents and outages',
        type: 'DOCX' as const,
        content: `Incident Response Procedures

Severity Levels:
1. Critical: Complete system outage affecting all users
2. High: Major service disruption affecting >50% of users
3. Medium: Limited service disruption affecting <50% of users
4. Low: Minor issues with workarounds available

Response Times:
- Critical: 15 minutes
- High: 1 hour
- Medium: 4 hours
- Low: 24 hours

Escalation Process:
1. First responder assesses severity
2. Notify IT Director for Critical/High incidents
3. Create incident ticket in ServiceNow
4. Notify affected users via email/Slack
5. Begin troubleshooting following runbooks
6. Update stakeholders every 30 minutes for Critical incidents
7. Post-incident review within 48 hours

Common Procedures:
- Server Down: Check power, network, VMware console
- Database Issues: Check SQL Server logs, verify backups
- Network Outage: Test connectivity, check switches, contact ISP
- Security Incident: Isolate affected systems, preserve evidence

Emergency Contacts:
- IT Director: 555-0101
- Network Admin: 555-0102
- Database Admin: 555-0103
- Security Team: 555-0104`,
        metadata: {
          wordCount: 203,
          lastUpdated: '2024-01-10'
        }
      },
      {
        title: 'Software License Inventory',
        description: 'Complete inventory of all software licenses and renewal dates',
        type: 'XLSX' as const,
        content: `Software License Inventory

Product,License Type,Quantity,Expiration Date,Cost,Contact
Microsoft Office 365,Subscription,150,2024-12-31,$15/user/month,Microsoft
VMware vSphere,Perpetual,3,2025-06-30,$5000/server,VMware
Cisco Network,Support,12,2024-08-15,$2000/switch,Cisco
Fortinet FortiGate,Subscription,1,2024-11-30,$3000/year,Fortinet
CrowdStrike Falcon,Subscription,200,2024-09-30,$8/endpoint/month,CrowdStrike
SolarWinds NPM,Subscription,1,2024-07-31,$5000/year,SolarWinds
Veeam Backup,Subscription,1,2024-10-15,$2000/year,Veeam
Adobe Creative Suite,Subscription,25,2024-12-31,$50/user/month,Adobe

Renewal Schedule:
- Q1 2024: SolarWinds, Veeam
- Q2 2024: Cisco, Fortinet
- Q3 2024: CrowdStrike
- Q4 2024: Microsoft, Adobe

Budget Allocation:
- Total Annual Cost: $45,000
- Q1: $7,000
- Q2: $5,000
- Q3: $1,600
- Q4: $31,400`,
        metadata: {
          wordCount: 89,
          lastUpdated: '2024-01-20'
        }
      }
    ];

    // Create or update artifacts (prevent duplicates)
    for (const artifactData of artifacts) {
      // Check if artifact already exists
      const existingArtifact = await prisma.knowledgeArtifact.findFirst({
        where: {
          title: artifactData.title,
          roleId: role.id
        }
      });

      let artifact;
      if (existingArtifact) {
        // Update existing artifact
        artifact = await prisma.knowledgeArtifact.update({
          where: { id: existingArtifact.id },
          data: {
            description: artifactData.description,
            type: artifactData.type,
            content: artifactData.content,
            metadata: artifactData.metadata
          }
        });
        // Delete old chunks to recreate them
        await prisma.knowledgeChunk.deleteMany({
          where: { artifactId: artifact.id }
        });
      } else {
        // Create new artifact
        artifact = await prisma.knowledgeArtifact.create({
          data: {
            ...artifactData,
            roleId: role.id
          }
        });
      }

      // Create chunks
      const chunks = artifactData.content.split('\n\n').map((chunk, index) => ({
        artifactId: artifact.id,
        content: chunk.trim(),
        chunkIndex: index,
        tokenCount: chunk.split(/\s+/).length,
        metadata: {
          artifactTitle: artifact.title,
          artifactType: artifact.type
        }
      }));

      await prisma.knowledgeChunk.createMany({
        data: chunks
      });

      // Ensure embeddings table exists before generating embeddings
      try {
        const embeddingsCheck = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'embeddings'
          );
        `;
        const embeddingsExists = (embeddingsCheck as any[])[0]?.exists;
        
        if (!embeddingsExists) {
          console.log('Creating embeddings table before generating embeddings...');
          // Enable pgvector extension
          await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
          
          // Create embeddings table without FK first
          await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS embeddings (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              "chunkId" TEXT UNIQUE NOT NULL,
              vector vector(1536),
              model TEXT DEFAULT 'text-embedding-3-small',
              "createdAt" TIMESTAMP DEFAULT NOW()
            );
          `;
          await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS embeddings_chunkId_idx ON embeddings("chunkId");`;
          
          // Try to add FK constraint
          try {
            await prisma.$executeRaw`
              ALTER TABLE embeddings 
              ADD CONSTRAINT embeddings_chunkId_fkey 
              FOREIGN KEY ("chunkId") 
              REFERENCES knowledge_chunks(id) 
              ON DELETE CASCADE;
            `;
            console.log('Embeddings table created with FK constraint');
          } catch (fkError: any) {
            console.log('Embeddings table created without FK (will add later):', fkError.message);
          }
        }
      } catch (embeddingTableError: any) {
        console.error('Error ensuring embeddings table exists:', embeddingTableError);
        // Continue anyway - might already exist
      }

      // Generate embeddings for all chunks
      const artifactChunks = await prisma.knowledgeChunk.findMany({
        where: { artifactId: artifact.id }
      });
      
      console.log(`Generating embeddings for ${artifactChunks.length} chunks in artifact: ${artifact.title}`);
      for (const chunk of artifactChunks) {
        try {
          await generateEmbeddingsForChunk(chunk.id);
        } catch (error) {
          console.error(`Error generating embedding for chunk ${chunk.id}:`, error);
          // Continue with other chunks
        }
      }
      console.log(`Finished generating embeddings for artifact: ${artifact.title}`);
    }

    // Create sample interview session
    const interviewSession = await prisma.interviewSession.create({
      data: {
        roleId: role.id,
        phase: 'CORE_ROLE',
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Create sample interview responses
    const responses = [
      {
        sessionId: interviewSession.id,
        question: 'What are the primary responsibilities and objectives of this role?',
        response: 'As IT Director, I oversee all technology operations including infrastructure, security, and strategic planning. My main objectives are ensuring 99.9% uptime, maintaining security compliance, and supporting business growth through technology.',
        phase: 'CORE_ROLE',
        tag: 'PROCESS' as const,
        confidence: 0.95
      },
      {
        sessionId: interviewSession.id,
        question: 'What are the most common mistakes or pitfalls someone new to this role should avoid?',
        response: 'The biggest mistake is not having proper backup and disaster recovery procedures. I learned this the hard way when we had a server failure and discovered our backups were corrupted. Always test your backups regularly and have multiple recovery options.',
        phase: 'CORE_ROLE',
        tag: 'EXCEPTION' as const,
        confidence: 0.9
      },
      {
        sessionId: interviewSession.id,
        question: 'How do you make key decisions in this role?',
        response: 'I follow a structured approach: 1) Assess business impact, 2) Evaluate technical feasibility, 3) Consider security implications, 4) Check budget constraints, 5) Get stakeholder buy-in. For critical decisions, I always involve the CFO and CEO.',
        phase: 'CORE_ROLE',
        tag: 'DECISION' as const,
        confidence: 0.92
      }
    ];

    await prisma.interviewResponse.createMany({
      data: responses
    });

    console.log('Demo data seeded successfully');
    return { company, role, artifacts: artifacts.length };

  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

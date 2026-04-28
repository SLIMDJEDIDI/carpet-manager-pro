const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.activityLog.findMany({
    where: { action: { startsWith: 'DEBUG_UPLOAD' } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log("RECENT UPLOAD DEBUG LOGS:");
  logs.forEach(l => {
    console.log(`[${l.createdAt.toISOString()}] ${l.action}: ${l.details}`);
    if (l.metadata) console.log(`   Meta: ${l.metadata}`);
  });
}

main().finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const designs = await prisma.design.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log("LAST 10 DESIGNS:");
  designs.forEach(d => {
    console.log(`[${d.code}] ${d.name} -> Image: ${d.imageUrl || 'NULL'}`);
  });
}

main().finally(() => prisma.$disconnect());

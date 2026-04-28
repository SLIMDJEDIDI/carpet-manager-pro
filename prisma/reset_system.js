const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting system...');
  
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productionList.deleteMany({});
  await prisma.brand.deleteMany({});
  
  const brands = ['ZARBITI', 'BMT', 'TBP'];
  for (const name of brands) {
    await prisma.brand.create({ data: { name } });
  }
  console.log('Reset complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

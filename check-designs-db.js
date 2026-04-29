const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const designs = await prisma.design.findMany({
    orderBy: { id: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(designs, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

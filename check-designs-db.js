
const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const designs = await prisma.design.findMany();
  console.log('Designs in DB:', JSON.stringify(designs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

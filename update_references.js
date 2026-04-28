const { PrismaClient } = require('./src/db');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'asc' }
  });

  for (let i = 0; i < orders.length; i++) {
    await prisma.order.update({
      where: { id: orders[i].id },
      data: { reference: i + 1 }
    });
    console.log(`Updated Order ${orders[i].id} with reference ${i + 1}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());


const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const item = await prisma.orderItem.findFirst({
    where: {
      order: {
        status: { notIn: ["DELIVERED", "CANCELLED"] }
      }
    },
    include: {
      design: true,
      order: true
    }
  });

  if (item) {
    console.log('Design to test:', item.design.code, item.design.id);
    console.log('Order status:', item.order.status);
  } else {
    console.log('No active order item found for testing.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

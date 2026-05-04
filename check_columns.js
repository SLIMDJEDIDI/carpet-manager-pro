const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const orders = await prisma.order.findMany({ take: 1 });
    console.log("Order keys:", Object.keys(orders[0] || {}));
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

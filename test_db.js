const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const test = await prisma.order.findFirst({
      select: { isFreeDelivery: true, isExchange: true }
    });
    console.log("Success: Columns exist", test);
  } catch (e) {
    console.log("Failure: Columns missing or connection error", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

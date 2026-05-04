const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to add columns via raw SQL...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isFreeDelivery" BOOLEAN DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isExchange" BOOLEAN DEFAULT false;`);
    console.log("Success: Columns added via SQL");
  } catch (e) {
    console.log("Failure:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

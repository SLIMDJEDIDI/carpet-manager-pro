const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Adding 'note' column to 'Order' table...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "note" TEXT;`);
    console.log("Success: Column added");
  } catch (e) {
    console.log("Failure:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

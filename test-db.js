const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing connection...");
    const brands = await prisma.brand.findMany();
    console.log(`Success! Found ${brands.length} brands.`);
    process.exit(0);
  } catch (e) {
    console.error("Connection failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

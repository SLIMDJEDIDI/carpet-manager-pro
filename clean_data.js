const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Cleaning up all test data...");

    // Delete in reverse order of dependencies
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "JaxLog" RESTART IDENTITY CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "ActivityLog" RESTART IDENTITY CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "OrderItem" RESTART IDENTITY CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Order" RESTART IDENTITY CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "ProductionList" RESTART IDENTITY CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Design" RESTART IDENTITY CASCADE;');
    
    // We keep Users and Brands/Products for now as they are configuration, 
    // but we can clear them if needed. 
    // The user mentioned "Fake designs", so I included Design.
    
    console.log("Success: Database is now clean for production.");
  } catch (e) {
    console.log("Failure:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

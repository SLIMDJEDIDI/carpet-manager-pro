const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Applying structural updates...");

    // 1. Create User table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'ORDER',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `);

    // 2. Create JaxLog table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "JaxLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "orderId" TEXT NOT NULL,
        "requestBody" TEXT NOT NULL,
        "responseBody" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "trackingId" TEXT,
        "userId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "JaxLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "JaxLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    // 3. Add columns to Order
    await prisma.$executeRawUnsafe('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "createdById" TEXT;');
    await prisma.$executeRawUnsafe('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "confirmedById" TEXT;');

    // 4. Add columns to OrderItem
    await prisma.$executeRawUnsafe('ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "designStatus" TEXT DEFAULT \'PENDING\';');

    // 5. Create default Admin via raw SQL
    const adminEmail = "admin@carpetmanager.pro";
    const now = new Date().toISOString();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
      VALUES ('admin-id', '${adminEmail}', 'admin123', 'Administrator', 'ADMIN', '${now}', '${now}')
      ON CONFLICT ("email") DO NOTHING;
    `);
    console.log("Admin user handled.");

    console.log("Success: Schema updated and admin created.");
  } catch (e) {
    console.log("Failure:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

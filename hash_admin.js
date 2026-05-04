const { PrismaClient } = require("./src/generated/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    
    await prisma.user.update({
      where: { email: "admin@carpetmanager.pro" },
      data: { password: hashedPassword }
    });
    console.log("Admin password hashed.");
  } catch (e) {
    console.log("Failure:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

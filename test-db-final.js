const { PrismaClient } = require('./src/db');
const prisma = new PrismaClient();

async function check() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
    console.log('Query success:', JSON.stringify(brands[0], null, 2));
  } catch (e) {
    console.error('Query failed with error:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

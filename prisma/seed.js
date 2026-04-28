const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create Brands
  const brands = ['ZARBITI', 'BMT', 'TBP'];

  for (const name of brands) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Brands seeded: ZARBITI, BMT, TBP');

  // Create some sample designs
  const designs = [
    { code: 'D001', name: 'Persian Blue', imageUrl: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=100&q=80' },
    { code: 'D002', name: 'Geometric Grey', imageUrl: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=100&q=80' },
    { code: 'D003', name: 'Vintage Red', imageUrl: 'https://images.unsplash.com/photo-1534889156217-d3c8ef4ca0bc?auto=format&fit=crop&w=100&q=80' },
    { code: 'D004', name: 'Modern Abstract', imageUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=100&q=80' },
  ];

  for (const design of designs) {
    await prisma.design.upsert({
      where: { code: design.code },
      update: {},
      create: design,
    });
  }

  console.log('Designs seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

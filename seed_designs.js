const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const designs = [
    { code: 'D001', name: 'Royal Classic', imageUrl: 'https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?q=80&w=300&h=300&auto=format&fit=crop' },
    { code: 'D002', name: 'Modern Abstract', imageUrl: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?q=80&w=300&h=300&auto=format&fit=crop' },
    { code: 'D003', name: 'Persian Dream', imageUrl: 'https://images.unsplash.com/photo-1581338827723-e25aee27cd1b?q=80&w=300&h=300&auto=format&fit=crop' },
    { code: 'D004', name: 'Minimalist Gray', imageUrl: 'https://images.unsplash.com/photo-1534349735944-2b3a6f7a268f?q=80&w=300&h=300&auto=format&fit=crop' },
    { code: 'D005', name: 'Geometric Pattern', imageUrl: 'https://images.unsplash.com/photo-1508253730651-e5ace80a7025?q=80&w=300&h=300&auto=format&fit=crop' },
  ];

  for (const d of designs) {
    await prisma.design.upsert({
      where: { code: d.code },
      update: d,
      create: d,
    });
  }

  console.log('Sample designs seeded successfully.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

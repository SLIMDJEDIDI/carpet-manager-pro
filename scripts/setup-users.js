const { PrismaClient } = require('../src/generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting User Setup ---');

  const users = [
    {
      email: 'SLIM',
      name: 'Administrator',
      password: '22062626',
      role: 'ADMIN',
    },
    {
      email: 'moderator',
      name: 'Moderator',
      password: 'moderator2026',
      role: 'MODERATOR',
    },
    {
      email: 'design',
      name: 'Designer',
      password: 'admin123',
      role: 'DESIGNER',
    },
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        password: hashedPassword,
        role: u.role,
      },
      create: {
        id: u.email === 'SLIM' ? 'admin-id' : undefined,
        email: u.email,
        name: u.name,
        password: hashedPassword,
        role: u.role,
      },
    });
    
    console.log(`User ${user.email} (${user.role}) created/updated.`);
  }

  // Cleanup: Delete old default account and the typo 'deign' account
  await prisma.user.deleteMany({
    where: {
      email: { in: ['admin@carpetmanager.pro', 'deign'] },
      NOT: { email: 'SLIM' }
    }
  });

  console.log('--- User Setup Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

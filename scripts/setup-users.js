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
      email: 'deign',
      name: 'Designer',
      password: 'admin123',
      role: 'DESIGNER',
    },
  ];

  // Clear existing users to ensure only the requested 3 exist (Optional but matches user request "only these 3")
  // await prisma.user.deleteMany({ where: { NOT: { email: { in: users.map(u => u.email) } } } });

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
        id: u.email === 'SLIM' ? 'admin-id' : undefined, // Keep admin-id for SLIM to maintain protection
        email: u.email,
        name: u.name,
        password: hashedPassword,
        role: u.role,
      },
    });
    
    console.log(`User ${user.email} (${user.role}) created/updated.`);
  }

  // Delete the old default admin if it exists and isn't SLIM
  await prisma.user.deleteMany({
    where: {
      email: 'admin@carpetmanager.pro',
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

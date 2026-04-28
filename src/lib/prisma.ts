import { PrismaClient } from '../generated/client';

// Force new client if old one doesn't have activityLog
const prismaClientSingleton = () => {
  console.log("Creating new PrismaClient (v5)");
  return new PrismaClient();
};

declare global {
  var prismaV5: undefined | ReturnType<typeof prismaClientSingleton>;
}

// We use prismaV5 to avoid conflict with any old cached 'prisma' global
const prisma = globalThis.prismaV5 ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaV5 = prisma;

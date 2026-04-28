const { PrismaClient } = require('./src/generated/client_v6');
const prisma = new PrismaClient();

async function main() {
  const brandName = 'BMT';
  const bmt = await prisma.brand.findUnique({ where: { name: brandName } });
  
  if (!bmt) {
    console.log(`${brandName} brand not found. Creating it...`);
    await prisma.brand.create({ data: { name: brandName } });
  }
  
  const bmtId = (await prisma.brand.findUnique({ where: { name: brandName } })).id;

  // ERASE ANY EXISTING BMT SIZES
  console.log(`Erasing existing ${brandName} catalog...`);
  await prisma.product.deleteMany({ where: { brandId: bmtId } });

  const products = [
    // Tapis enfant — 1 pièce
    { brandId: bmtId, category: 'Enfant', name: 'BMT 100 × 150', size: '100 × 150 cm', price: 69 },
    { brandId: bmtId, category: 'Enfant', name: 'BMT 180 × 200', size: '180 × 200 cm', price: 149 },
    { brandId: bmtId, category: 'Enfant', name: 'BMT 200 × 260', size: '200 × 260 cm', price: 219 },
    
    // Pack Maxi
    { 
      brandId: bmtId, 
      category: 'Pack', 
      name: 'Pack Maxi', 
      size: '1x 100×150 + 2x 80×100', 
      price: 129,
      isPack: true,
      components: JSON.stringify([
        { size: '100 × 150 cm', qty: 1 },
        { size: '80 × 100 cm', qty: 2 }
      ])
    },

    // Pack Géant
    { 
      brandId: bmtId, 
      category: 'Pack', 
      name: 'Pack Géant', 
      size: '1x 150×200 + 2x 60×100', 
      price: 172,
      isPack: true,
      components: JSON.stringify([
        { size: '150 × 200 cm', qty: 1 },
        { size: '60 × 100 cm', qty: 2 }
      ])
    }
  ];

  console.log(`Seeding ${brandName} with updated sizes...`);
  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log(`${brandName} catalog updated successfully.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

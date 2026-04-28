const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const tbp = await prisma.brand.findUnique({ where: { name: 'TBP' } });
  if (!tbp) {
    console.log('TBP brand not found. Creating it...');
    await prisma.brand.create({ data: { name: 'TBP' } });
  }
  const tbpId = (await prisma.brand.findUnique({ where: { name: 'TBP' } })).id;

  const products = [
    // Cuisine — 1 pièce
    { brandId: tbpId, category: 'Cuisine', name: 'Cuisine 50 × 150', size: '50 × 150 cm', price: 29 },
    { brandId: tbpId, category: 'Cuisine', name: 'Cuisine 40 × 200', size: '40 × 200 cm', price: 33 },
    { brandId: tbpId, category: 'Cuisine', name: 'Cuisine 50 × 200', size: '50 × 200 cm', price: 42 },
    { brandId: tbpId, category: 'Cuisine', name: 'Cuisine 60 × 200', size: '60 × 200 cm', price: 49 },
    { brandId: tbpId, category: 'Cuisine', name: 'Cuisine 80 × 200', size: '80 × 200 cm', price: 64 },
    
    // Cuisine — Pack 3 pièces
    { 
      brandId: tbpId, 
      category: 'Cuisine Pack', 
      name: 'Pack Cuisine 33 DT', 
      size: '1x 40×100 + 2x 40×50', 
      price: 33,
      isPack: true,
      components: JSON.stringify([
        { size: '40 × 100 cm', qty: 1 },
        { size: '40 × 50 cm', qty: 2 }
      ])
    },
    { 
      brandId: tbpId, 
      category: 'Cuisine Pack', 
      name: 'Pack Cuisine 42 DT', 
      size: '1x 50×100 + 2x 50×50', 
      price: 42,
      isPack: true,
      components: JSON.stringify([
        { size: '50 × 100 cm', qty: 1 },
        { size: '50 × 50 cm', qty: 2 }
      ])
    },
    { 
      brandId: tbpId, 
      category: 'Cuisine Pack', 
      name: 'Pack Cuisine 49 DT', 
      size: '1x 60×100 + 2x 50×60', 
      price: 49,
      isPack: true,
      components: JSON.stringify([
        { size: '60 × 100 cm', qty: 1 },
        { size: '50 × 60 cm', qty: 2 }
      ])
    },

    // Salle de bain — Pack 3 pièces
    { 
      brandId: tbpId, 
      category: 'SDB Pack', 
      name: 'Pack SDB 33 DT', 
      size: '1x 40×100 + 2x 40×50', 
      price: 33,
      isPack: true,
      components: JSON.stringify([
        { size: '40 × 100 cm', qty: 1 },
        { size: '40 × 50 cm', qty: 2 }
      ])
    },
    { 
      brandId: tbpId, 
      category: 'SDB Pack', 
      name: 'Pack SDB 42 DT', 
      size: '1x 50×100 + 2x 50×50', 
      price: 42,
      isPack: true,
      components: JSON.stringify([
        { size: '50 × 100 cm', qty: 1 },
        { size: '50 × 50 cm', qty: 2 }
      ])
    },
    { 
      brandId: tbpId, 
      category: 'SDB Pack', 
      name: 'Pack SDB 49 DT', 
      size: '1x 60×100 + 2x 50×60', 
      price: 49,
      isPack: true,
      components: JSON.stringify([
        { size: '60 × 100 cm', qty: 1 },
        { size: '50 × 60 cm', qty: 2 }
      ])
    }
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log('TBP products seeded successfully.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

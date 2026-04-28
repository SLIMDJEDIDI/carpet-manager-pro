const { PrismaClient } = require('./src/db_final');
const prisma = new PrismaClient();

async function main() {
  const zarbiti = await prisma.brand.findUnique({ where: { name: 'ZARBITI' } });
  if (!zarbiti) {
    console.log('ZARBITI brand not found. Creating it...');
    await prisma.brand.create({ data: { name: 'ZARBITI' } });
  }
  const zarbitiId = (await prisma.brand.findUnique({ where: { name: 'ZARBITI' } })).id;

  const products = [
    // Salon & salle à manger
    { brandId: zarbitiId, category: 'Salon', name: 'Tapis 160 × 210', size: '160 × 210 cm', price: 102 },
    { brandId: zarbitiId, category: 'Salon', name: 'Tapis 200 × 260', size: '200 × 260 cm', price: 162 },
    
    // Chambre à coucher (Pack)
    { 
      brandId: zarbitiId, 
      category: 'Chambre', 
      name: 'Pack Chambre (3 pcs)', 
      size: '1x 100×150 + 2x 75×100', 
      price: 112,
      isPack: true,
      components: JSON.stringify([
        { size: '100 × 150 cm', qty: 1 },
        { size: '75 × 100 cm', qty: 2 }
      ])
    },

    // Couloir
    { brandId: zarbitiId, category: 'Couloir', name: 'Couloir 100 × 200', size: '100 × 200 cm', price: 92 },
    { brandId: zarbitiId, category: 'Couloir', name: 'Couloir 100 × 300', size: '100 × 300 cm', price: 102 },
    { brandId: zarbitiId, category: 'Couloir', name: 'Couloir 100 × 400', size: '100 × 400 cm', price: 135 },
    { brandId: zarbitiId, category: 'Couloir', name: 'Couloir 100 × 500', size: '100 × 500 cm', price: 152 },
    { brandId: zarbitiId, category: 'Couloir', name: 'Couloir 100 × 600', size: '100 × 600 cm', price: 189 },

    // Tapis rond
    { brandId: zarbitiId, category: 'Rond', name: 'Rond 100 × 100', size: '100 × 100 cm', price: 72 },
    { brandId: zarbitiId, category: 'Rond', name: 'Rond 150 × 150', size: '150 × 150 cm', price: 92 },
    { brandId: zarbitiId, category: 'Rond', name: 'Rond 200 × 200', size: '200 × 200 cm', price: 119 },

    // PACK DAR KEMLA
    {
      brandId: zarbitiId,
      category: 'Pack Special',
      name: 'PACK DAR KEMLA',
      size: 'Salon + Couloir + Pack Chambre',
      price: 289,
      isPack: true,
      components: JSON.stringify([
        { size: '160 × 210 cm', qty: 1, name: 'Salon' },
        { size: '100 × 200 cm', qty: 1, name: 'Couloir' },
        { size: '100 × 150 cm', qty: 1, name: 'Chambre A' },
        { size: '50 × 100 cm', qty: 2, name: 'Chambre B' }
      ])
    }
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log('ZARBITI products seeded successfully.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

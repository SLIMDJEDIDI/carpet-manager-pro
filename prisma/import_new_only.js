const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '..', 'new_orders_2026.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const orders = JSON.parse(rawData);

  console.log(`Starting clean import of ${orders.length} orders from ORDER TAKING...`);

  const brands = await prisma.brand.findMany();
  const brandMap = {};
  brands.forEach(b => { brandMap[b.name] = b.id; });

  const defaultDesign = await prisma.design.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: { code: 'DEFAULT', name: 'Standard Design' },
  });

  for (const o of orders) {
    try {
      const dateParts = o.orderDate.split('/');
      let orderDate = new Date();
      if (dateParts.length === 3) {
        orderDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
      }

      await prisma.order.create({
        data: {
          customerName: o.customerName || "Unknown Customer",
          customerPhone: o.customerPhone || "00000000",
          customerAddress: o.customerAddress || "No Address Provided",
          createdAt: orderDate,
          items: {
            create: {
              size: o.size || "Standard",
              brandId: brandMap[o.brand] || brandMap['ZARBITI'],
              designId: defaultDesign.id,
              status: o.status || "PENDING",
              createdAt: orderDate,
            }
          }
        }
      });
    } catch (err) {
      console.error(`Failed: ${o.customerName}`, err);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

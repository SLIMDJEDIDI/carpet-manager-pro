const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '..', 'fixed_shipping_2026.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const orders = JSON.parse(rawData);

  console.log(`Importing ${orders.length} shipped orders...`);

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
      const dateParts = o.Date ? o.Date.split('/') : [];
      let orderDate = new Date();
      if (dateParts.length === 3) {
        orderDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
      }

      let name = o.Name || "";
      let phone = o.Phone || "";
      let address = o.Address || "";
      if (name === "" && phone.includes("\n")) {
        const lines = phone.split("\n");
        name = lines[0].trim();
        phone = lines[lines.length - 1].replace(/\D/g, "");
        if (lines.length > 2) address = lines.slice(1, -1).join(", ").trim();
      }

      await prisma.order.create({
        data: {
          customerName: name || "Unknown Customer",
          customerPhone: phone.replace(/\D/g, "") || "00000000",
          customerAddress: address || "No Address Provided",
          status: "SHIPPED",
          createdAt: orderDate,
          items: {
            create: {
              size: o.Dimension || "Standard",
              brandId: brandMap[o.Brand] || brandMap['ZARBITI'],
              designId: defaultDesign.id,
              status: "SHIPPED",
              createdAt: orderDate,
            }
          }
        }
      });
    } catch (err) {
      // skip
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

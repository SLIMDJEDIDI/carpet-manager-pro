const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '..', 'orders_2026.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const orders = JSON.parse(rawData);

  console.log(`Starting import of ${orders.length} orders...`);

  // 1. Pre-fetch brands
  const brands = await prisma.brand.findMany();
  const brandMap = {};
  brands.forEach(b => {
    brandMap[b.name] = b.id;
    if (b.name === 'BMT') brandMap['BMT'] = b.id; // ensure shorthand works
    if (b.name === 'TBP') brandMap['TBP'] = b.id;
  });

  // 2. Ensure a "DEFAULT" design exists for orders without a specific code
  const defaultDesign = await prisma.design.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: { 
      code: 'DEFAULT', 
      name: 'Standard Design',
      imageUrl: null
    },
  });

  let importedCount = 0;
  let skippedCount = 0;

  for (const o of orders) {
    try {
      const orderDateStr = o["Order Date"];
      const [day, month, year] = orderDateStr.split('/');
      const orderDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      const brandName = o["Brand"];
      const brandId = brandMap[brandName] || brandMap['ZARBITI']; // Default to ZARBITI if unknown

      // Determine Status
      // Logic based on sample: "oui" might mean produced/confirmed, "inj" might mean pending.
      // However, usually these imports are historical. 
      // If there is a Parcel Number, it's definitely SHIPPED.
      let status = "PENDING";
      if (o["Parcel Number"] && o["Parcel Number"].trim() !== "") {
        status = "SHIPPED";
      } else if (o["Status"] === "oui") {
        status = "WRAPPED"; // Or DELIVERED, but WRAPPED is safer for "ready"
      } else if (o["Status"] === "inj") {
        status = "IN_PRODUCTION";
      }

      await prisma.order.create({
        data: {
          customerName: o["Customer Full Name"] || "Unknown Customer",
          customerPhone: o["Phone Number"] || "00000000",
          customerAddress: o["Address"] || "No Address Provided",
          size: o["Size"] || "Standard",
          brandId: brandId,
          designId: defaultDesign.id, // Since Design Code was empty in sample
          status: status,
          parcelNumber: o["Parcel Number"] || null,
          createdAt: orderDate,
        }
      });
      importedCount++;
    } catch (err) {
      console.error(`Failed to import order: ${JSON.stringify(o)}`, err);
      skippedCount++;
    }
  }

  console.log(`Import Complete!`);
  console.log(`- Imported: ${importedCount}`);
  console.log(`- Skipped/Errors: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

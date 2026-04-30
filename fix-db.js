const { Client } = require('pg');

const connectionString = "postgresql://postgres.cfbythrebgfgvydzgkgj:SLIM22062626@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

async function fixDb() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to database.");

    // Add jaxTrackingId to Order
    try {
      await client.query('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "jaxTrackingId" TEXT;');
      console.log("Added jaxTrackingId to Order.");
    } catch (e) { console.log("Order.jaxTrackingId might already exist or failed:", e.message); }

    // Add jaxReceiptUrl to Order
    try {
      await client.query('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "jaxReceiptUrl" TEXT;');
      console.log("Added jaxReceiptUrl to Order.");
    } catch (e) { console.log("Order.jaxReceiptUrl might already exist or failed:", e.message); }

    // Add updatedAt to Order
    try {
      await client.query('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;');
      console.log("Added updatedAt to Order.");
    } catch (e) { console.log("Order.updatedAt might already exist or failed:", e.message); }

    // Add updatedAt to OrderItem
    try {
      await client.query('ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;');
      console.log("Added updatedAt to OrderItem.");
    } catch (e) { console.log("OrderItem.updatedAt might already exist or failed:", e.message); }

    console.log("Database patch completed successfully.");
  } catch (err) {
    console.error("Connection error", err.stack);
  } finally {
    await client.end();
  }
}

fixDb();

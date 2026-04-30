import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Starting Database Schema Fix...");

    // 1. Add jaxTrackingId
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "jaxTrackingId" TEXT`);
    console.log("Checked jaxTrackingId");

    // 2. Add jaxReceiptUrl
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "jaxReceiptUrl" TEXT`);
    console.log("Checked jaxReceiptUrl");

    // 3. Add updatedAt to Order
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    console.log("Checked updatedAt on Order");

    // 4. Add updatedAt to OrderItem
    await prisma.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    console.log("Checked updatedAt on OrderItem");

    return NextResponse.json({ 
      success: true, 
      message: "Database schema synchronized successfully. You can now use JAX features safely." 
    });
  } catch (error: any) {
    console.error("DB Fix Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

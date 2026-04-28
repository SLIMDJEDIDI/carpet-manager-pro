import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  const latestOrder = await prisma.order.findFirst({
    where: { customerPhone: phone },
    orderBy: { createdAt: "desc" },
  });

  const pendingOrder = await prisma.order.findFirst({
    where: { 
      customerPhone: phone,
      status: { in: ["PENDING", "IN_PRODUCTION", "WRAPPED"] }
    },
  });

  return NextResponse.json({
    found: !!latestOrder,
    name: latestOrder?.customerName,
    address: latestOrder?.customerAddress,
    postalCode: latestOrder?.customerPostalCode,
    hasPending: !!pendingOrder,
  });
}

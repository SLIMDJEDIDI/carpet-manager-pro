import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");

  if (!brandId) {
    return NextResponse.json({ error: "Missing brandId" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { brandId },
    orderBy: [{ category: 'asc' }, { price: 'asc' }]
  });

  return NextResponse.json(products);
}

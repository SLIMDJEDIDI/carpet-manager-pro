import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const designs = await prisma.design.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(designs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 });
  }
}

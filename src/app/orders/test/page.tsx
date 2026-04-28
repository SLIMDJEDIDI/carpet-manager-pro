import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  let brands = [];
  try {
    brands = await prisma.brand.findMany();
  } catch (e: any) {
    return <div className="p-10 text-red-600">DB Error: {e.message}</div>;
  }

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">DB Connection Test</h1>
      <p>Found {brands.length} brands.</p>
      <ul className="list-disc pl-5">
        {brands.map(b => <li key={b.id}>{b.name}</li>)}
      </ul>
      <Link href="/orders" className="text-blue-600">Back to Orders</Link>
    </div>
  );
}

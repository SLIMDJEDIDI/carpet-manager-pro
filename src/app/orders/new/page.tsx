import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const brands = await prisma.brand.findMany();
  const designs = await prisma.design.findMany({ 
    orderBy: { code: "asc" } 
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/orders" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-black uppercase text-xs tracking-widest group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Orders
      </Link>

      <div className="border-l-8 border-emerald-500 pl-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">New Messenger Order</h1>
        <p className="text-slate-500 font-bold">Manage multiple articles in a single customer order.</p>
      </div>

      <OrderForm brands={brands} designs={designs} action={createOrder} />
    </div>
  );
}

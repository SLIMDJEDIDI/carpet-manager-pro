import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import OrderForm from "@/components/OrderForm";
import { createOrder } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  let brands: any[] = [];
  let designs: any[] = [];

  try {
    if (!prisma) {
      throw new Error("Prisma client not initialized");
    }

    const [brandsData, designsData] = await Promise.all([
      prisma.brand.findMany().catch(e => {
        console.error("Brands fetch failed:", e);
        return [];
      }),
      prisma.design.findMany({ 
        orderBy: { code: "asc" } 
      }).catch(e => {
        console.error("Designs fetch failed:", e);
        return [];
      })
    ]);
    
    // Manual mapping for clean serialization
    brands = brandsData.map((b: any) => ({ 
      id: b.id, 
      name: b.name 
    }));
    
    designs = designsData.map((d: any) => ({ 
      id: d.id, 
      code: d.code, 
      name: d.name, 
      imageUrl: d.imageUrl || null
    }));
  } catch (error: any) {
    console.error("Fatal error in NewOrderPage:", error);
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">System Error</h1>
        <p className="text-slate-500 mt-2">{error.message || "An unexpected error occurred while loading the page."}</p>
        <Link href="/orders" className="text-emerald-600 underline mt-4 inline-block">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/orders" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-black uppercase text-xs tracking-widest group">
        <span className="w-4 h-4 flex items-center justify-center">←</span>
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

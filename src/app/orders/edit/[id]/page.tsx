import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import OrderForm from "@/components/OrderForm";
import { updateOrder } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let order, brands, designs;

  try {
    if (!prisma) throw new Error("Database client not available");

    const [orderData, brandsData, designsData] = await Promise.all([
      prisma.order.findUnique({
        where: { id },
        include: { items: true },
      }),
      prisma.brand.findMany(),
      prisma.design.findMany({ 
        orderBy: { code: "asc" } 
      })
    ]);

    if (!orderData) redirect("/orders");

    // Strict manual mapping
    order = {
      id: orderData.id,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      customerPostalCode: orderData.customerPostalCode,
      status: orderData.status,
      items: orderData.items.map((item: any) => ({
        id: item.id,
        brandId: item.brandId,
        designId: item.designId,
        size: item.size,
        price: item.price,
        status: item.status
      }))
    };
    
    brands = brandsData.map((b: any) => ({ id: b.id, name: b.name }));
    designs = designsData.map((d: any) => ({ id: d.id, code: d.code, name: d.name, imageUrl: d.imageUrl || null }));
  } catch (error: any) {
    console.error("Error in EditOrderPage:", error);
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">Edit Order Error</h1>
        <p className="text-slate-500 mt-2">{error.message || "Failed to load order data."}</p>
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
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Edit Order</h1>
        <p className="text-slate-500 font-bold">Update customer information or order articles.</p>
      </div>

      <OrderForm brands={brands} designs={designs} action={updateOrder} initialData={order} />
    </div>
  );
}

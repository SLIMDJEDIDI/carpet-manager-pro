import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const brands = await prisma.brand.findMany();
  const designs = await prisma.design.findMany({ 
    orderBy: { code: "asc" } 
  });

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { brand: true, design: true }
      }
    }
  });

  if (!order) {
    redirect("/orders");
  }

  // Pre-format items for the OrderForm component
  const initialItems = order.items.map(item => ({
    id: item.id,
    brandId: item.brandId,
    designId: item.designId,
    size: item.size,
    status: item.status
  }));

  const updateOrderWithId = updateOrder.bind(null, id);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/orders" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-black uppercase text-xs tracking-widest group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Orders
      </Link>

      <div className="border-l-8 border-amber-500 pl-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Edit Order</h1>
        <p className="text-slate-500 font-bold">Modify customer details or carpet articles for Order #{order.id.slice(-6).toUpperCase()}.</p>
      </div>

      <OrderForm 
        brands={brands} 
        designs={designs} 
        action={updateOrderWithId} 
        initialData={{
          name: order.customerName,
          phone: order.customerPhone,
          address: order.customerAddress,
          items: initialItems
        }}
      />
    </div>
  );
}

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Package, CheckSquare, Square, Truck } from "lucide-react";

export default async function WrappingPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { brand: true, design: true },
        orderBy: { packId: 'asc' }
      }
    }
  });

  if (!order) return notFound();

  // Group items by pack
  const normalItems = order.items.filter(i => !i.isPack && !i.packId);
  const packs: Record<string, any[]> = {};
  
  order.items.forEach(item => {
    if (item.packId) {
      if (!packs[item.packId]) packs[item.packId] = [];
      packs[item.packId].push(item);
    }
  });

  return (
    <div className="p-10 max-w-4xl mx-auto bg-white min-h-screen font-sans text-slate-900">
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">Wrapping List</h1>
          <div className="flex items-center gap-4">
            <span className="bg-slate-900 text-white px-4 py-1 rounded-lg text-sm font-black uppercase tracking-widest">
              REF #{order.reference}
            </span>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
              Generated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black uppercase">{order.customerName}</p>
          <p className="text-slate-500 font-bold">{order.customerPhone}</p>
          <p className="text-slate-400 text-sm">{order.customerAddress}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl mb-10 flex gap-6 items-center">
        <div className="bg-amber-500 text-white p-4 rounded-2xl">
          <Truck className="w-8 h-8" />
        </div>
        <div>
          <p className="text-amber-900 font-black uppercase text-sm tracking-wider mb-1">Worker Instructions</p>
          <p className="text-amber-800 text-sm font-medium leading-relaxed">
            1. Tick items as they are wrapped in **Liquid Glass**. <br/>
            2. Articles inside a **Blue Pack** container must be bundled together in ONE parcel. <br/>
            3. Verify EAN labels match the design code before sealing.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Packs Section */}
        {Object.entries(packs).map(([packId, items]) => (
          <div key={packId} className="border-4 border-indigo-600 rounded-[3rem] p-8 relative">
            <div className="absolute -top-6 left-10 bg-indigo-600 text-white px-6 py-2 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-indigo-200">
              <Package className="w-4 h-4" />
              Atomic Pack Unit
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-indigo-100 flex justify-between items-center italic text-indigo-400 font-bold text-sm uppercase tracking-widest">
              <span>Bundle these {items.length} items together</span>
              <div className="flex items-center gap-3">
                <span>Pack Ready?</span>
                <div className="w-8 h-8 border-4 border-indigo-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}

        {/* Normal Items Section */}
        {normalItems.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-4 mb-6">Individual Articles</h3>
            <div className="grid grid-cols-1 gap-4">
              {normalItems.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-20 pt-10 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Carpet Manager PRO • Wrapping Tunnel v2.0</p>
      </div>

      <script dangerouslySetInnerHTML={{ __html: 'window.print()' }} />
    </div>
  );
}

function ItemRow({ item }: { item: any }) {
  return (
    <div className="flex items-center gap-8 p-4 bg-white rounded-2xl border-2 border-slate-50">
      <div className="w-10 h-10 border-4 border-slate-200 rounded-xl flex-shrink-0"></div>
      
      <div className="w-20 h-20 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex-shrink-0">
        {item.design.imageUrl && (
          <img src={item.design.imageUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{item.design.code}</p>
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{item.brand.name}</span>
        </div>
        <p className="text-lg font-black text-slate-400 tracking-tight">{item.size}</p>
      </div>

      <div className="text-right flex flex-col items-end gap-2">
         {item.status === "SHIPPED" ? (
           <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">Already Shipped</span>
         ) : item.status === "WRAPPED" ? (
           <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 italic">Wrapped ✓</span>
         ) : (
           <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 italic">Pending</span>
         )}
         <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{item.isPack ? "Pack Content" : "Standard"}</div>
      </div>
    </div>
  );
}

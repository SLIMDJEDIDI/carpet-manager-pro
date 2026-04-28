import prisma from "@/lib/prisma";
import { Factory, Printer, PlusCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createBatch } from "@/lib/actions";
import ExportProductionList from "@/components/ExportProductionList";
import PrintProductionList from "@/components/PrintProductionList";

export const dynamic = "force-dynamic";

export default async function ProductionPage() { 

  const brands = await prisma.brand.findMany();
  
  const pendingItems = await prisma.orderItem.findMany({
    where: { status: "PENDING" },
    include: { 
      brand: true, 
      design: true,
      order: true,
      parentItem: true
    },
    orderBy: { order: { reference: "asc" } } // First come first served
  });

  const productionLists = await prisma.productionList.findMany({
    take: 10, // Only show recent batches
    include: { 
      items: {
        include: { brand: true, design: true, order: true }
      },
      _count: { select: { items: true } } 
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 border-l-4 border-amber-500 pl-4 uppercase tracking-tight">Production Control</h1>
        <p className="text-slate-500 text-sm mt-1">Manage individual articles sent to the factory. Each brand has its own list.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {brands.map(brand => {
            const brandPending = pendingItems.filter(o => o.brandId === brand.id);
            if (brandPending.length === 0) return null;

            return (
              <div key={brand.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black flex items-center gap-2 text-slate-700 uppercase tracking-tight">
                    <PlusCircle className="w-5 h-5 text-amber-500" />
                    {brand.name} Pending ({brandPending.length})
                  </h3>
                  <form action={createBatch}>
                    <input type="hidden" name="brandId" value={brand.id} />
                    <input type="hidden" name="brandName" value={brand.name} />
                    <button type="submit" className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 flex items-center gap-2">
                      <Printer className="w-4 h-4" />
                      Create {brand.name} List
                    </button>
                  </form>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                  {brandPending.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-white rounded-xl border-2 border-slate-200 flex-shrink-0 overflow-hidden shadow-sm p-1">
                          {item.design.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-contain" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black bg-slate-900 px-2 py-0.5 rounded text-white uppercase tracking-wider">{item.design.code}</span>
                            <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{item.design.name}</p>
                            {item.parentItem && (
                              <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm shadow-amber-200">PACK COMPONENT</span>
                            )}
                          </div>
                          <div className="inline-block bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200">
                            <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">{item.size}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{item.order.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">REF #{item.order.reference}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {pendingItems.length === 0 && (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-3 bg-white rounded-[2.5rem] border border-slate-100">
              <CheckCircle2 className="w-16 h-16 opacity-10 text-emerald-500" />
              <p className="font-black uppercase tracking-widest text-xs">All articles are currently in production!</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black flex items-center gap-2 text-slate-700 uppercase tracking-tight">
            <Factory className="w-5 h-5 text-slate-400" />
            Active Batches
          </h3>
          <div className="space-y-4">
            {productionLists.map(list => (
              <div key={list.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-amber-200 transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded uppercase tracking-widest flex items-center gap-1.5">
                    Batch #{list.id.slice(-4)}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(list.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-black text-slate-900 leading-tight text-lg">{list.batchName}</h4>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500 font-black text-xs uppercase tracking-widest">{list._count.items} CARPETS</span>
                  <div className="flex gap-2">
                    <Link 
                      href={`/production/${list.id}`}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Manage
                    </Link>
                    <ExportProductionList orders={list.items as any} batchName={list.batchName} />
                    <PrintProductionList batchName={list.batchName} items={list.items} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

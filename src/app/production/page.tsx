import prisma from "@/lib/prisma";
import { Factory, Printer, PlusCircle, CheckCircle2, Package, Truck } from "lucide-react";
import Link from "next/link";
import { createBatch } from "@/lib/actions";
import ExportProductionList from "@/components/ExportProductionList";
import PrintProductionList from "@/components/PrintProductionList";

export const dynamic = "force-dynamic";

export default async function ProductionPage() { 

  const brands = await prisma.brand.findMany();
  
  const pendingItems = await prisma.orderItem.findMany({
    where: { 
      status: "PENDING",
      order: { status: "CONFIRMED" } 
    },
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

  const wrappedItems = await prisma.orderItem.findMany({
    where: { status: "WRAPPED" },
    include: { brand: true, design: true, order: true },
    orderBy: { updatedAt: "desc" },
    take: 10
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 border-l-4 border-amber-500 pl-4 uppercase tracking-tight leading-tight">Production Control</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-1">Manage individual articles sent to the factory.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-8 md:space-y-10">
          {brands.map(brand => {
            const brandPending = pendingItems.filter(o => o.brandId === brand.id);
            if (brandPending.length === 0) return null;

            return (
              <div key={brand.id} className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <h3 className="text-base md:text-lg font-black flex items-center gap-2 text-slate-700 uppercase tracking-tight">
                    <PlusCircle className="w-5 h-5 text-amber-500" />
                    {brand.name} Pending ({brandPending.length})
                  </h3>
                  <form action={createBatch}>
                    <input type="hidden" name="brandId" value={brand.id} />
                    <input type="hidden" name="brandName" value={brand.name} />
                    <button type="submit" className="w-full md:w-auto bg-amber-600 text-white px-5 py-3 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 flex items-center justify-center gap-2">
                      <Printer className="w-4 h-4" />
                      Create {brand.name} List
                    </button>
                  </form>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                  {brandPending.map(item => (
                    <div key={item.id} className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl border-2 border-slate-200 flex-shrink-0 overflow-hidden shadow-sm p-1">
                          {item.design.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-contain" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[8px] md:text-[10px] font-black bg-slate-900 px-2 py-0.5 rounded text-white uppercase tracking-wider">{item.design.code}</span>
                            <p className="font-black text-slate-900 uppercase text-xs md:text-sm tracking-tight truncate max-w-[120px] md:max-w-none">{item.design.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="inline-block bg-slate-100 px-2 md:px-3 py-1 rounded-xl border border-slate-200">
                              <p className="text-sm md:text-xl font-black text-slate-900 tracking-tighter leading-none">{item.size}</p>
                            </div>
                            {item.parentItem && (
                              <span className="bg-amber-500 text-white text-[7px] md:text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm shadow-amber-200">PACK</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0">
                        <p className="text-xs md:text-sm font-bold text-slate-900 truncate max-w-[150px]">{item.order.customerName}</p>
                        <p className="text-[8px] md:text-[10px] text-slate-400 font-medium uppercase tracking-widest">REF #{item.order.reference}</p>
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
          {wrappedItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-black flex items-center gap-2 text-emerald-600 uppercase tracking-tight">
                <Package className="w-5 h-5" />
                Recently Wrapped ({wrappedItems.length})
              </h3>
              <div className="bg-emerald-50 rounded-2xl border border-emerald-100 divide-y divide-emerald-100 overflow-hidden">
                {wrappedItems.map(item => (
                  <div key={item.id} className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white p-1 shrink-0 border border-emerald-200">
                      {item.design.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-contain" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-900 leading-none truncate">{item.design.code}</p>
                      <p className="text-[9px] font-bold text-slate-500 truncate">REF #{item.order.reference}</p>
                    </div>
                    <Link href="/shipping" className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-all">
                      <Truck className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-base md:text-lg font-black flex items-center gap-2 text-slate-700 uppercase tracking-tight">
            <Factory className="w-5 h-5 text-slate-400" />
            PRODUCTION LISTS
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {productionLists.map(list => {
              const items = list.items.filter(i => !i.isPack);
              const isFullyWrapped = items.length > 0 && items.every(i => i.status === "WRAPPED");

              if (isFullyWrapped) {
                return (
                  <div key={list.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-4 opacity-60 hover:opacity-100 transition-opacity group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[8px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded uppercase tracking-widest shrink-0">
                        #{list.id.slice(-4)}
                      </span>
                      <h4 className="font-bold text-slate-500 text-xs truncate uppercase tracking-tight">{list.batchName}</h4>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-emerald-600 font-black text-[8px] uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Wrapped
                      </span>
                      <Link 
                        href={`/production/${list.id}`}
                        className="text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <Factory className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              }

              return (
                <div key={list.id} className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-amber-200 transition-colors group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded uppercase tracking-widest flex items-center gap-1.5">
                      Batch #{list.id.slice(-4)}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(list.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-black text-slate-900 leading-tight text-base md:text-lg truncate">{list.batchName}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest">{items.length} CARPETS</span>
                    <div className="flex flex-wrap gap-2">
                      <Link 
                        href={`/production/${list.id}`}
                        className="bg-slate-900 text-white px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all text-center flex-1 sm:flex-none"
                      >
                        Manage
                      </Link>
                      <ExportProductionList orders={list.items as any} batchName={list.batchName} />
                      <PrintProductionList batchName={list.batchName} items={list.items} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

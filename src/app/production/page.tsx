import prisma from "@/lib/prisma";
import { Factory, Printer, PlusCircle, CheckCircle2, Package, Truck, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createBatch } from "@/lib/actions";
import ExportProductionList from "@/components/ExportProductionList";
import PrintProductionList from "@/components/PrintProductionList";
import CreateBatchButton from "@/components/CreateBatchButton";

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
      parentItem: { include: { design: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const wrappedItems = await prisma.orderItem.findMany({
    where: { status: "WRAPPED" },
    include: { 
      design: true, 
      order: true,
      parentItem: { include: { design: true } }
    },
    orderBy: { updatedAt: "desc" },
    take: 30
  });

  // Group wrapped items by pack to save space and show context
  const displayWrapped: any[] = [];
  wrappedItems.forEach(item => {
    if (item.parentItemId) {
      const existing = displayWrapped.find(d => d.isPack && d.id === item.parentItemId);
      if (existing) {
        existing.count++;
      } else {
        displayWrapped.push({
          id: item.parentItemId,
          isPack: true,
          design: item.parentItem?.design || item.design,
          order: item.order,
          count: 1,
          updatedAt: item.updatedAt
        });
      }
    } else if (!item.isPack) { // Only show real carpets or packs as groups
      displayWrapped.push({
        id: item.id,
        isPack: false,
        design: item.design,
        order: item.order,
        size: item.size,
        updatedAt: item.updatedAt
      });
    }
  });

  const lists = await prisma.productionList.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { design: true, order: true } } },
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
            
            const readyToBatchCount = brandPending.filter(item => item.designStatus === "READY" && !item.isPack).length;

            return (
              <div key={brand.id} className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base md:text-lg font-black flex items-center gap-2 text-slate-700 uppercase tracking-tight">
                      <PlusCircle className="w-5 h-5 text-amber-500" />
                      {brand.name} Pending ({brandPending.length})
                    </h3>
                    {readyToBatchCount > 0 ? (
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                        {readyToBatchCount} items ready for production
                      </p>
                    ) : (
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">
                        No items ready (Waiting for Designs)
                      </p>
                    )}
                  </div>
                  <CreateBatchButton 
                    brandId={brand.id} 
                    brandName={brand.name} 
                    action={createBatch} 
                    disabled={readyToBatchCount === 0}
                  />
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
                            {item.designStatus === "READY" ? (
                              <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-tighter">Design Ready</span>
                            ) : (
                              <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-tighter">Design Pending</span>
                            )}
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
                      {item.order.note && (
                        <div className="mt-2 sm:mt-0 p-2 bg-amber-50 rounded-xl border border-amber-100/50 flex items-start gap-2 max-w-md">
                          <MessageSquare className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-[9px] font-bold text-amber-800 leading-tight italic">"{item.order.note}"</p>
                        </div>
                      )}
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
          <div className="flex items-center gap-3 px-2">
            <div className="bg-slate-100 p-2 rounded-xl">
              <Factory className="w-5 h-5 text-slate-500" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Production Lists</h2>
          </div>
          
          <div className="space-y-4">
            {lists.map(list => (
              <div key={list.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Batch Name</p>
                    <p className="font-black text-slate-900 truncate max-w-[150px]">{list.batchName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PrintProductionList list={list} />
                    <ExportProductionList list={list} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {list.items.length} Articles
                  </div>
                  <div>
                    {new Date(list.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Link 
                  href={`/production/${list.id}`}
                  className="mt-4 w-full bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  Manage Batch Items
                </Link>
              </div>
            ))}
            {lists.length === 0 && (
              <p className="text-center text-slate-300 font-bold py-10 uppercase tracking-widest text-[10px]">No production lists yet.</p>
            )}
          </div>

          <div className="flex items-center gap-3 px-2 mt-8">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Wrapped / Ready</h2>
          </div>

          <div className="space-y-3">
            {displayWrapped.map(item => (
              <div key={item.id} className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg border border-emerald-100 overflow-hidden p-0.5 shadow-sm">
                    {item.design.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-contain" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-black text-slate-900 leading-none">{item.design.code}</p>
                      {item.isPack && (
                         <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-tighter">PACK x{item.count}</span>
                      )}
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.isPack ? "Ready for Shipping" : item.size}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-900 capitalize">{item.order.customerName}</p>
                  <p className="text-[7px] font-bold text-emerald-600 uppercase tracking-tighter mt-0.5">Wrapped</p>
                </div>
              </div>
            ))}
            {displayWrapped.length === 0 && (
              <p className="text-center text-slate-300 font-bold py-10 uppercase tracking-widest text-[10px]">No wrapped items ready.</p>
            )}
            
            <Link 
              href="/shipping" 
              className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100"
            >
              <Truck className="w-4 h-4" />
              Go to Shipping Queue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

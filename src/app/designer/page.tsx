import prisma from "@/lib/prisma";
import { Palette, CheckCircle2, Clock, AlertCircle, Hash, Layers } from "lucide-react";
import MarkBatchReadyButton from "@/components/MarkBatchReadyButton";
import WorkflowGuide from "@/components/WorkflowGuide";

export const dynamic = "force-dynamic";

export default async function DesignerHubPage() {
  const pendingItems = await prisma.orderItem.findMany({
    where: {
      designStatus: "PENDING",
      order: {
        status: { in: ["CONFIRMED", "ON_HOLD"] }
      },
      isPack: false
    },
    include: {
      design: true,
      brand: true,
      order: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Group items by DESIGN + SIZE
  const groupsMap: Record<string, any> = {};

  pendingItems.forEach(item => {
    const key = `${item.designId}-${item.size}`;
    if (!groupsMap[key]) {
      groupsMap[key] = {
        design: item.design,
        size: item.size,
        items: [],
        brandNames: new Set(),
        orders: [],
        notes: new Set(),
      };
    }
    groupsMap[key].items.push(item);
    groupsMap[key].brandNames.add(item.brand.name);
    groupsMap[key].orders.push(item.order.reference);
    if (item.order.note) {
      groupsMap[key].notes.add(item.order.note);
    }
  });

  const groups = Object.values(groupsMap).sort((a, b) => 
    a.design.code.localeCompare(b.design.code)
  );

  return (
    <div className="space-y-8">
      <WorkflowGuide 
        step="Designer List"
        purpose="Prepare carpet designs grouped by same design and same size."
        instruction="Designers prepare carpet designs here. Items are grouped by same design and same size to avoid repeated work. Once all required designs are ready, the order can move to production."
        prevStep="Orders"
        prevHref="/orders"
        nextStep="Production List"
        nextHref="/production"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            Designer List
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            {groups.length} Grouped Design Batches ({pendingItems.length} Total Items)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groups.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase">Queue Clear</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">No designs pending in production</p>
          </div>
        ) : (
          groups.map((group, idx) => (
            <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[300px]">
              {/* Design Image Section */}
              <div className="w-full md:w-80 bg-slate-50 relative flex-shrink-0">
                {group.design.imageUrl ? (
                  <img src={group.design.imageUrl} className="w-full h-full object-contain p-4" alt={group.design.code} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Palette className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  {Array.from(group.brandNames).map((brand: any) => (
                    <span key={brand} className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg">
                      {brand}
                    </span>
                  ))}
                </div>
                <div className="absolute bottom-6 right-6 bg-amber-500 text-white w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-xl shadow-amber-100">
                  <span className="text-lg font-black leading-none">{group.items.length}</span>
                  <span className="text-[7px] font-black uppercase">Qty</span>
                </div>
              </div>

              {/* Information Section */}
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        {group.design.code}
                      </h2>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-tight mt-1">{group.design.name}</p>
                    </div>
                    <div className="px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Design Pending
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Side: Size & Orders */}
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Size</p>
                        <div className="inline-block bg-slate-900 text-white px-4 py-2 rounded-xl text-2xl font-black tracking-tighter">
                          {group.size}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Hash className="w-3 h-3" />
                          Affected Orders
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(group.orders)).map((ref: any) => (
                            <span key={ref} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-black text-xs border border-slate-200">
                              #{ref}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Notes */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Production Notes
                      </p>
                      <div className="space-y-2">
                        {group.notes.size > 0 ? Array.from(group.notes).map((note: any, nIdx) => (
                          <div key={nIdx} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-700 italic leading-relaxed">"{note}"</p>
                          </div>
                        )) : (
                          <p className="text-[10px] font-bold text-slate-300 uppercase italic">No special instructions</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-50">
                  <MarkBatchReadyButton 
                    itemIds={group.items.map((i: any) => i.id)} 
                    label={`Mark all ${group.items.length} items as READY`}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

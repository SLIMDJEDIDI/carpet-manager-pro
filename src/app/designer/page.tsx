import prisma from "@/lib/prisma";
import { Palette, CheckCircle2, Printer, Clock, AlertCircle } from "lucide-react";
import { setDesignStatus } from "@/lib/actions";
import { revalidatePath } from "next/cache";

async function markReady(itemId: string) {
  "use server";
  await setDesignStatus(itemId, "READY");
  revalidatePath("/designer");
}

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            Designer Hub
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">
            {pendingItems.length} Designs Needed for Production
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pendingItems.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase">Queue Clear</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">All designs are ready</p>
          </div>
        ) : (
          pendingItems.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
              {/* Design Image */}
              <div className="w-full md:w-64 h-64 md:h-auto bg-slate-50 relative">
                {item.design.imageUrl ? (
                  <img src={item.design.imageUrl} className="w-full h-full object-cover" alt={item.design.code} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Palette className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-lg text-white font-black text-[10px] uppercase tracking-widest">
                  {item.brand.name}
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                      {item.design.code}
                    </h2>
                    <div className="px-3 py-1 bg-amber-50 rounded-lg border border-amber-100 text-amber-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Design Pending
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mt-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Size</p>
                      <p className="text-xl font-black text-slate-900 uppercase">{item.size}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Ref</p>
                      <p className="text-xl font-black text-slate-900 uppercase">#{item.order.reference}</p>
                    </div>
                  </div>

                  {item.order.note && (
                    <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-none mb-1">Production Note</p>
                        <p className="text-xs font-bold text-indigo-700 italic">"{item.order.note}"</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-8">
                  <form action={async () => { "use server"; await markReady(item.id); }} className="flex-1">
                    <button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100">
                      <CheckCircle2 className="w-5 h-5" />
                      Mark Design Ready
                    </button>
                  </form>
                  <button className="h-14 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all flex items-center justify-center">
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

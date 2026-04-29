import prisma from "@/lib/prisma";
import { Truck, Package, CheckCircle2, MapPin } from "lucide-react";
import PrintLabel from "@/components/PrintLabel";
import { shipOrder, markItemWrapped } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          status: { in: ["IN_PRODUCTION", "WRAPPED"] }
        }
      }
    },
    include: { 
      items: {
        include: { brand: true, design: true }
      }
    },
    take: 20,
    orderBy: { updatedAt: "desc" },
  });

  const getWrappedCount = (items: any[]) => items.filter(i => i.status === "WRAPPED").length;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <div className="border-l-8 border-blue-500 pl-4 md:pl-6">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">Shipping Desk</h1>
          <p className="text-slate-500 font-bold text-xs md:text-sm mt-1">One parcel for multiple articles per customer.</p>
        </div>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const wrappedCount = getWrappedCount(order.items);
          const allWrapped = wrappedCount === order.items.length;

          return (
            <div key={order.id} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-4 md:p-6 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-white p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-sm">
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 leading-none capitalize truncate max-w-[150px] md:max-w-none">{order.customerName}</h3>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mt-1.5 tracking-widest truncate">REF #{order.reference} • {order.customerPhone}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                  {allWrapped ? (
                    <form action={shipOrder} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input 
                        type="text" 
                        name="parcelNumber"
                        placeholder="Parcel #" 
                        required
                        className="text-sm font-black border-2 border-slate-300 rounded-xl px-4 py-2.5 focus:ring-0 focus:border-blue-600 w-full sm:w-40 bg-white text-black placeholder:text-slate-400"
                      />
                      <button type="submit" className="bg-blue-600 text-white px-5 py-3 sm:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                        <Truck className="w-4 h-4" />
                        Ship
                      </button>
                    </form>
                  ) : (
                    <div className="bg-amber-50 text-amber-600 px-4 py-2.5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-amber-100 text-center">
                      Waiting for {order.items.length - wrappedCount} items
                    </div>
                  )}
                  <div className="flex justify-center">
                    <PrintLabel order={order as any} />
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {order.items.map((item) => (
                    <div key={item.id} className={`p-3 md:p-4 rounded-2xl md:rounded-3xl border flex items-center justify-between gap-3 md:gap-4 transition-all ${
                      item.status === "WRAPPED" ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl border border-slate-200 flex-shrink-0 overflow-hidden">
                          {item.design.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1 truncate">{item.design.code}</p>
                          <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest truncate">{item.brand.name}</p>
                          <div className="inline-block bg-white px-2 py-0.5 rounded border border-slate-100 mt-1">
                            <p className="text-[10px] md:text-xs font-black text-slate-900 tracking-tight">{item.size}</p>
                          </div>
                        </div>
                      </div>
                      
                      {item.status === "IN_PRODUCTION" && (
                        <form action={markItemWrapped.bind(null, item.id)}>
                          <button type="submit" className="text-emerald-600 font-black text-[9px] uppercase border border-emerald-200 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors bg-white">
                            Wrap
                          </button>
                        </form>
                      )}
                      {item.status === "WRAPPED" && (
                        <div className="text-emerald-500 bg-white p-1.5 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 md:mt-6 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-4 border-t border-slate-50">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{order.customerAddress} {order.customerPostalCode && `(${order.customerPostalCode})`} - {order.customerGovernorate}, {order.customerDelegation}</span>
                </div>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="p-20 text-center text-slate-400 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-5" />
            <p className="font-black uppercase tracking-widest text-xs">No orders in the shipping pipeline.</p>
          </div>
        )}
      </div>
    </div>
  );
}

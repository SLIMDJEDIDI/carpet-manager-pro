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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="border-l-8 border-blue-500 pl-6">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Shipping Desk</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">One parcel for multiple articles per customer.</p>
        </div>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const wrappedCount = getWrappedCount(order.items);
          const allWrapped = wrappedCount === order.items.length;

          return (
            <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-6 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-none capitalize">{order.customerName}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">REF #{order.reference} • {order.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {allWrapped ? (
                    <form action={shipOrder} className="flex items-center gap-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input 
                        type="text" 
                        name="parcelNumber"
                        placeholder="Parcel Number" 
                        required
                        className="text-sm font-black border-2 border-slate-300 rounded-xl px-4 py-2.5 focus:ring-0 focus:border-blue-600 w-48 bg-white text-black placeholder:text-slate-400"
                      />
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Ship Parcel
                      </button>
                    </form>
                  ) : (
                    <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                      Waiting for {order.items.length - wrappedCount} articles
                    </div>
                  )}
                  <PrintLabel order={order as any} />
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.items.map((item) => (
                    <div key={item.id} className={`p-4 rounded-3xl border flex items-center justify-between gap-4 transition-all ${
                      item.status === "WRAPPED" ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex-shrink-0 overflow-hidden">
                          {item.design.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{item.design.code}</p>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.brand.name}</p>
                          <div className="inline-block bg-white px-2 py-0.5 rounded border border-slate-100 mt-1">
                            <p className="text-xs font-black text-slate-900 tracking-tight">{item.size}</p>
                          </div>
                        </div>
                      </div>
                      
                      {item.status === "IN_PRODUCTION" && (
                        <form action={markItemWrapped.bind(null, item.id)}>
                          <button type="submit" className="text-emerald-600 font-black text-[9px] uppercase border border-emerald-100 px-2 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
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
                 <div className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Delivery Address: {order.customerAddress} {order.customerPostalCode && `(${order.customerPostalCode})`}
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

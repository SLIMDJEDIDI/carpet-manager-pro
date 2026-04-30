import prisma from "@/lib/prisma";
import { Truck, Printer, Search, Package, MapPin, Calendar, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { archiveDispatch } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function JaxManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q || "";

  const orders = await prisma.order.findMany({
    where: {
      status: "SHIPPED",
      jaxTrackingId: { not: null },
      OR: [
        { customerName: { contains: query, mode: "insensitive" } },
        { customerPhone: { contains: query, mode: "insensitive" } },
        { jaxTrackingId: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      items: {
        include: { brand: true, design: true }
      }
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="border-l-8 border-indigo-600 pl-4 md:pl-6">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            JAX Dispatch
          </h1>
          <p className="text-slate-500 font-bold text-xs md:text-sm mt-2 uppercase tracking-widest">
            Manage labels for parcels waiting for JAX pickup
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <form>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search Name, Phone or EAN..."
              className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
            />
          </form>
        </div>
      </div>

      {/* Stats / Info Bar */}
      <div className="bg-indigo-900 rounded-[2rem] p-6 text-white flex flex-wrap items-center gap-8 shadow-xl shadow-indigo-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16 blur-2xl"></div>
        <div className="relative z-10 flex items-center gap-4 border-r border-indigo-700 pr-8">
          <div className="bg-indigo-500/30 p-3 rounded-2xl">
            <Truck className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 leading-none mb-1">Waiting Pickup</p>
            <p className="text-2xl font-black leading-none">{orders.length} Parcels</p>
          </div>
        </div>
        <div className="relative z-10 hidden md:block">
          <p className="text-indigo-400 text-xs font-bold max-w-xs leading-relaxed">
            These orders have been registered in JAX. Print the labels and stick them to the parcels.
          </p>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left Info Panel */}
              <div className="lg:w-1/3 p-6 md:p-8 bg-slate-50/50 border-r border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-none mb-1">{order.customerName}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">REF #{order.reference}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                    <p className="text-sm font-bold text-slate-600 leading-snug">
                      {order.customerAddress}, {order.customerDelegation}, {order.customerGovernorate}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <p className="text-sm font-bold text-slate-500">
                      Shipped: {new Date(order.updatedAt).toLocaleString('fr-TN')}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200/60">
                  <div className="bg-white rounded-2xl p-4 border-2 border-dashed border-indigo-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">JAX Tracking EAN</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-indigo-700 tracking-tight">{order.jaxTrackingId}</span>
                      <a 
                        href={`https://app.jax-delivery.com/#/tracking/${order.jaxTrackingId}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 hover:bg-indigo-50 rounded-xl transition-colors text-indigo-400 hover:text-indigo-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Content Panel */}
              <div className="flex-1 p-6 md:p-8 flex flex-col">
                <div className="flex-1">
                   <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Parcel Content</h3>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {order.totalAmount} DT COD
                    </div>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 bg-white">
                        <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                          {item.design.imageUrl && (
                            <img src={item.design.imageUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 leading-tight uppercase">{item.design.code}</p>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{item.brand.name}</p>
                          <p className="text-[10px] font-black text-slate-400 mt-1">{item.size}</p>
                        </div>
                      </div>
                    ))}
                   </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                  {order.jaxReceiptUrl ? (
                    <a 
                      href={order.jaxReceiptUrl} 
                      target="_blank" 
                      className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200"
                    >
                      <Printer className="w-5 h-5" />
                      Print Etiquette
                    </a>
                  ) : (
                    <div className="w-full sm:flex-1 bg-slate-100 text-slate-400 px-8 py-5 rounded-2xl font-black uppercase text-xs text-center border-2 border-dashed border-slate-200">
                      No Label URL found
                    </div>
                  )}
                  
                  <form action={archiveDispatch} className="w-full sm:w-auto">
                    <input type="hidden" name="orderId" value={order.id} />
                    <button 
                      type="submit"
                      className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-2 border-emerald-100 hover:border-emerald-600 px-6 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Done & Dispatch
                    </button>
                  </form>
                  
                  <Link 
                    href={`/orders/edit/${order.id}`}
                    className="w-full sm:w-auto bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-500 px-6 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all text-center"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
            <div className="bg-indigo-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
              <Truck className="w-10 h-10 text-indigo-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">No parcels waiting</h3>
            <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm leading-relaxed">
              When you ship orders from the Shipping Desk, they will appear here for label printing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

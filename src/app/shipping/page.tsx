import prisma from "@/lib/prisma";
import Link from "next/link";
import { Truck, Package, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import PrintLabel from "@/components/PrintLabel";
import BulkJaxShipping from "@/components/BulkJaxShipping";
import SingleShipButton from "@/components/SingleShipButton";
import { shipOrder, markItemWrapped, updateItemStatuses } from "@/lib/actions";
import WorkflowGuide from "@/components/WorkflowGuide";
import BatchWrapButton from "@/components/BatchWrapButton";
import OrderPartialShipManager from "@/components/OrderPartialShipManager";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  try {
  const orders = await prisma.order.findMany({
    where: { 
      status: { in: ["CONFIRMED", "READY_TO_SHIP", "PARTIALLY_SHIPPED"] },
      items: { 
        some: { 
          OR: [
            { status: "WRAPPED" },
            { status: "SHIPPED" },
            { productionListId: { not: null } }
          ]
        } 
      } 
    },
    include: { items: { include: { design: true, brand: true } } },
    orderBy: { reference: 'desc' }
  });

  const getWrappedCount = (items: any[]) => items ? items.filter(i => !i.isPack && i.status === "WRAPPED").length : 0;
  const getTotalItems = (items: any[]) => items ? items.filter(i => !i.isPack).length : 0;
  const getDesignsReady = (items: any[]) => items ? items.filter(i => !i.isPack && i.designStatus === "READY").length : 0;
  
  const readyOrders = orders.filter(order => {
    const total = getTotalItems(order.items);
    const wrapped = getWrappedCount(order.items);
    const designs = getDesignsReady(order.items);
    return total > 0 && wrapped === total && designs === total;
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <WorkflowGuide 
        step="Wrapping"
        purpose="Group articles into parcels and print shipping labels."
        instruction="Mark items as 'Wrapped' when they are ready. Once all items in an order are wrapped, the order is ready for JAX dispatch."
        prevStep="Production List"
        prevHref="/production"
        nextStep="Shipping / JAX"
        nextHref="/jax"
      />

      <div className="flex items-center justify-between">
        <div className="border-l-8 border-blue-600 pl-4 md:pl-6">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">Wrapping Desk</h1>
          <p className="text-slate-500 font-bold text-xs md:text-sm mt-1">Operational Tunnel: Grouping & Dispatching.</p>
        </div>
      </div>

      <BulkJaxShipping readyOrders={readyOrders} onShip={shipOrder} />

      <div className="space-y-6">
        {orders.map((order) => {
          const wrappedCount = getWrappedCount(order.items);
          const totalItems = getTotalItems(order.items);
          const allWrapped = totalItems > 0 && wrappedCount === totalItems;

          return (
            <div key={order.id} className={`bg-white rounded-[1.5rem] md:rounded-[2.5rem] border overflow-hidden group hover:shadow-xl transition-all duration-300 ${
              order.status === "PARTIALLY_SHIPPED" ? "border-indigo-100 shadow-indigo-50" : "border-slate-100 shadow-sm"
            }`}>
              <div className="p-4 md:p-6 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-sm ${
                    order.status === "PARTIALLY_SHIPPED" ? "bg-indigo-600 text-white" : "bg-white text-blue-600"
                  }`}>
                    {order.status === "PARTIALLY_SHIPPED" ? <Truck className="w-5 h-5 md:w-6 md:h-6" /> : <Package className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg md:text-xl font-black text-slate-900 leading-none capitalize truncate max-w-[150px] md:max-w-none">{order.customerName || 'No Name'}</h3>
                      {order.status === "PARTIALLY_SHIPPED" && (
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none shadow-lg shadow-indigo-100">Partial</span>
                      )}
                    </div>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mt-1.5 tracking-widest truncate">REF #{order.reference || '??'} • {order.customerPhone || 'No Phone'}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                  {!allWrapped && (
                    <BatchWrapButton 
                      itemIds={order.items.filter(i => !i.isPack && i.status !== "WRAPPED" && i.status !== "SHIPPED").map(i => i.id)} 
                      orderId={order.id} 
                    />
                  )}
                  {allWrapped ? (
                    <SingleShipButton orderId={order.id} onShip={shipOrder} />
                  ) : (
                    <div className="flex flex-col items-end">
                       <div className="bg-amber-50 text-amber-600 px-4 py-2.5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-amber-100 text-center">
                        Incomplete: {totalItems - wrappedCount - order.items.filter(i => i.status === "SHIPPED").length} Left
                      </div>
                      <p className="text-[8px] font-black text-slate-300 uppercase mt-1">Use Partial Shipping below if needed</p>
                    </div>
                  )}
                   <PrintLabel order={order} />
                  <Link 
                    href={`/shipping/print/${order.id}`} 
                    target="_blank"
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 border border-slate-900 shadow-lg shadow-slate-200"
                  >
                    <FileText className="w-4 h-4" />
                    Print List
                  </Link>
                </div>
              </div>

              <div className="p-4 md:p-6">
                <OrderPartialShipManager 
                  orderId={order.id}
                  orderRef={order.reference || "N/A"}
                  customerName={order.customerName}
                  items={order.items}
                  onShip={shipOrder}
                />
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
            <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50">
              <Package className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest">No orders in shipping stage</p>
          </div>
        )}
      </div>
    </div>
  );
  } catch (error: any) {
    console.error("Shipping page crashed:", error?.message || error);
    return (
      <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-rose-200">
        <h1 className="text-2xl font-black text-rose-600 uppercase">Shipping Error</h1>
        <p className="text-slate-500 mt-4 font-bold">{error?.message || "Unknown server error"}</p>
        <a href="/shipping" className="inline-block mt-8 bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-xs">Retry</a>
      </div>
    );
  }
}

function ItemCard({ item }: { item: any }) {
  return (
    <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl border flex items-center justify-between gap-3 md:gap-4 transition-all ${
      item.status === "WRAPPED" ? "bg-emerald-50 border-emerald-100 shadow-inner" : "bg-slate-50 border-slate-100"
    }`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl border border-slate-200 flex-shrink-0 overflow-hidden">
          {item.design?.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1 truncate">{item.design?.code || '???'}</p>
          <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest truncate">{item.brand?.name || '???'}</p>
          <div className="inline-block bg-white px-2 py-0.5 rounded border border-slate-100 mt-1">
            <p className="text-[10px] md:text-xs font-black text-slate-900 tracking-tight">{item.size}</p>
          </div>
        </div>
      </div>
      
      {item.status === "IN_PRODUCTION" && (
        <form action={markItemWrapped}>
          <input type="hidden" name="itemId" value={item.id} />
          <button type="submit" className="text-emerald-600 font-black text-[9px] uppercase border border-emerald-200 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors bg-white">
            Wrap
          </button>
        </form>
      )}

      {item.status === "WRAPPED" && (
        <div className="bg-emerald-500 p-1.5 rounded-full">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

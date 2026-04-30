import prisma from "@/lib/prisma";
import { Plus, ShoppingBag, Package, Edit3, Search, ChevronLeft, ChevronRight, MapPin, CheckCircle2, Clock, Phone } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import DeleteOrderButton from "@/components/DeleteOrderButton";
import ConfirmOrderButton from "@/components/ConfirmOrderButton";
import { deleteOrder, confirmOrder } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q || "";
  const page = parseInt(pageParam || "1");
  const pageSize = 20;

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerName: { contains: query } },
        { customerPhone: { contains: query } },
      ],
    },
    include: {
      items: {
        where: { parentItemId: null },
        include: {
          brand: true,
          design: true,
          subItems: true
        }
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const totalOrders = await prisma.order.count({
    where: {
      OR: [
        { customerName: { contains: query } },
        { customerPhone: { contains: query } },
      ],
    },
  });

  const totalPages = Math.ceil(totalOrders / pageSize);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-50 text-amber-600 border border-amber-100";
      case "CONFIRMED": return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "SHIPPED": return "bg-purple-50 text-purple-600 border border-purple-100";
      default: return "bg-slate-50 text-slate-400 border border-slate-100";
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-600";
      case "IN_PRODUCTION": return "bg-blue-100 text-blue-600";
      case "WRAPPED": return "bg-emerald-100 text-emerald-600";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="border-l-8 border-slate-900 pl-4 md:pl-6">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">Orders Management</h1>
          <p className="text-slate-500 font-bold text-sm md:text-base mt-1">Comprehensive view of customer orders and article status.</p>
        </div>
        <Link href="/orders/new" className="bg-emerald-600 text-white px-6 py-4 md:py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all font-black uppercase tracking-widest shadow-xl shadow-emerald-100">
          <Plus className="w-5 h-5" />
          New Order
        </Link>
      </div>

      <div className="flex gap-4 items-center bg-white p-2 rounded-2xl border-2 border-slate-300 shadow-sm focus-within:border-emerald-600 transition-all">
        <div className="pl-4">
          <Search className="w-5 h-5 text-black" />
        </div>
        <form className="flex-1">
          <input 
            type="text" 
            name="q"
            placeholder="Search customer..." 
            defaultValue={query}
            className="w-full bg-transparent border-none focus:ring-0 text-black py-3 font-black placeholder:text-slate-400 text-sm md:text-base"
          />
        </form>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
            {/* Order Header */}
            <div className="p-4 md:p-6 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm hidden sm:block">
                  <ShoppingBag className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-black leading-none capitalize truncate max-w-[200px] md:max-w-none">{order.customerName}</h3>
                  <p className="text-[10px] font-bold text-black uppercase mt-1.5 tracking-widest">
                    REF #{order.reference} • {format(order.createdAt, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6">
                <div className="text-left md:text-right">
                  <p className="text-[9px] font-black text-black uppercase tracking-widest">Phone</p>
                  <p className="font-bold text-black text-xs md:text-base">{order.customerPhone}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-[9px] font-black text-black uppercase tracking-widest mb-1">Status</p>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[8px] md:text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                      {order.status === "PENDING" && <Clock className="w-3 h-3" />}
                      {order.status === "CONFIRMED" && <CheckCircle2 className="w-3 h-3" />}
                      {order.status === "PENDING" ? "RECEIVED (WAITING CONFIRMATION)" : order.status}
                    </span>
                    {order.status === "PENDING" && (
                      <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
                        <a
                          href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "").startsWith("216") ? order.customerPhone.replace(/[^0-9]/g, "") : "216" + order.customerPhone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 transition-all shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call Now
                        </a>
                        <Link
                          href={`/orders/edit/${order.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white border border-slate-100 transition-all shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Details
                        </Link>
                        <ConfirmOrderButton orderId={order.id} action={confirmOrder} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2 pl-3 md:pl-4 border-l border-slate-200">
                  <Link 
                    href={`/orders/edit/${order.id}`}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    title="Edit Order"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Link>
                  <DeleteOrderButton orderId={order.id} action={deleteOrder} />
                </div>
              </div>
            </div>


            {/* Order Items */}
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {order.items.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-3 md:p-4 rounded-3xl border border-slate-100 flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl border border-slate-200 overflow-hidden flex-shrink-0">
                      {item.design.imageUrl ? (
                        <img src={item.design.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[8px] md:text-xs">NO IMG</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[8px] md:text-[10px] font-black text-black bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest truncate max-w-[60px]">
                          {item.brand.name}
                        </span>
                        <span className={`text-[7px] md:text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${getItemStatusColor(item.status)}`}>
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="font-black text-black truncate uppercase text-xs md:text-sm tracking-tight">{item.design.code} - {item.design.name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs md:text-sm font-black text-black tracking-tight">{item.size}</p>
                        {item.isPack && (
                          <span className="text-[7px] md:text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm shadow-amber-200">Pack</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 md:mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 md:pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-bold text-black uppercase tracking-widest">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{order.customerAddress} {order.customerPostalCode && `(${order.customerPostalCode})`} - {order.customerGovernorate}, {order.customerDelegation}</span>
                </div>
                <div className="text-lg md:text-xl font-black text-black text-right">
                  {order.totalAmount} <span className="text-xs text-black uppercase">DT</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="p-20 text-center text-slate-400 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-5" />
            <p className="font-black uppercase tracking-widest text-xs">No orders found. Try a different search or create one!</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-6">
            <Link 
              href={`/orders?q=${query}&page=${Math.max(1, page - 1)}`}
              className={`p-2 rounded-xl border ${page <= 1 ? 'text-slate-200 border-slate-50' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <span className="text-sm font-black text-black uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <Link 
              href={`/orders?q=${query}&page=${Math.min(totalPages, page + 1)}`}
              className={`p-2 rounded-xl border ${page >= totalPages ? 'text-slate-200 border-slate-50' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              <ChevronRight className="w-6 h-6" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

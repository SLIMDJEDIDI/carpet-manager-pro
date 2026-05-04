import prisma from "@/lib/prisma";
import { Plus, ShoppingBag, Package, Edit3, Search, ChevronLeft, ChevronRight, MapPin, CheckCircle2, Clock, Phone, AlertCircle, Archive, MessageSquare, AlertOctagon, TrendingUp, Filter, Factory, RotateCcw, Truck, Printer } from "lucide-react";
import Link from "next/link";
import WorkflowGuide from "@/components/WorkflowGuide";
import ConfirmOrderButton from "@/components/ConfirmOrderButton";
import { confirmOrder } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  try {
  const { q: query = "", page: pageStr = "1" } = await searchParams;
  const page = parseInt(pageStr);
  const pageSize = 10;

  const activeStatuses = ["PENDING", "CONFIRMED", "ON_HOLD", "PARTIALLY_SHIPPED"];
  
  // STATS FETCHING FOR TOP SUMMARY
  const [pendingCount, confirmedCount, partialCount, totalActiveCount] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.count({ where: { status: "PARTIALLY_SHIPPED" } }),
    prisma.order.count({ where: { status: { in: activeStatuses } } })
  ]);

  const activeOrders = await prisma.order.findMany({
    where: {
      status: { in: activeStatuses },
      OR: [
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerPhone: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: { items: { include: { design: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Manual sort to put ON_HOLD at top
  const sortedActive = [...activeOrders].sort((a, b) => {
    if (a.status === "ON_HOLD" && b.status !== "ON_HOLD") return -1;
    if (a.status !== "ON_HOLD" && b.status === "ON_HOLD") return 1;
    if (a.status === "PENDING" && b.status === "CONFIRMED") return -1;
    if (a.status === "CONFIRMED" && b.status === "PENDING") return 1;
    return 0;
  });

  const totalArchived = await prisma.order.count({
    where: {
      status: { notIn: activeStatuses },
      OR: [
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerPhone: { contains: query, mode: 'insensitive' } },
      ],
    }
  });

  const totalPages = Math.ceil(totalArchived / pageSize);

  const archiveOrders = await prisma.order.findMany({
    where: {
      status: { notIn: activeStatuses },
      OR: [
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerPhone: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: { items: { include: { design: true } } },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PENDING": return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: Clock, label: "RECEIVED" };
      case "CONFIRMED": return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2, label: "CONFIRMED" };
      case "PARTIALLY_SHIPPED": return { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", icon: Truck, label: "PARTIAL" };
      case "ON_HOLD": return { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", icon: AlertOctagon, label: "ON HOLD" };
      case "SHIPPED": return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: Package, label: "SHIPPED" };
      case "DISPATCHED": return { bg: "bg-indigo-900", text: "text-white", border: "border-indigo-800", icon: Printer, label: "DISPATCHED" };
      case "DELIVERED": return { bg: "bg-emerald-900", text: "text-white", border: "border-emerald-800", icon: CheckCircle2, label: "DELIVERED" };
      case "CANCELLED": return { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", icon: Archive, label: "CANCELLED" };
      case "RETURNED": return { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", icon: RotateCcw, label: "RETURNED" };
      default: return { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-100", icon: Archive, label: status };
    }
  };

  const renderOrderCard = (order: any, isArchive: boolean) => {
    const style = getStatusStyle(order.status);
    const StatusIcon = style.icon;
    const isUrgent = order.status === "ON_HOLD" || order.status === "PENDING";

    return (
      <div key={order.id} className={`bg-white rounded-[2.5rem] border ${isUrgent ? 'border-amber-200 shadow-xl shadow-amber-50' : 'border-slate-100 shadow-sm'} overflow-hidden group hover:border-slate-900 transition-all relative`}>
        {order.status === "ON_HOLD" && (
           <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
        )}
        
        <div className="p-6 md:p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          
          {/* SECTION 1: CUSTOMER IDENTITY */}
          <div className="flex items-start md:items-center gap-6 flex-1 min-w-0">
            <div className={`p-5 rounded-[2.2rem] border-2 transition-all shrink-0 ${isUrgent ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none truncate max-w-[250px] md:max-w-[450px]">{order.customerName}</h3>
                <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none">REF #{order.reference}</span>
                {order.status === "PARTIALLY_SHIPPED" && (
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none shadow-lg shadow-indigo-100">Partial Dispatch</span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <p className="font-black text-slate-400 text-sm tracking-tight flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {order.customerPhone}
                </p>
                <div className="w-px h-4 bg-slate-200"></div>
                {order.status === "PARTIALLY_SHIPPED" && (
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mr-4">
                    {order.items.filter((i:any) => i.status === "SHIPPED").length} / {order.items.filter((i:any) => !i.isPack).length} Articles Shipped
                  </p>
                )}
                <a 
                  href={`https://wa.me/216${order.customerPhone.replace(/\s+/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all active:scale-95 group/wa border border-[#25D366]/20"
                >
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 group-hover/wa:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <Phone className="w-1.5 h-1.5 text-[#25D366] fill-[#25D366]" />
                    </div>
                  </div>
                  WhatsApp Direct
                </a>
              </div>
            </div>
          </div>

          {/* SECTION 2: PRODUCTION STATUS & ACTIONS */}
          <div className="flex flex-col md:flex-row xl:flex-col items-start md:items-center xl:items-end gap-6 shrink-0">
            <div className="flex items-center gap-4">
              {order.status === "PENDING" && (
                <ConfirmOrderButton orderId={order.id} action={confirmOrder} />
              )}
              <div className="flex flex-col items-end">
                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border ${style.bg} ${style.text} ${style.border} font-black text-xs uppercase tracking-[0.2em] shadow-sm`}>
                  <StatusIcon className="w-4 h-4" />
                  {style.label}
                </div>
                {order.status === "CONFIRMED" && (
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                    <Factory className="w-3 h-3" />
                    Operational: In Production List
                  </p>
                )}
              </div>
            </div>
            
            {order.note && (
              <div className="bg-amber-50/50 px-5 py-3 rounded-2xl border border-amber-100 flex items-start gap-4 max-w-[350px]">
                <MessageSquare className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Note</p>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-tight italic leading-relaxed truncate">"{order.note}"</p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PREVIEW & NAVIGATION */}
          <div className="flex items-center gap-6 border-t xl:border-t-0 pt-6 xl:pt-0">
            <div className="flex flex-col items-end gap-3">
               <div className="flex -space-x-4">
                {order.items.slice(0, 4).map((item: any, idx: number) => (
                  <div key={idx} className="w-14 h-14 bg-white border-4 border-white rounded-[1.4rem] overflow-hidden shadow-xl shadow-slate-200 relative group/img z-[1] hover:z-10 transition-all">
                    {item.design.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" loading="lazy" />}
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="w-14 h-14 bg-slate-900 flex items-center justify-center rounded-[1.4rem] border-4 border-white shadow-xl shadow-slate-200 relative z-[5]">
                    <span className="text-[11px] font-black text-white">+{order.items.length - 4}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl shadow-slate-200">
                <p className="text-3xl font-black tracking-tighter leading-none">{order.totalAmount} <span className="text-xs uppercase text-slate-500 tracking-widest">DT</span></p>
              </div>
            </div>

            <Link 
              href={`/orders/edit/${order.id}`}
              className="h-20 w-20 bg-slate-50 text-slate-400 rounded-[2.2rem] flex flex-col items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-slate-100 group/edit border border-slate-100"
            >
              <Edit3 className="w-8 h-8 group-hover/edit:scale-110 transition-transform" />
              <span className="text-[8px] font-black uppercase mt-1">Manage</span>
            </Link>
          </div>
        </div>
        
        {/* FOOTER: SYSTEM DATA */}
        <div className="px-6 pb-6 md:px-10 md:pb-10 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500">
            <MapPin className="w-4 h-4 text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">{order.customerGovernorate || "Tunis"}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500">
            <Package className="w-4 h-4 text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">{order.items.length} Production Units</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500">
            <Clock className="w-4 h-4 text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="ml-auto">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">System Record ID: {order.id.slice(0,8)}...</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <WorkflowGuide 
        step="Orders"
        purpose="Review, Filter, and Confirm active customer orders."
        instruction="Every confirmed order is instantly exploded into production items. Use the quick stats below to manage your priority queue."
        nextStep="Designer List"
        nextHref="/designer"
      />

      {/* TOP ANALYTICS SUMMARY BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard label="Pending Confirmation" value={pendingCount} color="border-amber-500 text-amber-600" icon={Clock} />
        <SummaryCard label="Operational Orders" value={confirmedCount} color="border-emerald-500 text-emerald-600" icon={Factory} />
        <SummaryCard label="Partially Shipped" value={partialCount} color="border-indigo-500 text-indigo-600" icon={Truck} />
        <SummaryCard label="Total Active Queue" value={totalActiveCount} color="border-slate-900 text-slate-900" icon={TrendingUp} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-6 border-t-2 border-slate-50">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Management Center</h1>
          <p className="text-slate-500 font-bold text-sm mt-2 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {sortedActive.length} Orders in current operational view
          </p>
        </div>
        <Link href="/orders/new" className="bg-emerald-600 text-white h-16 px-10 rounded-[1.8rem] flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-100 active:scale-95">
          <Plus className="w-6 h-6" />
          Create New Order
        </Link>
      </div>

      <div className="flex gap-4 items-center bg-white p-3 rounded-[1.8rem] border-2 border-slate-200 shadow-sm focus-within:border-slate-900 focus-within:shadow-xl focus-within:shadow-slate-100 transition-all">
        <div className="pl-4">
          <Search className="w-6 h-6 text-slate-900" />
        </div>
        <form className="flex-1">
          <input 
            type="text" 
            name="q"
            placeholder="Search by customer name, phone number, or reference..." 
            defaultValue={query}
            className="w-full bg-transparent border-none focus:ring-0 text-slate-900 py-3 font-bold placeholder:text-slate-400 text-lg"
          />
        </form>
      </div>

      {/* 1. Active Focus Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2 rounded-xl shadow-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Operational Tunnel</h2>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">Live Status</span>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {sortedActive.map((order) => renderOrderCard(order, false))}
          {sortedActive.length === 0 && (
            <div className="p-32 text-center text-slate-400 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <CheckCircle2 className="w-20 h-20 mx-auto mb-6 opacity-5 text-emerald-500" />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Queue Is Empty</h3>
              <p className="font-black uppercase tracking-widest text-[10px]">Everything is confirmed and moving smoothly.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Order Archive Section */}
      <div className="space-y-8 pt-20 border-t-4 border-slate-50">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-xl border border-slate-200">
              <Archive className="w-5 h-5 text-slate-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter leading-none">Historical Records</h2>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{totalArchived} Orders in Archive</p>
        </div>

        <div className="grid grid-cols-1 gap-8 opacity-75 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
          {archiveOrders.map((order) => renderOrderCard(order, true))}
          
          {archiveOrders.length === 0 && (
            <div className="p-20 text-center text-slate-300 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
              <p className="font-black uppercase tracking-widest text-xs">No matching archival data found.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 pt-16">
            <Link 
              href={`/orders?q=${query}&page=${Math.max(1, page - 1)}`}
              className={`h-16 w-16 rounded-2xl border-2 flex items-center justify-center transition-all ${page <= 1 ? 'text-slate-200 border-slate-50 bg-slate-50' : 'text-slate-900 border-slate-900 hover:bg-slate-900 hover:text-white shadow-xl shadow-slate-200'}`}
            >
              <ChevronLeft className="w-8 h-8" />
            </Link>
            <div className="bg-white border-2 border-slate-900 px-10 h-16 flex items-center justify-center rounded-2xl shadow-xl">
               <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Page {page} / {totalPages}
              </span>
            </div>
            <Link 
              href={`/orders?q=${query}&page=${Math.min(totalPages, page + 1)}`}
              className={`h-16 w-16 rounded-2xl border-2 flex items-center justify-center transition-all ${page >= totalPages ? 'text-slate-200 border-slate-50 bg-slate-50' : 'text-slate-900 border-slate-900 hover:bg-slate-900 hover:text-white shadow-xl shadow-slate-200'}`}
            >
              <ChevronRight className="w-8 h-8" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
  } catch (error: any) {
    console.error("Orders page crashed:", error?.message || error);
    return (
      <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-rose-200">
        <h1 className="text-2xl font-black text-rose-600 uppercase">Orders Error</h1>
        <p className="text-slate-500 mt-4 font-bold">{error?.message || "Unknown server error"}</p>
        <a href="/orders" className="inline-block mt-8 bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-xs">Retry</a>
      </div>
    );
  }
}

function SummaryCard({ label, value, color, icon: Icon }: { label: string, value: number, color: string, icon: any }) {
  return (
    <div className={`bg-white border-b-4 ${color} rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="h-1 w-8 bg-slate-100 rounded-full"></div>
      </div>
      <p className="text-4xl font-black tracking-tighter mb-1">{value}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
    </div>
  );
}

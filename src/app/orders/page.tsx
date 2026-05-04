import prisma from "@/lib/prisma";
import { Plus, ShoppingBag, Package, Edit3, Search, ChevronLeft, ChevronRight, MapPin, CheckCircle2, Clock, Phone, AlertCircle, Archive, MessageSquare } from "lucide-react";
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
  const { q: query = "", page: pageStr = "1" } = await searchParams;
  const page = parseInt(pageStr);
  const pageSize = 10;

  const activeStatuses = ["PENDING", "CONFIRMED", "ON_HOLD"];
  
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-slate-200 text-slate-700";
      case "CONFIRMED": return "bg-emerald-600 text-white shadow-lg shadow-emerald-100";
      case "ON_HOLD": return "bg-amber-500 text-white shadow-lg shadow-amber-100";
      case "SHIPPED": return "bg-blue-600 text-white shadow-lg shadow-blue-100";
      case "DELIVERED": return "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20";
      case "CANCELLED": return "bg-rose-600 text-white";
      case "RETURNED": return "bg-indigo-600 text-white";
      default: return "bg-slate-100 text-slate-400";
    }
  };

  const renderOrderCard = (order: any, isArchive: boolean) => (
    <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:border-slate-900 transition-all">
      <div className="p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
        
        {/* SECTION 1: CUSTOMER & CONTACT */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="bg-slate-50 p-5 rounded-[2.2rem] border-2 border-slate-100 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none truncate max-w-[200px] md:max-w-[350px]">{order.customerName}</h3>
              <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest leading-none">REF #{order.reference}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <p className="font-black text-slate-500 text-xs tracking-tight">{order.customerPhone}</p>
              <a 
                href={`https://wa.me/216${order.customerPhone.replace(/\s+/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                title="WhatsApp Chat & Call"
                className="flex items-center gap-2 bg-[#25D366] text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#128C7E] hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95 group/wa shadow-sm"
              >
                <div className="relative">
                  <MessageSquare className="w-3.5 h-3.5 group-hover/wa:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <Phone className="w-1.5 h-1.5 text-[#25D366] fill-[#25D366]" />
                  </div>
                </div>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* SECTION 2: STATUS & NOTES */}
        <div className="flex flex-col md:items-end gap-4 shrink-0">
          <div className="flex items-center gap-3">
            {order.status === "PENDING" && (
              <ConfirmOrderButton orderId={order.id} action={confirmOrder} />
            )}
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm ${getStatusColor(order.status)}`}>
                {order.status === "PENDING" ? "RECEIVED" : order.status}
              </span>
              {order.status === "CONFIRMED" && (
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                  order in production list
                </p>
              )}
            </div>
          </div>
          
          {order.note && (
            <div className="bg-amber-50 px-4 py-2.5 rounded-2xl border border-amber-100 flex items-start gap-3 max-w-[300px]">
              <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight italic leading-relaxed">"{order.note}"</p>
            </div>
          )}
        </div>

        {/* SECTION 3: DESIGN PREVIEW & PRICE & EDIT */}
        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-6 md:pt-0">
          <div className="flex flex-col items-end gap-3">
             <div className="flex -space-x-4">
              {order.items.slice(0, 4).map((item: any, idx: number) => (
                <div key={idx} className="w-12 h-12 bg-white border-4 border-white rounded-[1.2rem] overflow-hidden shadow-xl shadow-slate-200 relative group/img z-[1]">
                  {item.design.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />}
                </div>
              ))}
              {order.items.length > 4 && (
                <div className="w-12 h-12 bg-slate-900 flex items-center justify-center rounded-[1.2rem] border-4 border-white shadow-xl shadow-slate-200 relative z-[5]">
                  <span className="text-[10px] font-black text-white">+{order.items.length - 4}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 shadow-inner">
              <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{order.totalAmount} <span className="text-xs uppercase text-slate-400 tracking-widest">DT</span></p>
            </div>
          </div>

          <Link 
            href={`/orders/edit/${order.id}`}
            className="h-16 w-16 bg-slate-50 text-slate-400 rounded-[1.8rem] flex flex-col items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-slate-100 group/edit"
          >
            <Edit3 className="w-6 h-6 group-hover/edit:rotate-12 transition-transform" />
            <span className="text-[7px] font-black uppercase mt-1">Edit</span>
          </Link>
        </div>
      </div>
      
      {/* FOOTER: METADATA */}
      <div className="px-6 pb-6 md:px-10 md:pb-10 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500">
          <MapPin className="w-4 h-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{order.customerGovernorate || "Tunis"}</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500">
          <Package className="w-4 h-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{order.items.length} Production Units</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500">
          <Clock className="w-4 h-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <WorkflowGuide 
        step="Order Management"
        purpose="Create and confirm customer orders."
        instruction="Create and confirm customer orders here. Once an order is confirmed, its carpet items will be sent automatically to the Production List."
        nextStep="Production List"
        nextHref="/production"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="border-l-8 border-slate-900 pl-4 md:pl-6">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">Orders Management</h1>
          <p className="text-slate-500 font-bold text-sm md:text-base mt-1">Review active orders and browse history.</p>
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
            placeholder="Search Name or Phone..." 
            defaultValue={query}
            className="w-full bg-transparent border-none focus:ring-0 text-black py-3 font-black placeholder:text-slate-400 text-sm md:text-base"
          />
        </form>
      </div>

      {/* 1. Active Focus Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-amber-100 p-2 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">🚀 ACTION REQUIRED ({activeOrders.length})</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {activeOrders.map((order) => renderOrderCard(order, false))}
          {activeOrders.length === 0 && (
            <div className="p-16 text-center text-slate-400 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-10 text-emerald-500" />
              <p className="font-black uppercase tracking-widest text-xs">No active orders needing confirmation. Good job!</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Order Archive Section */}
      <div className="space-y-6 pt-10 border-t-2 border-slate-100">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-slate-100 p-2 rounded-xl">
            <Archive className="w-5 h-5 text-slate-500" />
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-400 uppercase tracking-tighter">📦 ORDER ARCHIVE</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {archiveOrders.map((order) => renderOrderCard(order, true))}
          
          {archiveOrders.length === 0 && !query && (
            <div className="p-10 text-center text-slate-300 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <p className="font-black uppercase tracking-widest text-[10px]">Your archive is empty.</p>
            </div>
          )}

          {archiveOrders.length === 0 && query && (
            <div className="p-10 text-center text-slate-300 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <p className="font-black uppercase tracking-widest text-[10px]">No archived orders match your search.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-10">
            <Link 
              href={`/orders?q=${query}&page=${Math.max(1, page - 1)}`}
              className={`p-3 rounded-2xl border-2 transition-all ${page <= 1 ? 'text-slate-200 border-slate-50 bg-slate-50' : 'text-slate-900 border-slate-900 hover:bg-slate-900 hover:text-white shadow-lg shadow-slate-200'}`}
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="bg-white border-2 border-slate-900 px-6 py-3 rounded-2xl shadow-md">
               <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Page {page} of {totalPages}
              </span>
            </div>
            <Link 
              href={`/orders?q=${query}&page=${Math.min(totalPages, page + 1)}`}
              className={`p-3 rounded-2xl border-2 transition-all ${page >= totalPages ? 'text-slate-200 border-slate-50 bg-slate-50' : 'text-slate-900 border-slate-900 hover:bg-slate-900 hover:text-white shadow-lg shadow-slate-200'}`}
            >
              <ChevronRight className="w-6 h-6" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

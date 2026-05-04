import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  Users, 
  ShoppingCart, 
  Clock, 
  CheckCircle2,
  Package,
  Plus,
  AlertOctagon,
  AlertTriangle,
  Truck,
  Palette,
  Factory,
  TrendingUp,
  BarChart3,
  Wallet,
  ArrowRight,
  ShieldAlert,
  Zap,
  RotateCcw,
  XCircle,
  Calendar
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "today" } = await searchParams;

  const now = new Date();
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (range === "yesterday") {
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "week") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "month") {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  // DATA FETCHING
  // 1. ACTION REQUIRED / URGENT
  const onHoldOrders = await prisma.order.count({ where: { status: "ON_HOLD" } });
  const damagedItems = await prisma.orderItem.count({ where: { status: "DAMAGED" } });
  const jaxErrors = await prisma.jaxLog.count({ where: { status: "ERROR" } });
  
  const pendingConfirm = await prisma.order.count({ where: { status: "PENDING" } });
  const waitingDesign = await prisma.order.count({ 
    where: { 
      status: "CONFIRMED",
      items: { some: { designStatus: "PENDING", isPack: false } } 
    } 
  });
  const readyToShipCount = await prisma.order.count({ where: { status: "READY_TO_SHIP" } });

  // 2. WORKFLOW TUNNEL
  const tunnelStats = {
    received: await prisma.order.count({ where: { status: "PENDING" } }),
    confirmed: await prisma.order.count({ where: { status: "CONFIRMED" } }),
    design: await prisma.order.count({ 
      where: { 
        status: "CONFIRMED",
        items: { some: { designStatus: "PENDING", isPack: false } } 
      } 
    }),
    production: await prisma.order.count({ 
      where: { 
        status: { in: ["CONFIRMED", "ON_HOLD"] },
        items: { some: { status: "IN_PRODUCTION" } } 
      } 
    }),
    wrapped: await prisma.order.count({ 
      where: { 
        OR: [
          { status: "READY_TO_SHIP" },
          { 
            status: "CONFIRMED",
            items: { some: { status: "WRAPPED" } } 
          }
        ]
      } 
    }),
    shipped: await prisma.order.count({ where: { status: "SHIPPED" } }),
    delivered: await prisma.order.count({ where: { status: "DELIVERED" } }),
    returned: await prisma.order.count({ where: { status: "RETURNED" } }),
  };

  // 3. TODAY'S SNAPSHOT (OR FILTERED)
  const dateFilter = { gte: startDate };
  if (range === "yesterday") {
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    (dateFilter as any).lte = endDate;
  }

  const snapshot = {
    created: await prisma.order.count({ where: { createdAt: dateFilter } }),
    confirmed: await prisma.order.count({ where: { status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] }, updatedAt: dateFilter } }),
    produced: await prisma.order.count({ 
      where: { 
        items: { some: { status: "WRAPPED", updatedAt: dateFilter } } 
      } 
    }),
    sent: await prisma.order.count({ where: { status: "SHIPPED", updatedAt: dateFilter } }),
    revenue: await prisma.order.aggregate({
      where: { status: { in: ["SHIPPED", "DELIVERED"] }, updatedAt: dateFilter },
      _sum: { totalAmount: true }
    }).then(res => res._sum.totalAmount || 0),
  };

  // 4. MONEY PREVIEW
  const money = {
    expected: await prisma.order.aggregate({
      where: { status: "SHIPPED" },
      _sum: { totalAmount: true }
    }).then(res => res._sum.totalAmount || 0),
    received: await prisma.order.aggregate({
      where: { status: "DELIVERED" },
      _sum: { totalAmount: true }
    }).then(res => res._sum.totalAmount || 0),
    returns: await prisma.order.count({ where: { status: "RETURNED" } }),
  };

  // 5. WORKER PERFORMANCE
  const workers = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    include: {
      _count: {
        select: {
          createdOrders: true,
          confirmedOrders: true,
        }
      }
    },
    take: 5
  });

  const getStatusColor = (s: string) => {
    if (range === s) return "bg-slate-900 text-white shadow-lg";
    return "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200";
  };

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Business Cockpit</h1>
          <p className="text-slate-500 font-bold text-sm mt-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            Real-time operational control center
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start">
          <Link href="/?range=today" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${getStatusColor("today")}`}>Today</Link>
          <Link href="/?range=yesterday" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${getStatusColor("yesterday")}`}>Yesterday</Link>
          <Link href="/?range=week" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${getStatusColor("week")}`}>This Week</Link>
          <Link href="/?range=month" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${getStatusColor("month")}`}>This Month</Link>
        </div>
      </div>

      {/* URGENT: NEEDS ATTENTION */}
      {(onHoldOrders > 0 || damagedItems > 0 || jaxErrors > 0) && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="bg-rose-100 p-2 rounded-xl border border-rose-200">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Needs Attention</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {onHoldOrders > 0 && (
              <Link href="/orders" className="bg-white border-2 border-rose-500/20 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:bg-rose-50 transition-all shadow-xl shadow-rose-100/20">
                <div className="bg-rose-500 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-rose-200 shrink-0 group-hover:scale-110 transition-transform">
                  <AlertOctagon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-3xl font-black text-rose-600 leading-none mb-1">{onHoldOrders}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orders on Hold</p>
                  <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase italic">Action Required immediately</p>
                </div>
              </Link>
            )}
            {damagedItems > 0 && (
              <Link href="/production" className="bg-white border-2 border-rose-500/20 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:bg-rose-50 transition-all shadow-xl shadow-rose-100/20">
                <div className="bg-rose-500 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-rose-200 shrink-0 group-hover:scale-110 transition-transform">
                  <Factory className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-3xl font-black text-rose-600 leading-none mb-1">{damagedItems}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Damaged Carpets</p>
                  <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase italic">Production Problem detected</p>
                </div>
              </Link>
            )}
            {jaxErrors > 0 && (
              <Link href="/jax" className="bg-white border-2 border-rose-500/20 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:bg-rose-50 transition-all shadow-xl shadow-rose-100/20">
                <div className="bg-rose-500 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-rose-200 shrink-0 group-hover:scale-110 transition-transform">
                  <Truck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-3xl font-black text-rose-600 leading-none mb-1">{jaxErrors}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">JAX Sync Issues</p>
                  <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase italic">Delivery data sync error</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ACTION REQUIRED NOW */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-amber-100 p-2 rounded-xl border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Action Required Now</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/orders" className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:border-amber-500/50 hover:bg-amber-50/10 transition-all shadow-sm">
            <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-amber-50 shrink-0 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{pendingConfirm}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Waiting<br />Confirmation</p>
            </div>
          </Link>

          <Link href="/designer" className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:border-amber-500/50 hover:bg-amber-50/10 transition-all shadow-sm">
            <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-amber-50 shrink-0 group-hover:scale-110 transition-transform">
              <Palette className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{waitingDesign}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Waiting<br />Design Hub</p>
            </div>
          </Link>

          <Link href="/shipping" className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:border-amber-500/50 hover:bg-amber-50/10 transition-all shadow-sm">
            <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-amber-50 shrink-0 group-hover:scale-110 transition-transform">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{readyToShipCount}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Ready for<br />JAX Dispatch</p>
            </div>
          </Link>
        </div>
      </div>

      {/* WORKFLOW TUNNEL */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-blue-100 p-2 rounded-xl border border-blue-200">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Workflow Distribution</h2>
        </div>
        
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 relative">
            <TunnelStep label="Received" value={tunnelStats.received} color="bg-slate-100 text-slate-600" />
            <TunnelStep label="Confirmed" value={tunnelStats.confirmed} color="bg-blue-50 text-blue-600" />
            <TunnelStep label="Waiting Design" value={tunnelStats.design} color="bg-amber-50 text-amber-600" />
            <TunnelStep label="In Production" value={tunnelStats.production} color="bg-blue-50 text-blue-600" />
            <TunnelStep label="Wrapped" value={tunnelStats.wrapped} color="bg-emerald-50 text-emerald-600" />
            <TunnelStep label="Shipped" value={tunnelStats.shipped} color="bg-blue-50 text-blue-600" />
            <TunnelStep label="Delivered" value={tunnelStats.delivered} color="bg-emerald-600 text-white" />
            <TunnelStep label="Returned" value={tunnelStats.returned} color="bg-rose-50 text-rose-600" isLast />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TODAY'S SNAPSHOT */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Activity Snapshot
            </h3>
            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-widest">Period: {range}</span>
          </div>
          
          <div className="space-y-6 flex-1">
            <SnapshotRow label="Orders Created" value={snapshot.created} color="text-slate-900" />
            <SnapshotRow label="Orders Confirmed" value={snapshot.confirmed} color="text-emerald-600" />
            <SnapshotRow label="Carpets Wrapped" value={snapshot.produced} color="text-emerald-600" />
            <SnapshotRow label="Parcels Sent" value={snapshot.sent} color="text-blue-600" />
            
            <div className="pt-6 border-t border-slate-50 mt-auto">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales ({range})</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{snapshot.revenue.toLocaleString()} <span className="text-sm text-slate-400 uppercase tracking-widest">DT</span></p>
            </div>
          </div>
        </div>

        {/* MONEY PREVIEW */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 mb-8">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Delivery Money
            </h3>

            <div className="space-y-8 flex-1">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">COD Expected (Shipped)</p>
                <p className="text-4xl font-black text-white tracking-tighter">{money.expected.toLocaleString()} <span className="text-sm text-slate-500">DT</span></p>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">COD Received (Delivered)</p>
                <p className="text-4xl font-black text-emerald-400 tracking-tighter">{money.received.toLocaleString()} <span className="text-sm text-emerald-900/50">DT</span></p>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Remaining Balance</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{(money.expected - money.received).toLocaleString()} DT</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Returns</p>
                  <p className="text-2xl font-black text-rose-500 tracking-tighter">{money.returns}</p>
                </div>
              </div>
            </div>
            
            <Link href="/accounting" className="mt-10 w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10">
              Go to Full Accounting Report
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* WORKER PERFORMANCE PREVIEW */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Team Performance
            </h3>
            <Link href="/accounting" className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-900 transition-colors tracking-widest">Full List</Link>
          </div>

          <div className="space-y-4 flex-1">
            {workers.map((worker) => (
              <div key={worker.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 font-black text-xs uppercase shadow-sm">
                    {worker.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{worker.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{worker.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-lg font-black text-slate-900 leading-none">{worker._count.createdOrders}</p>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Created</p>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div>
                    <p className="text-lg font-black text-emerald-600 leading-none">{worker._count.confirmedOrders}</p>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Confirmed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TunnelStep({ label, value, color, isLast = false }: { label: string, value: number, color: string, isLast?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 relative group">
      {!isLast && (
        <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-slate-50 -translate-y-1/2 z-0"></div>
      )}
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black shadow-lg transition-transform group-hover:scale-110 relative z-10 ${color}`}>
        {value}
      </div>
      <div className="text-center">
        <p className="text-[9px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{label}</p>
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <ArrowRight className="w-2 h-2 text-slate-300" />
        </div>
      </div>
    </div>
  );
}

function SnapshotRow({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors"></div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

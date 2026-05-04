import prisma from "@/lib/prisma";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Wallet,
  Calendar,
  User as UserIcon
} from "lucide-react";

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; range?: string }>;
}) {
  const { start, end, range } = await searchParams;

  // Determine date filter
  let dateFilter: any = {};
  const now = new Date();
  if (range === "today") {
    dateFilter = { gte: new Date(now.setHours(0,0,0,0)) };
  } else if (range === "week") {
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = { gte: lastWeek };
  } else if (range === "month") {
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    dateFilter = { gte: lastMonth };
  } else if (start && end) {
    dateFilter = { gte: new Date(start), lte: new Date(end) };
  }

  // Fetch Stats
  const [shippedOrders, deliveredOrders, returnedOrders, cancelledOrders, agents] = await Promise.all([
    prisma.order.findMany({ 
      where: { status: "SHIPPED", createdAt: dateFilter },
      include: { items: true } 
    }),
    prisma.order.findMany({ where: { status: "DELIVERED", createdAt: dateFilter } }),
    prisma.order.findMany({ where: { status: "RETURNED", createdAt: dateFilter } }),
    prisma.order.findMany({ where: { status: "CANCELLED", createdAt: dateFilter } }),
    prisma.user.findMany({ include: { createdOrders: true, confirmedOrders: true } })
  ]);

  const totalCodShipped = shippedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCodDelivered = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  // Example delivery fee logic: 8 DT per order
  const totalDeliveryFees = shippedOrders.length * 8;
  const netAmount = totalCodShipped - totalDeliveryFees;

  const stats = [
    { label: "Total Shipped", value: shippedOrders.length, icon: Truck, color: "bg-blue-500" },
    { label: "COD Shipped", value: `${totalCodShipped.toFixed(2)} DT`, icon: Wallet, color: "bg-emerald-500" },
    { label: "Delivered", value: deliveredOrders.length, icon: CheckCircle2, color: "bg-emerald-600" },
    { label: "Returned", value: returnedOrders.length, icon: RotateCcw, color: "bg-rose-500" },
    { label: "Cancelled", value: cancelledOrders.length, icon: XCircle, color: "bg-slate-500" },
    { label: "Net Revenue", value: `${netAmount.toFixed(2)} DT`, icon: TrendingUp, color: "bg-indigo-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            Financials
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">
            Real-time delivery balance and performance
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {["today", "week", "month"].map((r) => (
            <a
              key={r}
              href={`/accounting?range=${r}`}
              className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                range === r ? "bg-slate-900 text-white" : "bg-white text-slate-400 border border-slate-100"
              }`}
            >
              {r}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={`${stat.color} p-4 rounded-2xl shadow-xl shadow-slate-100`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Agent Performance */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <UserIcon className="w-4 h-4 text-emerald-600" />
              Agent Performance
            </h3>
          </div>
          <div className="p-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="px-4 py-4">Agent</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Confirmed</th>
                  <th className="px-4 py-4">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agents.map((agent) => (
                  <tr key={agent.id} className="group">
                    <td className="px-4 py-4 font-black text-slate-900 text-sm uppercase">{agent.name}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-500">{agent.createdOrders.length}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-500">{agent.confirmedOrders.length}</td>
                    <td className="px-4 py-4 text-sm font-black text-emerald-600">
                      {agent.createdOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)} DT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Balance */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 opacity-60">
            <Wallet className="w-4 h-4" />
            Wallet Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 border-b border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Expected from JAX</p>
              <p className="text-xl font-black">{totalCodShipped.toFixed(2)} DT</p>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-white/5 text-rose-400">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Delivery Fees</p>
              <p className="text-xl font-black">-{totalDeliveryFees.toFixed(2)} DT</p>
            </div>
            <div className="flex justify-between items-center py-6 text-emerald-400">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Net Balance</p>
                <p className="text-3xl font-black tracking-tighter">{netAmount.toFixed(2)} DT</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-20" />
            </div>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold text-white/50 leading-relaxed italic uppercase">
              Note: Net balance is calculated based on total shipped amount minus standard delivery fee of 8 DT per parcel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

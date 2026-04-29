import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  Users, 
  ShoppingCart, 
  Clock, 
  CheckCircle2,
  Package,
  Plus
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  let brandsData: any[] = [];
  let totalItemsCount = 0;
  let recentOrders: any[] = [];
  
  const stats = [
    { label: "Total Orders", value: "0", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100", href: "/orders" },
    { label: "Pending Production", value: "0", icon: Clock, color: "text-amber-600", bg: "bg-amber-100", href: "/production" },
    { label: "Produced Today", value: "0", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", href: "/shipping" },
    { label: "Total Customers", value: "0", icon: Users, color: "text-purple-600", bg: "bg-purple-100", href: "/orders" },
  ];

  try {
    brandsData = await prisma.brand.findMany({
      include: { _count: { select: { items: true } } }
    });

    totalItemsCount = await prisma.orderItem.count();
    
    recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } }
    });

    const totalOrdersCount = await prisma.order.count();
    const pendingProduction = await prisma.orderItem.count({ where: { status: "PENDING" } });
    const totalCustomers = await prisma.order.groupBy({ by: ['customerPhone'] }).then(res => res.length);
    const producedToday = await prisma.orderItem.count({ 
      where: { 
        status: { in: ["WRAPPED", "SHIPPED"] },
        updatedAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
      } 
    });
    
    stats[0].value = totalOrdersCount.toString();
    stats[1].value = pendingProduction.toString();
    stats[2].value = producedToday.toString();
    stats[3].value = totalCustomers.toString();
  } catch (e) {
    console.error("Failed to fetch dashboard data", e);
  }

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">Enterprise Overview</h1>
            <p className="text-slate-500 font-medium text-xs md:text-sm">Real-time stats for ZARBITI, BMT, and TBP.</p>
          </div>
          <Link 
            href="/orders/new" 
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-100/50 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            New Order
          </Link>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center gap-3 w-fit">
          <div className="w-2 md:w-3 h-2 md:h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] md:text-sm font-bold text-slate-600 uppercase tracking-wider">System Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <Link 
            key={i} 
            href={stat.href}
            className="bg-white p-4 md:p-7 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-5 group text-center md:text-left"
          >
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-5 h-5 md:w-7 md:h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl md:text-3xl font-black text-slate-900 leading-tight">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
            <Link href="/orders" className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">View All</Link>
          </div>
          <div className="space-y-3 md:space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-lg md:rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400">
                    <Package className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-black text-sm md:text-base truncate">{order.customerName}</p>
                    <p className="text-[8px] md:text-[10px] font-black text-black uppercase tracking-widest truncate">REF #{order.reference} • {order._count.items} Art.</p>
                  </div>
                </div>
                <div className={`text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full uppercase tracking-widest flex-shrink-0 ${
                  order.status === "SHIPPED" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                }`}>
                  {order.status}
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="space-y-4 text-sm text-slate-400 text-center py-10 md:py-16 bg-slate-50 rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-100">
                <ShoppingCart className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-4 opacity-10" />
                No orders yet.
              </div>
            )}
          </div>
        </div>

        {/* Brand Performance */}
        <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6 md:mb-8 uppercase tracking-tight">Brand Reach</h3>
          <div className="space-y-6 md:space-y-8">
            {brandsData.map((brand) => {
              const percentage = totalItemsCount > 0 
                ? Math.round((brand._count.items / totalItemsCount) * 100) 
                : 0;
              return (
                <div key={brand.id} className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-black text-slate-700 uppercase">{brand.name}</span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 md:h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

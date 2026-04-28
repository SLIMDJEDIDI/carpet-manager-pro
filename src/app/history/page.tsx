import prisma from "@/lib/prisma";
import { History, Clock, FileText, Search } from "lucide-react";
import { format } from "date-fns";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q || "";
  const page = parseInt(searchParams.page || "1");
  const pageSize = 50;

  if (!prisma.activityLog) {
    console.error("prisma.activityLog is UNDEFINED. Available keys:", Object.keys(prisma).filter(k => !k.startsWith('$')));
    return (
      <div className="p-10 border-4 border-rose-600 bg-rose-50 text-rose-900 rounded-3xl">
        <h1 className="text-2xl font-black uppercase">Database Error</h1>
        <p className="font-bold mt-2">The History system (ActivityLog) is not yet initialized in the database client.</p>
        <p className="text-sm mt-4 opacity-70">Please restart the development server or run `npx prisma generate` again.</p>
      </div>
    );
  }

  const logs = await prisma.activityLog.findMany({
    where: {
      OR: [
        { action: { contains: query } },
        { details: { contains: query } },
      ],
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const totalLogs = await prisma.activityLog.count({
    where: {
      OR: [
        { action: { contains: query } },
        { details: { contains: query } },
      ],
    },
  });

  const totalPages = Math.ceil(totalLogs / pageSize);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE_ORDER": return <FileText className="w-5 h-5 text-emerald-500" />;
      case "START_PRODUCTION": return <Clock className="w-5 h-5 text-amber-500" />;
      case "SHIP_ORDER": return <History className="w-5 h-5 text-blue-500" />;
      case "ITEM_WRAPPED": return <History className="w-5 h-5 text-purple-500" />;
      case "DELETE_ORDER": return <FileText className="w-5 h-5 text-rose-500" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="border-l-8 border-slate-900 pl-6">
          <h1 className="text-4xl font-black text-black tracking-tight uppercase">System History</h1>
          <p className="text-slate-500 font-bold">Track every move in Carpet Manager PRO.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border-2 border-slate-300 shadow-sm focus-within:border-slate-900 transition-all w-96">
          <div className="pl-4">
            <Search className="w-5 h-5 text-black" />
          </div>
          <form className="flex-1">
            <input 
              type="text" 
              name="q"
              placeholder="Search history..." 
              defaultValue={query}
              className="w-full bg-transparent border-none focus:ring-0 text-black py-2 font-black placeholder:text-slate-400"
            />
          </form>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center gap-6">
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{log.action.replace("_", " ")}</p>
                  <p className="text-xs font-bold text-slate-400">{format(log.createdAt, "MMM d, yyyy • HH:mm:ss")}</p>
                </div>
                <p className="text-lg font-bold text-black mt-1">{log.details}</p>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="p-20 text-center text-slate-400 bg-white">
              <History className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="font-black uppercase tracking-widest text-xs text-black">No history found.</p>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {/* Pagination buttons could be added here similar to Orders page */}
        </div>
      )}
    </div>
  );
}

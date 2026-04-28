import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Factory, ArrowLeft } from "lucide-react";
import Link from "next/link";
import BatchItemSelector from "@/components/BatchItemSelector";

export const dynamic = "force-dynamic";

export default async function BatchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const batch = await prisma.productionList.findUnique({
    where: { id },
    include: {
      items: {
        include: { brand: true, design: true, order: true }
      }
    }
  });

  if (!batch) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link 
            href="/production" 
            className="w-12 h-12 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-black" />
          </Link>
          <div className="border-l-8 border-slate-900 pl-6">
            <h1 className="text-4xl font-black text-black tracking-tight uppercase">Batch Details</h1>
            <p className="text-slate-500 font-bold">{batch.batchName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-2 border-slate-900 shadow-lg">
          <Factory className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-black text-black uppercase tracking-widest">{batch.items.length} Articles in List</span>
        </div>
      </div>

      <BatchItemSelector items={batch.items} batchName={batch.batchName} />
    </div>
  );
}

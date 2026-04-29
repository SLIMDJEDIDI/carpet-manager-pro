import prisma from "@/lib/prisma";
import { Search, Plus, Palette, Edit2 } from "lucide-react";
import Link from "next/link";
import DeleteDesignButton from "@/components/DeleteDesignButton";

export const dynamic = "force-dynamic";

export default async function DesignCatalog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || "";
  
  const designs = await prisma.design.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 border-l-4 border-emerald-500 pl-4">Design Catalog</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage your carpet patterns and codes.</p>
        </div>
        <Link 
          href="/designs/new"
          className="bg-emerald-600 text-white px-5 py-3 md:py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all font-semibold shadow-md shadow-emerald-100"
        >
          <Plus className="w-4 h-4" />
          Add New Design
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
            placeholder="Search patterns..." 
            defaultValue={query}
            className="w-full bg-transparent border-none focus:ring-0 text-black py-3 font-black placeholder:text-slate-400 text-sm md:text-base"
          />
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {designs.map((design) => (
          <div key={design.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className="aspect-[4/5] bg-white relative overflow-hidden flex-shrink-0">
              {design.imageUrl ? (
                <img 
                  src={design.imageUrl} 
                  alt={design.name} 
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 flex-col gap-2">
                  <Palette className="w-8 h-8 opacity-20" />
                  <span className="text-[10px]">No Photo</span>
                </div>
              )}
              <div className="absolute top-2 left-2 max-w-[80%]">
                <span className="text-[8px] md:text-[10px] font-black bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm text-slate-800 uppercase tracking-wider block truncate">
                  {design.code}
                </span>
              </div>
            </div>
            <div className="p-3 md:p-4 bg-white flex flex-col flex-1">
              <div className="flex-1 min-w-0 mb-2">
                <h4 className="font-bold text-slate-900 text-xs md:text-sm line-clamp-2 md:truncate" title={design.name}>{design.name}</h4>
                <p className="text-[8px] md:text-[10px] text-slate-400 mt-0.5 uppercase">Ref: {design.code}</p>
              </div>
              <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-50">
                <Link 
                  href={`/designs/edit/${design.id}`}
                  className="p-2.5 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 md:bg-transparent rounded-lg"
                  title="Edit Design"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
                <div className="bg-slate-50 md:bg-transparent rounded-lg">
                  <DeleteDesignButton id={design.id} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {designs.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500">
            No designs found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}

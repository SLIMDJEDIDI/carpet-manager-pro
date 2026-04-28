import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NewDesignPage() {
  async function createDesign(formData: FormData) {
    "use server";
    
    const code = formData.get("code") as string;
    const name = formData.get("name") as string;
    const imageUrl = formData.get("imageUrl") as string;

    await prisma.design.create({
      data: {
        code,
        name,
        imageUrl: imageUrl || null,
      },
    });

    redirect("/designs");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/designs" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-black uppercase text-xs tracking-widest group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Catalog
      </Link>

      <div className="border-l-8 border-emerald-500 pl-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">New Carpet Design</h1>
        <p className="text-slate-500 font-bold">Add a new design pattern to your catalog.</p>
      </div>

      <form action={createDesign} className="space-y-6 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-wider">Design Code (Unique)</label>
            <input 
              type="text" 
              name="code" 
              required 
              placeholder="e.g. PERS-001"
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black placeholder:text-slate-400 px-6" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-wider">Design Name</label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="e.g. Blue Persian Vintage"
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black placeholder:text-slate-400 px-6" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-wider">Image URL (Optional)</label>
            <input 
              type="url" 
              name="imageUrl" 
              placeholder="https://..."
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black placeholder:text-slate-400 px-6" 
            />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-2">
              Note: Use a direct image link from the web for best results.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl">
            <Save className="w-5 h-5" />
            Create Design
          </button>
        </div>
      </form>
    </div>
  );
}

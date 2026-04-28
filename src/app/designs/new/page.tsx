"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { createDesign } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function NewDesignPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    try {
      await createDesign(formData);
      router.push("/designs");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/designs" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-black uppercase text-xs tracking-widest group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Catalog
      </Link>

      <div className="border-l-8 border-emerald-500 pl-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">New Carpet Design</h1>
        <p className="text-slate-500 font-bold">Upload a new design pattern from your computer.</p>
      </div>

      <form action={handleSubmit} encType="multipart/form-data" className="space-y-6 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
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
            <label className="text-sm font-black text-black uppercase tracking-wider">Design Image</label>
            <div className="relative group">
              {preview ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100">
                  <img src={preview} alt="Preview" className="w-full h-full object-contain bg-slate-50" />
                  <button 
                    type="button"
                    onClick={() => setPreview(null)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-4 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-4 bg-emerald-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="mb-2 text-sm text-slate-900 font-black uppercase tracking-widest">Click to upload file</p>
                    <p className="text-xs text-slate-400 font-bold uppercase">PNG, JPG or WEBP (Max 4MB)</p>
                  </div>
                  <input type="file" name="image" className="hidden" accept="image/*" onChange={handleFileChange} required />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isPending ? "Uploading..." : "Create Design"}
          </button>
        </div>
      </form>
    </div>
  );
}

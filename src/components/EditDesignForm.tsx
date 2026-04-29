"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { updateDesignAction } from "@/lib/design-actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
    >
      <Save className="w-5 h-5" />
      {pending ? "Updating..." : "Save Changes"}
    </button>
  );
}

interface Design {
  id: string;
  code: string;
  name: string;
  imageUrl: string | null;
}

export default function EditDesignForm({ design }: { design: Design }) {
  const [preview, setPreview] = useState<string | null>(design.imageUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateDesignWithId = updateDesignAction.bind(null, design.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/designs" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-black uppercase text-xs tracking-widest group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Catalog
      </Link>

      <div className="border-l-8 border-emerald-500 pl-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Edit Design</h1>
        <p className="text-slate-500 font-bold">Modify design details or update the image.</p>
      </div>

      <form action={updateDesignWithId} encType="multipart/form-data" className="space-y-6 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <input type="hidden" name="existingImageUrl" value={design.imageUrl || ""} />
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-wider">Design Code</label>
            <input 
              type="text" 
              name="code" 
              required 
              defaultValue={design.code}
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black px-6" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-wider">Design Name</label>
            <input 
              type="text" 
              name="name" 
              required 
              defaultValue={design.name}
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black px-6" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-wider">Design Image</label>
            <div className="relative group">
              {preview ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100">
                  <img src={preview} alt="Preview" className="w-full h-full object-contain bg-slate-50" />
                  <label className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-emerald-50 hover:text-emerald-600 transition-all cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <input type="file" name="image" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
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
                  <input type="file" name="image" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-2 text-center">
              Leave empty to keep current image
            </p>
          </div>
        </div>

        <div className="pt-4">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

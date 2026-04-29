"use client";

import { useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { createDesignQuick } from "@/lib/actions";

interface QuickDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (design: any) => void;
}

export default function QuickDesignModal({ isOpen, onClose, onSuccess }: QuickDesignModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createDesignQuick(formData);
      if (result.success) {
        onSuccess(result.design);
        onClose();
      } else {
        setError(result.error || "Failed to create design");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-50">
          <h3 className="text-lg font-black text-black uppercase tracking-wider">Quick Add Design</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-600 text-xs font-bold uppercase">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest">Design Code</label>
            <input 
              name="code" 
              required 
              autoFocus
              placeholder="e.g. Z-2024-X"
              className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-12 bg-white font-bold text-black px-4"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest">Design Name</label>
            <input 
              name="name" 
              required 
              placeholder="e.g. Vintage Blue Medallion"
              className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-12 bg-white font-bold text-black px-4"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest">Design Image (Optional)</label>
            <div className="relative">
              <input 
                type="file" 
                name="image" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-emerald-50 transition-all overflow-hidden bg-slate-50">
                {preview ? (
                  <img src={preview} className="w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Click to upload</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Save Design"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

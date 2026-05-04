"use client";

import { useState } from "react";
import { Printer, Loader2, AlertCircle } from "lucide-react";

export default function CreateBatchButton({ 
  brandId, 
  brandName,
  action,
  disabled = false
}: { 
  brandId: string, 
  brandName: string,
  action: (formData: FormData) => Promise<any>,
  disabled?: boolean
}) {
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async () => {
    if (disabled) return;
    setIsPending(true);
    const formData = new FormData();
    formData.append("brandId", brandId);
    formData.append("brandName", brandName);

    try {
      const result = await action(formData);
      if (result && !result.success) {
        alert(result.error || "Failed to create list.");
      }
    } catch (e) {
      alert("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button 
      onClick={handleCreate}
      disabled={isPending || disabled}
      className={`w-full md:w-auto px-5 py-3 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100 disabled:opacity-50 ${
        disabled 
          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300' 
          : 'bg-amber-600 text-white hover:bg-amber-700'
      }`}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Printer className="w-4 h-4" />
      )}
      {isPending ? "Creating..." : `Create ${brandName} List`}
    </button>
  );
}

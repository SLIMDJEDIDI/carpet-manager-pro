"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { setDesignStatusBulk } from "@/lib/actions";

export default function MarkBatchReadyButton({ 
  itemIds, 
  label = "Mark Batch Ready" 
}: { 
  itemIds: string[], 
  label?: string 
}) {
  const [isPending, setIsPending] = useState(false);

  const handleAction = async () => {
    if (!confirm(`Mark ${itemIds.length} items as Design Ready?`)) return;
    setIsPending(true);
    try {
      const result = await setDesignStatusBulk(itemIds, "READY");
      if (!result.success) {
        alert(result.error);
      }
    } catch (e) {
      alert("Failed to update status");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button 
      onClick={handleAction}
      disabled={isPending}
      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <CheckCircle2 className="w-5 h-5" />
      )}
      {isPending ? "Updating..." : label}
    </button>
  );
}

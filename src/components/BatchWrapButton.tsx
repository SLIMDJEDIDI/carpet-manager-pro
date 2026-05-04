"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Layers } from "lucide-react";

interface BatchWrapButtonProps {
  itemIds: string[];
  orderId: string;
  onWrap: (itemIds: string[], status: string) => Promise<any>;
}

export default function BatchWrapButton({ itemIds, orderId, onWrap }: BatchWrapButtonProps) {
  const [loading, setLoading] = useState(false);

  if (itemIds.length === 0) return null;

  return (
    <button
      onClick={async () => {
        if (!confirm(`Mark all ${itemIds.length} items as WRAPPED?`)) return;
        setLoading(true);
        try {
          await onWrap(itemIds, "WRAPPED");
        } catch (e) {
          console.error(e);
          alert("Failed to wrap items");
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className="bg-emerald-600 text-white h-10 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all font-black uppercase text-[10px] tracking-widest disabled:opacity-50 disabled:scale-100 active:scale-95 shadow-lg shadow-emerald-100"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Layers className="w-4 h-4" />
          Wrap All Items
        </>
      )}
    </button>
  );
}

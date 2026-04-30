"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ConfirmOrderButton({ 
  orderId, 
  action 
}: { 
  orderId: string, 
  action: (formData: FormData) => Promise<any> 
}) {
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    if (!confirm("Are you sure you want to confirm this order? This will move it to production queue.")) return;
    
    setIsPending(true);
    const formData = new FormData();
    formData.append("orderId", orderId);
    
    try {
      const result = await action(formData);
      if (!result?.success) {
        alert(result?.error || "Failed to confirm order");
        setIsPending(false);
      }
    } catch (e) {
      alert("An error occurred while confirming the order");
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleConfirm}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
        isPending 
          ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100"
      }`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5" />
      )}
      {isPending ? "Confirming..." : "Confirm Order"}
    </button>
  );
}

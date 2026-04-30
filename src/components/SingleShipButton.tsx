"use client";

import { useState } from "react";
import { Truck, Loader2 } from "lucide-react";

export default function SingleShipButton({ 
  orderId, 
  onShip 
}: { 
  orderId: string, 
  onShip: (formData: FormData) => Promise<any> 
}) {
  const [isPending, setIsPending] = useState(false);

  const handleShip = async () => {
    if (!confirm("Are you sure you want to ship this order with JAX?")) return;
    
    setIsPending(true);
    const formData = new FormData();
    formData.append("orderId", orderId);
    
    try {
      const result = await onShip(formData);
      if (!result?.success) {
        alert(`JAX Shipping Failed: ${result?.error || "Unknown error"}`);
      }
    } catch (e) {
      alert("An unexpected error occurred during shipping.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleShip}
      disabled={isPending}
      className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:bg-slate-400"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Truck className="w-4 h-4" />
      )}
      {isPending ? "Shipping..." : "Ship with JAX"}
    </button>
  );
}

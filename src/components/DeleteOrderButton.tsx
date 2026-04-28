"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface DeleteOrderButtonProps {
  orderId: string;
  action: (formData: FormData) => Promise<void>;
}

export default function DeleteOrderButton({ orderId, action }: DeleteOrderButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (confirm("Are you sure you want to delete this entire order?")) {
      const formData = new FormData();
      formData.append("id", orderId);
      startTransition(async () => {
        await action(formData);
      });
    }
  };

  return (
    <button 
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Delete Order"
    >
      <Trash2 className={`w-5 h-5 ${isPending ? 'animate-pulse' : ''}`} />
    </button>
  );
}

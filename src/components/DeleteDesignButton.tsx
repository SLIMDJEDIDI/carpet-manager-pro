"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteDesign } from "@/lib/actions";

export default function DeleteDesignButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (confirm("Are you sure you want to delete this design?")) {
          startTransition(async () => {
            const result = await deleteDesign(id);
            if (result && !result.success) {
              alert(result.message);
            }
          });
        }
      }}
      disabled={isPending}
      className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Delete Design"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

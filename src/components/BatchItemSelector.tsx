"use client";

import { useState } from "react";
import { Check, Package, CheckCircle2 } from "lucide-react";
import { updateItemStatuses } from "@/lib/actions";

export default function BatchItemSelector({ 
  items, 
  batchName 
}: { 
  items: any[], 
  batchName: string 
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    setIsUpdating(true);
    try {
      await updateItemStatuses(selectedIds, status);
      setSelectedIds([]);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-black text-slate-900">
            {selectedIds.length} SELECTED
          </div>
          <button 
            onClick={() => setSelectedIds(items.map(i => i.id))}
            className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-900"
          >
            Select All
          </button>
          <button 
            onClick={() => setSelectedIds([])}
            className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-900"
          >
            Clear
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleBulkUpdate("PRODUCED")}
            disabled={selectedIds.length === 0 || isUpdating}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Produced
          </button>
          <button
            onClick={() => handleBulkUpdate("WRAPPED")}
            disabled={selectedIds.length === 0 || isUpdating}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-slate-200 transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            Mark Wrapped
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          const isDone = ["PRODUCED", "WRAPPED", "SHIPPED"].includes(item.status);

          return (
            <div 
              key={item.id} 
              onClick={() => !isDone && toggleSelect(item.id)}
              className={`p-4 flex items-center justify-between cursor-pointer transition-all ${
                isSelected ? "bg-amber-50" : "hover:bg-slate-50"
              } ${isDone ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  isSelected ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300 bg-white"
                }`}>
                  {isSelected && <Check className="w-4 h-4" />}
                </div>
                <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex-shrink-0 overflow-hidden p-1">
                  {item.design.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-contain" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.design.code}</span>
                    <p className="font-bold text-slate-900 text-sm uppercase">{item.design.name}</p>
                  </div>
                  <p className="text-lg font-black text-black leading-none mt-1">{item.size}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">REF #{item.order.reference} • {item.order.customerName}</p>
                </div>
              </div>
              <div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                  item.status === "WRAPPED" ? "bg-purple-100 text-purple-600" :
                  item.status === "PRODUCED" ? "bg-emerald-100 text-emerald-600" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

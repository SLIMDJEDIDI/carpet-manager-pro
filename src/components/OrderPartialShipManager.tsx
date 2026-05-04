"use client";

import { useState } from "react";
import { Truck, Loader2, Package, CheckCircle2, ChevronRight, AlertTriangle, Layers } from "lucide-react";

interface Item {
  id: string;
  status: string;
  size: string;
  price: number;
  isPack: boolean;
  parentItemId: string | null;
  design?: {
    code: string;
    name: string;
    imageUrl: string | null;
  };
  brand?: {
    name: string;
  };
}

interface OrderPartialShipManagerProps {
  orderId: string;
  orderRef: number | string;
  customerName: string;
  items: Item[];
  onShip: (formData: FormData) => Promise<any>;
}

export default function OrderPartialShipManager({ 
  orderId, 
  orderRef,
  customerName,
  items, 
  onShip 
}: OrderPartialShipManagerProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  const individualItems = items.filter(i => !i.isPack && !i.parentItemId);
  const packParents = items.filter(i => i.isPack);

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectPack = (parentId: string) => {
    const children = items.filter(i => i.parentItemId === parentId);
    const childIds = children.map(c => c.id);
    const allSelected = childIds.every(id => selectedItemIds.includes(id));

    if (allSelected) {
      setSelectedItemIds(prev => prev.filter(id => !childIds.includes(id)));
    } else {
      // Filter out only those child IDs that are WRAPPED
      const readyChildIds = children.filter(c => c.status === "WRAPPED").map(c => c.id);
      if (readyChildIds.length < children.length) {
        alert("Cannot select incomplete pack. All articles in the pack must be WRAPPED.");
        return;
      }
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...readyChildIds])));
    }
  };

  const handleShipSelected = async () => {
    if (selectedItemIds.length === 0) return;
    if (!confirm(`Ship ${selectedItemIds.length} selected articles for REF #${orderRef}?`)) return;

    setIsPending(true);
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("itemIds", JSON.stringify(selectedItemIds));

    try {
      const result = await onShip(formData);
      if (result?.success) {
        setSelectedItemIds([]);
        alert("Partial shipment created successfully!");
      } else {
        alert(`Shipping failed: ${result?.error}`);
      }
    } catch (e) {
      alert("Error processing shipment");
    } finally {
      setIsPending(false);
    }
  };

  const shippedCount = items.filter(i => i.status === "SHIPPED").length;
  const wrappedCount = items.filter(i => i.status === "WRAPPED").length;
  const totalCount = items.filter(i => !i.isPack).length;

  return (
    <div className="space-y-6">
      {/* SELECTION ACTIONS */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Partial Dispatch</p>
            <h3 className="text-lg font-black uppercase tracking-tighter">
              {selectedItemIds.length} Items Selected
            </h3>
          </div>
        </div>
        
        <button
          onClick={handleShipSelected}
          disabled={selectedItemIds.length === 0 || isPending}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-30 disabled:grayscale flex items-center gap-3 shadow-xl shadow-emerald-900/20"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
          Ship Selected Groups
        </button>
      </div>

      <div className="space-y-8">
        {/* 1. INDIVIDUAL ITEMS */}
        {individualItems.length > 0 && (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Standalone Carpets</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {individualItems.map((item) => (
                <ItemSelectionCard 
                  key={item.id} 
                  item={item} 
                  isSelected={selectedItemIds.includes(item.id)} 
                  onToggle={() => toggleItem(item.id)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* 2. PACK GROUPS */}
        {packParents.length > 0 && (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Liquid Glass Packs (Indivisible)</p>
            {packParents.map(parent => {
              const children = items.filter(i => i.parentItemId === parent.id);
              const allChildrenWrapped = children.every(c => c.status === "WRAPPED");
              const allChildrenShipped = children.every(c => c.status === "SHIPPED");
              const allChildrenSelected = children.every(c => selectedItemIds.includes(c.id));
              
              return (
                <div key={parent.id} className={`rounded-[2.5rem] border-2 transition-all p-6 ${
                  allChildrenShipped ? "bg-slate-50 border-slate-100 opacity-60" :
                  allChildrenSelected ? "bg-blue-600 border-blue-400 shadow-xl" :
                  allChildrenWrapped ? "bg-white border-blue-200" : "bg-white border-slate-100"
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${allChildrenSelected ? "bg-white text-blue-600" : "bg-blue-50 text-blue-600"}`}>
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className={`text-base font-black uppercase tracking-tighter ${allChildrenSelected ? "text-white" : "text-slate-900"}`}>
                          Pack: {parent.design?.name || 'Bundle'}
                        </h4>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${allChildrenSelected ? "text-blue-100" : "text-slate-400"}`}>
                          {children.length} Articles • {allChildrenShipped ? 'ALREADY SHIPPED' : 'READY TO WRAP'}
                        </p>
                      </div>
                    </div>

                    {!allChildrenShipped && (
                      <button 
                        onClick={() => selectPack(parent.id)}
                        className={`h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                          allChildrenSelected 
                            ? "bg-white text-blue-600 shadow-lg" 
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {allChildrenSelected ? "Deselect Pack" : "Select Full Pack"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((item) => (
                      <ItemSelectionCard 
                        key={item.id} 
                        item={item} 
                        isSelected={selectedItemIds.includes(item.id)} 
                        onToggle={() => toggleItem(item.id)}
                        disabled={true} // Children only selectable via Parent for Packs
                        forceWhite={allChildrenSelected}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemSelectionCard({ 
  item, 
  isSelected, 
  onToggle, 
  disabled = false,
  forceWhite = false
}: { 
  item: Item, 
  isSelected: boolean, 
  onToggle: () => void,
  disabled?: boolean,
  forceWhite?: boolean
}) {
  const isShipped = item.status === "SHIPPED";
  const isWrapped = item.status === "WRAPPED";

  return (
    <div 
      onClick={() => !disabled && !isShipped && isWrapped && onToggle()}
      className={`p-4 rounded-[2rem] border-2 flex items-center justify-between gap-4 transition-all ${
        isShipped ? "bg-slate-100 border-slate-200 grayscale opacity-50 cursor-not-allowed" :
        isSelected || forceWhite ? "bg-white border-emerald-500 shadow-lg" :
        isWrapped ? "bg-white border-slate-200 cursor-pointer hover:border-emerald-500" :
        "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {item.design?.imageUrl && <img src={item.design.imageUrl} className="w-full h-full object-cover" />}
        </div>
        <div>
          <p className="text-sm font-black text-slate-900 leading-none mb-1">{item.design?.code || '???'}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.size}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isShipped ? (
           <div className="bg-indigo-600 p-2 rounded-full shadow-lg shadow-indigo-100">
            <Truck className="w-3.5 h-3.5 text-white" />
          </div>
        ) : isSelected || forceWhite ? (
          <div className="bg-emerald-500 p-2 rounded-full shadow-lg shadow-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        ) : isWrapped ? (
          <div className="w-6 h-6 rounded-lg border-2 border-slate-200 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          </div>
        ) : (
          <div className="bg-amber-100 p-2 rounded-full">
            <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

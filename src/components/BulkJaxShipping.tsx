"use client";

import { useState } from "react";
import { Truck, Loader2, FileText, CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";

export default function BulkJaxShipping({ 
  readyOrders, 
  onShip 
}: { 
  readyOrders: any[], 
  onShip: (formData: FormData) => Promise<any> 
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrderName, setCurrentOrderName] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showConfirm, setShowConfirm] = useState(false);
  const [shipResults, setShipResults] = useState<any[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === readyOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(readyOrders.map(o => o.id));
    }
  };

  const handleBulkShip = async () => {
    const ordersToShip = readyOrders.filter(o => selectedIds.includes(o.id));
    if (ordersToShip.length === 0) return;
    
    setIsProcessing(true);
    setShowConfirm(false);
    const results = [];
    const total = ordersToShip.length;
    
    for (let i = 0; i < total; i++) {
      const order = ordersToShip[i];
      setCurrentOrderName(order.customerName);
      setProgress({ current: i + 1, total });
      
      try {
        const formData = new FormData();
        formData.append("orderId", order.id);
        const res = await onShip(formData);
        
        results.push({ 
          reference: order.reference,
          customerName: order.customerName,
          success: res.success,
          error: res.error,
          trackingId: res.trackingId,
          receiptUrl: res.receiptUrl
        });

        // Add 1.5s delay between requests to avoid JAX rate limits/congestion
        if (i < total - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (e) {
        results.push({
          reference: order.reference,
          customerName: order.customerName,
          success: false,
          error: "Connection failed"
        });
      }
    }
    
    if (results.length > 0) {
      const successCount = results.filter(r => r.success).length;
      if (successCount === total) {
        alert(`Successfully shipped all ${total} orders!`);
      } else {
        alert(`Processed batch: ${successCount} successful, ${total - successCount} failed.`);
      }
    }
    
    setShipResults(results);
    setIsProcessing(false);
    setCurrentOrderName("");
    setSelectedIds([]);
  };

  if (readyOrders.length === 0 && shipResults.length === 0) return null;

  return (
    <div className="space-y-6">
      {shipResults.length > 0 && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-8">
          <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Shipping Results</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Summary of last batch</p>
            </div>
            <button 
              onClick={() => setShipResults([])}
              className="text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest"
            >
              Clear Results
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            {shipResults.map((res, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${res.success ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${res.success ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                    {res.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">REF #{res.reference} - {res.customerName}</p>
                    {res.success ? (
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Tracking: {res.trackingId}</p>
                    ) : (
                      <p className="text-[10px] font-bold text-rose-600 uppercase">Error: {res.error}</p>
                    )}
                  </div>
                </div>
                {res.success && res.receiptUrl && (
                  <a 
                    href={res.receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-emerald-200 text-[10px] font-black text-emerald-600 uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Print Official JAX Receipt
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">JAX Bulk Shipping</h2>
            </div>
            <p className="text-slate-400 font-bold text-sm max-w-md">
              Select orders to create JAX receipts. All selected orders must be fully wrapped and design-verified.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-4xl font-black text-blue-400 tracking-tighter">{selectedIds.length}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Orders<br />Selected</span>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={selectedIds.length === 0 || isProcessing}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all flex items-center gap-4 shadow-xl shadow-blue-900/40 disabled:bg-slate-800 disabled:text-slate-600"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Generate Receipts
            </button>
          </div>
        </div>

        {/* Selection Area */}
        <div className="mt-12 space-y-4 relative z-10">
          <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <button onClick={selectAll} className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-white transition-all">
              {selectedIds.length === readyOrders.length ? "Deselect All" : "Select All Ready Orders"}
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Available: {readyOrders.length} Orders</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {readyOrders.map(order => (
              <button
                key={order.id}
                onClick={() => toggleSelect(order.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${
                  selectedIds.includes(order.id) 
                    ? "bg-blue-600 border-blue-400 text-white shadow-lg" 
                    : "bg-white/5 border-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  selectedIds.includes(order.id) ? "bg-white border-white text-blue-600" : "border-white/20"
                }`}>
                  {selectedIds.includes(order.id) && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black uppercase text-[10px] tracking-widest truncate">REF #{order.reference}</p>
                  <p className={`font-bold text-xs truncate ${selectedIds.includes(order.id) ? "text-white" : "text-white/80"}`}>
                    {order.customerName}
                  </p>
                  <p className={`text-[9px] font-bold mt-1 ${selectedIds.includes(order.id) ? "text-blue-200" : "text-slate-500"}`}>
                    {order.totalAmount} DT • {order.items.length} Units
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-2xl">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
              <Loader2 className="w-20 h-20 text-blue-600 animate-spin relative z-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Creating JAX Receipts</h3>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Processing {progress.current} of {progress.total}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Customer</p>
              <p className="text-lg font-black text-slate-900 truncate uppercase">{currentOrderName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-2xl">
            <div className="bg-amber-50 p-6 rounded-[2.5rem] inline-flex">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Confirm Shipping</h3>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                You are about to generate JAX receipts for {selectedIds.length} orders. This will notify JAX and cannot be undone.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button onClick={handleBulkShip} className="h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                Confirm & Ship Now
              </button>
              <button onClick={() => setShowConfirm(false)} className="h-16 bg-white text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:text-slate-900 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

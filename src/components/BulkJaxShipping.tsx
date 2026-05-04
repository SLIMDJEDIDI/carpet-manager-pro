"use client";

import { useState } from "react";
import { Truck, Loader2, FileText, CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { jsPDF } from "jspdf";

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
        if (res.success) {
          results.push({ ...order, trackingId: res.trackingId });
        } else {
          console.error(`JAX Error for ${order.customerName}:`, res.error);
        }
      } catch (e) {
        console.error("Failed to ship order:", order.id, e);
      }
    }
    
    setIsProcessing(false);
    setCurrentOrderName("");
    setSelectedIds([]);

    if (results.length > 0) {
      generateReceiptsPDF(results);
      alert(`Successfully processed ${results.length} JAX receipts! PDF download starting...`);
    } else {
      alert("No receipts were generated. Please check for errors.");
    }
  };

  const generateReceiptsPDF = (orders: any[]) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("JAX DELIVERY RECEIPTS - BATCH PRINTING", 20, 20);
    doc.setFontSize(8);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let y = 40;
    orders.forEach((order, index) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      const brands = Array.from(new Set(order.items.map((i: any) => i.brand?.name))).join(", ");
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 5, 180, 45, 'F');
      doc.setFont("helvetica", "bold");
      doc.text(`[${index + 1}] REF #${order.reference}`, 20, y);
      doc.text(`JAX EAN: ${order.trackingId}`, 120, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Customer: ${order.customerName} (${order.customerPhone})`, 20, y + 8);
      doc.text(`Address: ${order.customerAddress}, ${order.customerDelegation}, ${order.customerGovernorate}`, 20, y + 14);
      doc.text(`Brands: ${brands}`, 20, y + 20);
      doc.text(`Items: ${order.items.length} units | Pkgs: 1`, 20, y + 26);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`COD AMOUNT: ${order.totalAmount} DT`, 120, y + 26);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 35, 195, y + 35);
      y += 45;
    });
    doc.save(`jax-printing-batch-${Date.now()}.pdf`);
  };

  if (readyOrders.length === 0) return null;

  return (
    <div className="space-y-6">
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

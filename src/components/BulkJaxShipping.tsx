"use client";

import { useState } from "react";
import { Truck, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { jsPDF } from "jspdf";

export default function BulkJaxShipping({ 
  readyOrders, 
  onShip 
}: { 
  readyOrders: any[], 
  onShip: (orderId: string) => Promise<any> 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrderName, setCurrentOrderName] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: readyOrders.length });
  const [shippedOrders, setShippedOrders] = useState<any[]>([]);

  const handleBulkShip = async () => {
    if (readyOrders.length === 0) return;
    if (!confirm(`Generate JAX receipts for ${readyOrders.length} orders?`)) return;
    
    setIsProcessing(true);
    const results = [];
    const total = readyOrders.length;
    
    for (let i = 0; i < total; i++) {
      const order = readyOrders[i];
      setCurrentOrderName(order.customerName);
      setProgress({ current: i + 1, total });
      
      try {
        const res = await onShip(order.id);
        if (res.success) {
          results.push({ ...order, trackingId: res.trackingId });
        } else {
          console.error(`JAX Error for ${order.customerName}:`, res.error);
          alert(`Error processing ${order.customerName}: ${res.error || "Unknown error"}`);
        }
      } catch (e) {
        console.error("Failed to ship order:", order.id, e);
      }
    }
    
    setShippedOrders(results);
    setIsProcessing(false);
    setCurrentOrderName("");

    if (results.length > 0) {
      generateReceiptsPDF(results);
      alert(`Successfully processed ${results.length} JAX receipts! PDF download starting...`);
    } else {
      alert("No receipts were generated. Please check console for errors.");
    }
  };

  const generateReceiptsPDF = (orders: any[]) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("JAX DELIVERY RECEIPTS BATCH", 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let y = 40;
    orders.forEach((order, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${order.customerName} - ${order.customerPhone}`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Tracking: ${order.trackingId}`, 30, y + 5);
      doc.text(`Address: ${order.customerAddress}`, 30, y + 10);
      doc.text(`Amount: ${order.totalAmount} DT`, 30, y + 15);
      doc.line(20, y + 18, 190, y + 18);
      y += 25;
    });

    doc.save(`jax-receipts-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (readyOrders.length === 0) return null;

  return (
    <div className="bg-slate-900 rounded-[2rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
      
      <div className="text-center md:text-left relative z-10">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">JAX Bulk Processing</h2>
        <p className="text-blue-400 font-bold text-xs uppercase tracking-[0.2em]">
          {readyOrders.length} Orders are fully wrapped and ready for JAX.
        </p>
      </div>

      <button
        onClick={handleBulkShip}
        disabled={isProcessing}
        className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl disabled:bg-slate-800 disabled:text-slate-600 relative z-10"
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing: {currentOrderName}</span>
            </div>
            <div className="text-[10px] font-bold text-blue-300">
              {progress.current} of {progress.total} orders
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5" />
            Ship All with JAX
          </div>
        )}
      </button>
    </div>
  );
}

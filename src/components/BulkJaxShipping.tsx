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
  const [shippedOrders, setShippedOrders] = useState<any[]>([]);

  const handleBulkShip = async () => {
    if (!confirm(`Generate JAX receipts for ${readyOrders.length} orders?`)) return;
    
    setIsProcessing(true);
    const results = [];
    
    for (const order of readyOrders) {
      try {
        const res = await onShip(order.id);
        if (res.success) {
          results.push({ ...order, trackingId: res.trackingId });
        }
      } catch (e) {
        console.error("Failed to ship order:", order.id, e);
      }
    }
    
    setShippedOrders(results);
    setIsProcessing(false);

    if (results.length > 0) {
      generateReceiptsPDF(results);
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
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Receipts...
          </>
        ) : (
          <>
            <Truck className="w-5 h-5" />
            Ship All with JAX
          </>
        )}
      </button>
    </div>
  );
}

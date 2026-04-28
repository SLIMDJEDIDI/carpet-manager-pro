"use client";

import { Printer, Tag } from "lucide-react";
import jsPDF from "jspdf";

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerPostalCode?: string;
  items: {
    size: string;
    brand: { name: string };
    design: { code: string; name: string };
  }[];
}

export default function PrintLabel({ order }: { order: Order }) {
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [100, 150], // Standard label size
    });

    // Use the first item's brand for the header (assuming single brand parcels usually, or just picked first)
    const primaryBrand = order.items[0]?.brand.name || "CARPET";

    // Header - Brand Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(primaryBrand.toUpperCase(), 75, 20, { align: "center" });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 25, 140, 25);

    // Customer Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("SHIP TO:", 15, 35);
    
    doc.setFontSize(16);
    doc.text(order.customerName.toUpperCase(), 15, 45);
    
    doc.setFontSize(12);
    const addressLine = order.customerPostalCode 
      ? `${order.customerAddress} - ${order.customerPostalCode}` 
      : order.customerAddress;
    const splitAddress = doc.splitTextToSize(addressLine, 120);
    doc.text(splitAddress, 15, 55);
    
    doc.setFont("helvetica", "bold");
    doc.text(`PHONE: ${order.customerPhone}`, 15, 80);

    // Product Details Box - showing up to 3 items
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(80, 70, 60, 25, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("ARTICLES IN PARCEL:", 85, 75);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    order.items.slice(0, 3).forEach((item, i) => {
      doc.text(`${item.design.code} - ${item.size}`, 85, 81 + (i * 5));
    });

    if (order.items.length > 3) {
      doc.text(`+ ${order.items.length - 3} more items`, 85, 93);
    }

    // Footer
    doc.setFontSize(8);
    doc.text(`Order ID: #${order.id.slice(-6).toUpperCase()}`, 15, 95);

    doc.save(`Label_${order.customerName.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <button 
      onClick={generatePDF}
      className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-100"
    >
      <Tag className="w-3 h-3" />
      Label
    </button>
  );
}

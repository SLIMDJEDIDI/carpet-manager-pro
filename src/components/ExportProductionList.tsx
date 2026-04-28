"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface Order {
  id: string;
  customerName: string;
  size: string;
  brand: { name: string };
  design: { code: string; name: string };
  createdAt: string;
}

interface ExportProps {
  orders: any[];
  batchName: string;
}

export default function ExportProductionList({ orders, batchName }: ExportProps) {
  const handleExport = () => {
    const data = orders.map((o) => ({
      "REF #": o.order?.reference || "N/A",
      "Order Date": new Date(o.createdAt).toLocaleDateString(),
      "Brand": o.brand.name,
      "Design Code": o.design.code,
      "Design Name": o.design.name,
      "Size": o.size,
      "Customer": o.order?.customerName || "N/A",
      "Address": o.order?.customerAddress || "N/A",
      "Phone": o.order?.customerPhone || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Production List");
    
    // Auto-size columns
    const maxWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(...data.map((row: any) => row[key]?.toString().length || 0), key.length) + 2
    }));
    worksheet["!cols"] = maxWidths;

    XLSX.writeFile(workbook, `${batchName.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <button 
      onClick={handleExport}
      className="text-emerald-600 font-black flex items-center gap-2 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors text-xs uppercase tracking-widest border border-emerald-100"
    >
      <FileSpreadsheet className="w-4 h-4" />
      Excel
    </button>
  );
}

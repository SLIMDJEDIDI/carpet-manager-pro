"use client";

import { Printer } from "lucide-react";

interface PrintProductionListProps {
  batchName: string;
  items: any[];
}

export default function PrintProductionList({ batchName, items }: PrintProductionListProps) {
  const handlePrint = () => {
    // Create a hidden iframe or a new window to print the content
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = items.map(item => `
      <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding: 15px 0; page-break-inside: avoid;">
        <div style="width: 100px; height: 100px; border: 1px solid #ddd; padding: 5px; margin-right: 20px;">
          ${item.design.imageUrl ? `<img src="${item.design.imageUrl}" style="width: 100%; height: 100%; object-fit: contain;">` : '<div style="background: #f5f5f5; width: 100%; height: 100%;"></div>'}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 900; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; color: #666;">
            ${item.brand.name} • ${item.design.code}
          </div>
          <div style="font-size: 24px; font-weight: 900; margin-bottom: 5px;">${item.size}</div>
          <div style="font-size: 14px; font-weight: bold;">${item.design.name}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: 900;">${item.order.customerName}</div>
          <div style="font-size: 10px; font-weight: 900; color: #999; margin-top: 5px;">REF #${item.order.reference}</div>
        </div>
      </div>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${batchName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              padding: 20px; 
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 900; 
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .header p { 
              margin: 5px 0 0; 
              font-weight: 900; 
              color: #666; 
              font-size: 12px;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${batchName}</h1>
            <p>Production List • ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="items">
            ${itemsHtml}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button 
      onClick={handlePrint}
      className="text-amber-600 font-black flex items-center gap-1.5 hover:bg-amber-50 px-3 py-1.5 rounded-xl transition-colors text-xs uppercase tracking-widest border border-amber-100"
    >
      <Printer className="w-4 h-4" />
      PRINT
    </button>
  );
}

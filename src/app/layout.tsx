import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Palette, 
  Factory, 
  Truck, 
  Printer,
  History,
  Settings 
} from "lucide-react";

import MobileNav from "@/components/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carpet Manager PRO",
  description: "Production and Order Management for Carpets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f8fafc] text-slate-900`}>
        <div className="flex flex-col md:flex-row min-h-screen">
          <MobileNav />
          
          {/* Sidebar */}
          <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen shadow-sm">
            <div className="p-8">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="bg-emerald-600 p-2 rounded-xl group-hover:rotate-6 transition-transform">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-black text-emerald-600 tracking-tighter">
                  CARPET<span className="text-slate-400">PRO</span>
                </h1>
              </Link>
            </div>
            <nav className="flex-1 px-4 space-y-1">
              <Link href="/" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-all font-bold group">
                <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Dashboard
              </Link>
              <Link href="/orders" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-all font-bold group">
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Orders
              </Link>
              <Link href="/designs" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-all font-bold group">
                <Palette className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Design Catalog
              </Link>
              <Link href="/production" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-all font-bold group">
                <Factory className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Production
              </Link>
               <Link href="/shipping" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-all font-bold group">
                <Truck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Shipping
              </Link>
              <Link href="/jax" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all font-bold group">
                <Printer className="w-5 h-5 group-hover:scale-110 transition-transform text-indigo-500" />
                JAX Dispatch
              </Link>
              <Link href="/history" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-all font-bold group">

                <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
                History
              </Link>
            </nav>
            <div className="p-6 border-t border-slate-50">
              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all text-sm font-semibold">
                <Settings className="w-4 h-4" />
                System Settings
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-10 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

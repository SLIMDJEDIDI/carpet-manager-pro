"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu,
  X,
  Settings,
  LogOut
} from "lucide-react";
import { navItems } from "./Sidebar";
import { logoutAction } from "@/lib/auth-actions";

export default function MobileNav({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <>
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2 tracking-tighter group">
          <div className="bg-emerald-600 p-1.5 rounded-lg group-hover:rotate-6 transition-transform">
            <span className="text-white font-black text-xs">CP</span>
          </div>
          <h1 className="text-xl font-black text-emerald-600">
            CARPET<span className="text-slate-400">PRO</span>
          </h1>
        </Link>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 right-0 z-[70] w-72 bg-white shadow-2xl transition-transform duration-300 md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-slate-50 bg-slate-50/30">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Navigation</p>
              <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-bold ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-50 space-y-2">
            {user.role === "ADMIN" && (
              <Link 
                href="/settings" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all text-sm font-semibold"
              >
                <Settings className="w-4 h-4" />
                System Settings
              </Link>
            )}
            <form action={logoutAction}>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all text-sm font-semibold">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

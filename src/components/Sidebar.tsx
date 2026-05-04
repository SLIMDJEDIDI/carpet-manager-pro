import { 
  LayoutDashboard, 
  ShoppingCart, 
  Palette, 
  Factory, 
  Truck, 
  Printer,
  History,
  Settings,
  LogOut,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";

export interface NavItem {
  label: string;
  href: string;
  icon: any;
  roles: string[];
}

export const navItems: NavItem[] = [
  { label: "Orders", href: "/orders", icon: ShoppingCart, roles: ["ADMIN", "ORDER"] },
  { label: "Production", href: "/production", icon: Factory, roles: ["ADMIN", "PRODUCTION"] },
  { label: "Shipping", href: "/shipping", icon: Truck, roles: ["ADMIN", "SHIPPING"] },
  { label: "Design Catalog", href: "/designs", icon: Palette, roles: ["ADMIN", "ORDER"] },
  { label: "Designer Hub", href: "/designer", icon: Palette, roles: ["ADMIN", "DESIGNER"] },
  { label: "JAX Dispatch", href: "/jax", icon: Printer, roles: ["ADMIN", "SHIPPING"] },
  { label: "Accounting", href: "/accounting", icon: BarChart3, roles: ["ADMIN", "ACCOUNTING"] },
  { label: "History", href: "/history", icon: History, roles: ["ADMIN"] },
];

export default function Sidebar({ user }: { user: any }) {
  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen shadow-sm">
      <div className="p-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-emerald-600 p-2 rounded-xl group-hover:rotate-6 transition-transform">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-emerald-600 tracking-tighter uppercase">
            Carpet<span className="text-slate-400">Pro</span>
          </h1>
        </Link>
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Signed in as</p>
          <p className="text-sm font-black text-slate-900 truncate">{user.name}</p>
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter mt-1">{user.role}</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {filteredItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-all font-bold group"
          >
            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 space-y-2 border-t border-slate-50">
        {user.role === "ADMIN" && (
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all text-sm font-semibold">
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
    </aside>
  );
}

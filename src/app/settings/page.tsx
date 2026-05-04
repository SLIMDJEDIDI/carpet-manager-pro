import prisma from "@/lib/prisma";
import { User, Settings, Shield, UserPlus, Trash2, Tag, Ruler } from "lucide-react";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

async function createUser(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.user.create({
    data: { name, email, password: hashedPassword, role, updatedAt: new Date() }
  });
  revalidatePath("/settings");
}

async function deleteUser(id: string) {
  "use server";
  if (id === "admin-id") return; // Protection
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const [users, products, brands] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
    prisma.brand.findMany()
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <div className="bg-slate-900 p-4 rounded-3xl shadow-xl shadow-slate-200">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">System Settings</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Admin Configuration & User Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* User Management */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Shield className="w-4 h-4 text-emerald-600" />
                Staff Accounts
              </h3>
            </div>
            
            <div className="p-8 space-y-6">
              <form action={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <input name="name" placeholder="Full Name" required className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-sm text-slate-900 focus:border-emerald-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-1">
                  <input name="email" type="email" placeholder="Email Address" required className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-sm text-slate-900 focus:border-emerald-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-1">
                  <input name="password" type="password" placeholder="Password" required className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-sm text-slate-900 focus:border-emerald-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-1">
                  <select name="role" required className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-sm text-slate-900 focus:border-emerald-500 focus:bg-white transition-all uppercase">
                    <option value="ORDER">Order User</option>
                    <option value="DESIGNER">Designer</option>
                    <option value="PRODUCTION">Production/Wrapping</option>
                    <option value="SHIPPING">Shipping/JAX</option>
                    <option value="ACCOUNTING">Accounting/Viewer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <button type="submit" className="md:col-span-2 h-14 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Staff Account
                </button>
              </form>

              <div className="space-y-3 pt-4">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase leading-none">{u.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{u.email} • {u.role}</p>
                      </div>
                    </div>
                    {u.id !== "admin-id" && (
                      <form action={async () => { "use server"; await deleteUser(u.id); }}>
                        <button className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Catalog Summary */}
        <div className="space-y-10">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Tag className="w-4 h-4 text-emerald-600" />
                Product Pricing
              </h3>
            </div>
            <div className="p-8">
              <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed mb-6">
                Products are managed in the Design Catalog. Below is a summary of current articles and prices.
              </p>
              <div className="space-y-3">
                {products.slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm text-emerald-600">
                        <Ruler className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase leading-none">{p.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{p.category} • {p.size}</p>
                      </div>
                    </div>
                    <p className="font-black text-slate-900 text-sm">{p.price.toFixed(2)} DT</p>
                  </div>
                ))}
                {products.length > 10 && (
                  <p className="text-center text-[10px] font-black text-slate-300 uppercase py-2">+{products.length - 10} more items</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

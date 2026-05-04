"use client";

import { loginAction } from "@/lib/auth-actions";
import { useState } from "react";
import { Lock, User, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const res = await loginAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-[2.5rem] shadow-2xl shadow-emerald-200 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            Access Control
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
            Carpet Manager Pro v2.0
          </p>
        </div>

        <form action={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
              Email Address
            </label>
            <div className="relative">
              <input
                name="email"
                type="email"
                required
                placeholder="admin@carpetmanager.pro"
                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-0 transition-all"
              />
              <User className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-0 transition-all"
              />
              <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-600 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Login to Dashboard"
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-[9px] font-bold uppercase tracking-tight">
          Protected by AES-256 Encryption & Role-Based Access
        </p>
      </div>
    </div>
  );
}

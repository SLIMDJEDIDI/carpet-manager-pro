"use client";

import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface WorkflowGuideProps {
  step: string;
  purpose: string;
  nextStep?: string;
  nextHref?: string;
  prevStep?: string;
  prevHref?: string;
  instruction: string;
  mainAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function WorkflowGuide({
  step,
  purpose,
  nextStep,
  nextHref,
  prevStep,
  prevHref,
  instruction,
  mainAction
}: WorkflowGuideProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
      <div className="flex flex-col md:flex-row">
        {/* Left Side: Step Info */}
        <div className="bg-slate-900 text-white p-6 md:p-8 md:w-80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Step</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">{step}</h2>
          </div>
          
          <div className="space-y-4">
            {prevStep && (
              <div className="opacity-40">
                <p className="text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Previous
                </p>
                <p className="text-[11px] font-bold uppercase truncate">{prevStep}</p>
              </div>
            )}
            {nextStep && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1 flex items-center gap-1">
                  Next <ChevronRight className="w-3 h-3" />
                </p>
                <p className="text-[11px] font-bold uppercase truncate">{nextStep}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Instructions & Actions */}
        <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-50/50">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                <Info className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{purpose}</p>
            </div>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              {instruction}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {prevHref && (
              <button 
                onClick={() => router.push(prevHref)}
                className="h-12 px-6 rounded-xl border-2 border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            
            {mainAction && (
              <button 
                onClick={mainAction.onClick}
                className="h-12 px-8 rounded-xl bg-slate-900 text-white hover:bg-black transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200"
              >
                {mainAction.label}
              </button>
            )}

            {nextHref && (
              <Link 
                href={nextHref}
                className="h-12 px-8 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-100"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

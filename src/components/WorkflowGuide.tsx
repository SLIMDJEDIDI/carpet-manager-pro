"use client";

import { ChevronLeft, ChevronRight, Info, CheckCircle2, Circle } from "lucide-react";
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

const steps = [
  "Orders",
  "Designer List",
  "Production List",
  "Wrapping",
  "Shipping / JAX"
];

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
  
  // Find current step index
  const currentStepIndex = steps.findIndex(s => step.includes(s));

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-10 transition-all hover:shadow-2xl hover:shadow-slate-200/50">
      {/* Step Visualization Bar */}
      <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 hidden md:block">
        <div className="flex items-center justify-between relative">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
          
          {steps.map((s, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            
            return (
              <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted ? "bg-emerald-500 shadow-lg shadow-emerald-200" : 
                  isCurrent ? "bg-slate-900 ring-4 ring-slate-100 scale-125" : 
                  "bg-white border-2 border-slate-200"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : isCurrent ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-200" />
                  )}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${
                  isCurrent ? "text-slate-900" : "text-slate-400"
                }`}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Left Side: Dynamic Context */}
        <div className="bg-slate-900 text-white p-8 md:w-80 flex flex-col justify-between border-r border-white/5 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Active Stage</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight drop-shadow-sm">{step}</h2>
          </div>
          
          <div className="relative z-10 pt-10 space-y-4">
            {prevStep && (
              <div className="group cursor-pointer opacity-40 hover:opacity-100 transition-all" onClick={() => prevHref && router.push(prevHref)}>
                <p className="text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 text-slate-400">
                  <ChevronLeft className="w-3 h-3" /> Previous Step
                </p>
                <p className="text-[11px] font-black uppercase truncate group-hover:text-emerald-400">{prevStep}</p>
              </div>
            )}
            {nextStep && (
              <div className="group cursor-pointer transition-all" onClick={() => nextHref && router.push(nextHref)}>
                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-1 flex items-center gap-1">
                  Ready For <ChevronRight className="w-3 h-3" />
                </p>
                <p className="text-[11px] font-black uppercase truncate group-hover:text-white transition-colors">{nextStep}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Operational Instructions */}
        <div className="flex-1 p-8 md:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-gradient-to-br from-white to-slate-50/30">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-slate-900 text-white p-2 rounded-xl shadow-lg shadow-slate-200">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Operational Goal</p>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{purpose}</p>
              </div>
            </div>
            <p className="text-base font-medium text-slate-500 leading-relaxed max-w-lg">
              {instruction}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            {prevHref && (
              <button 
                onClick={() => router.push(prevHref)}
                className="w-full sm:w-auto h-16 px-8 rounded-2xl border-2 border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 hover:bg-white transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <ChevronLeft className="w-4 h-4" />
                Return
              </button>
            )}
            
            {mainAction ? (
              <button 
                onClick={mainAction.onClick}
                className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-slate-900 text-white hover:bg-black transition-all text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 ring-4 ring-transparent hover:ring-slate-100"
              >
                {mainAction.label}
              </button>
            ) : nextHref ? (
              <button 
                onClick={() => router.push(nextHref)}
                className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-emerald-100 ring-4 ring-transparent hover:ring-emerald-50"
              >
                Continue Flow
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

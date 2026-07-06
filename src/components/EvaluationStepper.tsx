import { Check } from "lucide-react";

export interface EvaluationStep {
  id: number;
  title: string;
}

export function EvaluationStepper({
  steps,
  activeStep,
}: {
  steps: EvaluationStep[];
  activeStep: number;
}) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step) => {
          const isActive = step.id === activeStep;
          const isComplete = step.id < activeStep;
          return (
            <div
              key={step.id}
              className={[
                "rounded-2xl border px-4 py-3 transition",
                isActive
                  ? "border-[#36ADAA]/40 bg-[#36ADAA]/10"
                  : isComplete
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black",
                    isActive
                      ? "bg-[#36ADAA] text-white"
                      : isComplete
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-500",
                  ].join(" ")}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step {step.id}</p>
                  <p className="truncate text-sm font-bold text-slate-800">{step.title}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

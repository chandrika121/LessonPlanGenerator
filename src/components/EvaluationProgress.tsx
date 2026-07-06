import { Bot, LoaderCircle, Sparkles } from "lucide-react";

export function EvaluationProgress({
  stages,
  activeIndex,
  running,
}: {
  stages: string[];
  activeIndex: number;
  running: boolean;
}) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">AI Evaluation</p>
          <h3 className="font-display text-2xl font-extrabold text-slate-900">Evaluation pipeline</h3>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {stages.map((stage, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
          return (
            <div key={stage} className={`rounded-2xl border px-4 py-4 ${complete ? "border-emerald-200 bg-emerald-50" : active ? "border-[#36ADAA]/35 bg-[#36ADAA]/8" : "border-slate-100 bg-slate-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2 ${complete ? "bg-emerald-500 text-white" : active ? "bg-[#36ADAA] text-white" : "bg-white text-slate-400"}`}>
                  {active && running ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="text-sm font-semibold text-slate-700">{stage}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

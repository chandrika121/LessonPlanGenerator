import type { LucideIcon } from "lucide-react";
import type { EvaluationType } from "../services/evaluationService";

export function EvaluationTypeCard({
  title,
  description,
  value,
  icon: Icon,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  value: EvaluationType;
  icon: LucideIcon;
  selected: boolean;
  onClick: (value: EvaluationType) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={[
        "rounded-[28px] border p-6 text-left shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition",
        selected
          ? "border-[#36ADAA]/40 bg-[#36ADAA]/10"
          : "border-white/80 bg-white/90 hover:border-[#36ADAA]/20 hover:bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Evaluation Type</p>
          <h3 className="mt-3 font-display text-2xl font-extrabold text-slate-900">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
        </div>
        <div className={`rounded-2xl p-3 ${selected ? "bg-[#36ADAA] text-white" : "bg-[#36ADAA]/10 text-[#36ADAA]"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

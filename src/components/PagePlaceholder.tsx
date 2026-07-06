import { ArrowRight } from "lucide-react";

export function PagePlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[34px] border border-white/80 bg-white/90 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#36ADAA]">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-extrabold text-slate-900">{title}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
        LMS section ready for future backend wiring
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

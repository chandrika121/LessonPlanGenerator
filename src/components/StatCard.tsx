import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 font-display text-3xl font-extrabold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

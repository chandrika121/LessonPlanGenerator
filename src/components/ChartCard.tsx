import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, icon, children, className = "" }: ChartCardProps) {
  return (
    <div className={`rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] ${className}`}>
      <div className="mb-5 flex items-center gap-3">
        {icon && (
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-display text-lg font-extrabold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
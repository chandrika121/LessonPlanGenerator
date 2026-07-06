import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface ExpandableCardProps {
  /** Unique identifier for this card */
  id: string;
  /** Whether this card is currently expanded */
  isExpanded: boolean;
  /** Called when the card header is clicked */
  onToggle: (id: string) => void;
  /** Header content - session label, title, metadata */
  header: ReactNode;
  /** Content shown when expanded */
  children: ReactNode;
  /** Optional icon element shown in the header left */
  icon?: ReactNode;
}

/**
 * Reusable expandable card with arrow dropdown animation.
 * Only one card should be expanded at a time (controlled by parent).
 * Styled consistently with Student Notes expandable cards.
 */
export function ExpandableCard({
  id,
  isExpanded,
  onToggle,
  header,
  children,
  icon,
}: ExpandableCardProps) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      {/* Card Header - Clickable */}
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-4 px-6 py-5 text-left"
      >
        {icon && (
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">{header}</div>
        {isExpanded ? (
          <ArrowLeft className="h-5 w-5 rotate-90 text-slate-400 shrink-0 transition-transform" />
        ) : (
          <ArrowLeft className="h-5 w-5 -rotate-90 text-slate-400 shrink-0 transition-transform" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-6 pb-6 pt-5">
          {children}
        </div>
      )}
    </div>
  );
}
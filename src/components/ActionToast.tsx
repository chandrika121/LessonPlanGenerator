import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

export function ActionToast({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [onClose, open]);

  if (!open || !message) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90]">
      <div className="pointer-events-auto flex min-w-[280px] max-w-sm items-start gap-3 rounded-[24px] border border-emerald-200 bg-white px-4 py-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="rounded-full bg-emerald-50 p-1.5 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">Success</p>
          <p className="mt-1 text-sm text-slate-600">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 transition hover:text-slate-600"
          aria-label="Close popup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

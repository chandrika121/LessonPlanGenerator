import { Pencil, Trash2 } from "lucide-react";
import type { AnnouncementItem } from "../types/announcements";

export function AnnouncementList({
  announcements,
  emptyMessage,
  onEdit,
  onDelete,
}: {
  announcements: AnnouncementItem[];
  emptyMessage: string;
  onEdit?: (item: AnnouncementItem) => void;
  onDelete?: (item: AnnouncementItem) => void;
}) {
  if (announcements.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((item) => (
        <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="font-semibold text-slate-900">{item.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{item.message}</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xs font-semibold text-slate-400">
                {new Date(item.createdAt).toLocaleString()}
              </div>
              {onEdit || onDelete ? (
                <div className="flex items-center gap-2">
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-[#36ADAA] hover:text-[#36ADAA]"
                      aria-label={`Edit announcement ${item.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
                      aria-label={`Delete announcement ${item.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#36ADAA]">
            Posted by {item.author}
          </div>
        </div>
      ))}
    </div>
  );
}

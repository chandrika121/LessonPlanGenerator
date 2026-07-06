import { Megaphone } from "lucide-react";
import { FormEvent, useState } from "react";
import { AnnouncementList } from "../../components/AnnouncementList";
import type { AnnouncementItem } from "../../types/announcements";
import { addAnnouncement, deleteAnnouncement, readAnnouncements, updateAnnouncement } from "../../utils/announcements";
import { useAuth } from "../../hooks/useAuth";

export function PrincipalAnnouncementsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState(readAnnouncements());
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const announcement: AnnouncementItem = {
      id: editingAnnouncementId ?? `${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      author: user?.name || "Principal",
      createdAt: editingAnnouncementId
        ? announcements.find((item) => item.id === editingAnnouncementId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
    };

    if (editingAnnouncementId) {
      updateAnnouncement(announcement);
    } else {
      addAnnouncement(announcement);
    }

    setAnnouncements(readAnnouncements());
    setTitle("");
    setMessage("");
    setEditingAnnouncementId(null);
  }

  function handleEdit(item: AnnouncementItem) {
    setTitle(item.title);
    setMessage(item.message);
    setEditingAnnouncementId(item.id);
  }

  function handleDelete(item: AnnouncementItem) {
    deleteAnnouncement(item.id);
    setAnnouncements(readAnnouncements());

    if (editingAnnouncementId === item.id) {
      setTitle("");
      setMessage("");
      setEditingAnnouncementId(null);
    }
  }

  function handleCancelEdit() {
    setTitle("");
    setMessage("");
    setEditingAnnouncementId(null);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              {editingAnnouncementId ? "Edit Announcement" : "Post Announcement"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editingAnnouncementId
                ? "Update an existing announcement and save it for students and teachers."
                : "Publish updates for students and teachers from the principal dashboard."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Announcement title"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#36ADAA]"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write the announcement for teachers and students..."
            className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#36ADAA]"
          />
          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
          >
            {editingAnnouncementId ? "Save Changes" : "Publish Announcement"}
          </button>
          {editingAnnouncementId ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="ml-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
          ) : null}
        </form>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <h3 className="font-display text-xl font-extrabold text-slate-900">Recent Announcements</h3>
        <p className="mt-1 text-sm text-slate-500">These announcements are visible on student and teacher dashboards.</p>
        <div className="mt-6">
          <AnnouncementList
            announcements={announcements}
            emptyMessage="No announcements have been posted yet."
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}

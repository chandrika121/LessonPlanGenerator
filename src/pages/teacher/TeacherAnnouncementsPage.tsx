import { Megaphone } from "lucide-react";
import { AnnouncementList } from "../../components/AnnouncementList";
import { readAnnouncements } from "../../utils/announcements";

export function TeacherAnnouncementsPage() {
  const announcements = readAnnouncements();

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Announcements</h2>
            <p className="mt-1 text-sm text-slate-500">Updates shared by the principal for teachers and staff.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <AnnouncementList announcements={announcements} emptyMessage="No announcements are available right now." />
      </div>
    </div>
  );
}
import { BookOpenText, CalendarClock, ListTodo, Megaphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "../../components/StatCard";
import { AnnouncementList } from "../../components/AnnouncementList";
import { readAnnouncements } from "../../utils/announcements";
import { endDevTimer, startDevTimer } from "../../utils/devTiming";
import { getTeacherClasses } from "../../services/teacherClassesService";
import type { TeacherClassCard } from "../../services/teacherClassesService";

export function TeacherDashboard() {
  const [classes, setClasses] = useState<TeacherClassCard[]>([]);

  useEffect(() => {
    const paintLabel = "[page-paint] teacher-dashboard";
    startDevTimer(paintLabel);

    const frame = window.requestAnimationFrame(() => {
      endDevTimer(paintLabel);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      endDevTimer(paintLabel);
    };
  }, []);

  useEffect(() => {
    getTeacherClasses()
      .then((items) => setClasses(items))
      .catch(() => setClasses([]));
  }, []);

  const announcements = readAnnouncements().slice(0, 3);
  const summary = useMemo(() => {
    const classCount = classes.length;
    const pendingSessions = classes.reduce((sum, item) => sum + Number(item.remainingSessions || 0), 0);
    const todaySessions = classes.reduce((sum, item) => sum + Number(item.sessionsGenerated || 0), 0);
    return {
      classCount,
      pendingSessions,
      todaySessions,
    };
  }, [classes]);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="My Classes"
          value={String(summary.classCount)}
          detail={summary.classCount === 1 ? "Assigned class linked to your account" : "Assigned classes linked to your account"}
          icon={BookOpenText}
        />
        <StatCard label="Today's Sessions" value={String(summary.todaySessions)} detail="Generated sessions across your assigned classes" icon={CalendarClock} />
        <StatCard label="Pending Sessions" value={String(summary.pendingSessions)} detail="Remaining sessions pending generation" icon={ListTodo} />
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Principal Announcements</h2>
            <p className="mt-1 text-sm text-slate-500">Latest school updates posted by the principal.</p>
          </div>
        </div>
        <div className="mt-6">
          <AnnouncementList announcements={announcements} emptyMessage="No announcements have been posted yet." />
        </div>
      </div>
    </div>
  );
}

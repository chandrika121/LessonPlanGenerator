import { BookMarked, BookOpenCheck, GraduationCap, Megaphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnnouncementList } from "../../components/AnnouncementList";
import { StatCard } from "../../components/StatCard";
import type { AuthUser } from "../../types/auth";
import type { PublishedStudentArtifact } from "../../types/student-content";
import { readAnnouncements } from "../../utils/announcements";
import { getPublishedArtifactsForStudent } from "../../utils/studentPublications";

const AUTH_STORAGE_KEY = "lms:auth-session";

function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function StudentDashboard() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [subjectCount, setSubjectCount] = useState<number | null>(null);
  const [backendItems, setBackendItems] = useState<PublishedStudentArtifact[]>([]);
  const [localNotes, setLocalNotes] = useState<PublishedStudentArtifact[]>([]);
  const publishedItems = useMemo(
    () => Array.from(
      new Map(
        [
          ...backendItems,
          ...localNotes,
        ].map((item) => [`${item.kind}:${item.sessionId}:${item.subject || ""}:${item.classId || item.className || item.gradeLevel || ""}`, item]),
      ).values(),
    ),
    [backendItems, localNotes],
  );
  const announcements = readAnnouncements().slice(0, 3);
  const homework = publishedItems.filter((item) => item.kind === "homework").length;
  const notes = publishedItems.filter((item) => item.kind === "notes").length;
  const recentPublishedItems = [...publishedItems]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 6);

  useEffect(() => {
    if (!currentUser?.id || !currentUser.schoolId) {
      setSubjectCount(null);
      return;
    }

    let cancelled = false;
    void fetch(
      `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}/api/student/subjects?userId=${encodeURIComponent(currentUser.id!)}&schoolId=${encodeURIComponent(currentUser.schoolId!)}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load subjects (${response.status})`);
        }
        return response.json() as Promise<{ success: boolean; subjects?: string[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          setSubjectCount(Array.isArray(data.subjects) ? data.subjects.length : 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSubjectCount(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.schoolId]);

  useEffect(() => {
    if (!currentUser?.id || !currentUser.schoolId) {
      setBackendItems([]);
      return;
    }

    let cancelled = false;

    const loadPublishedItems = async () => {
      try {
        const [homeworkResponse, assessmentResponse, notesResponse] = await Promise.all([
          fetch(`${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}/api/student/published-content?userId=${encodeURIComponent(currentUser!.id!)}&schoolId=${encodeURIComponent(currentUser!.schoolId!)}&kind=homework`),
          fetch(`${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}/api/student/published-content?userId=${encodeURIComponent(currentUser!.id!)}&schoolId=${encodeURIComponent(currentUser!.schoolId!)}&kind=assessments`),
          fetch(`${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}/api/student/notes?userId=${encodeURIComponent(currentUser!.id!)}&schoolId=${encodeURIComponent(currentUser!.schoolId!)}`),
        ]);

        const [homeworkData, assessmentData, notesData] = await Promise.all([
          homeworkResponse.ok ? homeworkResponse.json().catch(() => null) : null,
          assessmentResponse.ok ? assessmentResponse.json().catch(() => null) : null,
          notesResponse.ok ? notesResponse.json().catch(() => null) : null,
        ]);

        if (!cancelled) {
          setBackendItems([
            ...(Array.isArray(homeworkData?.items) ? homeworkData.items : []),
            ...(Array.isArray(assessmentData?.items) ? assessmentData.items : []),
            ...(Array.isArray(notesData?.items) ? notesData.items : []),
          ]);
        }
      } catch {
        if (!cancelled) {
          setBackendItems([]);
        }
      }
    };

    void loadPublishedItems();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.schoolId]);

  useEffect(() => {
    if (!currentUser?.id || !currentUser.schoolId) {
      setLocalNotes([]);
      return;
    }

    let cancelled = false;

    void getPublishedArtifactsForStudent("notes", currentUser)
      .then((items) => {
        if (!cancelled) {
          setLocalNotes(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocalNotes([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="My Classes" value={String(subjectCount ?? 0)} detail="Subjects currently enrolled this term" icon={GraduationCap} />
        <StatCard label="Homework" value={String(homework)} detail="Practice work published by teachers for your class" icon={BookOpenCheck} />
        <StatCard label="Study Materials" value={String(notes)} detail="Notes and materials now available to you" icon={BookMarked} />
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <h2 className="font-display text-2xl font-extrabold text-slate-900">Published By Teachers</h2>
        <p className="mt-2 text-sm text-slate-500">Your latest published homework, assessments, quizzes, and notes appear here.</p>

        {recentPublishedItems.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
            No teacher-published content is available yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {recentPublishedItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#36ADAA]">{item.kind}</div>
                    <div className="mt-1 font-semibold text-slate-800">{item.sessionTitle}</div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                    Session {item.sessionNumber}
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Published {new Date(item.publishedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Principal Announcements</h2>
            <p className="mt-1 text-sm text-slate-500">Latest updates shared for students.</p>
          </div>
        </div>
        <div className="mt-6">
          <AnnouncementList announcements={announcements} emptyMessage="No announcements have been posted yet." />
        </div>
      </div>
    </div>
  );
}

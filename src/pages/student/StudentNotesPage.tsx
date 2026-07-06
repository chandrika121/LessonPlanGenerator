import { BookMarked, BookOpenCheck, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthUser } from "../../types/auth";
import type { PublishedStudentArtifact } from "../../types/student-content";

const AUTH_STORAGE_KEY = "lms:auth-session";
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}`;

function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function formatText(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

const subjectIcons: Record<string, string> = {
  "Chemistry": "🧪",
  "Physics": "⚛️",
  "Biology": "🧬",
  "Mathematics": "📐",
  "English": "📚",
  "Hindi": "📖",
  "History": "🏛️",
  "Geography": "🌍",
  "Computer Science": "💻",
  "Economics": "📊",
};

function getSubjectIcon(subject: string) {
  return subjectIcons[subject] || "📘";
}

const subjectColors: Record<string, { bg: string; text: string }> = {
  "Chemistry": { bg: "bg-amber-50", text: "text-amber-600" },
  "Physics": { bg: "bg-indigo-50", text: "text-indigo-600" },
  "Biology": { bg: "bg-emerald-50", text: "text-emerald-600" },
  "Mathematics": { bg: "bg-blue-50", text: "text-blue-600" },
  "English": { bg: "bg-rose-50", text: "text-rose-600" },
  "Hindi": { bg: "bg-orange-50", text: "text-orange-600" },
  "History": { bg: "bg-stone-50", text: "text-stone-600" },
  "Geography": { bg: "bg-teal-50", text: "text-teal-600" },
  "Computer Science": { bg: "bg-cyan-50", text: "text-cyan-600" },
  "Economics": { bg: "bg-violet-50", text: "text-violet-600" },
};

function getSubjectColor(subject: string) {
  return subjectColors[subject] || { bg: "bg-slate-50", text: "text-slate-600" };
}

function StudentNotesPage() {
  const navigate = useNavigate();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [query, setQuery] = useState("");
  const [backendNotes, setBackendNotes] = useState<PublishedStudentArtifact[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser?.id || !currentUser.schoolId) {
      setBackendNotes([]);
      return;
    }

    let cancelled = false;
    void fetch(
      `${BACKEND_URL}/api/student/notes?userId=${encodeURIComponent(currentUser.id)}&schoolId=${encodeURIComponent(currentUser.schoolId)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load notes (${response.status})`);
        }
        return response.json() as Promise<{ success: boolean; items?: PublishedStudentArtifact[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          setBackendNotes(Array.isArray(data.items) ? data.items : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendNotes([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.schoolId]);

  useEffect(() => {
    if (!currentUser?.id || !currentUser.schoolId) {
      setStudentSubjects([]);
      return;
    }

    let cancelled = false;
    void fetch(
      `${BACKEND_URL}/api/student/subjects?userId=${encodeURIComponent(currentUser.id)}&schoolId=${encodeURIComponent(currentUser.schoolId)}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load subjects (${response.status})`);
        }
        return response.json() as Promise<{ success: boolean; subjects?: string[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          setStudentSubjects(Array.isArray(data.subjects) ? data.subjects : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStudentSubjects([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.schoolId]);

  const notesBySubject = useMemo(() => {
    const grouped = new Map<string, PublishedStudentArtifact[]>();
    for (const note of backendNotes) {
      const subject = note.subject || "General";
      if (!grouped.has(subject)) {
        grouped.set(subject, []);
      }
      grouped.get(subject)!.push(note);
    }

    for (const subject of studentSubjects) {
      if (!grouped.has(subject)) {
        grouped.set(subject, []);
      }
    }

    
    const sortedSubjects = Array.from(grouped.keys()).sort((a, b) => {
      if (a === "General") return 1;
      if (b === "General") return 0;
      return a.localeCompare(b);
    });

    return sortedSubjects.map((subject) => ({
      subject,
      notes: grouped.get(subject)!,
    }));
  }, [backendNotes, studentSubjects]);

  const searchResults = useMemo(() => {
    const queryLower = query.toLowerCase().trim();
    if (!queryLower) return notesBySubject;

    return notesBySubject
      .map((group) => {
        const matchingNotes = group.notes.filter((note) => {
          const sessionTitle = formatText(note.sessionTitle).toLowerCase();
          const subject = formatText(note.subject).toLowerCase();
          const className = formatText(note.className).toLowerCase();
          const gradeLevel = formatText(note.gradeLevel).toLowerCase();
          return sessionTitle.includes(queryLower) ||
                 subject.includes(queryLower) ||
                 className.includes(queryLower) ||
                 gradeLevel.includes(queryLower);
        });
        return { subject: group.subject, notes: matchingNotes };
      })
      .filter((group) => group.notes.length > 0);
  }, [query, notesBySubject]);

  const subjectCount = notesBySubject.length;
  const totalNoteCount = notesBySubject.reduce((sum, group) => sum + group.notes.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <BookMarked className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Student Notes</h2>
            <p className="mt-1 text-sm text-slate-500">
              {subjectCount} {subjectCount === 1 ? "subject" : "subjects"} · {totalNoteCount} {totalNoteCount === 1 ? "note" : "notes"}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search subjects or notes..."
          className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#36ADAA] focus:outline-none"
        />
      </div>

      {/* Subject Cards Grid */}
      {searchResults.length === 0 ? (
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <BookMarked className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-800">No notes for you yet</p>
          <p className="mt-2 text-sm text-slate-500">
            {query 
              ? "No subjects match your search. Try a different keyword."
              : "Notes published for your class and section will appear here once your teachers publish them."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {searchResults.map((group) => {
            const color = getSubjectColor(group.subject);
            const icon = getSubjectIcon(group.subject);
            const latestNote = group.notes[group.notes.length - 1];
            
            return (
              <button
                key={group.subject}
                onClick={() => navigate(`/student/study-materials/${encodeURIComponent(group.subject)}`, { state: { subject: group.subject } })}
                className="rounded-[30px] border border-white/80 bg-white/90 p-5 text-left shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition-all hover:scale-[1.01] hover:border-[#36ADAA]/30"
              >
                <div className="flex items-start gap-4">
                  
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${color.bg}`}>
                    {icon}
                  </div>

                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-extrabold text-slate-900 truncate">
                      {group.subject}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {group.notes.length} {group.notes.length === 1 ? "note" : "notes"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {currentUser?.classId || "Your class"}
                      {currentUser?.section ? ` · ${currentUser.section}` : ""}
                    </p>
                  </div>
                </div>

                
                {latestNote ? (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#36ADAA]">
                          Session {latestNote.sessionNumber}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
                          {latestNote.sessionTitle}
                        </p>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">
                          Published
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {new Date(latestNote.publishedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      This subject is enrolled for your class. Notes and published materials will appear here once a teacher publishes them.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpenCheck className="h-3.5 w-3.5 text-[#36ADAA]" />
                    <span className="text-[11px] font-semibold text-[#36ADAA]">View notes</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Click to open
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentNotesPage;

import { Award, BookOpen, Calendar, ChevronDown, ChevronUp, FileText, TrendingUp, User } from "lucide-react";
import { useEffect, useState } from "react";
import { buildApiUrl } from "../../utils/apiBaseUrl";

interface SubjectGrade {
  subject: string;
  teacher: string;
  term: string;
  maxMarks: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  exams: {
    name: string;
    maxMarks: number;
    scoredMarks: number;
    date: string;
  }[];
}

const AUTH_STORAGE_KEY = "lms:auth-session";

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { id?: string; schoolId?: string; role?: string };
  } catch {
    return null;
  }
}

const gradeColor = (grade: string) => {
  switch (grade) {
    case "A+": return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "A": return "text-blue-600 bg-blue-50 border-blue-200";
    case "B+": return "text-amber-600 bg-amber-50 border-amber-200";
    case "B": return "text-orange-600 bg-orange-50 border-orange-200";
    default: return "text-slate-600 bg-slate-50 border-slate-200";
  }
};

export function StudentGradesPage() {
  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session?.id) {
      setGrades([]);
      setLoading(false);
      return;
    }

    fetch(buildApiUrl(`/api/student/grades?userId=${encodeURIComponent(session.id)}&schoolId=${encodeURIComponent(session.schoolId || "")}`))
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Failed to load grades (HTTP ${response.status})`);
        }
        return response.json() as Promise<{ grades: SubjectGrade[] }>;
      })
      .then((data) => setGrades(data.grades || []))
      .catch(() => setGrades([]))
      .finally(() => setLoading(false));
  }, []);

  const overallPercentage = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-600">Loading grades...</span>
        </div>
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl bg-white/90 px-8 py-6 shadow-lg text-center">
          <Award className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-800">No grades available yet</p>
          <p className="mt-2 text-sm text-slate-500">Your grades will appear here once teachers save evaluation results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <Award className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Grades</h2>
            <p className="mt-1 text-sm text-slate-500">Your assessment results across all subjects.</p>
          </div>
          <div className="rounded-2xl border border-[#36ADAA]/20 bg-[#36ADAA]/8 px-5 py-3 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#36ADAA]">Overall</p>
            <p className="mt-0.5 font-display text-2xl font-extrabold text-slate-900">{overallPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Subject Cards */}
      <div className="grid gap-5">
        {grades.map((subject) => {
          const isExpanded = expandedSubject === subject.subject;
          return (
            <div
              key={subject.subject}
              className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedSubject(isExpanded ? null : subject.subject)}
                className="flex w-full items-center gap-4 px-6 py-5 text-left"
              >
                <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-extrabold text-slate-900">{subject.subject}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      {subject.teacher}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {subject.term}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-semibold text-slate-400">Marks</p>
                    <p className="font-display text-lg font-extrabold text-slate-900">{subject.totalMarks}/{subject.maxMarks}</p>
                  </div>
                  <div className={`rounded-xl border px-3 py-1.5 text-center ${gradeColor(subject.grade)}`}>
                    <p className="text-xs font-black uppercase tracking-wider">{subject.grade}</p>
                    <p className="text-lg font-extrabold">{subject.percentage}%</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 px-6 pb-5 pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#36ADAA]" />
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#36ADAA]">Exams & Assessments</span>
                  </div>
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                    {subject.exams.map((exam) => (
                      <div key={exam.name} className="flex items-center gap-4 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{exam.name}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{exam.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-700">{exam.scoredMarks}/{exam.maxMarks}</p>
                            <p className="text-xs text-slate-400">
                              {Math.round((exam.scoredMarks / exam.maxMarks) * 100)}%
                            </p>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#36ADAA]/10 text-[#36ADAA]">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { BookOpen, FileText, GraduationCap, Layers3, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTeacherClasses } from "../../services/teacherClassesService";
import type { TeacherClassCard } from "../../services/teacherClassesService";

function formatLastActivity(value: string) {
  if (!value) return "No activity yet";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeacherMyClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClassCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherClasses()
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-600">Loading assigned classes...</span>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl bg-white/90 px-8 py-6 text-center shadow-lg">
          <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-800">No assigned classes found</p>
          <p className="mt-2 text-sm text-slate-500">Classes will appear here once they are assigned to this teacher.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900">My Classes</h2>
          <p className="mt-1 text-sm text-slate-500">{classes.length} assigned classes linked to the current teacher</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {classes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(`/teacher/my-classes/${encodeURIComponent(item.routeKey)}`)}
            className="rounded-[30px] border border-white/80 bg-white/90 p-6 text-left shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition hover:shadow-lg"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-extrabold text-slate-900">{item.className}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Section {item.section || "-"} • {item.subjects.join(", ") || "No subjects"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#36ADAA]/10 px-4 py-3 text-center">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#36ADAA]">Curriculum</p>
                <p className="mt-1 text-xl font-extrabold text-slate-900">{item.curriculumProgress}%</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-500">Students</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{item.totalStudents}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-500">Sessions</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{item.sessionCounts.totalSessions}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-500">Terms</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{item.sessionCounts.totalTerms}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-500">Evaluations</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{item.evaluationsCompleted}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                <BookOpen className="h-4 w-4 text-[#36ADAA]" />
                Homework {item.sessionCounts.totalHomework}
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                <FileText className="h-4 w-4 text-[#36ADAA]" />
                Assessments {item.sessionCounts.totalAssessments}
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                <Sparkles className="h-4 w-4 text-[#36ADAA]" />
                Last Activity {formatLastActivity(item.lastActivity)}
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#36ADAA]" style={{ width: `${item.curriculumProgress}%` }} />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <Layers3 className="h-3.5 w-3.5" />
              Click to open class insights
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

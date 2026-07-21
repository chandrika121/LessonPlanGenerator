import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ClipboardCheck, Filter, School, Search, Users } from "lucide-react";
import { getClasses } from "../../services/principalServiceApi";
import type { PrincipalClassSummary } from "../../services/principalServiceApi";

function formatDate(value: string) {
  if (!value) return "No recent activity";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No recent activity" : date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function toSafeNumber(value: unknown, fallback = 0) {
  const next = typeof value === "number" ? value : Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function mergeRedundantBlankSectionClasses(items: PrincipalClassSummary[]) {
  const namedSectionsByClass = new Map<string, Set<string>>();

  items.forEach((item) => {
    const className = String(item.className || "").trim();
    const section = String(item.section || "").trim().toUpperCase();
    if (!className) return;
    const existing = namedSectionsByClass.get(className) || new Set<string>();
    if (section) existing.add(section);
    namedSectionsByClass.set(className, existing);
  });

  return items.filter((item) => {
    const className = String(item.className || "").trim();
    const section = String(item.section || "").trim().toUpperCase();
    const namedSections = namedSectionsByClass.get(className) || new Set<string>();
    return !(namedSections.size === 1 && !section);
  });
}

export function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<PrincipalClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "students" | "progress">("name");

  useEffect(() => {
    getClasses()
      .then((data) => {
        // Deduplicate by classKey, and keep malformed records from causing bad keys/routes.
        const seen = new Map<string, PrincipalClassSummary>();
        data.forEach((item, index) => {
          const classKey = String(item.classKey || "").trim();
          const fallbackKey = `fallback-${String(item.className || "").trim()}-${String(item.section || "").trim()}-${index}`;
          const dedupeKey = classKey || fallbackKey;
          if (!seen.has(dedupeKey)) {
            seen.set(dedupeKey, item);
          }
        });
        const normalized = Array.from(seen.values()).map((item) => ({
          ...item,
          students: toSafeNumber(item.students),
          subjects: toSafeNumber(item.subjects),
          teachers: toSafeNumber(item.teachers),
          evaluations: toSafeNumber(item.evaluations),
          totalTerms: toSafeNumber(item.totalTerms),
          sessionsGenerated: toSafeNumber(item.sessionsGenerated),
          pendingSessions: toSafeNumber(item.pendingSessions),
          homework: toSafeNumber(item.homework),
          assessments: toSafeNumber(item.assessments),
          submissionRate: toSafeNumber(item.submissionRate),
          averageClassPerformance: toSafeNumber(item.averageClassPerformance),
          curriculumProgress: toSafeNumber(item.curriculumProgress),
        })).filter((item) => String(item.className || "").trim().toLowerCase() !== "class xii");
        setClasses(mergeRedundantBlankSectionClasses(normalized));
      })
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = classes.filter((item) => {
      if (!query) return true;
      return [item.className, item.section, item.classTeacher, item.academicYear]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });
    next.sort((left, right) => {
      if (sortBy === "students") return right.students - left.students;
      if (sortBy === "progress") return right.curriculumProgress - left.curriculumProgress;
      return `${left.className}-${left.section}`.localeCompare(`${right.className}-${right.section}`);
    });
    return next;
  }, [classes, search, sortBy]);

  const totals = useMemo(() => ({
    students: classes.reduce((sum, item) => sum + item.students, 0),
    subjects: classes.reduce((sum, item) => sum + item.subjects, 0),
    evaluations: classes.reduce((sum, item) => sum + item.evaluations, 0),
  }), [classes]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" /><span className="text-sm font-semibold text-slate-600">Loading classes...</span></div></div>;
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      <div className="sticky top-0 z-10 rounded-[30px] border border-white/80 bg-white/95 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]"><School className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900">Classes</h2>
              <p className="mt-1 text-sm text-slate-500">{classes.length} active class cards across the school.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Students</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{totals.students}</p></div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Subjects</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{totals.subjects}</p></div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Evaluations</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{totals.evaluations}</p></div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <label className="flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search class, section, teacher, or year" className="w-full bg-transparent text-sm text-slate-700 outline-none" />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "name" | "students" | "progress")} className="bg-transparent outline-none">
              <option value="name">Sort by name</option>
              <option value="students">Sort by students</option>
              <option value="progress">Sort by progress</option>
            </select>
          </label>
        </div>

      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[30px] border border-white/80 bg-white/90 px-8 py-14 text-center shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <School className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-800">No classes match the current filters</p>
          <p className="mt-2 text-sm text-slate-500">Try a different search term or remove sorting filters.</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((cls) => (
            (() => {
              const classKey = String(cls.classKey || "").trim();
              const canOpen = Boolean(classKey);
              const safeSessionsGenerated = toSafeNumber(cls.sessionsGenerated);
              const safePendingSessions = toSafeNumber(cls.pendingSessions);
              const safeCurriculumProgress = toSafeNumber(cls.curriculumProgress);
              const cardKey = classKey || `${cls.className}-${cls.section || "no-section"}`;
              return (
            <button
              key={cardKey}
              type="button"
              onClick={() => {
                if (canOpen) navigate(`/principal/classes/${encodeURIComponent(classKey)}`);
              }}
              disabled={!canOpen}
              className="rounded-[30px] border border-white/80 bg-white/90 p-6 text-left shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#36ADAA]">{cls.section ? `Section ${cls.section}` : "Class Overview"}</p>
                  <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">{cls.className}</h3>
                  <p className="mt-1 text-sm text-slate-500">{cls.academicYear || "Academic year unavailable"}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-600">Class Teacher: {cls.classTeacher || "Not assigned"}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${cls.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{cls.status}</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-slate-500"><Users className="h-4 w-4" /><span className="text-xs font-bold uppercase">Students</span></div><p className="mt-2 text-2xl font-extrabold text-slate-900">{toSafeNumber(cls.students)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-slate-500"><BookOpen className="h-4 w-4" /><span className="text-xs font-bold uppercase">Subjects</span></div><p className="mt-2 text-2xl font-extrabold text-slate-900">{toSafeNumber(cls.subjects)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-slate-500"><ClipboardCheck className="h-4 w-4" /><span className="text-xs font-bold uppercase">Submission Rate</span></div><p className="mt-2 text-2xl font-extrabold text-slate-900">{toSafeNumber(cls.submissionRate)}%</p></div>
                <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">Average Performance</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{toSafeNumber(cls.averageClassPerformance)}%</p></div>
              </div>

              <div className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <div>Terms: <span className="font-bold text-slate-900">{toSafeNumber(cls.totalTerms)}</span></div>
                <div>Teachers: <span className="font-bold text-slate-900">{toSafeNumber(cls.teachers)}</span></div>
                <div>Sessions: <span className="font-bold text-slate-900">{safeSessionsGenerated}/{safeSessionsGenerated + safePendingSessions}</span></div>
                <div>Homework: <span className="font-bold text-slate-900">{toSafeNumber(cls.homework)}</span></div>
                <div>Assessments: <span className="font-bold text-slate-900">{toSafeNumber(cls.assessments)}</span></div>
                <div>Evaluations: <span className="font-bold text-slate-900">{toSafeNumber(cls.evaluations)}</span></div>
                <div>Pending Sessions: <span className="font-bold text-slate-900">{safePendingSessions}</span></div>
              </div>

              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Curriculum Progress</span><span>{safeCurriculumProgress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#36ADAA]" style={{ width: `${safeCurriculumProgress}%` }} /></div>
              </div>

              {!canOpen ? <p className="mt-3 text-xs font-semibold text-amber-600">Class details are unavailable for this record until a valid class key is provided.</p> : null}
              <p className="mt-4 text-xs font-semibold text-slate-500">Last activity: {formatDate(cls.lastActivity)}</p>
            </button>
              );
            })()
          ))}
        </div>
      )}
    </div>
  );
}

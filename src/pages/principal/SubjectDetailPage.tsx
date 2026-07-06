import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, GraduationCap, Search, Users } from "lucide-react";
import { ChartCard } from "../../components/ChartCard";
import { getSubjectDetails } from "../../services/principalServiceApi";
import type { PrincipalSubjectDetail } from "../../services/principalServiceApi";

function formatDate(value: string | undefined | null) {
  if (!value) return "N/A";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function SubjectDetailPage() {
  const { className: classKey, subjectKey } = useParams<{ className: string; subjectKey: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<PrincipalSubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    if (!classKey || !subjectKey) return;
    getSubjectDetails(decodeURIComponent(classKey), decodeURIComponent(subjectKey))
      .then((data) => {
        setSubject(data);
      })
      .catch(() => setSubject(null))
      .finally(() => setLoading(false));
  }, [classKey, subjectKey]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" /><span className="text-sm font-semibold text-slate-600">Loading subject dashboard...</span></div></div>;
  }

  if (!subject || !classKey) {
    return <div className="rounded-[30px] border border-white/80 bg-white/90 px-8 py-14 text-center shadow-[0_24px_60px_rgba(15,23,42,0.06)]"><p className="text-lg font-bold text-slate-800">Subject not found</p></div>;
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      <button type="button" onClick={() => navigate(`/principal/classes/${encodeURIComponent(classKey)}`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Back to Class Details</button>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#36ADAA]">Subject Dashboard</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">{subject.subject}</h2>
            <p className="mt-2 text-sm text-slate-600">Assigned Teacher: <span className="font-bold text-slate-900">{subject.teacherInfo.name || "Unassigned"}</span></p>
            <p className="mt-1 text-sm text-slate-500">Teacher Email: {subject.teacherInfo.email || "Unavailable"}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Curriculum Completion</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{subject.curriculumProgress}%</p></div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Submission Rate</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{subject.submissionPercentage}%</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Teacher Information" subtitle="Live teaching activity metrics" icon={<Users className="h-5 w-5" />}>
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
            <div>Assigned Since: <span className="font-bold text-slate-900">{subject.teacherInfo.assignedSince ? formatDate(subject.teacherInfo.assignedSince) : "N/A"}</span></div>
            <div>Lesson Plan Progress: <span className="font-bold text-slate-900">{subject.teacherInfo.lessonPlanProgress}%</span></div>
            <div>Terms: <span className="font-bold text-slate-900">{subject.teacherInfo.terms}</span></div>
            <div>Sessions: <span className="font-bold text-slate-900">{subject.teacherInfo.sessions}</span></div>
            <div>Homework: <span className="font-bold text-slate-900">{subject.teacherInfo.homeworkCreated}</span></div>
            <div>Assessments: <span className="font-bold text-slate-900">{subject.teacherInfo.assessmentsCreated}</span></div>
            <div>Evaluations: <span className="font-bold text-slate-900">{subject.teacherInfo.evaluationsCompleted}</span></div>
          </div>
        </ChartCard>

        <ChartCard title="Curriculum" subtitle="Units, chapters, terms, and session progress" icon={<BookOpen className="h-5 w-5" />}>
          <div className="space-y-4">
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Units</p><p className="mt-2 text-sm text-slate-700">{subject.curriculum.units.join(", ") || "No units available"}</p></div>
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Chapters</p><p className="mt-2 text-sm text-slate-700">{subject.curriculum.chapters.join(", ") || "No chapters available"}</p></div>
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Terms</p><p className="mt-2 text-sm text-slate-700">{subject.curriculum.terms.join(", ") || "No terms available"}</p></div>
            <div className="grid grid-cols-2 gap-3 text-center"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-extrabold text-slate-900">{subject.curriculum.sessionProgress.completed}</p><p className="text-xs font-bold text-slate-500">Completed</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-extrabold text-slate-900">{subject.teacherInfo.pendingSessions}</p><p className="text-xs font-bold text-slate-500">Remaining</p></div></div>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Student Information" subtitle="Submission and evaluation progress" icon={<GraduationCap className="h-5 w-5" />}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="w-full max-w-[400px] md:max-w-[320px] lg:max-w-[400px]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search student by name, email, or roll number" className="w-full bg-transparent text-sm text-slate-700 outline-none" />
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                <th className="rounded-l-2xl bg-[#dff3f2] px-4 py-3">Student</th>
                <th className="bg-[#dff3f2] px-4 py-3">Homework</th>
                <th className="bg-[#dff3f2] px-4 py-3">Assessment</th>
                <th className="bg-[#dff3f2] px-4 py-3">Submissions</th>
                <th className="bg-[#dff3f2] px-4 py-3">Evaluation</th>
                <th className="rounded-r-2xl bg-[#dff3f2] px-4 py-3">Submission</th>
              </tr>
            </thead>
            <tbody>
              {subject.students.filter((student) => {
                const query = studentSearch.trim().toLowerCase();
                if (!query) return true;
                return String(student.name || "").toLowerCase().includes(query) || String(student.email || "").toLowerCase().includes(query) || String(student.rollNo || "").toLowerCase().includes(query);
              }).map((student) => (
                <tr key={student.id}>
                  <td className="rounded-l-2xl bg-slate-50 px-4 py-3">
                    <div className="text-sm font-bold text-slate-900">{student.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{student.rollNo || "No roll"}  {student.email || "No email"}</div>
                  </td>
                  <td className="bg-slate-50 px-4 py-3 text-sm text-slate-700">{student.homeworkStatus}</td>
                  <td className="bg-slate-50 px-4 py-3 text-sm text-slate-700">{student.assessmentStatus}</td>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">{student.submissionCount}</td>
                  <td className="bg-slate-50 px-4 py-3 text-sm text-slate-700">{student.evaluationResult}</td>
                  <td className="rounded-r-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{student.submissionLabel || "No submission yet"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

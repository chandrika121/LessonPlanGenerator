import { ArrowLeft, ClipboardCheck, FileText, ListTree } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChartCard } from "../../components/ChartCard";
import { ExpandableCard } from "../../components/ExpandableCard";
import { getTeacherClassDetail } from "../../services/teacherClassesService";
import type { TeacherClassDetail } from "../../services/teacherClassesService";

function MetricTable({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; primary: string; secondary?: string; trailing?: string }[];
}) {
  return (
    <ChartCard title={title} subtitle={`${rows.length} records`} icon={<FileText className="h-5 w-5" />}>
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">No records available yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-bold text-slate-800">{row.primary}</div>
                {row.secondary ? <div className="mt-1 text-xs text-slate-500">{row.secondary}</div> : null}
              </div>
              {row.trailing ? <div className="text-xs font-bold text-[#36ADAA]">{row.trailing}</div> : null}
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

export function TeacherMyClassDetailPage() {
  const { classId: routeKey } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<TeacherClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionsExpanded, setSessionsExpanded] = useState(false);

  useEffect(() => {
    if (!routeKey) return;
    getTeacherClassDetail(decodeURIComponent(routeKey))
      .then(setClassData)
      .catch(() => setClassData(null))
      .finally(() => setLoading(false));
  }, [routeKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-600">Loading class details...</span>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/teacher/my-classes")}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Classes
        </button>
        <div className="flex items-center justify-center py-16">
          <div className="rounded-2xl bg-white/90 px-8 py-6 text-center shadow-lg">
            <p className="text-lg font-bold text-slate-800">Class not found</p>
            <p className="mt-2 text-sm text-slate-500">This class is not assigned to the current teacher.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      <button
        type="button"
        onClick={() => navigate("/teacher/my-classes")}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Classes
      </button>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">{classData.className}</h2>
            <p className="mt-1 text-sm text-slate-500">Section {classData.section || "-"} â€¢ {classData.subjects.join(", ") || "No subjects"}</p>
          </div>
          <div className="rounded-2xl bg-[#36ADAA]/10 px-4 py-3 text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#36ADAA]">Curriculum Progress</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{classData.curriculumProgress}%</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-7">
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{classData.totalStudents}</p><p className="mt-1 text-xs font-bold text-slate-500">Students</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{classData.sessionsGenerated}/{classData.remainingSessions}</p><p className="mt-1 text-xs font-bold text-slate-500">Generated / Remaining</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{classData.sessionCounts.totalTerms}</p><p className="mt-1 text-xs font-bold text-slate-500">Terms</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{classData.sessionCounts.totalAssessments}</p><p className="mt-1 text-xs font-bold text-slate-500">Assessments</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{classData.sessionCounts.totalHomework}</p><p className="mt-1 text-xs font-bold text-slate-500">Homework</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{classData.evaluationsCompleted}</p><p className="mt-1 text-xs font-bold text-slate-500">Evaluations</p></div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <MetricTable
          title="Student List"
          rows={classData.students.map((student) => ({
            id: student.id,
            primary: student.name,
            secondary: `${student.rollNo || "No roll"} • ${student.email || "No email"}`,
          }))}
        />
        <MetricTable
          title="Terms"
          rows={classData.lessonPlanItems.map((item) => ({
            id: item.id,
            primary: item.title,
            trailing: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("en-IN") : "",
          }))}
        />
        <ChartCard title="Sessions" subtitle={`${classData.sessionItems.length} records`} icon={<ListTree className="h-5 w-5" />}>
          {classData.sessionItems.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">No sessions available yet.</div>
          ) : (
            <ExpandableCard
              id="all-sessions"
              isExpanded={sessionsExpanded}
              onToggle={() => setSessionsExpanded((current) => !current)}
              icon={<ListTree className="h-5 w-5" />}
              header={(
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">All Sessions</p>
                    <p className="mt-1 text-base font-extrabold text-slate-900">{classData.sessionsGenerated} generated / {classData.remainingSessions} remaining</p>
                  </div>
                  <span className="rounded-full bg-[#36ADAA]/10 px-3 py-1 text-[11px] font-bold text-[#36ADAA]">View List</span>
                </div>
              )}
            >
              <div className="space-y-2">
                {classData.sessionItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Session {index + 1}</p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-900">{item.title}</p>
                    </div>
                    <span className="rounded-full bg-[#36ADAA]/10 px-3 py-1 text-[11px] font-bold text-[#36ADAA]">{item.status}</span>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          )}
        </ChartCard>
        <MetricTable
          title="Homework"
          rows={classData.homeworkItems.map((item) => ({
            id: item.id,
            primary: item.title,
            trailing: item.status,
          }))}
        />
        <MetricTable
          title="Assessments"
          rows={classData.assessmentItems.map((item) => ({
            id: item.id,
            primary: item.title,
            trailing: item.status,
          }))}
        />
      </div>

      <div className="grid gap-6">
        <ChartCard title="Evaluation Results" subtitle="Student-wise evaluation outcomes" icon={<ClipboardCheck className="h-5 w-5" />}>
          {classData.evaluationResults.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">No evaluation results available yet.</div>
          ) : (
            <div className="space-y-2">
              {classData.evaluationResults.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{item.studentName}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.marks} marks • {item.percentage}%</div>
                  </div>
                  <div className="text-xs font-bold text-[#36ADAA]">{item.grade}</div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

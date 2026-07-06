import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Award, Target } from "lucide-react";
import { ChartCard } from "../../components/ChartCard";
import { getEvaluationReports } from "../../services/principalServiceApi";
import type { EvaluationReport } from "../../services/principalServiceApi";

function SimpleBar({ value, max, label, color = "bg-[#36ADAA]" }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 truncate text-sm font-semibold text-slate-600">{label}</span>
      <div className="flex-1 rounded-full bg-slate-100 h-3 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

export function EvaluationReportsPage() {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"class" | "subject" | "teacher" | "student">("class");

  useEffect(() => {
    getEvaluationReports()
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-600">Loading evaluation reports...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl bg-white/90 px-8 py-6 shadow-lg text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-800">No evaluation data available</p>
          <p className="mt-2 text-sm text-slate-500">Evaluation reports will appear once teachers complete assessments.</p>
        </div>
      </div>
    );
  }

  const maxClassAvg = Math.max(...report.classWise.map((c) => c.average), 1);
  const maxGradeCount = Math.max(...report.gradeDistribution.map((g) => g.count), 1);

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900">Evaluation Reports</h2>
          <p className="mt-1 text-sm text-slate-500">Analytics from teacher evaluations across classes, subjects, and topics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Average Marks</p>
              <p className="font-display text-3xl font-extrabold text-slate-900">{report.averageMarks}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Highest Marks</p>
              <p className="font-display text-3xl font-extrabold text-slate-900">{report.highestMarks}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Lowest Marks</p>
              <p className="font-display text-3xl font-extrabold text-slate-900">{report.lowestMarks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Class / Subject / Teacher / Student */}
      <div className="flex gap-2">
        {(["class", "subject", "teacher", "student"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-5 py-2.5 text-xs font-bold capitalize transition ${
              activeTab === tab
                ? "bg-[#36ADAA] text-white shadow-lg shadow-[#36ADAA]/25"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab}-wise Performance
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] overflow-x-auto">
        {activeTab === "class" && (
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                <th className="rounded-l-2xl bg-[#dff3f2] px-4 py-3">Class</th>
                <th className="bg-[#dff3f2] px-4 py-3">Average</th>
                <th className="bg-[#dff3f2] px-4 py-3">Highest</th>
                <th className="rounded-r-2xl bg-[#dff3f2] px-4 py-3">Lowest</th>
              </tr>
            </thead>
            <tbody>
              {report.classWise.map((c) => (
                <tr key={c.className} className="align-middle">
                  <td className="rounded-l-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{c.className}</td>
                  <td className="bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden max-w-[120px]">
                        <div className="h-full rounded-full bg-[#36ADAA]" style={{ width: `${(c.average / maxClassAvg) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{c.average}</span>
                    </div>
                  </td>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-emerald-600">{c.highest}</td>
                  <td className="rounded-r-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-red-500">{c.lowest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "subject" && (
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                <th className="rounded-l-2xl bg-[#dff3f2] px-4 py-3">Subject</th>
                <th className="bg-[#dff3f2] px-4 py-3">Average</th>
                <th className="bg-[#dff3f2] px-4 py-3">Highest</th>
                <th className="rounded-r-2xl bg-[#dff3f2] px-4 py-3">Lowest</th>
              </tr>
            </thead>
            <tbody>
              {report.subjectWise.map((s) => (
                <tr key={s.subject} className="align-middle">
                  <td className="rounded-l-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{s.subject}</td>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{s.average}</td>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-emerald-600">{s.highest}</td>
                  <td className="rounded-r-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-red-500">{s.lowest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "teacher" && (
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                <th className="rounded-l-2xl bg-[#dff3f2] px-4 py-3">Teacher</th>
                <th className="bg-[#dff3f2] px-4 py-3">Average Score</th>
                <th className="rounded-r-2xl bg-[#dff3f2] px-4 py-3">Total Evaluated</th>
              </tr>
            </thead>
            <tbody>
              {report.teacherWise.map((t) => (
                <tr key={t.teacher} className="align-middle">
                  <td className="rounded-l-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{t.teacher}</td>
                  <td className="bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden max-w-[120px]">
                        <div className="h-full rounded-full bg-[#7F64EA]" style={{ width: `${t.average}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{t.average}</span>
                    </div>
                  </td>
                  <td className="rounded-r-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{t.totalEvaluated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "student" && (
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                <th className="rounded-l-2xl bg-[#dff3f2] px-4 py-3">Student</th>
                <th className="bg-[#dff3f2] px-4 py-3">Class</th>
                <th className="bg-[#dff3f2] px-4 py-3">Marks</th>
                <th className="rounded-r-2xl bg-[#dff3f2] px-4 py-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {report.studentWise.map((s, idx) => (
                <tr key={idx} className="align-middle">
                  <td className="rounded-l-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{s.student}</td>
                  <td className="bg-slate-50 px-4 py-3 text-sm text-slate-600">{s.className}</td>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{s.marks}</td>
                  <td className="rounded-r-2xl bg-slate-50 px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${
                      s.grade === "A+" ? "bg-emerald-50 text-emerald-700" :
                      s.grade === "A" ? "bg-blue-50 text-blue-700" :
                      s.grade === "B+" ? "bg-amber-50 text-amber-700" :
                      s.grade === "B" ? "bg-orange-50 text-orange-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {s.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Grade Distribution & Topics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grade Distribution */}
        <ChartCard title="Grade Distribution" subtitle="Number of students per grade" icon={<Award className="h-5 w-5" />}>
          <div className="space-y-3">
            {report.gradeDistribution.map((g) => (
              <SimpleBar key={g.grade} label={g.grade} value={g.count} max={maxGradeCount} color={
                g.grade === "A+" ? "bg-emerald-500" :
                g.grade === "A" ? "bg-blue-500" :
                g.grade === "B+" ? "bg-amber-500" :
                g.grade === "B" ? "bg-orange-500" :
                "bg-red-500"
              } />
            ))}
          </div>
        </ChartCard>

        {/* Weak & Strong Topics */}
        <div className="space-y-6">
          <ChartCard title="Weak Topics" subtitle="Topics needing improvement" icon={<TrendingDown className="h-5 w-5" />}>
            <div className="space-y-3">
              {report.weakTopics.map((t) => (
                <SimpleBar key={t.topic} label={t.topic} value={t.avgScore} max={100} color="bg-red-400" />
              ))}
            </div>
          </ChartCard>
          <ChartCard title="Strong Topics" subtitle="Topics with high mastery" icon={<TrendingUp className="h-5 w-5" />}>
            <div className="space-y-3">
              {report.strongTopics.map((t) => (
                <SimpleBar key={t.topic} label={t.topic} value={t.avgScore} max={100} color="bg-emerald-500" />
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

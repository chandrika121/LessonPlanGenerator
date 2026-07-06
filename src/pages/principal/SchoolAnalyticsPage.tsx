import { useEffect, useState } from "react";
import { BarChart3, PieChart, TrendingUp, Target, Award, BookOpen, ClipboardCheck, Users, BrainCircuit } from "lucide-react";
import { ChartCard } from "../../components/ChartCard";
import { getAnalytics } from "../../services/principalServiceApi";
import type { SchoolAnalytics } from "../../services/principalServiceApi";

function ProgressRing({ value, size = 100, strokeWidth = 8, color = "#36ADAA" }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <span className="text-lg font-extrabold text-slate-800">{value}%</span>
    </div>
  );
}

export function SchoolAnalyticsPage() {
  const [data, setData] = useState<SchoolAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl bg-white/90 px-8 py-6 shadow-lg text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-800">Analytics data not available</p>
          <p className="mt-2 text-sm text-slate-500">School analytics will be displayed once sufficient data is collected.</p>
        </div>
      </div>
    );
  }

  const maxMonthVal = Math.max(...data.monthlyTrend.map((m) => Math.max(m.curriculum, m.evaluation, m.performance)), 1);
  const maxSubjectScore = 100;

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900">School Analytics</h2>
          <p className="mt-1 text-sm text-slate-500">Comprehensive overview of school performance metrics</p>
        </div>
      </div>

      {/* Progress Rings */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-7">
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] flex flex-col items-center">
          <ProgressRing value={data.curriculumCompletion} size={70} strokeWidth={6} color="#36ADAA" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-center text-slate-500">Curriculum</p>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] flex flex-col items-center">
          <ProgressRing value={data.lessonPlanGeneration} size={70} strokeWidth={6} color="#7F64EA" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-center text-slate-500">Lesson Plans</p>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] flex flex-col items-center">
          <ProgressRing value={data.evaluationCompletion} size={70} strokeWidth={6} color="#DE8431" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-center text-slate-500">Evaluations</p>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] flex flex-col items-center">
          <ProgressRing value={data.averageStudentPerformance} size={70} strokeWidth={6} color="#3CC583" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-center text-slate-500">Performance</p>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] flex flex-col items-center">
          <ProgressRing value={data.teacherProductivity} size={70} strokeWidth={6} color="#1EABDA" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-center text-slate-500">Productivity</p>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] flex flex-col items-center">
          <ProgressRing value={data.homeworkCompletion} size={70} strokeWidth={6} color="#92BD39" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-center text-slate-500">Homework</p>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] flex flex-col items-center">
          <ProgressRing value={data.assessmentCompletion} size={70} strokeWidth={6} color="#E0CB15" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-center text-slate-500">Assessments</p>
        </div>
      </div>

      {/* Monthly Trend */}
      <ChartCard title="Monthly Trend" subtitle="Curriculum, evaluation and performance over time" icon={<TrendingUp className="h-5 w-5" />}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                <th className="rounded-l-2xl bg-[#dff3f2] px-4 py-3">Month</th>
                <th className="bg-[#dff3f2] px-4 py-3">Curriculum</th>
                <th className="bg-[#dff3f2] px-4 py-3">Evaluation</th>
                <th className="rounded-r-2xl bg-[#dff3f2] px-4 py-3">Performance</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyTrend.map((m) => (
                <tr key={m.month} className="align-middle">
                  <td className="rounded-l-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{m.month}</td>
                  <td className="bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden max-w-[100px]">
                        <div className="h-full rounded-full bg-[#36ADAA]" style={{ width: `${(m.curriculum / maxMonthVal) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{m.curriculum}%</span>
                    </div>
                  </td>
                  <td className="bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden max-w-[100px]">
                        <div className="h-full rounded-full bg-[#DE8431]" style={{ width: `${(m.evaluation / maxMonthVal) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{m.evaluation}%</span>
                    </div>
                  </td>
                  <td className="rounded-r-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden max-w-[100px]">
                        <div className="h-full rounded-full bg-[#7F64EA]" style={{ width: `${(m.performance / maxMonthVal) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{m.performance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mini bar chart visualization */}
        <div className="mt-6">
          <div className="flex items-end justify-between gap-1 h-32">
            {data.monthlyTrend.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t-sm bg-[#7F64EA]" style={{ height: `${m.performance * 0.3}px` }} />
                  <div className="w-full rounded-t-sm bg-[#DE8431]" style={{ height: `${m.evaluation * 0.3}px` }} />
                  <div className="w-full rounded-t-sm bg-[#36ADAA]" style={{ height: `${m.curriculum * 0.3}px` }} />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 mt-1">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#36ADAA]" />
              <span className="text-xs text-slate-600">Curriculum</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#DE8431]" />
              <span className="text-xs text-slate-600">Evaluation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#7F64EA]" />
              <span className="text-xs text-slate-600">Performance</span>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Subject Performance & Grade Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject Performance */}
        <ChartCard title="Subject Performance" subtitle="Average scores by subject" icon={<BrainCircuit className="h-5 w-5" />}>
          <div className="space-y-3">
            {data.subjectPerformance.map((s) => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="w-28 truncate text-sm font-semibold text-slate-600">{s.subject}</span>
                <div className="flex-1 rounded-full bg-slate-100 h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      s.score >= 80 ? "bg-emerald-500" : s.score >= 70 ? "bg-[#36ADAA]" : s.score >= 60 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-bold text-slate-800">{s.score}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Grade Distribution Pie Chart */}
        <ChartCard title="Grade Distribution" subtitle="How students are performing" icon={<Award className="h-5 w-5" />}>
          <div className="flex flex-wrap gap-4">
            {data.gradePie.map((g) => {
              const total = data.gradePie.reduce((s, item) => s + item.count, 0);
              const pct = total > 0 ? (g.count / total) * 100 : 0;
              const colorMap: Record<string, string> = {
                "A+": "bg-emerald-500",
                "A": "bg-blue-500",
                "B+": "bg-amber-500",
                "B": "bg-orange-500",
                "C": "bg-red-400",
                "D": "bg-red-600",
              };
              const color = colorMap[g.grade] || "bg-slate-400";
              return (
                <div key={g.grade} className="flex-1 min-w-[80px] rounded-2xl bg-slate-50 p-3 text-center">
                  <div className={`mx-auto h-12 w-12 rounded-full ${color} flex items-center justify-center text-white font-black text-sm`}>
                    {g.grade}
                  </div>
                  <p className="mt-2 text-lg font-extrabold text-slate-900">{g.count}</p>
                  <p className="text-[11px] font-bold text-slate-500">{pct.toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

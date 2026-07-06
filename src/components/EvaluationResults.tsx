import { Download, RotateCcw, Save } from "lucide-react";
import type { EvaluationResult } from "../services/evaluationService";

export function EvaluationResults({
  results,
  onDownloadReport,
  onReevaluate,
  onSave,
  saving,
}: {
  results: EvaluationResult[];
  onDownloadReport: (result: EvaluationResult) => void;
  onReevaluate: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Results</p>
            <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Evaluation outcomes and feedback</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onReevaluate} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
              <RotateCcw className="h-4 w-4" />
              Re-evaluate
            </button>
            <button type="button" onClick={onSave} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Evaluation"}
            </button>
          </div>
        </div>
      </div>

      {results.map((result) => (
        <div key={result.studentId} className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="font-display text-2xl font-extrabold text-slate-900">{result.studentName}</h4>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{result.overallFeedback}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Total Marks", value: `${result.totalMarks}/${result.maxMarks}` },
                { label: "Percentage", value: `${result.percentage}%` },
                { label: "Grade", value: result.grade },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                  <div className="mt-2 text-lg font-extrabold text-slate-900">{item.value}</div>
                </div>
              ))}
              <button type="button" onClick={() => onDownloadReport(result)} className="inline-flex items-center gap-2 rounded-2xl bg-[#36ADAA] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25">
                <Download className="h-4 w-4" />
                Download Report
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-3">Question No.</th>
                  <th className="px-3">Max Marks</th>
                  <th className="px-3">Awarded Marks</th>
                  <th className="px-3">Matching Score</th>
                  <th className="px-3">Extracted Answer</th>
                  <th className="px-3">Student Answer Summary</th>
                  <th className="px-3">Expected Answer Summary</th>
                  <th className="px-3">Reason</th>
                  <th className="px-3">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {result.questionWise.map((question) => (
                  <tr key={question.questionNo} className="align-top">
                    <td className="rounded-l-2xl bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800">{question.questionNo}</td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-700">{question.maxMarks}</td>
                    <td className="bg-slate-50 px-3 py-4 text-sm font-bold text-[#36ADAA]">{question.awardedMarks}</td>
                    <td className="bg-slate-50 px-3 py-4 text-sm font-bold text-slate-700">{question.matchingScore}%</td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-600">{question.extractedAnswer}</td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-600">{question.studentAnswerSummary}</td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-600">{question.expectedAnswerSummary}</td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-600">{question.reason}</td>
                    <td className="rounded-r-2xl bg-slate-50 px-3 py-4 text-sm text-slate-600">{question.feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

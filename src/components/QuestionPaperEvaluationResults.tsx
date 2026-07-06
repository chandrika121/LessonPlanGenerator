import { Save } from "lucide-react";
import type { QuestionPaperStudentResult } from "../types/evaluation";

export function QuestionPaperEvaluationResults({
  results,
  saving,
  onOverrideMarks,
  onOverrideReasonChange,
  onApproveStudent,
  onSave,
}: {
  results: QuestionPaperStudentResult[];
  saving: boolean;
  onOverrideMarks: (studentId: string, questionId: string, awardedMarks: number) => void;
  onOverrideReasonChange: (studentId: string, questionId: string, reason: string) => void;
  onApproveStudent: (studentId: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Step 7</p>
            <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Review marks</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">Review AI-scored student results, inspect question-wise feedback, and override marks manually where needed.</p>
          </div>
          <button type="button" onClick={onSave} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Final Results"}
          </button>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                <th className="px-3">Student</th>
                <th className="px-3">Total Marks</th>
                <th className="px-3">Percentage</th>
                <th className="px-3">Grade</th>
                <th className="px-3">AI Confidence</th>
                <th className="px-3">Status</th>
                <th className="px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.studentId}>
                  <td className="rounded-l-2xl bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800">{result.studentName}</td>
                  <td className="bg-slate-50 px-3 py-4 text-sm text-slate-700">{result.totalMarks}/{result.maxMarks}</td>
                  <td className="bg-slate-50 px-3 py-4 text-sm text-slate-700">{result.percentage}%</td>
                  <td className="bg-slate-50 px-3 py-4 text-sm text-slate-700">{result.grade}</td>
                  <td className="bg-slate-50 px-3 py-4 text-sm text-slate-700">{result.aiConfidence}</td>
                  <td className="bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-700">{result.status}</td>
                  <td className="rounded-r-2xl bg-slate-50 px-3 py-4">
                    <button
                      type="button"
                      onClick={() => onApproveStudent(result.studentId)}
                      className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {results.map((result) => (
        <div key={result.studentId} className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="font-display text-2xl font-extrabold text-slate-900">{result.studentName}</h4>
              <div className="mt-2 text-sm text-slate-500">Roll No. {result.rollNo}</div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{result.feedback}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Total Marks</div>
              <div className="mt-2 text-lg font-extrabold text-slate-900">{result.totalMarks}/{result.maxMarks}</div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-3">Question No</th>
                  <th className="px-3">Max Marks</th>
                  <th className="px-3">Awarded Marks</th>
                  <th className="px-3">AI Reason</th>
                  <th className="px-3">AI Feedback</th>
                  <th className="px-3">Teacher Override</th>
                </tr>
              </thead>
              <tbody>
                {result.questionResults.map((question) => (
                  <tr key={question.questionId} className="align-top">
                    <td className="rounded-l-2xl bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800">{question.questionNo}</td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-700">{question.maxMarks}</td>
                    <td className="bg-slate-50 px-3 py-4">
                      <input
                        type="number"
                        min={0}
                        max={question.maxMarks}
                        value={question.awardedMarks}
                        onChange={(event) => onOverrideMarks(result.studentId, question.questionId, Math.min(question.maxMarks, Number(event.target.value) || 0))}
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#36ADAA] outline-none focus:border-[#36ADAA]"
                      />
                      <div className="mt-2 text-xs text-slate-500">Original AI marks: {question.originalAiMarks}</div>
                    </td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-600">{question.aiReason}</td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-600">{question.aiFeedback}</td>
                    <td className="rounded-r-2xl bg-slate-50 px-3 py-4">
                      <input
                        type="text"
                        value={question.overrideReason || ""}
                        onChange={(event) => onOverrideReasonChange(result.studentId, question.questionId, event.target.value)}
                        placeholder="Override Marks"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA]"
                      />
                      {question.overriddenAt ? <div className="mt-2 text-xs text-slate-500">Updated {question.overriddenAt}</div> : null}
                    </td>
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

import { Calculator, Pencil } from "lucide-react";
import type { QuestionPaperQuestion } from "../types/evaluation";

export function QuestionMarksEditor({
  questions,
  onUpdateQuestion,
}: {
  questions: QuestionPaperQuestion[];
  onUpdateQuestion: (questionId: string, updates: Partial<QuestionPaperQuestion>) => void;
}) {
  const totalMarks = questions.reduce((sum, item) => sum + item.detectedMarks, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Step 4</p>
        <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Review extracted questions and marks</h3>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                <th className="px-3">Question No</th>
                <th className="px-3">Question</th>
                <th className="px-3">Detected Marks</th>
                <th className="px-3">Question Type</th>
                <th className="px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="align-top">
                  <td className="rounded-l-2xl bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800">{question.questionNo}</td>
                  <td className="bg-slate-50 px-3 py-4 text-sm text-slate-700">{question.question}</td>
                  <td className="bg-slate-50 px-3 py-4">
                    <input
                      type="number"
                      min={0}
                      value={question.detectedMarks}
                      onChange={(event) => onUpdateQuestion(question.id, { detectedMarks: Number(event.target.value) || 0 })}
                      className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA]"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4 text-sm text-slate-700">{question.questionType}</td>
                  <td className="rounded-r-2xl bg-slate-50 px-3 py-4 text-sm text-slate-500">Review only</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Total Marks</p>
              <h3 className="font-display text-2xl font-extrabold text-slate-900">{totalMarks}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-500">The total updates automatically when detected marks are adjusted.</p>
        </div>

        <div className="rounded-[30px] border border-dashed border-[#36ADAA]/35 bg-[#36ADAA]/6 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white p-3 text-[#36ADAA]">
              <Pencil className="h-5 w-5" />
            </div>
            <div className="text-sm leading-7 text-slate-600">
              Use this step to fine-tune extracted marks before the AI evaluator is run.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

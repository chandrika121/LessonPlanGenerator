import { AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import { useState } from "react";
import type { QuestionPaperExtraction, QuestionPaperQuestion } from "../types/evaluation";

function validationTone(valid: boolean) {
  return valid
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

export function ExtractedQuestionsReview({
  extraction,
  questions,
  onUpdateQuestion,
}: {
  extraction: QuestionPaperExtraction;
  questions: QuestionPaperQuestion[];
  onUpdateQuestion: (questionId: string, updates: Partial<QuestionPaperQuestion>) => void;
}) {
  const [editingQuestionIds, setEditingQuestionIds] = useState<string[]>([]);
  const detectedTotalMarks = questions.reduce((sum, item) => sum + item.detectedMarks, 0);
  const totalMarksMatch = detectedTotalMarks === extraction.totalMarks;

  const toggleEdit = (questionId: string) => {
    setEditingQuestionIds((current) =>
      current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId],
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">AI Detected</p>
          <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Question paper extraction</h3>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              { label: "Exam Name", value: extraction.examName },
              { label: "Class", value: extraction.className },
              { label: "Subject", value: extraction.subject },
              { label: "Duration", value: extraction.duration },
              { label: "Paper Total", value: String(extraction.totalMarks) },
              { label: "Sections", value: extraction.sections.map((section) => section.name).join(", ") },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Instructions</div>
            <div className="mt-2 text-sm leading-7 text-slate-600">{extraction.instructions}</div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Review Required</p>
          <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Validation checks</h3>
          <div className="mt-6 space-y-3">
            {[
              { label: "Every question has marks", valid: questions.every((question) => question.detectedMarks > 0) },
              { label: "Total detected marks matches paper total marks", valid: totalMarksMatch },
              { label: "No duplicate question numbers", valid: new Set(questions.map((question) => question.questionNo)).size === questions.length },
              { label: "No missing question text", valid: questions.every((question) => question.question.trim().length > 0) },
              { label: "Sections are ordered correctly", valid: questions.every((question, index, current) => index === 0 || current[index - 1].sectionOrder <= question.sectionOrder) },
            ].map((rule) => (
              <div key={rule.label} className={`rounded-2xl border px-4 py-4 text-sm font-semibold ${validationTone(rule.valid)}`}>
                <div className="flex items-center gap-2">
                  {rule.valid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {rule.label}
                </div>
              </div>
            ))}
          </div>

          {!totalMarksMatch ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
              Detected total marks do not match paper total marks. Please review before continuing.
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Review Extracted Questions And Marks</p>
            <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Teacher edits only if extraction is wrong</h3>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Detected total: {detectedTotalMarks} / Paper total: {extraction.totalMarks}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                <th className="px-3">Section</th>
                <th className="px-3">Question No</th>
                <th className="px-3">Question Text</th>
                <th className="px-3">Detected Marks</th>
                <th className="px-3">Question Type</th>
                <th className="px-3">Difficulty</th>
                <th className="px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="align-top">
                  <td className="rounded-l-2xl bg-slate-50 px-3 py-4 text-sm text-slate-700">{question.section}</td>
                  <td className="bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800">{question.questionNo}</td>
                  <td className="bg-slate-50 px-3 py-4">
                    <textarea
                      value={question.question}
                      onChange={(event) => onUpdateQuestion(question.id, { question: event.target.value })}
                      disabled={!editingQuestionIds.includes(question.id)}
                      className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4">
                    <input
                      type="number"
                      min={0}
                      value={question.detectedMarks}
                      onChange={(event) => onUpdateQuestion(question.id, { detectedMarks: Number(event.target.value) || 0 })}
                      disabled={!editingQuestionIds.includes(question.id)}
                      className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4">
                    <select
                      value={question.questionType}
                      onChange={(event) => onUpdateQuestion(question.id, { questionType: event.target.value as QuestionPaperQuestion["questionType"] })}
                      disabled={!editingQuestionIds.includes(question.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="objective">Objective</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="long_answer">Long Answer</option>
                    </select>
                  </td>
                  <td className="bg-slate-50 px-3 py-4">
                    <select
                      value={question.difficulty}
                      onChange={(event) => onUpdateQuestion(question.id, { difficulty: event.target.value as QuestionPaperQuestion["difficulty"] })}
                      disabled={!editingQuestionIds.includes(question.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </td>
                  <td className="rounded-r-2xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    <button
                      type="button"
                      onClick={() => toggleEdit(question.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm"
                    >
                      <Pencil className="h-4 w-4 text-[#36ADAA]" />
                      {editingQuestionIds.includes(question.id) ? "Approve" : "Edit"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

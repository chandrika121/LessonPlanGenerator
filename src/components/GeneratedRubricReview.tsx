import { FileUp, Sparkles } from "lucide-react";
import { useState } from "react";
import type { QuestionPaperRubricItem } from "../types/evaluation";

export function GeneratedRubricReview({
  rubricFileName,
  onUploadRubric,
  rubricItems,
  onUpdateRubricItem,
}: {
  rubricFileName?: string;
  onUploadRubric: (file: File) => void;
  rubricItems: QuestionPaperRubricItem[];
  onUpdateRubricItem: (rubricId: string, updates: Partial<QuestionPaperRubricItem>) => void;
}) {
  const [editingRubricIds, setEditingRubricIds] = useState<string[]>([]);

  const toggleEdit = (rubricId: string) => {
    setEditingRubricIds((current) =>
      current.includes(rubricId) ? current.filter((id) => id !== rubricId) : [...current, rubricId],
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Step 5</p>
          <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Upload rubric</h3>
          <p className="mt-2 text-sm leading-7 text-slate-500">Upload the rubric file in PDF or DOCX format. The teacher-supplied rubric will be used together with the AI-generated rubric suggestion.</p>

          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[#36ADAA]/35 bg-[#36ADAA]/6 px-6 py-10 text-center">
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <FileUp className="h-5 w-5" />
            </div>
            <div className="mt-4 text-base font-bold text-slate-900">Choose PDF or DOCX</div>
            <div className="mt-2 text-sm text-slate-500">Supported formats: `.pdf`, `.docx`</div>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadRubric(file);
                event.currentTarget.value = "";
              }}
            />
          </label>

          <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Uploaded file:</span> {rubricFileName || "No rubric selected yet"}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">AI Detected</p>
              <h3 className="font-display text-2xl font-extrabold text-slate-900">Suggested rubric</h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-500">The rubric is suggested automatically from the question paper, answer key, and marks per question. Teachers can review it alongside the uploaded rubric file.</p>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Review Required</p>
        <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Rubric table</h3>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                <th className="px-3">Question No</th>
                <th className="px-3">Criteria</th>
                <th className="px-3">Marks</th>
                <th className="px-3">Keywords</th>
                <th className="px-3">Common Mistakes</th>
                <th className="px-3">Teacher Notes</th>
                <th className="px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rubricItems.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="rounded-l-2xl bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800">{item.questionNo}</td>
                  <td className="bg-slate-50 px-3 py-4">
                    <textarea
                      value={item.criteria}
                      onChange={(event) => onUpdateRubricItem(item.id, { criteria: event.target.value })}
                      disabled={!editingRubricIds.includes(item.id)}
                      className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4">
                    <input
                      type="number"
                      min={0}
                      value={item.marks}
                      onChange={(event) => onUpdateRubricItem(item.id, { marks: Number(event.target.value) || 0 })}
                      disabled={!editingRubricIds.includes(item.id)}
                      className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4">
                    <input
                      type="text"
                      value={item.keywords}
                      onChange={(event) => onUpdateRubricItem(item.id, { keywords: event.target.value })}
                      disabled={!editingRubricIds.includes(item.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4">
                    <input
                      type="text"
                      value={item.commonMistakes}
                      onChange={(event) => onUpdateRubricItem(item.id, { commonMistakes: event.target.value })}
                      disabled={!editingRubricIds.includes(item.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4">
                    <input
                      type="text"
                      value={item.teacherNotes}
                      onChange={(event) => onUpdateRubricItem(item.id, { teacherNotes: event.target.value })}
                      disabled={!editingRubricIds.includes(item.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="rounded-r-2xl bg-slate-50 px-3 py-4">
                    <button
                      type="button"
                      onClick={() => toggleEdit(item.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm"
                    >
                      {editingRubricIds.includes(item.id) ? "Approve" : "Edit"}
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

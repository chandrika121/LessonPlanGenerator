import { CheckCircle2, FileCheck2, Pencil } from "lucide-react";
import { useState } from "react";
import type { QuestionPaperAnswerMapping } from "../types/evaluation";

export function AnswerKeyReviewStep({
  fileName,
  mappings,
  onUpload,
  onUpdateMapping,
}: {
  fileName?: string;
  mappings: QuestionPaperAnswerMapping[];
  onUpload: (file: File) => void;
  onUpdateMapping: (mappingId: string, updates: Partial<QuestionPaperAnswerMapping>) => void;
}) {
  const [editingMappingIds, setEditingMappingIds] = useState<string[]>([]);

  const toggleEdit = (mappingId: string) => {
    setEditingMappingIds((current) =>
      current.includes(mappingId) ? current.filter((id) => id !== mappingId) : [...current, mappingId],
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Step 3</p>
          <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Upload answer key</h3>
          <p className="mt-2 text-sm leading-7 text-slate-500">The system extracts answers automatically and maps them to the detected question numbers.</p>

          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[#36ADAA]/35 bg-[#36ADAA]/6 px-6 py-10 text-center">
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="mt-4 text-base font-bold text-slate-900">Choose PDF or DOCX</div>
            <div className="mt-2 text-sm text-slate-500">Supported formats: `.pdf`, `.docx`</div>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>

          <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Uploaded file:</span> {fileName || "No file selected yet"}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">AI Detected</p>
              <h3 className="font-display text-2xl font-extrabold text-slate-900">Answer mapping status</h3>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">{mappings.length} questions mapped from the uploaded answer key.</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">Keywords and alternative answers are ready for teacher review.</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">Marks are linked back to the extracted question paper automatically.</div>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Review Required</p>
        <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Answer mapping table</h3>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                <th className="px-3">Question No</th>
                <th className="px-3">Expected Answer</th>
                <th className="px-3">Keywords</th>
                <th className="px-3">Alternative Answers</th>
                <th className="px-3">Marks</th>
                <th className="px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping) => (
                <tr key={mapping.id} className="align-top">
                  <td className="rounded-l-2xl bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800">{mapping.questionNo}</td>
                  <td className="bg-slate-50 px-3 py-4">
                    <textarea
                      value={mapping.expectedAnswer}
                      onChange={(event) => onUpdateMapping(mapping.id, { expectedAnswer: event.target.value })}
                      disabled={!editingMappingIds.includes(mapping.id)}
                      className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4">
                    <input
                      type="text"
                      value={mapping.keywords}
                      onChange={(event) => onUpdateMapping(mapping.id, { keywords: event.target.value })}
                      disabled={!editingMappingIds.includes(mapping.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4">
                    <input
                      type="text"
                      value={mapping.alternativeAnswers}
                      onChange={(event) => onUpdateMapping(mapping.id, { alternativeAnswers: event.target.value })}
                      disabled={!editingMappingIds.includes(mapping.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#36ADAA] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </td>
                  <td className="bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-700">{mapping.marks}</td>
                  <td className="rounded-r-2xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    <button
                      type="button"
                      onClick={() => toggleEdit(mapping.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm"
                    >
                      <Pencil className="h-4 w-4 text-[#36ADAA]" />
                      {editingMappingIds.includes(mapping.id) ? "Approve" : "Edit"}
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

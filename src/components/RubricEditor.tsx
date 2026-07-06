import type { QuestionPaperQuestion, QuestionPaperRubricItem } from "../types/evaluation";

export function RubricEditor({
  questions,
  rubricItems,
  onUpdateRubricItem,
}: {
  questions: QuestionPaperQuestion[];
  rubricItems: QuestionPaperRubricItem[];
  onUpdateRubricItem: (rubricId: string, updates: Partial<QuestionPaperRubricItem>) => void;
}) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Step 5</p>
      <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Add rubric</h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">Add simple rubric guidance per question so the AI evaluation has clear scoring criteria, keywords, and teacher notes.</p>

      <div className="mt-6 space-y-4">
        {rubricItems.map((item) => {
          const question = questions.find((entry) => entry.questionNo === item.questionNo);
          return (
            <div key={item.id} className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Question No</span>
                  <select
                    value={item.questionNo}
                    onChange={(event) => onUpdateRubricItem(item.id, { questionNo: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#36ADAA]"
                  >
                    {questions.map((entry) => (
                      <option key={entry.id} value={entry.questionNo}>
                        {entry.questionNo}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Marks</span>
                  <input
                    type="number"
                    min={0}
                    value={item.marks}
                    onChange={(event) => onUpdateRubricItem(item.id, { marks: Number(event.target.value) || 0 })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#36ADAA]"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Criteria</span>
                  <input
                    type="text"
                    value={item.criteria}
                    onChange={(event) => onUpdateRubricItem(item.id, { criteria: event.target.value })}
                    placeholder={question ? `Criteria for ${question.questionNo}` : "Enter criteria"}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#36ADAA]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Keywords</span>
                  <input
                    type="text"
                    value={item.keywords}
                    onChange={(event) => onUpdateRubricItem(item.id, { keywords: event.target.value })}
                    placeholder="comma separated keywords"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#36ADAA]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Teacher Notes</span>
                  <input
                    type="text"
                    value={item.teacherNotes}
                    onChange={(event) => onUpdateRubricItem(item.id, { teacherNotes: event.target.value })}
                    placeholder="special instructions"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#36ADAA]"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

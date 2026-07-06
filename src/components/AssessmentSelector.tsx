import { BookCopy, FileCheck2, FileText, ShieldCheck } from "lucide-react";
import type { EvaluationAssessment, EvaluationType } from "../services/evaluationService";

function uniqueBy<T>(items: T[], getKey: (item: T) => string | undefined) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function AssessmentSelector({
  evaluationType,
  assessments,
  selectedAssessmentId,
  selectedTermId,
  selectedChapterId,
  selectedLessonId,
  selectedSessionId,
  onTermChange,
  onChapterChange,
  onLessonChange,
  onSessionChange,
  onAssessmentChange,
}: {
  evaluationType: EvaluationType;
  assessments: EvaluationAssessment[];
  selectedAssessmentId: string;
  selectedTermId: string;
  selectedChapterId: string;
  selectedLessonId: string;
  selectedSessionId: string;
  onTermChange: (value: string) => void;
  onChapterChange: (value: string) => void;
  onLessonChange: (value: string) => void;
  onSessionChange: (value: string) => void;
  onAssessmentChange: (value: string) => void;
}) {
  const termOptions = uniqueBy(assessments, (item) => item.termId);
  const chapterOptions = uniqueBy(
    assessments.filter((item) => item.termId === selectedTermId),
    (item) => item.chapterId,
  );
  const lessonOptions = uniqueBy(
    assessments.filter((item) => item.termId === selectedTermId && item.chapterId === selectedChapterId),
    (item) => item.lessonId,
  );
  const sessionOptions = uniqueBy(
    assessments.filter((item) => item.termId === selectedTermId && item.chapterId === selectedChapterId),
    (item) => item.sessionId,
  );

  const filteredAssessments = assessments.filter((item) => {
    if (evaluationType === "term") return item.termId === selectedTermId;
    if (evaluationType === "lesson") {
      return item.termId === selectedTermId && item.chapterId === selectedChapterId && item.lessonId === selectedLessonId;
    }
    return item.termId === selectedTermId && item.chapterId === selectedChapterId && item.sessionId === selectedSessionId;
  });

  const selectedAssessment = assessments.find((item) => item.id === selectedAssessmentId) || filteredAssessments[0];
  const jsonBlocks = selectedAssessment
    ? [
        { label: "Question Paper JSON", value: selectedAssessment.questionPaperJson, icon: FileText },
        { label: "Answer Key JSON", value: selectedAssessment.answerKeyJson, icon: FileCheck2 },
        { label: "Rubric JSON", value: selectedAssessment.rubricJson, icon: ShieldCheck },
      ]
    : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Assessment Context</p>
        <h3 className="mt-3 font-display text-2xl font-extrabold text-slate-900">Select the evaluation source</h3>
        <p className="mt-2 text-sm text-slate-500">Choose the academic scope first, then pick the linked assessment package.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Term</span>
            <select value={selectedTermId} onChange={(e) => onTermChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
              <option value="">Select term</option>
              {termOptions.map((term) => (
                <option key={term.termId} value={term.termId}>{term.termName}</option>
              ))}
            </select>
          </label>

          {evaluationType !== "term" && (
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chapter</span>
              <select value={selectedChapterId} onChange={(e) => onChapterChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                <option value="">Select chapter</option>
                {chapterOptions.map((chapter) => (
                  <option key={chapter.chapterId} value={chapter.chapterId}>{chapter.chapterName}</option>
                ))}
              </select>
            </label>
          )}

          {evaluationType === "lesson" && (
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lesson</span>
              <select value={selectedLessonId} onChange={(e) => onLessonChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                <option value="">Select lesson</option>
                {lessonOptions.map((lesson) => (
                  <option key={lesson.lessonId} value={lesson.lessonId}>{lesson.lessonName}</option>
                ))}
              </select>
            </label>
          )}

          {evaluationType === "session" && (
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Session</span>
              <select value={selectedSessionId} onChange={(e) => onSessionChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                <option value="">Select session</option>
                {sessionOptions.map((session) => (
                  <option key={session.sessionId} value={session.sessionId}>{session.sessionName}</option>
                ))}
              </select>
            </label>
          )}

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked assessment package</span>
            <select value={selectedAssessmentId} onChange={(e) => onAssessmentChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
              <option value="">Select assessment package</option>
              {filteredAssessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.questionPaperTitle}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Linked Deliverables</p>
        <h3 className="mt-3 font-display text-2xl font-extrabold text-slate-900">Question paper, key, and rubric</h3>
        {!selectedAssessment ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
            Select the evaluation scope to preview the generated assets.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {[
              { label: "Question Paper", value: selectedAssessment.questionPaperTitle, id: selectedAssessment.questionPaperId, icon: FileText },
              { label: "Answer Key", value: selectedAssessment.answerKeyTitle, id: selectedAssessment.answerKeyId, icon: FileCheck2 },
              { label: "Rubrics", value: selectedAssessment.rubricTitle, id: selectedAssessment.rubricId, icon: ShieldCheck },
            ].map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#36ADAA]/10 p-2 text-[#36ADAA]">
                    <asset.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{asset.label}</div>
                    <div className="truncate text-sm font-bold text-slate-800">{asset.value}</div>
                    <div className="text-xs text-slate-500">{asset.id}</div>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-[#36ADAA]/30 bg-[#36ADAA]/6 px-4 py-4 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <BookCopy className="h-4 w-4 text-[#36ADAA]" />
                Ready for backend binding
              </div>
              <p className="mt-2">This selector is mock-data backed today, but the structure is already aligned for real assessment APIs.</p>
            </div>
            {jsonBlocks.map((block) => (
              <div key={block.label} className="rounded-2xl border border-slate-100 bg-slate-950 px-4 py-4 text-slate-100">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <block.icon className="h-4 w-4 text-[#59d1ce]" />
                  {block.label}
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-200">
                  {JSON.stringify(block.value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { ArrowLeft, BookMarked, BookOpenCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ActionToast } from "../../components/ActionToast";
import { ExpandableCard } from "../../components/ExpandableCard";
import type { PublishedStudentArtifact } from "../../types/student-content";

const AUTH_STORAGE_KEY = "lms:auth-session";
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}`;

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { id?: string; schoolId?: string; name?: string; role?: string; classId?: string; section?: string; stream?: string; assignedClasses?: string[] };
  } catch {
    return null;
  }
}

function formatText(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const text = typeof record.text === "string" ? record.text.trim() : "";
    const latex = typeof record.displayLatex === "string"
      ? record.displayLatex.trim()
      : typeof record.latex === "string"
        ? record.latex.trim()
        : "";
    if (text && latex) return text.includes(latex) ? text : `${text} ${latex}`.trim();
    if (text || latex) return text || latex;
    return Object.values(record).map((item) => formatText(item)).filter(Boolean).join(" ");
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatText(item)).filter(Boolean).join("; ");
  }
  return String(value);
}

function formatSessionLabel(sessionNumber: unknown) {
  const parsed = Number(sessionNumber || 0);
  return Number.isFinite(parsed) && parsed > 0 ? `Session ${parsed}` : "Session";
}

function normalizeSubjectKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\b(theory|practical|practicals|lab|laboratory|pedagogy|lessonplanner|lesson planner)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

function getSubjectDisplayName(note: Pick<PublishedStudentArtifact, "subject" | "subjectName" | "subjectId">) {
  return note.subjectName || note.subject || note.subjectId || "General";
}

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function SubjectNotesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useMemo(() => getSession(), []);
  const subjectFromState = location.state?.subject as string | undefined;
  const subjectFromUrl = decodeURIComponent(location.pathname.split("/").pop() || "");
  const subject = subjectFromState || subjectFromUrl;
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [backendNotes, setBackendNotes] = useState<PublishedStudentArtifact[]>([]);

  useEffect(() => {
    if (!session?.id || !session.schoolId) {
      setBackendNotes([]);
      return;
    }

    let cancelled = false;
    void fetch(
      `${BACKEND_URL}/api/student/notes?userId=${encodeURIComponent(session.id)}&schoolId=${encodeURIComponent(session.schoolId)}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load notes (${response.status})`);
        }
        return response.json() as Promise<{ success: boolean; items?: PublishedStudentArtifact[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          setBackendNotes(Array.isArray(data.items) ? data.items : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendNotes([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.id, session?.schoolId]);

  const subjectNotes = useMemo(() => {
    return backendNotes
      .filter((note) => normalizeSubjectKey(getSubjectDisplayName(note)) === normalizeSubjectKey(subject))
      .sort((a, b) => a.sessionNumber - b.sessionNumber);
  }, [backendNotes, subject]);

  const subjectTitle = subjectNotes[0] ? getSubjectDisplayName(subjectNotes[0]) : subject;

  const handleBack = () => {
    navigate("/student/study-materials");
  };

  return (
    <div className="space-y-6">
      <ActionToast open={Boolean(popupMessage)} message={popupMessage} onClose={() => setPopupMessage("")} />

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-white hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Student Notes
      </button>

      {/* Header */}
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <BookMarked className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#36ADAA]">Subject Notes</p>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">{subjectTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {subjectNotes.length} {subjectNotes.length === 1 ? "note" : "notes"} · {session?.classId || "Your class"}{session?.section ? ` · ${session.section}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Notes List */}
      {subjectNotes.length === 0 ? (
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <BookMarked className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-800">No notes for {subjectTitle}</p>
          <p className="mt-2 text-sm text-slate-500">Notes for this subject will appear here once published by your teacher.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjectNotes.map((note) => {
            const isExpanded = expandedNoteId === note.id;
            const notes = note.payload.studentLessonNotes;
            const keyTerms = asArray(notes?.keyTerms);
            const quickSummary = asArray(notes?.quickSummary);
            const quickRevision = asArray(notes?.quickRevision);
            const rememberPoints = asArray(notes?.rememberPoints);
            const fillInTheBlanks = asArray(notes?.fillInTheBlanks);
            const mcqQuestions = asArray(notes?.mcqQuestions);
            const veryShortAnswerQuestions = asArray(notes?.veryShortAnswerQuestions);
            
            return (
              <ExpandableCard
                key={note.id}
                id={note.id}
                isExpanded={isExpanded}
                onToggle={(id) => setExpandedNoteId(isExpanded ? null : id)}
                icon={<BookOpenCheck className="h-5 w-5" />}
                header={
                  <>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#36ADAA]">
                      {formatSessionLabel(note.sessionNumber)}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-extrabold text-slate-900">
                      {note.sessionTitle}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatSessionLabel(note.sessionNumber)} · Published {new Date(note.publishedAt).toLocaleString()}
                    </p>
                  </>
                }
              >
                <div className="space-y-4 text-sm text-slate-700">
                      {notes?.title && (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="font-semibold text-slate-800">{formatText(notes.title)}</div>
                          {notes.sessionOverview && (
                            <p className="mt-2 text-slate-600">{formatText(notes.sessionOverview)}</p>
                          )}
                        </div>
                      )}

                      {note.payload.studentLessonNotes?.introduction && (
                        <p className="leading-7">{formatText(note.payload.studentLessonNotes.introduction)}</p>
                      )}

                      {!!note.payload.studentLessonNotes?.learningObjectives?.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Learning Objectives</div>
                          <ul className="list-disc space-y-1 pl-5 text-slate-600">
                            {note.payload.studentLessonNotes.learningObjectives.map((objective, index) => (
                              <li key={index}>{formatText(objective)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!note.payload.studentLessonNotes?.quickRecall?.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Quick Recall</div>
                          <ul className="list-disc space-y-1 pl-5 text-slate-600">
                            {note.payload.studentLessonNotes.quickRecall.map((point, index) => (
                              <li key={index}>{formatText(point)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!keyTerms.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Key Terms</div>
                          <ul className="list-disc space-y-1 pl-5 text-slate-600">
                            {keyTerms.map((term, index) => (
                              <li key={index}>{formatText(term)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!note.payload.studentLessonNotes?.sections?.length && (
                        <div className="space-y-3">
                          {note.payload.studentLessonNotes.sections.map((section, index) => (
                            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                              <div className="font-semibold text-slate-800">{formatText(section.heading)}</div>
                              <p className="mt-1 text-slate-600">{formatText(section.explanation)}</p>
                              {section.whyItMatters && (
                                <p className="mt-2 text-slate-600">
                                  <span className="font-semibold text-slate-700">Why it matters:</span> {formatText(section.whyItMatters)}
                                </p>
                              )}
                              {section.detailedExplanation && (
                                <p className="mt-2 text-slate-600">{formatText(section.detailedExplanation)}</p>
                              )}
                              {!!section.keyPoints?.length && (
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                                  {section.keyPoints.map((point, pointIndex) => (
                                    <li key={pointIndex}>{formatText(point)}</li>
                                  ))}
                                </ul>
                              )}
                              {!!section.examples?.length && (
                                <p className="mt-2 text-slate-600">
                                  <span className="font-semibold text-slate-700">Examples:</span> {section.examples.map((example) => formatText(example)).join("; ")}
                                </p>
                              )}
                              {!!section.terminology?.length && (
                                <p className="mt-2 text-slate-600">
                                  <span className="font-semibold text-slate-700">Terminology:</span> {section.terminology.map((term) => formatText(term)).join("; ")}
                                </p>
                              )}
                              {!!section.visualSupport?.length && (
                                <p className="mt-2 text-slate-600">
                                  <span className="font-semibold text-slate-700">Visual support:</span> {section.visualSupport.map((item) => formatText(item)).join("; ")}
                                </p>
                              )}
                              {!!section.importantNotes?.length && (
                                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Important Notes</div>
                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-900">
                                    {section.importantNotes.map((note, noteIndex) => (
                                      <li key={noteIndex}>{formatText(note)}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {!!section.memoryTechniques?.length && (
                                <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Memory Techniques</div>
                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sky-900">
                                    {section.memoryTechniques.map((tip, tipIndex) => (
                                      <li key={tipIndex}>{formatText(tip)}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {!!section.conceptSummary?.length && (
                                <p className="mt-2 text-slate-600">
                                  <span className="font-semibold text-slate-700">Concept summary:</span> {section.conceptSummary.map((item) => formatText(item)).join("; ")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {!!quickSummary.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Quick Summary</div>
                          <ul className="list-disc space-y-1 pl-5 text-slate-600">
                            {quickSummary.map((point, index) => (
                              <li key={index}>{formatText(point)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!note.payload.studentLessonNotes?.definitions?.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Definitions</div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {note.payload.studentLessonNotes.definitions.map((definition, index) => (
                              <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <div className="font-semibold text-slate-800">{formatText(definition.term)}</div>
                                <p className="mt-1 text-slate-600">{formatText(definition.definition)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!!note.payload.studentLessonNotes?.workedExamples?.length && (
                        <div className="space-y-3">
                          <div className="font-semibold text-slate-800">Worked Examples</div>
                          {note.payload.studentLessonNotes.workedExamples.map((example, index) => (
                            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                              <div className="font-semibold text-slate-800">{formatText(example.title)}</div>
                              {!!example.steps?.length && (
                                <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-600">
                                  {example.steps.map((step, stepIndex) => (
                                    <li key={stepIndex}>{formatText(step)}</li>
                                  ))}
                                </ol>
                              )}
                              {example.explanation && <p className="mt-2 text-slate-600">{formatText(example.explanation)}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {note.payload.studentLessonNotes?.revisionSection && (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="font-semibold text-slate-800">Revision Section</div>
                          <div className="mt-2 space-y-2 text-slate-600">
                            {!!note.payload.studentLessonNotes.revisionSection.definitions?.length && (
                              <p>
                                <span className="font-semibold text-slate-700">Definitions:</span> {note.payload.studentLessonNotes.revisionSection.definitions.map((entry) => formatText(entry)).join("; ")}
                              </p>
                            )}
                            {!!note.payload.studentLessonNotes.revisionSection.formulas?.length && (
                              <p>
                                <span className="font-semibold text-slate-700">Formulas:</span> {note.payload.studentLessonNotes.revisionSection.formulas.map((entry) => formatText(entry)).join("; ")}
                              </p>
                            )}
                            {!!note.payload.studentLessonNotes.revisionSection.facts?.length && (
                              <p>
                                <span className="font-semibold text-slate-700">Facts:</span> {note.payload.studentLessonNotes.revisionSection.facts.map((entry) => formatText(entry)).join("; ")}
                              </p>
                            )}
                            {!!note.payload.studentLessonNotes.revisionSection.keywords?.length && (
                              <p>
                                <span className="font-semibold text-slate-700">Keywords:</span> {note.payload.studentLessonNotes.revisionSection.keywords.map((entry) => formatText(entry)).join("; ")}
                              </p>
                            )}
                            {!!note.payload.studentLessonNotes.revisionSection.conceptMap?.length && (
                              <p>
                                <span className="font-semibold text-slate-700">Concept map:</span> {note.payload.studentLessonNotes.revisionSection.conceptMap.map((entry) => formatText(entry)).join("; ")}
                              </p>
                            )}
                            {!!note.payload.studentLessonNotes.revisionSection.quickRecap?.length && (
                              <p>
                                <span className="font-semibold text-slate-700">Quick recap:</span> {note.payload.studentLessonNotes.revisionSection.quickRecap.map((entry) => formatText(entry)).join("; ")}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!!note.payload.studentLessonNotes?.selfCheckQuestions?.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Self-Check Questions</div>
                          <ol className="list-decimal space-y-1 pl-5 text-slate-600">
                            {note.payload.studentLessonNotes.selfCheckQuestions.map((question, index) => (
                              <li key={index}>{formatText(question)}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {!!note.payload.studentLessonNotes?.didYouKnow?.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Did You Know?</div>
                          <ul className="list-disc space-y-1 pl-5 text-slate-600">
                            {note.payload.studentLessonNotes.didYouKnow.map((fact, index) => (
                              <li key={index}>{formatText(fact)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!note.payload.studentLessonNotes?.summary?.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Summary</div>
                          <ul className="list-disc space-y-1 pl-5 text-slate-600">
                            {note.payload.studentLessonNotes.summary.map((point, index) => (
                              <li key={index}>{formatText(point)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!quickRevision.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Quick Revision</div>
                          <ul className="list-disc space-y-1 pl-5 text-slate-600">
                            {quickRevision.map((point, index) => (
                              <li key={index}>{formatText(point)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!rememberPoints.length && (
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Remember Points</div>
                          <ul className="list-disc space-y-1 pl-5 text-slate-600">
                            {rememberPoints.map((point, index) => (
                              <li key={index}>{formatText(point)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!fillInTheBlanks.length && (
                        <div className="space-y-3">
                          <div className="font-semibold text-slate-800">Fill in the Blanks</div>
                          {fillInTheBlanks.map((item: any, index) => (
                            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                              <div className="text-slate-700">{formatText(item?.prompt)}</div>
                              {item?.answer && (
                                <p className="mt-2 text-slate-600">
                                  <span className="font-semibold text-slate-700">Answer:</span> {formatText(item.answer)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {!!mcqQuestions.length && (
                        <div className="space-y-3">
                          <div className="font-semibold text-slate-800">MCQ Questions</div>
                          {mcqQuestions.map((item: any, index) => (
                            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                              <div className="font-semibold text-slate-800">{formatText(item?.question || `Question ${index + 1}`)}</div>
                              {!!asArray(item?.options).length && (
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                                  {asArray(item.options).map((option: unknown, optionIndex) => (
                                    <li key={optionIndex}>{formatText(option)}</li>
                                  ))}
                                </ul>
                              )}
                              {item?.answer && (
                                <p className="mt-2 text-slate-600">
                                  <span className="font-semibold text-slate-700">Answer:</span> {formatText(item.answer)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {!!veryShortAnswerQuestions.length && (
                        <div className="space-y-3">
                          <div className="font-semibold text-slate-800">Very Short Answer Questions</div>
                          {veryShortAnswerQuestions.map((item: any, index) => (
                            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                              <div className="font-semibold text-slate-800">{formatText(item?.question || `Question ${index + 1}`)}</div>
                              {item?.answer && (
                                <p className="mt-2 text-slate-600">
                                  <span className="font-semibold text-slate-700">Answer:</span> {formatText(item.answer)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                </div>
              </ExpandableCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SubjectNotesPage;

import { ArrowLeft, BookMarked, BookOpenCheck, CheckCircle2, FileQuestion, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionToast } from "../../components/ActionToast";
import { ExpandableCard } from "../../components/ExpandableCard";
import type { PublishedStudentArtifact, StudentPublicationKind } from "../../types/student-content";
import { dedupePublishedStudentArtifacts } from "../../utils/studentArtifactDedup";

const AUTH_STORAGE_KEY = "lms:auth-session";
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}`;

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { id?: string; schoolId?: string; name?: string; role?: string; classId?: string; section?: string; assignedClasses?: string[] };
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

function getSubjectDisplayName(item: Pick<PublishedStudentArtifact, "subject" | "subjectName" | "subjectId">) {
  return item.subjectName || item.subject || item.subjectId || "General";
}

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function hasOptions(value: unknown): value is { question?: unknown; options: unknown[] } {
  return Array.isArray((value as { options?: unknown[] } | null | undefined)?.options) && (value as { options: unknown[] }).options.length > 0;
}

function formatAssessmentSubtypeLabel(value: unknown) {
  switch (String(value || "").trim()) {
    case "mcq":
      return "MCQ";
    case "veryShortAnswer":
      return "Very Short Answer";
    case "shortAnswer":
      return "Short Answer";
    case "longAnswer":
      return "Long Answer";
    case "caseStudy":
      return "Case Study";
    default:
      return formatText(value);
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-semibold text-slate-500">No published {title.toLowerCase()} yet.</p>
    </div>
  );
}

function kindIcon(kind: StudentPublicationKind) {
  switch (kind) {
    case "homework":
      return BookOpenCheck;
    case "assessments":
      return CheckCircle2;
    case "quizzes":
      return FileQuestion;
    case "notes":
      return BookMarked;
    default:
      return BookMarked;
  }
}

const subjectIcons: Record<string, string> = {
  Chemistry: "🧪",
  Physics: "⚛️",
  Biology: "🧬",
  Mathematics: "📐",
  English: "📚",
  Hindi: "📖",
  History: "🏛️",
  Geography: "🌍",
  "Computer Science": "💻",
  Economics: "📊",
};

function getSubjectIcon(subject: string) {
  return subjectIcons[subject] || "📘";
}

const subjectColors: Record<string, { bg: string; text: string }> = {
  Chemistry: { bg: "bg-amber-50", text: "text-amber-600" },
  Physics: { bg: "bg-indigo-50", text: "text-indigo-600" },
  Biology: { bg: "bg-emerald-50", text: "text-emerald-600" },
  Mathematics: { bg: "bg-blue-50", text: "text-blue-600" },
  English: { bg: "bg-rose-50", text: "text-rose-600" },
  Hindi: { bg: "bg-orange-50", text: "text-orange-600" },
  History: { bg: "bg-stone-50", text: "text-stone-600" },
  Geography: { bg: "bg-teal-50", text: "text-teal-600" },
  "Computer Science": { bg: "bg-cyan-50", text: "text-cyan-600" },
  Economics: { bg: "bg-violet-50", text: "text-violet-600" },
};

function getSubjectColor(subject: string) {
  return subjectColors[subject] || { bg: "bg-slate-50", text: "text-slate-600" };
}

function renderAssessmentContent(item: PublishedStudentArtifact) {
  if (!item.payload.assessment) return null;
  const asmt = item.payload.assessment;

  return (
    <div className="space-y-3">
      {!!asmt.assessmentMeta?.instructions?.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Assessment Instructions</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
            {asmt.assessmentMeta.instructions.map((instruction, index) => <li key={index}>{formatText(instruction)}</li>)}
          </ul>
        </div>
      )}
      {!!asmt.assessmentMeta?.requestedQuestionTypes?.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Requested Paper Pattern</div>
          <div className="mt-2 space-y-3 text-slate-600">
            {asmt.assessmentMeta.requestedQuestionTypes.map((entry, index) => (
              <div key={index}>
                {formatAssessmentSubtypeLabel(entry.label || entry.type)} • {formatText(entry.questionCount)} questions • {formatText(entry.marksEach)} marks each
              </div>
            ))}
          </div>
        </div>
      )}
      {!!asmt.blueprint?.learningOutcomeCoverage?.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Learning Outcome Coverage</div>
          <div className="mt-2 space-y-2 text-slate-600">
            {asmt.blueprint.learningOutcomeCoverage.map((entry, index) => (
              <div key={index}>
                <div className="font-medium text-slate-700">{formatText(entry.outcome)}</div>
                {!!entry.questionRefs?.length && <div className="text-xs text-slate-500">Questions: {entry.questionRefs.map((ref) => formatText(ref)).join(", ")}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {(asmt.blueprint?.difficultyDistribution || asmt.blueprint?.bloomsDistribution || asmt.blueprint?.questionDistribution) && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Blueprint Summary</div>
          <div className="mt-2 space-y-1 text-slate-600">
            {asmt.blueprint?.difficultyDistribution && (
              <div>Difficulty: {Object.entries(asmt.blueprint.difficultyDistribution).filter(([, value]) => value != null).map(([key, value]) => `${key} ${formatText(value)}%`).join(" • ")}</div>
            )}
            {asmt.blueprint?.bloomsDistribution && (
              <div>Bloom's: {Object.entries(asmt.blueprint.bloomsDistribution).filter(([, value]) => value != null).map(([key, value]) => `${key} ${formatText(value)}%`).join(" • ")}</div>
            )}
            {asmt.blueprint?.questionDistribution && (
              <div>Questions: {Object.entries(asmt.blueprint.questionDistribution).filter(([, value]) => value != null).map(([key, value]) => `${key} ${formatText(value)}`).join(" • ")}</div>
            )}
          </div>
        </div>
      )}
      {!!asmt.blueprint?.timeAllocation?.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Time Allocation</div>
          <div className="mt-2 space-y-1 text-slate-600">
            {asmt.blueprint.timeAllocation.map((entry, index) => (
              <div key={index}>{formatText(entry.section)} • {formatText(entry.minutes)} min</div>
            ))}
          </div>
        </div>
      )}
      {!!asArray(asmt.mcq).length && (
        <div>
          <div className="font-semibold text-slate-800">MCQ</div>
          <div className="mt-2 space-y-3">
            {asArray(asmt.mcq).map((question, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="font-semibold text-slate-800">{`Q${index + 1}. (${formatText(question.marks || 1)} mark)`}</div>
                {(question.questionSubtype || question.difficulty || question.bloomsLevel) && (
                  <div className="mt-1 text-xs text-slate-500">
                    {[question.questionSubtype ? formatAssessmentSubtypeLabel(question.questionSubtype) : "", question.difficulty ? `Difficulty: ${formatText(question.difficulty)}` : "", question.bloomsLevel ? `Bloom's: ${formatText(question.bloomsLevel)}` : ""].filter(Boolean).join(" • ")}
                  </div>
                )}
                <div className="mt-2 text-slate-700">{formatText(question.question)}</div>
                {!!asArray(question.options).length && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                    {asArray(question.options).map((option, optionIndex) => <li key={optionIndex}>{formatText(option)}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {!!asmt.shortAnswer?.length && (
        <div>
          <div className="font-semibold text-slate-800">Short Answer Questions</div>
          <div className="mt-2 space-y-3">
            {asmt.shortAnswer.map((question, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="font-semibold text-slate-800">{`Q${asArray(asmt.mcq).length + index + 1}. (${formatText(question.marks || 2)} marks)`}</div>
                {question.questionSubtype && <div className="mt-1 text-xs text-slate-500">{formatAssessmentSubtypeLabel(question.questionSubtype)}</div>}
                <div className="mt-2 text-slate-700">{formatText(question.question)}</div>
                {(question.difficulty || question.bloomsLevel || question.expectedLength) && (
                  <div className="mt-1 text-xs text-slate-500">
                    {[question.difficulty ? `Difficulty: ${formatText(question.difficulty)}` : "", question.bloomsLevel ? `Bloom's: ${formatText(question.bloomsLevel)}` : "", question.expectedLength ? `Expected depth: ${formatText(question.expectedLength)}` : ""].filter(Boolean).join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {!!asmt.longAnswer?.length && (
        <div>
          <div className="font-semibold text-slate-800">Long Answer Questions</div>
          <div className="mt-2 space-y-3">
            {asmt.longAnswer.map((question, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="font-semibold text-slate-800">{`Q${asArray(asmt.mcq).length + asArray(asmt.shortAnswer).length + index + 1}. (${formatText(question.marks || 5)} marks)`}</div>
                {question.questionSubtype && <div className="mt-1 text-xs text-slate-500">{formatAssessmentSubtypeLabel(question.questionSubtype)}</div>}
                <div className="mt-2 text-slate-700">{formatText(question.question)}</div>
                {(question.difficulty || question.bloomsLevel || question.expectedLength) && (
                  <div className="mt-1 text-xs text-slate-500">
                    {[question.difficulty ? `Difficulty: ${formatText(question.difficulty)}` : "", question.bloomsLevel ? `Bloom's: ${formatText(question.bloomsLevel)}` : "", question.expectedLength ? `Expected depth: ${formatText(question.expectedLength)}` : ""].filter(Boolean).join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderHomeworkContent(item: PublishedStudentArtifact) {
  if (!item.payload.homework) return null;

  return (
    <>
      {item.payload.homework.task && <p className="leading-7">{formatText(item.payload.homework.task)}</p>}
      {!!item.payload.homework.homework?.length && (
        <div className="space-y-3">
          {item.payload.homework.homework.map((task) => (
            <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="font-semibold text-slate-800">{formatText(task.title || task.question || `Task ${task.id}`)}</div>
              {task.instructions && <p className="mt-1 text-slate-600">{formatText(task.instructions)}</p>}
              {task.question && <p className="mt-2 text-slate-700">{formatText(task.question)}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function renderNotesContent(item: PublishedStudentArtifact) {
  const notes = item.payload.studentLessonNotes;
  if (!notes) return null;

  const sections = asArray(notes.sections);
  const keyTerms = asArray(notes.keyTerms);
  const summary = asArray(notes.summary);
  const quickRevision = asArray(notes.quickRevision);
  const rememberPoints = asArray(notes.rememberPoints);
  const selfCheckQuestions = asArray(notes.selfCheckQuestions);

  return (
    <div className="space-y-4">
      {notes.title && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">{formatText(notes.title)}</div>
          {notes.sessionOverview && <p className="mt-2 text-slate-600">{formatText(notes.sessionOverview)}</p>}
          {notes.introduction && <p className="mt-2 text-slate-700">{formatText(notes.introduction)}</p>}
        </div>
      )}

      {!!keyTerms.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Key Terms</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
            {keyTerms.map((term, index) => <li key={index}>{formatText(term)}</li>)}
          </ul>
        </div>
      )}

      {!!sections.length && (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <div className="font-semibold text-slate-800">{formatText(section.heading)}</div>
              {section.explanation && <p className="mt-2 text-slate-700">{formatText(section.explanation)}</p>}
              {!!asArray(section.keyPoints).length && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                  {asArray(section.keyPoints).map((point, pointIndex) => <li key={pointIndex}>{formatText(point)}</li>)}
                </ul>
              )}
              {!!asArray(section.examples).length && (
                <div className="mt-3">
                  <div className="font-medium text-slate-700">Examples</div>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600">
                    {asArray(section.examples).map((example, exampleIndex) => <li key={exampleIndex}>{formatText(example)}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!!summary.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Summary</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
            {summary.map((item, index) => <li key={index}>{formatText(item)}</li>)}
          </ul>
        </div>
      )}

      {!!quickRevision.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Quick Revision</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
            {quickRevision.map((item, index) => <li key={index}>{formatText(item)}</li>)}
          </ul>
        </div>
      )}

      {!!rememberPoints.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Remember Points</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
            {rememberPoints.map((item, index) => <li key={index}>{formatText(item)}</li>)}
          </ul>
        </div>
      )}

      {!!selfCheckQuestions.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="font-semibold text-slate-800">Self Check</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
            {selfCheckQuestions.map((question, index) => <li key={index}>{formatText(question)}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function SubmissionPanel({
  item,
  kind,
  submittingId,
  submittedIds,
  onSubmit,
}: {
  item: PublishedStudentArtifact;
  kind: StudentPublicationKind;
  submittingId: string | null;
  submittedIds: Record<string, boolean>;
  onSubmit: (itemId: string, title: string, file: File | null, metadata?: { classId?: string; className?: string; gradeLevel?: string; teacherId?: string; subject?: string; sessionId?: string }) => Promise<void>;
}) {
  if (kind === "notes" || kind === "quizzes") return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-bold text-slate-800">
            {submittedIds[item.id] ? "Submitted" : kind === "assessments" ? "Submit your answer sheet" : "Submit your work"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {submittedIds[item.id]
              ? "Your submission is locked. If you need to submit again, ask the teacher to delete it from Student Action."
              : "Choose a file and submit it so your teacher can review it."}
          </div>
        </div>
        {submittedIds[item.id] ? (
          <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm">
            Submitted
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                void onSubmit(item.id, item.sessionTitle, file, {
                  classId: item.classId,
                  className: item.className,
                  gradeLevel: item.gradeLevel,
                  teacherId: item.teacherId,
                  subject: item.subject,
                  sessionId: item.sessionId,
                });
                event.currentTarget.value = "";
              }}
            />
            {submittingId === item.id ? "Submitting..." : "Submit File"}
          </label>
        )}
      </div>
    </div>
  );
}

export function StudentPublishedContentPage({
  kind,
  title,
  description,
}: {
  kind: StudentPublicationKind;
  title: string;
  description: string;
}) {
  const session = useMemo(() => getSession(), []);
  const Icon = kindIcon(kind);
  const [backendItems, setBackendItems] = useState<PublishedStudentArtifact[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submittedIds, setSubmittedIds] = useState<Record<string, boolean>>({});
  const [popupMessage, setPopupMessage] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.id || !session?.schoolId || (kind !== "homework" && kind !== "assessments" && kind !== "notes")) {
      setBackendItems([]);
      return;
    }

    let cancelled = false;

    const loadPublishedItems = async () => {
      try {
        const endpoint =
          kind === "notes"
            ? `${BACKEND_URL}/api/student/notes?userId=${encodeURIComponent(session.id)}&schoolId=${encodeURIComponent(session.schoolId)}`
            : `${BACKEND_URL}/api/student/published-content?userId=${encodeURIComponent(session.id)}&schoolId=${encodeURIComponent(session.schoolId)}&kind=${encodeURIComponent(kind)}`;
        const response = await fetch(endpoint, kind === "notes" ? { cache: "no-store" } : undefined);
        if (!response.ok) {
          throw new Error(`Failed to load published content (HTTP ${response.status})`);
        }
        const data = await response.json().catch(() => null);
        if (!cancelled) {
          setBackendItems(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setBackendItems([]);
        }
      }
    };

    void loadPublishedItems();

    return () => {
      cancelled = true;
    };
  }, [kind, session]);

  const items = useMemo(
    () =>
      dedupePublishedStudentArtifacts(backendItems)
        .slice()
        .sort((left, right) => left.sessionNumber - right.sessionNumber),
    [backendItems],
  );

  useEffect(() => {
    if (!session?.id || !session?.schoolId || (kind !== "homework" && kind !== "assessments")) {
      setSubmittedIds({});
      return;
    }

    let cancelled = false;

    const loadSubmittedIds = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/student/submissions?userId=${encodeURIComponent(session.id)}&schoolId=${encodeURIComponent(session.schoolId || "")}&kind=${encodeURIComponent(kind)}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load submissions (HTTP ${response.status})`);
        }
        const data = await response.json().catch(() => null);
        if (cancelled) {
          return;
        }

        const nextSubmittedIds = Object.fromEntries(
          (Array.isArray(data?.submissions) ? data.submissions : [])
            .map((item: { itemId?: unknown }) => String(item?.itemId || "").trim())
            .filter(Boolean)
            .map((itemId: string) => [itemId, true]),
        ) as Record<string, boolean>;

        setSubmittedIds(nextSubmittedIds);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      }
    };

    void loadSubmittedIds();

    return () => {
      cancelled = true;
    };
  }, [kind, session]);

  const handleSubmit = async (
    itemId: string,
    itemTitle: string,
    file: File | null,
    metadata?: { classId?: string; className?: string; gradeLevel?: string; teacherId?: string; subject?: string; sessionId?: string },
  ) => {
    if (!session?.id || !file || submittedIds[itemId]) {
      return;
    }

    const endpoint =
      kind === "homework"
        ? `/api/student/homework/${encodeURIComponent(itemId)}/submit`
        : `/api/student/assessments/${encodeURIComponent(itemId)}/attempt`;

    setSubmittingId(itemId);
    try {
      const fileDataUrl = await readFileAsDataUrl(file);
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: session.schoolId || "",
          studentId: session.id,
          classId: metadata?.classId || metadata?.className || metadata?.gradeLevel || session.classId || session.assignedClasses?.[0] || "",
          teacherId: metadata?.teacherId || "",
          subjectId: metadata?.subject || "",
          subject: metadata?.subject || "",
          sessionId: metadata?.sessionId || "",
          title: itemTitle,
          fileName: file.name,
          mimeType: file.type,
          fileDataUrl,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to submit (HTTP ${response.status})`);
      }
      setSubmittedIds((current) => ({ ...current, [itemId]: true }));
      setPopupMessage(`${itemTitle} submitted successfully.`);
    } catch (error) {
      console.error(error);
      setPopupMessage(error instanceof Error ? error.message : "Failed to submit.");
    } finally {
      setSubmittingId(null);
    }
  };

  const groupedItems = useMemo(() => {
    const grouped = new Map<string, PublishedStudentArtifact[]>();
    for (const item of items) {
      const subject = getSubjectDisplayName(item);
      if (!grouped.has(subject)) {
        grouped.set(subject, []);
      }
      grouped.get(subject)!.push(item);
    }

    return Array.from(grouped.entries())
      .map(([subject, subjectItems]) => ({
        subject,
        items: subjectItems.sort((left, right) => left.sessionNumber - right.sessionNumber),
      }))
      .sort((left, right) => left.subject.localeCompare(right.subject));
  }, [items]);

  const filteredGroups = useMemo(() => {
    const queryValue = query.trim().toLowerCase();
    if (!queryValue) return groupedItems;

    return groupedItems
      .map((group) => {
        const matchingItems = group.items.filter((item) =>
          [group.subject, item.sessionTitle, item.className, item.gradeLevel, getSubjectDisplayName(item)]
            .map((value) => formatText(value).toLowerCase())
            .some((value) => value.includes(queryValue)),
        );
        return { subject: group.subject, items: matchingItems };
      })
      .filter((group) => group.items.length > 0 || group.subject.toLowerCase().includes(queryValue));
  }, [groupedItems, query]);

  const selectedGroup = useMemo(
    () => groupedItems.find((group) => group.subject === selectedSubject) || null,
    [groupedItems, selectedSubject],
  );

  const subjectCount = groupedItems.length;
  const contentCount = items.length;

  return (
    <div className="space-y-6">
      <ActionToast open={Boolean(popupMessage)} message={popupMessage} onClose={() => setPopupMessage("")} />

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">{selectedGroup ? selectedGroup.subject : title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedGroup ? `${selectedGroup.items.length} ${selectedGroup.items.length === 1 ? title.slice(0, -1).toLowerCase() : title.toLowerCase()} · ${session?.classId || "Your class"}${session?.section ? ` · ${session.section}` : ""}` : description}
            </p>
            {!selectedGroup && contentCount > 0 && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {subjectCount} {subjectCount === 1 ? "subject" : "subjects"} • {contentCount} {contentCount === 1 ? "item" : "items"}
              </p>
            )}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title={title} />
      ) : selectedGroup ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedSubject(null)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to subjects
          </button>
          {selectedGroup.items.map((item) => {
            const isExpanded = expandedItemId === item.id;
            return (
              <ExpandableCard
                key={item.id}
                id={item.id}
                isExpanded={isExpanded}
                onToggle={(id) => setExpandedItemId(isExpanded ? null : id)}
                icon={<BookOpenCheck className="h-5 w-5" />}
                header={
                  <>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#36ADAA]">
                      {formatSessionLabel(item.sessionNumber)}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-extrabold text-slate-900">
                      {item.sessionTitle}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {[getSubjectDisplayName(item), item.gradeLevel].filter(Boolean).join(" | ") || "Published by teacher"} · {formatSessionLabel(item.sessionNumber)} · Published {new Date(item.publishedAt).toLocaleString()}
                    </p>
                  </>
                }
              >
                <div className="space-y-4 text-sm text-slate-700">
                  {kind === "homework" ? renderHomeworkContent(item) : null}
                  {kind === "notes" ? renderNotesContent(item) : null}
                  {kind === "assessments" ? renderAssessmentContent(item) : null}
                  {kind === "quizzes" && item.payload.assessment?.mcq?.length ? (
                    <div className="space-y-3">
                      {asArray(item.payload.assessment.mcq).filter((question) => hasOptions(question)).map((question, index) => (
                        <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="font-semibold text-slate-800">{`Q${index + 1}. ${formatText(question.question)}`}</div>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                            {asArray(question.options).map((option, optionIndex) => <li key={optionIndex}>{formatText(option)}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <SubmissionPanel
                    item={item}
                    kind={kind}
                    submittingId={submittingId}
                    submittedIds={submittedIds}
                    onSubmit={handleSubmit}
                  />
                </div>
              </ExpandableCard>
            );
          })}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search subjects or ${title.toLowerCase()}...`}
              className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#36ADAA] focus:outline-none"
            />
          </div>

          {filteredGroups.length === 0 ? (
            <div className="rounded-[30px] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <Icon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-lg font-bold text-slate-800">No subjects match your search</p>
              <p className="mt-2 text-sm text-slate-500">Try a different subject or session keyword.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredGroups.map((group) => {
                const color = getSubjectColor(group.subject);
                const icon = getSubjectIcon(group.subject);
                const latestItem = group.items[group.items.length - 1];

                return (
                  <button
                    key={group.subject}
                    type="button"
                    onClick={() => setSelectedSubject(group.subject)}
                    className="rounded-[30px] border border-white/80 bg-white/90 p-5 text-left shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition-all hover:scale-[1.01] hover:border-[#36ADAA]/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${color.bg}`}>
                        {icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-base font-extrabold text-slate-900">
                          {group.subject}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {group.items.length} {group.items.length === 1 ? title.slice(0, -1).toLowerCase() : title.toLowerCase()}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {session?.classId || "Your class"}
                          {session?.section ? ` · ${session.section}` : ""}
                        </p>
                      </div>
                    </div>

                    {latestItem ? (
                      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#36ADAA]">
                              {formatSessionLabel(latestItem.sessionNumber)}
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
                              {latestItem.sessionTitle}
                            </p>
                          </div>
                          <div className="ml-3 shrink-0 text-right">
                            <p className="text-[10px] font-semibold uppercase text-slate-400">
                              Published
                            </p>
                            <p className="text-[11px] font-semibold text-slate-500">
                              {new Date(latestItem.publishedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-500">
                          Published content for this subject will appear here once your teacher publishes it.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BookOpenCheck className="h-3.5 w-3.5 text-[#36ADAA]" />
                        <span className="text-[11px] font-semibold text-[#36ADAA]">
                          View {title.toLowerCase()}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Click to open
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

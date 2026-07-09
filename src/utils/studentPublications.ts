import type { SessionPlan } from "../types";
import type { PublishedStudentArtifact, StudentPublicationKind } from "../types/student-content";

const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}`;

const AUTH_STORAGE_KEY = "lms:auth-session";

type StudentPublicationFlags = Partial<Record<StudentPublicationKind, boolean>>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getAuthSession() {
  return readJson<{
    id?: string;
    schoolId?: string;
    name?: string;
    classId?: string;
    section?: string;
    assignedClasses?: string[];
  } | null>(AUTH_STORAGE_KEY, null);
}

function normalizeArtifactIdentityPart(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildPublishedArtifactId(input: {
  kind: StudentPublicationKind;
  session: SessionPlan;
  teacherId?: string;
  classId?: string;
  subject?: string;
  gradeLevel?: string;
}) {
  const sessionIdentity = normalizeArtifactIdentityPart(
    input.session.id || `session-${input.session.sessionNumber || 0}`,
  ) || `session-${Number(input.session.sessionNumber || 0)}`;
  const teacherIdentity = normalizeArtifactIdentityPart(input.teacherId) || "teacher";
  const classIdentity = normalizeArtifactIdentityPart(input.classId || input.gradeLevel) || "class";
  const subjectIdentity = normalizeArtifactIdentityPart(input.subject) || "subject";
  return `${input.kind}-${teacherIdentity}-${classIdentity}-${subjectIdentity}-${sessionIdentity}`;
}

function normalizeAssessmentPayload(assessment: any) {
  if (!assessment || typeof assessment !== "object") return assessment;

  const paperQuestions = Array.isArray(assessment?.paper?.questions) ? assessment.paper.questions : [];
  const normalizedQuestions = paperQuestions.map((question: any, index: number) => ({
    question: question?.prompt,
    options: Array.isArray(question?.options) ? question.options : [],
    marks: question?.marks,
    questionSubtype: question?.subtype || question?.type,
    difficulty: question?.difficulty,
    bloomsLevel: question?.bloomsLevel,
    expectedLength: question?.expectedLength,
  }));

  const mcq = normalizedQuestions.filter((question: any) => String(question?.questionSubtype || "").trim().toLowerCase() === "mcq");
  const shortAnswer = normalizedQuestions.filter((question: any) => {
    const subtype = String(question?.questionSubtype || "").trim().toLowerCase();
    return subtype === "shortanswer" || subtype === "veryshortanswer";
  });
  const longAnswer = normalizedQuestions.filter((question: any) => {
    const subtype = String(question?.questionSubtype || "").trim().toLowerCase();
    return subtype === "longanswer" || subtype === "casestudy";
  });

  return {
    ...assessment,
    assessmentMeta: assessment.assessmentMeta || assessment.meta || {},
    mcq: Array.isArray(assessment?.mcq) && assessment.mcq.length > 0 ? assessment.mcq : mcq,
    shortAnswer: Array.isArray(assessment?.shortAnswer) && assessment.shortAnswer.length > 0 ? assessment.shortAnswer : shortAnswer,
    longAnswer: Array.isArray(assessment?.longAnswer) && assessment.longAnswer.length > 0 ? assessment.longAnswer : longAnswer,
  };
}

function normalizeStudentArtifactPayload(kind: StudentPublicationKind, payload: Partial<SessionPlan>) {
  if (kind === "assessments" || kind === "quizzes") {
    return {
      ...payload,
      assessment: normalizeAssessmentPayload((payload as any)?.assessment),
    };
  }
  return payload;
}

export function getStudentPublicationKey(session: { id?: string; sessionNumber?: number } | number, sessionId?: string) {
  if (typeof session === "number") {
    return sessionId ? `${sessionId}` : `session-number:${session}`;
  }

  const resolvedSessionId = String(session.id || sessionId || "").trim();
  if (resolvedSessionId) {
    return resolvedSessionId;
  }

  return `session-number:${Number(session.sessionNumber || 0)}`;
}

export async function readPublishedStudentArtifacts(): Promise<PublishedStudentArtifact[]> {
  try {
    const authSession = getAuthSession();
    const schoolId = authSession?.schoolId || "";
    const userId = authSession?.id || "";

    if (!schoolId || !userId) {
      return [];
    }

    const response = await fetch(
      `${BACKEND_URL}/api/student/published-content?schoolId=${encodeURIComponent(schoolId)}&userId=${encodeURIComponent(userId)}`,
      { credentials: "include" }
    );

    if (!response.ok) {
      console.warn("[StudentPublications] API fetch failed, falling back to empty array.");
      return [];
    }

    const data = await response.json();
    return Array.isArray(data?.items) ? data.items : [];
  } catch (error) {
    console.error("[StudentPublications] Failed to fetch published artifacts:", error);
    return [];
  }
}

export async function writePublishedStudentArtifacts(value: PublishedStudentArtifact[]): Promise<void> {
  // This function is kept for backward compatibility.
  // Published artifacts are now managed through the backend API.
  // Individual upserts should use upsertPublishedStudentArtifact instead.
  console.warn("[StudentPublications] writePublishedStudentArtifacts is deprecated. Use upsertPublishedStudentArtifact instead.");
}

export async function upsertPublishedStudentArtifact(artifact: PublishedStudentArtifact): Promise<void> {
  try {
    const authSession = getAuthSession();
    const schoolId = authSession?.schoolId || "";

    if (!schoolId) {
      console.warn("[StudentPublications] Cannot upsert: no schoolId available.");
      return;
    }

    // The backend PATCH endpoint updates publication flags in the workspace.
    // We need to find the workspace for this artifact and update the publication state.
    const response = await fetch(`${BACKEND_URL}/api/student/published-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        schoolId,
        artifact,
      }),
    });

    if (!response.ok) {
      console.warn("[StudentPublications] Failed to upsert artifact via API.");
    }
  } catch (error) {
    console.error("[StudentPublications] Failed to upsert published artifact:", error);
  }
}

export async function removePublishedStudentArtifact(sessionNumber: number, kind: StudentPublicationKind, sessionId?: string): Promise<void> {
  try {
    const authSession = getAuthSession();
    const schoolId = authSession?.schoolId || "";

    if (!schoolId) {
      return;
    }

    const response = await fetch(`${BACKEND_URL}/api/student/published-content/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        schoolId,
        sessionNumber,
        kind,
        sessionId,
      }),
    });

    if (!response.ok) {
      console.warn("[StudentPublications] Failed to remove artifact via API.");
    }
  } catch (error) {
    console.error("[StudentPublications] Failed to remove published artifact:", error);
  }
}

export async function getPublishedArtifactsByKind(kind: StudentPublicationKind): Promise<PublishedStudentArtifact[]> {
  const artifacts = await readPublishedStudentArtifacts();
  return artifacts.filter((item) => item.kind === kind && artifactHasContentForKind(item));
}

export function buildPublishedArtifact(
  kind: StudentPublicationKind,
  session: SessionPlan,
  subject?: string,
  gradeLevel?: string,
  options?: {
    schoolId?: string;
    classId?: string;
    className?: string;
    section?: string;
  },
): PublishedStudentArtifact | null {
  const authSession = getAuthSession();
  const resolvedClassId = String(options?.classId || options?.className || gradeLevel || "").trim();
  const resolvedClassName = String(options?.className || options?.classId || gradeLevel || "").trim();
  const base = {
    id: buildPublishedArtifactId({
      kind,
      session,
      teacherId: authSession?.id || "",
      classId: resolvedClassId,
      subject,
      gradeLevel,
    }),
    schoolId: String(options?.schoolId || authSession?.schoolId || "").trim(),
    kind,
    sessionId: session.id,
    sessionNumber: session.sessionNumber,
    sessionTitle: session.title,
    teacherId: authSession?.id || "",
    teacherName: authSession?.name || "",
    classId: resolvedClassId,
    className: resolvedClassName,
    section: String(options?.section || authSession?.section || "").trim(),
    duration: session.duration,
    subject,
    gradeLevel,
    publishedAt: new Date().toISOString(),
  };

  switch (kind) {
    case "homework":
      return session.homework ? { ...base, payload: { homework: session.homework } } : null;
    case "assignments":
      return null;
    case "assessments":
      return session.assessment ? { ...base, payload: normalizeStudentArtifactPayload("assessments", { assessment: session.assessment }) } : null;
    case "quizzes":
      return normalizeAssessmentPayload(session.assessment)?.mcq?.length
        ? {
            ...base,
            payload: normalizeStudentArtifactPayload("quizzes", {
              assessment: normalizeAssessmentPayload(session.assessment),
            }),
          }
        : null;
    case "notes":
      return session.studentLessonNotes
        ? {
            ...base,
            payload: {
              studentLessonNotes: session.studentLessonNotes,
            },
          }
        : null;
    default:
      return null;
  }
}

export function artifactHasContentForKind(artifact: PublishedStudentArtifact) {
  switch (artifact.kind) {
    case "homework":
      return Boolean(artifact.payload.homework);
    case "assignments":
      return false;
    case "assessments":
      return Boolean(
        artifact.payload.assessment?.mcq?.length ||
        artifact.payload.assessment?.shortAnswer?.length ||
        artifact.payload.assessment?.longAnswer?.length ||
        artifact.payload.assessment?.paper?.questions?.length,
      );
    case "quizzes":
      return Boolean(
        artifact.payload.assessment?.mcq?.length ||
        artifact.payload.assessment?.paper?.questions?.some((question: any) => String(question?.type || "").trim().toLowerCase() === "mcq"),
      );
    case "notes":
      return Boolean(artifact.payload.studentLessonNotes);
    default:
      return false;
  }
}

function getCompositeArtifactKey(item: { kind: string; sessionId?: string; sessionNumber: number; subject?: string; classId?: string; className?: string; gradeLevel?: string }): string {
  const normKind = String(item.kind || "").trim().toLowerCase();
  const normSession = String(item.sessionId || "").trim() || `${item.sessionNumber}`;
  const normSubject = String(item.subject || "").trim().toLowerCase();
  const normClass = String(item.classId || item.className || item.gradeLevel || "").trim().toLowerCase();
  return `${normKind}:${normSession}:${normSubject}:${normClass}`;
}

export async function hasPublishedStudentArtifact(sessionNumber: number, kind: StudentPublicationKind, sessionId?: string): Promise<boolean> {
  const artifacts = await readPublishedStudentArtifacts();
  return artifacts.some((item) => {
    if (item.kind !== kind) {
      return false;
    }
    if (sessionId) {
      return item.sessionId === sessionId;
    }
    return item.sessionNumber === sessionNumber;
  });
}

export async function getPublishedStudentArtifact(sessionNumber: number, kind: StudentPublicationKind, sessionId?: string): Promise<PublishedStudentArtifact | null> {
  const artifacts = await readPublishedStudentArtifacts();
  return artifacts.find((item) => {
    if (item.kind !== kind) {
      return false;
    }
    if (sessionId) {
      return item.sessionId === sessionId;
    }
    return item.sessionNumber === sessionNumber;
  }) || null;
}

export async function removePublishedArtifactsForCurriculumScope(scope: {
  subject?: string;
  gradeLevel?: string;
  classId?: string;
}): Promise<void> {
  try {
    const authSession = getAuthSession();
    const schoolId = authSession?.schoolId || "";

    if (!schoolId) {
      return;
    }

    const response = await fetch(`${BACKEND_URL}/api/student/published-content/remove-scope`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        schoolId,
        scope,
      }),
    });

    if (!response.ok) {
      console.warn("[StudentPublications] Failed to remove artifacts by scope via API.");
    }
  } catch (error) {
    console.error("[StudentPublications] Failed to remove published artifacts by scope:", error);
  }
}

export function readStudentPublicationFlags() {
  return readJson<Record<string, StudentPublicationFlags>>("lms:student-publications", {});
}

export function writeStudentPublicationFlags(value: Record<string, StudentPublicationFlags>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("lms:student-publications", JSON.stringify(value));
  } catch {
    // Ignore storage failures
  }
}

export function publishedArtifactMatchesStudent(
  artifact: PublishedStudentArtifact,
  student?: {
    schoolId?: string;
    classId?: string;
    section?: string;
    assignedClasses?: string[];
  } | null,
) {
  const studentSchoolId = String(student?.schoolId || "").trim();
  const artifactSchoolId = String(artifact.schoolId || "").trim();
  if (!artifactSchoolId) {
    return false;
  }
  if (studentSchoolId && artifactSchoolId !== studentSchoolId) {
    return false;
  }

  const studentClassAliases = Array.from(
    new Set([...(student?.assignedClasses || []), student?.classId || ""].map((value) => String(value || "").trim()).filter(Boolean)),
  );

  if (studentClassAliases.length === 0) {
    return false;
  }

  const artifactClassAliases = [artifact.classId, artifact.className, artifact.gradeLevel]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (artifactClassAliases.length === 0) {
    return false;
  }

  const classMatches = artifactClassAliases.some((artifactClass) =>
    studentClassAliases.some((studentClass) => classValuesOverlap(artifactClass, studentClass)),
  );
  if (!classMatches) {
    return false;
  }

  const studentSection = extractSectionToken(student?.section || "");
  const artifactSection = extractSectionToken(artifact.section || artifact.className || artifact.classId || "");
  if (studentSection && artifactSection && studentSection !== artifactSection) {
    return false;
  }

  return true;
}

export async function getPublishedArtifactsForStudent(
  kind: StudentPublicationKind,
  student?: {
    classId?: string;
    assignedClasses?: string[];
  } | null,
): Promise<PublishedStudentArtifact[]> {
  const artifacts = await getPublishedArtifactsByKind(kind);
  return artifacts.filter((artifact) => publishedArtifactMatchesStudent(artifact, student));
}

function normalizeText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeRomanNumeral(value: string) {
  const romanToNumber: Record<string, string> = {
    i: "1",
    ii: "2",
    iii: "3",
    iv: "4",
    v: "5",
    vi: "6",
    vii: "7",
    viii: "8",
    ix: "9",
    x: "10",
    xi: "11",
    xii: "12",
  };

  return romanToNumber[value] || value;
}

function extractClassToken(value: unknown) {
  const normalized = normalizeText(value)
    .replace(/\bclass\b/g, " ")
    .replace(/\bgrade\b/g, " ")
    .replace(/\bstd\b/g, " ")
    .replace(/\bstandard\b/g, " ")
    .replace(/\bsection\b\s*[a-z0-9]+\b/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalized.split(" ").filter(Boolean);
  for (const token of tokens) {
    const normalizedToken = normalizeRomanNumeral(token);
    if (/^\d+$/.test(normalizedToken)) {
      return normalizedToken;
    }
  }

  return "";
}

function extractSectionToken(value: unknown) {
  const normalized = normalizeText(value);
  const match = normalized.match(/\bsection\b\s*([a-z0-9]+)/i) || normalized.match(/-\s*([a-z])$/i);
  return match?.[1] || "";
}

function classValuesOverlap(left: unknown, right: unknown) {
  const leftText = normalizeText(left);
  const rightText = normalizeText(right);
  if (!leftText || !rightText) {
    return false;
  }

  const leftClass = extractClassToken(leftText);
  const rightClass = extractClassToken(rightText);
  if (leftClass && rightClass) {
    if (leftClass !== rightClass) {
      return false;
    }

    const leftSection = extractSectionToken(leftText);
    const rightSection = extractSectionToken(rightText);
    if (leftSection && rightSection) {
      return leftSection === rightSection;
    }
    return true;
  }

  const leftFlat = leftText.replace(/[^a-z0-9]/g, "");
  const rightFlat = rightText.replace(/[^a-z0-9]/g, "");
  return leftFlat === rightFlat || leftFlat.includes(rightFlat) || rightFlat.includes(leftFlat);
}
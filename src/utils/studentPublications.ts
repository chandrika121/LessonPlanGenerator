import type { SessionPlan } from "../types";
import type { PublishedStudentArtifact, StudentPublicationKind } from "../types/student-content";

export const STUDENT_PUBLICATIONS_KEY = "lms:student-publications";
export const STUDENT_PUBLISHED_ARTIFACTS_KEY = "lms:student-published-artifacts";
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

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep the UI usable.
  }
}

export function readStudentPublicationFlags() {
  return readJson<Record<string, StudentPublicationFlags>>(STUDENT_PUBLICATIONS_KEY, {});
}

export function writeStudentPublicationFlags(value: Record<string, StudentPublicationFlags>) {
  writeJson(STUDENT_PUBLICATIONS_KEY, value);
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

export function readPublishedStudentArtifacts() {
  const rawArtifacts = readJson<PublishedStudentArtifact[]>(STUDENT_PUBLISHED_ARTIFACTS_KEY, []);
  const authSession = getAuthSession();
  let changed = false;
  const deduped = new Map<string, PublishedStudentArtifact>();

  rawArtifacts.forEach((artifact) => {
    const schoolId = String(artifact?.schoolId || authSession?.schoolId || "").trim();
    const classId = String(artifact?.classId || artifact?.className || artifact?.gradeLevel || "").trim();
    if (!schoolId || !classId) {
      changed = true;
      return;
    }

    const upgraded = ensurePublishedArtifactIdentity({
      ...artifact,
      schoolId,
      classId,
      className: String(artifact?.className || artifact?.classId || artifact?.gradeLevel || "").trim(),
      gradeLevel: String(artifact?.gradeLevel || artifact?.className || artifact?.classId || "").trim(),
      section: String(artifact?.section || authSession?.section || "").trim(),
      subject: String(artifact?.subject || "").trim(),
    });
    if (upgraded.id !== artifact.id) {
      changed = true;
    }
    // Use composite key for deduplication to handle ID instability
    const compositeKey = getCompositeArtifactKey(upgraded);
    const existing = deduped.get(compositeKey);
    if (!existing || new Date(upgraded.publishedAt) > new Date(existing.publishedAt)) {
      deduped.set(compositeKey, upgraded);
    }
  });

  const normalizedArtifacts = Array.from(deduped.values()).sort((a, b) => a.sessionNumber - b.sessionNumber);
  if (changed || normalizedArtifacts.length !== rawArtifacts.length) {
    writeJson(STUDENT_PUBLISHED_ARTIFACTS_KEY, normalizedArtifacts);
  }
  return normalizedArtifacts;
}

export function writePublishedStudentArtifacts(value: PublishedStudentArtifact[]) {
  writeJson(STUDENT_PUBLISHED_ARTIFACTS_KEY, value);
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

function ensurePublishedArtifactIdentity(artifact: PublishedStudentArtifact): PublishedStudentArtifact {
  const nextId = buildPublishedArtifactId({
    kind: artifact.kind,
    session: {
      id: artifact.sessionId,
      sessionNumber: artifact.sessionNumber,
      title: artifact.sessionTitle,
      duration: Number(artifact.duration || 0),
    } as SessionPlan,
    teacherId: artifact.teacherId || "",
    classId: artifact.classId || artifact.className || "",
    subject: artifact.subject || "",
    gradeLevel: artifact.gradeLevel || "",
  });

  if (artifact.id === nextId) {
    return artifact;
  }

  return {
    ...artifact,
    id: nextId,
    payload: normalizeStudentArtifactPayload(artifact.kind, artifact.payload),
  };
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

export function upsertPublishedStudentArtifact(artifact: PublishedStudentArtifact) {
  const current = readPublishedStudentArtifacts();
  const compositeKey = getCompositeArtifactKey(artifact);
  const next = [
    ...current.filter((item) => getCompositeArtifactKey(item) !== compositeKey),
    artifact,
  ].sort((a, b) => a.sessionNumber - b.sessionNumber);
  writePublishedStudentArtifacts(next);
}

export function removePublishedStudentArtifact(sessionNumber: number, kind: StudentPublicationKind, sessionId?: string) {
  const current = readPublishedStudentArtifacts();
  writePublishedStudentArtifacts(
    current.filter((item) => {
      if (item.kind !== kind) {
        return true;
      }
      if (sessionId) {
        return item.sessionId !== sessionId;
      }
      return item.sessionNumber !== sessionNumber;
    }),
  );
}

export function getPublishedArtifactsByKind(kind: StudentPublicationKind) {
  return readPublishedStudentArtifacts().filter((item) => item.kind === kind && artifactHasContentForKind(item));
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

export function getPublishedArtifactsForStudent(
  kind: StudentPublicationKind,
  student?: {
    classId?: string;
    assignedClasses?: string[];
  } | null,
) {
  return getPublishedArtifactsByKind(kind).filter((artifact) => publishedArtifactMatchesStudent(artifact, student));
}

export function removePublishedArtifactsForCurriculumScope(scope: {
  subject?: string;
  gradeLevel?: string;
  classId?: string;
}) {
  const subject = normalizeText(scope.subject);
  const classCandidates = [scope.classId, scope.gradeLevel]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!subject && classCandidates.length === 0) {
    return;
  }

  const current = readPublishedStudentArtifacts();
  const next = current.filter((artifact) => {
    const subjectMatches = subject ? normalizeText(artifact.subject) === subject : true;
    const classMatches = classCandidates.length > 0
      ? classCandidates.some((candidate) =>
          [artifact.classId, artifact.className, artifact.gradeLevel]
            .map((value) => String(value || "").trim())
            .filter(Boolean)
            .some((artifactClass) => classValuesOverlap(artifactClass, candidate))
        )
      : true;

    return !(subjectMatches && classMatches);
  });

  if (next.length !== current.length) {
    writePublishedStudentArtifacts(next);
  }
}

export function hasPublishedStudentArtifact(sessionNumber: number, kind: StudentPublicationKind, sessionId?: string) {
  return readPublishedStudentArtifacts().some((item) => {
    if (item.kind !== kind) {
      return false;
    }
    if (sessionId) {
      return item.sessionId === sessionId;
    }
    return item.sessionNumber === sessionNumber;
  });
}

export function getPublishedStudentArtifact(sessionNumber: number, kind: StudentPublicationKind, sessionId?: string) {
  return readPublishedStudentArtifacts().find((item) => {
    if (item.kind !== kind) {
      return false;
    }
    if (sessionId) {
      return item.sessionId === sessionId;
    }
    return item.sessionNumber === sessionNumber;
  }) || null;
}

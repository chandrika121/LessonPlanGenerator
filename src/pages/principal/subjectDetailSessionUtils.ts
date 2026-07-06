export type PrincipalSubjectSessionOption = {
  sessionId: string;
  sessionNumber: number;
  title: string;
};

export type PrincipalSubjectStudentRow = {
  sessionId?: string;
  sessionIds?: string[];
};

// Compatibility export for use in component
export type { PrincipalSubjectStudentRow as StudentRow };

export function buildSessionOptions(sessions: Array<{ sessionId?: string; sessionNumber?: number; title?: string }> | undefined) {
  const normalized = (sessions || [])
    .filter((session) => typeof session?.sessionId === "string" && typeof session?.title === "string")
    .map((session) => ({
      sessionId: session.sessionId as string,
      sessionNumber: Number(session.sessionNumber || 0),
      title: session.title as string,
    }))
    .filter((session) => session.sessionId.trim().length > 0);

  const deduped = new Map<string, PrincipalSubjectSessionOption>();
  normalized.forEach((session) => {
    const existing = deduped.get(session.sessionId);
    if (!existing || session.sessionNumber < existing.sessionNumber) {
      deduped.set(session.sessionId, session);
    }
  });

  return Array.from(deduped.values()).sort((left, right) => left.sessionNumber - right.sessionNumber);
}

export function matchesStudentSessionFilter(student: PrincipalSubjectStudentRow, selectedSessionId: string) {
  if (!selectedSessionId) return true;

  const directSessionId = String(student?.sessionId || "").trim();
  if (directSessionId) return directSessionId === selectedSessionId;

  const sessionIds = Array.isArray(student?.sessionIds) ? student.sessionIds : [];
  return sessionIds.some((sessionId) => String(sessionId || "").trim() === selectedSessionId);
}

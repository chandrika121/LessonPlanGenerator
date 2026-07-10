import type { SessionPlan } from "../types";

export type StudentPublicationKind = "homework" | "assessments" | "assignments" | "quizzes" | "notes";

export interface PublishedStudentArtifact {
  id: string;
  kind: StudentPublicationKind;
  workspaceId?: string;
  generatedSessionKey?: string;
  sessionId: string;
  sessionNumber: number;
  sessionTitle: string;
  schoolId?: string;
  teacherId?: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  section?: string;
  duration?: number;
  subject?: string;
  subjectId?: string;
  subjectName?: string;
  gradeLevel?: string;
  termId?: string;
  termName?: string;
  termNumber?: number;
  contentType?: string;
  content?: Partial<SessionPlan>;
  publishedAt: string;
  payload: Partial<SessionPlan>;
}

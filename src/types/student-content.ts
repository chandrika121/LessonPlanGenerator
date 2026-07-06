import type { SessionPlan } from "../types";

export type StudentPublicationKind = "homework" | "assessments" | "assignments" | "quizzes" | "notes";

export interface PublishedStudentArtifact {
  id: string;
  kind: StudentPublicationKind;
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
  gradeLevel?: string;
  termId?: string;
  termName?: string;
  termNumber?: number;
  publishedAt: string;
  payload: Partial<SessionPlan>;
}

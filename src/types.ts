/**
 * Types for the Lesson Plan Generator Module
 */

export interface CurriculumExtraction {
  subject: string;
  gradeLevel: string;
  overallDescription: string;
  coreObjectives: string[];
  units: {
    unitId: string;
    unitName: string;
    description: string;
    topics: string[];
  }[];
  stagedExtraction?: Record<string, unknown>;
  document_metadata?: Record<string, unknown>;
  normalizedStructure?: Record<string, unknown>;
}

export interface SavedCurriculumRecord {
  _id: string;
  fileName: string;
  subject: string;
  gradeLevel: string;
  sourceText: string;
  extractedCurriculum: CurriculumExtraction;
  extractionMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TermRow {
  id: string;
  className?: string;
  termNumber?: number;
  term: string; // e.g. "Term 1", "Term 2"
  unitId?: string;
  unitName: string;
  chapters: string[];
  marks: number;
}

export interface SessionConfig {
  includeLearningOutcomes: boolean;
  includeIntroduction: boolean;
  includeTheory: boolean;
  includeAssessments: boolean;
  includeAssignments: boolean;
  includeNotes: boolean; // HTML/PPT/PDF/DOCX materials
  sessionCount: number;
  durationMinutes: number;
}

export interface SessionPlan {
  id: string;
  sessionNumber: number;
  title: string;
  duration: number; // in mins
  learningOutcomes?: string[];
  introduction?: string;
  theory?: {
    overview: string;
    keyPoints: string[];
    detailedContent: string;
  };
  activities?: {
    name: string;
    instructions: string[];
    durationMinutes: number;
  }[];
  materials?: {
    ppt: { title: string; slides: { slideTitle: string; bulletPoints: string[] }[] };
    pdf: { documentTitle: string; keyInformation: string[] };
    docx: { outlineTitle: string; sections: string[] };
  };
  homework?: {
    task: string;
    estimatedTimeMinutes: number;
  };
  assessment?: {
    questions: string[];
    answerKey: string[];
  };
  assignment?: {
    taskDescription: string;
    rubric: string[];
    answerKey: string;
  };
}

export type PlanningWorkspacePhase =
  | "curriculum_setup"
  | "course_planning"
  | "session_planning"
  | "content_generation"
  | "assessment_revision";

export interface CurriculumApprovalState {
  approved: boolean;
  approvedAt?: string | null;
  notes?: string;
  confidence?: number | null;
}

export interface AcademicCalendarConfig {
  workingDays?: number | null;
  holidayCalendar?: string[];
  examDates?: string[];
  schoolEvents?: string[];
  specialDays?: string[];
  revisionWeeks?: number | null;
  bufferWeeks?: number | null;
}

export interface AcademicConfig {
  academicYear?: string;
  school?: string;
  board?: string;
  medium?: string;
  language?: string;
  subject?: string;
  className?: string;
  section?: string;
  book?: string;
  weeklyPeriods?: number | null;
  periodDurationMinutes?: number | null;
  labPeriods?: number | null;
  calendar?: AcademicCalendarConfig;
}

export interface TermAllocation {
  className?: string;
  termName: string;
  termNumber?: number | null;
  chapters: string[];
  marks: number;
  reasoning?: string;
  estimatedSessions?: number | null;
}

export interface TermPlan {
  approved: boolean;
  recommendedTermCount?: number | null;
  recommendations: TermAllocation[];
  allocations: TermAllocation[];
}

export interface TeachingStrategy {
  teachingStyle?: string[];
  studentLevel?: string;
  learningPace?: string;
  bloomWeights?: string[];
  assessmentPreference?: string[];
  difficulty?: string;
  teachingResources?: string[];
  aiSettings?: {
    creativity?: string;
    language?: string;
    wordCount?: string;
    readingLevel?: string;
    regionalContext?: string;
    examples?: string;
  };
}

export interface ChapterSessionPlan {
  unitName?: string;
  chapterName: string;
  recommendedSessions: number;
  adjustedSessions?: number | null;
  reasoning?: string;
  suggestedSequence?: string[];
}

export interface SessionAllocation {
  approved: boolean;
  recommendations: ChapterSessionPlan[];
  allocations: ChapterSessionPlan[];
}

export interface GeneratedArtifact {
  id: string;
  scope: "course" | "term" | "chapter" | "session" | "artifact-only";
  artifactType: string;
  title: string;
  status: "draft" | "generated" | "approved" | "regenerated";
  updatedAt?: string;
}

export interface RevisionAction {
  id: string;
  scope: "course" | "term" | "chapter" | "session" | "artifact-only";
  artifactType?: string;
  notes?: string;
  createdAt?: string;
}

export interface PlanningWorkspace {
  _id: string;
  curriculumId: string;
  phase: PlanningWorkspacePhase;
  status: "draft" | "in_progress" | "approved";
  curriculumSnapshot: {
    subject: string;
    gradeLevel: string;
    overallDescription?: string;
    units?: CurriculumExtraction["units"];
    documentMetadata?: Record<string, unknown>;
    normalizedStructure?: Record<string, unknown>;
  };
  curriculumApproval: CurriculumApprovalState;
  academicConfig: AcademicConfig;
  termPlan: TermPlan;
  teachingStrategy: TeachingStrategy;
  sessionAllocation: SessionAllocation;
  generationScope: Record<string, unknown>;
  generatedArtifacts: GeneratedArtifact[];
  revisionState: {
    history: RevisionAction[];
  };
  createdAt: string;
  updatedAt: string;
}

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

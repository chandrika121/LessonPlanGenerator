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
  savedTermPlanning?: {
    class_term_plans?: ClassTermPlan[];
    rows?: TermRow[];
    statistics?: { total_marks?: number };
    term_count?: number;
  } | null;
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

export interface TermAssignedContentRow {
  unit_id?: string;
  unit_name?: string;
  chapter_ids?: string[];
  chapter_names?: string[];
  chapters?: {
    chapter_id?: string;
    chapter_name?: string;
    estimated_sessions?: number;
    estimated_hours?: number;
    marks?: number;
  }[];
  estimated_sessions?: number;
  estimated_hours?: number;
  marks?: number;
}

export interface TermPlanSummary {
  total_units?: number;
  total_chapters?: number;
  total_sessions?: number;
  total_hours?: number;
  marks?: number;
  unit_count?: number;
  chapter_count?: number;
  estimated_sessions?: number;
  estimated_hours?: number;
}

export interface TermPlanTerm {
  term_number: number;
  term_title: string;
  summary?: TermPlanSummary;
  assigned_content?: TermAssignedContentRow[];
  curriculum_content?: TermAssignedContentRow[];
}

export interface ClassTermPlan {
  class_name?: string;
  curriculum_metadata?: Record<string, unknown>;
  term_planning_metadata?: Record<string, unknown>;
  terms: TermPlanTerm[];
  validation_report?: Record<string, unknown>;
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

// ===== Assessment Generator Types =====

export interface AssessmentInput {
  grade: string;
  subject: string;
  academic_year: string;
  term_number: string;
  term_data: Record<string, unknown>;
  covered_units: string[];
  covered_chapters: string[];
  covered_topics: string[];
  sessions: AssessmentSessionReference[];
  learning_outcomes: string[];
  competencies: AssessmentCompetencyReference[];
  total_marks: number;
  duration_minutes: number;
  paper_type: string;
  set_count: number;
}

export interface AssessmentSessionReference {
  id: string;
  session_number: number;
  title: string;
  duration: number;
  learning_outcomes: string[];
}

export interface AssessmentCompetencyReference {
  code?: string;
  title?: string;
  description?: string;
  competencies?: string[];
  unit_name?: string;
  chapter_name?: string;
}

export interface AssessmentQuestion {
  question_id: string;
  section: string;
  question_type: string;
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  unit: string;
  chapter: string;
  topic: string;
  session_refs: string[];
  learning_outcome_refs: string[];
  competency_refs: string[];
  question_text: string;
  options: string[];
  correct_answer: string;
  expected_answer_points: string[];
  diagram_required: boolean;
  diagram_description: string;
  internal_choice: boolean;
}

export interface AssessmentSection {
  section: string;
  label: string;
  marks: number;
  questions: AssessmentQuestion[];
}

export interface QuestionPaperSet {
  set_label: string;
  sections: Record<string, AssessmentSection>;
}

export interface AnswerKeyItem {
  question_id: string;
  correct_answer: string;
  explanation: string;
  steps: string[];
  final_answer: string;
}

export interface AnswerKeySet {
  set_label: string;
  answers: AnswerKeyItem[];
}

export interface PartialMark {
  point: string;
  marks: number;
}

export interface MarkingSchemeItem {
  question_id: string;
  total_marks: number;
  value_points: string[];
  partial_marking: PartialMark[];
  alternative_answers_allowed: boolean;
  diagram_marks: number;
  common_errors: string[];
}

export interface MarkingSchemeSet {
  set_label: string;
  schemes: MarkingSchemeItem[];
}

export interface SectionDistribution {
  section: string;
  label: string;
  marks: number;
  questions_count: number;
  question_type: string;
  marks_per_question: number;
}

export interface ChapterWeightage {
  unit: string;
  chapter: string;
  marks: number;
  question_count: number;
  sections_covered: string[];
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface ValidationReport {
  uses_only_selected_term_content: boolean;
  total_marks_valid: boolean;
  all_questions_have_answers: boolean;
  all_subjective_questions_have_marking_scheme: boolean;
  future_topics_detected: string[];
}

export interface AssessmentBlueprint {
  total_marks: number;
  duration_minutes: number;
  section_distribution: SectionDistribution[];
  chapter_wise_weightage: ChapterWeightage[];
  difficulty_distribution: DifficultyDistribution;
  competency_coverage: string[];
  learning_outcome_coverage: string[];
  validation_report: ValidationReport;
}

export interface AssessmentMetadata {
  grade: string;
  subject: string;
  academic_year: string;
  term_number: string;
  total_marks: number;
  duration_minutes: number;
  paper_type: string;
  set_count: number;
  generated_at: string;
}

export interface AssessmentResult {
  metadata: AssessmentMetadata;
  blueprint: AssessmentBlueprint;
  question_papers: QuestionPaperSet[];
  answer_keys: AnswerKeySet[];
  marking_schemes: MarkingSchemeSet[];
}

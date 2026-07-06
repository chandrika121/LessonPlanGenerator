export type EvaluationMode = "curriculum" | "question-paper";

export interface QuestionPaperExtractionSection {
  id: string;
  name: string;
  instructions: string;
  order: number;
}

export interface QuestionPaperExtraction {
  examName: string;
  className: string;
  subject: string;
  duration: string;
  totalMarks: number;
  sections: QuestionPaperExtractionSection[];
  instructions: string;
}

export interface QuestionPaperQuestion {
  id: string;
  section: string;
  sectionOrder: number;
  questionNo: string;
  question: string;
  detectedMarks: number;
  questionType: "objective" | "short_answer" | "long_answer";
  difficulty: "easy" | "medium" | "hard";
}

export interface QuestionPaperAnswerMapping {
  id: string;
  questionNo: string;
  expectedAnswer: string;
  keywords: string;
  alternativeAnswers: string;
  marks: number;
}

export interface QuestionPaperRubricItem {
  id: string;
  questionNo: string;
  criteria: string;
  marks: number;
  keywords: string;
  commonMistakes: string;
  teacherNotes: string;
}

export interface QuestionPaperStudentUpload {
  id: string;
  studentName: string;
  rollNo: string;
  fileName?: string;
  uploadStatus: "not_uploaded" | "uploaded";
}

export interface QuestionPaperQuestionResult {
  questionId: string;
  questionNo: string;
  question: string;
  maxMarks: number;
  originalAiMarks: number;
  awardedMarks: number;
  aiReason: string;
  aiFeedback: string;
  overrideReason?: string;
  overriddenAt?: string;
}

export interface QuestionPaperStudentResult {
  studentId: string;
  studentName: string;
  rollNo: string;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  aiConfidence: string;
  status: "AI Detected" | "Review Required" | "Approved";
  feedback: string;
  questionResults: QuestionPaperQuestionResult[];
}

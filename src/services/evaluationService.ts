import { getBackendBaseUrl } from "../utils/api";

export type EvaluationType = "session" | "lesson" | "term";
const AUTH_STORAGE_KEY = "lms:auth-session";
const BACKEND_URL = getBackendBaseUrl();

export interface EvaluationAssessment {
  id: string;
  type: EvaluationType;
  termId: string;
  termName: string;
  chapterId?: string;
  chapterName?: string;
  lessonId?: string;
  lessonName?: string;
  sessionId?: string;
  sessionName?: string;
  questionPaperId: string;
  answerKeyId: string;
  rubricId: string;
  questionPaperTitle: string;
  answerKeyTitle: string;
  rubricTitle: string;
  maxMarks: number;
  questionPaperJson: Record<string, unknown>;
  answerKeyJson: Record<string, unknown>;
  rubricJson: Record<string, unknown>;
}

export interface EvaluationStudent {
  id: string;
  name: string;
  className: string;
  rollNo: string;
  uploadStatus: "not_uploaded" | "uploaded" | "already_available";
  fileName?: string;
  answerResponseSource?: "student_upload" | "teacher_upload";
  answerResponsePreview?: string;
}

export interface QuestionWiseEvaluation {
  questionNo: string;
  maxMarks: number;
  awardedMarks: number;
  matchingScore: number;
  extractedAnswer: string;
  studentAnswerSummary: string;
  expectedAnswerSummary: string;
  reason: string;
  feedback: string;
}

export interface EvaluationResult {
  studentId: string;
  studentName: string;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  overallFeedback: string;
  questionWise: QuestionWiseEvaluation[];
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { id?: string; schoolId?: string; role?: string; assignedClasses?: string[]; subjects?: string[] };
  } catch {
    return null;
  }
}

const mockAssessments: EvaluationAssessment[] = [
  {
    id: "session-chem-1-1",
    type: "session",
    termId: "term-1",
    termName: "Term 1",
    chapterId: "chapter-matter",
    chapterName: "The Language of Chemistry",
    sessionId: "session-1",
    sessionName: "Matter and Measurement",
    questionPaperId: "qp-chem-101",
    answerKeyId: "ak-chem-101",
    rubricId: "rb-chem-101",
    questionPaperTitle: "Session 1 Question Paper",
    answerKeyTitle: "Session 1 Answer Key",
    rubricTitle: "Session 1 Rubric",
    maxMarks: 25,
    questionPaperJson: {
      session: "Session 1",
      title: "Matter and Measurement",
      questions: [
        { questionNo: "Q1", type: "short_answer", marks: 10, prompt: "Differentiate pure substances and mixtures with two examples." },
        { questionNo: "Q2", type: "short_answer", marks: 10, prompt: "Count the significant figures in 0.0025, 100.0 and 12.50." },
        { questionNo: "Q3", type: "long_answer", marks: 5, prompt: "Explain why precision matters in chemistry experiments." },
      ],
    },
    answerKeyJson: {
      session: "Session 1",
      answers: [
        { questionNo: "Q1", expected: "Pure substances have fixed composition; mixtures vary and can be separated physically.", keywords: ["fixed composition", "physically separated", "homogeneous", "heterogeneous"] },
        { questionNo: "Q2", expected: "0.0025 has 2 sig figs, 100.0 has 4, 12.50 has 4.", keywords: ["leading zeros", "trailing zero after decimal", "significant figures"] },
        { questionNo: "Q3", expected: "Precision affects reliability, reproducibility, and correctness of calculations.", keywords: ["reliability", "uncertainty", "measurement"] },
      ],
    },
    rubricJson: {
      rubric: [
        { questionNo: "Q1", criteria: ["Concept accuracy", "Correct examples"], fullMarks: 10 },
        { questionNo: "Q2", criteria: ["Correct counts", "Rule explanation"], fullMarks: 10 },
        { questionNo: "Q3", criteria: ["Scientific reasoning", "Use of chemistry context"], fullMarks: 5 },
      ],
    },
  },
  {
    id: "session-chem-1-2",
    type: "session",
    termId: "term-1",
    termName: "Term 1",
    chapterId: "chapter-matter",
    chapterName: "The Language of Chemistry",
    sessionId: "session-2",
    sessionName: "Atomic Structure Basics",
    questionPaperId: "qp-chem-102",
    answerKeyId: "ak-chem-102",
    rubricId: "rb-chem-102",
    questionPaperTitle: "Session 2 Question Paper",
    answerKeyTitle: "Session 2 Answer Key",
    rubricTitle: "Session 2 Rubric",
    maxMarks: 30,
    questionPaperJson: { session: "Session 2", questions: [{ questionNo: "Q1", marks: 10, prompt: "Describe protons, neutrons, and electrons." }] },
    answerKeyJson: { answers: [{ questionNo: "Q1", expected: "Definition and charge of each subatomic particle." }] },
    rubricJson: { rubric: [{ questionNo: "Q1", fullMarks: 10, criteria: ["Accuracy", "Clarity"] }] },
  },
  {
    id: "lesson-chem-1",
    type: "lesson",
    termId: "term-1",
    termName: "Term 1",
    chapterId: "chapter-matter",
    chapterName: "The Language of Chemistry",
    lessonId: "lesson-1",
    lessonName: "Classification of Matter and Significant Figures",
    questionPaperId: "qp-chem-201",
    answerKeyId: "ak-chem-201",
    rubricId: "rb-chem-201",
    questionPaperTitle: "Lesson Evaluation Paper",
    answerKeyTitle: "Lesson Answer Key",
    rubricTitle: "Lesson Rubric",
    maxMarks: 40,
    questionPaperJson: { lesson: "Classification of Matter and Significant Figures", questions: [{ questionNo: "Q1", marks: 15, prompt: "Explain classification of matter." }] },
    answerKeyJson: { answers: [{ questionNo: "Q1", expected: "Elements, compounds, homogeneous and heterogeneous mixtures." }] },
    rubricJson: { rubric: [{ questionNo: "Q1", fullMarks: 15, criteria: ["Concept depth", "Examples"] }] },
  },
  {
    id: "lesson-chem-2",
    type: "lesson",
    termId: "term-2",
    termName: "Term 2",
    chapterId: "chapter-states",
    chapterName: "States of Matter",
    lessonId: "lesson-2",
    lessonName: "Gases and Gas Laws",
    questionPaperId: "qp-chem-202",
    answerKeyId: "ak-chem-202",
    rubricId: "rb-chem-202",
    questionPaperTitle: "Gas Laws Evaluation",
    answerKeyTitle: "Gas Laws Answer Key",
    rubricTitle: "Gas Laws Rubric",
    maxMarks: 35,
    questionPaperJson: { lesson: "Gases and Gas Laws", questions: [{ questionNo: "Q1", marks: 10, prompt: "State Boyle's law." }] },
    answerKeyJson: { answers: [{ questionNo: "Q1", expected: "Pressure inversely proportional to volume at constant temperature." }] },
    rubricJson: { rubric: [{ questionNo: "Q1", fullMarks: 10, criteria: ["Correct law", "Condition stated"] }] },
  },
  {
    id: "term-chem-1",
    type: "term",
    termId: "term-1",
    termName: "Term 1",
    questionPaperId: "qp-chem-301",
    answerKeyId: "ak-chem-301",
    rubricId: "rb-chem-301",
    questionPaperTitle: "Term 1 Examination Paper",
    answerKeyTitle: "Term 1 Examination Key",
    rubricTitle: "Term 1 Evaluation Rubric",
    maxMarks: 100,
    questionPaperJson: { term: "Term 1", sections: ["Matter", "Measurement", "Atomic Structure"] },
    answerKeyJson: { term: "Term 1", markingScheme: "Structured by section and question number." },
    rubricJson: { rubric: [{ section: "Theory", weightage: 60 }, { section: "Application", weightage: 40 }] },
  },
  {
    id: "term-chem-2",
    type: "term",
    termId: "term-2",
    termName: "Term 2",
    questionPaperId: "qp-chem-302",
    answerKeyId: "ak-chem-302",
    rubricId: "rb-chem-302",
    questionPaperTitle: "Term 2 Examination Paper",
    answerKeyTitle: "Term 2 Examination Key",
    rubricTitle: "Term 2 Evaluation Rubric",
    maxMarks: 100,
    questionPaperJson: { term: "Term 2", sections: ["States of Matter", "Thermodynamics"] },
    answerKeyJson: { term: "Term 2", markingScheme: "Structured by section and question number." },
    rubricJson: { rubric: [{ section: "Concept", weightage: 50 }, { section: "Problem Solving", weightage: 50 }] },
  },
];

const mockStudents: EvaluationStudent[] = [
  { id: "stu-1", name: "Aarav Sharma", className: "Class XI - A", rollNo: "11A-03", uploadStatus: "already_available", fileName: "aarav-term1.pdf", answerResponseSource: "student_upload", answerResponsePreview: "Q1: Pure substances have fixed composition... Q2: 0.0025 has 2 sig figs..." },
  { id: "stu-2", name: "Diya Patel", className: "Class XI - A", rollNo: "11A-07", uploadStatus: "not_uploaded" },
  { id: "stu-3", name: "Ishaan Reddy", className: "Class XI - A", rollNo: "11A-12", uploadStatus: "uploaded", fileName: "ishaan-session2.pdf", answerResponseSource: "teacher_upload", answerResponsePreview: "Q1: Mixtures can be separated physically... Q2: Significant figures depend on zero placement..." },
  { id: "stu-4", name: "Meera Nair", className: "Class XI - A", rollNo: "11A-18", uploadStatus: "not_uploaded" },
  { id: "stu-5", name: "Riya Das", className: "Class XI - A", rollNo: "11A-22", uploadStatus: "already_available", fileName: "riya-lesson1.pdf", answerResponseSource: "student_upload", answerResponsePreview: "Q1: Matter includes elements, compounds and mixtures..." },
];

export async function getEvaluationAssessments(type: EvaluationType) {
  await wait(250);
  return mockAssessments.filter((item) => item.type === type);
}

export async function getStudents(_assessment: EvaluationAssessment) {
  await wait(250);
  return mockStudents;
}

export async function uploadStudentAnswerSheet(studentId: string, file: File) {
  await wait(350);
  return {
    studentId,
    uploadStatus: "uploaded" as const,
    fileName: file.name,
    answerResponseSource: "teacher_upload" as const,
    answerResponsePreview: "Uploaded response ready for extraction. The evaluator will parse the full answer sheet content from this PDF.",
  };
}

export async function startEvaluation(_payload: {
  evaluationType: EvaluationType;
  assessment: EvaluationAssessment;
  students: EvaluationStudent[];
}) {
  await wait(300);
  const session = getSession();
  const response = await fetch(`${BACKEND_URL}/api/evaluations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: _payload.assessment.questionPaperTitle,
      schoolId: session?.schoolId || "",
      teacherId: session?.id || "",
      classId: session?.assignedClasses?.[0] || _payload.students[0]?.className || "",
      subjectId: session?.subjects?.[0] || _payload.assessment.chapterName || _payload.assessment.termName || "General",
      evaluationMode: _payload.evaluationType,
      totalMarks: _payload.assessment.maxMarks,
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Failed to start evaluation (HTTP ${response.status})`);
  }
  const data = await response.json() as { evaluationId: string };
  return {
    jobId: data.evaluationId,
    startedAt: new Date().toISOString(),
  };
}

function makeQuestionWise(maxMarks: number): QuestionWiseEvaluation[] {
  const base = [
    ["Q1", 10, 8, 82, "Pure substances have fixed composition while mixtures can be physically separated.", "Explained classification accurately with one missing example.", "Differentiate pure substances and mixtures with examples.", "Strong concept clarity, but the response skipped one applied example.", "Add one real-world example to complete the explanation."],
    ["Q2", 10, 9, 91, "0.0025 has 2 sig figs, 100.0 has 4, and 12.50 has 4 significant figures.", "Applied significant figure rules correctly for most values.", "Apply sig fig rules and justify the count for each value.", "Good procedural accuracy with clear reasoning.", "Keep showing the rule before giving the final count."],
    ["Q3", 5, 4, 78, "Precision matters because unreliable measurements affect calculations and lab results.", "Connected precision to chemistry calculations with a brief explanation.", "Explain why precision matters in measurements and calculations.", "The answer was correct but slightly concise.", "Expand the impact on experimental reliability."],
  ] as const;

  return base.map(([questionNo, defaultMax, defaultAwarded, matchingScore, extractedAnswer, studentAnswerSummary, expectedAnswerSummary, reason, feedback]) => ({
    questionNo,
    maxMarks: Math.min(defaultMax, maxMarks),
    awardedMarks: Math.min(defaultAwarded, maxMarks),
    matchingScore,
    extractedAnswer,
    studentAnswerSummary,
    expectedAnswerSummary,
    reason,
    feedback,
  }));
}

function gradeFromPercentage(percentage: number) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  return "D";
}

export async function getEvaluationResults(payload: {
  assessment: EvaluationAssessment;
  students: EvaluationStudent[];
}) {
  await wait(500);
  return payload.students.map((student, index) => {
    const questionWise = makeQuestionWise(payload.assessment.maxMarks);
    const baseTotal = questionWise.reduce((sum, item) => sum + item.awardedMarks, 0);
    const adjustedTotal = Math.min(payload.assessment.maxMarks, baseTotal + (index % 3));
    const percentage = Number(((adjustedTotal / payload.assessment.maxMarks) * 100).toFixed(1));
    return {
      studentId: student.id,
      studentName: student.name,
      totalMarks: adjustedTotal,
      maxMarks: payload.assessment.maxMarks,
      percentage,
      grade: gradeFromPercentage(percentage),
      overallFeedback: percentage >= 80
        ? "Consistent conceptual understanding with strong written justification."
        : "Core ideas are understood, but answers need deeper explanation and more precise terminology.",
      questionWise,
    };
  });
}

export async function saveEvaluation(payload: {
  evaluationId?: string;
  assessment: EvaluationAssessment;
  results: EvaluationResult[];
}) {
  await wait(300);
  const session = getSession();
  if (!payload.evaluationId) {
    return {
      savedAt: new Date().toISOString(),
      status: "saved" as const,
    };
  }
  const response = await fetch(`${BACKEND_URL}/api/evaluations/${payload.evaluationId}/save-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schoolId: session?.schoolId || "",
      teacherId: session?.id || "",
      classId: session?.assignedClasses?.[0] || "",
      subjectId: session?.subjects?.[0] || payload.assessment.chapterName || payload.assessment.termName || "General",
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      results: payload.results,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Failed to save evaluation (HTTP ${response.status})`);
  }
  const data = await response.json() as { savedAt: string };
  return {
    savedAt: data.savedAt,
    status: "saved" as const,
  };
}

import { ArrowLeft, FileCheck2, FileText, Save, Sparkles, Upload, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionToast } from "./ActionToast";
import { AnswerKeyReviewStep } from "./AnswerKeyReviewStep";
import { ExtractedQuestionsReview } from "./ExtractedQuestionsReview";
import { GeneratedRubricReview } from "./GeneratedRubricReview";
import { EvaluationProgress } from "./EvaluationProgress";
import { QuestionPaperEvaluationResults } from "./QuestionPaperEvaluationResults";
import { QuestionPaperUploadStep } from "./QuestionPaperUploadStep";
import type {
  QuestionPaperAnswerMapping,
  QuestionPaperExtraction,
  QuestionPaperQuestion,
  QuestionPaperRubricItem,
  QuestionPaperStudentResult,
  QuestionPaperStudentUpload,
} from "../types/evaluation";

const progressStages = [
  "Reading question paper",
  "Extracting questions and marks",
  "Reading answer key",
  "Mapping answers to questions",
  "Reading student answer sheets",
  "Extracting student answers",
  "Comparing student answers with answer key",
  "Applying rubric",
  "Calculating marks",
  "Generating feedback",
  "Quality checking result",
];

const initialExtraction: QuestionPaperExtraction = {
  examName: "Unit Test 1 - Biology",
  className: "Class IX",
  subject: "Biology",
  duration: "60 minutes",
  totalMarks: 12,
  instructions: "Answer all questions. Use scientific terms wherever possible.",
  sections: [
    { id: "sec-a", name: "Section A", instructions: "Answer in one or two lines.", order: 1 },
    { id: "sec-b", name: "Section B", instructions: "Answer descriptively.", order: 2 },
  ],
};

const initialQuestions: QuestionPaperQuestion[] = [
  { id: "qp-q1", section: "Section A", sectionOrder: 1, questionNo: "Q1", question: "Define photosynthesis.", detectedMarks: 2, questionType: "short_answer", difficulty: "easy" },
  { id: "qp-q2", section: "Section B", sectionOrder: 2, questionNo: "Q2", question: "Explain transpiration.", detectedMarks: 5, questionType: "long_answer", difficulty: "medium" },
  { id: "qp-q3", section: "Section B", sectionOrder: 2, questionNo: "Q3", question: "Draw and label a leaf cross-section.", detectedMarks: 5, questionType: "long_answer", difficulty: "hard" },
];

const initialAnswerMappings: QuestionPaperAnswerMapping[] = [
  { id: "map-1", questionNo: "Q1", expectedAnswer: "Photosynthesis is the process by which green plants prepare food using sunlight, carbon dioxide, and water.", keywords: "sunlight, chlorophyll, carbon dioxide, glucose", alternativeAnswers: "Food-making process in green plants", marks: 2 },
  { id: "map-2", questionNo: "Q2", expectedAnswer: "Transpiration is the loss of water vapour from the aerial parts of the plant, mainly through stomata.", keywords: "water vapour, stomata, aerial parts", alternativeAnswers: "Evaporation of water from leaves", marks: 5 },
  { id: "map-3", questionNo: "Q3", expectedAnswer: "A correct diagram with epidermis, mesophyll, veins, and stomata labelled.", keywords: "epidermis, mesophyll, vein, stomata", alternativeAnswers: "Equivalent labelled biology diagram", marks: 5 },
];

const initialRubric: QuestionPaperRubricItem[] = [
  { id: "rb-1", questionNo: "Q1", criteria: "Definition includes the food-making process and sunlight dependency.", marks: 2, keywords: "photosynthesis, food, sunlight", commonMistakes: "Missing sunlight or chlorophyll reference.", teacherNotes: "Accept concise but accurate statements." },
  { id: "rb-2", questionNo: "Q2", criteria: "Definition plus role of stomata and water loss explanation.", marks: 5, keywords: "transpiration, stomata, water vapour", commonMistakes: "Confusing transpiration with photosynthesis.", teacherNotes: "Reward process explanation with examples." },
  { id: "rb-3", questionNo: "Q3", criteria: "Scientifically correct labelled diagram with major structures identified.", marks: 5, keywords: "epidermis, mesophyll, stomata, vein", commonMistakes: "Missing labels or inaccurate structure names.", teacherNotes: "Allow neat alternate diagram styles." },
];

const initialStudents: QuestionPaperStudentUpload[] = [
  { id: "qp-stu-1", studentName: "Aarav Sharma", rollNo: "11A-03", uploadStatus: "uploaded", fileName: "aarav-answer-sheet.pdf" },
  { id: "qp-stu-2", studentName: "Diya Patel", rollNo: "11A-07", uploadStatus: "not_uploaded" },
  { id: "qp-stu-3", studentName: "Ishaan Reddy", rollNo: "11A-12", uploadStatus: "not_uploaded" },
];

function buildMockResults(
  students: QuestionPaperStudentUpload[],
  questions: QuestionPaperQuestion[],
): QuestionPaperStudentResult[] {
  const totalMaxMarks = questions.reduce((sum, item) => sum + item.detectedMarks, 0);

  return students
    .filter((student) => student.uploadStatus === "uploaded")
    .map((student, studentIndex) => {
      const questionResults = questions.map((question, questionIndex) => {
        const originalAiMarks = Math.max(0, Math.min(question.detectedMarks, question.detectedMarks - ((studentIndex + questionIndex) % 2)));
        return {
          questionId: question.id,
          questionNo: question.questionNo,
          question: question.question,
          maxMarks: question.detectedMarks,
          originalAiMarks,
          awardedMarks: originalAiMarks,
          aiReason: originalAiMarks === question.detectedMarks
            ? "Expected concepts matched strongly with the answer key and rubric."
            : "Partial concept match detected; some scoring points were missing or unclear.",
          aiFeedback: originalAiMarks === question.detectedMarks
            ? "Strong answer with the expected concepts covered clearly."
            : "Partially correct answer. The response needs a little more detail or terminology precision.",
        };
      });
      const totalMarks = questionResults.reduce((sum, item) => sum + item.awardedMarks, 0);
      const percentage = Number(((totalMarks / totalMaxMarks) * 100).toFixed(1));

      return {
        studentId: student.id,
        studentName: student.studentName,
        rollNo: student.rollNo,
        totalMarks,
        maxMarks: totalMaxMarks,
        percentage,
        grade: percentage >= 90 ? "A+" : percentage >= 75 ? "A" : percentage >= 60 ? "B" : "C",
        aiConfidence: studentIndex % 2 === 0 ? "High" : "Medium",
        status: studentIndex % 2 === 0 ? "Review Required" : "AI Detected",
        feedback: "The AI found the core ideas in most answers. A manual review can refine marks where deeper explanation deserves extra credit.",
        questionResults,
      };
    });
}

export function QuestionPaperEvaluationFlow({
  onBackToModeSelection,
}: {
  onBackToModeSelection: () => void;
}) {
  const [activeStep, setActiveStep] = useState(1);
  const [extraction] = useState<QuestionPaperExtraction>(initialExtraction);
  const [questionPaperFileName, setQuestionPaperFileName] = useState<string>();
  const [answerKeyFileName, setAnswerKeyFileName] = useState<string>();
  const [rubricFileName, setRubricFileName] = useState<string>();
  const [students, setStudents] = useState<QuestionPaperStudentUpload[]>(initialStudents);
  const [questions, setQuestions] = useState<QuestionPaperQuestion[]>(initialQuestions);
  const [answerMappings, setAnswerMappings] = useState<QuestionPaperAnswerMapping[]>(initialAnswerMappings);
  const [rubricItems, setRubricItems] = useState<QuestionPaperRubricItem[]>(initialRubric);
  const [progressIndex, setProgressIndex] = useState(0);
  const [evaluationRunning, setEvaluationRunning] = useState(false);
  const [results, setResults] = useState<QuestionPaperStudentResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAtLabel, setSavedAtLabel] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const uploadedStudentsCount = useMemo(
    () => students.filter((student) => student.uploadStatus === "uploaded").length,
    [students],
  );
  const totalMarks = useMemo(() => questions.reduce((sum, item) => sum + item.detectedMarks, 0), [questions]);
  const questionsValid = useMemo(() => {
    const totalMatches = totalMarks === extraction.totalMarks;
    const uniqueQuestionNos = new Set(questions.map((question) => question.questionNo)).size === questions.length;
    const allHaveMarks = questions.every((question) => question.detectedMarks > 0);
    const allHaveText = questions.every((question) => question.question.trim().length > 0);
    const orderedSections = questions.every((question, index, current) => index === 0 || current[index - 1].sectionOrder <= question.sectionOrder);
    return totalMatches && uniqueQuestionNos && allHaveMarks && allHaveText && orderedSections;
  }, [extraction.totalMarks, questions, totalMarks]);

  const canProceedFromStep = () => {
    switch (activeStep) {
      case 1:
        return Boolean(questionPaperFileName);
      case 2:
        return questionsValid;
      case 3:
        return Boolean(answerKeyFileName) && answerMappings.length === questions.length;
      case 4:
        return uploadedStudentsCount > 0;
      case 5:
        return Boolean(rubricFileName) && rubricItems.length > 0;
      case 6:
        return !evaluationRunning && results.length > 0;
      case 7:
        return results.length > 0;
      default:
        return true;
    }
  };

  const handleStudentUpload = (studentId: string, file: File) => {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? { ...student, uploadStatus: "uploaded", fileName: file.name }
          : student,
      ),
    );
  };

  const handleRunEvaluation = async () => {
    setEvaluationRunning(true);
    setSavedAtLabel("");
    setResults([]);
    setProgressIndex(0);

    for (let index = 0; index < progressStages.length; index += 1) {
      setProgressIndex(index);
      await new Promise((resolve) => setTimeout(resolve, 550));
    }

    setResults(buildMockResults(students, questions));
    setEvaluationRunning(false);
    setActiveStep(7);
  };

  const handleOverrideMarks = (studentId: string, questionId: string, awardedMarks: number) => {
    setResults((current) =>
      current.map((result) => {
        if (result.studentId !== studentId) return result;
        const questionResults = result.questionResults.map((question) =>
          question.questionId === questionId
            ? { ...question, awardedMarks, overriddenAt: new Date().toLocaleString() }
            : question,
        );
        const totalMarksValue = questionResults.reduce((sum, item) => sum + item.awardedMarks, 0);
        return {
          ...result,
          status: "Review Required",
          questionResults,
          totalMarks: totalMarksValue,
          percentage: Number(((totalMarksValue / result.maxMarks) * 100).toFixed(1)),
        };
      }),
    );
  };

  const handleOverrideReasonChange = (studentId: string, questionId: string, reason: string) => {
    setResults((current) =>
      current.map((result) =>
        result.studentId === studentId
          ? {
              ...result,
              questionResults: result.questionResults.map((question) =>
                question.questionId === questionId
                  ? { ...question, overrideReason: reason, overriddenAt: reason ? new Date().toLocaleString() : question.overriddenAt }
                  : question,
              ),
            }
          : result,
      ),
    );
  };

  const handleApproveStudent = (studentId: string) => {
    setResults((current) =>
      current.map((result) =>
        result.studentId === studentId ? { ...result, status: "Approved" } : result,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    setSavedAtLabel(`Saved ${new Date().toLocaleString()}`);
    setPopupMessage("Question paper evaluation results saved successfully.");
    setSaving(false);
    setActiveStep(8);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return <QuestionPaperUploadStep fileName={questionPaperFileName} extraction={extraction} onUpload={(file) => setQuestionPaperFileName(file.name)} />;
      case 2:
        return <ExtractedQuestionsReview extraction={extraction} questions={questions} onUpdateQuestion={(questionId, updates) => setQuestions((current) => current.map((question) => question.id === questionId ? { ...question, ...updates } : question))} />;
      case 3:
        return <AnswerKeyReviewStep fileName={answerKeyFileName} mappings={answerMappings} onUpload={(file) => setAnswerKeyFileName(file.name)} onUpdateMapping={(mappingId, updates) => setAnswerMappings((current) => current.map((mapping) => mapping.id === mappingId ? { ...mapping, ...updates } : mapping))} />;
      case 4:
        return (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Step 4</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Upload student answer sheets</h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">Upload answer sheets individually for each student. This step supports per-student mapping, repeat uploads, and basic upload status.</p>

              <div className="mt-6 grid gap-4">
                {students.map((student) => (
                  <div key={student.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-base font-bold text-slate-800">{student.studentName}</div>
                        <div className="mt-1 text-sm text-slate-500">Roll No. {student.rollNo}</div>
                        <div className="mt-2 text-xs text-slate-500">File: {student.fileName || "Not uploaded yet"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${student.uploadStatus === "uploaded" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                          {student.uploadStatus === "uploaded" ? "Uploaded" : "Not uploaded"}
                        </span>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#36ADAA] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25">
                          <Upload className="h-4 w-4" />
                          Upload file
                          <input
                            type="file"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) handleStudentUpload(student.id, file);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Upload Status</p>
                  <h3 className="font-display text-2xl font-extrabold text-slate-900">{uploadedStudentsCount}/{students.length}</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500">Each student keeps an individual upload record so backend APIs can later link files, OCR data, and evaluation results safely.</p>
            </div>
          </div>
        );
      case 5:
        return <GeneratedRubricReview rubricFileName={rubricFileName} onUploadRubric={(file) => setRubricFileName(file.name)} rubricItems={rubricItems} onUpdateRubricItem={(rubricId, updates) => setRubricItems((current) => current.map((item) => item.id === rubricId ? { ...item, ...updates } : item))} />;
      case 6:
        return (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Step 6</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Run AI evaluation</h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">The mock AI pipeline reads extracted questions and marks, maps answer-key content, extracts student answers, applies the rubric, and quality-checks the result.</p>

              <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800">Evaluation package</div>
                <div className="text-sm text-slate-600">Question paper: {questionPaperFileName || "Not uploaded"}</div>
                <div className="text-sm text-slate-600">Answer key: {answerKeyFileName || "Not uploaded"}</div>
                <div className="text-sm text-slate-600">Rubric: {rubricFileName || "Not uploaded"}</div>
                <div className="text-sm text-slate-600">Uploaded student sheets: {uploadedStudentsCount}</div>
                <div className="text-sm text-slate-600">Total marks: {totalMarks}</div>
              </div>

              <button
                type="button"
                disabled={evaluationRunning || uploadedStudentsCount === 0}
                onClick={() => void handleRunEvaluation()}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#36ADAA] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {evaluationRunning ? "Running..." : "Run AI Evaluation"}
              </button>
            </div>
            <EvaluationProgress stages={progressStages} activeIndex={progressIndex} running={evaluationRunning} />
          </div>
        );
      case 7:
      case 8:
        return (
          <div className="space-y-4">
            {savedAtLabel ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {savedAtLabel}
              </div>
            ) : null}
            <QuestionPaperEvaluationResults results={results} saving={saving} onOverrideMarks={handleOverrideMarks} onOverrideReasonChange={handleOverrideReasonChange} onApproveStudent={handleApproveStudent} onSave={() => void handleSave()} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ActionToast open={Boolean(popupMessage)} message={popupMessage} onClose={() => setPopupMessage("")} />

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBackToModeSelection}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Select Evaluation Mode
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Question Paper</p>
              <p className="mt-3 font-display text-3xl font-extrabold text-slate-900">{questionPaperFileName ? "1" : "0"}</p>
              <p className="mt-2 text-sm text-slate-500">Question paper uploaded and ready for AI detected review</p>
            </div>
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Answer Key</p>
              <p className="mt-3 font-display text-3xl font-extrabold text-slate-900">{answerKeyFileName ? "1" : "0"}</p>
              <p className="mt-2 text-sm text-slate-500">Answer key uploaded and mapped to detected questions</p>
            </div>
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Rubric</p>
              <p className="mt-3 font-display text-3xl font-extrabold text-slate-900">{rubricFileName ? "1" : "0"}</p>
              <p className="mt-2 text-sm text-slate-500">Teacher rubric uploaded for question paper evaluation</p>
            </div>
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Student Uploads</p>
              <p className="mt-3 font-display text-3xl font-extrabold text-slate-900">{uploadedStudentsCount}</p>
              <p className="mt-2 text-sm text-slate-500">Student answer sheets currently uploaded</p>
            </div>
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:col-span-2 xl:col-span-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Results Saved</p>
              <p className="mt-3 font-display text-3xl font-extrabold text-slate-900">{savedAtLabel ? "Yes" : "No"}</p>
              <p className="mt-2 text-sm text-slate-500">Mock save today, backend ready later</p>
            </div>
            <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
              <Save className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      {renderStepContent()}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={activeStep === 1}
          onClick={() => setActiveStep((step) => Math.max(1, step - 1))}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous Step
        </button>
        <button
          type="button"
          disabled={activeStep >= 8 || !canProceedFromStep()}
          onClick={() => setActiveStep((step) => Math.min(8, step + 1))}
          className="inline-flex items-center justify-center rounded-2xl bg-[#36ADAA] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}

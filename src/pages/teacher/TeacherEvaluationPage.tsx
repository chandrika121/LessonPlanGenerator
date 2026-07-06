import { ArrowLeft, BookOpenCheck, ClipboardCheck, FileSearch, FileText, GraduationCap, LibraryBig, Sparkles, TimerReset, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionToast } from "../../components/ActionToast";
import { AssessmentSelector } from "../../components/AssessmentSelector";
import { EvaluationProgress } from "../../components/EvaluationProgress";
import { EvaluationResults } from "../../components/EvaluationResults";
import { EvaluationTypeCard } from "../../components/EvaluationTypeCard";
import { PaperUploadPanel } from "../../components/PaperUploadPanel";
import { QuestionPaperEvaluationFlow } from "../../components/QuestionPaperEvaluationFlow";
import { StatCard } from "../../components/StatCard";
import { StudentSelector } from "../../components/StudentSelector";
import { endDevTimer, startDevTimer } from "../../utils/devTiming";
import {
  getEvaluationAssessments,
  getEvaluationResults,
  getStudents,
  saveEvaluation,
  startEvaluation,
  uploadStudentAnswerSheet,
  type EvaluationAssessment,
  type EvaluationResult,
  type EvaluationStudent,
  type EvaluationType,
} from "../../services/evaluationService";
import type { EvaluationMode } from "../../types/evaluation";


const progressStages = [
  "Reading answer sheet",
  "Extracting answers",
  "Comparing with answer key",
  "Applying rubric",
  "Calculating marks",
  "Generating feedback",
];

export function TeacherEvaluationPage() {
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [evaluationType, setEvaluationType] = useState<EvaluationType | null>(null);
  const [assessments, setAssessments] = useState<EvaluationAssessment[]>([]);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [students, setStudents] = useState<EvaluationStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [uploadingStudentId, setUploadingStudentId] = useState<string | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const [evaluationRunning, setEvaluationRunning] = useState(false);
  const [evaluationId, setEvaluationId] = useState("");
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAtLabel, setSavedAtLabel] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const selectedAssessment = assessments.find((item) => item.id === selectedAssessmentId) || null;
  const selectedStudents = students.filter((student) => selectedStudentIds.includes(student.id));

  useEffect(() => {
    const paintLabel = "[page-paint] teacher-evaluation";
    startDevTimer(paintLabel);

    const frame = window.requestAnimationFrame(() => {
      endDevTimer(paintLabel);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      endDevTimer(paintLabel);
    };
  }, []);

  useEffect(() => {
    if (!evaluationType) {
      setAssessments([]);
      return;
    }
    let mounted = true;
    startDevTimer("[page-fetch] teacher-evaluation-assessments");
    void getEvaluationAssessments(evaluationType).then((data) => {
      if (!mounted) return;
      endDevTimer("[page-fetch] teacher-evaluation-assessments");
      setAssessments(data);
    });
    return () => {
      mounted = false;
      endDevTimer("[page-fetch] teacher-evaluation-assessments");
    };
  }, [evaluationType]);

  useEffect(() => {
    if (!selectedAssessment) {
      setStudents([]);
      setSelectedStudentIds([]);
      return;
    }
    let mounted = true;
    startDevTimer("[page-fetch] teacher-evaluation-students");
    void getStudents(selectedAssessment).then((data) => {
      if (!mounted) return;
      endDevTimer("[page-fetch] teacher-evaluation-students");
      setStudents(data);
    });
    return () => {
      mounted = false;
      endDevTimer("[page-fetch] teacher-evaluation-students");
    };
  }, [selectedAssessment]);

  const resetAssessmentSelection = () => {
    setSelectedTermId("");
    setSelectedChapterId("");
    setSelectedLessonId("");
    setSelectedSessionId("");
    setSelectedAssessmentId("");
    setStudents([]);
    setSelectedStudentIds([]);
    setResults([]);
    setSavedAtLabel("");
  };

  const handleSelectEvaluationType = (type: EvaluationType) => {
    setEvaluationType(type);
    resetAssessmentSelection();
  };

  const handleSelectEvaluationMode = (mode: EvaluationMode) => {
    setEvaluationMode(mode);
    if (mode === "curriculum") {
      setActiveStep(1);
    }
  };

  const handleBackToModeSelection = () => {
    setEvaluationMode(null);
  };

  const handleTermChange = (value: string) => {
    setSelectedTermId(value);
    setSelectedChapterId("");
    setSelectedLessonId("");
    setSelectedSessionId("");
    setSelectedAssessmentId("");
  };

  const handleChapterChange = (value: string) => {
    setSelectedChapterId(value);
    setSelectedLessonId("");
    setSelectedSessionId("");
    setSelectedAssessmentId("");
  };

  const handleLessonChange = (value: string) => {
    setSelectedLessonId(value);
    setSelectedAssessmentId("");
  };

  const handleSessionChange = (value: string) => {
    setSelectedSessionId(value);
    setSelectedAssessmentId("");
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    );
  };

  const handleSelectAllVisible = () => {
    const visibleStudentIds = students
      .filter((student) => {
        const value = studentSearch.trim().toLowerCase();
        if (!value) return true;
        return [student.name, student.rollNo, student.className].some((field) => field.toLowerCase().includes(value));
      })
      .map((student) => student.id);
    setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...visibleStudentIds])));
  };

  const handleUpload = async (studentId: string, file: File) => {
    setUploadingStudentId(studentId);
    try {
      const uploaded = await uploadStudentAnswerSheet(studentId, file);
      setStudents((current) =>
        current.map((student) =>
          student.id === studentId
            ? {
                ...student,
                uploadStatus: uploaded.uploadStatus,
                fileName: uploaded.fileName,
                answerResponseSource: uploaded.answerResponseSource,
                answerResponsePreview: uploaded.answerResponsePreview,
              }
            : student,
        ),
      );
    } finally {
      setUploadingStudentId(null);
    }
  };

  const handleStartEvaluation = async () => {
    if (!evaluationType || !selectedAssessment || selectedStudents.length === 0) return;
    setEvaluationRunning(true);
    setResults([]);
    setSavedAtLabel("");
    setProgressIndex(0);
    const started = await startEvaluation({ evaluationType, assessment: selectedAssessment, students: selectedStudents });
    setEvaluationId(started.jobId);
    for (let index = 0; index < progressStages.length; index += 1) {
      setProgressIndex(index);
      await new Promise((resolve) => setTimeout(resolve, 550));
    }
    const nextResults = await getEvaluationResults({ assessment: selectedAssessment, students: selectedStudents });
    setResults(nextResults);
    setEvaluationRunning(false);
    setActiveStep(6);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedAssessment || results.length === 0) return;
    setSaving(true);
    try {
      const response = await saveEvaluation({ evaluationId, assessment: selectedAssessment, results });
      setSavedAtLabel(`Saved ${new Date(response.savedAt).toLocaleString()}`);
      setPopupMessage("Evaluation results saved successfully.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = (result: EvaluationResult) => {
    const report = [
      `Evaluation Report`,
      `Student: ${result.studentName}`,
      `Marks: ${result.totalMarks}/${result.maxMarks}`,
      `Percentage: ${result.percentage}%`,
      `Grade: ${result.grade}`,
      ``,
      `Overall Feedback:`,
      result.overallFeedback,
      ``,
      `Question-wise Evaluation`,
      ...result.questionWise.map((item) => `${item.questionNo}: ${item.awardedMarks}/${item.maxMarks} | ${item.feedback}`),
    ].join("\n");
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.studentName.replace(/\s+/g, "-").toLowerCase()}-evaluation-report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canProceedFromStep = () => {
    switch (activeStep) {
      case 1:
        return Boolean(evaluationType);
      case 2:
        return Boolean(selectedAssessment);
      case 3:
        return selectedStudentIds.length > 0;
      case 4:
        return selectedStudents.length > 0 && selectedStudents.every((student) => student.uploadStatus !== "not_uploaded");
      case 5:
        return !evaluationRunning && results.length > 0;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="grid gap-5 lg:grid-cols-3">
            <EvaluationTypeCard
              title="Session Evaluation"
              description="Evaluate one specific generated session with its linked paper, answer key, and rubric."
              value="session"
              icon={BookOpenCheck}
              selected={evaluationType === "session"}
              onClick={handleSelectEvaluationType}
            />
            <EvaluationTypeCard
              title="Lesson Evaluation"
              description="Evaluate a chapter-level lesson package across its broader learning objective set."
              value="lesson"
              icon={LibraryBig}
              selected={evaluationType === "lesson"}
              onClick={handleSelectEvaluationType}
            />
            <EvaluationTypeCard
              title="Term Evaluation"
              description="Run full-term evaluation using the consolidated term paper, answer key, and rubric."
              value="term"
              icon={ClipboardCheck}
              selected={evaluationType === "term"}
              onClick={handleSelectEvaluationType}
            />
          </div>
        );
      case 2:
        return (
          <AssessmentSelector
            evaluationType={evaluationType || "session"}
            assessments={assessments}
            selectedAssessmentId={selectedAssessmentId}
            selectedTermId={selectedTermId}
            selectedChapterId={selectedChapterId}
            selectedLessonId={selectedLessonId}
            selectedSessionId={selectedSessionId}
            onTermChange={handleTermChange}
            onChapterChange={handleChapterChange}
            onLessonChange={handleLessonChange}
            onSessionChange={handleSessionChange}
            onAssessmentChange={setSelectedAssessmentId}
          />
        );
      case 3:
        return (
          <StudentSelector
            students={students}
            selectedStudentIds={selectedStudentIds}
            search={studentSearch}
            onSearchChange={setStudentSearch}
            onToggleStudent={handleToggleStudent}
            onSelectAll={handleSelectAllVisible}
          />
        );
      case 4:
        return (
          <PaperUploadPanel
            students={selectedStudents}
            uploadingStudentId={uploadingStudentId}
            onUpload={handleUpload}
          />
        );
      case 5:
        return (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Extract Answers</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Extract the full student response and evaluate it</h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                After student search and upload selection, the evaluator reads the student answer response, extracts the content, matches it against the answer key question by question, then applies the rubric with marks and reasons.
              </p>
              <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800">Assessment package</div>
                <div className="text-sm text-slate-600">{selectedAssessment?.questionPaperTitle}</div>
                <div className="text-sm text-slate-600">{selectedStudents.length} selected student{selectedStudents.length === 1 ? "" : "s"}</div>
                <div className="space-y-2">
                  {selectedStudents.map((student) => (
                    <div key={student.id} className="rounded-xl bg-white px-3 py-3 text-sm text-slate-600">
                      <div className="font-semibold text-slate-800">{student.name} • {student.rollNo}</div>
                      <div className="mt-1">
                        {student.answerResponseSource === "student_upload" ? "Using student-uploaded answer response." : student.answerResponseSource === "teacher_upload" ? "Using teacher-uploaded answer response." : "No answer response source available yet."}
                      </div>
                      {student.answerResponsePreview ? <div className="mt-1 text-xs leading-6 text-slate-500">{student.answerResponsePreview}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                disabled={evaluationRunning || selectedStudents.length === 0}
                onClick={() => void handleStartEvaluation()}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#36ADAA] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {evaluationRunning ? "Extracting..." : "Extract Answers"}
              </button>
            </div>
            <EvaluationProgress stages={progressStages} activeIndex={progressIndex} running={evaluationRunning} />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            {savedAtLabel ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {savedAtLabel}
              </div>
            ) : null}
            <EvaluationResults
              results={results}
              onDownloadReport={handleDownloadReport}
              onReevaluate={() => {
                setResults([]);
                setSavedAtLabel("");
                setProgressIndex(0);
                setActiveStep(5);
              }}
              onSave={() => void handleSaveEvaluation()}
              saving={saving}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!evaluationMode) {
    return (
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Evaluation Modes" value="2" detail="Curriculum-based and question paper evaluation" icon={TimerReset} />
          <StatCard label="Curriculum Flow" value="3" detail="Session wise, chapter wise, and term wise remain unchanged" icon={BookOpenCheck} />
          <StatCard label="Question Paper Flow" value="8" detail="Upload, evaluate, review, and save custom paper results" icon={FileSearch} />
          <StatCard label="AI Ready" value="Yes" detail="Both flows remain aligned to the same evaluation UI language" icon={GraduationCap} />
        </div>

        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">New Evaluation</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">Select evaluation mode</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">Choose the evaluation flow you want to start. The curriculum-based path continues to use the current session, chapter, and term workflow exactly as before.</p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Evaluation Mode</p>
                  <h3 className="mt-3 font-display text-2xl font-extrabold text-slate-900">Curriculum-based Evaluation</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">Evaluate assessments generated from Lesson Planner by session, chapter, or term.</p>
                </div>
                <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
                  <LibraryBig className="h-5 w-5" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectEvaluationMode("curriculum")}
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#36ADAA] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25"
              >
                Continue
              </button>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Evaluation Mode</p>
                  <h3 className="mt-3 font-display text-2xl font-extrabold text-slate-900">Ad Hoc Evaluations</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">Upload and evaluate Previous Year, Model, and Online Question Papers with intelligent AI evaluation.</p>
                </div>
                <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
                  <FileSearch className="h-5 w-5" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectEvaluationMode("question-paper")}
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#36ADAA] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (evaluationMode === "question-paper") {
    return <QuestionPaperEvaluationFlow onBackToModeSelection={handleBackToModeSelection} />;
  }

  return (
    <div className="space-y-6">
      <ActionToast open={Boolean(popupMessage)} message={popupMessage} onClose={() => setPopupMessage("")} />

      <div className="flex justify-start">
        <button
          type="button"
          onClick={handleBackToModeSelection}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Select Evaluation Mode
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Evaluation Types" value="3" detail="Session, lesson, and term evaluation flows" icon={TimerReset} />
        <StatCard label="Assessment Assets" value={selectedAssessment ? "3" : "0"} detail="Paper, answer key, and rubric linked per selection" icon={FileText} />
        <StatCard label="Selected Students" value={String(selectedStudentIds.length)} detail="Students currently queued for evaluation" icon={Users} />
        <StatCard label="Results Ready" value={String(results.length)} detail="Evaluated student reports ready to review or save" icon={GraduationCap} />
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
          disabled={activeStep >= 6 || !canProceedFromStep()}
          onClick={() => setActiveStep((step) => Math.min(6, step + 1))}
          className="inline-flex items-center justify-center rounded-2xl bg-[#36ADAA] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  FileText,
  Upload,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  ListRestart,
  Scissors,
  Check,
  ChevronRight,
  FileSpreadsheet,
  Settings,
  FileCode,
  Download,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  Printer,
  Sliders,
  CheckSquare,
  Play,
  RotateCcw,
  Smile,
  GraduationCap,
  Trophy,
  Heart,
  X,
  Trash2,
  Database
} from "lucide-react";
import {
  AssessmentBlueprint,
  AssessmentCompetencyReference,
  AssessmentResult,
  AssessmentSessionReference,
  ClassTermPlan,
  CurriculumExtraction,
  SavedCurriculumRecord,
  SessionConfig,
  SessionPlan,
  TermAssignedContentRow,
  TermRow,
} from "./types";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function App() {
  const LAST_CURRICULUM_ID_KEY = "lms:lastCurriculumId";
  // Navigation & Step Management
  // 0: Dashboard, 1: Upload & Extract, 2: Term Planner, 3: Session Specs & Roadmap, 4: Lesson Plan Delivery Outlines, 5: Assessment Generator, 6: Saved Curriculums
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  const [dashboardTab, setDashboardTab] = useState<string>("curriculum");

  // Error and Loading indicators
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  // Step 1 State: Input Curriculum
  const [inputText, setInputText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSizeStr, setFileSizeStr] = useState<string>("");
  const [extractedData, setExtractedData] = useState<CurriculumExtraction | null>(null);
  const [currentCurriculumId, setCurrentCurriculumId] = useState<string>("");
  const [editingJsonText, setEditingJsonText] = useState<string>("");
  const [isEditingJson, setIsEditingJson] = useState<boolean>(false);
  const [isJsonCollapsed, setIsJsonCollapsed] = useState<boolean>(false);
  const [savedCurriculums, setSavedCurriculums] = useState<SavedCurriculumRecord[]>([]);

  // Step 2 State: Divide Terms
  const [termsList, setTermsList] = useState<TermRow[]>([]);
  const [termPlans, setTermPlans] = useState<ClassTermPlan[]>([]);
  const [selectedPlannerClass, setSelectedPlannerClass] = useState<string>("");
  const [selectedTermRow, setSelectedTermRow] = useState<TermRow | null>(null);
  const [termDivisionStats, setTermDivisionStats] = useState<{ totalMarks: number }>({ totalMarks: 0 });

  // Step 3 State: Session Config Selector
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    includeLearningOutcomes: true,
    includeIntroduction: true,
    includeTheory: true,
    includeAssessments: true,
    includeAssignments: true,
    includeNotes: true,
    sessionCount: 5,
    durationMinutes: 45,
  });
  
  // High-level session outline lists
  const [sessionsOutline, setSessionsOutline] = useState<{
    id: string;
    sessionNumber: number;
    title: string;
    duration: number;
    learningOutcomes: string[];
  }[]>([]);

  // Step 4 State: Deep Sessions Plans
  const [generatedSessions, setGeneratedSessions] = useState<Record<string, SessionPlan>>({});
  const [activeSessionNumber, setActiveSessionNumber] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<"theory" | "materials" | "homework" | "assessments" | "assignments">("theory");
  const [activeMaterialTab, setActiveMaterialTab] = useState<"ppt" | "pdf" | "docx">("ppt");

  // Step 5 State: Assessment Generator
  const [assessmentConfig, setAssessmentConfig] = useState({
    total_marks: 80,
    duration_minutes: 180,
    paper_type: "term_exam",
    set_count: 1,
  });
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [assessmentBlueprint, setAssessmentBlueprint] = useState<AssessmentBlueprint | null>(null);
  const [assessmentTab, setAssessmentTab] = useState<"blueprint" | "question_paper" | "answer_key" | "marking_scheme">("blueprint");
  const [selectedSet, setSelectedSet] = useState<string>("Set A");
  const [assessmentExportFormat, setAssessmentExportFormat] = useState<string>("json");
  const [assessmentExportType, setAssessmentExportType] = useState<string>("all");
  const [termsDataForAssessment, setTermsDataForAssessment] = useState<Record<string, unknown> | null>(null);
  const [coveredUnitsForAssessment, setCoveredUnitsForAssessment] = useState<string[]>([]);
  const [coveredChaptersForAssessment, setCoveredChaptersForAssessment] = useState<string[]>([]);
  const [coveredTopicsForAssessment, setCoveredTopicsForAssessment] = useState<string[]>([]);

  // File drag state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupedTerms = termsList.reduce<Record<string, Record<string, TermRow[]>>>((acc, row) => {
    const classKey = row.className || "Curriculum";
    if (!acc[classKey]) {
      acc[classKey] = {};
    }
    if (!acc[classKey][row.term]) {
      acc[classKey][row.term] = [];
    }
    acc[classKey][row.term].push(row);
    return acc;
  }, {});
  const classTermGroups = Object.entries(groupedTerms).map(([className, terms]) => ({
    className,
    termGroups: Object.entries(terms).map(([termName, rows]) => {
      const totalMarks = Number(rows.reduce((sum, row) => sum + row.marks, 0).toFixed(2));
      const allChapters = Array.from(new Set<string>(rows.flatMap((row) => row.chapters as string[])));
      const summaryRow: TermRow = {
        id: `term-${className}-${rows[0]?.termNumber || termName}`,
        className,
        termNumber: rows[0]?.termNumber,
        term: termName,
        unitName: "Whole Term",
        chapters: allChapters,
        marks: totalMarks,
      };
      return {
        termName,
        rows,
        totalMarks,
        summaryRow,
      };
    }),
  }));
  const hasGeneratedTerms = termPlans.length > 0 || termsList.length > 0;
  const plannerClassOptions = termPlans.map((plan) => plan.class_name || "Curriculum");
  const activePlannerClass =
    selectedPlannerClass && plannerClassOptions.includes(selectedPlannerClass)
      ? selectedPlannerClass
      : plannerClassOptions[0] || "";
  const activePlannerPlan = termPlans.find((plan) => (plan.class_name || "Curriculum") === activePlannerClass) || null;
  const dashboardTermCount = termPlans.length > 0
    ? termPlans.reduce((sum, plan) => sum + (plan.terms?.length || 0), 0)
    : new Set(termsList.map((term) => `${term.className || "Curriculum"}::${term.term}`)).size;
  const getTermContentRows = (term: ClassTermPlan["terms"][number]): TermAssignedContentRow[] =>
    term.assigned_content || term.curriculum_content || [];

  const getTermSummaryValue = (term: ClassTermPlan["terms"][number], key: "units" | "chapters" | "sessions" | "hours" | "marks") => {
    const summary = term.summary || {};
    const contentRows = getTermContentRows(term);
    if (key === "units") {
      return summary.total_units ?? summary.unit_count ?? contentRows.length;
    }
    if (key === "chapters") {
      return summary.total_chapters ?? summary.chapter_count ?? contentRows.reduce((sum, row) => {
        const chapterNames = row.chapter_names || row.chapters?.map((chapter) => chapter.chapter_name).filter(Boolean) || [];
        return sum + chapterNames.length;
      }, 0);
    }
    if (key === "sessions") {
      return summary.total_sessions ?? summary.estimated_sessions ?? contentRows.reduce((sum, row) => sum + Number(row.estimated_sessions || 0), 0);
    }
    if (key === "hours") {
      return summary.total_hours ?? summary.estimated_hours ?? contentRows.reduce((sum, row) => sum + Number(row.estimated_hours || 0), 0);
    }
    return summary.marks ?? contentRows.reduce((sum, row) => sum + Number(row.marks || 0), 0);
  };

  const dashboardTermMarks = termPlans.length > 0
    ? Number(
      termPlans.reduce(
        (sum, plan) =>
          sum +
          (plan.terms || []).reduce(
            (termSum, term) => termSum + Number(getTermSummaryValue(term, "marks") || 0),
            0
          ),
        0
      ).toFixed(2)
    )
    : Number(termsList.reduce((acc, curr) => acc + curr.marks, 0).toFixed(2));
  const dashboardSubject = extractedData?.subject || savedCurriculums.find((curriculum) => curriculum._id === currentCurriculumId)?.subject || "";
  const dashboardGradeLevel = extractedData?.gradeLevel || savedCurriculums.find((curriculum) => curriculum._id === currentCurriculumId)?.gradeLevel || "";
  const dashboardUnitCount = extractedData?.units?.length || 0;
  const dashboardSessionCount = sessionsOutline.length;
  const dashboardSessionMinutes = sessionsOutline.reduce((acc, curr) => acc + curr.duration, 0);

  const buildSelectedTermFromPlan = (plan: ClassTermPlan, term: ClassTermPlan["terms"][number]): TermRow => ({
    id: `term-${plan.class_name || "Curriculum"}-${term.term_number}`,
    className: plan.class_name || "Curriculum",
    termNumber: term.term_number,
    term: term.term_title,
    unitName: "Whole Term",
    chapters: getTermContentRows(term).flatMap(
      (row) => row.chapter_names || row.chapters?.map((chapter) => chapter.chapter_name || "").filter(Boolean) || []
    ),
    marks: Number(getTermSummaryValue(term, "marks") || 0),
  });

  const resolveSelectedTermFromPlan = (plan: ClassTermPlan, term: ClassTermPlan["terms"][number]): TermRow => {
    const fallbackTerm = buildSelectedTermFromPlan(plan, term);
    const matchedRows = termsList.filter(
      (row) =>
        row.className === fallbackTerm.className &&
        (
          row.termNumber === fallbackTerm.termNumber ||
          row.term === fallbackTerm.term
        )
    );

    if (matchedRows.length === 0) {
      return fallbackTerm;
    }

    return {
      id: `term-${fallbackTerm.className}-${fallbackTerm.termNumber || fallbackTerm.term}`,
      className: fallbackTerm.className,
      termNumber: fallbackTerm.termNumber,
      term: matchedRows[0]?.term || fallbackTerm.term,
      unitName: "Whole Term",
      chapters: Array.from(new Set(matchedRows.flatMap((row) => row.chapters || []))),
      marks: Number(matchedRows.reduce((sum, row) => sum + (row.marks || 0), 0).toFixed(2)),
    };
  };

  const normalizedCurriculum =
    (extractedData as any)?.stagedExtraction?.normalizedStructure ||
    (extractedData as any)?.normalizedStructure ||
    null;

  const selectedTermRows = selectedTermRow
    ? termsList.filter(
      (row) =>
        row.className === selectedTermRow.className &&
        row.term === selectedTermRow.term
    )
    : [];

  const selectedTermName = selectedTermRow?.termNumber
    ? `Term ${selectedTermRow.termNumber}`
    : selectedTermRow?.term || "";

  const assessmentSessionRefs: AssessmentSessionReference[] = sessionsOutline.map((session) => ({
    id: session.id,
    session_number: session.sessionNumber,
    title: session.title,
    duration: session.duration,
    learning_outcomes: session.learningOutcomes || [],
  }));

  const assessmentLearningOutcomes = Array.from(
    new Set(sessionsOutline.flatMap((session) => session.learningOutcomes || []))
  );

  const assessmentCompetencies: AssessmentCompetencyReference[] =
    ((extractedData as any)?.competencies?.competency_groups ||
      (extractedData as any)?.stagedExtraction?.competencies?.competency_groups ||
      []) as AssessmentCompetencyReference[];

  const getTopicsForSelectedTerm = (): string[] => {
    if (!normalizedCurriculum || !selectedTermRow) return [] as string[];

    const selectedChapters = new Set(
      selectedTermRows
        .flatMap((row) => row.chapters || [])
        .map((chapter) => chapter.trim().toLowerCase())
    );

    const classes = (normalizedCurriculum as any)?.classes || [];
    const matchingClass = classes.find((cls: any) => {
      if (!selectedTermRow.className) return true;
      return String(cls?.class_name || "").trim().toLowerCase() === selectedTermRow.className?.trim().toLowerCase();
    });

    if (!matchingClass) return [] as string[];

    return Array.from(
      new Set(
        (matchingClass.units || [])
          .flatMap((unit: any) =>
            (unit.chapters || [])
              .filter((chapter: any) =>
                selectedChapters.has(
                  String(chapter?.chapter_name || chapter?.source_chapter_name || "")
                    .trim()
                    .toLowerCase()
                )
              )
              .flatMap((chapter: any) => [
                ...(chapter?.topics || []),
                ...(chapter?.subtopics || []),
                ...(chapter?.teaching_blocks || []).map((block: any) => block?.title || block?.name || ""),
              ])
          )
          .map((topic: any) => String(topic || "").trim())
          .filter(Boolean)
      )
    );
  };

  const clearCurriculumWorkspace = () => {
    setCurrentCurriculumId("");
    setFileName("");
    setFileSizeStr("");
    setInputText("");
    setExtractedData(null);
    setEditingJsonText("");
    setIsEditingJson(false);
    setIsJsonCollapsed(false);
    setTermPlans([]);
    setTermsList([]);
    setSelectedTermRow(null);
    setTermDivisionStats({ totalMarks: 0 });
  };

  const readErrorFromResponse = async (res: Response, fallback: string) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errorData = await res.json().catch(() => null);
      return errorData?.error || fallback;
    }
    const text = await res.text().catch(() => "");
    return text || fallback;
  };

  const fetchSavedCurriculums = async () => {
    const res = await fetch("/api/curriculums");
    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to load saved curriculums."));
    }
    const data = await res.json();
    setSavedCurriculums(data.curriculums || []);
    return data.curriculums || [];
  };

  const restoreCurriculumById = async (curriculumId: string, options?: { silent?: boolean }) => {
    if (!curriculumId) return;
    const silent = options?.silent ?? false;

    if (!silent) {
      setLoading(true);
      setLoadingMessage("Restoring saved curriculum from MongoDB...");
    }

    try {
      const res = await fetch(`/api/curriculums/${curriculumId}`);
      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to restore curriculum."));
      }

      const data = await res.json();
      const curriculumRecord = data.curriculum as SavedCurriculumRecord;
      setCurrentCurriculumId(curriculumRecord._id);
      setFileName(curriculumRecord.fileName || "");
      setInputText(curriculumRecord.sourceText || "");
      setExtractedData(curriculumRecord.extractedCurriculum);
      setEditingJsonText(JSON.stringify(curriculumRecord.extractedCurriculum, null, 2));
      setTermPlans(curriculumRecord.savedTermPlanning?.class_term_plans || []);
      setTermsList(curriculumRecord.savedTermPlanning?.rows || []);
      setTermDivisionStats({
        totalMarks: Number(curriculumRecord.savedTermPlanning?.statistics?.total_marks || 0),
      });
      if ((curriculumRecord.savedTermPlanning?.rows || []).length > 0) {
        const restoredRows = curriculumRecord.savedTermPlanning?.rows || [];
        const firstClassName = restoredRows[0]?.className || "Curriculum";
        const firstTermName = restoredRows[0]?.term;
        const firstTermRows = restoredRows.filter((row) => row.className === firstClassName && row.term === firstTermName);
        setSelectedTermRow({
          id: `term-${firstClassName}-${restoredRows[0]?.termNumber || firstTermName}`,
          className: firstClassName,
          termNumber: restoredRows[0]?.termNumber,
          term: firstTermName,
          unitName: "Whole Term",
          chapters: Array.from(new Set<string>(firstTermRows.flatMap((row) => row.chapters as string[]))),
          marks: Number(firstTermRows.reduce((sum: number, row) => sum + row.marks, 0).toFixed(2)),
        });
      }
      localStorage.setItem(LAST_CURRICULUM_ID_KEY, curriculumRecord._id);
      setErrorHeader(null);
      await fetchSavedCurriculums();
    } catch (error: any) {
      console.error("[Frontend] Restore curriculum failed", error);
      localStorage.removeItem(LAST_CURRICULUM_ID_KEY);
      if (!silent) {
        setErrorHeader(error.message || "Unable to restore the saved curriculum.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleOpenSavedCurriculum = async (curriculumId: string) => {
    await restoreCurriculumById(curriculumId);
    setActiveStep(0);
  };

  const handleOpenSavedTerms = async (curriculumId: string) => {
    await restoreCurriculumById(curriculumId);
    setActiveStep(2);
  };

  const getSavedTermCount = (curriculum: SavedCurriculumRecord) =>
    (curriculum.savedTermPlanning?.class_term_plans || []).reduce(
      (sum, classPlan) => sum + (classPlan.terms?.length || 0),
      0
    );

  const handleDeleteSavedCurriculum = async (curriculumId: string) => {
    setErrorHeader(null);
    try {
      const res = await fetch(`/api/curriculums/${curriculumId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to delete curriculum."));
      }

      if (currentCurriculumId === curriculumId) {
        clearCurriculumWorkspace();
        localStorage.removeItem(LAST_CURRICULUM_ID_KEY);
      }

      await fetchSavedCurriculums();
    } catch (error: any) {
      console.error("[Frontend] Delete curriculum failed", error);
      setErrorHeader(error.message || "Unable to delete the saved curriculum.");
    }
  };

  useEffect(() => {
    void fetchSavedCurriculums().catch((error: any) => {
      console.error("[Frontend] Load saved curriculums failed", error);
    });
  }, []);

  useEffect(() => {
    const lastCurriculumId = localStorage.getItem(LAST_CURRICULUM_ID_KEY);
    if (!lastCurriculumId || extractedData || currentCurriculumId) return;
    void restoreCurriculumById(lastCurriculumId, { silent: true });
  }, [extractedData, currentCurriculumId]);

  useEffect(() => {
    if (!selectedTermRow) return;
    const termRows = termsList.filter(
      (row) => row.className === selectedTermRow.className && row.term === selectedTermRow.term
    );
    const units = Array.from(new Set(termRows.map((row) => row.unitName).filter(Boolean))) as string[];
    const chapters = Array.from(new Set(termRows.flatMap((row) => row.chapters || []).filter(Boolean))) as string[];
    const topics = getTopicsForSelectedTerm();

    setTermsDataForAssessment({
      class_name: selectedTermRow.className || extractedData?.gradeLevel || "",
      subject: extractedData?.subject || "",
      term: selectedTermRow.term,
      term_number: selectedTermRow.termNumber || "",
      units: termRows.map((row) => ({
        unit_name: row.unitName,
        chapters: row.chapters,
        marks: row.marks,
      })),
    });
    setCoveredUnitsForAssessment(units);
    setCoveredChaptersForAssessment(chapters);
    setCoveredTopicsForAssessment(topics);
  }, [selectedTermRow, termsList, extractedData]);

  useEffect(() => {
    if (!plannerClassOptions.length) {
      setSelectedPlannerClass("");
      return;
    }
    setSelectedPlannerClass((prev) => (prev && plannerClassOptions.includes(prev) ? prev : plannerClassOptions[0]));
  }, [termPlans]);

  const extractPdfText = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      pageTexts.push(`--- Page ${pageNumber} ---\n${pageText}`);
    }

    return pageTexts.join("\n\n").trim();
  };

  const readTextFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve((event.target?.result as string) || "");
      reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
      reader.readAsText(file);
    });

  const loadCurriculumFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    setFileName(file.name);
    setFileSizeStr((file.size / 1024).toFixed(1) + " KB");
    setErrorHeader(null);

    try {
      if (lowerName.endsWith(".pdf")) {
        const extractedText = await extractPdfText(file);
        if (!extractedText.trim()) {
          throw new Error("No readable text was extracted from the PDF.");
        }
        setInputText(extractedText);
        return;
      }

      if (lowerName.endsWith(".txt")) {
        const text = await readTextFile(file);
        setInputText(text);
        return;
      }

      throw new Error("Only .txt and .pdf curriculum files are supported for extraction right now.");
    } catch (error: any) {
      console.error("[Frontend] File extraction failed", error);
      setInputText("");
      setErrorHeader(error.message || "Unable to extract readable text from the selected file.");
    }
  };

  /**
   * File Drag & Drop Handlers
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void loadCurriculumFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void loadCurriculumFile(e.target.files[0]);
    }
  };

  /**
   * Extract / Analyze text via backend API
   */
  const handleAnalyzeCurriculumText = async () => {
    if (!inputText.trim()) {
      setErrorHeader("Please enter curriculum syllabus text or upload/choose a preset template first.");
      return;
    }
    const requestId = `frontend-analyze-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[Frontend][${requestId}] Analyze curriculum started`);
    console.log(`[Frontend][${requestId}] Input text length: ${inputText.length}`);
    setErrorHeader(null);
    setCurrentCurriculumId("");
    setExtractedData(null);
    setEditingJsonText("");
    setLoading(true);
    setLoadingMessage("Parsing and mapping modules with high-quality AI instructional design...");

    try {
      const res = await fetch("/api/analyze-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Request-Id": requestId,
        },
        body: JSON.stringify({ text: inputText, fileName }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Internal Server Error analyzing file"));
      }

      const data = (await res.json()) as any;
      console.log(`[Frontend][${requestId}] Analyze curriculum completed`);
      setCurrentCurriculumId(data.curriculumId || "");
      setExtractedData(data.curriculum);
      setEditingJsonText(JSON.stringify(data.curriculum, null, 2));
      if (data.curriculumId) {
        localStorage.setItem(LAST_CURRICULUM_ID_KEY, data.curriculumId);
      }
      await fetchSavedCurriculums();
    } catch (err: any) {
      console.error(`[Frontend][${requestId}] Analyze curriculum failed`, err);
      setErrorHeader(err.message || "An exception occurred while building the curriculum framework.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save customized/edited JSON curriculum back to application state
   */
  const handleSaveJsonEdit = () => {
    try {
      const parsed = JSON.parse(editingJsonText);
      setExtractedData(parsed);
      setIsEditingJson(false);
      setErrorHeader(null);
    } catch (e) {
      setErrorHeader("Invalid JSON formulation. Please review brackets and commas.");
    }
  };

  /**
   * Divide the accepted curriculum structure into 1-4 Terms according to curriculum size
   */
  const handleDivideTerms = async () => {
    if (!extractedData) return;
    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Automatically dividing the curriculum into balanced academic terms...");

    try {
      const normalizedCurriculum =
        (extractedData as any)?.normalizedStructure ||
        (extractedData as any)?.stagedExtraction?.normalizedStructure;
      const res = await fetch("/api/divide-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curriculum: normalizedCurriculum || extractedData,
          curriculumId: currentCurriculumId || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to split into terms"));
      }

      const termResponse = await res.json();
      setTermPlans(termResponse?.class_term_plans || []);
      const terms = Array.isArray(termResponse) ? termResponse : termResponse.rows || [];
      setTermDivisionStats({
        totalMarks: Number(termResponse?.statistics?.total_marks || 0),
      });
      setTermsList(terms);
      if (terms.length > 0) {
        const firstClassName = terms[0]?.className || "Curriculum";
        const firstTermName = terms[0]?.term;
        const firstTermRows = terms.filter((row: TermRow) => row.className === firstClassName && row.term === firstTermName);
        setSelectedTermRow({
          id: `term-${firstClassName}-${terms[0]?.termNumber || firstTermName}`,
          className: firstClassName,
          termNumber: terms[0]?.termNumber,
          term: firstTermName,
          unitName: "Whole Term",
          chapters: Array.from(new Set<string>(firstTermRows.flatMap((row: TermRow) => row.chapters as string[]))),
          marks: Number(firstTermRows.reduce((sum: number, row: TermRow) => sum + row.marks, 0).toFixed(2)),
        });
      }
      setActiveStep(2); // Jump to Term Planner table
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Unable to partition syllabus into designated terms.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Term level verification - Proceeding to session specifications
   */
  const handleConfigureSessionsForTerm = (term: TermRow) => {
    setSelectedTermRow(term);
    setActiveStep(3); // Jump to Session Specifier
  };

  /**
   * Generate session structure outline roadmap first based on specifications
   */
  const handleGenerateOutline = async () => {
    if (!extractedData || !selectedTermRow) return;
    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage(`Creating lesson timeline array of ${sessionConfig.sessionCount} class sessions...`);

    try {
      const res = await fetch("/api/generate-sessions-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: extractedData.subject,
          gradeLevel: extractedData.gradeLevel,
          selectedChapters: selectedTermRow.chapters,
          termName: `${selectedTermRow.term} - ${selectedTermRow.unitName}`,
          config: sessionConfig,
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to generate outlines"));
      }

      const outlines = (await res.json()) as any[];
      setSessionsOutline(outlines);
      setGeneratedSessions({}); // Clear former drafts
      setActiveSessionNumber(1);
      setActiveStep(4); // Advance to delivery dashboard
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Couldn't generate class syllabus maps.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * On-demand generation of full details for specific Session Number
   */
  const handleBuildSessionDeepDetails = async (sessionNum: number, outlineItem: any) => {
    if (!extractedData || !selectedTermRow) return;
    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage(`Synthesizing Theory details, PPT slides, worksheets, assessments and answers keys for session ${sessionNum}...`);

    try {
      const res = await fetch("/api/generate-session-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: extractedData.subject,
          gradeLevel: extractedData.gradeLevel,
          selectedChapters: selectedTermRow.chapters,
          sessionNumber: sessionNum,
          totalSessions: sessionConfig.sessionCount,
          durationMinutes: sessionConfig.durationMinutes,
          config: sessionConfig,
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed deep text generation"));
      }

      const details = (await res.json()) as any;
      setGeneratedSessions((prev) => ({
        ...prev,
        [sessionNum]: {
          ...outlineItem,
          ...details,
        },
      }));
      setActiveSessionNumber(sessionNum);
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Could not generate resources for this session.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate All Sessions Sequence (Convenient automated launcher)
   */
  const triggerGenerateAllSessions = async () => {
    if (sessionsOutline.length === 0) return;
    
    // Process top-down
    for (let i = 0; i < sessionsOutline.length; i++) {
      const item = sessionsOutline[i];
      if (!generatedSessions[item.sessionNumber]) {
        await handleBuildSessionDeepDetails(item.sessionNumber, item);
      }
    }
  };

  /**
   * Assessment Generator handler
   */
  const handleGenerateAssessment = async () => {
    if (!extractedData) {
      setErrorHeader("Please extract a curriculum first.");
      return;
    }
    if (!selectedTermRow) {
      setErrorHeader("Please select a term before generating an assessment.");
      return;
    }
    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Generating CBSE-style assessment with blueprint, question paper, answer key, and marking scheme...");

    try {
      const curriculum = normalizedCurriculum || extractedData;
      const topicList = coveredTopicsForAssessment.length > 0
        ? coveredTopicsForAssessment
        : getTopicsForSelectedTerm();
      
      const res = await fetch("/api/generate-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: extractedData.subject,
          grade: extractedData.gradeLevel,
          curriculum,
          academic_year: new Date().getFullYear().toString(),
          term_number: String(selectedTermRow.termNumber || selectedTermRow.term || ""),
          term_data: termsDataForAssessment,
          sessions: assessmentSessionRefs,
          learning_outcomes: assessmentLearningOutcomes,
          competencies: assessmentCompetencies,
          total_marks: assessmentConfig.total_marks,
          duration_minutes: assessmentConfig.duration_minutes,
          paper_type: assessmentConfig.paper_type,
          set_count: assessmentConfig.set_count,
          covered_units: coveredUnitsForAssessment.length > 0 ? coveredUnitsForAssessment : undefined,
          covered_chapters: coveredChaptersForAssessment.length > 0 ? coveredChaptersForAssessment : undefined,
          covered_topics: topicList.length > 0 ? topicList : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to generate assessment"));
      }

      const result = await res.json() as AssessmentResult;
      setAssessmentResult(result);
      setAssessmentBlueprint(result.blueprint || null);
      setAssessmentTab("blueprint");
      setSelectedSet(result.question_papers?.[0]?.set_label || "Set A");
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Assessment generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportAssessment = async () => {
    if (!assessmentResult) return;
    setLoading(true);
    setLoadingMessage(`Exporting assessment as ${assessmentExportFormat.toUpperCase()}...`);
    try {
      const res = await fetch("/api/export-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: assessmentExportFormat,
          assessment: assessmentResult,
          exportType: assessmentExportType,
        }),
      });
      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Export failed"));
      }
      const exportResult = await res.json();
      
      // Create a downloadable file
      const blob = new Blob([exportResult.data], { type: exportResult.contentType || "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportResult.fileName || "assessment-export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorHeader(err.message || "Export failed.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Custom print trigger for modern layouts
   */
  const handlePrintPlans = () => {
    window.print();
  };

  const selectedQuestionPaper = assessmentResult?.question_papers?.find((paper) => paper.set_label === selectedSet)
    || assessmentResult?.question_papers?.[0];
  const selectedAnswerKey = assessmentResult?.answer_keys?.find((answerSet) => answerSet.set_label === selectedSet)
    || assessmentResult?.answer_keys?.[0];
  const selectedMarkingScheme = assessmentResult?.marking_schemes?.find((schemeSet) => schemeSet.set_label === selectedSet)
    || assessmentResult?.marking_schemes?.[0];
  const generatedSetLabels = assessmentResult?.question_papers?.map((paper) => paper.set_label) || [];

  return (
    <div className="min-h-screen bg-[#FDFEFE] text-[#2B3437] font-sans antialiased selection:bg-[#9FCDD2] selection:text-teal-900 transition-all duration-300">
      
      {/* Dynamic Background Motifs (Montessori Inspired Playful Aesthetics) */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#9FCDD2]/10 to-transparent pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-radial from-[#E9CAB7]/20 to-transparent pointer-events-none rounded-full" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-slate-100 px-6 py-4 no-print shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-display font-extrabold text-[#2B3437] tracking-tight">
                LessonPlan<span className="text-[#36ADAA]">Generator</span>
              </h1>
            </div>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
              onClick={() => setActiveStep(0)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                activeStep === 0
                  ? "bg-[#36ADAA] text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
            {[
              { num: 1, label: "Extraction" },
              { num: 2, label: "Terms" },
              { num: 3, label: "Specs" },
              { num: 4, label: "Sessions" },
              { num: 5, label: "Assessment" },
              { num: 6, label: "Saved" },
            ].map((step) => {
              const isFirstOrActive = step.num === activeStep;
              const isPast = step.num < activeStep;
              return (
                <button
                  key={step.num}
                  onClick={() => {
                    setActiveStep(step.num as any);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    isFirstOrActive
                      ? "bg-[#36ADAA] text-white shadow-sm"
                      : isPast
                      ? "bg-[#9FCDD2]/25 text-[#36ADAA]"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                    isFirstOrActive ? "bg-white text-[#36ADAA]" : isPast ? "bg-[#36ADAA] text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {step.num}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 py-8">
        
        {/* Error Alert Display */}
        {errorHeader && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-[#DE8431] rounded-r-2xl flex items-start gap-3 no-print">
            <AlertCircle className="w-5 h-5 text-[#DE8431] shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-bold text-rose-900">Module Notice</h4>
              <p className="text-rose-700">{errorHeader}</p>
            </div>
            <button 
              onClick={() => setErrorHeader(null)}
              className="ml-auto text-rose-500 hover:text-rose-800 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Loading Backdrop Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-[#2B3437]/45 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-[#9FCDD2] animate-bounce-subtle relative">
              {/* Close Button */}
              <button
                onClick={() => setLoading(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition-all z-20"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Cute Flapping Penguin Container */}
              <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                {/* Standard CSS animations embedded for clean execution */}
                <style>{`
                  @keyframes wing-flap-left {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(-25deg); }
                  }
                  @keyframes wing-flap-right {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(25deg); }
                  }
                  @keyframes body-rotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  .animate-wing-left {
                    animation: wing-flap-left 1.1s infinite ease-in-out;
                    transform-origin: 22px 42px;
                  }
                  .animate-wing-right {
                    animation: wing-flap-right 1.1s infinite ease-in-out;
                    transform-origin: 78px 42px;
                  }
                  .animate-cute-sway {
                    animation: body-rotate 5s linear infinite;
                  }
                `}</style>

                {/* Cute Flapping Penguin Character */}
                <div className="w-16 h-20 relative animate-cute-sway" style={{ animationDelay: '0s' }}>
                  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
                    {/* Body */}
                    <rect x="20" y="25" width="60" height="80" rx="30" fill="#2B3437" />
                    {/* Belly / Face White background */}
                    <path d="M 50,30 C 32,30 32,55 32,65 C 32,85 40,100 50,100 C 60,100 68,85 68,65 C 68,55 68,30 50,30 Z" fill="#FFFFFF" />
                    
                    {/* Blush */}
                    <circle cx="33" cy="58" r="4" fill="#FFA5A5" opacity="0.8" />
                    <circle cx="67" cy="58" r="4" fill="#FFA5A5" opacity="0.8" />
                    
                    {/* Eyes */}
                    <circle cx="40" cy="48" r="4.5" fill="#2B3437" />
                    <circle cx="42" cy="46" r="1.5" fill="#FFFFFF" />
                    <circle cx="60" cy="48" r="4.5" fill="#2B3437" />
                    <circle cx="62" cy="46" r="1.5" fill="#FFFFFF" />
                    
                    {/* Beak */}
                    <path d="M 46,51 Q 50,56 54,51 Q 50,49 46,51 Z" fill="#FFAE19" />
                    
                    {/* Left Wing (Flapping) */}
                    <g className="animate-wing-left">
                      <path d="M 22,42 C 10,48 5,58 10,64 C 15,70 24,58 22,42 Z" fill="#2B3437" />
                    </g>
                    
                    {/* Right Wing (Flapping) */}
                    <g className="animate-wing-right">
                      <path d="M 78,42 C 90,48 95,58 90,64 C 85,70 76,58 78,42 Z" fill="#2B3437" />
                    </g>
                    
                    {/* Feet */}
                    <ellipse cx="38" cy="103" rx="7" ry="4" fill="#FFAE19" />
                    <ellipse cx="62" cy="103" rx="7" ry="4" fill="#FFAE19" />
                  </svg>
                </div>
              </div>

              <h3 className="font-display font-extrabold text-[#2B3437] text-lg mb-2 flex items-center justify-center gap-1.5">
                Instructional AI Active
              </h3>
              <p className="text-sm text-[#586A71] leading-relaxed font-medium">{loadingMessage}</p>
              <div className="mt-4 text-[10px] text-slate-400 italic">LMS curriculum engine runs automatically in real-time...</div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Sidebar Placeholder (Clean & Static - No Functionality) */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6 no-print">
            
            {/* Elegant Main Placeholder Card */}
            <div className="w-full bg-white rounded-3xl p-5 border-2 border-slate-100 shadow-xs space-y-5">
              {/* App Status Indicator */}
              <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
                <div className="w-2 h-2 rounded-full bg-[#1EABDA]" />
                <span className="text-xs font-bold text-slate-700 font-display">Lesson Workspace</span>
                <span className="ml-auto text-[10px] bg-sky-50 text-[#1EABDA] px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>

              {/* Navigation Skeleton Placeholders (Disabled / Non-Functional) */}
              <nav className="space-y-2">
                {[
                  { label: "Dashboard", active: true },
                  { label: "Syllabus Analysis", active: false },
                  { label: "Term Configuration", active: false },
                  { label: "Deliverable Specs", active: false },
                  { label: "Material Outlines", active: false },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-xs transition-all duration-200 cursor-not-allowed ${
                      item.active
                        ? "bg-slate-100 text-slate-800 font-bold"
                        : "text-slate-400 font-medium hover:bg-slate-50/50"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-[#36ADAA]" : "bg-slate-300"}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </nav>

              {/* Decorative Skeleton Segment */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="h-1.5 bg-slate-100 rounded-full w-2/3" />
                <div className="h-1.5 bg-slate-100 rounded-full w-1/2" />
              </div>
            </div>

            {/* Visual Companion advice widget featuring our rotating penguin mascot */}
            <div className="bg-[#E9CAB7]/7 border border-[#E9CAB7]/15 rounded-3xl p-4 flex gap-3 relative overflow-hidden font-sans">
              <div className="shrink-0 flex items-center justify-center">
                {/* Rotating miniature penguin mascot */}
                <div className="w-10 h-10 rounded-full bg-white border border-[#9FCDD2] flex items-center justify-center overflow-hidden shrink-0 animate-bounce-subtle">
                  <svg viewBox="0 0 100 120" className="w-6 h-6 animate-[spin_10s_linear_infinite]">
                    <rect x="20" y="25" width="60" height="80" rx="30" fill="#2B3437" />
                    <path d="M 50,30 C 32,30 32,55 32,65 C 32,85 40,100 50,100 C 60,100 68,85 68,65 C 68,55 68,30 50,30 Z" fill="#FFFFFF" />
                    <circle cx="40" cy="48" r="4.5" fill="#2B3437" />
                    <circle cx="60" cy="48" r="4.5" fill="#2B3437" />
                    <path d="M 46,51 Q 50,56 54,51 Q 50,49 46,51 Z" fill="#FFAE19" />
                  </svg>
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-[#DE8431] block uppercase font-display">
                  Mascot Tip
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Workspace Active. Map school curriculum topics to terms seamlessly.
                </p>
              </div>
            </div>

          </aside>

          {/* Right Main Work Area */}
          <div className="flex-1 w-full min-w-0">

        {/* -------------------- STEP 0: CLEAN DASHBOARD -------------------- */}
        {activeStep === 0 && (
          <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            {/* Main Welcome Hero Banner Block */}
            <div className="p-8 md:p-10 bg-radial from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#36ADAA]/15 to-transparent pointer-events-none rounded-full" />
              
              {/* Penguin Mascot - Bottom Right (Wing flapping + Walking Patrol) */}
              <div className="absolute bottom-2 right-4 w-24 h-28 opacity-85 pointer-events-none select-none">
                <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg">
                  {/* Whole penguin group with patrol walking animation */}
                  <g>
                    <animateTransform attributeName="transform" type="translate" values="0 0;-80 0;-80 0;0 0;0 0" dur="6s" repeatCount="indefinite" keyTimes="0;0.4;0.5;0.9;1" calcMode="spline" keySplines="0.4 0 0.6 1;0 0 1 1;0.4 0 0.6 1;0 0 1 1" />
                    
                    {/* Body with gentle walk bob */}
                    <g>
                      <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0;0 -2;0 0" dur="1.2s" repeatCount="indefinite" />
                      
                      {/* Body */}
                      <rect x="20" y="25" width="60" height="80" rx="30" fill="#2B3437" />
                      {/* Belly / Face White background */}
                      <path d="M 50,30 C 32,30 32,55 32,65 C 32,85 40,100 50,100 C 60,100 68,85 68,65 C 68,55 68,30 50,30 Z" fill="#FFFFFF" />
                      
                      {/* Blush */}
                      <circle cx="33" cy="58" r="4" fill="#FFA5A5" opacity="0.8" />
                      <circle cx="67" cy="58" r="4" fill="#FFA5A5" opacity="0.8" />
                      
                      {/* Eyes */}
                      <circle cx="40" cy="48" r="4.5" fill="#2B3437" />
                      <circle cx="42" cy="46" r="1.5" fill="#FFFFFF" />
                      <circle cx="60" cy="48" r="4.5" fill="#2B3437" />
                      <circle cx="62" cy="46" r="1.5" fill="#FFFFFF" />
                      
                      {/* Beak */}
                      <path d="M 46,51 Q 50,56 54,51 Q 50,49 46,51 Z" fill="#FFAE19" />
                      
                      {/* Left Wing (Flapping) */}
                      <g>
                        <path d="M 22,42 C 10,48 5,58 10,64 C 15,70 24,58 22,42 Z" fill="#2B3437">
                          <animateTransform attributeName="transform" type="rotate" values="0 22 42;-20 22 42;0 22 42" dur="1.1s" repeatCount="indefinite" />
                        </path>
                      </g>
                      
                      {/* Right Wing (Flapping) */}
                      <g>
                        <path d="M 78,42 C 90,48 95,58 90,64 C 85,70 76,58 78,42 Z" fill="#2B3437">
                          <animateTransform attributeName="transform" type="rotate" values="0 78 42;20 78 42;0 78 42" dur="1.1s" repeatCount="indefinite" />
                        </path>
                      </g>
                      
                      {/* Left Foot (Walking animation) */}
                      <g>
                        <ellipse cx="38" cy="103" rx="7" ry="4" fill="#FFAE19">
                          <animateTransform attributeName="transform" type="rotate" values="-10 38 103;10 38 103;-10 38 103" dur="0.6s" repeatCount="indefinite" />
                        </ellipse>
                      </g>
                      
                      {/* Right Foot (Walking animation - opposite phase) */}
                      <g>
                        <ellipse cx="62" cy="103" rx="7" ry="4" fill="#FFAE19">
                          <animateTransform attributeName="transform" type="rotate" values="10 62 103;-10 62 103;10 62 103" dur="0.6s" repeatCount="indefinite" />
                        </ellipse>
                      </g>
                    </g>
                  </g>
                </svg>
              </div>

              <div className="relative z-10 space-y-4 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-[#36ADAA]/20 border border-[#36ADAA]/30 px-3 py-1 rounded-full text-xs font-bold text-[#9FCDD2]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  LMS Curricula Intelligence Dashboard
                </div>
                <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight leading-none">
                  Your <span className="text-[#36ADAA]">Course Syllabus</span> Command Center
                </h2>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-semibold max-w-2xl">
                  Inspect module analytics, view term distribution weightages, track session time progression metrics, and review student-facing handouts seamlessly.
                </p>
                
                {/* Dashboard Action Row */}
                <div className="flex flex-wrap gap-3 pt-3">
                </div>
              </div>
            </div>

            {/* Active Curriculum Banner */}
            {extractedData && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Active Curriculum Connected:</strong> Graphs and analytical breakdown tables are updated in real-time with your custom imported <strong>{extractedData.subject}</strong> file.
                </span>
              </div>
            )}

            <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs text-slate-700 font-semibold">
              <div>
                <div className="font-black text-slate-800">Saved Curriculums</div>
                <div>{savedCurriculums.length} curriculum record(s) stored in MongoDB.</div>
              </div>
                <button
                  onClick={() => setActiveStep(6)}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"
                >
                  <Database className="w-3.5 h-3.5" />
                  Open Saved Curriculums
                </button>
            </div>

            {/* Dynamic Metric Counter Bento Units */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
                {/* Metric 1: Subject */}
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-[#36ADAA]/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 shadow-xs flex items-center gap-4 group">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-[#36ADAA]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Subject</span>
                  <h4 className="font-display font-black text-slate-800 text-sm truncate max-w-[160px]">
                    {dashboardSubject ? "1 Subject" : "No Subject"}
                  </h4>
                  <p className="text-[11px] text-slate-450 font-bold font-sans">
                    {dashboardSubject || "Awaiting extraction"}
                  </p>
                </div>
              </div>

              {/* Metric 2: Curriculum */}
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-amber-500/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 shadow-xs flex items-center gap-4 group">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Curriculum</span>
                  <h4 className="font-display font-black text-slate-800 text-sm">
                    {dashboardUnitCount > 0 ? `${dashboardUnitCount} Units` : "0 Units"}
                  </h4>
                  <p className="text-[11px] text-slate-450 font-bold font-sans">
                    {dashboardGradeLevel || "Awaiting extraction"}
                  </p>
                </div>
              </div>

              {/* Metric 3: Terms */}
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-purple-500/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 shadow-xs flex items-center gap-4 group">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Terms</span>
                  <h4 className="font-display font-black text-slate-800 text-sm">
                    {dashboardTermCount > 0 ? `${dashboardTermCount} Terms` : "0 Terms"}
                  </h4>
                  <p className="text-[11px] text-slate-450 font-bold font-sans">
                    {dashboardTermMarks} Total Marks
                  </p>
                </div>
              </div>

              {/* Metric 4: Sessions */}
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-blue-500/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 shadow-xs flex items-center gap-4 group">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Sliders className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Sessions</span>
                  <h4 className="font-display font-black text-slate-800 text-sm">
                    {dashboardSessionCount > 0 ? `${dashboardSessionCount} Sessions` : "0 Sessions"}
                  </h4>
                  <p className="text-[11px] text-slate-450 font-bold font-sans">
                    {dashboardSessionMinutes} Total Minutes
                  </p>
                </div>
              </div>

            </div>

            {/* Advanced Visual Analytics Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Chart Pane 1: Term Weightages Allocation - Interactive Animated */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="p-6 bg-white border-2 border-slate-100 rounded-3xl shadow-xs space-y-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500"
              >
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center justify-between border-b border-slate-50 pb-3"
                >
                  <div>
                    <h3 className="font-display font-black text-slate-800 text-base flex items-center gap-2">
                      Grading Marks Allocation Per Term
                      <motion.span 
                        animate={{ rotate: [0, 5, 0, -5, 0] }}
                        transition={{ duration: 0.6, delay: 0.8, repeat: Infinity, repeatDelay: 8 }}
                        className="inline-block"
                      >
                        📊
                      </motion.span>
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold font-sans">Analytical workload division of chapters</p>
                  </div>
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: 0.5 }}
                    className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-full font-sans uppercase"
                  >
                    Weights Breakdown
                  </motion.span>
                </motion.div>

                {/* Vector SVG Graph Block with Interactive Animations */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-4 rounded-2xl flex flex-col justify-center min-h-[240px] relative overflow-hidden group hover:border-[#36ADAA]/30 transition-all duration-500"
                >
                  {/* Shimmer light overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 pointer-events-none" />
                  
                  {(() => {
                    const activeTerms = termsList;
                    const maxMarks = Math.max(...activeTerms.map(t => t.marks || 10), 50);

                    return (
                      <div className="space-y-4 w-full font-sans">
                        <svg viewBox="0 0 500 180" className="w-full h-auto text-slate-400">
                          <defs>
                            {activeTerms.map((_, i) => (
                              <linearGradient key={`bar-grad-${i}`} id={`barGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor={
                                  ["#36ADAA", "#DE8431", "#1EABDA", "#94a3b8"][i % 4]
                                } stopOpacity={0.8} />
                                <stop offset="100%" stopColor={
                                  ["#36ADAA", "#DE8431", "#1EABDA", "#94a3b8"][i % 4]
                                } stopOpacity={1} />
                              </linearGradient>
                            ))}
                          </defs>
                          
                          {/* Grid Lines with fade-in */}
                          <line x1="70" y1="20" x2="450" y2="20" stroke="#f1f5f9" strokeWidth="1">
                            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.2s" fill="freeze" />
                          </line>
                          <line x1="70" y1="65" x2="450" y2="65" stroke="#f1f5f9" strokeWidth="1">
                            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.3s" fill="freeze" />
                          </line>
                          <line x1="70" y1="110" x2="450" y2="110" stroke="#f1f5f9" strokeWidth="1">
                            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.4s" fill="freeze" />
                          </line>
                          <line x1="70" y1="155" x2="450" y2="155" stroke="#e2e8f0" strokeWidth="1.2">
                            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.5s" fill="freeze" />
                          </line>

                          {/* Axis coordinates with subtle entrance */}
                          <text x="70" y="170" className="text-[9px] fill-slate-400 font-extrabold" textAnchor="middle">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.6s" fill="freeze" />
                            0%
                          </text>
                          <text x="165" y="170" className="text-[9px] fill-slate-400 font-extrabold" textAnchor="middle">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.7s" fill="freeze" />
                            25%
                          </text>
                          <text x="260" y="170" className="text-[9px] fill-slate-400 font-extrabold" textAnchor="middle">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.8s" fill="freeze" />
                            50%
                          </text>
                          <text x="355" y="170" className="text-[9px] fill-slate-400 font-extrabold" textAnchor="middle">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.9s" fill="freeze" />
                            75%
                          </text>
                          <text x="450" y="170" className="text-[9px] fill-slate-400 font-extrabold" textAnchor="middle">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.0s" fill="freeze" />
                            100%
                          </text>

                          {activeTerms.map((tRow, iIdx) => {
                            const barPct = (tRow.marks / maxMarks) * 350; 
                            const yVal = 25 + iIdx * 45;
                            const barColor = ["#36ADAA", "#DE8431", "#1EABDA", "#94a3b8"][iIdx % 4];
                            const delay = 0.6 + iIdx * 0.2;

                            return (
                              <g key={iIdx} className="group cursor-pointer">
                                {/* Term label with slide-in */}
                                <text x="10" y={yVal + 14} className="text-[10px] font-black fill-slate-650 font-display">
                                  <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${delay}s`} fill="freeze" />
                                  {tRow.term || `Term ${iIdx + 1}`}
                                </text>
                                
                                {/* Background Rail */}
                                <rect x="70" y={yVal} width="380" height="20" rx="7" fill="#f1f5f9" opacity={0.7} />
                                
                                {/* Animated colored fill bar - grows from left */}
                                <rect 
                                  x="70" 
                                  y={yVal} 
                                  width="0" 
                                  height="20" 
                                  rx="7" 
                                  fill={`url(#barGrad${iIdx})`}
                                >
                                  <animate 
                                    attributeName="width" 
                                    from="0" 
                                    to={barPct} 
                                    dur="0.8s" 
                                    begin={`${delay}s`} 
                                    fill="freeze"
                                    calcMode="spline"
                                    keySplines="0.34 1 0.64 1"
                                  />
                                </rect>
                                
                                {/* Shimmer overlay on bar */}
                                <rect x="70" y={yVal} width={barPct} height="20" rx="7" fill="white" opacity="0">
                                  <animate attributeName="opacity" values="0;0.3;0" dur="1.5s" begin={`${delay + 0.8}s`} repeatCount="2" fill="freeze" />
                                </rect>

                                {/* Numeric marker label - count-up appearance */}
                                <text 
                                  x={75 + barPct} 
                                  y={yVal + 14} 
                                  className="text-[10px] font-bold fill-slate-800"
                                  opacity="0"
                                >
                                  <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${delay + 0.6}s`} fill="freeze" />
                                  {tRow.marks} Marks
                                </text>
                                
                                {/* Hover tooltip - appears on group hover */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <rect 
                                    x={Math.min(75 + barPct, 380)} 
                                    y={yVal - 28} 
                                    width={100} 
                                    height="22" 
                                    rx="6" 
                                    fill="#2B3437" 
                                    className="drop-shadow-lg"
                                  />
                                  <text 
                                    x={Math.min(75 + barPct + 50, 430)} 
                                    y={yVal - 13} 
                                    className="text-[8px] font-bold fill-white" 
                                    textAnchor="middle"
                                  >
                                    {tRow.unitName || `${tRow.marks} pts`}
                                  </text>
                                </g>
                              </g>
                            );
                          })}
                        </svg>
                        
                        {/* Floating animated summary badges */}
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.5 }}
                          className="flex flex-wrap gap-2 justify-center text-[10px]"
                        >
                          {activeTerms.map((t, idx) => (
                            <motion.span
                              key={idx}
                              whileHover={{ scale: 1.1, y: -2 }}
                              className="px-2.5 py-1 rounded-full font-bold"
                              style={{
                                backgroundColor: [`rgba(54,173,170,0.1)`, `rgba(222,132,49,0.1)`, `rgba(30,171,218,0.1)`, `rgba(148,163,184,0.1)`][idx % 4],
                                color: [`#36ADAA`, `#DE8431`, `#1EABDA`, `#586A71`][idx % 4]
                              }}
                            >
                              {t.term}: {Math.round((t.marks / maxMarks) * 100)}% weight
                            </motion.span>
                          ))}
                        </motion.div>
                      </div>
                    );
                  })()}
                </motion.div>
                
                {/* Insights commentary under Chart */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                  className="p-3.5 bg-gradient-to-r from-[#36ADAA]/5 to-[#36ADAA]/10 border border-[#36ADAA]/10 rounded-2xl flex items-start gap-2 text-xs text-slate-600 font-sans"
                >
                  <motion.span
                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                  >
                    <Info className="w-4 h-4 text-[#36ADAA] shrink-0 mt-0.5" />
                  </motion.span>
                  <p className="font-semibold leading-relaxed">
                    <strong>Workload Intelligence:</strong> Chapters and grade-weights are distributed across distinct evaluation periods. This prevents high stress overloads near final exams.
                  </p>
                </motion.div>
              </motion.div>


              {/* Chart Pane 2: Workload Progress Timeline Area Graph - Interactive Animated */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="p-6 bg-white border-2 border-slate-100 rounded-3xl shadow-xs space-y-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500"
              >
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="flex items-center justify-between border-b border-slate-50 pb-3"
                >
                  <div>
                    <h3 className="font-display font-black text-slate-800 text-base flex items-center gap-2">
                      Cumulative Course Timing Progression
                      <motion.span 
                        animate={{ rotate: [0, 5, 0, -5, 0] }}
                        transition={{ duration: 0.6, delay: 1.0, repeat: Infinity, repeatDelay: 10 }}
                        className="inline-block"
                      >
                        📈
                      </motion.span>
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold font-sans">Linear workload accumulation trajectory minutes</p>
                  </div>
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: 0.6 }}
                    className="px-2.5 py-1 text-[10px] font-bold bg-purple-50 text-purple-700 rounded-full font-sans uppercase"
                  >
                    Timeline Curve
                  </motion.span>
                </motion.div>

                {/* Vector SVG Graph Block - Interactive Timeline */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-4 rounded-2xl flex flex-col justify-center min-h-[240px] relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500"
                >
                  {/* Shimmer light overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 pointer-events-none" />
                  
                  {(() => {
                    const activeOutline = sessionsOutline;
                    
                    let cumValue = 0;
                    const pointsList = activeOutline.map((item, idx) => {
                      cumValue += item.duration || 45;
                      return {
                        num: item.sessionNumber,
                        dur: item.duration || 45,
                        cum: cumValue
                      };
                    }).slice(0, 8); // Slice 8 points max to avoid crowding

                    const totalMax = cumValue || 225;
                    const chartW = 380;
                    const chartH = 130;
                    const xOffset = 60;
                    const yOffset = 150;

                    const coordPoints = pointsList.map((pt, index) => {
                      const fraction = pointsList.length > 1 ? index / (pointsList.length - 1) : 1;
                      const x = xOffset + fraction * chartW;
                      const y = yOffset - (pt.cum / totalMax) * chartH;
                      return { x, y, ...pt };
                    });

                    const lineD = coordPoints.length > 0
                      ? `M ${coordPoints.map(p => `${p.x},${p.y}`).join(" L ")}`
                      : "";

                    const areaD = coordPoints.length > 0
                      ? `${lineD} L ${coordPoints[coordPoints.length - 1].x},${yOffset} L ${coordPoints[0].x},${yOffset} Z`
                      : "";

                    return (
                      <div className="w-full font-sans">
                        <svg viewBox="0 0 500 180" className="w-full h-auto text-slate-400" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="gGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                              <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.1" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>

                          {/* Coordinate grids with fade-in */}
                          <line x1="60" y1={yOffset} x2="440" y2={yOffset} stroke="#e2e8f0" strokeWidth="1.2">
                            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.3s" fill="freeze" />
                          </line>
                          <line x1="60" y1={yOffset - chartH * 0.5} x2="440" y2={yOffset - chartH * 0.5} stroke="#f1f5f9" strokeDasharray="3,3">
                            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.4s" fill="freeze" />
                          </line>
                          <line x1="60" y1={yOffset - chartH} x2="440" y2={yOffset - chartH} stroke="#e2e8f0">
                            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.5s" fill="freeze" />
                          </line>

                          {/* Coordinates labels with slide-in */}
                          <text x="50" y={yOffset} className="text-[8px] fill-slate-400 font-bold" textAnchor="end">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.6s" fill="freeze" />
                            0 min
                          </text>
                          <text x="50" y={yOffset - chartH * 0.5} className="text-[8px] fill-slate-400 font-bold" textAnchor="end">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.7s" fill="freeze" />
                            {Math.round(totalMax / 2)}m
                          </text>
                          <text x="50" y={yOffset - chartH} className="text-[8px] fill-slate-400 font-bold" textAnchor="end">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.8s" fill="freeze" />
                            {totalMax}m
                          </text>

                          {/* Filled Shaded Area with gradient animation */}
                          {areaD && (
                            <path d={areaD} fill="url(#gGrad2)">
                              <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0.5s" fill="freeze" />
                            </path>
                          )}

                          {/* Glowing Main Trace Stroke with draw animation */}
                          {lineD && (
                            <path 
                              d={lineD} 
                              stroke="url(#gGrad2)" 
                              strokeWidth="3" 
                              fill="none" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              filter="url(#glow)"
                              className="hover:stroke-purple-400 transition-colors duration-300"
                              strokeDasharray="1000"
                              strokeDashoffset="1000"
                            >
                              <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.2s" begin="0.6s" fill="freeze" />
                            </path>
                          )}

                          {/* Data points with staggered entrance */}
                          {coordPoints.map((pt, iIdx) => (
                            <g key={iIdx} className="group cursor-pointer">
                              {/* Pulsing outer glow ring */}
                              <circle 
                                cx={pt.x} 
                                cy={pt.y} 
                                r="10" 
                                fill="#8b5cf6" 
                                opacity="0.15"
                                className="group-hover:opacity-30 transition-opacity duration-300"
                              >
                                <animate attributeName="r" values="7;11;7" dur="2s" repeatCount="indefinite" begin={`${0.8 + iIdx * 0.2}s`} />
                              </circle>
                              
                              {/* Animated dot */}
                              <circle 
                                cx={pt.x} 
                                cy={pt.y} 
                                r="0" 
                                fill="#8b5cf6" 
                                stroke="#ffffff" 
                                strokeWidth="3" 
                                className="transition-all duration-300 group-hover:fill-purple-700 group-hover:stroke-2"
                              >
                                <animate attributeName="r" from="0" to="6" dur="0.4s" begin={`${0.8 + iIdx * 0.15}s`} fill="freeze" calcMode="spline" keySplines="0.34 1 0.64 1" />
                              </circle>
                              
                              {/* Session label */}
                              <text x={pt.x} y={yOffset + 14} className="text-[8px] font-extrabold fill-slate-500" textAnchor="middle">
                                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${1.0 + iIdx * 0.15}s`} fill="freeze" />
                                S-{pt.num}
                              </text>
                              
                              {/* Hover tooltip with smooth animation */}
                              <g className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <rect x={pt.x - 36} y={pt.y - 26} width="72" height="20" rx="6" fill="#2B3437" className="drop-shadow-lg">
                                </rect>
                                <text x={pt.x} y={pt.y - 12} className="text-[8px] font-bold fill-white" textAnchor="middle">
                                  +{pt.dur}min ({pt.cum}m)
                                </text>
                              </g>
                            </g>
                          ))}
                        </svg>

                        {/* Interactive timeline summary */}
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.5 }}
                          className="flex flex-wrap justify-between items-center pt-2 text-[10px] text-slate-500"
                        >
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className="font-semibold flex items-center gap-1"
                          >
                            <motion.span 
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                              className="inline-block w-2 h-2 rounded-full bg-purple-500" 
                            />
                            Cumulative: {totalMax}m total
                          </motion.span>
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className="font-semibold"
                          >
                            {pointsList.length} sessions · avg {(totalMax / pointsList.length).toFixed(0)}m/session
                          </motion.span>
                        </motion.div>
                        
                        {/* Live session dots indicator */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.8 }}
                          className="flex gap-1 justify-center pt-1"
                        >
                          {pointsList.map((_, idx) => (
                            <motion.span
                              key={idx}
                              animate={{ 
                                scale: [1, 1.1, 1],
                                backgroundColor: [`#8b5cf6`, `#a78bfa`, `#8b5cf6`]
                              }}
                              transition={{ duration: 2, delay: idx * 0.3, repeat: Infinity }}
                              className="inline-block w-1.5 h-1.5 rounded-full"
                            />
                          ))}
                        </motion.div>
                      </div>
                    );
                  })()}
                </motion.div>
                
                {/* Timeline Insight */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 }}
                  className="p-3.5 bg-gradient-to-r from-purple-500/5 to-purple-500/10 border border-purple-500/10 rounded-2xl flex items-start gap-2 text-xs text-slate-600 font-sans"
                >
                  <motion.span
                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <Clock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  </motion.span>
                  <p className="font-semibold leading-relaxed">
                    <strong>Weekly Timing Meter:</strong> Tracks your cumulative lectures footprint. Class S-1 to S-5 delivers a highly optimized workload for balanced student comprehension.
                  </p>
                </motion.div>
              </motion.div>

            </div>

            {/* Comprehensive Detail Tabs Inspector Dashboard Module */}
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-4">
                <div>
                  <h3 className="text-lg font-display font-black text-slate-800">Quick Access</h3>
                  <p className="text-xs text-slate-400 font-semibold font-sans">Navigate to key sections of your workspace</p>
                </div>
                
                {/* Tabs Selector list */}
                <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100 self-start">
                  {[
                    { id: "curriculum", label: "🎯 Syllabus Topics", icon: BookOpen },
                    { id: "terms", label: "📅 Term Schedule", icon: Calendar },
                    { id: "timeline", label: "📋 Lecture Roadmaps", icon: Sliders },
                    { id: "objectives", label: "💡 Key Deliverables", icon: CheckCircle2 }
                  ].map(tabItem => {
                    const TabIcon = tabItem.icon;
                    return (
                      <button
                        key={tabItem.id}
                        onClick={() => setDashboardTab(tabItem.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          dashboardTab === tabItem.id
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tabItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Display Section 1: Syllabus Topics */}
              {dashboardTab === "curriculum" && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out] font-sans">
                  {(() => {
                    const activeUnits = extractedData?.units || [];

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeUnits.map((chapterItem, idx) => (
                          <div key={idx} className="p-5 border-2 border-slate-50 bg-slate-50/20 rounded-2xl hover:border-teal-500/20 transition space-y-3">
                            <span className="text-[10px] font-black tracking-widest uppercase bg-slate-150 text-slate-800 px-2.5 py-0.5 rounded-full">
                              Unit {chapterItem.unitId || idx + 1}
                            </span>
                            <h4 className="font-display font-extrabold text-[#36ADAA] text-sm md:text-base leading-none">
                              {chapterItem.unitName}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                              {chapterItem.description}
                            </p>
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                              {chapterItem.topics?.map((topic, tIdx) => (
                                <span key={tIdx} className="px-2 py-1 bg-white border border-slate-150 rounded-lg text-[10px] font-bold text-slate-650">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab Display Section 2: Term Weightages */}
              {dashboardTab === "terms" && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out] font-sans">
                  {(() => {
                    const activeTerms = termPlans.length > 0
                      ? termPlans.flatMap((plan) =>
                        (plan.terms || []).map((term) => ({
                          className: plan.class_name || "Curriculum",
                          term: term.term_title,
                          unitName: getTermContentRows(term).map((row) => row.unit_name || "Untitled Unit").join(", "),
                          chapters: getTermContentRows(term).flatMap((row) => row.chapter_names || row.chapters?.map((chapter) => chapter.chapter_name || "").filter(Boolean) || []),
                          marks: Number(getTermSummaryValue(term, "marks") || 0),
                        }))
                      )
                      : termsList;

                    return (
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100 uppercase tracking-widest text-[9px]">
                            <tr>
                              <th className="p-4">Period</th>
                              <th className="p-4">Allocated Module Unit Focus</th>
                              <th className="p-4">Sub-Chapters Assigned</th>
                              <th className="p-4 text-right">Evaluation Weight</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-slate-650 font-semibold font-sans">
                            {activeTerms.map((termItem, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition">
                                <td className="p-4 font-display font-black text-slate-800">
                                  {"className" in termItem && termItem.className ? `${termItem.className} - ${termItem.term}` : termItem.term}
                                </td>
                                <td className="p-4 text-[#36ADAA] font-bold">{termItem.unitName}</td>
                                <td className="p-4 whitespace-normal max-w-xs">
                                  <div className="flex flex-wrap gap-1">
                                    {termItem.chapters?.map((ch, cIdx) => (
                                      <span key={cIdx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                        {ch}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 text-right font-black text-slate-900">{termItem.marks} Marks</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab Display Section 3: Sessions Timeline */}
              {dashboardTab === "timeline" && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out] font-sans">
                  {(() => {
                    const activeOutline = sessionsOutline;

                    return (
                      <div className="space-y-3">
                        {activeOutline.map((sess, idx) => (
                          <div key={idx} className="p-4 border border-slate-100 bg-white hover:border-purple-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 text-xs font-black flex items-center justify-center shrink-0">
                                S-{sess.sessionNumber}
                              </span>
                              <div>
                                <h4 className="font-display font-extrabold text-slate-800 text-sm">{sess.title}</h4>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 font-semibold pt-1">
                                  {sess.learningOutcomes?.map((out, oIdx) => (
                                    <span key={oIdx} className="flex items-center gap-1">
                                      <Check className="w-3 h-3 text-[#36ADAA]" /> {out}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl shrink-0 self-start md:self-center">
                              ⏰ {sess.duration || 45} mins duration
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab Display Section 4: Academic Deliverables */}
              {dashboardTab === "objectives" && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out] font-sans text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Deliverable 1 */}
                    <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center"><Printer className="w-4 h-4 text-[#36ADAA]" /></div>
                      <h4 className="font-display font-black text-slate-800 text-xs">PPT Slide Outline Decks</h4>
                      <p className="text-slate-450 font-semibold leading-relaxed font-sans text-[11px]">
                        Structured presentation materials detailing slide-by-slide titles and speaker commentary content hooks.
                      </p>
                      <span className="inline-block text-[10px] font-bold text-[#36ADAA] uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-md pt-0.5">
                        Interactive Setup
                      </span>
                    </div>

                    {/* Deliverable 2 */}
                    <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><FileText className="w-4 h-4 text-emerald-600" /></div>
                      <h4 className="font-display font-black text-slate-800 text-xs">Class Handouts Summary</h4>
                      <p className="text-slate-450 font-semibold leading-relaxed font-sans text-[11px]">
                        Pedagogical summary blueprints representing direct student worksheets filled with diagrams and formulas keys.
                      </p>
                      <span className="inline-block text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md pt-0.5">
                        Docx/PDF Compatible
                      </span>
                    </div>

                    {/* Deliverable 3 */}
                    <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><Smile className="w-4 h-4 text-purple-600" /></div>
                      <h4 className="font-display font-black text-slate-800 text-xs">Homework Assessment Tasks</h4>
                      <p className="text-slate-450 font-semibold leading-relaxed font-sans text-[11px]">
                        Creative assignments and critical review worksheets including numerical computations for post-class evaluation.
                      </p>
                      <span className="inline-block text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md pt-0.5">
                        Student Worksheets
                      </span>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Direct Navigation Quick Access */}
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-center font-sans">
              <button
                onClick={() => setActiveStep(1)}
                className="p-5 bg-white hover:border-[#36ADAA]/30 hover:shadow-md hover:-translate-y-0.5 border-2 border-slate-100 rounded-2xl transition-all duration-300 space-y-2 focus:ring-2 focus:ring-[#36ADAA] group"
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-5 h-5 text-[#36ADAA]" />
                </div>
                <p className="text-xs font-black text-slate-800 font-display">Syllabus Import</p>
                <p className="text-[10px] text-slate-400 font-medium">Upload & extract curriculum</p>
              </button>
              <button
                onClick={() => setActiveStep(2)}
                className="p-5 bg-white hover:border-[#36ADAA]/30 hover:shadow-md hover:-translate-y-0.5 border-2 border-slate-100 rounded-2xl transition-all duration-300 space-y-2 focus:ring-2 focus:ring-[#36ADAA] group"
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-xs font-black text-slate-800 font-display">Term Allocations</p>
                <p className="text-[10px] text-slate-400 font-medium">Divide into academic terms</p>
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="p-5 bg-white hover:border-[#36ADAA]/30 hover:shadow-md hover:-translate-y-0.5 border-2 border-slate-100 rounded-2xl transition-all duration-300 space-y-2 focus:ring-2 focus:ring-[#36ADAA] group"
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Sliders className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-xs font-black text-slate-800 font-display">Lesson Milestones</p>
                <p className="text-[10px] text-slate-400 font-medium">Configure session specs</p>
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="p-5 bg-white hover:border-[#36ADAA]/30 hover:shadow-md hover:-translate-y-0.5 border-2 border-slate-100 rounded-2xl transition-all duration-300 space-y-2 focus:ring-2 focus:ring-[#36ADAA] group"
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-xs font-black text-slate-800 font-display">Asset Handouts</p>
                <p className="text-[10px] text-slate-400 font-medium">Generate session materials</p>
              </button>
              <button
                onClick={() => setActiveStep(5)}
                className="p-5 bg-white hover:border-[#36ADAA]/30 hover:shadow-md hover:-translate-y-0.5 border-2 border-slate-100 rounded-2xl transition-all duration-300 space-y-2 focus:ring-2 focus:ring-[#36ADAA] group"
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs font-black text-slate-800 font-display">Assessment Generator</p>
                <p className="text-[10px] text-slate-400 font-medium">Build blueprint, paper, keys, and scheme</p>
              </button>
              <button
                onClick={() => setActiveStep(6)}
                className="p-5 bg-white hover:border-[#36ADAA]/30 hover:shadow-md hover:-translate-y-0.5 border-2 border-slate-100 rounded-2xl transition-all duration-300 space-y-2 focus:ring-2 focus:ring-[#36ADAA] group"
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Database className="w-5 h-5 text-slate-700" />
                </div>
                <p className="text-xs font-black text-slate-800 font-display">Saved Curriculums</p>
                <p className="text-[10px] text-slate-400 font-medium">Open or delete stored records</p>
              </button>
            </div>

          </div>
        )}

        {activeStep === 5 && (
          <div className="space-y-8 animate-fadeIn">
            {!selectedTermRow ? (
              <div className="bg-white p-12 rounded-3xl border-2 border-slate-100 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-[#2B3437] text-xl">
                    Assessment Generator Needs a Selected Term
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Pick the active term first so the paper uses only that term's units, chapters, topics, and session coverage.
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-3 bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Go to Step 2: Terms
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold min-w-0 text-[#586A71]">
                        <span>Step 5 of LMS Planner</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[#36ADAA]">{selectedTermName}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-emerald-600">Assessment Generator</span>
                      </div>
                      <button
                        onClick={() => setActiveStep(4)}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </button>
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">
                        Assessment Generator
                      </h2>
                      <p className="text-slate-500 text-xs">
                        Generate a CBSE-style term paper, answer key, marking scheme, and blueprint using only the selected term content.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xs space-y-5">
                      <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Settings className="w-4 h-4" />
                        </div>
                        <h3 className="font-display font-extrabold text-slate-800 text-sm">Exam Controls</h3>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                            <div className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Class</div>
                            <div className="mt-1 font-extrabold text-slate-800">{selectedTermRow.className || extractedData?.gradeLevel}</div>
                          </div>
                          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                            <div className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Subject</div>
                            <div className="mt-1 font-extrabold text-slate-800">{extractedData?.subject}</div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <div className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Selected Term</div>
                          <div className="mt-1 font-extrabold text-slate-800">{selectedTermName}</div>
                        </div>

                        <label className="block space-y-1">
                          <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Exam Type</span>
                          <select
                            value={assessmentConfig.paper_type}
                            onChange={(e) => setAssessmentConfig((prev) => ({ ...prev, paper_type: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            <option value="term_exam">Term Exam</option>
                            <option value="mid_term">Mid Term</option>
                            <option value="periodic_test">Periodic Test</option>
                            <option value="unit_test">Unit Test</option>
                          </select>
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="block space-y-1">
                            <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Total Marks</span>
                            <input
                              type="number"
                              min={10}
                              max={200}
                              value={assessmentConfig.total_marks}
                              onChange={(e) => setAssessmentConfig((prev) => ({ ...prev, total_marks: Math.max(10, Number(e.target.value) || 10) }))}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Duration</span>
                            <input
                              type="number"
                              min={30}
                              max={360}
                              value={assessmentConfig.duration_minutes}
                              onChange={(e) => setAssessmentConfig((prev) => ({ ...prev, duration_minutes: Math.max(30, Number(e.target.value) || 30) }))}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                            />
                          </label>
                        </div>

                        <label className="block space-y-1">
                          <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Number of Sets</span>
                          <select
                            value={assessmentConfig.set_count}
                            onChange={(e) => setAssessmentConfig((prev) => ({ ...prev, set_count: Number(e.target.value) }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            <option value={1}>1 Set</option>
                            <option value={2}>2 Sets</option>
                            <option value={3}>3 Sets</option>
                          </select>
                        </label>

                        <button
                          onClick={handleGenerateAssessment}
                          className="w-full bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Assessment Package
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xs space-y-4">
                      <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                          <Info className="w-4 h-4" />
                        </div>
                        <h3 className="font-display font-extrabold text-slate-800 text-sm">Term Coverage Preview</h3>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <div className="text-slate-400 uppercase font-bold tracking-wider text-[10px] mb-1">Covered Units</div>
                          <div className="flex flex-wrap gap-1.5">
                            {coveredUnitsForAssessment.map((unit) => (
                              <span key={unit} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{unit}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 uppercase font-bold tracking-wider text-[10px] mb-1">Covered Chapters</div>
                          <div className="flex flex-wrap gap-1.5">
                            {coveredChaptersForAssessment.map((chapter) => (
                              <span key={chapter} className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">{chapter}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 uppercase font-bold tracking-wider text-[10px] mb-1">Covered Topics</div>
                          <div className="max-h-32 overflow-y-auto flex flex-wrap gap-1.5">
                            {coveredTopicsForAssessment.length > 0 ? coveredTopicsForAssessment.map((topic) => (
                              <span key={topic} className="px-2 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold">{topic}</span>
                            )) : (
                              <span className="text-slate-400">Topics will populate from the selected term hierarchy.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xs space-y-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-display font-extrabold text-slate-800 text-lg">Assessment Output</h3>
                          <p className="text-xs text-slate-500">Preview the blueprint first, then inspect the paper, keys, and marking guidance.</p>
                        </div>
                        {assessmentResult && (
                          <div className="flex flex-wrap items-center gap-2">
                            {generatedSetLabels.length > 1 && (
                              <select
                                value={selectedSet}
                                onChange={(e) => setSelectedSet(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                              >
                                {generatedSetLabels.map((label) => (
                                  <option key={label} value={label}>{label}</option>
                                ))}
                              </select>
                            )}
                            <select
                              value={assessmentExportType}
                              onChange={(e) => setAssessmentExportType(e.target.value)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              <option value="all">Full Package</option>
                              <option value="question_paper">Question Paper</option>
                              <option value="answer_key">Answer Key</option>
                              <option value="marking_scheme">Marking Scheme</option>
                              <option value="blueprint">Blueprint</option>
                            </select>
                            <select
                              value={assessmentExportFormat}
                              onChange={(e) => setAssessmentExportFormat(e.target.value)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              <option value="json">JSON</option>
                              <option value="pdf">PDF</option>
                              <option value="docx">DOCX</option>
                            </select>
                            <button
                              onClick={handleExportAssessment}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#2B3437] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Export
                            </button>
                          </div>
                        )}
                      </div>

                      {!assessmentResult ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                            <Trophy className="w-7 h-7" />
                          </div>
                          <h4 className="font-display font-extrabold text-slate-800">Blueprint, question paper, key, and scheme will appear here</h4>
                          <p className="mt-2 text-sm text-slate-500">Use the exam controls to generate the assessment package for the selected term.</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div className="flex flex-wrap gap-2">
                            {[
                              ["blueprint", "Blueprint"],
                              ["question_paper", "Question Paper"],
                              ["answer_key", "Answer Key"],
                              ["marking_scheme", "Marking Scheme"],
                            ].map(([id, label]) => (
                              <button
                                key={id}
                                onClick={() => setAssessmentTab(id as any)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                                  assessmentTab === id
                                    ? "bg-[#36ADAA] text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {assessmentTab === "blueprint" && assessmentBlueprint && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                                <div className="font-extrabold text-slate-800 mb-3">Blueprint Summary</div>
                                <div className="space-y-2 text-slate-600">
                                  <div>Total marks: <span className="font-bold text-slate-800">{assessmentBlueprint.total_marks}</span></div>
                                  <div>Duration: <span className="font-bold text-slate-800">{assessmentBlueprint.duration_minutes} mins</span></div>
                                  <div>Difficulty: <span className="font-bold text-slate-800">{assessmentBlueprint.difficulty_distribution.easy}% / {assessmentBlueprint.difficulty_distribution.medium}% / {assessmentBlueprint.difficulty_distribution.hard}%</span></div>
                                </div>
                              </div>
                              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                                <div className="font-extrabold text-slate-800 mb-3">Validation Report</div>
                                <div className="space-y-2 text-slate-600">
                                  <div>Selected term only: <span className="font-bold text-slate-800">{assessmentBlueprint.validation_report.uses_only_selected_term_content ? "Yes" : "No"}</span></div>
                                  <div>Total marks valid: <span className="font-bold text-slate-800">{assessmentBlueprint.validation_report.total_marks_valid ? "Yes" : "No"}</span></div>
                                  <div>Answers complete: <span className="font-bold text-slate-800">{assessmentBlueprint.validation_report.all_questions_have_answers ? "Yes" : "No"}</span></div>
                                  <div>Subjective scheme complete: <span className="font-bold text-slate-800">{assessmentBlueprint.validation_report.all_subjective_questions_have_marking_scheme ? "Yes" : "No"}</span></div>
                                </div>
                              </div>
                              <div className="lg:col-span-2 rounded-2xl border border-slate-200 p-4">
                                <div className="font-extrabold text-slate-800 mb-3">Section Distribution</div>
                                <div className="space-y-2">
                                  {assessmentBlueprint.section_distribution.map((section) => (
                                    <div key={section.section} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                      <span className="font-bold text-slate-800">{section.section}. {section.label}</span>
                                      <span className="text-slate-600">{section.questions_count} x {section.marks_per_question} = {section.marks} marks</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {assessmentTab === "question_paper" && selectedQuestionPaper && (
                            <div className="space-y-4">
                              {Object.values(selectedQuestionPaper.sections).map((section) => (
                                <div key={section.section} className="rounded-2xl border border-slate-200 overflow-hidden">
                                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                                    <div className="font-extrabold text-slate-800">{section.section}. {section.label}</div>
                                    <div className="text-xs font-semibold text-slate-500">{section.marks} marks</div>
                                  </div>
                                  <div className="divide-y divide-slate-100">
                                    {section.questions.map((question) => (
                                      <div key={question.question_id} className="px-4 py-3 text-xs space-y-2">
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="font-bold text-slate-800">{question.question_id}. {question.question_text}</div>
                                          <div className="text-slate-500 font-semibold">{question.marks} mark{question.marks > 1 ? "s" : ""}</div>
                                        </div>
                                        {question.options?.length > 0 && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600">
                                            {question.options.map((option, index) => (
                                              <div key={index} className="rounded-lg bg-slate-50 px-3 py-2">{option}</div>
                                            ))}
                                          </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 text-[11px]">
                                          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{question.unit || "Unit not set"}</span>
                                          <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 font-semibold">{question.chapter || "Chapter not set"}</span>
                                          <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold">{question.topic || "Topic not set"}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {assessmentTab === "answer_key" && selectedAnswerKey && (
                            <div className="space-y-3">
                              {selectedAnswerKey.answers.map((answer) => (
                                <div key={answer.question_id} className="rounded-2xl border border-slate-200 p-4 text-xs space-y-2">
                                  <div className="font-extrabold text-slate-800">{answer.question_id}</div>
                                  <div className="text-slate-700"><span className="font-bold">Correct answer:</span> {answer.correct_answer}</div>
                                  <div className="text-slate-600">{answer.explanation}</div>
                                  {answer.steps?.length > 0 && (
                                    <ol className="list-decimal pl-5 text-slate-600 space-y-1">
                                      {answer.steps.map((step, index) => (
                                        <li key={index}>{step}</li>
                                      ))}
                                    </ol>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {assessmentTab === "marking_scheme" && selectedMarkingScheme && (
                            <div className="space-y-3">
                              {selectedMarkingScheme.schemes.map((scheme) => (
                                <div key={scheme.question_id} className="rounded-2xl border border-slate-200 p-4 text-xs space-y-2">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="font-extrabold text-slate-800">{scheme.question_id}</div>
                                    <div className="text-slate-500 font-semibold">{scheme.total_marks} marks</div>
                                  </div>
                                  <div className="text-slate-600"><span className="font-bold text-slate-800">Value points:</span> {scheme.value_points.join(" | ")}</div>
                                  <div className="space-y-1">
                                    {scheme.partial_marking.map((item, index) => (
                                      <div key={index} className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">{item.point} - {item.marks}</div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeStep === 6 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold min-w-0 text-[#586A71]">
                    <span>Saved Curriculums</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#36ADAA]">MongoDB Library</span>
                  </div>
                  <button
                    onClick={() => setActiveStep(0)}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                </div>
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">
                    Saved Curriculums
                  </h2>
                  <p className="text-slate-500 text-xs">
                    MongoDB is the source of truth for extracted curriculum records. Reopen any saved curriculum or remove records you no longer need.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Records</div>
                <div className="mt-2 text-2xl font-display font-black text-slate-800">{savedCurriculums.length}</div>
                <div className="text-xs text-slate-500 font-semibold">Curriculums stored in MongoDB</div>
              </div>
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saved Terms</div>
                <div className="mt-2 text-2xl font-display font-black text-slate-800">
                  {savedCurriculums.reduce((sum, curriculum) => sum + getSavedTermCount(curriculum), 0)}
                </div>
                <div className="text-xs text-slate-500 font-semibold">Term plans stored with saved curriculums</div>
              </div>
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Action</div>
                <button
                  onClick={() => void fetchSavedCurriculums()}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh List
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="text-lg font-display font-black text-slate-800">Curriculum Records</h3>
                <p className="text-xs text-slate-400 font-semibold">Open a record to restore it into the workspace, or delete it permanently.</p>
              </div>

              {savedCurriculums.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-slate-500 font-semibold">
                  No saved curriculums yet. Run an extraction to create your first MongoDB record.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {savedCurriculums.map((curriculum) => {
                    const savedTermCount = getSavedTermCount(curriculum);

                    return (
                      <div key={curriculum._id} className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-display font-black text-slate-800">{curriculum.subject}</span>
                          {currentCurriculumId === curriculum._id && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Active</span>
                          )}
                          {savedTermCount > 0 && (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                              {savedTermCount} saved {savedTermCount === 1 ? "term" : "terms"}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">{curriculum.gradeLevel}</div>
                        <div className="mt-1 text-[11px] text-slate-400 font-medium break-all">{curriculum.fileName || "Untitled upload"} • {new Date(curriculum.updatedAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {savedTermCount > 0 && (
                          <button
                            onClick={() => void handleOpenSavedTerms(curriculum._id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Open Saved Terms
                          </button>
                        )}
                        <button
                          onClick={() => void handleOpenSavedCurriculum(curriculum._id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Open Curriculum
                        </button>
                        <button
                          onClick={() => void handleDeleteSavedCurriculum(curriculum._id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- STEP 1: LOAD & EXTRACT CURRICULUM -------------------- */}
        {activeStep === 1 && (
          <div className="space-y-8 animate-fadeIn">

            {/* Step 1 header */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold min-w-0 text-[#586A71]">
                    <span>Step 1 of LMS Planner</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#36ADAA]">Curriculum Extraction</span>
                  </div>
                  <button
                    onClick={() => setActiveStep(0)}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                </div>
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">
                    Curriculum Upload & Extraction
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Upload syllabus material, review the extracted structure, and prepare the curriculum before term planning.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-display font-extrabold text-slate-800">
                    Previously Uploaded Curriculums
                  </h3>
                  <p className="text-xs text-slate-500">
                    Open any saved curriculum directly from the extraction screen.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void fetchSavedCurriculums()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setActiveStep(6)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"
                  >
                    <Database className="w-3.5 h-3.5" />
                    View All
                  </button>
                </div>
              </div>

              {savedCurriculums.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                  No previously uploaded curriculums found yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedCurriculums.slice(0, 3).map((curriculum) => (
                    <div
                      key={curriculum._id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-display font-black text-slate-800">
                            {curriculum.subject}
                          </span>
                          {currentCurriculumId === curriculum._id && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          {curriculum.gradeLevel}
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-slate-400 break-all">
                          {curriculum.fileName || "Untitled upload"} • {new Date(curriculum.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => void handleOpenSavedCurriculum(curriculum._id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Open
                        </button>
                        <button
                          onClick={() => void handleDeleteSavedCurriculum(curriculum._id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main Interactive Interface for Input */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Form: Rich Upload & Text Entry */}
              <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#E0CB15]" />
                    <h3 className="font-display font-extrabold text-slate-800">Upload Curriculum Material</h3>
                  </div>
                  <span className="text-xs text-slate-400">PDF, DOC, TXT supported</span>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed p-8 rounded-2xl text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-[#36ADAA] bg-teal-50/50"
                      : "border-slate-200 hover:border-[#36ADAA] hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".txt,.pdf"
                    onChange={handleFileSelect}
                  />
                  <div className="w-12 h-12 bg-[#9FCDD2]/25 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-[#36ADAA]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    Drag primary curriculum file here or click to browse
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports `.txt` and `.pdf` curriculum files up to 10MB
                  </p>

                  {/* Mock Upload Indicator */}
                  {fileName && (
                    <div className="mt-4 p-2 bg-slate-50 border border-slate-205 rounded-xl inline-flex items-center gap-2 text-xs text-slate-600" onClick={(e) => e.stopPropagation()}>
                      <FileText className="w-4 h-4 text-[#36ADAA]" />
                      <span className="font-bold max-w-[200px] truncate">{fileName}</span>
                      <span className="text-[10px] text-slate-400">({fileSizeStr})</span>
                    </div>
                  )}
                </div>

                {/* Run Extraction Button */}
                <button
                  onClick={handleAnalyzeCurriculumText}
                  disabled={!inputText.trim()}
                  className={`w-full py-3 px-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    inputText.trim()
                      ? "bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white shadow-md hover:shadow-lg hover:shadow-teal-100"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  Start Analyze
                </button>
              </div>

              {/* Right panel: Extracted JSON output & validation */}
              <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#3CC583]" />
                    <h3 className="font-display font-extrabold text-slate-800">
                      Curriculum Framework Extraction Output
                    </h3>
                  </div>

                  {extractedData && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsJsonCollapsed((prev) => !prev)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                        aria-label={isJsonCollapsed ? "Show JSON code" : "Hide JSON code"}
                        title={isJsonCollapsed ? "Show JSON code" : "Hide JSON code"}
                      >
                        {isJsonCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingJson(!isEditingJson);
                          if (!isEditingJson) {
                            setEditingJsonText(JSON.stringify(extractedData, null, 2));
                          }
                        }}
                        className="text-xs font-bold text-[#36ADAA] hover:underline"
                      >
                        {isEditingJson ? "Discard Draft" : "Direct Edit JSON"}
                      </button>
                    </div>
                  )}
                </div>

                {extractedData ? (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    
                    
                    {false && <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                            Subject Domain
                          </span>
                          <span className="text-sm font-extrabold text-slate-800">
                            {extractedData!.subject}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                            Standard Grade
                          </span>
                          <span className="text-sm font-extrabold text-slate-800">
                            {extractedData!.gradeLevel}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                          Core Narrative Outlines
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                          {extractedData!.overallDescription}
                        </p>
                      </div>

                      {/* Display Objectives bento badges */}
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold mb-1">
                          Calculated Objectives
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {extractedData!.coreObjectives.map((obj, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium bg-[#E9CAB7]/25 text-amber-900 px-2 py-1 rounded-md"
                            >
                              ✓ {obj}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>}

                    {/* Extracted JSON Editor/Viewer Container */}
                    <div className={`bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
                      isJsonCollapsed ? "flex-none" : "flex-1 min-h-[220px] max-h-[540px]"
                    }`}>
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                          {isEditingJson ? "Active JSON Editor Drafts" : "Verified Structured Extraction"}
                        </span>
                        <div className="flex items-center gap-2">
                          {isJsonCollapsed && (
                            <span className="text-[10px] font-semibold text-slate-400">Hidden</span>
                          )}
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3CC583]" />
                        </div>
                      </div>

                      {isJsonCollapsed ? (
                        <div className="px-4 py-3 text-xs font-semibold text-slate-500">
                          JSON output is hidden. Use the toggle button above to expand it.
                        </div>
                      ) : isEditingJson ? (
                        <textarea
                          value={editingJsonText}
                          onChange={(e) => setEditingJsonText(e.target.value)}
                          className="w-full flex-1 min-h-[320px] p-3 font-mono text-xs bg-slate-900 text-[#3CC583] focus:outline-none overflow-y-auto resize-none"
                        />
                      ) : (
                        <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words min-h-[320px]">
                          {JSON.stringify(extractedData, null, 2)}
                        </pre>
                      )}

                      {/* Edit controls footer if editing */}
                      {isEditingJson && !isJsonCollapsed && (
                        <div className="bg-slate-100 p-2 border-t border-slate-200 flex justify-end gap-2">
                          <button
                            onClick={() => setIsEditingJson(false)}
                            className="bg-slate-200 hover:bg-slate-300 px-3 py-1 text-[11px] font-bold rounded-lg text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveJsonEdit}
                            className="bg-[#36ADAA] hover:bg-[#36ADAA]/90 px-3 py-1 text-[11px] font-bold rounded-lg text-white"
                          >
                            Save Changes
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Accept (Next Steps) or Regenerate controls */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={handleAnalyzeCurriculumText}
                        className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-extract
                      </button>

                      <div className="bg-[#E9CAB7]/20 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-[#E9CAB7]/40">
                        <span className="text-[10px] font-bold text-[#586A71]">Auto Term Division</span>
                        <button
                          onClick={handleDivideTerms}
                          className="bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition"
                        >
                          Generate Terms
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-100 rounded-3xl min-h-[350px]">
                    <div className="w-16 h-16 bg-[#E9CAB7]/25 rounded-3xl flex items-center justify-center text-[#DE8431] mb-4">
                      <FileCode className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-extrabold text-[#2B3437] text-lg mb-1">
                      Extraction Results
                    </h3>
                    <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                      Your extracted syllabus details and JSON schema mapping will appear here after clicking "Start Analyze".
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* -------------------- STEP 2: TERMS PLANNER TABLE -------------------- */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            {!hasGeneratedTerms ? (
              <div className="bg-white p-12 rounded-3xl border-2 border-slate-100 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
                <div className="w-16 h-16 bg-[#E9CAB7]/25 rounded-3xl flex items-center justify-center text-[#DE8431] mx-auto">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-[#2B3437] text-xl">
                    No Academic Terms Generated Yet
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    You haven't parsed or uploaded a curriculum syllabus in Step 1 yet. To view the Terms Planner, please analyze a syllabus file first.
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="px-5 py-3 bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Go to Step 1: Upload
                  </button>
                </div>
              </div>
            ) : (
              <>
            {/* Header section with summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold min-w-0">
                    <span className="text-[#586A71]">Step 2 of LMS Planner</span>
                    <ChevronRight className="w-3 h-3 text-[#586A71]" />
                    <span className="bg-[#9FCDD2]/35 text-[#36ADAA] text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full">
                      Syllabus Divided
                    </span>
                    <span className="text-slate-400">
                      Total Terms: {termPlans.length > 0 ? termPlans.reduce((sum, plan) => sum + (plan.terms?.length || 0), 0) : new Set(termsList.map((term) => term.term)).size}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveStep(1)}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                </div>
                <div className="space-y-1">
                <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800">
                  Dynamic Term Planner Grid
                </h2>
                <p className="text-slate-500 text-xs">
                  Review partitioned unit workloads, chapter structures, and estimated scores. Select a term block to construct dedicated session roadmaps.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveStep(1)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <ListRestart className="w-4 h-4" />
                  Re-upload Curriculum
                </button>
              </div>
              </div>
            </div>

            {/* Structured Table */}
            <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-xs">
              <div className="bg-[#586A71] text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#9FCDD2]" />
                  <span className="font-display font-medium text-sm">Academic Roadmap Balance Sheet</span>
                </div>
                <div className="text-xs bg-[#2B3437]/25 px-3 py-1 rounded-lg text-[#E9CAB7]">
                  Total marks sum: {termDivisionStats.totalMarks} pts
                </div>
              </div>
              {termPlans.length > 0 && activePlannerPlan ? (
                <div className="bg-white p-4 md:p-6 print-sheet">
                  <div className="no-print flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-extrabold text-slate-800">Academic Term Planning Sheet</h3>
                      <p className="text-xs text-slate-500">Select a term row to continue into session planning. The layout is optimized for print and export.</p>
                    </div>
                    {plannerClassOptions.length > 1 && (
                      <select
                        value={activePlannerClass}
                        onChange={(e) => setSelectedPlannerClass(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        {plannerClassOptions.map((className) => (
                          <option key={className} value={className}>{className}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1 py-4">
                    <h4 className="font-display text-xl font-black text-slate-900">{activePlannerPlan.class_name || "Curriculum"}</h4>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
                      <span><span className="font-bold text-slate-800">Academic Year:</span> {String(activePlannerPlan.curriculum_metadata?.academic_year || (extractedData as any)?.document_metadata?.academic_year || "2026-27")}</span>
                      <span><span className="font-bold text-slate-800">Subject:</span> {String(activePlannerPlan.curriculum_metadata?.subject || extractedData?.subject || "")}</span>
                    </div>
                  </div>

                  {/* Term selector chips */}
                  <div className="no-print flex flex-wrap gap-2 pb-4">
                    {activePlannerPlan.terms.map((term) => {
                      const selectedTerm = resolveSelectedTermFromPlan(activePlannerPlan, term);
                      const isSelected = selectedTermRow?.id === selectedTerm.id;
                      return (
                        <button
                          key={term.term_number}
                          onClick={() => setSelectedTermRow(selectedTerm)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                            isSelected
                              ? "bg-[#36ADAA] text-white border-[#36ADAA] shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-[#36ADAA]/40 hover:text-[#36ADAA]"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? "bg-white" : "bg-[#36ADAA]"}`} />
                          {term.term_title}
                        </button>
                      );
                    })}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left text-sm term-planning-table">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-y border-slate-300 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-3 py-3 font-bold">Term</th>
                          <th className="px-3 py-3 font-bold">Units</th>
                          <th className="px-3 py-3 font-bold">Chapters</th>
                          <th className="px-3 py-3 font-bold">Total Sessions</th>
                          <th className="px-3 py-3 font-bold">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePlannerPlan.terms.map((term, termIndex) => {
                          const rows = getTermContentRows(term);
                          const rowCount = Math.max(rows.length, 1);
                          const selectedTerm = resolveSelectedTermFromPlan(activePlannerPlan, term);
                          const isSelected = selectedTermRow?.id === selectedTerm.id;

                          return rows.map((row, rowIndex) => {
                            const chapterNames = row.chapter_names || row.chapters?.map((chapter) => chapter.chapter_name || "").filter(Boolean) || [];
                            return (
                              <tr
                                key={`${term.term_number}-${row.unit_id || rowIndex}`}
                                onClick={() => setSelectedTermRow(selectedTerm)}
                                className={`cursor-pointer border-b border-slate-200 align-top ${termIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"} ${isSelected ? "bg-[#36ADAA]/8" : ""}`}
                              >
                                {rowIndex === 0 && (
                                  <td rowSpan={rowCount} className="px-3 py-3 align-top border-r border-slate-200">
                                    <div className="font-bold text-slate-800">{term.term_title}</div>
                                    <div className="mt-1 text-[11px] text-slate-500">Term {term.term_number}</div>
                                  </td>
                                )}
                                <td className="px-3 py-3 align-top border-r border-slate-200">
                                  <div className="whitespace-pre-line leading-6 text-slate-800">{row.unit_name || "Untitled Unit"}</div>
                                </td>
                                <td className="px-3 py-3 align-top border-r border-slate-200">
                                  <div className="whitespace-pre-line leading-6 text-slate-700">
                                    {chapterNames.length > 0 ? chapterNames.map((chapterName) => `• ${chapterName}`).join("\n") : "—"}
                                  </div>
                                </td>
                                {rowIndex === 0 && (
                                  <td rowSpan={rowCount} className="px-3 py-3 align-top border-r border-slate-200 font-semibold text-slate-700">
                                    {getTermSummaryValue(term, "sessions") || "—"}
                                  </td>
                                )}
                                {rowIndex === 0 && (
                                  <td rowSpan={rowCount} className="px-3 py-3 align-top font-semibold text-slate-700">
                                    {getTermSummaryValue(term, "marks") || "—"}
                                  </td>
                                )}
                              </tr>
                            );
                          });
                        })}
                      </tbody>
                    </table>
                  </div>

                  {selectedTermRow && (
                    <div className="no-print mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                      <div className="text-sm text-slate-600">
                        Active term: <span className="font-bold text-slate-800">{selectedTermName}</span>
                      </div>
                      <button
                        onClick={() => handleConfigureSessionsForTerm(selectedTermRow)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2B3437] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#2B3437]/90"
                      >
                        Continue to Session Planning
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs text-[#586A71] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Selected</th>
                      <th className="px-6 py-4">Academic Term</th>
                      <th className="px-6 py-4">Theme Unit Name</th>
                      <th className="px-6 py-4">Chapters & Covered Topics</th>
                      <th className="px-6 py-4 text-center">Marks Weightage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {classTermGroups.map(({ className, termGroups }) => (
                      <React.Fragment key={className}>
                        <tr className="bg-[#2B3437] text-white">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <span className="font-display font-bold text-sm">{className}</span>
                              <span className="text-xs text-[#E9CAB7]">{termGroups.length} terms</span>
                            </div>
                          </td>
                        </tr>
                        {termGroups.map(({ termName, rows, totalMarks, summaryRow }) => {
                          const isTermSelected = selectedTermRow?.id === summaryRow.id;
                          return (
                            <React.Fragment key={`${className}-${termName}`}>
                              <tr
                                onClick={() => setSelectedTermRow(summaryRow)}
                                className={`border-y border-slate-200 cursor-pointer transition-colors ${
                                  isTermSelected ? "bg-[#36ADAA]/10" : "bg-slate-100/80 hover:bg-slate-100"
                                }`}
                              >
                                <td colSpan={5} className="px-6 py-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                        isTermSelected ? "bg-[#36ADAA] border-[#36ADAA] text-white" : "border-slate-300 bg-white"
                                      }`}>
                                        {isTermSelected && <Check className="w-3.5 h-3.5" />}
                                      </div>
                                      <span className="px-3 py-1 bg-slate-800 text-white rounded-md text-xs font-bold">
                                        {termName}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-500">
                                        {rows.length} unit rows
                                      </span>
                                    </div>
                                    <span className="text-xs font-bold text-[#DE8431]">
                                      Term marks: {totalMarks} pts
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {rows.map((row) => {
                                return (
                                  <tr
                                    key={row.id}
                                    className="text-slate-700"
                                  >
                                    <td className="px-6 py-4" />
                                    <td className="px-6 py-4 font-bold text-slate-500">
                                      {row.termNumber || ""}
                                    </td>
                                    <td className="px-6 py-4 font-extrabold text-slate-800">
                                      {row.unitName}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-wrap gap-1 max-w-sm">
                                        {row.chapters.map((chap, i) => (
                                          <span
                                            key={i}
                                            className="text-[10px] bg-[#9FCDD2]/20 text-[#2B3437] px-2 py-0.5 rounded"
                                          >
                                            {chap}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="px-2.5 py-1 bg-[#DE8431]/10 text-[#DE8431] rounded-full font-bold text-xs">
                                        {row.marks} marks
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Helpful Banner */}
            {selectedTermRow && (
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#3CC583]/15 flex items-center justify-center shrink-0">
                    <CheckSquare className="w-5 h-5 text-[#3CC583]" />
                  </div>
                  <div>
                  </div>
                </div>

                <button
                  onClick={() => handleConfigureSessionsForTerm(selectedTermRow)}
                  className="bg-[#2B3437] hover:bg-[#2B3437]/90 text-white font-bold text-xs py-3 px-6 rounded-xl transition flex items-center gap-2 shadow-xs"
                >
                  Configure Sessions Specs
                  <Sliders className="w-4 h-4 text-[#E9CAB7]" />
                </button>
              </div>
            )}

              </>
            )}
          </div>
        )}

        {/* -------------------- STEP 3: SESSION SPECS & RESOURCE CONFIG -------------------- */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            {!selectedTermRow ? (
              <div className="bg-white p-12 rounded-3xl border-2 border-slate-100 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
                <div className="w-16 h-16 bg-[#9FCDD2]/35 rounded-3xl flex items-center justify-center text-[#36ADAA] mx-auto">
                  <Sliders className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-[#2B3437] text-xl">
                    No Active Term Selected For Session Config
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    You first need to partition a syllabus and select an active Term block in Step 2 to configure session plans.
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (termsList.length > 0) {
                        setActiveStep(2);
                      } else {
                        setActiveStep(1);
                      }
                    }}
                    className="px-5 py-3 bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {termsList.length > 0 ? "Go to Step 2: Terms" : "Go to Step 1: Upload"}
                  </button>
                </div>
              </div>
            ) : (
              <>
            {/* Context breadcrumb & details */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#586A71] font-bold min-w-0">
                    <span>Step 3 of LMS Planner</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#36ADAA]">{selectedTermRow.term}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="truncate">{selectedTermRow.unitName}</span>
                  </div>
                  <button
                    onClick={() => setActiveStep(2)}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                </div>
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">
                    Lesson Plan Specifications (Session Config)
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Choose what specialized classroom resources, objectives, duration parameters and tools you want built.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Configuration Wizard Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Box 1: Timeline & Classroom Duration (Inputs) */}
              <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xs space-y-5">
                <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E9CAB7]/45 flex items-center justify-center text-amber-900">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-extrabold text-slate-800 text-sm">Classroom Parameters</h3>
                </div>

                <div className="space-y-4">
                  {/* Session counts */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Count of the Sessions
                    </label>
                    
                    {/* Interactive Numerical Input and Range decider */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 font-medium font-display font-bold">Total Sessions:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={sessionConfig.sessionCount}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                              setSessionConfig(prev => ({ ...prev, sessionCount: val }));
                            }}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-center font-extrabold text-[#36ADAA] focus:outline-hidden focus:ring-1 focus:ring-[#36ADAA]"
                          />
                          <span className="text-xs text-slate-400 font-semibold">sessions</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        value={sessionConfig.sessionCount}
                        onChange={(e) => setSessionConfig(prev => ({ ...prev, sessionCount: Number(e.target.value) }))}
                        className="w-full accent-[#36ADAA]"
                      />
                    </div>
                  </div>

                  {/* Durations */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Session Duration
                    </label>

                    {/* Interactive Numerical Duration Decider */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5 bg-slate-50">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 font-medium font-display font-bold">Minutes per Session:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={5}
                            max={300}
                            value={sessionConfig.durationMinutes}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(600, Number(e.target.value) || 1));
                              setSessionConfig(prev => ({ ...prev, durationMinutes: val }));
                            }}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-center font-extrabold text-[#36ADAA] focus:outline-hidden focus:ring-1 focus:ring-[#36ADAA]"
                          />
                          <span className="text-xs text-slate-400 font-semibold">minutes</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={180}
                        step={5}
                        value={sessionConfig.durationMinutes <= 180 ? sessionConfig.durationMinutes : 180}
                        onChange={(e) => setSessionConfig(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                        className="w-full accent-[#36ADAA]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Specific things in sessions (Checkboxes) */}
              <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xs lg:col-span-2 space-y-5">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#3CC583]/15 flex items-center justify-center text-[#3CC583]">
                      <Settings className="w-4 h-4" />
                    </div>
                    <h3 className="font-display font-extrabold text-slate-800 text-sm">Include Specific Session Deliverables</h3>
                  </div>
                  <span className="text-xs text-slate-400">Checkbox elements requested</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item 1 */}
                  <div
                    onClick={() => setSessionConfig(prev => ({ ...prev, includeLearningOutcomes: !prev.includeLearningOutcomes }))}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      sessionConfig.includeLearningOutcomes
                        ? "border-[#36ADAA] bg-[#36ADAA]/5"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {sessionConfig.includeLearningOutcomes ? (
                        <div className="w-5 h-5 bg-[#36ADAA] rounded-md flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Learning Outcomes</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Specific targets mapping Bloom's taxonomy behavior indicators.
                      </p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div
                    onClick={() => setSessionConfig(prev => ({ ...prev, includeIntroduction: !prev.includeIntroduction }))}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      sessionConfig.includeIntroduction
                        ? "border-[#36ADAA] bg-[#36ADAA]/5"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {sessionConfig.includeIntroduction ? (
                        <div className="w-5 h-5 bg-[#36ADAA] rounded-md flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Introduction & Hooks</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Montessori physical starter tasks, brainstorming queries and inquiry games.
                      </p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div
                    onClick={() => setSessionConfig(prev => ({ ...prev, includeTheory: !prev.includeTheory }))}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      sessionConfig.includeTheory
                        ? "border-[#36ADAA] bg-[#36ADAA]/5"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {sessionConfig.includeTheory ? (
                        <div className="w-5 h-5 bg-[#36ADAA] rounded-md flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Theory Core Explanations</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Definitions, key concepts, detailed pedagogical paragraphs and analogies.
                      </p>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div
                    onClick={() => setSessionConfig(prev => ({ ...prev, includeAssessments: !prev.includeAssessments }))}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      sessionConfig.includeAssessments
                        ? "border-[#36ADAA] bg-[#36ADAA]/5"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {sessionConfig.includeAssessments ? (
                        <div className="w-5 h-5 bg-[#36ADAA] rounded-md flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Assessment + Key</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Immediate check-for-understanding quiz prompts with explicit solution keys.
                      </p>
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div
                    onClick={() => setSessionConfig(prev => ({ ...prev, includeAssignments: !prev.includeAssignments }))}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      sessionConfig.includeAssignments
                        ? "border-[#36ADAA] bg-[#36ADAA]/5"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {sessionConfig.includeAssignments ? (
                        <div className="w-5 h-5 bg-[#36ADAA] rounded-md flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Assignments + Rubrics Key</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Longer study questions, evaluation metrics guidelines, and teacher scoring examples.
                      </p>
                    </div>
                  </div>

                  {/* Item 6 */}
                  <div
                    onClick={() => setSessionConfig(prev => ({ ...prev, includeNotes: !prev.includeNotes }))}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      sessionConfig.includeNotes
                        ? "border-[#36ADAA] bg-[#36ADAA]/5"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {sessionConfig.includeNotes ? (
                        <div className="w-5 h-5 bg-[#36ADAA] rounded-md flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Interactive Slide-Deck Notes</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Automated structured PowerPoint (PPT), PDF references, and DOCX document scaffolds.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button
                    onClick={handleGenerateOutline}
                    className="w-full sm:w-auto sm:ml-auto bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-extrabold text-sm py-4 px-8 rounded-2xl shadow-md hover:shadow-lg hover:shadow-teal-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#E0CB15] animate-spin" />
                    Generate Roadmap
                  </button>
                </div>
              </div>

            </div>
              </>
            )}
          </div>
        )}

        {/* -------------------- STEP 4: DELIVERABLE PLANS DISPLAY DASHBOARD -------------------- */}
        {activeStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            {!selectedTermRow || sessionsOutline.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border-2 border-slate-100 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
                <div className="w-16 h-16 bg-[#36ADAA]/15 rounded-3xl flex items-center justify-center text-[#36ADAA] mx-auto">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-[#2B3437] text-xl">
                    No Session Roadmap Generated Yet
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    You need to generate a lesson plan timeline in Step 3 to view the delivery dashboard.
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (selectedTermRow) {
                        setActiveStep(3);
                      } else if (termsList.length > 0) {
                        setActiveStep(2);
                      } else {
                        setActiveStep(1);
                      }
                    }}
                    className="px-5 py-3 bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {selectedTermRow ? "Go to Step 3: Specs" : termsList.length > 0 ? "Go to Step 2: Terms" : "Go to Step 1: Upload"}
                  </button>
                </div>
              </div>
            ) : (
              <>
            
            {/* Header layout showing course standard metadata */}
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-xs no-print">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold text-[#586A71]">
                    <span>Step 4 of LMS Planner</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#36ADAA]">{selectedTermRow.term}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="truncate">{selectedTermRow.unitName}</span>
                  </div>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                </div>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded bg-[#E9CAB7] text-[#586A71]">
                        {extractedData?.subject} ({extractedData?.gradeLevel})
                      </span>
                      <span className="text-xs text-slate-400">Total sessions: {sessionConfig.sessionCount}</span>
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-display font-black text-slate-800 tracking-tight">
                        Academic Timeline: {selectedTermRow.term}
                      </h2>
                      <p className="text-slate-500 text-xs">
                        Review lesson plan, download study outlines, and explore PPT presentation grids.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                      onClick={() => setActiveStep(5)}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      Assessment Generator
                    </button>
                    <button
                      onClick={triggerGenerateAllSessions}
                      className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Generate All
                    </button>

                    <button
                      onClick={handlePrintPlans}
                      className="py-2.5 px-4 rounded-xl bg-[#586A71] hover:bg-[#586A71]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Outlines
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Screen Dashboard Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Left Column: List of sessions roadmaps */}
              <div className="space-y-3 lg:col-span-1 no-print">
                <div className="bg-[#36ADAA] text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider">Lesson Plans Roadmap</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
                    {Object.keys(generatedSessions).length} / {sessionsOutline.length} Ready
                  </span>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {sessionsOutline.map((item) => {
                    const isSelected = activeSessionNumber === item.sessionNumber;
                    const hasDeepData = !!generatedSessions[item.sessionNumber];

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!hasDeepData) {
                            handleBuildSessionDeepDetails(item.sessionNumber, item);
                          } else {
                            setActiveSessionNumber(item.sessionNumber);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition text-left space-y-1.5 relative overflow-hidden ${
                          isSelected
                            ? "border-[#36ADAA] bg-[#36ADAA]/5 shadow-xs"
                            : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                      >
                        {/* Decorative side accent */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          isSelected ? "bg-[#36ADAA]" : hasDeepData ? "bg-[#3CC583]" : "bg-slate-200"
                        }`} />

                        <div className="flex justify-between items-center gap-1">
                          <span className="text-[10px] font-bold text-[#586A71] uppercase tracking-wide">
                            Session {item.sessionNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.duration} mins
                          </span>
                        </div>

                        <h4 className="font-bold text-[#2B3437] text-xs leading-normal line-clamp-1">
                          {item.title}
                        </h4>

                        <div className="flex items-center justify-between pt-1">
                          {hasDeepData ? (
                            <span className="text-[10px] text-[#3CC583] font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Fully Prepared
                            </span>
                          ) : (
                            <span className="text-[10px] text-orange-500 font-bold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 animate-spin" /> Draft (Click to prepare)
                            </span>
                          )}

                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Deep Deliverables Sheet Area (The Output Document) */}
              <div className="lg:col-span-3 space-y-4 print-card">
                
                {generatedSessions[activeSessionNumber] ? (
                  (() => {
                    const session = generatedSessions[activeSessionNumber];
                    return (
                      <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-xs space-y-6">
                        
                        {/* Session Main Title Header Banner Block */}
                        <div className="p-6 md:p-8 bg-[#586A71] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                          {/* Creative school motifs inside head bg */}
                          <div className="absolute right-0 top-0 opacity-10 font-bold font-display text-8xl pointer-events-none select-none">
                            LMS
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#E9CAB7] text-[#2B3437] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                                Session Plan {session.sessionNumber} of {sessionConfig.sessionCount}
                              </span>
                              <span className="text-xs text-slate-300">
                                Duration Block: {session.duration} minutes
                              </span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-display font-black tracking-tight text-white">
                              {session.title}
                            </h3>
                            <p className="text-xs text-slate-300">
                              Active Standard Target Focus: {selectedTermRow.unitName}
                            </p>
                          </div>
                        </div>

                        {/* Sub nav deliverable categories tabs */}
                        <div className="bg-slate-50 px-6 py-2 border-y border-slate-100 flex flex-wrap gap-2 no-print">
                          {[
                            { id: "theory", label: "Pedagogy Theory" },
                            { id: "materials", label: "Materials (PPT/PDF/DOC)" },
                            { id: "homework", label: "Homework Draft" },
                            { id: "assessments", label: "Assessments (Test + key)" },
                            { id: "assignments", label: "Assignments + Key" },
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setActiveSubTab(t.id as any)}
                              className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition ${
                                activeSubTab === t.id
                                  ? "bg-[#36ADAA] text-white shadow-xs"
                                  : "text-[#586A71] hover:bg-slate-100 hover:text-slate-800"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* DELIVERABLE TAB PANELS */}
                        <div className="p-6 md:p-8 space-y-6">

                          {/* SUB TAB: Pedagogy Theory */}
                          {activeSubTab === "theory" && (
                            <div className="space-y-6 animate-fadeIn">
                              {/* Learning Outcomds if active */}
                              {sessionConfig.includeLearningOutcomes && session.learningOutcomes && (
                                <div className="p-4 bg-[#9FCDD2]/15 border border-[#9FCDD2]/50 rounded-2xl space-y-1.5">
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                                    Target Learning Outcomes (Montessori Taxonomy Standard)
                                  </span>
                                  <ul className="text-xs space-y-1 text-slate-700 list-disc list-inside">
                                    {session.learningOutcomes.map((lo, i) => (
                                      <li key={i} className="leading-relaxed">
                                        {lo}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Instruction hooks */}
                              {sessionConfig.includeIntroduction && session.introduction && (
                                <div className="space-y-1 p-4 bg-[#E9CAB7]/20 border border-[#E9CAB7]/50 rounded-2xl">
                                  <div className="flex items-center gap-1 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5 text-[#DE8431]" />
                                    <span>Pedagogical Launch Hook / Daily Inquiry Starter</span>
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed italic pt-1">
                                    "{session.introduction}"
                                  </p>
                                </div>
                              )}

                              {/* Primary Theory Sections */}
                              {sessionConfig.includeTheory && session.theory && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                      Theory Overview
                                    </h4>
                                    <p className="text-xs text-slate-600 leading-relaxed mt-2 p-3 bg-slate-50 rounded-xl font-medium">
                                      {session.theory.overview}
                                    </p>
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-extrabold text-[#586A71] uppercase tracking-wide mb-2">
                                      Key Lesson Takeaways
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {session.theory.keyPoints.map((point, i) => (
                                        <div key={i} className="p-3 border border-slate-100 rounded-xl flex items-start gap-2.5">
                                          <span className="w-4 h-4 rounded-full bg-[#1EABDA]/15 text-[#1EABDA] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                                            {i + 1}
                                          </span>
                                          <span className="text-xs text-slate-700 leading-relaxed">
                                            {point}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-extrabold text-[#586A71] uppercase tracking-wide mb-1">
                                      In-Depth Classroom Content
                                    </h4>
                                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap p-4 bg-slate-50 rounded-xl">
                                      {session.theory.detailedContent}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Activities timeline block */}
                              {session.activities && session.activities.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                    Classroom Activities Timeline
                                  </h4>
                                  
                                  <div className="space-y-3">
                                    {session.activities.map((act, i) => (
                                      <div key={i} className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-2 relative">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 pb-1.5 border-b border-slate-100">
                                          <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[#3CC583] text-white flex items-center justify-center text-[10px] font-bold font-mono">
                                              {i + 1}
                                            </span>
                                            <span className="font-extrabold text-slate-800 text-xs text-slate-800">{act.name}</span>
                                          </div>
                                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-mono font-bold text-slate-500">
                                            🕒 {act.durationMinutes} mins
                                          </span>
                                        </div>

                                        <div className="space-y-1">
                                          <span className="text-[9px] text-[#586A71] font-bold block uppercase tracking-wider">
                                            Instructions & Steps for Children
                                          </span>
                                          <ul className="text-xs text-slate-600 space-y-1 pl-4 list-decimal">
                                            {act.instructions.map((inst, idx) => (
                                              <li key={idx} className="leading-relaxed">
                                                {inst}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUB TAB: Materials (PPT/PDF/DOC) */}
                          {activeSubTab === "materials" && (
                            <div className="space-y-6 animate-fadeIn">
                              
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-100">
                                <div>
                                  <h4 className="font-display font-extrabold text-slate-800 text-sm">
                                    Resource Materials Generator Previews
                                  </h4>
                                  <p className="text-xs text-slate-400">
                                    Structured formats built natively. Click sub-tabs below to inspect templates.
                                  </p>
                                </div>

                                {/* Slide Deck format picker */}
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                  {[
                                    { id: "ppt", label: "PowerPoint (PPT)" },
                                    { id: "pdf", label: "PDF Study Notes" },
                                    { id: "docx", label: "DOCX Planning Blueprint" },
                                  ].map((m) => (
                                    <button
                                      key={m.id}
                                      onClick={() => setActiveMaterialTab(m.id as any)}
                                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                                        activeMaterialTab === m.id
                                          ? "bg-white text-[#36ADAA] shadow-xs"
                                          : "text-[#586A71] hover:text-slate-800"
                                      }`}
                                    >
                                      {m.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* PPT Template Material */}
                              {activeMaterialTab === "ppt" && session.materials?.ppt && (
                                <div className="space-y-4">
                                  <div className="p-3 bg-orange-50 border border-[#DE8431]/20 rounded-xl flex items-center gap-2.5 text-xs text-[#DE8431]">
                                    <Info className="w-4 h-4 shrink-0" />
                                    <span>Presentation Outline: Real presentation slides generated to map exactly to lessons.</span>
                                  </div>

                                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                    {session.materials.ppt.slides.map((slide, sIdx) => {
                                      // Cycle accent colors for slide heads
                                      const accents = ["bg-[#36ADAA]", "bg-[#7F64EA]", "bg-[#1EABDA]", "bg-[#DE8431]", "bg-[#3CC583]"];
                                      const colorClass = accents[sIdx % accents.length];
                                      
                                      return (
                                        <div key={sIdx} className="bg-slate-900 text-white rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                                          {/* Slide title bar */}
                                          <div className={`p-3 ${colorClass} text-white flex justify-between items-center`}>
                                            <span className="font-display font-black text-xs">
                                              Slide #{sIdx + 1} - {slide.slideTitle}
                                            </span>
                                            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                                              16:9 Screen
                                            </span>
                                          </div>
                                          
                                          {/* Slide bullets body */}
                                          <div className="p-5 space-y-2 bg-gradient-to-b from-slate-900 to-slate-950 font-mono text-xs">
                                            <ul className="list-disc list-inside space-y-1 text-slate-300">
                                              {slide.bulletPoints.map((bp, bpIdx) => (
                                                <li key={bpIdx} className="leading-relaxed">
                                                  {bp}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* PDF Template Details */}
                              {activeMaterialTab === "pdf" && session.materials?.pdf && (
                                <div className="space-y-4 font-serif text-slate-700 bg-amber-50/15 border-2 border-[#E9CAB7]/40 p-6 rounded-3xl relative">
                                  <div className="absolute right-3 top-3 no-print">
                                    <span className="px-2.5 py-1 bg-teal-100 text-[#36ADAA] text-[10px] uppercase font-mono font-bold rounded">
                                      PDF Handbook
                                    </span>
                                  </div>

                                  <div className="text-center pb-4 border-b border-dashed border-slate-200">
                                    <h4 className="font-display font-black text-[#2B3437] text-lg">
                                      {session.materials.pdf.documentTitle}
                                    </h4>
                                    <span className="text-xs text-slate-400 font-sans italic">
                                      Classroom Fact sheet & Printable Reference Guide
                                    </span>
                                  </div>

                                  <div className="space-y-4 pt-2">
                                    <span className="font-sans font-extrabold text-[11px] uppercase tracking-wider text-[#586A71] block">
                                      I. Core Scientific Principles / Facts
                                    </span>
                                    <ul className="text-xs space-y-2 list-decimal list-inside pl-2">
                                      {session.materials.pdf.keyInformation.map((info, idx) => (
                                        <li key={idx} className="leading-relaxed">
                                          {info}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-sans">
                                    <span>Academic Curriculum LMS Model</span>
                                    <span>Page 1 of 1</span>
                                  </div>
                                </div>
                              )}

                              {/* DOCX Template Outline */}
                              {activeMaterialTab === "docx" && session.materials?.docx && (
                                <div className="space-y-4 text-slate-700 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                    <h5 className="font-bold text-slate-800 text-xs font-mono">
                                      📄 word_curriculum_scaffold.docx
                                    </h5>
                                    <span className="text-[10px] text-slate-400 italic">218 words</span>
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="font-display font-extrabold text-slate-800 text-sm">
                                      {session.materials.docx.outlineTitle}
                                    </h4>

                                    <div className="space-y-2">
                                      {session.materials.docx.sections.map((sec, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 text-xs leading-relaxed">
                                          {sec}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                            </div>
                          )}

                          {/* SUB TAB: Homework Draft */}
                          {activeSubTab === "homework" && (
                            <div className="space-y-6 animate-fadeIn">
                              {session.homework ? (
                                <div className="p-6 bg-[#7F64EA]/5 border border-[#7F64EA]/20 rounded-3xl space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#7F64EA]/15 flex items-center justify-center text-[#7F64EA]">
                                      <Layers className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-display font-extrabold text-[#7F64EA] text-sm">
                                      Night Homework Assignment
                                    </h4>
                                  </div>

                                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                                    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 text-slate-400">
                                      <span>Task Directive</span>
                                      <span className="font-mono bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-bold">
                                        🕒 Expected Completion: {session.homework.estimatedTimeMinutes} minutes
                                      </span>
                                    </div>

                                    <p className="text-xs text-slate-700 font-medium leading-relaxed pt-1">
                                      {session.homework.task}
                                    </p>
                                  </div>

                                  <div className="text-[11px] text-slate-400">
                                    Tip: Encourage children to write this down in their physical academic logs!
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400">
                                  No homework active. Customize the specs parameters to enable.
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUB TAB: Assessments */}
                          {activeSubTab === "assessments" && (
                            <div className="space-y-6 animate-fadeIn">
                              {sessionConfig.includeAssessments && session.assessment ? (
                                <div className="space-y-4">
                                  
                                  <div className="p-4 bg-sky-50 border border-[#1EABDA]/25 rounded-2xl flex items-center justify-between no-print">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-[#1EABDA]/15 flex items-center justify-center text-[#1EABDA]">
                                        <CheckSquare className="w-4 h-4" />
                                      </div>
                                      <h5 className="font-bold text-slate-800 text-xs">
                                        Classroom Active Assessment (Quiz) & Solutions
                                      </h5>
                                    </div>
                                    <span className="text-[10px] text-[#586A71] bg-slate-100 px-2 py-0.5 rounded font-mono">
                                      Key Included
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    {/* Left: Questions */}
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pb-1 border-b border-slate-200">
                                        Assessment Quiz Questions
                                      </span>
                                      <div className="space-y-3">
                                        {session.assessment.questions.map((q, idx) => (
                                          <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-700">
                                            <p className="font-extrabold pb-1">Q{idx + 1}.</p>
                                            <p className="leading-relaxed">{q}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Right: Answer Key */}
                                    <div className="space-y-3 bg-[#3CC583]/5 p-4 rounded-2xl border border-[#3CC583]/20">
                                      <span className="text-[10px] font-extrabold text-[#3CC583] uppercase tracking-widest block pb-1 border-b border-[#3CC583]/20">
                                        Assessment Solution Answer Key
                                      </span>
                                      <div className="space-y-3">
                                        {session.assessment.answerKey.map((ans, idx) => (
                                          <div key={idx} className="p-3 bg-white rounded-xl border border-[#3CC583]/30 text-xs text-slate-700">
                                            <p className="font-extrabold text-[#3CC583] pb-1">Solution Q{idx + 1}.</p>
                                            <p className="leading-relaxed font-mono">{ans}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              ) : (
                                <div className="text-gray-400 text-center p-8 bg-slate-50 rounded-2xl">
                                  Assessments are disabled. Check specifications checklist to include assessments.
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUB TAB: Assignments */}
                          {activeSubTab === "assignments" && (
                            <div className="space-y-6 animate-fadeIn">
                              {sessionConfig.includeAssignments && session.assignment ? (
                                <div className="space-y-5">
                                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-[#7F64EA] bg-[#7F64EA]/15 px-3 py-1 rounded-full">
                                        Academic Assignment Sheet
                                      </span>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1 shadow-2xs">
                                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                                        Assignment Task description
                                      </span>
                                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                        {session.assignment.taskDescription}
                                      </p>
                                    </div>

                                    {/* Evaluation rubrics */}
                                    {session.assignment.rubric && (
                                      <div className="space-y-2">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">
                                          Core Rubrics Guidelines (10 Points distribution)
                                        </span>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                          {session.assignment.rubric.map((rub, rIdx) => (
                                            <div key={rIdx} className="bg-white p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                                              {rub}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Answer responses key */}
                                    {session.assignment.answerKey && (
                                      <div className="p-4 bg-[#3CC583]/5 border-2 border-dashed border-[#3CC583]/30 rounded-2xl space-y-1.5">
                                        <span className="text-[10px] text-[#3CC583] font-black uppercase tracking-wider block">
                                          Teacher Grading Answer Key reference
                                        </span>
                                        <p className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                                          {session.assignment.answerKey}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-400 text-center p-8 bg-slate-50 rounded-2xl">
                                  Assignments are disabled. Check specifications checklist to include assessments.
                                </div>
                              )}
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-white border-2 border-slate-100 rounded-3xl min-h-[460px]">
                    <div className="w-16 h-16 bg-[#36ADAA]/15 rounded-3xl flex items-center justify-center text-[#36ADAA] mb-4">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-extrabold text-[#2B3437] text-lg mb-1">
                      Prep Active Session #{activeSessionNumber}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-sm mb-6">
                      Click below to generate study definitions, slide lists, worksheets and explicit assessment key for this session.
                    </p>

                    <button
                      onClick={() => {
                        const outlineItem = sessionsOutline.find((s) => s.sessionNumber === activeSessionNumber);
                        if (outlineItem) {
                          handleBuildSessionDeepDetails(activeSessionNumber, outlineItem);
                        }
                      }}
                      className="bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition shadow-sm"
                    >
                      Construct Session #{activeSessionNumber} Deliverables
                    </button>
                  </div>
                )}

              </div>

            </div>
              </>
            )}
          </div>
        )}

          </div>
        </div>
      </main>

      {/* Footer bar branding */}
      <footer className="mt-20 border-t border-slate-100 bg-slate-50/50 py-8 px-6 text-center text-xs text-[#586A71] no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3CC583]" />
            <span className="font-bold">Lesson Plan Generator Engine</span>
          </div>
          <div>
            © 2026 Academic LMS
          </div>
        </div>
      </footer>

    </div>
  );
}

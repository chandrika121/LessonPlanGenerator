import React, { useEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import katexStyles from "katex/dist/katex.min.css?inline";
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
  AcademicConfig,
  CurriculumClassOptionsResponse,
  AssessmentQuestionType,
  AssessmentQuestionTypeRequest,
  ChapterSessionPlan,
  CurriculumClassSummary,
  CurriculumExtraction,
  CurriculumSupportingDocument,
  TermAllocation,
  PlanningWorkspace,
  SavedCurriculumRecord,
  SavedCurriculumSummary,
  SessionAllocation,
  SessionAssessmentCustomization,
  SessionConfig,
  MathRichText,
  MathDiagramSpec,
  MathFormulaCard,
  SessionPptGenerationOptions,
  SessionPlanningDefaults,
  SessionSectionKey,
  SessionPlan,
  SunbirdSearchCandidate,
  SunbirdStructurePreviewResponse,
  TeachingStrategy,
  TermRow,
} from "./types";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PPT_TEMPLATE_OPTIONS = [
  {
    id: "textbook-clean",
    name: "Textbook Clean",
    description: "Minimal, textbook-like, high readability classroom slides.",
  },
  {
    id: "academic-split",
    name: "Academic Split",
    description: "Balanced text plus visual teaching layout.",
  },
  {
    id: "visual-focus",
    name: "Visual Focus",
    description: "Larger visual area with lighter on-slide text.",
  },
] as const;

const PPT_THEME_OPTIONS = [
  {
    id: "cbse-academic-blue",
    name: "CBSE Academic Blue",
    description: "Measured academic blue palette for teacher delivery.",
    colors: { primary: "#1D4E89", accent: "#D97706", soft: "#E8F0FA" },
  },
  {
    id: "kamalaniketan-classic",
    name: "Kamalaniketan Classic",
    description: "Traditional school-deck presentation styling.",
    colors: { primary: "#4F81BD", accent: "#F79646", soft: "#EDF4FB" },
  },
  {
    id: "kamalaniketan-modern",
    name: "Kamalaniketan Modern",
    description: "Contemporary classroom deck with brighter accents.",
    colors: { primary: "#36ADAA", accent: "#DE8431", soft: "#EEF8F8" },
  },
] as const;

const LEGACY_PPT_TEMPLATE_ID = "kamalaniketan-session-12";

const STUDENT_NOTES_PATTERN_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='260' viewBox='0 0 900 260'>
    <rect width='900' height='260' fill='#4f819c'/>
    <g fill='none' stroke='#f4efe3' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' opacity='0.94'>
      <path d='M25 240 C60 185 78 126 72 42' />
      <path d='M54 235 C95 188 112 132 108 44' />
      <path d='M92 240 C132 188 145 128 141 34' />
      <path d='M145 236 C184 189 201 132 197 46' />
      <path d='M204 236 C243 186 258 128 255 32' />
      <path d='M262 239 C304 188 320 129 316 38' />
      <path d='M326 237 C364 187 380 129 376 42' />
      <path d='M389 236 C426 186 446 128 441 36' />
      <path d='M447 240 C488 191 507 131 503 40' />
      <path d='M512 238 C552 189 568 130 564 34' />
      <path d='M573 238 C614 188 630 129 626 40' />
      <path d='M637 236 C675 187 694 126 689 32' />
      <path d='M699 238 C740 188 757 130 752 39' />
      <path d='M764 240 C802 188 819 128 815 38' />
      <path d='M826 238 C866 188 884 130 880 42' />
      <path d='M20 150 C44 126 59 106 72 78' />
      <path d='M44 128 C67 105 82 82 95 54' />
      <path d='M88 156 C112 132 128 109 141 81' />
      <path d='M147 154 C170 129 188 105 201 76' />
      <path d='M206 150 C229 126 244 101 257 71' />
      <path d='M266 156 C292 132 308 109 321 80' />
      <path d='M328 154 C352 129 369 103 382 72' />
      <path d='M389 154 C414 129 431 103 444 74' />
      <path d='M449 157 C476 132 493 108 506 78' />
      <path d='M513 154 C537 129 553 104 566 74' />
      <path d='M575 154 C600 130 616 106 629 77' />
      <path d='M639 152 C663 128 679 103 693 74' />
      <path d='M701 154 C728 129 744 104 757 73' />
      <path d='M764 156 C789 129 805 104 819 74' />
      <path d='M825 154 C850 129 865 105 879 76' />
      <path d='M62 194 C84 177 97 161 108 138' />
      <path d='M120 194 C142 176 155 161 167 138' />
      <path d='M180 194 C201 176 214 161 226 138' />
      <path d='M238 194 C261 176 274 159 287 135' />
      <path d='M301 194 C324 176 337 159 349 135' />
      <path d='M362 194 C384 176 399 159 412 136' />
      <path d='M422 194 C447 176 461 158 474 134' />
      <path d='M484 194 C507 176 520 160 533 137' />
      <path d='M545 194 C567 176 581 160 595 136' />
      <path d='M606 194 C629 176 643 159 656 135' />
      <path d='M667 194 C690 176 704 160 718 136' />
      <path d='M728 194 C751 176 766 159 779 135' />
      <path d='M790 194 C814 176 829 159 842 134' />
    </g>
    <g fill='#f4efe3' opacity='0.96'>
      <circle cx='92' cy='54' r='18'/><circle cx='78' cy='74' r='9'/><circle cx='109' cy='73' r='9'/>
      <circle cx='260' cy='62' r='18'/><circle cx='246' cy='82' r='9'/><circle cx='278' cy='80' r='9'/>
      <circle cx='445' cy='56' r='18'/><circle cx='429' cy='77' r='9'/><circle cx='461' cy='77' r='9'/>
      <circle cx='612' cy='62' r='18'/><circle cx='598' cy='82' r='9'/><circle cx='630' cy='80' r='9'/>
      <circle cx='790' cy='54' r='18'/><circle cx='776' cy='74' r='9'/><circle cx='807' cy='73' r='9'/>
      <circle cx='170' cy='118' r='11'/><circle cx='522' cy='118' r='11'/><circle cx='710' cy='118' r='11'/>
      <circle cx='336' cy='146' r='11'/><circle cx='612' cy='154' r='11'/><circle cx='116' cy='158' r='11'/>
    </g>
  </svg>`
)}`;

const normalizePptTemplateId = (templateId?: string | null) => {
  const rawTemplateId = String(templateId || "").trim();
  if (!rawTemplateId || rawTemplateId === LEGACY_PPT_TEMPLATE_ID) {
    return "academic-split";
  }
  return PPT_TEMPLATE_OPTIONS.some((option) => option.id === rawTemplateId)
    ? rawTemplateId
    : "academic-split";
};

type StudentNoteRichValue = string | MathRichText;
type StudentNoteRichLine = StudentNoteRichValue[];
type StudentNoteBlock =
  | { type: "line"; value: StudentNoteRichLine; displayMode?: boolean }
  | { type: "list"; items: StudentNoteRichLine[]; ordered?: boolean; label?: string };
type StudentNoteSection = {
  title: string;
  blocks: StudentNoteBlock[];
  cues: StudentNoteRichLine[];
};
type StudentNotesTemplate = {
  noteTitle: string;
  cueItems: StudentNoteRichLine[];
  noteSections: StudentNoteSection[];
  summaryLines: StudentNoteRichLine[];
};

const resolveWorkspaceOutputLanguage = (workspace?: PlanningWorkspace | null): string => {
  const requestedLanguage = String(
    workspace?.sessionPlanningDefaults?.language ||
    workspace?.academicConfig?.language ||
    ""
  ).trim();
  const subject = String(workspace?.academicConfig?.subject || "").trim().toLowerCase();

  if (subject === "hindi" || subject.includes("hindi language")) {
    return "Hindi";
  }
  if (subject === "tamil" || subject.includes("tamil language")) {
    return "Tamil";
  }
  return requestedLanguage || "English";
};

export default function App() {
  const LAST_CURRICULUM_ID_KEY = "lms:lastCurriculumId";
  const LAST_WORKSPACE_ID_KEY = "lms:lastWorkspaceId";
  // Navigation & Step Management
  // 0: Dashboard, 1: Upload & Extract, 2: Term Planner, 3: Session Specs & Roadmap, 4: Lesson Plan Delivery Outlines, 5: Saved Curriculums
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(1);
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
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
  const [activeWorkspace, setActiveWorkspace] = useState<PlanningWorkspace | null>(null);
  const [editingJsonText, setEditingJsonText] = useState<string>("");
  const [isEditingJson, setIsEditingJson] = useState<boolean>(false);
  const [isJsonCollapsed, setIsJsonCollapsed] = useState<boolean>(false);
  const [savedCurriculums, setSavedCurriculums] = useState<SavedCurriculumSummary[]>([]);
  const [detectedCurriculumSubject, setDetectedCurriculumSubject] = useState<string>("");
  const [requiresTamilIndex, setRequiresTamilIndex] = useState<boolean>(false);
  const [tamilIndexText, setTamilIndexText] = useState<string>("");
  const [tamilIndexFileName, setTamilIndexFileName] = useState<string>("");
  const [tamilIndexFileSizeStr, setTamilIndexFileSizeStr] = useState<string>("");
  const [tamilStructureText, setTamilStructureText] = useState<string>("");
  const [tamilStructureFileName, setTamilStructureFileName] = useState<string>("");
  const [tamilStructureFileSizeStr, setTamilStructureFileSizeStr] = useState<string>("");
  const [sunbirdSearchQuery, setSunbirdSearchQuery] = useState<string>("");
  const [sunbirdSearchResults, setSunbirdSearchResults] = useState<SunbirdSearchCandidate[]>([]);
  const [sunbirdPreviewSummary, setSunbirdPreviewSummary] = useState<SunbirdStructurePreviewResponse["summary"] | null>(null);
  const [showTamilIndexModal, setShowTamilIndexModal] = useState<boolean>(false);
  const [pendingTamilIndexPreflight, setPendingTamilIndexPreflight] = useState<{
    requestId: string;
    result: CurriculumClassOptionsResponse;
  } | null>(null);
  const [pendingCurriculumSelection, setPendingCurriculumSelection] = useState<{
    classSummaries: CurriculumClassSummary[];
  } | null>(null);
  const [selectedClassNamesToStore, setSelectedClassNamesToStore] = useState<string[]>([]);
  const [academicConfigDraft, setAcademicConfigDraft] = useState<AcademicConfig>({});
  const [preferredTermCount, setPreferredTermCount] = useState<number>(3);
  const [coursePlanDraft, setCoursePlanDraft] = useState<TermAllocation[]>([]);
  const [teachingStrategyDraft, setTeachingStrategyDraft] = useState<TeachingStrategy>({});
  const [sessionPlanningDefaultsDraft, setSessionPlanningDefaultsDraft] = useState<SessionPlanningDefaults>({
    sessionDurationMinutes: 45,
    language: "English",
    readingLevel: "Grade-aligned",
    responseLength: "Balanced",
    creativity: "Moderate",
    includeRealWorldConnections: true,
    includeDifferentiation: true,
    includeFormativeAssessment: true,
    includeHomework: true,
    includeTeacherNotes: true,
  });
  const [sessionAllocationDraft, setSessionAllocationDraft] = useState<ChapterSessionPlan[]>([]);

  // Step 2 State: Divide Terms
  const [termsList, setTermsList] = useState<TermRow[]>([]);
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
    chapterName?: string;
    sessionKind?: "lesson" | "strand_practice";
    chapterSessionNumber?: number;
    chapterTotalSessions?: number;
  }[]>([]);

  // Step 4 State: Deep Sessions Plans
  const [generatedSessions, setGeneratedSessions] = useState<Record<string, SessionPlan>>({});
  const [activeSessionNumber, setActiveSessionNumber] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<"teacherNotes" | "studentNotes" | "materials" | "homework" | "assessments" | "assignments">("teacherNotes");
  const [activeMaterialTab, setActiveMaterialTab] = useState<"ppt" | "pdf" | "docx">("ppt");
  const [assessmentCustomizationBySession, setAssessmentCustomizationBySession] = useState<Record<number, SessionAssessmentCustomization>>({});
  const [pptGenerationOptionsBySession, setPptGenerationOptionsBySession] = useState<Record<number, SessionPptGenerationOptions>>({});

  // File drag state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tamilIndexFileInputRef = useRef<HTMLInputElement>(null);
  const tamilStructureFileInputRef = useRef<HTMLInputElement>(null);
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
        recurringStrands: Array.from(new Set<string>(rows.flatMap((row) => row.recurringStrands || []))),
        recurringStrandDetails: Array.from(
          new Map(
            rows.flatMap((row) => (row.recurringStrandDetails || []).map((strand) => [strand.title, strand] as const))
          ).values()
        ),
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

  const resetTamilIndexState = () => {
    setDetectedCurriculumSubject("");
    setRequiresTamilIndex(false);
    setTamilIndexText("");
    setTamilIndexFileName("");
    setTamilIndexFileSizeStr("");
    setTamilStructureText("");
    setTamilStructureFileName("");
    setTamilStructureFileSizeStr("");
    setSunbirdSearchQuery("");
    setSunbirdSearchResults([]);
    setSunbirdPreviewSummary(null);
    setShowTamilIndexModal(false);
    setPendingTamilIndexPreflight(null);
  };

  const clearCurriculumWorkspace = () => {
    setCurrentCurriculumId("");
    setCurrentWorkspaceId("");
    setActiveWorkspace(null);
    setGeneratedSessions({});
    setFileName("");
    setFileSizeStr("");
    setInputText("");
    setExtractedData(null);
    setEditingJsonText("");
    setIsEditingJson(false);
    setIsJsonCollapsed(false);
    resetTamilIndexState();
    localStorage.removeItem(LAST_CURRICULUM_ID_KEY);
    localStorage.removeItem(LAST_WORKSPACE_ID_KEY);
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

  const detectCurriculumClassOptions = async (): Promise<CurriculumClassOptionsResponse> => {
    const res = await fetch("/api/curriculum-class-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: inputText,
        fileName,
      }),
    });

    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to detect class options."));
    }

    return res.json();
  };

  const runCurriculumExtraction = async (
    requestId: string,
    selectedClasses: string[]
  ) => {
    const supportingDocuments: CurriculumSupportingDocument[] = [];
    if (detectedCurriculumSubject === "Tamil" && tamilIndexText.trim()) {
      supportingDocuments.push({
        role: "textbook_index",
        fileName: tamilIndexFileName,
        text: tamilIndexText,
      });
    }
    if (detectedCurriculumSubject === "Tamil" && tamilStructureText.trim()) {
      supportingDocuments.push({
        role: "textbook_structure",
        fileName: tamilStructureFileName || "Tamil Textbook Structure.txt",
        text: tamilStructureText,
      });
    }
    const res = await fetch("/api/analyze-curriculum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Request-Id": requestId,
      },
      body: JSON.stringify({
        text: inputText,
        fileName,
        selectedClasses,
        persist: true,
        supportingDocuments,
      }),
    });

    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to extract the selected curriculum."));
    }

    return res.json();
  };

  const closePendingCurriculumSelection = () => {
    setPendingCurriculumSelection(null);
    setSelectedClassNamesToStore([]);
  };

  const closeTamilIndexModal = () => {
    setShowTamilIndexModal(false);
    setPendingTamilIndexPreflight(null);
  };

  const fetchSavedCurriculums = async () => {
    const res = await fetch("/api/curriculums");
    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to load saved curriculums."));
    }
    const data = await res.json();
    const curriculums = (data.curriculums || []) as SavedCurriculumSummary[];
    setSavedCurriculums(curriculums);
    return curriculums;
  };

  const syncWorkspaceState = (workspace: PlanningWorkspace) => {
    if (currentWorkspaceId && currentWorkspaceId !== workspace._id) {
      setGeneratedSessions({});
    }
    setCurrentWorkspaceId(workspace._id);
    setActiveWorkspace(workspace);
    localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
  };

  const applyAnalyzedCurriculum = (data: any) => {
    setCurrentCurriculumId(data.curriculumId || "");
    setExtractedData(data.curriculum?.extractedCurriculum || data.curriculum || null);
    setEditingJsonText("");
    if (data.curriculumId) {
      localStorage.setItem(LAST_CURRICULUM_ID_KEY, data.curriculumId);
    }
    if (data.workspaceId && data.workspace) {
      syncWorkspaceState(data.workspace as PlanningWorkspace);
    }
  };

  const continueCurriculumAnalysisAfterPreflight = async (
    requestId: string,
    classOptions: CurriculumClassOptionsResponse
  ) => {
    const classSummaries = Array.isArray(classOptions.detectedClasses)
      ? classOptions.detectedClasses as CurriculumClassSummary[]
      : [];

    if (classOptions.requiresClassSelection && classSummaries.length > 1) {
      setPendingCurriculumSelection({
        classSummaries,
      });
      setSelectedClassNamesToStore(classSummaries.map((item) => item.className));
      return;
    }

    setLoadingMessage("Parsing only the selected class curriculum and building the planning workspace...");
    const saveData = await runCurriculumExtraction(
      requestId,
      classSummaries.length ? classSummaries.map((item) => item.className) : []
    );
    applyAnalyzedCurriculum(saveData);
    await fetchSavedCurriculums();
  };

  const hasRenderableSessionSection = (value: unknown): boolean => {
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number" || typeof value === "boolean") return true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
    return false;
  };

  const hasRequiredSessionSections = (
    sessionPlan: Partial<SessionPlan> | undefined,
    requiredSections: SessionSectionKey[]
  ) =>
    requiredSections.every((section) =>
      hasRenderableSessionSection((sessionPlan as Record<string, unknown> | undefined)?.[section])
    );

  const getGeneratedSessionArtifactKeys = (workspace?: PlanningWorkspace | null) =>
    new Set(
      (workspace?.generatedArtifacts || [])
        .filter((artifact) => artifact.scope === "session" && artifact.artifactType === "session_bundle")
        .map((artifact) => artifact.id.match(/^session-(.+)$/)?.[1] || "")
        .filter(Boolean)
    );

  const mapAllocationsToTermRows = (allocations: TermAllocation[] = []) =>
    allocations.map((row, index) => ({
      id: `term-allocation-${index + 1}-${row.termNumber ?? row.termName}`,
      className: row.className || "Curriculum",
      termNumber: row.termNumber ?? undefined,
      term: row.termName,
      unitName: "Whole Term",
      chapters: (row.chapters || []).map((chapter) => String(chapter || "").trim()).filter(Boolean),
      recurringStrands: row.recurringStrands || [],
      recurringStrandDetails: row.recurringStrandDetails || [],
      marks: Number(row.marks || 0),
    })) as TermRow[];

  const summarizeRowsIntoSelectedTerm = (rows: TermRow[]) => {
    if (rows.length === 0) {
      setSelectedTermRow(null);
      return;
    }

    const firstClassName = rows[0]?.className || "Curriculum";
    const firstTermName = rows[0]?.term;
    const firstTermRows = rows.filter((row) => row.className === firstClassName && row.term === firstTermName);
    setSelectedTermRow({
      id: `term-${firstClassName}-${rows[0]?.termNumber || firstTermName}`,
      className: firstClassName,
      termNumber: rows[0]?.termNumber,
      term: firstTermName,
      unitName: "Whole Term",
      chapters: Array.from(new Set<string>(firstTermRows.flatMap((row) => row.chapters as string[]))),
      recurringStrands: Array.from(new Set<string>(firstTermRows.flatMap((row) => row.recurringStrands || []))),
      recurringStrandDetails: Array.from(
        new Map(
          firstTermRows.flatMap((row) => (row.recurringStrandDetails || []).map((strand) => [strand.title, strand] as const))
        ).values()
      ),
      marks: Number(firstTermRows.reduce((sum, row) => sum + row.marks, 0).toFixed(2)),
    });
  };

  const syncTermRowsFromAllocations = (allocations: TermAllocation[] = []) => {
    const rows = mapAllocationsToTermRows(allocations);
    setTermsList(rows);
    setTermDivisionStats({
      totalMarks: Number(rows.reduce((sum, row) => sum + row.marks, 0).toFixed(2)),
    });
    summarizeRowsIntoSelectedTerm(rows);
  };

  const parseMultilineList = (value: string) =>
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

  const stringifyMultilineList = (value?: string[]) => (value || []).join("\n");

  const latexToReadableText = (value: string) =>
    String(value || "")
      .replace(/\\\\/g, "\\")
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
      .replace(/\\sqrt\{([^{}]+)\}/g, "√($1)")
      .replace(/\\times/g, "×")
      .replace(/\\cdot/g, "·")
      .replace(/\\div/g, "÷")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
      .replace(/\\,/g, " ")
      .replace(/\\;/g, " ")
      .replace(/\\:/g, " ")
      .replace(/\\text\{([^{}]+)\}/g, "$1")
      .replace(/\{|\}/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const CHEMICAL_ELEMENT_SYMBOLS = new Set([
    "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
    "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
    "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
    "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr",
    "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn",
    "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd",
    "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb",
    "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
    "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th",
    "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm",
    "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds",
    "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og",
  ]);

  const looksLikeChemicalFormulaToken = (value: string) => {
    const token = String(value || "").trim();
    if (!token || !/[A-Z]/.test(token)) return false;

    let index = 0;
    let groupCount = 0;
    let hasDigit = false;
    let hasGrouping = false;
    let hasChargeOrHydrate = false;

    while (index < token.length) {
      const char = token[index];
      if (/[A-Z]/.test(char)) {
        let symbol = char;
        if (/[a-z]/.test(token[index + 1] || "")) {
          symbol += token[index + 1];
          index += 1;
        }
        if (!CHEMICAL_ELEMENT_SYMBOLS.has(symbol)) {
          return false;
        }
        groupCount += 1;
        index += 1;
        continue;
      }
      if (/\d/.test(char)) {
        hasDigit = true;
        while (/\d/.test(token[index + 1] || "")) {
          index += 1;
        }
        index += 1;
        continue;
      }
      if (char === "(" || char === ")" || char === "[" || char === "]") {
        hasGrouping = true;
        index += 1;
        continue;
      }
      if (char === "+" || char === "-" || char === "^" || char === "·" || char === ".") {
        hasChargeOrHydrate = true;
        index += 1;
        continue;
      }
      return false;
    }

    return groupCount > 0 && (hasDigit || hasGrouping || hasChargeOrHydrate || groupCount >= 2);
  };

  const chemicalFormulaToLatex = (value: string) => {
    const token = String(value || "").trim();
    if (!looksLikeChemicalFormulaToken(token)) {
      return "";
    }

    const chargeMatch = token.match(/^(.*?)(?:\^?(\d*)([+-]))$/);
    const hasExplicitCharge = Boolean(chargeMatch && (chargeMatch[2] || chargeMatch[3]) && !/[()[\].·]$/.test(chargeMatch[1] || ""));
    const main = hasExplicitCharge ? String(chargeMatch?.[1] || "") : token;
    const chargeDigits = hasExplicitCharge ? String(chargeMatch?.[2] || "") : "";
    const chargeSign = hasExplicitCharge ? String(chargeMatch?.[3] || "") : "";

    let latex = "";
    let index = 0;
    while (index < main.length) {
      const char = main[index];
      if (/[A-Z]/.test(char)) {
        let symbol = char;
        if (/[a-z]/.test(main[index + 1] || "")) {
          symbol += main[index + 1];
          index += 1;
        }
        latex += `\\mathrm{${symbol}}`;
        index += 1;
        continue;
      }
      if (/\d/.test(char)) {
        let digits = char;
        while (/\d/.test(main[index + 1] || "")) {
          digits += main[index + 1];
          index += 1;
        }
        latex += `_{${digits}}`;
        index += 1;
        continue;
      }
      if (char === "(" || char === ")" || char === "[" || char === "]") {
        latex += char;
        index += 1;
        continue;
      }
      if (char === "·" || char === ".") {
        latex += "\\cdot ";
        index += 1;
        continue;
      }
      index += 1;
    }

    if (hasExplicitCharge) {
      latex += `^{${chargeDigits || ""}${chargeSign}}`;
    }
    return latex;
  };

  const splitChemicalFormulaSegments = (value: string) => {
    const text = String(value || "");
    if (!text.trim()) return [];

    const segments: Array<{ type: "text" | "math"; value: string }> = [];
    const candidatePattern = /[A-Z][A-Za-z0-9()[\]^+\-.·]*/g;
    let lastIndex = 0;

    for (const match of text.matchAll(candidatePattern)) {
      const token = match[0] || "";
      const start = match.index ?? 0;
      if (!looksLikeChemicalFormulaToken(token)) {
        continue;
      }
      if (start > lastIndex) {
        const prose = text.slice(lastIndex, start);
        if (prose) segments.push({ type: "text", value: prose });
      }
      const latex = chemicalFormulaToLatex(token);
      if (latex) {
        segments.push({ type: "math", value: latex });
        lastIndex = start + token.length;
      }
    }

    if (lastIndex < text.length) {
      const tail = text.slice(lastIndex);
      if (tail) segments.push({ type: "text", value: tail });
    }

    return segments.length > 0 ? segments : [{ type: "text", value: text }];
  };

  const formatMathReadableText = (value: unknown): string => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return typeof value === "string" ? value : value == null ? "" : String(value);
    }
    const mathValue = value as { text?: unknown; latex?: unknown; displayLatex?: unknown };
    const text = typeof mathValue.text === "string" ? mathValue.text.trim() : "";
    const latex = typeof mathValue.displayLatex === "string" && mathValue.displayLatex.trim()
      ? mathValue.displayLatex.trim()
      : typeof mathValue.latex === "string" ? mathValue.latex.trim() : "";
    const readableLatex = latexToReadableText(latex);
    if (text && readableLatex) {
      return text.includes(readableLatex) ? text : `${text} ${readableLatex}`.trim();
    }
    return text || readableLatex;
  };

  const formatRenderableText = (value: unknown): string => {
    if (value == null) return "";
    if (typeof value === "object" && !Array.isArray(value)) {
      const mathReadable = formatMathReadableText(value);
      if (mathReadable) {
        return mathReadable;
      }
    }
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
      return value.map((item) => formatRenderableText(item)).filter(Boolean).join("; ");
    }
    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>)
        .map(([key, entryValue]) => {
          const renderedValue = formatRenderableText(entryValue);
          return renderedValue ? `${key}: ${renderedValue}` : key;
        })
        .filter(Boolean);
      return entries.join(" | ");
    }
    return String(value);
  };

  const getRenderableMathLines = (value: unknown): string[] => {
    const values = Array.isArray(value) ? value : value == null ? [] : [value];
    return values
      .map((item) => formatRenderableText(item).replace(/\s+/g, " ").trim())
      .filter(Boolean);
  };

  const buildVisualOverlayLabels = (visualSupport?: string[]) => {
    if (!Array.isArray(visualSupport)) return [];
    return visualSupport
      .map((item) => formatRenderableText(item).trim())
      .filter(Boolean)
      .slice(0, 5)
      .map((item, index) => {
        const colonIndex = item.indexOf(":");
        if (colonIndex > 0) {
          return {
            id: index + 1,
            title: item.slice(0, colonIndex).trim(),
            detail: item.slice(colonIndex + 1).trim(),
          };
        }
        return {
          id: index + 1,
          title: item,
          detail: "",
        };
      });
  };

  const getRenderableList = (value: unknown): string[] => {
    const values = Array.isArray(value) ? value : value == null ? [] : [value];
    return values
      .map((item) => formatRenderableText(item).replace(/\s+/g, " ").trim())
      .filter(Boolean);
  };

  const getMathLatex = (value: unknown): string => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    const mathValue = value as { latex?: unknown; displayLatex?: unknown };
    return String(mathValue.displayLatex || mathValue.latex || "").trim();
  };

  const consumeLatexMathToken = (value: string, startIndex: number) => {
    const source = String(value || "");
    const length = source.length;
    let index = startIndex;
    const consumeBalanced = (openChar: string, closeChar: string) => {
      if (source[index] !== openChar) return false;
      let depth = 0;
      while (index < length) {
        const char = source[index];
        if (char === openChar) depth += 1;
        if (char === closeChar) {
          depth -= 1;
          if (depth === 0) {
            index += 1;
            return true;
          }
        }
        index += 1;
      }
      return false;
    };

    if (source.startsWith("\\sqrt", index)) {
      index += 5;
      while (source[index] === " ") index += 1;
      if (source[index] === "{") {
        consumeBalanced("{", "}");
      } else if (source[index] === "(") {
        consumeBalanced("(", ")");
      } else {
        while (index < length && /[A-Za-z0-9.]/.test(source[index])) index += 1;
      }
      return index;
    }

    if (source[index] === "\\") {
      index += 1;
      while (index < length && /[A-Za-z]/.test(source[index])) index += 1;
      while (source[index] === " ") index += 1;
      while (source[index] === "{") {
        if (!consumeBalanced("{", "}")) break;
        while (source[index] === " ") index += 1;
      }
      return index;
    }

    while (index < length && /[A-Za-z0-9.]/.test(source[index])) index += 1;
    while (index < length) {
      while (source[index] === " ") index += 1;
      if (source[index] === "^" || source[index] === "_") {
        index += 1;
        while (source[index] === " ") index += 1;
        if (source[index] === "{") {
          consumeBalanced("{", "}");
        } else if (/[A-Za-z0-9]/.test(source[index] || "")) {
          index += 1;
        }
        continue;
      }
      if (source[index] === "(") {
        consumeBalanced("(", ")");
        continue;
      }
      if (source[index] === "{") {
        consumeBalanced("{", "}");
        continue;
      }
      if (source[index] === "[") {
        consumeBalanced("[", "]");
        continue;
      }
      if (source.startsWith("\\sqrt", index) || source[index] === "\\") {
        index = consumeLatexMathToken(source, index);
        continue;
      }
      break;
    }
    return index;
  };

  const repairMalformedLatexFractions = (value: string) => {
    let next = String(value || "").trim();
    if (!next.includes("\\frac")) return next;
    next = next.replace(/\\frac\s*\{([^{}]+)\}\s*([^{}\s][^\n]*)/g, (_match, numerator, denominator) => {
      const cleanDenominator = String(denominator || "").trim();
      return cleanDenominator ? `\\frac{${numerator}}{${cleanDenominator}}` : `\\frac{${numerator}}`;
    });

    return next.replace(/\\frac(?!\s*\{)([^\n]+)/g, (_match, tail) => {
      const source = String(tail || "").trim();
      if (!source) return "\\frac";
      const splitIndex = consumeLatexMathToken(source, 0);
      const numerator = source.slice(0, splitIndex).trim();
      const denominator = source.slice(splitIndex).trim();
      if (!numerator || !denominator) return `\\frac ${source}`;
      return `\\frac{${numerator}}{${denominator}}`;
    });
  };

  const normalizeInlineMathText = (value: string) =>
    repairMalformedLatexFractions(
      String(value || "")
      .replace(/\\\$/g, "$")
      .replace(/^\$+|\$+$/g, "")
      .replace(/\$/g, "")
      .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")
      .replace(/\bsqrt\s*\(\s*([^)]+?)\s*\)/gi, "\\sqrt{$1}")
      .replace(/\b([A-Za-z])2\b/g, "$1^2")
      .replace(/\b([A-Za-z])3\b/g, "$1^3")
      .replace(/\[\s*([^\]]+?)\s*\]\s*\/\s*\[\s*([^\]]+?)\s*\]/g, "\\frac{$1}{$2}")
      .replace(/(\d+)\s*\/\s*\(\s*([^)]+?)\s*\)/g, "\\frac{$1}{$2}")
      .replace(/(\d+)\s*\/\s*([A-Za-z0-9\\sqrt{}]+)/g, "\\frac{$1}{$2}")
    );

  type MathStringClassification = "plain_text" | "mixed_inline_math" | "full_latex_line";
  type StudentNoteRenderSegment = { type: "text" | "math"; value: string; displayMode: boolean };
  type StudentNoteRenderPlan = { classification: MathStringClassification; segments: StudentNoteRenderSegment[] };

  const countNaturalLanguageWordsOutsideLatex = (value: string) => {
    const stripped = String(value || "")
      .replace(/\\text\{[^{}]*\}/g, " ")
      .replace(/\\[a-zA-Z]+/g, " ")
      .replace(/[{}[\]()_^=+\-*/×÷\\.,;:]/g, " ");
    return (stripped.match(/[A-Za-z]{3,}/g) || []).length;
  };

  const looksLikeStandaloneLatexMath = (value: string) => {
    const text = value.trim();
    if (!text) return false;
    const proseWordCount = countNaturalLanguageWordsOutsideLatex(text);
    if (proseWordCount > 0) return false;
    if (!(/\\[a-zA-Z]+|[_^=+\-*/×÷√]/.test(text) || /\d+\s*\/\s*[A-Za-z0-9(\\√]/.test(text))) return false;
    const normalized = normalizeInlineMathText(text);
    return /\\[a-zA-Z]+|[_^=+\-*/×÷√]/.test(normalized);
  };

  const unwrapLatexMathDelimiters = (value: string) => {
    const text = String(value || "").trim();
    if (!text) return "";
    if (text.startsWith("\\(") && text.endsWith("\\)")) {
      return text.slice(2, -2).trim();
    }
    if (text.startsWith("\\[") && text.endsWith("\\]")) {
      return text.slice(2, -2).trim();
    }
    if (text.startsWith("$$") && text.endsWith("$$")) {
      return text.slice(2, -2).trim();
    }
    if (text.startsWith("$") && text.endsWith("$")) {
      return text.slice(1, -1).trim();
    }
    return text;
  };

  const normalizeMathSetupWording = (value: string) =>
    String(value || "").trim().replace(/^Leg\s+([a-z])\s*=/i, "Let $1 =");

  const splitStudentNoteLeadingLabelAndMath = (value: string): MathRichText | null => {
    const text = normalizeMathSetupWording(value);
    if (!text) return null;

    const latexTextMatch = text.match(/^\\text\{([^{}]*)\}\s*(.+)$/s);
    if (latexTextMatch) {
      const labelText = formatRenderableText(latexTextMatch[1] || "").replace(/\s+/g, " ").trim();
      const mathText = unwrapLatexMathDelimiters(latexTextMatch[2] || "");
      if (!mathText || !looksLikeStandaloneLatexMath(mathText)) return null;
      const latex = normalizeInlineMathText(mathText);
      return {
        ...(labelText ? { text: labelText } : {}),
        latex,
        ...(/\\frac|=/.test(latex) ? { displayLatex: latex } : {}),
      };
    }

    const plainLabelMatch = text.match(/^([A-Za-z][A-Za-z0-9 ()/\-]{0,60}:)\s*(.+)$/s);
    if (!plainLabelMatch) return null;
    const labelText = formatRenderableText(plainLabelMatch[1] || "").replace(/\s+/g, " ").trim();
    const mathText = unwrapLatexMathDelimiters(plainLabelMatch[2] || "");
    if (!mathText || !looksLikeStandaloneLatexMath(mathText)) return null;
    const latex = normalizeInlineMathText(mathText);
    return {
      ...(labelText ? { text: labelText } : {}),
      latex,
      ...(/\\frac|=/.test(latex) ? { displayLatex: latex } : {}),
    };
  };

  const normalizeStudentNoteMathRichText = (value: MathRichText): MathRichText | null => {
    const rawText = typeof value.text === "string" ? normalizeMathSetupWording(value.text) : "";
    const rawLatex = typeof value.latex === "string" ? value.latex.trim() : "";
    const rawDisplayLatex = typeof value.displayLatex === "string" ? value.displayLatex.trim() : "";
    const rawMathCandidate = rawDisplayLatex || rawLatex;
    if (rawMathCandidate && !looksLikeStandaloneLatexMath(unwrapLatexMathDelimiters(rawMathCandidate))) {
      const combinedText = [rawText, rawMathCandidate].filter(Boolean).join(" ").trim();
      return combinedText ? { text: combinedText } : null;
    }
    const splitTextMath = rawText ? splitStudentNoteLeadingLabelAndMath(rawText) : null;
    const splitLatexMath = rawLatex ? splitStudentNoteLeadingLabelAndMath(rawLatex) : null;
    const splitDisplayMath = rawDisplayLatex ? splitStudentNoteLeadingLabelAndMath(rawDisplayLatex) : null;

    const normalizedLatex = normalizeInlineMathText(
      unwrapLatexMathDelimiters(splitLatexMath?.latex || rawLatex)
    );
    const normalizedDisplayLatex = normalizeInlineMathText(
      unwrapLatexMathDelimiters(splitDisplayMath?.displayLatex || splitDisplayMath?.latex || rawDisplayLatex)
    );

    let text = rawText;
    if (splitTextMath) {
      const splitLatex = normalizeInlineMathText(splitTextMath.latex || splitTextMath.displayLatex || "");
      const candidateLatex = normalizedDisplayLatex || normalizedLatex;
      if (!candidateLatex || splitLatex === candidateLatex) {
        text = splitTextMath.text || "";
      }
    }
    if (splitLatexMath?.text && (!text || text === rawLatex)) {
      text = splitLatexMath.text;
    }
    if (splitDisplayMath?.text && (!text || text === rawDisplayLatex)) {
      text = splitDisplayMath.text;
    }

    const latex = normalizedLatex || splitTextMath?.latex || "";
    const displayLatex = normalizedDisplayLatex || splitTextMath?.displayLatex || (latex && /\\frac|=/.test(latex) ? latex : "");

    const letAssignmentMatch = text.match(/^Let\s+([a-z])\s*=/i);
    if (letAssignmentMatch && (new RegExp(`^${letAssignmentMatch[1]}\\s*=`, "i").test(latex) || new RegExp(`^${letAssignmentMatch[1]}\\s*=`, "i").test(displayLatex))) {
      return { text };
    }

    if (!text && !latex && !displayLatex) return null;
    return {
      ...(text ? { text } : {}),
      ...(latex ? { latex } : {}),
      ...(displayLatex ? { displayLatex } : {}),
    };
  };

  const looksLikeFullLatexLine = (value: string) => {
    const text = value.trim();
    if (!text) return false;
    const leadingTextMathMatch = text.match(/^\\text\{([^{}]*)\}\s*(.+)$/s);
    if (leadingTextMathMatch) {
      return looksLikeStandaloneLatexMath(leadingTextMathMatch[2] || "");
    }
    return looksLikeStandaloneLatexMath(text);
  };

  const shouldRenderStringAsLatex = (value: string) => {
    const text = value.trim();
    if (!text) return false;
    return looksLikeStandaloneLatexMath(text);
  };

  const getBalancedSpanEnd = (value: string, startIndex: number, openChar: string, closeChar: string) => {
    const source = String(value || "");
    if (source[startIndex] !== openChar) return -1;
    let index = startIndex;
    let depth = 0;
    while (index < source.length) {
      const char = source[index];
      if (char === openChar) depth += 1;
      if (char === closeChar) {
        depth -= 1;
        if (depth === 0) {
          return index + 1;
        }
      }
      index += 1;
    }
    return -1;
  };

  const shouldConsumeInlineGroupedSpan = (value: string, startIndex: number, openChar: string, closeChar: string) => {
    const endIndex = getBalancedSpanEnd(value, startIndex, openChar, closeChar);
    if (endIndex === -1) return false;
    const inner = String(value || "").slice(startIndex + 1, endIndex - 1).trim();
    if (!inner) return false;
    if (openChar === "{") return true;
    if (looksLikeStandaloneLatexMath(inner)) return true;
    return countNaturalLanguageWordsOutsideLatex(inner) === 0
      && /\\[a-zA-Z]+|[_^=+\-*/×÷√]/.test(normalizeInlineMathText(inner));
  };

  const consumeInlineMathSpan = (value: string, startIndex: number) => {
    const source = String(value || "");
    const length = source.length;
    let index = startIndex;
    const consumeBalanced = (openChar: string, closeChar: string) => {
      const endIndex = getBalancedSpanEnd(source, index, openChar, closeChar);
      if (endIndex === -1) return false;
      index = endIndex;
      return true;
    };

    const consumeInlineAtom = () => {
      while (source[index] === " ") index += 1;

      if (source[index] === "\\") {
        index = consumeLatexMathToken(source, index);
      } else if (source.startsWith("sqrt(", index)) {
        index += 5;
        let depth = 1;
        while (index < length && depth > 0) {
          if (source[index] === "(") depth += 1;
          if (source[index] === ")") depth -= 1;
          index += 1;
        }
      } else if (source[index] === "√") {
        index += 1;
        while (source[index] === " ") index += 1;
        if (source[index] === "(") {
          let depth = 1;
          index += 1;
          while (index < length && depth > 0) {
            if (source[index] === "(") depth += 1;
            if (source[index] === ")") depth -= 1;
            index += 1;
          }
        } else if (source[index] === "{") {
          let depth = 1;
          index += 1;
          while (index < length && depth > 0) {
            if (source[index] === "{") depth += 1;
            if (source[index] === "}") depth -= 1;
            index += 1;
          }
        } else {
          while (index < length && /[A-Za-z0-9.]/.test(source[index])) index += 1;
        }
      } else if (source[index] === "(") {
        if (!shouldConsumeInlineGroupedSpan(source, index, "(", ")")) return;
        consumeBalanced("(", ")");
      } else if (source[index] === "{") {
        consumeBalanced("{", "}");
      } else if (source[index] === "[") {
        if (!shouldConsumeInlineGroupedSpan(source, index, "[", "]")) return;
        consumeBalanced("[", "]");
      } else {
        while (index < length && /[A-Za-z0-9.]/.test(source[index])) index += 1;
      }

      while (index < length) {
        while (source[index] === " ") index += 1;
        if (source[index] === "^" || source[index] === "_") {
          index += 1;
          while (source[index] === " ") index += 1;
          if (source[index] === "{") {
            consumeBalanced("{", "}");
          } else if (source[index] === "(") {
            consumeBalanced("(", ")");
          } else if (source[index] === "[") {
            consumeBalanced("[", "]");
          } else if (source[index] === "\\" || source.startsWith("sqrt(", index) || source[index] === "√") {
            consumeInlineAtom();
          } else {
            while (index < length && /[A-Za-z0-9.]/.test(source[index])) index += 1;
          }
          continue;
        }
        break;
      }
    };

    consumeInlineAtom();

    while (index < length) {
      while (source[index] === " ") index += 1;
      if (/^[+\-*/=×÷]$/.test(source[index] || "")) {
        index += 1;
        consumeInlineAtom();
        continue;
      }
      if (source[index] === "(" || source[index] === "{" || source[index] === "[") {
        if (source[index] !== "{" && !shouldConsumeInlineGroupedSpan(
          source,
          index,
          source[index],
          source[index] === "(" ? ")" : "]"
        )) {
          break;
        }
        consumeInlineAtom();
        continue;
      }
      break;
    }

    while (index > startIndex && /[.,;:]/.test(source[index - 1] || "")) {
      index -= 1;
    }

    return index;
  };

  const isPotentialInlineMathStart = (value: string, startIndex: number) => {
    const source = String(value || "");
    const char = source[startIndex] || "";
    if (char === "\\" || char === "√" || source.startsWith("sqrt(", startIndex)) return true;
    if (!/[A-Za-z0-9([{]/.test(char)) return false;
    const end = consumeInlineMathSpan(source, startIndex);
    const token = source.slice(startIndex, end).trim();
    if (!token) return false;
    if (/^[A-Za-z]{3,}$/.test(token)) return false;
    return /\\[a-zA-Z]+|[_^=+\-*/×÷√]/.test(token) || /\d+\s*\/\s*[A-Za-z0-9(\\√]/.test(token);
  };

  const extractInlineMathSegments = (value: string) => {
    const text = String(value || "").trim();
    if (!text) return [];

    if (text.includes("$")) {
      const dollarSegments: Array<{ type: "text" | "math"; value: string }> = [];
      let cursor = 0;
      while (cursor < text.length) {
        const openIndex = text.indexOf("$", cursor);
        if (openIndex === -1) {
          const tail = text.slice(cursor);
          if (tail.trim()) dollarSegments.push({ type: "text", value: tail });
          break;
        }

        if (openIndex > cursor) {
          const prose = text.slice(cursor, openIndex);
          if (prose.trim()) dollarSegments.push({ type: "text", value: prose });
        }

        const closeIndex = text.indexOf("$", openIndex + 1);
        if (closeIndex === -1) {
          const remainder = text.slice(openIndex + 1);
          if (remainder.trim()) dollarSegments.push({ type: "math", value: remainder });
          break;
        }

        const mathContent = unwrapLatexMathDelimiters(text.slice(openIndex, closeIndex + 1)).trim();
        if (mathContent) {
          dollarSegments.push({ type: "math", value: mathContent });
        }
        cursor = closeIndex + 1;
      }

      if (dollarSegments.some((segment) => segment.type === "math")) {
        return dollarSegments.flatMap((segment) =>
          segment.type === "text" ? splitChemicalFormulaSegments(segment.value) : [segment]
        );
      }
    }

    const segments: Array<{ type: "text" | "math"; value: string }> = [];
    let cursor = 0;
    let lastTextIndex = 0;

    while (cursor < text.length) {
      if (!isPotentialInlineMathStart(text, cursor)) {
        cursor += 1;
        continue;
      }

      if (cursor > lastTextIndex) {
        const prose = text.slice(lastTextIndex, cursor);
        if (prose.trim()) segments.push({ type: "text", value: prose });
      }

      const end = consumeInlineMathSpan(text, cursor);
      const token = text.slice(cursor, end).trim();
      if (token) {
        segments.push({ type: shouldRenderStringAsLatex(token) || /[=√/\\]/.test(token) ? "math" : "text", value: token });
      }
      cursor = Math.max(end, cursor + 1);
      lastTextIndex = cursor;
    }

    if (lastTextIndex < text.length) {
      const prose = text.slice(lastTextIndex);
      if (prose.trim()) segments.push({ type: "text", value: prose });
    }

    const finalSegments = (segments.length > 0 ? segments : [{ type: "text" as const, value: text }]).flatMap((segment) =>
      segment.type === "text" ? splitChemicalFormulaSegments(segment.value) : [segment]
    );
    return finalSegments.length > 0 ? finalSegments : [{ type: "text", value: text }];
  };

  const classifyMathString = (value: string): MathStringClassification => {
    const text = String(value || "").trim();
    if (!text) return "plain_text";
    if (looksLikeFullLatexLine(text)) return "full_latex_line";
    const segments = extractInlineMathSegments(text);
    return segments.some((segment) => segment.type === "math") ? "mixed_inline_math" : "plain_text";
  };

  const getStudentNoteRenderPlan = (value: StudentNoteRichValue): StudentNoteRenderPlan => {
    if (isMathRichText(value)) {
      const normalizedValue = normalizeStudentNoteMathRichText(value);
      if (!normalizedValue) return { classification: "plain_text", segments: [] };
      const text = formatRenderableText(normalizedValue.text || "").trim();
      const inlineLatex = String(normalizedValue.latex || "").trim();
      const displayLatex = String(normalizedValue.displayLatex || "").trim();
      if (displayLatex && !text) {
        return {
          classification: "full_latex_line",
          segments: [{ type: "math", value: displayLatex, displayMode: true }],
        };
      }
      return {
        classification: inlineLatex || displayLatex ? "mixed_inline_math" : "plain_text",
        segments: [
          ...(text ? [{ type: "text" as const, value: text, displayMode: false }] : []),
          ...(displayLatex ? [{ type: "math" as const, value: displayLatex, displayMode: true }] : []),
          ...(!displayLatex && inlineLatex ? [{ type: "math" as const, value: inlineLatex, displayMode: false }] : []),
        ],
      };
    }

    const text = String(value || "").trim();
    if (!text) return { classification: "plain_text", segments: [] };
    const normalizedText = normalizeMathSetupWording(text);
    const upgradedValue = splitStudentNoteLeadingLabelAndMath(normalizedText);
    if (upgradedValue) {
      return getStudentNoteRenderPlan(upgradedValue);
    }
    const classification = classifyMathString(normalizedText);
    if (classification === "full_latex_line") {
      return {
        classification,
        segments: [{ type: "math", value: normalizeInlineMathText(normalizedText), displayMode: false }],
      };
    }
    if (classification === "mixed_inline_math") {
      return {
        classification,
        segments: extractInlineMathSegments(normalizedText).map((segment) => ({
          type: segment.type as "text" | "math",
          value: segment.type === "math" ? normalizeInlineMathText(segment.value) : segment.value,
          displayMode: false,
        })),
      };
    }
    return {
      classification: "plain_text",
      segments: [{ type: "text", value: normalizedText, displayMode: false }],
    };
  };

  const renderMathLatex = (latex: string, displayMode = false, fallback = "") => {
    const normalizedLatex = normalizeInlineMathText(latex);
    try {
      return (
        <span
          className={displayMode ? "block max-w-full overflow-x-auto py-1" : "inline-block max-w-full overflow-x-auto align-middle"}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(normalizedLatex, {
              displayMode,
              throwOnError: false,
              strict: false,
            }),
          }}
        />
      );
    } catch {
      return <span className="whitespace-pre-wrap font-mono">{fallback || latexToReadableText(normalizedLatex) || latex}</span>;
    }
  };

  const renderMixedMathLine = (value: unknown, displayMode = false) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const plan = getStudentNoteRenderPlan(value as StudentNoteRichValue);
      if (plan.classification === "full_latex_line" && plan.segments[0]?.type === "math") {
        return renderMathLatex(plan.segments[0].value, true, plan.segments[0].value);
      }
      if (plan.segments.length > 0) {
        return (
          <span className={`min-w-0 max-w-full whitespace-pre-wrap font-mono ${displayMode ? "block space-y-1" : "inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 align-middle"}`}>
            {plan.segments.map((segment, index) => segment.type === "math"
              ? <span key={`${segment.value}-${index}`}>{renderMathLatex(segment.value, displayMode || segment.displayMode, segment.value)}</span>
              : <span key={`${segment.value}-${index}`}>{segment.value}</span>)}
          </span>
        );
      }
    }

    if (typeof value === "string") {
      const plan = getStudentNoteRenderPlan(value);
      if (plan.classification === "full_latex_line" && plan.segments[0]?.type === "math") {
        return renderMathExpression(plan.segments[0].value, displayMode);
      }
      if (plan.classification === "mixed_inline_math") {
        return (
          <span className={`min-w-0 max-w-full whitespace-pre-wrap font-mono ${displayMode ? "block space-y-1" : "inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 align-middle"}`}>
            {plan.segments.map((segment, index) => segment.type === "math"
              ? <span key={`${segment.value}-${index}`}>{renderMathLatex(segment.value, false, segment.value)}</span>
              : <span key={`${segment.value}-${index}`}>{segment.value}</span>)}
          </span>
        );
      }
    }

    return renderMathExpression(value, displayMode);
  };

  const renderMathExpression = (value: unknown, displayMode = false) => {
    const latex = getMathLatex(value) || (typeof value === "string" && (looksLikeFullLatexLine(value) || shouldRenderStringAsLatex(value)) ? normalizeInlineMathText(value.trim()) : "");
    const fallback = formatRenderableText(value).trim();
    if (!latex) {
      return <span className="whitespace-pre-wrap font-mono">{fallback}</span>;
    }

    return renderMathLatex(latex, displayMode, fallback);
  };

  const isMathRichText = (value: unknown): value is MathRichText =>
    Boolean(
      value
      && typeof value === "object"
      && !Array.isArray(value)
      && ("text" in (value as MathRichText) || "latex" in (value as MathRichText) || "displayLatex" in (value as MathRichText))
    );

  const normalizeStudentNoteRichValue = (value: unknown): StudentNoteRichValue | null => {
    if (value == null) return null;
    if (isMathRichText(value)) {
      return normalizeStudentNoteMathRichText(value);
    }
    if (typeof value === "string") {
      if (!value.trim()) return null;
      return splitStudentNoteLeadingLabelAndMath(value) || value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    const fallback = formatRenderableText(value).trim();
    return fallback || null;
  };

  const normalizeStudentNoteRichLine = (...parts: unknown[]): StudentNoteRichLine =>
    parts
      .flatMap((part) => Array.isArray(part) ? part : [part])
      .map((part) => normalizeStudentNoteRichValue(part))
      .filter((part): part is StudentNoteRichValue => Boolean(part));

  const normalizeStudentNoteRichLines = (value: unknown): StudentNoteRichLine[] => {
    const values = Array.isArray(value) ? value : value == null ? [] : [value];
    return values
      .map((item) => normalizeStudentNoteRichLine(item))
      .filter((line) => line.length > 0);
  };

  const formatStudentNoteRichLine = (line: StudentNoteRichLine): string =>
    line
      .map((item) => formatRenderableText(item).replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  const dedupeStudentNoteRichLines = (lines: StudentNoteRichLine[]) => {
    const seen = new Set<string>();
    return lines.filter((line) => {
      const key = formatStudentNoteRichLine(line);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const normalizeStudentNoteCueText = (value: string) =>
    normalizeMathSetupWording(
      String(value || "")
        .replace(/\s*\(\s*implicit unit from context\s*\)\s*/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    );

  const studentNoteCueVerbPattern = /^(state|identify|define|name|list|recall|write|draw|find|solve|use|apply|explain|compare|construct|prove|calculate|simplify|rationalize|show)\b/i;

  const isLikelyStudentNoteCueText = (value: string) => {
    const text = normalizeStudentNoteCueText(value);
    if (!text) return false;
    if (text.includes("?")) return true;
    if (studentNoteCueVerbPattern.test(text)) return true;
    if (text.split(/\s+/).length <= 6) return true;
    if (/^[A-Za-z][A-Za-z0-9 ()/\-]{0,40}:\s*.+$/.test(text) && text.length <= 72) return true;
    return false;
  };

  const buildStudentNoteCueLine = (...parts: unknown[]): StudentNoteRichLine | null => {
    const line = normalizeStudentNoteRichLine(...parts);
    if (line.length === 0) return null;
    const formatted = normalizeStudentNoteCueText(formatStudentNoteRichLine(line));
    if (!formatted || !isLikelyStudentNoteCueText(formatted) || formatted.length > 96) {
      return null;
    }
    return line;
  };

  const buildStudentNoteCueLines = (value: unknown): StudentNoteRichLine[] => {
    const values = Array.isArray(value) ? value : value == null ? [] : [value];
    return values
      .map((item) => buildStudentNoteCueLine(item))
      .filter((line): line is StudentNoteRichLine => Boolean(line));
  };

  const hasStudentNoteBlockContent = (block: StudentNoteBlock) =>
    block.type === "line"
      ? block.value.length > 0
      : block.items.length > 0;

  const renderStudentNoteRichLine = (line: StudentNoteRichLine, displayMode = false) => {
    if (line.length === 0) return null;
    if (line.length === 1) {
      return renderMixedMathLine(line[0], displayMode);
    }

    return (
      <span className={`max-w-full font-mono ${displayMode ? "block space-y-1" : "inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 whitespace-pre-wrap align-middle"}`}>
        {line.map((item, index) => (
          <span key={`${formatRenderableText(item)}-${index}`} className={displayMode ? "block" : "inline-flex max-w-full items-baseline"}>
            {renderMixedMathLine(item, displayMode)}
          </span>
        ))}
      </span>
    );
  };

  const renderStudentNoteBlock = (block: StudentNoteBlock, keyPrefix: string, className = "font-mono text-[12.5px] leading-7 text-slate-700") => {
    if (block.type === "line") {
      return (
        <p key={keyPrefix} className={className}>
          {renderStudentNoteRichLine(block.value, Boolean(block.displayMode))}
        </p>
      );
    }

    return (
      <div key={keyPrefix} className={className}>
        {block.label ? <div className="font-bold text-slate-800">{block.label}</div> : null}
        {block.ordered ? (
          <ol className="mt-1 list-decimal space-y-2 pl-5">
            {block.items.map((item, index) => <li key={`${keyPrefix}-${index}`}>{renderStudentNoteRichLine(item)}</li>)}
          </ol>
        ) : (
          <div className="mt-1 space-y-2">
            {block.items.map((item, index) => (
              <div key={`${keyPrefix}-${index}`} className="flex gap-2">
                <span className="text-slate-400">.</span>
                <span className="min-w-0 flex-1">{renderStudentNoteRichLine(item)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getMathDiagramList = (value: unknown): MathDiagramSpec[] =>
    Array.isArray(value)
      ? value.filter((item): item is MathDiagramSpec => Boolean(item && typeof item === "object" && (item as MathDiagramSpec).type))
      : [];

  const escapeSvgText = (value: unknown) =>
    formatRenderableText(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");

  const getDefaultDiagramSpec = (type: MathDiagramSpec["type"], id = "diagram"): MathDiagramSpec => {
    switch (type) {
      case "circle":
        return {
          id,
          type,
          title: "Circle",
          points: [{ id: "O", x: 160, y: 105, label: "O" }, { id: "A", x: 230, y: 105, label: "A" }],
          lines: [{ from: "O", to: "A", label: "r", highlight: true }],
          labels: [{ text: "radius", x: 188, y: 94 }],
        };
      case "quadrilateral":
        return {
          id,
          type,
          title: "Quadrilateral",
          points: [
            { id: "A", x: 70, y: 65, label: "A" },
            { id: "B", x: 240, y: 65, label: "B" },
            { id: "C", x: 260, y: 155, label: "C" },
            { id: "D", x: 55, y: 155, label: "D" },
          ],
          lines: [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "C", to: "D" }, { from: "D", to: "A" }],
        };
      case "coordinatePlane":
        return { id, type, title: "Coordinate Plane", axis: { xMin: -5, xMax: 5, yMin: -3, yMax: 3, points: [{ id: "P", x: 2, y: 2, label: "P(2, 2)" }] } };
      case "numberLine":
        return { id, type, title: "Number Line", axis: { xMin: -5, xMax: 5, points: [{ id: "A", x: 2, y: 0, label: "2" }] } };
      case "barModel":
        return { id, type, title: "Bar Model", bars: [{ label: "Whole", segments: [{ label: "Part A", value: "x", highlight: true }, { label: "Part B", value: "8" }] }] };
      case "solid3D":
        return { id, type, title: "Cuboid", solid: { width: "l", height: "h", depth: "b" } };
      case "anglePair":
        return {
          id,
          type,
          title: "Angle Pair",
          points: [{ id: "O", x: 150, y: 140, label: "O" }, { id: "A", x: 65, y: 140, label: "A" }, { id: "B", x: 245, y: 140, label: "B" }, { id: "C", x: 210, y: 65, label: "C" }],
          lines: [{ from: "O", to: "A" }, { from: "O", to: "B" }, { from: "O", to: "C", highlight: true }],
          arcs: [{ center: "O", radius: 36, startAngle: -38, endAngle: 0, label: "x" }, { center: "O", radius: 50, startAngle: 180, endAngle: 322, label: "180 - x" }],
        };
      case "triangle":
      case "polygon":
      case "rightTriangle":
      default:
        return {
          id,
          type: type || "rightTriangle",
          title: type === "triangle" ? "Triangle" : "Right Triangle",
          points: [
            { id: "A", x: 65, y: 155, label: "A" },
            { id: "B", x: 245, y: 155, label: "B" },
            { id: "C", x: 65, y: 55, label: "C" },
          ],
          lines: [
            { from: "A", to: "B", label: "base" },
            { from: "A", to: "C", label: "height" },
            { from: "B", to: "C", label: "hypotenuse", highlight: true },
          ],
          labels: type === "rightTriangle" ? [{ text: "90 deg", x: 82, y: 142 }] : [],
        };
    }
  };

  const normalizeDiagramForRender = (diagram: MathDiagramSpec): MathDiagramSpec => {
    const base = getDefaultDiagramSpec(diagram.type, diagram.id || "diagram");
    return {
      ...base,
      ...diagram,
      points: Array.isArray(diagram.points) && diagram.points.length > 0 ? diagram.points : base.points,
      lines: Array.isArray(diagram.lines) && diagram.lines.length > 0 ? diagram.lines : base.lines,
      arcs: Array.isArray(diagram.arcs) ? diagram.arcs : base.arcs,
      labels: Array.isArray(diagram.labels) && diagram.labels.length > 0 ? diagram.labels : base.labels,
      axis: diagram.axis || base.axis,
      bars: Array.isArray(diagram.bars) && diagram.bars.length > 0 ? diagram.bars : base.bars,
      solid: diagram.solid || base.solid,
    };
  };

  const getPointMap = (points: MathDiagramSpec["points"] = []) =>
    new Map(points.map((point) => [point.id, point]));

  const polarPoint = (center: { x: number; y: number }, radius: number, angleDeg: number) => {
    const angle = (angleDeg * Math.PI) / 180;
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  };

  const getDiagramTemplate = (diagram: MathDiagramSpec) => {
    if (diagram.template) return diagram.template;
    switch (diagram.type) {
      case "rightTriangle":
        return "rightTriangle";
      case "circle":
        return "circleRadiusDiameter";
      case "coordinatePlane":
        return "coordinatePlanePlot";
      case "quadrilateral":
        return "rectangleAreaPerimeter";
      case "anglePair":
        return "anglePair";
      case "barModel":
        return "barModel";
      case "solid3D":
        return "solid3D";
      default:
        return "";
    }
  };

  const getDiagramParams = (diagram: MathDiagramSpec): Record<string, unknown> =>
    diagram.params && typeof diagram.params === "object" ? diagram.params : {};

  const getTemplateRoots = (diagram: MathDiagramSpec) => {
    const params = getDiagramParams(diagram);
    const roots = Array.isArray(params.roots)
      ? params.roots.map((root) => Number(root)).filter((root) => Number.isFinite(root) && root >= 1 && root <= 20)
      : [];
    return roots.length > 0 ? Array.from(new Set(roots)).slice(0, 8) : [2, 3, 5];
  };

  const svgText = (text: unknown, x: number, y: number, options: { anchor?: string; size?: number; weight?: number | string; fill?: string } = {}) =>
    `<text x="${x}" y="${y}" text-anchor="${options.anchor || "start"}" font-family="Georgia, 'Times New Roman', serif" font-size="${options.size || 12}" font-weight="${options.weight || 700}" fill="${options.fill || "#0F172A"}">${escapeSvgText(text)}</text>`;

  const buildTemplateDiagramSvg = (diagram: MathDiagramSpec) => {
    const template = getDiagramTemplate(diagram);
    const params = getDiagramParams(diagram);
    const title = escapeSvgText(diagram.title || diagram.type);
    const stroke = "#334155";
    const accent = "#0F9F9B";
    const highlight = "#D97706";

    if (template === "sqrtNumberLineConstruction" || template === "theodorusSpiral") {
      const roots = getTemplateRoots(diagram);
      const highlightRoot = Number(params.highlightRoot || roots[roots.length - 1] || 2);
      const maxRoot = Math.max(highlightRoot, ...roots, 2);
      const maxValue = Math.ceil(Math.sqrt(maxRoot)) + 1;
      const axisStart = 58;
      const axisEnd = 462;
      const axisY = 238;
      const toX = (value: number) => axisStart + (value / maxValue) * (axisEnd - axisStart);
      const ticks = Array.from({ length: maxValue + 1 }, (_, index) => index);

      if (template === "theodorusSpiral") {
        const center = { x: 176, y: 192 };
        const scale = 41;
        let angle = 0;
        const points = [{ x: center.x + scale, y: center.y, label: "1" }];
        for (let root = 2; root <= Math.max(...roots, highlightRoot, 2); root += 1) {
          angle += Math.atan(1 / Math.sqrt(root - 1));
          points.push({
            x: center.x + Math.sqrt(root) * scale * Math.cos(-angle),
            y: center.y + Math.sqrt(root) * scale * Math.sin(-angle),
            label: `√${root}`,
          });
        }
        const triangles = points.slice(1).map((point, index) => {
          const previous = points[index];
          const isTarget = index + 2 === highlightRoot;
          return `<path d="M ${center.x} ${center.y} L ${previous.x} ${previous.y} L ${point.x} ${point.y} Z" fill="${isTarget ? "#FEF3C7" : "#ECFEFF"}" stroke="${isTarget ? highlight : "#94A3B8"}" stroke-width="${isTarget ? 2.6 : 1.4}" opacity="${isTarget ? 0.95 : 0.58}"/>`;
        }).join("");
        const pointLabels = points.slice(1).filter((_, index) => roots.includes(index + 2) || index + 2 === highlightRoot).map((point, index) => {
          const labelY = point.y + (index % 2 === 0 ? -12 : 18);
          return `${svgText(point.label, point.x, labelY, { anchor: "middle", size: 12, fill: point.label === `√${highlightRoot}` ? "#92400E" : "#0F766E" })}`;
        }).join("");
        return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 300" role="img" aria-label="${title}">
  <rect width="520" height="300" rx="18" fill="#F8FAFC"/>
  ${svgText(title, 24, 34, { size: 18, weight: 800 })}
  <circle cx="${center.x}" cy="${center.y}" r="4.5" fill="#0F172A"/>
  ${triangles}
  ${pointLabels}
  ${svgText("unit steps create successive √n lengths", 300, 232, { size: 12, weight: 600, fill: "#475569" })}
</svg>`;
      }

      const rootMarkers = roots.map((root, index) => {
        const value = Math.sqrt(root);
        const x = toX(value);
        const arcHeight = 24 + index * 13;
        const isTarget = root === highlightRoot;
        const labelY = axisY + 38 + (index % 2) * 18;
        return `
  <path d="M ${axisStart} ${axisY} Q ${(axisStart + x) / 2} ${axisY - arcHeight * 2} ${x} ${axisY}" fill="none" stroke="${isTarget ? highlight : accent}" stroke-width="${isTarget ? 3 : 2}" stroke-linecap="round"/>
  <circle cx="${x}" cy="${axisY}" r="${isTarget ? 5 : 4}" fill="${isTarget ? highlight : accent}"/>
  ${svgText(`√${root}`, x, labelY, { anchor: "middle", size: 12, fill: isTarget ? "#92400E" : "#0F766E" })}`;
      }).join("");
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 300" role="img" aria-label="${title}">
  <rect width="520" height="300" rx="18" fill="#F8FAFC"/>
  ${svgText(title, 24, 34, { size: 18, weight: 800 })}
  <line x1="${axisStart}" y1="${axisY}" x2="${axisEnd}" y2="${axisY}" stroke="${stroke}" stroke-width="2.2"/>
  <path d="M ${axisEnd - 8} ${axisY - 5} L ${axisEnd} ${axisY} L ${axisEnd - 8} ${axisY + 5}" fill="none" stroke="${stroke}" stroke-width="2.2"/>
  ${ticks.map((tick) => `<line x1="${toX(tick)}" y1="${axisY - 6}" x2="${toX(tick)}" y2="${axisY + 6}" stroke="#64748B"/>${svgText(tick, toX(tick), axisY + 24, { anchor: "middle", size: 11, weight: 600, fill: "#475569" })}`).join("")}
  <path d="M ${axisStart} ${axisY} L ${axisStart + 70} ${axisY} L ${axisStart + 70} ${axisY - 70} Z" fill="#ECFEFF" stroke="#94A3B8" stroke-width="1.8"/>
  <path d="M ${axisStart + 58} ${axisY} L ${axisStart + 58} ${axisY - 12} L ${axisStart + 70} ${axisY - 12}" fill="none" stroke="${accent}" stroke-width="2"/>
  ${svgText("1", axisStart + 35, axisY - 8, { anchor: "middle", size: 11, fill: "#334155" })}
  ${svgText("1", axisStart + 78, axisY - 34, { size: 11, fill: "#334155" })}
  ${rootMarkers}
  ${svgText("Transfer each constructed hypotenuse length onto the number line.", 24, 282, { size: 12, weight: 600, fill: "#475569" })}
</svg>`;
    }

    return "";
  };

  const buildMathDiagramSvg = (rawDiagram: MathDiagramSpec) => {
    const diagram = normalizeDiagramForRender(rawDiagram);
    const points = diagram.points || [];
    const pointMap = getPointMap(points);
    const title = escapeSvgText(diagram.title || diagram.type);
    const caption = "";
    const stroke = "#334155";
    const accent = "#0F9F9B";
    const highlight = "#D97706";
    const templateMarkup = buildTemplateDiagramSvg(diagram);
    if (templateMarkup) return templateMarkup;

    if (diagram.type === "coordinatePlane" || diagram.type === "numberLine") {
      const axis = diagram.axis || {};
      const xMin = Number(axis.xMin ?? -5);
      const xMax = Number(axis.xMax ?? 5);
      const yMin = Number(axis.yMin ?? -3);
      const yMax = Number(axis.yMax ?? 3);
      const toX = (x: number) => 40 + ((x - xMin) / Math.max(1, xMax - xMin)) * 240;
      const toY = (y: number) => 180 - ((y - yMin) / Math.max(1, yMax - yMin)) * 140;
      const ticks = Array.from({ length: xMax - xMin + 1 }, (_, index) => xMin + index);
      const axisPoints = Array.isArray(axis.points) ? axis.points : [];
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" role="img" aria-label="${title}">
  <rect width="320" height="220" rx="16" fill="#F8FAFC"/>
  <text x="18" y="26" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#0F172A">${title}</text>
  ${diagram.type === "coordinatePlane" ? `<line x1="40" y1="${toY(0)}" x2="280" y2="${toY(0)}" stroke="${stroke}" stroke-width="2"/><line x1="${toX(0)}" y1="40" x2="${toX(0)}" y2="180" stroke="${stroke}" stroke-width="2"/>` : `<line x1="40" y1="120" x2="280" y2="120" stroke="${stroke}" stroke-width="2"/>`}
  ${ticks.map((tick) => `<line x1="${toX(tick)}" y1="${diagram.type === "coordinatePlane" ? toY(0) - 4 : 114}" x2="${toX(tick)}" y2="${diagram.type === "coordinatePlane" ? toY(0) + 4 : 126}" stroke="#64748B"/><text x="${toX(tick)}" y="${diagram.type === "coordinatePlane" ? toY(0) + 18 : 146}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#475569">${tick}</text>`).join("")}
  ${axisPoints.map((point) => `<circle cx="${toX(Number(point.x))}" cy="${diagram.type === "coordinatePlane" ? toY(Number(point.y)) : 120}" r="5" fill="${highlight}"/><text x="${toX(Number(point.x)) + 8}" y="${diagram.type === "coordinatePlane" ? toY(Number(point.y)) - 8 : 108}" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#92400E">${escapeSvgText(point.label || point.id)}</text>`).join("")}
  ${caption ? `<text x="18" y="205" font-family="Arial, sans-serif" font-size="11" fill="#64748B">${caption}</text>` : ""}
</svg>`;
    }

    if (diagram.type === "barModel") {
      const bars = diagram.bars || [];
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" role="img" aria-label="${title}">
  <rect width="320" height="220" rx="16" fill="#F8FAFC"/>
  <text x="18" y="26" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#0F172A">${title}</text>
  ${bars.map((bar, barIndex) => {
    const y = 62 + barIndex * 54;
    const segments = bar.segments && bar.segments.length > 0 ? bar.segments : [{ label: bar.label, value: bar.value }];
    const segmentWidth = 220 / Math.max(1, segments.length);
    return `<text x="24" y="${y + 22}" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#334155">${escapeSvgText(bar.label || `Bar ${barIndex + 1}`)}</text>${segments.map((segment, index) => {
      const x = 78 + index * segmentWidth;
      return `<rect x="${x}" y="${y}" width="${segmentWidth}" height="34" fill="${segment.highlight ? "#FEF3C7" : "#E0F2FE"}" stroke="${segment.highlight ? highlight : accent}" stroke-width="2"/><text x="${x + segmentWidth / 2}" y="${y + 22}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#0F172A">${escapeSvgText(segment.value || segment.label || "")}</text>`;
    }).join("")}`;
  }).join("")}
  ${caption ? `<text x="18" y="205" font-family="Arial, sans-serif" font-size="11" fill="#64748B">${caption}</text>` : ""}
</svg>`;
    }

    if (diagram.type === "solid3D") {
      const solid = diagram.solid || {};
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" role="img" aria-label="${title}">
  <rect width="320" height="220" rx="16" fill="#F8FAFC"/>
  <text x="18" y="26" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#0F172A">${title}</text>
  <polygon points="80,78 205,78 245,115 120,115" fill="#DBEAFE" stroke="${stroke}" stroke-width="2"/>
  <polygon points="120,115 245,115 245,170 120,170" fill="#E0F2FE" stroke="${stroke}" stroke-width="2"/>
  <polygon points="80,78 120,115 120,170 80,132" fill="#F8FAFC" stroke="${stroke}" stroke-width="2"/>
  <line x1="80" y1="132" x2="205" y2="132" stroke="#94A3B8" stroke-dasharray="5 5"/>
  <line x1="205" y1="78" x2="205" y2="132" stroke="#94A3B8" stroke-dasharray="5 5"/>
  <line x1="205" y1="132" x2="245" y2="170" stroke="#94A3B8" stroke-dasharray="5 5"/>
  <text x="170" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#334155">width ${escapeSvgText(solid.width || "l")}</text>
  <text x="254" y="146" font-family="Arial, sans-serif" font-size="12" fill="#334155">height ${escapeSvgText(solid.height || "h")}</text>
  <text x="77" y="157" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#334155">depth ${escapeSvgText(solid.depth || "b")}</text>
  ${caption ? `<text x="18" y="205" font-family="Arial, sans-serif" font-size="11" fill="#64748B">${caption}</text>` : ""}
</svg>`;
    }

    const lineMarkup = (diagram.lines || []).map((line) => {
      const from = pointMap.get(line.from);
      const to = pointMap.get(line.to);
      if (!from || !to) return "";
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${line.highlight ? highlight : stroke}" stroke-width="${line.highlight ? 4 : 2.5}" stroke-linecap="round" ${line.style === "dashed" ? "stroke-dasharray=\"6 5\"" : ""}/>${line.label ? `<text x="${midX}" y="${midY - 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="${line.highlight ? "#92400E" : "#334155"}">${escapeSvgText(line.label)}</text>` : ""}`;
    }).join("");
    const arcMarkup = (diagram.arcs || []).map((arc) => {
      const center = pointMap.get(arc.center);
      if (!center) return "";
      const start = polarPoint(center, Number(arc.radius || 30), Number(arc.startAngle || 0));
      const end = polarPoint(center, Number(arc.radius || 30), Number(arc.endAngle || 90));
      const largeArc = Math.abs(Number(arc.endAngle || 0) - Number(arc.startAngle || 0)) > 180 ? 1 : 0;
      const labelPoint = polarPoint(center, Number(arc.radius || 30) + 14, (Number(arc.startAngle || 0) + Number(arc.endAngle || 0)) / 2);
      return `<path d="M ${start.x} ${start.y} A ${arc.radius} ${arc.radius} 0 ${largeArc} 1 ${end.x} ${end.y}" fill="none" stroke="${arc.highlight ? highlight : accent}" stroke-width="2.5"/>${arc.label ? `<text x="${labelPoint.x}" y="${labelPoint.y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#0F766E">${escapeSvgText(arc.label)}</text>` : ""}`;
    }).join("");
    const pointMarkup = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="#0F172A"/><text x="${point.x + 8}" y="${point.y - 8}" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#0F172A">${escapeSvgText(point.label || point.id)}</text>`).join("");
    const labelMarkup = [...(diagram.labels || []), ...(diagram.measurements || [])]
      .map((label) => `<text x="${label.x}" y="${label.y}" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#334155">${escapeSvgText(label.text || label.latex || "")}</text>`)
      .join("");
    const polygonPoints = (diagram.type === "polygon" || diagram.type === "quadrilateral" || diagram.type === "triangle" || diagram.type === "rightTriangle")
      ? points.map((point) => `${point.x},${point.y}`).join(" ")
      : "";

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" role="img" aria-label="${title}">
  <rect width="320" height="220" rx="16" fill="#F8FAFC"/>
  <text x="18" y="26" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#0F172A">${title}</text>
  ${diagram.type === "circle" ? `<circle cx="${pointMap.get("O")?.x || 160}" cy="${pointMap.get("O")?.y || 105}" r="70" fill="#ECFEFF" stroke="${stroke}" stroke-width="2.5"/>` : ""}
  ${polygonPoints ? `<polygon points="${polygonPoints}" fill="#ECFEFF" stroke="none" opacity="0.75"/>` : ""}
  ${lineMarkup}
  ${diagram.type === "rightTriangle" ? `<path d="M 65 135 L 85 135 L 85 155" fill="none" stroke="${accent}" stroke-width="2.5"/>` : ""}
  ${arcMarkup}
  ${pointMarkup}
  ${labelMarkup}
  ${caption ? `<text x="18" y="205" font-family="Arial, sans-serif" font-size="11" fill="#64748B">${caption}</text>` : ""}
</svg>`;
  };

  const renderGeometryDiagram = (diagram: MathDiagramSpec, compact = false) => {
    const normalized = normalizeDiagramForRender(diagram);
    return (
      <figure className={`overflow-hidden rounded-[8px] border border-[#e7dfd2] bg-white shadow-sm ${compact ? "" : "p-3"}`}>
        <div
          className="mx-auto aspect-[16/11] w-full max-w-[520px] [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: buildMathDiagramSvg(normalized) }}
        />
        {normalized.caption ? (
          <figcaption className="px-3 pb-3 pt-1 font-mono text-[11px] leading-5 text-slate-500">
            {formatRenderableText(normalized.caption)}
          </figcaption>
        ) : null}
      </figure>
    );
  };

  const renderFormulaCard = (card: MathFormulaCard, index: number) => (
    <div key={`${card.title || "formula"}-${index}`} className="rounded-[6px] border border-[#e7dfd2] bg-white p-4 shadow-sm">
      <div className="font-mono text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">{formatRenderableText(card.title || `Formula ${index + 1}`)}</div>
      <div className="mt-3 rounded-[6px] bg-[#f8fafc] px-3 py-2 text-[14px] text-slate-900">
        {renderMathExpression(card.formula || "", true)}
      </div>
      {card.meaning ? <p className="mt-3 font-mono text-[12px] leading-6 text-slate-700">{formatRenderableText(card.meaning)}</p> : null}
      {card.whenToUse ? <p className="mt-2 font-mono text-[12px] leading-6 text-slate-600"><span className="font-bold text-slate-800">Use when:</span> {formatRenderableText(card.whenToUse)}</p> : null}
    </div>
  );

  const buildStudentNotesTemplateContent = (
    studentNotes: NonNullable<SessionPlan["studentLessonNotes"]>,
    fallbackTitle?: string,
  ): StudentNotesTemplate => {
    const noteSections: StudentNoteSection[] = [];

    const buildLineBlock = (...parts: unknown[]): StudentNoteBlock | null => {
      const value = normalizeStudentNoteRichLine(...parts);
      return value.length > 0 ? { type: "line", value } : null;
    };

    const buildListBlock = (
      label: string,
      value: unknown,
      options?: { ordered?: boolean }
    ): StudentNoteBlock | null => {
      const items = normalizeStudentNoteRichLines(value);
      return items.length > 0 ? { type: "list", label, items, ordered: options?.ordered } : null;
    };

    const addSection = (title: unknown, blocks: Array<StudentNoteBlock | null>, cues: StudentNoteRichLine[] = []) => {
      const cleanedBlocks = blocks.filter((block): block is StudentNoteBlock => Boolean(block && hasStudentNoteBlockContent(block)));
      const cleanedCues = dedupeStudentNoteRichLines(cues);
      const heading = normalizePdfText(formatRenderableText(title || "")).replace(/\s+/g, " ").trim();
      if (!heading && cleanedBlocks.length === 0 && cleanedCues.length === 0) return;
      noteSections.push({
        title: heading || `Notes ${noteSections.length + 1}`,
        blocks: cleanedBlocks,
        cues: cleanedCues,
      });
    };

    addSection(
      studentNotes.title || fallbackTitle || "Session Notes",
      [
        buildLineBlock(studentNotes.sessionOverview),
        buildLineBlock(studentNotes.introduction),
      ],
      [
        ...buildStudentNoteCueLines(studentNotes.quickRecall).slice(0, 4),
      ],
    );

    (Array.isArray(studentNotes.sections) ? studentNotes.sections : []).forEach((section, index) => {
      addSection(
        section.heading || `Concept ${index + 1}`,
        [
          buildLineBlock(section.explanation),
          buildLineBlock(section.detailedExplanation),
          buildLineBlock("Why it matters: ", section.whyItMatters),
          buildListBlock("Examples", section.examples),
          buildListBlock("Important notes", section.importantNotes),
          buildListBlock("Summary", section.conceptSummary),
        ],
        [
          ...buildStudentNoteCueLines(section.keyPoints),
          ...buildStudentNoteCueLines(section.terminology),
          ...buildStudentNoteCueLines(section.memoryTechniques),
          ...buildStudentNoteCueLines(section.visualSupport),
        ],
      );
    });

    if (Array.isArray(studentNotes.definitions) && studentNotes.definitions.length > 0) {
      addSection(
        "Definitions",
        studentNotes.definitions.map((item) => buildLineBlock(`${formatRenderableText(item.term)}: `, item.definition)),
        studentNotes.definitions
          .map((item) => buildStudentNoteCueLine(item.term))
          .filter((line): line is StudentNoteRichLine => Boolean(line)),
      );
    }

    if (Array.isArray(studentNotes.workedExamples) && studentNotes.workedExamples.length > 0) {
      studentNotes.workedExamples.forEach((example, index) => {
        const solutionLines = normalizeStudentNoteRichLines(example.solutionSteps);
        addSection(
          example.title || `Worked Example ${index + 1}`,
          [
            buildLineBlock("Problem: ", example.problem),
            buildListBlock("Given", example.given),
            buildListBlock("Formula", example.formula),
            solutionLines.length > 0
              ? buildListBlock("Step", example.solutionSteps, { ordered: true })
              : buildListBlock("Step", example.steps, { ordered: true }),
            buildListBlock("Reasoning", example.reasoning, { ordered: true }),
            buildLineBlock("Explanation: ", example.explanation),
            buildLineBlock("Final answer: ", example.finalAnswer),
          ],
          [
            ...[buildStudentNoteCueLine(example.title || `Example ${index + 1}`)].filter((line): line is StudentNoteRichLine => Boolean(line)),
            ...buildStudentNoteCueLines(example.formula),
            ...buildStudentNoteCueLines(example.finalAnswer),
          ],
        );
      });
    }

    if (studentNotes.revisionSection) {
      addSection(
        "Revision Recap",
        [
          buildListBlock("Definitions", studentNotes.revisionSection.definitions),
          buildListBlock("Formulas", studentNotes.revisionSection.formulas),
          buildListBlock("Facts", studentNotes.revisionSection.facts),
          buildListBlock("Quick recap", studentNotes.revisionSection.quickRecap),
        ],
        [
          ...buildStudentNoteCueLines(studentNotes.revisionSection.formulas),
          ...buildStudentNoteCueLines(studentNotes.revisionSection.keywords),
          ...buildStudentNoteCueLines(studentNotes.revisionSection.conceptMap),
        ],
      );
    }

    if (Array.isArray(studentNotes.selfCheckQuestions) && studentNotes.selfCheckQuestions.length > 0) {
      addSection(
        "Self Check",
        [{ type: "list", items: normalizeStudentNoteRichLines(studentNotes.selfCheckQuestions), ordered: true }],
        buildStudentNoteCueLines(studentNotes.selfCheckQuestions),
      );
    }

    const cueItems = dedupeStudentNoteRichLines(
      noteSections.flatMap((section) => section.cues).concat([
        ...buildStudentNoteCueLines(studentNotes.keyTerms),
        ...buildStudentNoteCueLines(studentNotes.easyToRemember),
        ...buildStudentNoteCueLines(studentNotes.learningObjectives),
        ...buildStudentNoteCueLines(studentNotes.didYouKnow),
      ])
    );

    const summaryLines = dedupeStudentNoteRichLines([
      ...normalizeStudentNoteRichLines(studentNotes.quickSummary),
      ...normalizeStudentNoteRichLines(studentNotes.summary),
      ...normalizeStudentNoteRichLines(studentNotes.quickRevision),
      ...normalizeStudentNoteRichLines(studentNotes.rememberPoints),
      ...(getRenderableList(studentNotes.keyTerms).length
        ? [normalizeStudentNoteRichLine(`Keywords: ${getRenderableList(studentNotes.keyTerms).join(", ")}`)]
        : []),
    ]);

    return {
      noteTitle: normalizePdfText(formatRenderableText(studentNotes.title || fallbackTitle || "Session Notes")).replace(/\s+/g, " ").trim() || "Session Notes",
      cueItems,
      noteSections,
      summaryLines,
    };
  };

  const buildStudentCornellHeading = (
    session: Pick<SessionPlan, "title" | "sessionNumber" | "studentLessonNotes">,
    template: ReturnType<typeof buildStudentNotesTemplateContent>,
    context: { subjectLabel: string; gradeLabel: string; dateLabel: string },
  ) => {
    const normalize = (value: unknown) => normalizePdfText(formatRenderableText(value)).replace(/\s+/g, " ").trim();
    const canonicalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const extractTopicLabel = (value: string) => {
      const text = normalize(value);
      if (!text) return "";
      const colonSplit = text.match(/^(?:[A-Za-z][A-Za-z &/\-]*\s+)?Session\s+\d+\s*:\s*(.+)$/i);
      if (colonSplit) return colonSplit[1].trim();
      const subjectSessionSplit = text.match(/^[A-Za-z][A-Za-z &/\-]*\s+Session\s+\d+\s*:\s*(.+)$/i);
      if (subjectSessionSplit) return subjectSessionSplit[1].trim();
      const dashSessionSplit = text.match(/^(.+?)\s*-\s*Session\s+\d+$/i);
      if (dashSessionSplit) return dashSessionSplit[1].trim();
      return text;
    };
    const primaryHeading = normalize(session.title || template.noteTitle || "Session Notes") || "Session Notes";
    const candidateSecondary = normalize(session.studentLessonNotes?.title || template.noteTitle || "");
    const primaryTopic = extractTopicLabel(primaryHeading);
    const candidateTopic = extractTopicLabel(candidateSecondary);
    const secondaryHeading = candidateTopic && canonicalize(candidateTopic) !== canonicalize(primaryHeading)
      ? candidateTopic
      : "";
    const sessionLabel = Number.isFinite(Number(session.sessionNumber)) ? `Session ${session.sessionNumber}` : "Session";
    const metaLine = [sessionLabel, context.subjectLabel, context.gradeLabel, context.dateLabel].filter(Boolean).join("  •  ");
    const topicLabel = candidateTopic || primaryTopic || secondaryHeading || primaryHeading;

    return {
      primaryHeading,
      secondaryHeading,
      topicLabel,
      sessionLabel,
      metaLine,
    };
  };

  const noteAccentStyles = {
    slate: {
      card: "border-slate-200 bg-white/90",
      eyebrow: "text-slate-500",
      badge: "bg-slate-100 text-slate-700",
    },
    teal: {
      card: "border-[#9FCDD2]/45 bg-white/90",
      eyebrow: "text-[#2C7A78]",
      badge: "bg-[#36ADAA]/10 text-[#227C79]",
    },
    amber: {
      card: "border-amber-200 bg-white/90",
      eyebrow: "text-amber-700",
      badge: "bg-amber-100 text-amber-800",
    },
    emerald: {
      card: "border-emerald-200 bg-white/90",
      eyebrow: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800",
    },
    sky: {
      card: "border-sky-200 bg-white/90",
      eyebrow: "text-sky-700",
      badge: "bg-sky-100 text-sky-800",
    },
    rose: {
      card: "border-rose-200 bg-white/90",
      eyebrow: "text-rose-700",
      badge: "bg-rose-100 text-rose-800",
    },
  } as const;

  const renderNoteSummaryStat = (label: string, value: string | number, accent: keyof typeof noteAccentStyles = "slate") => (
    <div className={`rounded-2xl border px-3 py-2 backdrop-blur-sm ${noteAccentStyles[accent].card}`}>
      <div className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${noteAccentStyles[accent].eyebrow}`}>{label}</div>
      <div className="mt-1 text-lg font-display font-black text-slate-800">{value}</div>
    </div>
  );

  const renderNoteListSection = ({
    title,
    items,
    accent = "slate",
    ordered = false,
    description,
    className = "",
  }: {
    title: string;
    items: string[];
    accent?: keyof typeof noteAccentStyles;
    ordered?: boolean;
    description?: string;
    className?: string;
  }) => {
    if (items.length === 0) return null;
    return (
      <div className={`rounded-[24px] border p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${noteAccentStyles[accent].card} ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${noteAccentStyles[accent].eyebrow}`}>{title}</div>
            {description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p> : null}
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${noteAccentStyles[accent].badge}`}>{items.length}</span>
        </div>
        <ol className={`mt-3 space-y-2 text-xs leading-relaxed text-slate-700 ${ordered ? "list-decimal pl-4" : "list-disc pl-4"}`}>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ol>
      </div>
    );
  };

  const renderRichNoteListSection = ({
    title,
    items,
    accent = "slate",
    ordered = false,
    description,
    className = "",
  }: {
    title: string;
    items: StudentNoteRichLine[];
    accent?: keyof typeof noteAccentStyles;
    ordered?: boolean;
    description?: string;
    className?: string;
  }) => {
    if (items.length === 0) return null;
    return (
      <div className={`rounded-[24px] border p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${noteAccentStyles[accent].card} ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${noteAccentStyles[accent].eyebrow}`}>{title}</div>
            {description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p> : null}
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${noteAccentStyles[accent].badge}`}>{items.length}</span>
        </div>
        <ol className={`mt-3 space-y-2 text-xs leading-relaxed text-slate-700 ${ordered ? "list-decimal pl-4" : "list-disc pl-4"}`}>
          {items.map((item, index) => (
            <li key={`${title}-${formatStudentNoteRichLine(item)}-${index}`}>{renderStudentNoteRichLine(item)}</li>
          ))}
        </ol>
      </div>
    );
  };

  type TeacherTemplateAccent = keyof typeof noteAccentStyles;
  type TeacherTemplateListCard = {
    title: string;
    items: StudentNoteRichLine[];
    accent: TeacherTemplateAccent;
    ordered?: boolean;
    description?: string;
  };

  type TeacherNotesTemplate = {
    overview?: NonNullable<SessionPlan["teacherLessonNotes"]>["sessionOverview"];
    stats: Array<{ label: string; value: string | number; accent: "teal" | "amber" | "sky" | "emerald" }>;
    preparationCards: TeacherTemplateListCard[];
    interactionCards: TeacherTemplateListCard[];
    supportCards: TeacherTemplateListCard[];
    teachingPlan: NonNullable<SessionPlan["teacherLessonNotes"]>["teachingPlan"];
    lessonBlocks: NonNullable<SessionPlan["teacherLessonNotes"]>["lessonBlocks"];
    conceptFlow: NonNullable<SessionPlan["teacherLessonNotes"]>["conceptFlow"];
    classroomQuestions: NonNullable<SessionPlan["teacherLessonNotes"]>["classroomQuestions"];
    timePlan: NonNullable<SessionPlan["teacherLessonNotes"]>["timePlan"];
    misconceptions: NonNullable<SessionPlan["teacherLessonNotes"]>["commonMisconceptionsDetailed"];
    endOfClassRecap: NonNullable<SessionPlan["teacherLessonNotes"]>["endOfClassRecap"];
  };

  const buildTeacherNotesTemplate = (teacherNotes: NonNullable<SessionPlan["teacherLessonNotes"]>): TeacherNotesTemplate => {
    const learningOutcomes = normalizeStudentNoteRichLines(teacherNotes.learningOutcomes);
    const prerequisiteKnowledge = normalizeStudentNoteRichLines(teacherNotes.prerequisiteKnowledge);
    const previousSessionRecap = normalizeStudentNoteRichLines(teacherNotes.previousSessionRecap);
    const teachingSequence = normalizeStudentNoteRichLines(teacherNotes.teachingSequence);
    const guidedPractice = normalizeStudentNoteRichLines(teacherNotes.guidedPractice);
    const lessonPurpose = normalizeStudentNoteRichLines(teacherNotes.lessonPurpose);
    const formativeChecks = normalizeStudentNoteRichLines(teacherNotes.formativeChecks);
    const assessmentQuestions = normalizeStudentNoteRichLines(teacherNotes.assessmentQuestions);
    const teacherTips = normalizeStudentNoteRichLines(teacherNotes.teacherTips);
    const blackboardSummary = normalizeStudentNoteRichLines(teacherNotes.blackboardSummary);
    const sessionSummary = normalizeStudentNoteRichLines(teacherNotes.sessionSummary);
    const nextSessionBridge = normalizeStudentNoteRichLines(teacherNotes.nextSessionBridge);
    const lessonBlocks = Array.isArray(teacherNotes.lessonBlocks) ? teacherNotes.lessonBlocks : [];
    const classroomQuestions = Array.isArray(teacherNotes.classroomQuestions) ? teacherNotes.classroomQuestions : [];
    const conceptFlow = Array.isArray(teacherNotes.conceptFlow) ? teacherNotes.conceptFlow : [];
    const timePlan = Array.isArray(teacherNotes.timePlan) ? teacherNotes.timePlan : [];
    const misconceptions = Array.isArray(teacherNotes.commonMisconceptionsDetailed) ? teacherNotes.commonMisconceptionsDetailed : [];
    const endOfClassRecap = Array.isArray(teacherNotes.endOfClassRecap) ? teacherNotes.endOfClassRecap : [];

    return {
      overview: teacherNotes.sessionOverview,
      stats: [
        { label: "Outcomes", value: learningOutcomes.length || "-", accent: "teal" },
        { label: "Lesson Blocks", value: lessonBlocks.length || "-", accent: "amber" },
        { label: "Question Prompts", value: classroomQuestions.length || "-", accent: "sky" },
        { label: "Checks", value: formativeChecks.length || "-", accent: "emerald" },
      ],
      preparationCards: [
        { title: "Teacher-Facing Learning Outcomes", items: learningOutcomes, accent: "teal" as const },
        { title: "Prerequisite Knowledge", items: prerequisiteKnowledge, accent: "amber" as const },
        { title: "Previous Session Recap", items: previousSessionRecap, accent: "slate" as const },
        {
          title: "Lesson Purpose",
          items: lessonPurpose,
          accent: "amber" as const,
          description: "What this lesson is trying to unlock for the teacher and class.",
        },
      ].filter((card) => card.items.length > 0),
      interactionCards: [
        { title: "Teaching Sequence", items: teachingSequence, accent: "slate" as const, ordered: true },
        { title: "Guided Practice", items: guidedPractice, accent: "emerald" as const },
        { title: "Formative Checks", items: formativeChecks, accent: "emerald" as const },
        { title: "Assessment Questions", items: assessmentQuestions, accent: "sky" as const, ordered: true },
      ].filter((card) => card.items.length > 0),
      supportCards: [
        { title: "Teacher Tips", items: teacherTips, accent: "amber" as const },
        { title: "Blackboard Summary", items: blackboardSummary, accent: "slate" as const },
        { title: "Session Summary", items: sessionSummary, accent: "teal" as const },
        { title: "Next Session Bridge", items: nextSessionBridge, accent: "sky" as const },
        { title: "Slow Learners", items: normalizeStudentNoteRichLines(teacherNotes.differentiation?.slowLearners), accent: "amber" as const },
        { title: "Average Learners", items: normalizeStudentNoteRichLines(teacherNotes.differentiation?.averageLearners), accent: "slate" as const },
        { title: "Advanced Learners", items: normalizeStudentNoteRichLines(teacherNotes.differentiation?.advancedLearners), accent: "emerald" as const },
      ].filter((card) => card.items.length > 0),
      teachingPlan: Array.isArray(teacherNotes.teachingPlan) ? teacherNotes.teachingPlan : [],
      lessonBlocks,
      conceptFlow,
      classroomQuestions,
      timePlan,
      misconceptions,
      endOfClassRecap,
    };
  };

  const renderInlineChipList = ({
    title,
    items,
    accent = "slate",
  }: {
    title: string;
    items: string[];
    accent?: keyof typeof noteAccentStyles;
  }) => {
    if (items.length === 0) return null;
    return (
      <div className={`rounded-[24px] border p-4 ${noteAccentStyles[accent].card}`}>
        <div className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${noteAccentStyles[accent].eyebrow}`}>{title}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span key={`${title}-${index}`} className={`rounded-full px-3 py-1 text-xs font-semibold ${noteAccentStyles[accent].badge}`}>
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderRichParagraph = (
    value: unknown,
    className = "text-xs leading-relaxed text-slate-700",
    displayMode = false,
  ) => {
    const line = normalizeStudentNoteRichLine(value);
    if (line.length === 0) return null;
    return <p className={className}>{renderStudentNoteRichLine(line, displayMode)}</p>;
  };

  const renderRichList = (
    value: unknown,
    options?: {
      ordered?: boolean;
      className?: string;
      itemClassName?: string;
    },
  ) => {
    const items = normalizeStudentNoteRichLines(value);
    if (items.length === 0) return null;
    const ListTag = options?.ordered ? "ol" : "ul";
    return (
      <ListTag className={options?.className || `${options?.ordered ? "list-decimal" : "list-disc"} list-inside space-y-1 text-xs text-slate-700`}>
        {items.map((item, index) => (
          <li key={`${formatStudentNoteRichLine(item)}-${index}`} className={options?.itemClassName}>
            {renderStudentNoteRichLine(item)}
          </li>
        ))}
      </ListTag>
    );
  };

  const parseAssessmentNumberedItems = (value: string) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return null;

    const pattern = /(^|\s)(\d+)\.\s+/g;
    const markers: Array<{ number: number; index: number; contentStart: number }> = [];
    let match: RegExpExecArray | null = null;

    while ((match = pattern.exec(text)) !== null) {
      const number = Number(match[2]);
      const markerIndex = match.index + match[1].length;
      markers.push({
        number,
        index: markerIndex,
        contentStart: pattern.lastIndex,
      });
    }

    if (markers.length < 2 || markers[0]?.number !== 1) return null;
    for (let index = 1; index < markers.length; index += 1) {
      if (markers[index].number !== markers[index - 1].number + 1) {
        return null;
      }
    }

    const prefix = text.slice(0, markers[0].index).trim().replace(/[:\-–]\s*$/, "").trim();
    const items = markers
      .map((marker, index) => {
        const endIndex = index + 1 < markers.length ? markers[index + 1].index : text.length;
        return text.slice(marker.contentStart, endIndex).trim().replace(/\s+/g, " ");
      })
      .filter(Boolean);

    if (items.length < 2) return null;

    return { prefix, items };
  };

  const parseAssessmentLeadingExpression = (value: string) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text || !isPotentialInlineMathStart(text, 0)) return null;

    const expressionEnd = consumeInlineMathSpan(text, 0);
    const expression = text.slice(0, expressionEnd).trim().replace(/[.,;:]+$/, "").trim();
    const meta = text.slice(expressionEnd).trim().replace(/^[,.;:]\s*/, "").trim();
    if (!expression || !shouldRenderStringAsLatex(expression)) return null;
    if (!meta) {
      return { expression, meta: "" };
    }

    const looksLikeMeta =
      meta.startsWith("(")
      || /^(degree|term|terms|coefficient|factor|root|roots|solution|solutions|value|values)\b/i.test(meta)
      || /^\([^)]+\)\.?$/.test(meta)
      || meta.length <= 48;

    return looksLikeMeta ? { expression, meta } : null;
  };

  const renderAssessmentMathLine = (value: unknown, displayMode = false) => {
    const line = normalizeStudentNoteRichLine(value);
    if (line.length === 0) return null;

    const baseTextClassName = displayMode
      ? "block text-[14.5px] leading-8 tracking-[0.01em] text-slate-800"
      : "inline text-[14.5px] leading-8 tracking-[0.01em] text-slate-800";
    const textSegmentClassName = "whitespace-pre-wrap";
    const mathChipClassName = displayMode
      ? "my-1 block max-w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 shadow-sm"
      : "inline-flex max-w-full overflow-x-auto rounded-md border border-slate-200/80 bg-slate-50/85 px-1.5 py-0.5 align-middle shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]";

    const renderSegments = (segments: Array<{ type: "text" | "math"; value: string; displayMode: boolean }>) => (
      <span className={`${baseTextClassName} ${displayMode ? "space-y-2" : "inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5"}`}>
        {segments.map((segment, index) => {
          if (segment.type === "math") {
            const shouldDisplay = displayMode || segment.displayMode;
            return (
              <span key={`${segment.value}-${index}`} className={shouldDisplay ? "block" : mathChipClassName}>
                {renderMathLatex(segment.value, shouldDisplay, segment.value)}
              </span>
            );
          }
          return <span key={`${segment.value}-${index}`} className={textSegmentClassName}>{segment.value}</span>;
        })}
      </span>
    );

    if (line.length === 1) {
      const item = line[0];
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const plan = getStudentNoteRenderPlan(item as StudentNoteRichValue);
        const plainObjectText =
          "text" in (item as Record<string, unknown>)
            ? formatRenderableText((item as Record<string, unknown>).text || "").trim()
            : "";

        if (plainObjectText) {
          const numberedItems = parseAssessmentNumberedItems(plainObjectText);
          if (numberedItems) {
            return (
              <div className="space-y-2">
                {numberedItems.prefix ? (
                  <div className="text-[14.5px] leading-7 tracking-[0.01em] text-slate-700">
                    {numberedItems.prefix}
                  </div>
                ) : null}
                <ol className="list-decimal space-y-2 pl-5 text-slate-800 marker:font-semibold marker:text-slate-500">
                  {numberedItems.items.map((listItem, index) => (
                    <li key={`${listItem}-${index}`} className="pl-1">
                      {renderAssessmentMathLine(listItem)}
                    </li>
                  ))}
                </ol>
              </div>
            );
          }

          const leadingExpression = parseAssessmentLeadingExpression(plainObjectText);
          if (leadingExpression) {
            return (
              <div className="space-y-2">
                <div className="my-1 rounded-xl bg-slate-50 px-3 py-3 text-center shadow-sm ring-1 ring-slate-200/80">
                  {renderMathLatex(leadingExpression.expression, true, leadingExpression.expression)}
                </div>
                {leadingExpression.meta ? (
                  <div className="text-[13px] leading-6 tracking-[0.01em] text-slate-500">
                    {renderAssessmentMathLine(leadingExpression.meta)}
                  </div>
                ) : null}
              </div>
            );
          }
        }

        if (plan.classification === "full_latex_line" && plan.segments[0]?.type === "math") {
          return (
            <div className="my-1 max-w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 shadow-sm">
              {renderMathLatex(plan.segments[0].value, true, plan.segments[0].value)}
            </div>
          );
        }
        if (plan.segments.length > 0) {
          return renderSegments(plan.segments);
        }
      }

      if (typeof item === "string") {
        const numberedItems = parseAssessmentNumberedItems(item);
        if (numberedItems) {
          return (
            <div className="space-y-2">
              {numberedItems.prefix ? (
                <div className="text-[14.5px] leading-7 tracking-[0.01em] text-slate-700">
                  {numberedItems.prefix}
                </div>
              ) : null}
              <ol className="list-decimal space-y-2 pl-5 text-slate-800 marker:font-semibold marker:text-slate-500">
                {numberedItems.items.map((listItem, index) => (
                  <li key={`${listItem}-${index}`} className="pl-1">
                    {renderAssessmentMathLine(listItem)}
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        const leadingExpression = parseAssessmentLeadingExpression(item);
        if (leadingExpression) {
          return (
            <div className="space-y-2">
              <div className="my-1 rounded-xl bg-slate-50 px-3 py-3 text-center shadow-sm ring-1 ring-slate-200/80">
                {renderMathLatex(leadingExpression.expression, true, leadingExpression.expression)}
              </div>
              {leadingExpression.meta ? (
                <div className="text-[13px] leading-6 tracking-[0.01em] text-slate-500">
                  {renderAssessmentMathLine(leadingExpression.meta)}
                </div>
              ) : null}
            </div>
          );
        }

        const plan = getStudentNoteRenderPlan(item);
        if (plan.classification === "full_latex_line" && plan.segments[0]?.type === "math") {
          return (
            <div className="my-1 max-w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 shadow-sm">
              {renderMathLatex(plan.segments[0].value, true, plan.segments[0].value)}
            </div>
          );
        }
        if (plan.classification === "mixed_inline_math") {
          return renderSegments(plan.segments);
        }
      }

      return (
        <span className={`${baseTextClassName} ${textSegmentClassName}`}>
          {renderMixedMathLine(item, displayMode)}
        </span>
      );
    }

    return (
      <div className="space-y-2">
        {line.map((item, index) => (
          <div key={`${formatRenderableText(item)}-${index}`} className={baseTextClassName}>
            {renderAssessmentMathLine(item, displayMode)}
          </div>
        ))}
      </div>
    );
  };

  const renderAssessmentRichList = (
    value: unknown,
    options?: {
      ordered?: boolean;
      className?: string;
      itemClassName?: string;
    },
  ) => {
    const items = normalizeStudentNoteRichLines(value);
    if (items.length === 0) return null;
    const ListTag = options?.ordered ? "ol" : "ul";
    return (
      <ListTag className={options?.className || `${options?.ordered ? "list-decimal" : "list-disc"} list-inside space-y-2 text-sm text-slate-700`}>
        {items.map((item, index) => (
          <li key={`${formatStudentNoteRichLine(item)}-${index}`} className={options?.itemClassName}>
            {renderAssessmentMathLine(item)}
          </li>
        ))}
      </ListTag>
    );
  };

  const renderStudentVisualFigure = (
    asset: any,
    assetIdx: number,
    heading: string,
    visualSupport: string[],
  ) => {
    const visualPoints = buildVisualOverlayLabels(visualSupport);
    return (
      <figure key={`${heading}-${assetIdx}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(54,173,170,0.08),rgba(233,202,183,0.18))] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#227C79]">Generated Visual</div>
              <div className="mt-1 text-sm font-bold text-slate-800">{heading || `Visual ${assetIdx + 1}`}</div>
            </div>
            {asset.model ? (
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-600 backdrop-blur">
                {formatRenderableText(asset.model)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="bg-[radial-gradient(circle_at_top,rgba(159,205,210,0.16),rgba(255,255,255,0.98)_68%)] p-4">
          <div className="rounded-[20px] border border-slate-100 bg-white/90 p-4 shadow-inner">
            <div className="aspect-[4/3] overflow-hidden rounded-[18px] bg-[linear-gradient(160deg,#f8fafc,#eef7f7)]">
              <img
                src={asset.imageDataUrl}
                alt={formatRenderableText(asset.alt || `${heading} visual`)}
                className="h-full w-full object-contain p-3"
              />
            </div>
          </div>
        </div>
        <figcaption className="space-y-3 px-4 pb-4">
          <div className="text-[11px] leading-relaxed text-slate-500">
            {asset.alt ? formatRenderableText(asset.alt) : "AI-generated classroom visual"}
          </div>
          {visualPoints.length > 0 ? (
            <div className="rounded-[18px] border border-[#9FCDD2]/35 bg-[#9FCDD2]/10 p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#2C7A78]">Visual Focus</div>
              <div className="mt-2 space-y-2">
                {visualPoints.map((label) => (
                  <div key={`${heading}-${label.id}`} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#227C79] shadow-sm">
                      {label.id}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800">{label.title}</span>
                      {label.detail ? <span className="text-slate-500"> - {label.detail}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </figcaption>
      </figure>
    );
  };

  const renderTeacherNotesPanel = (teacherNotes: NonNullable<SessionPlan["teacherLessonNotes"]>) => {
    const template = buildTeacherNotesTemplate(teacherNotes);
    const lessonBlocks = template.lessonBlocks;
    const classroomQuestions = template.classroomQuestions;
    const conceptFlow = template.conceptFlow;
    const timePlan = template.timePlan;

    return (
      <div className="overflow-hidden rounded-[30px] border border-[#D8E5E8] bg-[linear-gradient(180deg,rgba(250,252,252,1),rgba(243,247,247,1))] shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="border-b border-white/80 bg-[radial-gradient(circle_at_top_left,rgba(159,205,210,0.30),rgba(255,255,255,0.98)_55%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(233,202,183,0.18))] p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2B3437] text-white shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#586A71]">Teacher Notes</div>
                  <h4 className="font-display text-lg font-black tracking-tight text-slate-900">Instruction-ready classroom guide</h4>
                </div>
              </div>
              {template.overview ? (
                <p className="max-w-3xl text-sm leading-relaxed text-slate-700">{renderMixedMathLine(template.overview)}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:min-w-[420px]">
              {template.stats.map((stat) => (
                <div key={stat.label}>
                  {renderNoteSummaryStat(stat.label, stat.value, stat.accent)}
                </div>
              ))}
            </div>
          </div>

          {(template.overview || template.preparationCards.length > 0) && (
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] items-start">
              {template.overview ? (
                <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 backdrop-blur-sm">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Session Overview</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{renderMixedMathLine(template.overview)}</p>
                </div>
              ) : null}
              {template.preparationCards.find((card) => card.title === "Lesson Purpose")
                ? renderRichNoteListSection(template.preparationCards.find((card) => card.title === "Lesson Purpose")!)
                : null}
            </div>
          )}
        </div>

        <div className="space-y-5 p-5 md:p-6">
          {template.preparationCards.filter((card) => card.title !== "Lesson Purpose").length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Core Preparation</div>
              <h5 className="mt-1 text-base font-black text-slate-900">What the teacher should walk in holding</h5>
              <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {template.preparationCards.filter((card) => card.title !== "Lesson Purpose").map((card) => (
                  <div key={card.title}>{renderRichNoteListSection(card)}</div>
                ))}
              </div>
            </div>
          ) : null}

          {template.interactionCards.length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Interaction & Checks</div>
              <h5 className="mt-1 text-base font-black text-slate-900">Prompts, practice, and quick understanding checks</h5>
              <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-2">
                {template.interactionCards.map((card) => <div key={card.title}>{renderRichNoteListSection(card)}</div>)}
              </div>
            </div>
          ) : null}

          {Array.isArray(template.teachingPlan) && template.teachingPlan.length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Delivery Flow</div>
                  <h5 className="mt-1 text-base font-black text-slate-900">Topic pacing snapshot</h5>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">{template.teachingPlan.length} segments</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {template.teachingPlan.map((item, idx) => (
                  <div key={idx} className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-slate-900">{renderMixedMathLine(item.topic)}</div>
                      <span className="rounded-full bg-[#36ADAA]/10 px-2.5 py-1 text-[10px] font-bold text-[#227C79]">
                        {formatRenderableText(item.minutes)} min
                      </span>
                    </div>
                    {item.teachingStrategy ? (
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">{renderMixedMathLine(item.teachingStrategy)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {lessonBlocks.length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Detailed Lesson Blocks</div>
                  <h5 className="mt-1 text-base font-black text-slate-900">Step-by-step teaching flow</h5>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">{lessonBlocks.length} blocks</span>
              </div>
              <div className="mt-5 space-y-4">
                {lessonBlocks.map((block, idx) => (
                  <div key={idx} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Block {idx + 1}</div>
                        <div className="mt-1 text-base font-black text-slate-900">{formatRenderableText(block.title)}</div>
                      </div>
                      {block.durationMinutes != null ? (
                        <span className="rounded-full bg-[#2B3437] px-3 py-1 text-[10px] font-bold text-white">
                          {formatRenderableText(block.durationMinutes)} min
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      {renderRichNoteListSection({ title: "Teacher Prompt", items: normalizeStudentNoteRichLines(block.teacherPrompt), accent: "amber" })}
                      {renderRichNoteListSection({ title: "Explanation", items: normalizeStudentNoteRichLines(block.explanation), accent: "slate" })}
                      {renderRichNoteListSection({ title: "Check Understanding", items: normalizeStudentNoteRichLines(block.checkUnderstanding), accent: "sky" })}
                      {renderRichNoteListSection({ title: "Expected Answers", items: normalizeStudentNoteRichLines(block.expectedAnswers), accent: "emerald" })}
                      {renderRichNoteListSection({ title: "Activity", items: normalizeStudentNoteRichLines(block.activity), accent: "teal" })}
                      {renderRichNoteListSection({ title: "Board Work", items: normalizeStudentNoteRichLines(block.boardWork), accent: "amber" })}
                      {renderRichNoteListSection({ title: "Board Steps", items: normalizeStudentNoteRichLines(block.boardSteps), accent: "slate", ordered: true })}
                      {renderRichNoteListSection({ title: "Solution Flow", items: normalizeStudentNoteRichLines(block.solutionFlow), accent: "emerald", ordered: true })}
                    </div>

                    {normalizeStudentNoteRichLines(block.examples).length > 0 ? (
                      <div className="mt-4 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-600">
                        <span className="font-semibold text-slate-800">Examples:</span>{" "}
                        <span className="space-y-2">
                          {normalizeStudentNoteRichLines(block.examples).map((item, exampleIdx) => (
                            <span key={`${formatStudentNoteRichLine(item)}-${exampleIdx}`} className="block">{renderStudentNoteRichLine(item)}</span>
                          ))}
                        </span>
                      </div>
                    ) : null}
                    {normalizeStudentNoteRichLines(block.proofSteps).length > 0 ? (
                      <div className="mt-4 rounded-[20px] border border-sky-100 bg-sky-50/70 p-4">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-700">Proof / Reasoning Steps</div>
                        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-sky-900">
                          {normalizeStudentNoteRichLines(block.proofSteps).map((item, stepIdx) => <li key={`${formatStudentNoteRichLine(item)}-${stepIdx}`}>{renderStudentNoteRichLine(item)}</li>)}
                        </ol>
                      </div>
                    ) : null}
                    {getMathDiagramList(block.geometryDiagrams).length > 0 ? (
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {getMathDiagramList(block.geometryDiagrams).map((diagram) => <div key={diagram.id}>{renderGeometryDiagram(diagram, true)}</div>)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {conceptFlow.length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Concept Flow</div>
              <h5 className="mt-1 text-base font-black text-slate-900">How each idea should unfold in class</h5>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {conceptFlow.map((concept, idx) => (
                  <div key={idx} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4">
                    <div className="text-sm font-black text-slate-900">{renderMixedMathLine(concept.conceptName)}</div>
                    {concept.definition ? <p className="mt-2 text-xs leading-relaxed text-slate-600"><span className="font-semibold text-slate-800">Definition:</span> {renderMixedMathLine(concept.definition)}</p> : null}
                    {concept.coreExplanation ? <p className="mt-2 text-xs leading-relaxed text-slate-700">{renderMixedMathLine(concept.coreExplanation)}</p> : null}
                    {renderRichNoteListSection({ title: "Teacher Moves", items: normalizeStudentNoteRichLines(concept.teacherMoves), accent: "teal", className: "mt-3" })}
                    {normalizeStudentNoteRichLines(concept.examples).length > 0 ? (
                      <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600"><span className="font-semibold text-slate-800">Examples:</span>{normalizeStudentNoteRichLines(concept.examples).map((item, exampleIdx) => <div key={`${formatStudentNoteRichLine(item)}-${exampleIdx}`}>{renderStudentNoteRichLine(item)}</div>)}</div>
                    ) : null}
                    {normalizeStudentNoteRichLines(concept.visuals).length > 0 ? (
                      <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600"><span className="font-semibold text-slate-800">Visual cues:</span>{normalizeStudentNoteRichLines(concept.visuals).map((item, visualIdx) => <div key={`${formatStudentNoteRichLine(item)}-${visualIdx}`}>{renderStudentNoteRichLine(item)}</div>)}</div>
                    ) : null}
                    {normalizeStudentNoteRichLines(concept.solutionFlow).length > 0 ? (
                      <div className="mt-3 rounded-[18px] border border-emerald-100 bg-emerald-50/70 p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">Solution Flow</div>
                        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-emerald-900">
                          {normalizeStudentNoteRichLines(concept.solutionFlow).map((item, stepIdx) => <li key={`${formatStudentNoteRichLine(item)}-${stepIdx}`}>{renderStudentNoteRichLine(item)}</li>)}
                        </ol>
                      </div>
                    ) : null}
                    {normalizeStudentNoteRichLines(concept.proofSteps).length > 0 ? (
                      <div className="mt-3 rounded-[18px] border border-sky-100 bg-sky-50/70 p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-700">Proof Steps</div>
                        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-sky-900">
                          {normalizeStudentNoteRichLines(concept.proofSteps).map((item, stepIdx) => <li key={`${formatStudentNoteRichLine(item)}-${stepIdx}`}>{renderStudentNoteRichLine(item)}</li>)}
                        </ol>
                      </div>
                    ) : null}
                    {getMathDiagramList(concept.geometryDiagrams).length > 0 ? (
                      <div className="mt-3 grid gap-3">
                        {getMathDiagramList(concept.geometryDiagrams).map((diagram) => <div key={diagram.id}>{renderGeometryDiagram(diagram, true)}</div>)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {classroomQuestions.length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Classroom Questions</div>
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {classroomQuestions.map((question, idx) => (
                  <div key={idx} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4 text-xs text-slate-700">
                    <div className="font-semibold text-slate-900">{renderMixedMathLine(question.question)}</div>
                    {question.level ? <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{formatRenderableText(question.level)}</div> : null}
                    {question.expectedResponse ? <div className="mt-3 leading-relaxed text-slate-600"><span className="font-semibold text-slate-800">Expected response:</span> {renderMixedMathLine(question.expectedResponse)}</div> : null}
                    {renderRichNoteListSection({ title: "Answer Points", items: normalizeStudentNoteRichLines(question.answerPoints), accent: "emerald", className: "mt-3" })}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {timePlan.length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Session Time Plan</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {timePlan.map((block, idx) => (
                  <div key={idx} className="rounded-[22px] border border-slate-200 bg-white p-4 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{renderMixedMathLine(block.segment)}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{formatRenderableText(block.minutes)} min</span>
                    </div>
                    {block.purpose ? <p className="mt-2 leading-relaxed text-slate-600">{renderMixedMathLine(block.purpose)}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {template.misconceptions.length > 0 ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50/70 p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-rose-700">Misconceptions and Corrections</div>
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {template.misconceptions.map((item, idx) => (
                  <div key={idx} className="rounded-[22px] border border-rose-200 bg-white/90 p-4 text-xs">
                    <div className="font-semibold text-rose-900">{renderMixedMathLine(item.misconception)}</div>
                    <div className="mt-2 leading-relaxed text-rose-800"><span className="font-bold">Correction:</span> {renderMixedMathLine(item.correction)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {template.supportCards.length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">Support & Closure</div>
              <div className="mt-4 grid gap-3 xl:grid-cols-3">
                {template.supportCards.map((card) => <div key={card.title}>{renderRichNoteListSection(card)}</div>)}
              </div>
            </div>
          ) : null}

          {template.endOfClassRecap.length > 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#586A71]">End-of-Class Recap</div>
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {template.endOfClassRecap.map((item, idx) => (
                  <div key={idx} className="rounded-[24px] border border-slate-200 bg-white p-4 text-xs text-slate-700">
                    <div className="font-semibold text-slate-900">{renderMixedMathLine(item.prompt)}</div>
                    {item.expectedAnswer ? <div className="mt-2 leading-relaxed text-slate-600"><span className="font-semibold text-slate-800">Expected answer:</span> {renderMixedMathLine(item.expectedAnswer)}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderStudentNotesPanel = (session: SessionPlan, studentNotes: NonNullable<SessionPlan["studentLessonNotes"]>) => {
    const template = buildStudentNotesTemplateContent(studentNotes, session.title || studentNotes.title || "Student Notes");
    const subjectLabel = formatRenderableText(extractedData?.subject || activeWorkspace?.curriculumSnapshot?.subject || "Subject");
    const gradeLabel = formatRenderableText(extractedData?.gradeLevel || activeWorkspace?.curriculumSnapshot?.gradeLevel || "Grade");
    const dateLabel = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    const heading = buildStudentCornellHeading(session, template, { subjectLabel, gradeLabel, dateLabel });
    const revisionFormulaLines = normalizeStudentNoteRichLines(studentNotes.revisionSection?.formulas);
    const formulaCards = Array.isArray(studentNotes.formulaCards) ? studentNotes.formulaCards : [];
    const geometryDiagrams = getMathDiagramList(studentNotes.geometryDiagrams);
    const proofSteps = normalizeStudentNoteRichLines(studentNotes.proofSteps);
    const commonMistakes = Array.isArray(studentNotes.commonMistakes) ? studentNotes.commonMistakes : [];
    const comparisonTables = Array.isArray(studentNotes.comparisonTables) ? studentNotes.comparisonTables : [];
    const diagramById = new Map(geometryDiagrams.map((diagram) => [diagram.id, diagram]));
    const workedExampleDiagramRefs = new Set(
      (Array.isArray(studentNotes.workedExamples) ? studentNotes.workedExamples : [])
        .map((example) => example.diagramRef)
        .filter((id): id is string => Boolean(id))
    );
    const visualBankDiagrams = geometryDiagrams.filter((diagram) => !workedExampleDiagramRefs.has(diagram.id));
    const renderedInlineDiagramIds = new Set<string>();

    return (
      <div className="overflow-hidden rounded-[30px] border border-[#d7d2c5] bg-[#f6f1ea] shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div
          className="h-36 w-full border-b border-[#c6d6db] bg-[#4f819c] bg-cover bg-center"
          style={{ backgroundImage: `url("${STUDENT_NOTES_PATTERN_DATA_URL}")` }}
        />

        <div className="relative px-5 pb-6 pt-0 md:px-7">
          <div className="-mt-9 inline-flex h-16 w-16 items-center justify-center rounded-[6px] border border-[#ddd7cc] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
            <FileText className="h-8 w-8 text-slate-800" />
          </div>

          <div className="mt-5">
            <div className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-[#4f819c]">Student Notes</div>
            <div className="mt-2 font-mono text-[1.9rem] font-black leading-tight tracking-tight text-slate-800 md:text-[2.35rem]">
              {heading.primaryHeading}
            </div>
            {heading.secondaryHeading ? (
              <div className="mt-2 max-w-4xl font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {heading.secondaryHeading}
              </div>
            ) : null}
            <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">
              {heading.metaLine}
            </div>
            {studentNotes.sessionOverview ? (
              <p className="mt-3 max-w-4xl font-mono text-[13px] leading-6 text-slate-600">
                {renderMixedMathLine(studentNotes.sessionOverview)}
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[6px] border border-[#f0ece4] bg-[#fbfaf6] px-4 py-3 font-mono text-[12px] text-slate-600 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Lesson Focus</div>
              <div className="mt-2 text-[13px] font-bold text-slate-700">{heading.topicLabel || "Session Notes"}</div>
            </div>
            <div className="rounded-[6px] border border-[#f0ece4] bg-[#fbfaf6] px-4 py-3 font-mono text-[12px] text-slate-600 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Session Details</div>
              <div className="mt-2 text-[13px] font-bold text-slate-700">{heading.sessionLabel}</div>
              <div className="mt-1 text-[12px] text-slate-500">{subjectLabel}  •  {gradeLabel}  •  {dateLabel}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-[8px] border border-[#efeae0] bg-[#fbfaf7] p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">Keywords - Questions</div>
              <div className="mt-4 space-y-3 font-mono text-[12px] leading-6 text-slate-700">
                {template.cueItems.slice(0, 18).map((item, idx) => (
                  <div key={`${formatStudentNoteRichLine(item)}-${idx}`} className="flex gap-2">
                    <span className="text-slate-400">.</span>
                    <span className="min-w-0 flex-1">{renderStudentNoteRichLine(item)}</span>
                  </div>
                ))}
                {template.cueItems.length === 0 ? (
                  <div className="text-slate-500">Add cue keywords after generating student notes.</div>
                ) : null}
              </div>
            </aside>

            <section className="rounded-[8px] border border-[#efeae0] bg-[#fbfaf7] p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">Notes</div>
              <div className="mt-4 space-y-5">
                {template.noteSections.map((section, idx) => (
                  <article key={`${section.title}-${idx}`} className="font-mono text-[12.5px] leading-7 text-slate-700">
                    <h5 className="text-[14px] font-black text-slate-800">{section.title}</h5>
                    <div className="mt-2 space-y-3">
                      {section.blocks.map((block, blockIdx) => renderStudentNoteBlock(block, `${section.title}-${blockIdx}`))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {formulaCards.length > 0 ? (
            <div className="mt-6 rounded-[8px] border border-[#efeae0] bg-[#fbfaf7] p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">Formula Cards</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {formulaCards.map((card, idx) => renderFormulaCard(card, idx))}
              </div>
            </div>
          ) : null}

          {comparisonTables.length > 0 ? (
            <div className="mt-6 rounded-[8px] border border-[#efeae0] bg-[#fbfaf7] p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">Tables</div>
              <div className="mt-4 grid gap-4">
                {comparisonTables.map((table, tableIdx) => (
                  <div key={`${table.title}-${tableIdx}`} className="overflow-hidden rounded-[6px] border border-[#e7dfd2] bg-white">
                    <div className="border-b border-[#e7dfd2] bg-[#f8fafc] px-4 py-3 font-mono text-[13px] font-black text-slate-800">{formatRenderableText(table.title || `Table ${tableIdx + 1}`)}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] border-collapse font-mono text-[12px] text-slate-700">
                        {Array.isArray(table.headers) && table.headers.length > 0 ? (
                          <thead>
                            <tr className="bg-[#fbfaf7]">
                              {table.headers.map((header, idx) => <th key={`${header}-${idx}`} className="border-b border-[#e7dfd2] px-4 py-3 text-left font-black text-slate-800">{formatRenderableText(header)}</th>)}
                            </tr>
                          </thead>
                        ) : null}
                        <tbody>
                          {(Array.isArray(table.rows) ? table.rows : []).map((row, rowIdx) => (
                            <tr key={rowIdx} className="odd:bg-white even:bg-[#fbfaf7]">
                              {(Array.isArray(row) ? row : []).map((cell, cellIdx) => <td key={`${rowIdx}-${cellIdx}`} className="border-b border-[#efeae0] px-4 py-3 align-top">{renderMathExpression(cell)}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {visualBankDiagrams.length > 0 ? (
            <div className="mt-6 rounded-[8px] border border-[#efeae0] bg-[#fbfaf7] p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">Geometry Diagrams</div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {visualBankDiagrams.map((diagram) => (
                  <div key={diagram.id}>{renderGeometryDiagram(diagram)}</div>
                ))}
              </div>
            </div>
          ) : null}

          {proofSteps.length > 0 ? (
            <div className="mt-6 rounded-[8px] border border-[#efeae0] bg-[#fbfaf7] p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">Proof / Reasoning Flow</div>
              <ol className="mt-4 list-decimal space-y-3 pl-5 font-mono text-[12px] leading-6 text-slate-700">
                {proofSteps.map((item, idx) => <li key={`${formatStudentNoteRichLine(item)}-${idx}`}>{renderStudentNoteRichLine(item)}</li>)}
              </ol>
            </div>
          ) : null}

          {template.summaryLines.length > 0 ? (
            <div className="mt-6 rounded-[8px] border border-[#efeae0] bg-[#fbfaf7] p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">Summary</div>
              <div className="mt-3 space-y-2 font-mono text-[12px] leading-6 text-slate-700">
                {template.summaryLines.slice(0, 8).map((item, idx) => (
                  <p key={`${formatStudentNoteRichLine(item)}-${idx}`}>{renderStudentNoteRichLine(item)}</p>
                ))}
              </div>
            </div>
          ) : null}

          {revisionFormulaLines.length > 0 ? (
            <div className="mt-6 rounded-[8px] border border-[#efeae0] bg-[#fbfaf7] p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">Formula Bank</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {revisionFormulaLines.map((item, idx) => (
                  <div key={`${formatStudentNoteRichLine(item)}-${idx}`} className="rounded-[6px] border border-[#e7dfd2] bg-white px-4 py-3 font-mono text-[12px] leading-6 text-slate-700">
                    {item.length === 1 ? renderMathExpression(item[0], true) : renderStudentNoteRichLine(item)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {Array.isArray(studentNotes.workedExamples) && studentNotes.workedExamples.length > 0 ? (
            <div className="mt-6 rounded-[8px] border border-[#efeae0] bg-[#fbfaf7] p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">Worked Solutions</div>
              <div className="mt-4 space-y-4">
                {studentNotes.workedExamples.map((example, idx) => {
                  const givenLines = normalizeStudentNoteRichLines(example.given);
                  const formulaLines = normalizeStudentNoteRichLines(example.formula);
                  const solutionLines = normalizeStudentNoteRichLines(example.solutionSteps);
                  const reasoningLines = normalizeStudentNoteRichLines(example.reasoning);
                  const stepLines = getRenderableList(example.steps);
                  const finalAnswer = formatRenderableText(example.finalAnswer).trim();
                  const linkedDiagram = example.diagramRef ? diagramById.get(example.diagramRef) : null;
                  const shouldRenderLinkedDiagram = Boolean(linkedDiagram && !renderedInlineDiagramIds.has(linkedDiagram.id));
                  if (linkedDiagram && shouldRenderLinkedDiagram) renderedInlineDiagramIds.add(linkedDiagram.id);
                  return (
                    <div key={`${example.title || "worked-example"}-${idx}`} className="rounded-[6px] border border-[#e7dfd2] bg-white p-4">
                      <div className="font-mono text-[13px] font-black text-slate-800">{formatRenderableText(example.title || `Worked Example ${idx + 1}`)}</div>
                      {linkedDiagram && shouldRenderLinkedDiagram ? <div className="mt-3">{renderGeometryDiagram(linkedDiagram, true)}</div> : null}
                      {linkedDiagram && !shouldRenderLinkedDiagram ? <div className="mt-2 font-mono text-[11px] text-slate-500">Uses the diagram shown above.</div> : null}
                      {example.problem ? <p className="mt-2 font-mono text-[12px] leading-6 text-slate-700"><span className="font-bold text-slate-800">Problem:</span> {renderMixedMathLine(example.problem)}</p> : null}
                      {givenLines.length > 0 ? (
                        <div className="mt-2 space-y-1 font-mono text-[12px] leading-6 text-slate-700">
                          {givenLines.map((item, givenIdx) => (
                            <div key={`${formatStudentNoteRichLine(item)}-${givenIdx}`}>
                              <span className="font-bold text-slate-800">{givenIdx === 0 ? "Given:" : ""}</span>
                              {givenIdx === 0 ? " " : ""}
                              {renderStudentNoteRichLine(item)}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {formulaLines.length > 0 ? (
                        <div className="mt-2 space-y-2 rounded-[6px] bg-[#f8fafc] px-3 py-2 font-mono text-[12px] leading-6 text-slate-700">
                          {formulaLines.map((item, formulaIdx) => (
                            <div key={`${formatStudentNoteRichLine(item)}-${formulaIdx}`}>
                              <span className="font-bold text-slate-800">{formulaIdx === 0 ? "Formula:" : ""}</span>
                              {formulaIdx === 0 ? " " : ""}
                              {item.length === 1 ? renderMathExpression(item[0], true) : renderStudentNoteRichLine(item)}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {solutionLines.length > 0 ? (
                        <ol className="mt-3 list-decimal space-y-2 pl-5 font-mono text-[12px] leading-6 text-slate-700">
                          {solutionLines.map((item, stepIdx) => <li key={`${formatStudentNoteRichLine(item)}-${stepIdx}`}>{renderStudentNoteRichLine(item)}</li>)}
                        </ol>
                      ) : stepLines.length > 0 ? (
                        <ol className="mt-3 list-decimal space-y-2 pl-5 font-mono text-[12px] leading-6 text-slate-700">
                          {(Array.isArray(example.steps) ? example.steps : []).map((item, stepIdx) => <li key={`${formatRenderableText(item)}-${stepIdx}`}>{renderMixedMathLine(item)}</li>)}
                        </ol>
                      ) : null}
                      {reasoningLines.length > 0 ? (
                        <div className="mt-3 rounded-[6px] border border-sky-100 bg-sky-50 px-3 py-2">
                          <div className="font-mono text-[11px] font-black uppercase tracking-[0.08em] text-sky-700">Reasoning</div>
                          <ol className="mt-2 list-decimal space-y-1 pl-4 font-mono text-[12px] leading-6 text-sky-900">
                            {reasoningLines.map((item, reasonIdx) => <li key={`${formatStudentNoteRichLine(item)}-${reasonIdx}`}>{renderStudentNoteRichLine(item)}</li>)}
                          </ol>
                        </div>
                      ) : null}
                      {example.explanation ? <p className="mt-3 font-mono text-[12px] leading-6 text-slate-700">{renderMixedMathLine(example.explanation)}</p> : null}
                      {finalAnswer ? <div className="mt-3 rounded-[6px] border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-[12px] font-bold text-emerald-800">Final answer: {renderMixedMathLine(example.finalAnswer || finalAnswer, true)}</div> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {commonMistakes.length > 0 ? (
            <div className="mt-6 rounded-[8px] border border-rose-100 bg-rose-50/70 p-4 shadow-sm">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-rose-700">Common Mistakes</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {commonMistakes.map((item, idx) => (
                  <div key={`${item.mistake}-${idx}`} className="rounded-[6px] border border-rose-100 bg-white px-4 py-3 font-mono text-[12px] leading-6">
                    <div className="font-black text-rose-800">{renderMixedMathLine(item.mistake)}</div>
                    {item.correction ? <div className="mt-2 text-slate-700"><span className="font-bold">Correction:</span> {renderMixedMathLine(item.correction)}</div> : null}
                    {item.example ? <div className="mt-2 text-slate-600"><span className="font-bold">Example:</span> {renderMixedMathLine(item.example)}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const getStructuredHomeworkItems = (homework: SessionPlan["homework"]) => {
    if (!homework || !Array.isArray(homework.homework)) {
      return [];
    }
    return homework.homework.filter((item) => item && typeof item === "object");
  };

  const getHomeworkDisplayTime = (homework: SessionPlan["homework"]) => {
    if (!homework) return "";
    if (typeof homework.estimatedTimeMinutes === "number") {
      return `${homework.estimatedTimeMinutes} minutes`;
    }
    if (homework.summary?.estimatedCompletionTime) {
      return formatRenderableText(homework.summary.estimatedCompletionTime);
    }
    if (homework.sessionInformation?.estimatedHomeworkDuration) {
      return formatRenderableText(homework.sessionInformation.estimatedHomeworkDuration);
    }
    return "";
  };

  const getPptSlides = (ppt?: SessionPlan["materials"] extends infer M ? M extends { ppt: infer P } ? P : never : never) => {
    if (!ppt?.slides || !Array.isArray(ppt.slides)) {
      return [];
    }
    return ppt.slides;
  };

  const getPptTitle = (ppt?: SessionPlan["materials"] extends infer M ? M extends { ppt: infer P } ? P : never : never) =>
    ppt?.presentationTitle || ppt?.title || "Session Presentation";

  const getPptThemeSummary = (ppt?: SessionPlan["materials"] extends infer M ? M extends { ppt: infer P } ? P : never : never) => {
    if (!ppt?.themeTokens) return "";
    const parts = [
      ppt.themeTokens.fonts?.heading ? `Heading: ${formatRenderableText(ppt.themeTokens.fonts.heading)}` : "",
      ppt.themeTokens.fonts?.body ? `Body: ${formatRenderableText(ppt.themeTokens.fonts.body)}` : "",
      ppt.themeTokens.visualStyle?.topBarStyle ? `Top bar: ${formatRenderableText(ppt.themeTokens.visualStyle.topBarStyle)}` : "",
      ppt.themeTokens.visualStyle?.visualFrameStyle ? `Visual frame: ${formatRenderableText(ppt.themeTokens.visualStyle.visualFrameStyle)}` : "",
    ].filter(Boolean);
    return parts.join(" | ");
  };

  const getPptAccentStyle = (index: number) => {
    const accents = [
      { bar: "bg-[#36ADAA]", soft: "bg-[#36ADAA]/10", text: "text-[#36ADAA]", exportBarClass: "bar-teal", exportTagClass: "tag-teal" },
      { bar: "bg-[#1EABDA]", soft: "bg-[#1EABDA]/10", text: "text-[#1EABDA]", exportBarClass: "bar-blue", exportTagClass: "tag-blue" },
      { bar: "bg-[#7F64EA]", soft: "bg-[#7F64EA]/10", text: "text-[#7F64EA]", exportBarClass: "bar-purple", exportTagClass: "tag-purple" },
      { bar: "bg-[#DE8431]", soft: "bg-[#DE8431]/10", text: "text-[#DE8431]", exportBarClass: "bar-orange", exportTagClass: "tag-orange" },
      { bar: "bg-[#3CC583]", soft: "bg-[#3CC583]/10", text: "text-[#3CC583]", exportBarClass: "bar-green", exportTagClass: "tag-green" },
    ];
    return accents[index % accents.length];
  };

  const getPrimaryPptAsset = (slide: NonNullable<ReturnType<typeof getPptSlides>>[number]) =>
    Array.isArray(slide.assets)
      ? slide.assets.find((asset) => Boolean(asset.imageDataUrl || asset.previewUrl || asset.sourceUrl))
      : undefined;

  const getPptThemePalette = (ppt?: SessionPlan["materials"] extends infer M ? M extends { ppt: infer P } ? P : never : never) => ({
    primary: ppt?.themeTokens?.colors?.primary || "#1D4E89",
    accent: ppt?.themeTokens?.colors?.accent || "#D97706",
    surface: ppt?.themeTokens?.colors?.surface || "#FFFFFF",
    background: ppt?.themeTokens?.colors?.background || "#F7FAFC",
    text: ppt?.themeTokens?.colors?.text || "#1F2937",
    muted: ppt?.themeTokens?.colors?.mutedText || "#6B7280",
  });

  const escapeHtml = (value: unknown) =>
    formatRenderableText(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");

  const renderRichValueToExportHtml = (value: unknown, options?: { displayMode?: boolean; wrapperClassName?: string }) => {
    const normalizedValue = normalizeStudentNoteRichValue(value);
    if (!normalizedValue) return "";
    const renderPlan = getStudentNoteRenderPlan(normalizedValue);
    if (renderPlan.segments.length === 0) return "";

    const content = renderPlan.segments.map((segment) => {
      if (segment.type === "math") {
        const displayMode = Boolean(options?.displayMode || segment.displayMode || renderPlan.classification === "full_latex_line");
        const normalizedLatex = normalizeInlineMathText(segment.value);
        try {
          return `<span class="${displayMode ? "export-rich-math export-rich-math-display" : "export-rich-math"}">${katex.renderToString(normalizedLatex, {
            displayMode,
            throwOnError: false,
            strict: false,
          })}</span>`;
        } catch {
          return `<span class="export-rich-text">${escapeHtml(latexToReadableText(normalizedLatex) || segment.value)}</span>`;
        }
      }
      return `<span class="export-rich-text">${escapeHtml(segment.value)}</span>`;
    }).join("");

    if (!content) return "";
    const wrapperClassName = [
      "export-rich-line",
      renderPlan.classification === "full_latex_line" || options?.displayMode ? "export-rich-line-display" : "",
      options?.wrapperClassName || "",
    ].filter(Boolean).join(" ");
    return `<span class="${wrapperClassName}">${content}</span>`;
  };

  const slugifyFileNamePart = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "lesson-plan";

  const triggerDownload = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Delay revocation so larger browser-managed downloads can start reliably.
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  };

  const stripImplicitUnitFromContextLabel = (value: string) =>
    String(value || "")
      .replace(/\s*\(\s*implicit unit from context\s*\)\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizePdfText = (value: string) =>
    stripImplicitUnitFromContextLabel(value)
      .normalize("NFKD")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, "\"")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2022/g, "-")
      .replace(/\u00A0/g, " ")
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");

  const escapePdfText = (value: string) =>
    normalizePdfText(value)
      .replaceAll("\\", "\\\\")
      .replaceAll("(", "\\(")
      .replaceAll(")", "\\)");

  const wrapPdfTextLine = (line: string, maxChars: number) => {
    const normalizedLine = normalizePdfText(line).trimEnd();
    if (!normalizedLine.trim()) return [""];

    const words = normalizedLine.split(/\s+/);
    const wrapped: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      if (!currentLine) {
        currentLine = word;
        return;
      }
      const candidate = `${currentLine} ${word}`;
      if (candidate.length <= maxChars) {
        currentLine = candidate;
        return;
      }
      wrapped.push(currentLine);
      currentLine = word;
    });

    if (currentLine) wrapped.push(currentLine);
    return wrapped;
  };

  const buildSimplePdfBlob = (title: string, text: string) => {
    const pageWidth = 612;
    const pageHeight = 792;
    const marginX = 54;
    const topY = 750;
    const bottomY = 56;
    const bodyFontSize = 11;
    const bodyLineHeight = 16;
    const titleFontSize = 18;
    const titleLineHeight = 24;
    const sectionFontSize = 13;
    const sectionLineHeight = 20;
    const encoder = new TextEncoder();

    const rawLines = text.split(/\r?\n/);
    const entries: Array<{ text: string; font: "F1" | "F2"; size: number; lineHeight: number }> = [];

    rawLines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        entries.push({ text: "", font: "F1", size: bodyFontSize, lineHeight: 10 });
        return;
      }

      const isDocumentTitle = index === 0;
      const isSectionHeading =
        index > 0 &&
        (trimmed.endsWith(":") ||
          [
            "MCQ",
            "MCQ Answer Key",
            "Short Answer Questions",
            "Short Answer Key",
            "Long Answer Questions",
            "Long Answer Key",
            "General Marking Guidance",
            "Instructions",
          ].includes(trimmed));

      const font = isDocumentTitle || isSectionHeading ? "F2" : "F1";
      const size = isDocumentTitle ? titleFontSize : isSectionHeading ? sectionFontSize : bodyFontSize;
      const lineHeight = isDocumentTitle ? titleLineHeight : isSectionHeading ? sectionLineHeight : bodyLineHeight;
      const maxChars = isDocumentTitle ? 52 : isSectionHeading ? 62 : 82;

      wrapPdfTextLine(trimmed, maxChars).forEach((wrappedLine) => {
        entries.push({ text: wrappedLine, font, size, lineHeight });
      });
    });

    const pages: string[] = [];
    let currentPageOps: string[] = [];
    let currentY = topY;

    const pushLineToPage = (line: { text: string; font: "F1" | "F2"; size: number; lineHeight: number }) => {
      if (!line.text) {
        currentY -= line.lineHeight;
        return;
      }
      currentPageOps.push("BT");
      currentPageOps.push(`/${line.font} ${line.size} Tf`);
      currentPageOps.push(`1 0 0 1 ${marginX} ${currentY} Tm`);
      currentPageOps.push(`(${escapePdfText(line.text)}) Tj`);
      currentPageOps.push("ET");
      currentY -= line.lineHeight;
    };

    const flushPage = () => {
      if (currentPageOps.length === 0) return;
      pages.push(currentPageOps.join("\n"));
      currentPageOps = [];
      currentY = topY;
    };

    entries.forEach((entry) => {
      if (currentY - entry.lineHeight < bottomY) flushPage();
      pushLineToPage(entry);
    });
    flushPage();

    if (pages.length === 0) {
      pages.push([
        "BT",
        `/F2 ${titleFontSize} Tf`,
        `1 0 0 1 ${marginX} ${topY} Tm`,
        `(${escapePdfText(title)}) Tj`,
        "ET",
      ].join("\n"));
    }

    const objects: string[] = [];
    const pageObjectNumbers: number[] = [];
    const contentObjectNumbers: number[] = [];

    const addObject = (value: string) => {
      objects.push(value);
      return objects.length;
    };

    const catalogObjectNumber = addObject("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesObjectNumber = addObject("");
    const fontObjectNumber = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const boldFontObjectNumber = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

    pages.forEach((pageContent) => {
      const contentObjectNumber = addObject(`<< /Length ${encoder.encode(pageContent).length} >>\nstream\n${pageContent}\nendstream`);
      const pageObjectNumber = addObject(
        `<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R /F2 ${boldFontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
      );
      contentObjectNumbers.push(contentObjectNumber);
      pageObjectNumbers.push(pageObjectNumber);
    });

    objects[pagesObjectNumber - 1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [0];

    objects.forEach((objectValue, index) => {
      offsets.push(encoder.encode(pdf).length);
      pdf += `${index + 1} 0 obj\n${objectValue}\nendobj\n`;
    });

    const xrefOffset = encoder.encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectNumber} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  };

  const buildSessionExportBaseName = (session: SessionPlan) => {
    const subjectLabel = extractedData?.subject || activeWorkspace?.curriculumSnapshot?.subject || "subject";
    const gradeLabel = extractedData?.gradeLevel || activeWorkspace?.curriculumSnapshot?.gradeLevel || "grade";
    return [
      slugifyFileNamePart(subjectLabel),
      slugifyFileNamePart(gradeLabel),
      `session-${session.sessionNumber}`,
      slugifyFileNamePart(session.title || "lesson-notes"),
    ].join("-");
  };

  const buildAssessmentExportBaseName = (session: SessionPlan) => buildSessionExportBaseName(session);

  const loadImageElement = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load note image for PDF export."));
      image.src = src;
    });

  const imageDataUrlToJpegBytes = (dataUrl: string) => {
    const base64 = dataUrl.split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  };

  const buildImagePdfBlob = (images: Array<{ bytes: Uint8Array; width: number; height: number }>) => {
    const encoder = new TextEncoder();
    const pageWidth = 595;
    const pageHeight = 842;
    const objects: Array<Array<string | Uint8Array>> = [];

    const addObject = (parts: Array<string | Uint8Array>) => {
      objects.push(parts);
      return objects.length;
    };

    const catalogObjectNumber = addObject(["<< /Type /Catalog /Pages 2 0 R >>"]);
    const pagesObjectNumber = addObject([""]);
    const pageObjectNumbers: number[] = [];

    images.forEach((image, index) => {
      const imageObjectNumber = addObject([
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
        image.bytes,
        "\nendstream",
      ]);
      const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im${index + 1} Do\nQ`;
      const contentObjectNumber = addObject([
        `<< /Length ${encoder.encode(contentStream).length} >>\nstream\n${contentStream}\nendstream`,
      ]);
      const pageObjectNumber = addObject([
        `<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
      ]);
      pageObjectNumbers.push(pageObjectNumber);
    });

    objects[pagesObjectNumber - 1] = [`<< /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`];

    const byteLength = (part: string | Uint8Array) => (typeof part === "string" ? encoder.encode(part).length : part.length);
    const chunks: Array<string | Uint8Array> = ["%PDF-1.4\n"];
    const offsets: number[] = [0];
    let totalLength = encoder.encode("%PDF-1.4\n").length;

    objects.forEach((parts, index) => {
      offsets.push(totalLength);
      const objectStart = `${index + 1} 0 obj\n`;
      const objectEnd = "\nendobj\n";
      chunks.push(objectStart);
      totalLength += encoder.encode(objectStart).length;
      parts.forEach((part) => {
        chunks.push(part);
        totalLength += byteLength(part);
      });
      chunks.push(objectEnd);
      totalLength += encoder.encode(objectEnd).length;
    });

    const xrefOffset = totalLength;
    let xref = `xref\n0 ${objects.length + 1}\n`;
    xref += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    xref += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectNumber} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    chunks.push(xref);

    return new Blob(chunks, { type: "application/pdf" });
  };

  const buildStudentCornellNotesPdfBlob = async (session: SessionPlan) => {
    const studentNotes = session.studentLessonNotes;
    if (!studentNotes) {
      throw new Error("Generate the student notes first before downloading the Cornell notes PDF.");
    }

    const template = buildStudentNotesTemplateContent(studentNotes, session.title);
    const patternImage = await loadImageElement(STUDENT_NOTES_PATTERN_DATA_URL);
    const subjectLabel = formatRenderableText(extractedData?.subject || activeWorkspace?.curriculumSnapshot?.subject || "Subject");
    const gradeLabel = formatRenderableText(extractedData?.gradeLevel || activeWorkspace?.curriculumSnapshot?.gradeLevel || "Grade");
    const dateLabel = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    const heading = buildStudentCornellHeading(session, template, { subjectLabel, gradeLabel, dateLabel });

    const canvasWidth = 1240;
    const canvasHeight = 1754;
    const pagePadding = 62;
    const patternHeight = 210;
    const iconSize = 78;
    const titleTop = 274;
    const subtitleTop = 328;
    const metaLineTop = 358;
    const metaTop = 392;
    const metaHeight = 52;
    const metaGap = 24;
    const contentTop = 490;
    const contentHeight = 820;
    const cueWidth = 272;
    const contentGap = 26;
    const summaryTop = 1344;
    const summaryHeight = 270;
    const totalWidth = canvasWidth - pagePadding * 2;
    const noteWidth = totalWidth - cueWidth - contentGap;

    const colors = {
      paper: "#f6f1ea",
      panel: "#fbfaf7",
      panelBorder: "#efeae0",
      ink: "#43403d",
      muted: "#7c7a76",
      blue: "#4f819c",
      blueDark: "#3a647b",
      summary: "#f9f7f2",
      line: "#d9d4c8",
    };

    type StudentNotePdfVariant = "note" | "cue" | "summary";
    const studentNoteSnippetCache = new Map<string, Promise<{ image: HTMLImageElement; height: number }>>();
    const escapeStudentNoteHtml = (value: string) =>
      stripImplicitUnitFromContextLabel(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");

    const getStudentNoteRichSegments = (value: StudentNoteRichValue) =>
      getStudentNoteRenderPlan(value).segments;

    const renderStudentNoteMathHtml = (latex: string, displayMode = false, fallback = "") => {
      const normalizedLatex = normalizeInlineMathText(latex);
      try {
        return katex.renderToString(normalizedLatex, {
          displayMode,
          throwOnError: false,
          strict: false,
        });
      } catch {
        return `<span class="student-note-pdf-text">${escapeStudentNoteHtml(fallback || latexToReadableText(normalizedLatex) || latex)}</span>`;
      }
    };

    const renderStudentNoteRichValueToHtml = (value: StudentNoteRichValue, displayMode = false) => {
      const renderPlan = getStudentNoteRenderPlan(value);
      const segments = renderPlan.segments;
      if (segments.length === 0) return "";
      return segments.map((segment) => {
        if (segment.type === "math") {
          const shouldDisplay = displayMode || segment.displayMode || renderPlan.classification === "full_latex_line";
          return `<span class="${shouldDisplay ? "student-note-pdf-math student-note-pdf-math-display" : "student-note-pdf-math"}">${renderStudentNoteMathHtml(segment.value, shouldDisplay, segment.value)}</span>`;
        }
        return `<span class="student-note-pdf-text">${escapeStudentNoteHtml(segment.value)}</span>`;
      }).join("");
    };

    const renderStudentNoteRichLineToHtml = (line: StudentNoteRichLine, options?: { displayMode?: boolean; className?: string }) => {
      const isFullLatexLine = line.length === 1 && getStudentNoteRenderPlan(line[0]).classification === "full_latex_line";
      const content = line
        .map((item) => renderStudentNoteRichValueToHtml(item, Boolean(options?.displayMode)))
        .filter(Boolean)
        .join("");
      if (!content) return "";
      const className = ["student-note-pdf-line", options?.displayMode || isFullLatexLine ? "student-note-pdf-line-display" : "", options?.className || ""]
        .filter(Boolean)
        .join(" ");
      return `<div class="${className}">${content}</div>`;
    };

    const renderStudentNoteBlockToHtml = (block: StudentNoteBlock) => {
      if (block.type === "line") {
        const content = renderStudentNoteRichLineToHtml(block.value, { displayMode: block.displayMode, className: "student-note-pdf-paragraph" });
        return content ? `<div class="student-note-pdf-block">${content}</div>` : "";
      }

      const listItems = block.items
        .map((item) => renderStudentNoteRichLineToHtml(item, { className: "student-note-pdf-list-line" }))
        .filter(Boolean)
        .map((item) => `<li>${item}</li>`)
        .join("");
      if (!listItems) return "";
      const label = block.label ? `<div class="student-note-pdf-list-label">${escapeStudentNoteHtml(block.label)}</div>` : "";
      return `<div class="student-note-pdf-block">${label}<${block.ordered ? "ol" : "ul"} class="student-note-pdf-list ${block.ordered ? "student-note-pdf-list-ordered" : "student-note-pdf-list-unordered"}">${listItems}</${block.ordered ? "ol" : "ul"}></div>`;
    };

    const getStudentNotePdfCss = (variant: StudentNotePdfVariant) => {
      const fontSize = variant === "note" ? 18 : 17;
      const lineHeight = variant === "note" ? 1.55 : 1.45;
      const listSpacing = variant === "note" ? 10 : 8;
      return `
        ${katexStyles}
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: transparent; }
        .student-note-pdf-root {
          width: 100%;
          color: ${colors.ink};
          font-family: "Courier New", "Liberation Mono", monospace;
          font-size: ${fontSize}px;
          line-height: ${lineHeight};
          white-space: normal;
        }
        .student-note-pdf-line {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          column-gap: 8px;
          row-gap: 6px;
          width: 100%;
        }
        .student-note-pdf-line-display {
          display: block;
        }
        .student-note-pdf-paragraph {
          margin: 0;
        }
        .student-note-pdf-block + .student-note-pdf-block {
          margin-top: ${listSpacing}px;
        }
        .student-note-pdf-list-label {
          font-weight: 700;
          margin-bottom: 6px;
        }
        .student-note-pdf-list {
          margin: 0;
          padding-left: 22px;
        }
        .student-note-pdf-list li + li {
          margin-top: ${listSpacing}px;
        }
        .student-note-pdf-list-line {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          column-gap: 8px;
          row-gap: 6px;
        }
        .student-note-pdf-math {
          display: inline-flex;
          max-width: 100%;
          align-items: center;
        }
        .student-note-pdf-math-display {
          display: block;
          width: 100%;
          overflow: hidden;
        }
        .student-note-pdf-text {
          white-space: pre-wrap;
        }
        .student-note-pdf-root .katex .katex-mathml,
        .student-note-pdf-root .katex annotation {
          display: none !important;
        }
        .student-note-pdf-root .katex-display {
          margin: 0.3em 0 0;
          overflow: hidden;
        }
      `;
    };

    const createStudentNotePdfSnippet = async (html: string, width: number, variant: StudentNotePdfVariant) => {
      const normalizedHtml = html.trim();
      if (!normalizedHtml) {
        return { image: await loadImageElement("data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="), height: 1 };
      }
      const cacheKey = `${variant}:${width}:${normalizedHtml}`;
      if (!studentNoteSnippetCache.has(cacheKey)) {
        studentNoteSnippetCache.set(cacheKey, (async () => {
          const measureHost = document.createElement("div");
          measureHost.style.position = "fixed";
          measureHost.style.left = "-100000px";
          measureHost.style.top = "0";
          measureHost.style.width = `${width}px`;
          measureHost.style.visibility = "hidden";
          measureHost.style.pointerEvents = "none";
          measureHost.innerHTML = `<style>${getStudentNotePdfCss(variant)}</style><div class="student-note-pdf-root">${normalizedHtml}</div>`;
          document.body.appendChild(measureHost);
          const measuredRoot = measureHost.querySelector(".student-note-pdf-root") as HTMLElement | null;
          const height = Math.max(1, Math.ceil(measuredRoot?.getBoundingClientRect().height || 1));
          measureHost.remove();

          const scale = 2;
          const svgMarkup = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}">
              <foreignObject x="0" y="0" width="${width}" height="${height}">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <style>${getStudentNotePdfCss(variant)}</style>
                  <div class="student-note-pdf-root">${normalizedHtml}</div>
                </div>
              </foreignObject>
            </svg>
          `;
          const image = await loadImageElement(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`);
          return { image, height };
        })());
      }
      return studentNoteSnippetCache.get(cacheKey)!;
    };

    const drawRoundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
      fillColor: string,
      strokeColor?: string,
      lineWidth = 1,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      if (strokeColor) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
      }
    };

    const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) => {
      const normalized = normalizePdfText(text).replace(/\s+/g, " ").trim();
      if (!normalized) return [];
      ctx.font = font;
      const words = normalized.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let currentLine = "";
      words.forEach((word) => {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (!currentLine || ctx.measureText(candidate).width <= maxWidth) {
          currentLine = candidate;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    const measureCanvas = document.createElement("canvas");
    measureCanvas.width = canvasWidth;
    measureCanvas.height = canvasHeight;
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) {
      throw new Error("Unable to prepare student notes PDF canvas.");
    }

    const noteTitleFont = "700 24px Courier New";
    const blockGap = 10;
    const noteContentWidth = noteWidth - 34;
    const noteTitleLineHeight = 30;
    const noteTitleBottomGap = 4;
    const sectionBottomGap = 10;

    type PreparedStudentNoteBlock = {
      block: StudentNoteBlock;
      snippet: { image: HTMLImageElement; height: number };
    };
    type PreparedStudentNoteSection = {
      title: string;
      titleLines: string[];
      titleHeight: number;
      cues: StudentNoteRichLine[];
      blocks: PreparedStudentNoteBlock[];
    };
    type PaginatedStudentNoteSection = PreparedStudentNoteSection & { blocks: PreparedStudentNoteBlock[] };

    const prepareStudentNoteSection = async (section: StudentNoteSection): Promise<PreparedStudentNoteSection> => {
      const titleLines = wrapCanvasText(measureCtx, section.title, noteContentWidth, noteTitleFont);
      const preparedBlocks: PreparedStudentNoteBlock[] = [];
      for (const block of section.blocks) {
        const snippetHtml = renderStudentNoteBlockToHtml(block);
        if (!snippetHtml) continue;
        const snippet = await createStudentNotePdfSnippet(snippetHtml, noteContentWidth, "note");
        preparedBlocks.push({ block, snippet });
      }
      return {
        title: section.title,
        titleLines,
        titleHeight: Math.max(1, titleLines.length) * noteTitleLineHeight + noteTitleBottomGap,
        cues: section.cues,
        blocks: preparedBlocks,
      };
    };

    const preparedSections = await Promise.all(template.noteSections.map((section) => prepareStudentNoteSection(section)));
    if (preparedSections.length === 0) {
      preparedSections.push(await prepareStudentNoteSection({
        title: template.noteTitle,
        blocks: [{ type: "line", value: normalizeStudentNoteRichLine("Student lesson notes") }],
        cues: [normalizeStudentNoteRichLine("Review")],
      }));
    }

    const availableNoteHeight = contentHeight - 48;
    const paginatedSections: PaginatedStudentNoteSection[][] = [];
    let currentPageSections: PaginatedStudentNoteSection[] = [];
    let currentHeight = 0;

    const pushCurrentPage = () => {
      if (currentPageSections.length > 0) {
        paginatedSections.push(currentPageSections);
        currentPageSections = [];
        currentHeight = 0;
      }
    };

    for (const section of preparedSections) {
      if (section.blocks.length === 0) {
        const emptySectionHeight = section.titleHeight + sectionBottomGap;
        if (currentPageSections.length > 0 && currentHeight + emptySectionHeight > availableNoteHeight) {
          pushCurrentPage();
        }
        currentPageSections.push({ ...section, blocks: [] });
        currentHeight += emptySectionHeight;
        continue;
      }

      let blockIndex = 0;
      while (blockIndex < section.blocks.length) {
        const firstBlockHeight = section.blocks[blockIndex].snippet.height + blockGap;
        const minimumChunkHeight = section.titleHeight + firstBlockHeight + sectionBottomGap;
        if (currentPageSections.length > 0 && currentHeight + minimumChunkHeight > availableNoteHeight) {
          pushCurrentPage();
        }

        const chunkBlocks: PreparedStudentNoteBlock[] = [];
        let chunkHeight = section.titleHeight;
        while (blockIndex < section.blocks.length) {
          const blockHeight = section.blocks[blockIndex].snippet.height + blockGap;
          const projectedHeight = currentHeight + chunkHeight + blockHeight + sectionBottomGap;
          if (chunkBlocks.length > 0 && projectedHeight > availableNoteHeight) {
            break;
          }
          chunkBlocks.push(section.blocks[blockIndex]);
          chunkHeight += blockHeight;
          blockIndex += 1;
          if (projectedHeight > availableNoteHeight) {
            break;
          }
        }

        currentPageSections.push({ ...section, blocks: chunkBlocks });
        currentHeight += chunkHeight + sectionBottomGap;

        if (blockIndex < section.blocks.length) {
          pushCurrentPage();
        }
      }
    }

    pushCurrentPage();

    const drawWrappedLines = (
      ctx: CanvasRenderingContext2D,
      lines: string[],
      x: number,
      y: number,
      lineHeight: number,
      color: string,
      font: string,
      maxLines?: number,
    ) => {
      ctx.font = font;
      ctx.fillStyle = color;
      const visibleLines = typeof maxLines === "number" ? lines.slice(0, maxLines) : lines;
      visibleLines.forEach((line, index) => {
        ctx.fillText(line, x, y + index * lineHeight);
      });
      return visibleLines.length * lineHeight;
    };

    const drawNotebookIcon = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      drawRoundedRect(ctx, x, y, iconSize, iconSize, 6, "#ffffff", "#ddd7cc", 2);
      ctx.strokeStyle = "#232323";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 17, y + 15, 34, 42);
      ctx.beginPath();
      ctx.moveTo(x + 23, y + 24);
      ctx.lineTo(x + 45, y + 24);
      ctx.moveTo(x + 23, y + 31);
      ctx.lineTo(x + 43, y + 31);
      ctx.moveTo(x + 23, y + 38);
      ctx.lineTo(x + 39, y + 38);
      ctx.stroke();
      ctx.strokeStyle = "#69c7d1";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 41, y + 54);
      ctx.lineTo(x + 57, y + 38);
      ctx.stroke();
    };

    const renderedPages: HTMLCanvasElement[] = [];

    const drawCornellHeader = (
      ctx: CanvasRenderingContext2D,
      leftLabel: string,
      rightLabel: string,
      rightEyebrow: string,
    ) => {
      const headingLines = wrapCanvasText(ctx, heading.primaryHeading, totalWidth, "700 44px Courier New");
      drawWrappedLines(ctx, headingLines, pagePadding, titleTop, 46, colors.ink, "700 44px Courier New", 2);
      if (heading.secondaryHeading) {
        const secondaryLines = wrapCanvasText(ctx, heading.secondaryHeading, totalWidth, "700 18px Courier New");
        drawWrappedLines(ctx, secondaryLines, pagePadding, subtitleTop, 22, colors.muted, "700 18px Courier New", 2);
      }
      ctx.fillStyle = colors.muted;
      ctx.font = "700 14px Courier New";
      ctx.fillText(heading.metaLine, pagePadding, metaLineTop);

      const metaWidth = (totalWidth - metaGap) / 2;
      [
        { label: leftLabel, eyebrow: "lesson focus", x: pagePadding },
        { label: rightLabel, eyebrow: rightEyebrow, x: pagePadding + metaWidth + metaGap },
      ].forEach((item) => {
        drawRoundedRect(ctx, item.x, metaTop, metaWidth, metaHeight, 6, colors.panel, colors.panelBorder, 1);
        ctx.fillStyle = colors.muted;
        ctx.font = "700 10px Courier New";
        ctx.fillText(item.eyebrow, item.x + 14, metaTop + 16);
        ctx.fillStyle = colors.ink;
        ctx.font = "700 15px Courier New";
        ctx.fillText(item.label, item.x + 14, metaTop + 35);
      });
    };

    const cueContentWidth = cueWidth - 34;
    const summaryContentWidth = totalWidth - 34;
    const buildDefaultSummaryLines = (pageIndex: number, isVisualPage = false): StudentNoteRichLine[] => [
      normalizeStudentNoteRichLine(`Subject ${subjectLabel}  •  ${gradeLabel}`),
      normalizeStudentNoteRichLine(
        isVisualPage
          ? "Visual note page."
          : pageIndex === paginatedSections.length - 1
            ? "Review the summary and connect it to the worked steps above."
            : "Continue to the next page for more session notes."
      ),
    ];

    const createCornellCanvas = async (
      pageLabel: string,
      cueItems: StudentNoteRichLine[],
      summaryLinesInput: StudentNoteRichLine[],
      pageIndex: number,
    ) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to render student notes PDF page.");
      }

      ctx.fillStyle = colors.paper;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(patternImage, 0, 0, canvasWidth, patternHeight);

      drawNotebookIcon(ctx, pagePadding + 10, patternHeight - 40);

      drawCornellHeader(
        ctx,
        pageLabel || heading.topicLabel || "Session Notes",
        `${heading.sessionLabel}  •  ${dateLabel}`,
        `${subjectLabel} • ${gradeLabel}`,
      );

      const cueX = pagePadding;
      const noteX = pagePadding + cueWidth + contentGap;
      drawRoundedRect(ctx, cueX, contentTop, cueWidth, contentHeight, 8, colors.panel, colors.panelBorder, 1.2);
      drawRoundedRect(ctx, noteX, contentTop, noteWidth, contentHeight, 8, colors.panel, colors.panelBorder, 1.2);

      ctx.fillStyle = colors.muted;
      ctx.font = "700 15px Courier New";
      ctx.fillText("Keywords - Questions", cueX + 16, contentTop + 22);
      ctx.fillText("Notes", noteX + 16, contentTop + 22);

      let cueY = contentTop + 52;
      const uniqueCueItems = dedupeStudentNoteRichLines(cueItems).slice(0, 18);
      for (const item of uniqueCueItems) {
        const snippetHtml = renderStudentNoteRichLineToHtml(item);
        if (!snippetHtml) continue;
        const snippet = await createStudentNotePdfSnippet(snippetHtml, cueContentWidth, "cue");
        if (cueY + snippet.height > contentTop + contentHeight - 24) break;
        ctx.fillStyle = colors.muted;
        ctx.font = "500 17px Courier New";
        ctx.fillText(".", cueX + 12, cueY + 16);
        ctx.drawImage(snippet.image, cueX + 26, cueY, cueContentWidth, snippet.height);
        cueY += snippet.height + 10;
      }

      drawRoundedRect(ctx, pagePadding, summaryTop, totalWidth, summaryHeight, 8, colors.summary, colors.panelBorder, 1.2);
      ctx.fillStyle = colors.muted;
      ctx.font = "700 15px Courier New";
      ctx.fillText("Summary", pagePadding + 16, summaryTop + 24);

      const summaryLines = summaryLinesInput.length > 0
        ? summaryLinesInput
        : buildDefaultSummaryLines(pageIndex);
      let summaryY = summaryTop + 58;
      for (const item of summaryLines.slice(0, 8)) {
        const snippetHtml = renderStudentNoteRichLineToHtml(item);
        if (!snippetHtml) continue;
        const snippet = await createStudentNotePdfSnippet(snippetHtml, summaryContentWidth, "summary");
        if (summaryY + snippet.height > summaryTop + summaryHeight - 20) break;
        ctx.drawImage(snippet.image, pagePadding + 16, summaryY, summaryContentWidth, snippet.height);
        summaryY += snippet.height + 6;
      }

      return { canvas, ctx, noteX, noteY: contentTop + 52 };
    };

    for (const [pageIndex, pageSections] of paginatedSections.entries()) {
      const pageCueItems = dedupeStudentNoteRichLines(pageSections.flatMap((section) => section.cues));
      const summaryLines = pageIndex === paginatedSections.length - 1 && template.summaryLines.length > 0
        ? template.summaryLines
        : buildDefaultSummaryLines(pageIndex);
      const { canvas, ctx, noteX, noteY: startNoteY } = await createCornellCanvas(
        heading.topicLabel || "Session Notes",
        pageCueItems,
        summaryLines,
        pageIndex,
      );

      if (pageCueItems.length === 0) {
        ctx.fillStyle = colors.muted;
        ctx.font = "500 17px Courier New";
        ctx.fillText("Generate cue points from the student notes.", pagePadding + 18, contentTop + 68);
      }

      let noteY = startNoteY;
      for (const section of pageSections) {
        noteY += drawWrappedLines(ctx, section.titleLines, noteX + 16, noteY, noteTitleLineHeight, colors.ink, noteTitleFont);
        noteY += noteTitleBottomGap;
        for (const block of section.blocks) {
          ctx.drawImage(block.snippet.image, noteX + 16, noteY, noteContentWidth, block.snippet.height);
          noteY += block.snippet.height + blockGap;
        }
        noteY += sectionBottomGap;
      }

      renderedPages.push(canvas);
    }

    const visualItems: Array<{ title: string; caption: StudentNoteRichLine; src: string; cues: StudentNoteRichLine[] }> = [];
    (Array.isArray(studentNotes.sections) ? studentNotes.sections : []).forEach((section) => {
      const assets = Array.isArray(section.visualAssets) ? section.visualAssets : [];
      assets.forEach((asset) => {
        if (!asset?.imageDataUrl) return;
        visualItems.push({
          title: formatRenderableText(section.heading || asset.alt || "Generated Visual"),
          caption: normalizeStudentNoteRichLine(asset.alt || section.heading || "Generated lesson visual"),
          src: asset.imageDataUrl,
          cues: [
            normalizeStudentNoteRichLine(section.heading || "Visual"),
            ...normalizeStudentNoteRichLines(section.visualSupport).slice(0, 4),
          ],
        });
      });
    });

    const diagramRefs = new Set(
      (Array.isArray(studentNotes.workedExamples) ? studentNotes.workedExamples : [])
        .map((example) => example.diagramRef)
        .filter(Boolean)
    );
    getMathDiagramList(studentNotes.geometryDiagrams).forEach((diagram) => {
      const svgMarkup = buildMathDiagramSvg(diagram);
      visualItems.push({
        title: formatRenderableText(diagram.title || diagram.type || "Math Diagram"),
        caption: normalizeStudentNoteRichLine(diagram.caption || (diagramRefs.has(diagram.id) ? "Diagram used in the worked example." : "Math diagram")),
        src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`,
        cues: [
          normalizeStudentNoteRichLine(diagram.type || "Diagram"),
          normalizeStudentNoteRichLine(diagram.title || "Geometry"),
        ],
      });
    });

    for (const [visualIndex, visual] of visualItems.entries()) {
      const { canvas, ctx, noteX, noteY } = await createCornellCanvas(
        visual.title || "Visual Notes",
        visual.cues,
        [visual.caption.length > 0 ? visual.caption : normalizeStudentNoteRichLine("Study the visual and connect it to the written solution.")],
        visualIndex + paginatedSections.length,
      );
      const image = await loadImageElement(visual.src);
      let cursorY = noteY;
      const titleLines = wrapCanvasText(ctx, visual.title, noteContentWidth, noteTitleFont);
      cursorY += drawWrappedLines(ctx, titleLines, noteX + 16, cursorY, 30, colors.ink, noteTitleFont, 3);
      cursorY += 18;

      const frameX = noteX + 16;
      const frameY = cursorY;
      const frameW = noteWidth - 32;
      const frameH = 560;
      drawRoundedRect(ctx, frameX, frameY, frameW, frameH, 8, "#ffffff", colors.panelBorder, 1.2);
      const scale = Math.min((frameW - 28) / image.width, (frameH - 28) / image.height);
      const imgW = image.width * scale;
      const imgH = image.height * scale;
      ctx.drawImage(image, frameX + (frameW - imgW) / 2, frameY + (frameH - imgH) / 2, imgW, imgH);
      cursorY += frameH + 24;

      const captionHtml = renderStudentNoteRichLineToHtml(visual.caption);
      if (captionHtml) {
        const captionSnippet = await createStudentNotePdfSnippet(captionHtml, noteContentWidth, "note");
        ctx.drawImage(captionSnippet.image, noteX + 16, cursorY, noteContentWidth, captionSnippet.height);
      }
      renderedPages.push(canvas);
    }

    return buildImagePdfBlob(
      renderedPages.map((pageCanvas) => ({
        bytes: imageDataUrlToJpegBytes(pageCanvas.toDataURL("image/jpeg", 0.94)),
        width: pageCanvas.width,
        height: pageCanvas.height,
      }))
    );
  };

  const buildProfessionalNotesPdfBlob = async (
    session: SessionPlan,
    noteType: "teacher" | "student",
  ) => {
    const canvasWidth = 1240;
    const canvasHeight = 1754;
    const marginX = 94;
    const topMargin = 92;
    const bottomMargin = 92;
    const contentWidth = canvasWidth - marginX * 2;
    const maxY = canvasHeight - bottomMargin;
    const pages: HTMLCanvasElement[] = [];
    const theme = noteType === "teacher"
      ? {
          paper: "#fffdf8",
          ink: "#1f2933",
          muted: "#66727f",
          rule: "#d6dce2",
          accent: "#334e68",
          title: "Teacher Lesson Notes",
          subtitle: "Teacher reference copy",
        }
      : {
          paper: "#fffdf8",
          ink: "#1f2933",
          muted: "#66727f",
          rule: "#d6dce2",
          accent: "#345b63",
          title: "Student Lesson Notes",
          subtitle: "Student study copy",
        };
    const sessionMetaLine = [
      extractedData?.subject || activeWorkspace?.curriculumSnapshot?.subject || "Subject",
      extractedData?.gradeLevel || activeWorkspace?.curriculumSnapshot?.gradeLevel || "Grade",
      `Session ${session.sessionNumber}`,
      session.duration ? `${session.duration} minutes` : "",
    ].filter(Boolean).join("  •  ");

    let canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    let ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to prepare PDF canvas.");
    }
    let y = topMargin;
    let pageNumber = 1;

    const wrapTextLines = (text: string, maxWidth: number, font: string) => {
      ctx.font = font;
      const paragraphs = normalizePdfText(text)
        .split(/\r?\n/)
        .map((line) => line.trim());
      const lines: string[] = [];

      paragraphs.forEach((paragraph, paragraphIndex) => {
        if (!paragraph) {
          if (lines.length > 0 && lines[lines.length - 1] !== "") {
            lines.push("");
          }
          return;
        }
        const words = paragraph.split(/\s+/).filter(Boolean);
        let current = "";
        words.forEach((word) => {
          const candidate = current ? `${current} ${word}` : word;
          if (!current || ctx.measureText(candidate).width <= maxWidth) {
            current = candidate;
          } else {
            lines.push(current);
            current = word;
          }
        });
        if (current) lines.push(current);
        if (paragraphIndex < paragraphs.length - 1) {
          lines.push("");
        }
      });

      while (lines.length > 0 && lines[lines.length - 1] === "") {
        lines.pop();
      }
      return lines;
    };

    const measureTextBlock = (text: string, maxWidth: number, lineHeight: number, font: string) => {
      const lines = wrapTextLines(text, maxWidth, font);
      if (lines.length === 0) return 0;
      return lines.reduce((total, line) => total + (line ? lineHeight : Math.round(lineHeight * 0.55)), 0);
    };

    const drawTextBlock = (
      text: string,
      x: number,
      startY: number,
      maxWidth: number,
      lineHeight: number,
      font: string,
      color: string,
    ) => {
      const lines = wrapTextLines(text, maxWidth, font);
      ctx.font = font;
      ctx.fillStyle = color;
      let cursorY = startY;
      lines.forEach((line) => {
        if (!line) {
          cursorY += Math.round(lineHeight * 0.55);
          return;
        }
        ctx.fillText(line, x, cursorY);
        cursorY += lineHeight;
      });
      return cursorY - startY;
    };

    const startPage = () => {
      ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Unable to prepare PDF canvas.");
      ctx.fillStyle = theme.paper;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.strokeStyle = theme.rule;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, 58);
      ctx.lineTo(canvasWidth - marginX, 58);
      ctx.stroke();
      ctx.fillStyle = theme.muted;
      ctx.font = "600 11px Helvetica, Arial, sans-serif";
      ctx.fillText(theme.title.toUpperCase(), marginX, 44);
      ctx.textAlign = "right";
      ctx.fillText(`Page ${pageNumber}`, canvasWidth - marginX, 44);
      ctx.textAlign = "left";
      ctx.beginPath();
      ctx.moveTo(marginX, canvasHeight - 52);
      ctx.lineTo(canvasWidth - marginX, canvasHeight - 52);
      ctx.stroke();
      y = topMargin;
    };

    startPage();

    const newPage = () => {
      pages.push(canvas);
      canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      pageNumber += 1;
      startPage();
    };

    const ensureSpace = (needed: number) => {
      if (y + needed <= maxY) return;
      newPage();
    };

    const drawTitleBlock = () => {
      ensureSpace(140);
      ctx.fillStyle = theme.ink;
      ctx.font = "700 28px Georgia, Times New Roman, serif";
      y += drawTextBlock(session.title || theme.title, marginX, y, contentWidth, 34, "700 28px Georgia, Times New Roman, serif", theme.ink);
      y += 10;
      ctx.fillStyle = theme.muted;
      ctx.font = "400 13px Helvetica, Arial, sans-serif";
      y += drawTextBlock(`${theme.subtitle}  •  ${sessionMetaLine}`, marginX, y, contentWidth, 18, "400 13px Helvetica, Arial, sans-serif", theme.muted);
      y += 16;
      ctx.strokeStyle = theme.rule;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(canvasWidth - marginX, y);
      ctx.stroke();
      y += 28;
    };

    const drawDivider = (spacingTop = 8, spacingBottom = 14) => {
      ensureSpace(spacingTop + spacingBottom + 4);
      y += spacingTop;
      ctx.strokeStyle = theme.rule;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(canvasWidth - marginX, y);
      ctx.stroke();
      y += spacingBottom;
    };

    const drawSectionHeading = (title: string, subtitle?: string) => {
      ensureSpace(subtitle ? 76 : 54);
      ctx.fillStyle = theme.accent;
      ctx.font = "700 14px Helvetica, Arial, sans-serif";
      ctx.fillText(title.toUpperCase(), marginX, y);
      y += 18;
      if (subtitle) {
        y += drawTextBlock(subtitle, marginX, y, contentWidth, 18, "400 12px Helvetica, Arial, sans-serif", theme.muted);
      }
      y += 8;
      ctx.strokeStyle = theme.rule;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(canvasWidth - marginX, y);
      ctx.stroke();
      y += 20;
    };

    const drawSubheading = (title: string) => {
      ensureSpace(28);
      ctx.fillStyle = theme.ink;
      ctx.font = "700 17px Georgia, Times New Roman, serif";
      ctx.fillText(title, marginX, y);
      y += 24;
    };

    const drawPlainParagraph = (title: string, text: string) => {
      const normalized = formatRenderableText(text).trim();
      if (!normalized) return;
      drawSectionHeading(title);
      ensureSpace(measureTextBlock(normalized, contentWidth, 23, "400 16px Georgia, Times New Roman, serif") + 12);
      y += drawTextBlock(normalized, marginX, y, contentWidth, 23, "400 16px Georgia, Times New Roman, serif", theme.ink);
      y += 10;
    };

    const drawBodyParagraph = (text: string, options?: { font?: string; lineHeight?: number; color?: string; spacingAfter?: number }) => {
      const normalized = formatRenderableText(text).trim();
      if (!normalized) return;
      const font = options?.font || "400 16px Georgia, Times New Roman, serif";
      const lineHeight = options?.lineHeight || 23;
      const color = options?.color || theme.ink;
      const spacingAfter = options?.spacingAfter ?? 10;
      ensureSpace(measureTextBlock(normalized, contentWidth, lineHeight, font) + spacingAfter);
      y += drawTextBlock(normalized, marginX, y, contentWidth, lineHeight, font, color);
      y += spacingAfter;
    };

    const drawBulletList = (items: string[], options?: { ordered?: boolean }) => {
      const filtered = items.map((item) => formatRenderableText(item).trim()).filter(Boolean);
      if (filtered.length === 0) return;
      const bulletColumnWidth = options?.ordered ? 22 : 18;
      const textWidth = contentWidth - bulletColumnWidth;

      filtered.forEach((item, index) => {
        const height = measureTextBlock(item, textWidth, 22, "400 15px Georgia, Times New Roman, serif");
        ensureSpace(height + 10);
        ctx.fillStyle = theme.ink;
        ctx.font = "400 15px Georgia, Times New Roman, serif";
        ctx.fillText(options?.ordered ? `${index + 1}.` : "•", marginX, y);
        const used = drawTextBlock(item, marginX + bulletColumnWidth, y, textWidth, 22, "400 15px Georgia, Times New Roman, serif", theme.ink);
        y += used + 8;
      });
      y += 4;
    };

    const drawListSection = (title: string, items: string[], options?: { ordered?: boolean }) => {
      const filtered = items.map((item) => formatRenderableText(item).trim()).filter(Boolean);
      if (filtered.length === 0) return;
      drawSectionHeading(title);
      drawBulletList(filtered, options);
    };

    const drawLabelValueLines = (entries: Array<{ label: string; values: string[] }>) => {
      entries.forEach((entry) => {
        const values = entry.values.map((item) => formatRenderableText(item).trim()).filter(Boolean);
        if (values.length === 0) return;
        const composed = values.map((value) => `${entry.label}: ${value}`);
        drawBulletList(composed);
      });
    };

    const drawImageFigure = async (heading: string, src: string, caption: string, notes: string[]) => {
      const image = await loadImageElement(src);
      const figureWidth = contentWidth;
      const figureTitle = formatRenderableText(heading).trim() || "Figure";
      const captionText = formatRenderableText(caption).trim() || "Illustration";
      const supportLines = notes.map((item) => formatRenderableText(item).trim()).filter(Boolean).slice(0, 3);
      const frameHeight = 280;
      const captionHeight = measureTextBlock(captionText, figureWidth, 18, "400 12px Helvetica, Arial, sans-serif");
      const supportHeight = supportLines.length > 0
        ? supportLines.reduce((total, item) => total + measureTextBlock(item, figureWidth - 18, 18, "400 12px Helvetica, Arial, sans-serif") + 6, 0) + 10
        : 0;
      ensureSpace(40 + frameHeight + captionHeight + supportHeight + 24);

      drawSubheading(figureTitle);
      const frameX = marginX;
      const frameY = y;
      const frameW = figureWidth;
      const frameH = frameHeight;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = theme.rule;
      ctx.strokeRect(frameX, frameY, frameW, frameH);
      const scale = Math.min(frameW / image.width, frameH / image.height);
      const imgW = image.width * scale;
      const imgH = image.height * scale;
      const imgX = frameX + (frameW - imgW) / 2;
      const imgY = frameY + (frameH - imgH) / 2;
      ctx.drawImage(image, imgX, imgY, imgW, imgH);
      y += frameH + 18;
      y += drawTextBlock(captionText, marginX, y, figureWidth, 18, "400 12px Helvetica, Arial, sans-serif", theme.muted);
      y += 8;
      if (supportLines.length > 0) {
        ctx.fillStyle = theme.accent;
        ctx.font = "700 12px Helvetica, Arial, sans-serif";
        ctx.fillText("Visual Notes", marginX, y);
        y += 18;
        supportLines.forEach((item) => {
          const used = drawTextBlock(item, marginX + 18, y, figureWidth - 18, 18, "400 12px Helvetica, Arial, sans-serif", theme.ink);
          ctx.fillStyle = theme.ink;
          ctx.font = "400 12px Helvetica, Arial, sans-serif";
          ctx.fillText("•", marginX, y);
          y += used + 6;
        });
      }
      y += 6;
    };

    const drawMathDiagramFigure = async (diagram: MathDiagramSpec) => {
      const svgMarkup = buildMathDiagramSvg(diagram);
      const image = await loadImageElement(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`);
      await drawImageFigure(
        diagram.title || diagram.type,
        image.src,
        diagram.caption || diagram.title || diagram.type,
        []
      );
    };

    const drawCompactTable = (title: string, headers: string[] = [], rows: string[][] = []) => {
      if (!headers.length && !rows.length) return;
      drawSectionHeading(title || "Table");
      if (headers.length) {
        drawBodyParagraph(headers.join(" | "), {
          font: "700 13px Helvetica, Arial, sans-serif",
          lineHeight: 19,
          color: theme.accent,
          spacingAfter: 6,
        });
      }
      rows.forEach((row) => {
        drawBodyParagraph(row.map((cell) => formatRenderableText(cell)).join(" | "), {
          font: "400 13px Helvetica, Arial, sans-serif",
          lineHeight: 19,
          spacingAfter: 6,
        });
      });
    };

    const teacherPdfSnippetCache = new Map<string, Promise<{ image: HTMLImageElement; height: number }>>();
    const escapeTeacherPdfHtml = (value: string) =>
      stripImplicitUnitFromContextLabel(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");

    const renderTeacherPdfMathHtml = (latex: string, displayMode = false, fallback = "") => {
      const normalizedLatex = normalizeInlineMathText(latex);
      try {
        return katex.renderToString(normalizedLatex, {
          displayMode,
          throwOnError: false,
          strict: false,
        });
      } catch {
        return `<span class="teacher-pdf-text">${escapeTeacherPdfHtml(fallback || latexToReadableText(normalizedLatex) || latex)}</span>`;
      }
    };

    const renderTeacherRichValueToHtml = (value: StudentNoteRichValue, displayMode = false) => {
      const renderPlan = getStudentNoteRenderPlan(value);
      if (renderPlan.segments.length === 0) return "";
      return renderPlan.segments.map((segment) => {
        if (segment.type === "math") {
          const shouldDisplay = displayMode || segment.displayMode || renderPlan.classification === "full_latex_line";
          return `<span class="${shouldDisplay ? "teacher-pdf-math teacher-pdf-math-display" : "teacher-pdf-math"}">${renderTeacherPdfMathHtml(segment.value, shouldDisplay, segment.value)}</span>`;
        }
        return `<span class="teacher-pdf-text">${escapeTeacherPdfHtml(segment.value)}</span>`;
      }).join("");
    };

    const renderTeacherRichLineToHtml = (line: StudentNoteRichLine, options?: { displayMode?: boolean; className?: string }) => {
      const isFullLatexLine = line.length === 1 && getStudentNoteRenderPlan(line[0]).classification === "full_latex_line";
      const content = line
        .map((item) => renderTeacherRichValueToHtml(item, Boolean(options?.displayMode)))
        .filter(Boolean)
        .join("");
      if (!content) return "";
      const className = ["teacher-pdf-line", options?.displayMode || isFullLatexLine ? "teacher-pdf-line-display" : "", options?.className || ""]
        .filter(Boolean)
        .join(" ");
      return `<div class="${className}">${content}</div>`;
    };

    const getTeacherPdfCss = () => `
      ${katexStyles}
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; background: transparent; }
      .teacher-pdf-root {
        width: 100%;
        color: #2b3437;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 16px;
        line-height: 1.5;
      }
      .teacher-pdf-line { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }
      .teacher-pdf-line-display { display: block; }
      .teacher-pdf-block + .teacher-pdf-block { margin-top: 10px; }
      .teacher-pdf-list-label {
        margin-bottom: 8px;
        font: 700 12px Helvetica, Arial, sans-serif;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #4c6a7b;
      }
      .teacher-pdf-list {
        margin: 0;
        padding-left: 22px;
      }
      .teacher-pdf-list li + li { margin-top: 8px; }
      .teacher-pdf-list-line { font-size: 15px; line-height: 1.5; }
      .teacher-pdf-math { display: inline-block; max-width: 100%; vertical-align: middle; }
      .teacher-pdf-math-display { display: block; margin: 6px 0; }
      .teacher-pdf-text { white-space: pre-wrap; }
      .teacher-pdf-root .katex .katex-mathml,
      .teacher-pdf-root .katex annotation { display: none !important; }
      .teacher-pdf-root .katex-display { margin: 0.35em 0; }
    `;

    const createTeacherPdfSnippet = async (html: string, width: number) => {
      const normalizedHtml = html.trim();
      if (!normalizedHtml) {
        return { image: await loadImageElement("data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="), height: 1 };
      }
      const cacheKey = `${width}:${normalizedHtml}`;
      if (!teacherPdfSnippetCache.has(cacheKey)) {
        teacherPdfSnippetCache.set(cacheKey, (async () => {
          const measureHost = document.createElement("div");
          measureHost.style.position = "fixed";
          measureHost.style.left = "-100000px";
          measureHost.style.top = "0";
          measureHost.style.width = `${width}px`;
          measureHost.style.visibility = "hidden";
          measureHost.style.pointerEvents = "none";
          measureHost.innerHTML = `<style>${getTeacherPdfCss()}</style><div class="teacher-pdf-root">${normalizedHtml}</div>`;
          document.body.appendChild(measureHost);
          const measuredRoot = measureHost.querySelector(".teacher-pdf-root") as HTMLElement | null;
          const height = Math.max(1, Math.ceil(measuredRoot?.getBoundingClientRect().height || 1));
          measureHost.remove();

          const scale = 2;
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}">
              <foreignObject x="0" y="0" width="${width}" height="${height}">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <style>${getTeacherPdfCss()}</style>
                  <div class="teacher-pdf-root">${normalizedHtml}</div>
                </div>
              </foreignObject>
            </svg>
          `;
          const image = await loadImageElement(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
          return { image, height };
        })());
      }
      return teacherPdfSnippetCache.get(cacheKey)!;
    };

    const drawTeacherRenderedSnippet = async (html: string, width = contentWidth) => {
      if (!html.trim()) return;
      try {
        const snippet = await createTeacherPdfSnippet(html, width);
        ensureSpace(snippet.height + 12);
        ctx.drawImage(snippet.image, marginX, y, width, snippet.height);
        y += snippet.height + 12;
      } catch {
        const fallbackText = (() => {
          const text = html
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<\/(div|p|li|ol|ul|br|h1|h2|h3|h4|h5|h6)>/gi, "\n")
            .replace(/<li[^>]*>/gi, "• ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, "\"")
            .replace(/&#39;/g, "'")
            .replace(/\n\s*\n\s*\n+/g, "\n\n")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n[ \t]+/g, "\n")
            .replace(/[ \t]{2,}/g, " ")
            .trim();
          return text;
        })();
        if (!fallbackText) return;
        drawBodyParagraph(fallbackText, {
          font: "400 15px Georgia, Times New Roman, serif",
          lineHeight: 22,
          spacingAfter: 10,
        });
      }
    };

    const toTeacherRenderableList = (items: StudentNoteRichLine[]) =>
      items.map((item) => renderTeacherRichLineToHtml(item, { className: "teacher-pdf-list-line" })).filter(Boolean);

    const drawTeacherTemplateCard = async (card: TeacherTemplateListCard) => {
      const listItems = toTeacherRenderableList(card.items).map((item) => `<li>${item}</li>`).join("");
      if (!listItems) return;
      const description = card.description ? `<div class="teacher-pdf-text" style="margin-bottom:8px;color:#7c7a76;">${escapeTeacherPdfHtml(card.description)}</div>` : "";
      await drawTeacherRenderedSnippet(`
        <div class="teacher-pdf-block">
          <div class="teacher-pdf-list-label">${escapeTeacherPdfHtml(card.title)}</div>
          ${description}
          <${card.ordered ? "ol" : "ul"} class="teacher-pdf-list">${listItems}</${card.ordered ? "ol" : "ul"}>
        </div>
      `);
    };

    const drawTeacherLabeledLines = async (entries: Array<{ label: string; items: StudentNoteRichLine[]; ordered?: boolean }>) => {
      for (const entry of entries) {
        const values = toTeacherRenderableList(entry.items);
        if (values.length === 0) continue;
        await drawTeacherRenderedSnippet(`
          <div class="teacher-pdf-block">
            <div class="teacher-pdf-list-label">${escapeTeacherPdfHtml(entry.label)}</div>
            <${entry.ordered ? "ol" : "ul"} class="teacher-pdf-list">${values.map((value) => `<li>${value}</li>`).join("")}</${entry.ordered ? "ol" : "ul"}>
          </div>
        `);
      }
    };

    drawTitleBlock();

    if (noteType === "teacher" && session.teacherLessonNotes) {
      const template = buildTeacherNotesTemplate(session.teacherLessonNotes);
      if (template.overview) {
        drawSectionHeading("Session Overview");
        await drawTeacherRenderedSnippet(renderTeacherRichLineToHtml(normalizeStudentNoteRichLine(template.overview), { className: "teacher-pdf-paragraph" }));
      }

      if (template.preparationCards.length > 0) {
        drawSectionHeading("Core Preparation");
        for (const card of template.preparationCards) {
          await drawTeacherTemplateCard(card);
        }
      }

      if (template.teachingPlan.length > 0) {
        drawSectionHeading("Delivery Flow", "Topic pacing snapshot");
        for (const item of template.teachingPlan) {
          drawSubheading(`${formatRenderableText(item.topic)}${item.minutes ? ` (${formatRenderableText(item.minutes)} min)` : ""}`);
          if (item.teachingStrategy) {
            await drawTeacherRenderedSnippet(renderTeacherRichLineToHtml(normalizeStudentNoteRichLine(item.teachingStrategy), { className: "teacher-pdf-paragraph" }));
          }
        }
      }

      if (template.interactionCards.length > 0) {
        drawSectionHeading("Interaction and Checks");
        for (const card of template.interactionCards) {
          await drawTeacherTemplateCard(card);
        }
      }

      if (template.lessonBlocks.length > 0) {
        drawSectionHeading("Detailed Lesson Blocks", "Stage-wise flow for instruction");
        for (const [index, block] of template.lessonBlocks.entries()) {
          const title = `Block ${index + 1}${block.title ? `: ${formatRenderableText(block.title)}` : ""}${block.durationMinutes != null ? ` (${formatRenderableText(block.durationMinutes)} min)` : ""}`;
          drawSubheading(title);
          await drawTeacherLabeledLines([
            { label: "Teacher Prompt", items: normalizeStudentNoteRichLines(block.teacherPrompt) },
            { label: "Explanation", items: normalizeStudentNoteRichLines(block.explanation) },
            { label: "Check Understanding", items: normalizeStudentNoteRichLines(block.checkUnderstanding) },
            { label: "Expected Answers", items: normalizeStudentNoteRichLines(block.expectedAnswers) },
            { label: "Activity", items: normalizeStudentNoteRichLines(block.activity) },
            { label: "Board Work", items: normalizeStudentNoteRichLines(block.boardWork) },
            { label: "Board Steps", items: normalizeStudentNoteRichLines(block.boardSteps), ordered: true },
            { label: "Solution Flow", items: normalizeStudentNoteRichLines(block.solutionFlow), ordered: true },
            { label: "Proof Steps", items: normalizeStudentNoteRichLines(block.proofSteps), ordered: true },
            { label: "Examples", items: normalizeStudentNoteRichLines(block.examples) },
          ]);
          for (const diagram of getMathDiagramList(block.geometryDiagrams)) {
            await drawMathDiagramFigure(diagram);
          }
          drawDivider(2, 12);
        }
      }

      if (template.conceptFlow.length > 0) {
        drawSectionHeading("Concept Flow");
        for (const [index, concept] of template.conceptFlow.entries()) {
          drawSubheading(`Concept ${index + 1}: ${formatRenderableText(concept.conceptName)}`);
          await drawTeacherLabeledLines([
            { label: "Definition", items: normalizeStudentNoteRichLines(concept.definition) },
            { label: "Core Explanation", items: normalizeStudentNoteRichLines(concept.coreExplanation) },
            { label: "Importance", items: normalizeStudentNoteRichLines(concept.importance) },
            { label: "Observed In", items: normalizeStudentNoteRichLines(concept.observedIn) },
            { label: "Why Study It", items: normalizeStudentNoteRichLines(concept.whyStudyIt) },
            { label: "Relationship With Previous", items: normalizeStudentNoteRichLines(concept.relationshipWithPrevious) },
            { label: "Relationship With Future", items: normalizeStudentNoteRichLines(concept.relationshipWithFuture) },
            { label: "Keywords", items: normalizeStudentNoteRichLines(concept.keywords) },
            { label: "Teacher Moves", items: normalizeStudentNoteRichLines(concept.teacherMoves) },
            { label: "Examples", items: normalizeStudentNoteRichLines(concept.examples) },
            { label: "Visual Cues", items: normalizeStudentNoteRichLines(concept.visuals) },
            { label: "Solution Flow", items: normalizeStudentNoteRichLines(concept.solutionFlow), ordered: true },
            { label: "Proof Steps", items: normalizeStudentNoteRichLines(concept.proofSteps), ordered: true },
          ]);
          for (const diagram of getMathDiagramList(concept.geometryDiagrams)) {
            await drawMathDiagramFigure(diagram);
          }
          drawDivider(2, 12);
        }
      }

      if (template.classroomQuestions.length > 0) {
        drawSectionHeading("Classroom Questions");
        for (const [index, question] of template.classroomQuestions.entries()) {
          drawSubheading(`Prompt ${index + 1}`);
          await drawTeacherLabeledLines([
            { label: "Question", items: normalizeStudentNoteRichLines(question.question) },
            { label: "Expected Response", items: normalizeStudentNoteRichLines(question.expectedResponse) },
            { label: "Answer Points", items: normalizeStudentNoteRichLines(question.answerPoints) },
          ]);
          if (question.level) {
            drawBodyParagraph(`Level: ${formatRenderableText(question.level)}`, {
              font: "700 12px Helvetica, Arial, sans-serif",
              lineHeight: 18,
              color: theme.muted,
              spacingAfter: 8,
            });
          }
        }
      }

      if (template.timePlan.length > 0) {
        drawSectionHeading("Session Time Plan");
        for (const block of template.timePlan) {
          drawSubheading(`${formatRenderableText(block.segment)}${block.minutes ? ` (${formatRenderableText(block.minutes)} min)` : ""}`);
          await drawTeacherLabeledLines([
            { label: "Purpose", items: normalizeStudentNoteRichLines(block.purpose) },
          ]);
        }
      }

      if (template.misconceptions.length > 0) {
        drawSectionHeading("Misconceptions and Corrections");
        for (const item of template.misconceptions) {
          await drawTeacherLabeledLines([
            { label: "Misconception", items: normalizeStudentNoteRichLines(item.misconception) },
            { label: "Correction", items: normalizeStudentNoteRichLines(item.correction) },
          ]);
        }
      }

      if (template.supportCards.length > 0) {
        drawSectionHeading("Support and Closure");
        for (const card of template.supportCards) {
          await drawTeacherTemplateCard(card);
        }
      }

      if (template.endOfClassRecap.length > 0) {
        drawSectionHeading("End-of-Class Recap");
        for (const item of template.endOfClassRecap) {
          await drawTeacherLabeledLines([
            { label: "Prompt", items: normalizeStudentNoteRichLines(item.prompt) },
            { label: "Expected Answer", items: normalizeStudentNoteRichLines(item.expectedAnswer) },
          ]);
        }
      }
    }

    if (noteType === "student" && session.studentLessonNotes) {
      const studentNotes = session.studentLessonNotes;
      const exportedMathDiagrams = getMathDiagramList(studentNotes.geometryDiagrams);
      const exportedDiagramById = new Map(exportedMathDiagrams.map((diagram) => [diagram.id, diagram]));
      const exportedWorkedDiagramRefs = new Set(
        (Array.isArray(studentNotes.workedExamples) ? studentNotes.workedExamples : [])
          .map((example) => example.diagramRef)
          .filter((id): id is string => Boolean(id))
      );
      const exportedInlineDiagramIds = new Set<string>();
      drawPlainParagraph("Session Overview", formatRenderableText(studentNotes.sessionOverview));
      drawPlainParagraph("Introduction", formatRenderableText(studentNotes.introduction));
      drawListSection("Learning Objectives", getRenderableList(studentNotes.learningObjectives));
      drawListSection("Quick Recall", getRenderableList(studentNotes.quickRecall));
      drawListSection("Easy to Remember", getRenderableList(studentNotes.easyToRemember));

      if (Array.isArray(studentNotes.formulaCards) && studentNotes.formulaCards.length > 0) {
        drawSectionHeading("Formula Cards");
        studentNotes.formulaCards.forEach((card, index) => {
          drawSubheading(formatRenderableText(card.title || `Formula ${index + 1}`));
          drawLabelValueLines([
            { label: "Formula", values: getRenderableList(card.formula) },
            { label: "Meaning", values: getRenderableList(card.meaning) },
            { label: "Use when", values: getRenderableList(card.whenToUse) },
          ]);
        });
      }

      if (Array.isArray(studentNotes.comparisonTables) && studentNotes.comparisonTables.length > 0) {
        studentNotes.comparisonTables.forEach((table) => {
          drawCompactTable(formatRenderableText(table.title || "Comparison Table"), getRenderableList(table.headers), Array.isArray(table.rows) ? table.rows : []);
        });
      }

      for (const diagram of exportedMathDiagrams.filter((item) => !exportedWorkedDiagramRefs.has(item.id))) {
        await drawMathDiagramFigure(diagram);
      }

      drawListSection("Proof / Reasoning Flow", getRenderableMathLines(studentNotes.proofSteps), { ordered: true });

      if (Array.isArray(studentNotes.sections) && studentNotes.sections.length > 0) {
        drawSectionHeading("Concept Notes", "Main ideas with supporting explanation and visuals");
        for (const [index, section] of studentNotes.sections.entries()) {
          drawSubheading(formatRenderableText(section.heading) || `Concept ${index + 1}`);
          const explanation = getRenderableList(section.explanation);
          const detailedExplanation = getRenderableList(section.detailedExplanation);
          explanation.forEach((item) => {
            drawBodyParagraph(item);
          });
          detailedExplanation.forEach((item) => {
            drawBodyParagraph(item);
          });
          drawLabelValueLines([
            { label: "Why it matters", values: getRenderableList(section.whyItMatters) },
            { label: "Key point", values: getRenderableList(section.keyPoints) },
            { label: "Example", values: getRenderableList(section.examples) },
            { label: "Terminology", values: getRenderableList(section.terminology) },
            { label: "Important", values: getRenderableList(section.importantNotes) },
            { label: "Memory tip", values: getRenderableList(section.memoryTechniques) },
            { label: "Summary", values: getRenderableList(section.conceptSummary) },
          ]);
          const assets = Array.isArray(section.visualAssets)
            ? section.visualAssets.filter((asset) => Boolean(asset?.imageDataUrl))
            : [];
          for (const [assetIndex, asset] of assets.entries()) {
            await drawImageFigure(
              formatRenderableText(section.heading) || `Concept ${index + 1} Visual ${assetIndex + 1}`,
              asset.imageDataUrl,
              formatRenderableText(asset.alt || "AI-generated classroom visual"),
              getRenderableList(section.visualSupport)
            );
          }
          drawDivider(4, 16);
        }
      }

      if (Array.isArray(studentNotes.definitions) && studentNotes.definitions.length > 0) {
        drawSectionHeading("Glossary");
        studentNotes.definitions.forEach((definition) => {
          drawSubheading(formatRenderableText(definition.term));
          getRenderableList(definition.definition).forEach((item) => {
            drawBodyParagraph(item, { font: "400 15px Georgia, Times New Roman, serif", lineHeight: 22 });
          });
        });
      }

      if (Array.isArray(studentNotes.workedExamples) && studentNotes.workedExamples.length > 0) {
        drawSectionHeading("Worked Examples");
        for (const [index, example] of studentNotes.workedExamples.entries()) {
          drawSubheading(`Example ${index + 1}${example.title ? `: ${formatRenderableText(example.title)}` : ""}`);
          const linkedDiagram = example.diagramRef ? exportedDiagramById.get(example.diagramRef) : null;
          if (linkedDiagram && !exportedInlineDiagramIds.has(linkedDiagram.id)) {
            await drawMathDiagramFigure(linkedDiagram);
            exportedInlineDiagramIds.add(linkedDiagram.id);
          }
          drawLabelValueLines([
            { label: "Problem", values: getRenderableList(example.problem) },
            { label: "Diagram", values: linkedDiagram ? [] : getRenderableList(example.diagramRef) },
            { label: "Given", values: getRenderableMathLines(example.given) },
            { label: "Formula", values: getRenderableMathLines(example.formula) },
            { label: "Step", values: getRenderableMathLines(example.solutionSteps).length > 0 ? getRenderableMathLines(example.solutionSteps) : getRenderableList(example.steps) },
            { label: "Reasoning", values: getRenderableMathLines(example.reasoning) },
            { label: "Final Answer", values: getRenderableList(example.finalAnswer) },
          ]);
          getRenderableList(example.explanation).forEach((item) => {
            drawBodyParagraph(item, { font: "400 15px Georgia, Times New Roman, serif", lineHeight: 22 });
          });
        }
      }

      if (studentNotes.revisionSection) {
        drawSectionHeading("Revision Section");
        drawListSection("Definitions", getRenderableList(studentNotes.revisionSection.definitions));
        drawListSection("Formulas", getRenderableMathLines(studentNotes.revisionSection.formulas));
        drawListSection("Facts", getRenderableList(studentNotes.revisionSection.facts));
        drawListSection("Keywords", getRenderableList(studentNotes.revisionSection.keywords));
        drawListSection("Concept Map", getRenderableList(studentNotes.revisionSection.conceptMap));
        drawListSection("Quick Recap", getRenderableList(studentNotes.revisionSection.quickRecap));
      }

      drawListSection("Quick Summary", getRenderableList(studentNotes.quickSummary));
      drawListSection("Key Terms", getRenderableList(studentNotes.keyTerms));

      if (Array.isArray(studentNotes.fillInTheBlanks) && studentNotes.fillInTheBlanks.length > 0) {
        drawSectionHeading("Fill in the Blanks");
        studentNotes.fillInTheBlanks.forEach((item, index) => {
          drawSubheading(`Prompt ${index + 1}`);
          drawBulletList([
            formatRenderableText(item.prompt),
            ...(item.answer ? [`Answer: ${formatRenderableText(item.answer)}`] : []),
          ]);
        });
      }

      if (Array.isArray(studentNotes.mcqQuestions) && studentNotes.mcqQuestions.length > 0) {
        drawSectionHeading("MCQs");
        studentNotes.mcqQuestions.forEach((item, index) => {
          drawSubheading(`Question ${index + 1}`);
          drawBulletList([
            formatRenderableText(item.question),
            ...getRenderableList(item.options).map((option) => `Option: ${option}`),
            ...(item.answer ? [`Answer: ${formatRenderableText(item.answer)}`] : []),
          ]);
        });
      }

      if (Array.isArray(studentNotes.veryShortAnswerQuestions) && studentNotes.veryShortAnswerQuestions.length > 0) {
        drawSectionHeading("Very Short Answer Questions");
        studentNotes.veryShortAnswerQuestions.forEach((item, index) => {
          drawSubheading(`Question ${index + 1}`);
          drawBulletList([
            formatRenderableText(item.question),
            ...(item.answer ? [`Answer: ${formatRenderableText(item.answer)}`] : []),
          ]);
        });
      }

      drawListSection("Self-Check Questions", getRenderableList(studentNotes.selfCheckQuestions), { ordered: true });
      drawListSection("Did You Know?", getRenderableList(studentNotes.didYouKnow));
      drawListSection("Summary", getRenderableList(studentNotes.summary));
      drawListSection("Quick Revision", getRenderableList(studentNotes.quickRevision));
      drawListSection("Remember", getRenderableList(studentNotes.rememberPoints));
      if (Array.isArray(studentNotes.commonMistakes) && studentNotes.commonMistakes.length > 0) {
        drawSectionHeading("Common Mistakes");
        studentNotes.commonMistakes.forEach((mistake, index) => {
          drawSubheading(`Mistake ${index + 1}`);
          drawLabelValueLines([
            { label: "Mistake", values: getRenderableList(mistake.mistake) },
            { label: "Correction", values: getRenderableList(mistake.correction) },
            { label: "Example", values: getRenderableList(mistake.example) },
          ]);
        });
      }
    }

    pages.push(canvas);
    const renderedPages = pages.map((pageCanvas) => {
      const dataUrl = pageCanvas.toDataURL("image/jpeg", 0.92);
      return {
        bytes: imageDataUrlToJpegBytes(dataUrl),
        width: pageCanvas.width,
        height: pageCanvas.height,
      };
    });
    return buildImagePdfBlob(renderedPages);
  };

  const buildCurriculumPdfBlob = async (curriculum: CurriculumExtraction) => {
    type ExportChapter = {
      chapterName: string;
      topics: string[];
      subtopics: string[];
    };
    type ExportUnit = {
      unitId: string;
      unitName: string;
      description: string;
      topics: string[];
      subtopics: string[];
      chapters: ExportChapter[];
    };
    type ExportClass = {
      className: string;
      subject: string;
      units: ExportUnit[];
    };

    const isMeaningfulValue = (value: unknown) => {
      const normalized = formatRenderableText(value).trim();
      if (!normalized) return false;
      if (normalized === "-") return false;
      return true;
    };

    const cleanValue = (value: unknown) => {
      const normalized = formatRenderableText(value).replace(/\s+/g, " ").trim();
      return isMeaningfulValue(normalized) ? normalized : "";
    };

    const uniqueMeaningfulList = (values: unknown) => {
      const source = Array.isArray(values) ? values : [];
      return [...new Set(source.map((item) => cleanValue(item)).filter(Boolean))];
    };

    const hasDeepChapterContent = (chapter: ExportChapter, unitName: string) => {
      const hasTopics = chapter.topics.length > 0;
      const hasSubtopics = chapter.subtopics.length > 0;
      const sameAsUnit = cleanValue(chapter.chapterName).toLowerCase() === cleanValue(unitName).toLowerCase();
      if (sameAsUnit && !hasTopics && !hasSubtopics) return false;
      return Boolean(cleanValue(chapter.chapterName) || hasTopics || hasSubtopics);
    };

    const normalizeStructuredUnit = (unit: Record<string, unknown>): ExportUnit => {
      const unitName = cleanValue(unit.unit_name || unit.unitName || unit.unit_id || unit.unitId || "");
      const unitTopics = uniqueMeaningfulList(unit.topics);
      const unitSubtopics = uniqueMeaningfulList(unit.subtopics);
      const rawChapters = Array.isArray(unit.chapters)
        ? unit.chapters as Array<Record<string, unknown>>
        : Array.isArray(unit.chapter_details)
          ? unit.chapter_details as Array<Record<string, unknown>>
          : Array.isArray(unit.chapterDetails)
            ? unit.chapterDetails as Array<Record<string, unknown>>
            : [];
      const chapters = rawChapters
        .map((chapter) => ({
          chapterName: cleanValue(chapter.chapter_name || chapter.source_chapter_name || chapter.title || ""),
          topics: uniqueMeaningfulList(chapter.topics),
          subtopics: uniqueMeaningfulList(chapter.subtopics),
        }))
        .filter((chapter) => hasDeepChapterContent(chapter, unitName));
      const explicitChapterNames = uniqueMeaningfulList(unit.explicit_chapters || unit.explicitChapters);
      const fallbackChapters = chapters.length > 0
        ? chapters
        : explicitChapterNames.map((chapterName) => ({
            chapterName,
            topics: [],
            subtopics: [],
          })).filter((chapter) => hasDeepChapterContent(chapter, unitName));

      return {
        unitId: cleanValue(unit.unit_id || unit.unitId || ""),
        unitName,
        description: cleanValue(unit.description || ""),
        topics: unitTopics,
        subtopics: unitSubtopics,
        chapters: fallbackChapters,
      };
    };

    const normalizeFlatUnit = (unit: Record<string, unknown>): ExportUnit => ({
      unitId: cleanValue(unit.unitId || unit.unit_id || ""),
      unitName: cleanValue(unit.unitName || unit.unit_name || ""),
      description: cleanValue(unit.description || ""),
      topics: uniqueMeaningfulList(unit.topics),
      subtopics: uniqueMeaningfulList(unit.subtopics),
      chapters: [],
    });

    const extractCurriculumHierarchy = (): ExportClass[] => {
      const curriculumRecord = curriculum as unknown as Record<string, unknown>;
      const planningStructure = curriculumRecord.planning_structure as Record<string, unknown> | undefined;
      const faithfulStructure = curriculumRecord.faithful_structure as Record<string, unknown> | undefined;
      const normalizedStructure = curriculum.normalizedStructure as Record<string, unknown> | undefined;
      const stagedStructure = (curriculum.stagedExtraction as Record<string, unknown> | undefined)?.normalizedStructure as Record<string, unknown> | undefined;
      const prioritizedStructure = planningStructure || faithfulStructure || normalizedStructure || stagedStructure;

      if (prioritizedStructure && Array.isArray(prioritizedStructure.classes)) {
        return (prioritizedStructure.classes as Array<Record<string, unknown>>)
          .map((cls) => ({
            className: cleanValue(cls.class_name || curriculum.gradeLevel || ""),
            subject: cleanValue(cls.subject || curriculum.subject || ""),
            units: (Array.isArray(cls.units) ? cls.units as Array<Record<string, unknown>> : [])
              .map(normalizeStructuredUnit)
              .filter((unit) => unit.unitName || unit.chapters.length || unit.topics.length || unit.subtopics.length),
          }))
          .filter((cls) => cls.units.length > 0);
      }

      if (Array.isArray(curriculum.units) && curriculum.units.length > 0) {
        return [{
          className: cleanValue(curriculum.gradeLevel || ""),
          subject: cleanValue(curriculum.subject || ""),
          units: curriculum.units
            .map((unit) => normalizeFlatUnit(unit as unknown as Record<string, unknown>))
            .filter((unit) => unit.unitName || unit.description || unit.topics.length || unit.subtopics.length),
        }];
      }

      return [];
    };

    const exportClasses = extractCurriculumHierarchy();
    const allUnits = exportClasses.flatMap((cls) => cls.units);
    const allChapters = allUnits.flatMap((unit) => unit.chapters);
    const totalChapterCount = allChapters.length;
    const totalSubtopicCount = allUnits.reduce(
      (sum, unit) => sum + unit.subtopics.length + unit.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.subtopics.length, 0),
      0
    );

    const exportTextCorpus = [
      curriculum.subject || "",
      curriculum.gradeLevel || "",
      curriculum.overallDescription || "",
      ...(Array.isArray(curriculum.coreObjectives) ? curriculum.coreObjectives : []),
      ...exportClasses.flatMap((cls) => [
        cls.className,
        cls.subject,
        ...cls.units.flatMap((unit) => [
          unit.unitId,
          unit.unitName,
          unit.description,
          ...unit.topics,
          ...unit.subtopics,
          ...unit.chapters.flatMap((chapter) => [chapter.chapterName, ...chapter.topics, ...chapter.subtopics]),
        ]),
      ]),
    ].map((item) => formatRenderableText(item));
    const requiresUnicodeCanvasExport = exportTextCorpus.some((item) => /[^\u0000-\u00ff]/.test(item));

    if (requiresUnicodeCanvasExport) {
      const canvasWidth = 1240;
      const canvasHeight = 1754;
      const marginX = 84;
      const topMargin = 96;
      const bottomMargin = 92;
      const contentWidth = canvasWidth - marginX * 2;
      const maxY = canvasHeight - bottomMargin;
      const pages: HTMLCanvasElement[] = [];
      const fontStack = "\"Noto Sans Tamil\", \"Nirmala UI\", \"Latha\", \"Arial Unicode MS\", Arial, sans-serif";
      const theme = {
        paper: "#fcfbf7",
        ink: "#1f2933",
        muted: "#5f6c7b",
        accent: "#1f8a8a",
        accentSoft: "#e9f7f6",
        border: "#d8e0e4",
      };

      let canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      let ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to prepare curriculum export canvas.");
      }
      let y = topMargin;
      let pageNumber = 1;

      const wrapCanvasText = (text: string, maxWidth: number, font: string) => {
        const normalized = formatRenderableText(text).replace(/\s+/g, " ").trim();
        if (!normalized) return [];
        ctx.font = font;
        const words = normalized.split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let current = "";
        words.forEach((word) => {
          const candidate = current ? `${current} ${word}` : word;
          if (!current || ctx.measureText(candidate).width <= maxWidth) {
            current = candidate;
            return;
          }
          lines.push(current);
          current = word;
        });
        if (current) lines.push(current);
        return lines;
      };

      const measureCanvasBlock = (text: string, maxWidth: number, lineHeight: number, font: string) => {
        const lines = wrapCanvasText(text, maxWidth, font);
        return lines.length === 0 ? 0 : lines.length * lineHeight;
      };

      const drawCanvasBlock = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number, font: string, color: string) => {
        const lines = wrapCanvasText(text, maxWidth, font);
        ctx.font = font;
        ctx.fillStyle = color;
        lines.forEach((line, index) => {
          ctx.fillText(line, x, startY + index * lineHeight);
        });
        return lines.length * lineHeight;
      };

      const startPage = () => {
        ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Unable to prepare curriculum export canvas.");
        ctx.fillStyle = theme.paper;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = theme.accent;
        ctx.fillRect(0, 0, canvasWidth, 76);
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 24px ${fontStack}`;
        ctx.fillText(formatRenderableText(curriculum.subject || "Curriculum Export"), marginX, 46);
        ctx.font = `500 12px ${fontStack}`;
        ctx.textAlign = "right";
        ctx.fillText(`Page ${pageNumber}`, canvasWidth - marginX, 46);
        ctx.textAlign = "left";
        y = topMargin;
      };

      const newPage = () => {
        pages.push(canvas);
        canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        pageNumber += 1;
        startPage();
      };

      const ensureSpace = (height: number) => {
        if (y + height <= maxY) return;
        newPage();
      };

      const drawHeading = (title: string, level: "title" | "section" | "unit" | "chapter" = "section") => {
        const styles = {
          title: { font: `700 30px ${fontStack}`, color: theme.ink, gap: 24 },
          section: { font: `700 18px ${fontStack}`, color: theme.accent, gap: 18 },
          unit: { font: `700 16px ${fontStack}`, color: theme.ink, gap: 14 },
          chapter: { font: `600 14px ${fontStack}`, color: theme.ink, gap: 12 },
        };
        const style = styles[level];
        const height = measureCanvasBlock(title, contentWidth, level === "title" ? 38 : 24, style.font) + style.gap;
        ensureSpace(height + 10);
        y += drawCanvasBlock(title, marginX, y, contentWidth, level === "title" ? 38 : 24, style.font, style.color);
        y += 6;
        if (level !== "title") {
          ctx.strokeStyle = theme.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(marginX, y);
          ctx.lineTo(canvasWidth - marginX, y);
          ctx.stroke();
        }
        y += style.gap;
      };

      const drawParagraph = (text: string, options?: { color?: string; font?: string; lineHeight?: number; spacingAfter?: number }) => {
        const normalized = formatRenderableText(text).trim();
        if (!normalized) return;
        const font = options?.font || `400 14px ${fontStack}`;
        const lineHeight = options?.lineHeight || 22;
        const spacingAfter = options?.spacingAfter ?? 10;
        ensureSpace(measureCanvasBlock(normalized, contentWidth, lineHeight, font) + spacingAfter);
        y += drawCanvasBlock(normalized, marginX, y, contentWidth, lineHeight, font, options?.color || theme.ink);
        y += spacingAfter;
      };

      const drawBulletList = (items: string[], indent = 0) => {
        const bulletX = marginX + indent;
        const textX = bulletX + 18;
        const maxWidth = contentWidth - indent - 18;
        items.map((item) => formatRenderableText(item).trim()).filter(Boolean).forEach((item) => {
          const height = measureCanvasBlock(item, maxWidth, 21, `400 14px ${fontStack}`);
          ensureSpace(height + 8);
          ctx.fillStyle = theme.accent;
          ctx.font = `700 12px ${fontStack}`;
          ctx.fillText("•", bulletX, y);
          y += drawCanvasBlock(item, textX, y, maxWidth, 21, `400 14px ${fontStack}`, theme.ink);
          y += 8;
        });
      };

      const drawMetricCards = (items: Array<{ label: string; value: string }>) => {
        const gap = 12;
        const cardWidth = (contentWidth - gap * (items.length - 1)) / items.length;
        const cardHeight = 74;
        ensureSpace(cardHeight + 18);
        items.forEach((item, index) => {
          const x = marginX + index * (cardWidth + gap);
          ctx.fillStyle = theme.accentSoft;
          ctx.strokeStyle = theme.border;
          ctx.lineWidth = 1;
          ctx.fillRect(x, y, cardWidth, cardHeight);
          ctx.strokeRect(x, y, cardWidth, cardHeight);
          ctx.fillStyle = theme.muted;
          ctx.font = `700 11px ${fontStack}`;
          ctx.fillText(item.label.toUpperCase(), x + 12, y + 22);
          ctx.fillStyle = theme.ink;
          ctx.font = `700 18px ${fontStack}`;
          const valueLines = wrapCanvasText(item.value, cardWidth - 24, ctx.font);
          valueLines.slice(0, 2).forEach((line, lineIndex) => {
            ctx.fillText(line, x + 12, y + 48 + lineIndex * 18);
          });
        });
        y += cardHeight + 18;
      };

      startPage();
      drawHeading(`${formatRenderableText(curriculum.subject || "Curriculum")} • ${formatRenderableText(curriculum.gradeLevel || "Grade")}`, "title");
      drawMetricCards([
        { label: "Subject", value: formatRenderableText(curriculum.subject || "N/A") },
        { label: "Grade", value: formatRenderableText(curriculum.gradeLevel || "N/A") },
        { label: "Units", value: String(allUnits.length) },
        { label: "Chapters", value: String(totalChapterCount) },
      ]);

      if (curriculum.overallDescription) {
        drawHeading("Overview", "section");
        drawParagraph(curriculum.overallDescription, { color: theme.muted });
      }

      if (Array.isArray(curriculum.coreObjectives) && curriculum.coreObjectives.length > 0) {
        drawHeading("Core Objectives", "section");
        drawBulletList(curriculum.coreObjectives);
      }

      exportClasses.forEach((cls, classIndex) => {
        drawHeading(exportClasses.length > 1 ? `Class ${classIndex + 1}: ${cls.className || curriculum.gradeLevel}` : `${cls.className || curriculum.gradeLevel}`, "section");
        if (cls.subject) {
          drawParagraph(`Subject: ${cls.subject}`, {
            font: `600 13px ${fontStack}`,
            color: theme.muted,
            lineHeight: 20,
            spacingAfter: 12,
          });
        }
        cls.units.forEach((unit) => {
          const unitTitle = [unit.unitId, unit.unitName].filter(Boolean).join(" • ") || "Unit";
          drawHeading(unitTitle, "unit");
          if (unit.description) {
            drawParagraph(unit.description, { color: theme.muted, spacingAfter: 8 });
          }
          if (unit.topics.length > 0) {
            drawParagraph("Topics", {
              font: `700 13px ${fontStack}`,
              lineHeight: 20,
              spacingAfter: 6,
            });
            drawBulletList(unit.topics, 8);
          }
          if (unit.subtopics.length > 0) {
            drawParagraph("Subtopics", {
              font: `700 13px ${fontStack}`,
              lineHeight: 20,
              spacingAfter: 6,
            });
            drawBulletList(unit.subtopics, 8);
          }
          if (unit.chapters.length > 0) {
            drawParagraph("Chapters", {
              font: `700 13px ${fontStack}`,
              lineHeight: 20,
              spacingAfter: 6,
            });
            unit.chapters.forEach((chapter) => {
              drawHeading(chapter.chapterName || "Chapter", "chapter");
              if (chapter.topics.length > 0) {
                drawBulletList(chapter.topics, 18);
              }
              if (chapter.subtopics.length > 0) {
                drawBulletList(chapter.subtopics, 36);
              }
            });
          }
          y += 10;
        });
      });

      if (allUnits.length === 0) {
        drawHeading("No Structured Data Available", "section");
        drawParagraph("The extracted curriculum does not currently include enough structured unit, chapter, topic, or subtopic data to render the export.");
      }

      pages.push(canvas);
      const renderedPages = pages.map((pageCanvas) => {
        const dataUrl = pageCanvas.toDataURL("image/jpeg", 0.92);
        return {
          bytes: imageDataUrlToJpegBytes(dataUrl),
          width: pageCanvas.width,
          height: pageCanvas.height,
        };
      });
      return buildImagePdfBlob(renderedPages);
    }

    const pageWidth = 612;
    const pageHeight = 792;
    const marginX = 42;
    const topY = 752;
    const bottomY = 42;
    const contentWidth = pageWidth - marginX * 2;
    const encoder = new TextEncoder();
    const pages: string[] = [];
    let currentPageOps: string[] = [];
    let currentY = topY;

    const color = {
      ink: "0.17 0.2 0.22",
      muted: "0.39 0.45 0.49",
      teal: "0.21 0.68 0.67",
      tealSoft: "0.9 0.96 0.96",
      peachSoft: "0.96 0.91 0.87",
      border: "0.82 0.86 0.88",
      white: "1 1 1",
      rowAlt: "0.98 0.99 0.99",
    };

    const estimateChars = (width: number, fontSize: number) => Math.max(6, Math.floor(width / (fontSize * 0.52)));
    const setFill = (rgb: string) => currentPageOps.push(`${rgb} rg`);
    const setStroke = (rgb: string) => currentPageOps.push(`${rgb} RG`);
    const drawRect = (x: number, y: number, width: number, height: number, fillRgb?: string, strokeRgb?: string) => {
      if (fillRgb) setFill(fillRgb);
      if (strokeRgb) setStroke(strokeRgb);
      currentPageOps.push(`${x} ${y} ${width} ${height} re ${fillRgb && strokeRgb ? "B" : fillRgb ? "f" : "S"}`);
    };
    const drawText = (text: string, x: number, y: number, size: number, font: "F1" | "F2" = "F1", rgb: string = color.ink) => {
      const normalized = escapePdfText(text);
      if (!normalized) return;
      setFill(rgb);
      currentPageOps.push("BT");
      currentPageOps.push(`/${font} ${size} Tf`);
      currentPageOps.push(`1 0 0 1 ${x} ${y} Tm`);
      currentPageOps.push(`(${normalized}) Tj`);
      currentPageOps.push("ET");
    };
    const wrapForWidth = (text: string, width: number, fontSize: number, maxLines?: number) => {
      const lines = wrapPdfTextLine(text, estimateChars(width, fontSize));
      return typeof maxLines === "number" ? lines.slice(0, maxLines) : lines;
    };
    const ensureSpace = (requiredHeight: number) => {
      if (currentY - requiredHeight >= bottomY) return;
      if (currentPageOps.length) {
        pages.push(currentPageOps.join("\n"));
      }
      currentPageOps = [];
      currentY = topY;
    };
    const drawParagraph = (text: string, options?: { font?: "F1" | "F2"; size?: number; color?: string; gapAfter?: number; maxWidth?: number }) => {
      const font = options?.font || "F1";
      const size = options?.size || 10.5;
      const gapAfter = options?.gapAfter ?? 8;
      const maxWidth = options?.maxWidth || contentWidth;
      const lines = wrapForWidth(formatRenderableText(text), maxWidth, size);
      ensureSpace(lines.length * (size + 3) + gapAfter);
      lines.forEach((line) => {
        drawText(line, marginX, currentY, size, font, options?.color || color.ink);
        currentY -= size + 3;
      });
      currentY -= gapAfter;
    };
    const drawBulletList = (items: string[], accentRgb: string) => {
      items.forEach((item) => {
        const lines = wrapForWidth(formatRenderableText(item), contentWidth - 18, 10.5);
        ensureSpace(lines.length * 14 + 2);
        drawText("•", marginX, currentY, 12, "F2", accentRgb);
        lines.forEach((line, index) => {
          drawText(line, marginX + 14, currentY - index * 14, 10.5, "F1", color.ink);
        });
        currentY -= lines.length * 14 + 2;
      });
      currentY -= 6;
    };
    const drawSectionTitle = (title: string) => {
      ensureSpace(30);
      drawText(title, marginX, currentY, 14, "F2", color.ink);
      currentY -= 10;
      drawRect(marginX, currentY, 90, 2, color.teal);
      currentY -= 14;
    };
    const drawMetricCardRow = (items: Array<{ label: string; value: string }>) => {
      const gap = 10;
      const cardWidth = (contentWidth - gap * (items.length - 1)) / items.length;
      const cardHeight = 52;
      ensureSpace(cardHeight + 12);
      items.forEach((item, index) => {
        const x = marginX + index * (cardWidth + gap);
        drawRect(x, currentY - cardHeight, cardWidth, cardHeight, color.tealSoft, color.border);
        drawText(item.label.toUpperCase(), x + 10, currentY - 16, 8.5, "F2", color.muted);
        drawText(item.value, x + 10, currentY - 36, 15, "F2", color.ink);
      });
      currentY -= cardHeight + 14;
    };
    const fitColumnWidths = (widths: number[]) => {
      const availableWidth = contentWidth;
      const totalWidth = widths.reduce((sum, width) => sum + width, 0);
      if (totalWidth <= availableWidth) return widths;
      const scale = availableWidth / totalWidth;
      return widths.map((width) => Math.max(56, Math.floor(width * scale)));
    };
    const drawTable = (title: string, headers: string[], rows: string[][], columnWidths: number[]) => {
      if (!rows.length) return;
      drawSectionTitle(title);
      const startX = marginX;
      const headerHeight = 24;
      const cellPadding = 6;
      const bodyFontSize = 9;
      const headerFontSize = 9;
      const fittedColumnWidths = fitColumnWidths(columnWidths);

      const drawHeader = () => {
        ensureSpace(headerHeight + 8);
        let x = startX;
        headers.forEach((header, index) => {
          drawRect(x, currentY - headerHeight, fittedColumnWidths[index], headerHeight, color.teal, color.white);
          drawText(header, x + cellPadding, currentY - 16, headerFontSize, "F2", color.white);
          x += fittedColumnWidths[index];
        });
        currentY -= headerHeight;
      };

      drawHeader();

      rows.forEach((row, rowIndex) => {
        const wrappedCells = row.map((cell, index) =>
          wrapForWidth(formatRenderableText(cell || "-"), fittedColumnWidths[index] - cellPadding * 2, bodyFontSize, 4)
        );
        const rowHeight = Math.max(...wrappedCells.map((lines) => lines.length), 1) * 12 + 10;
        if (currentY - rowHeight < bottomY) {
          if (currentPageOps.length) {
            pages.push(currentPageOps.join("\n"));
          }
          currentPageOps = [];
          currentY = topY;
          drawHeader();
        }

        let x = startX;
        wrappedCells.forEach((lines, index) => {
          drawRect(x, currentY - rowHeight, fittedColumnWidths[index], rowHeight, rowIndex % 2 === 0 ? color.white : color.rowAlt, color.border);
          lines.forEach((line, lineIndex) => {
            drawText(line, x + cellPadding, currentY - 14 - lineIndex * 12, bodyFontSize, "F1", color.ink);
          });
          x += fittedColumnWidths[index];
        });
        currentY -= rowHeight;
      });

      currentY -= 16;
    };

    drawRect(0, pageHeight - 92, pageWidth, 92, color.teal);
    drawText(formatRenderableText(curriculum.subject || "Curriculum"), marginX, pageHeight - 42, 22, "F2", color.white);
    drawText(`Extracted Curriculum Report • ${formatRenderableText(curriculum.gradeLevel || "Grade")}`, marginX, pageHeight - 64, 11, "F1", color.white);
    currentY = pageHeight - 118;

    drawMetricCardRow([
      { label: "Subject", value: formatRenderableText(curriculum.subject || "N/A") },
      { label: "Grade", value: formatRenderableText(curriculum.gradeLevel || "N/A") },
      { label: "Units", value: String(allUnits.length) },
      { label: "Chapters", value: String(totalChapterCount || 0) },
    ]);

    if (curriculum.overallDescription) {
      drawSectionTitle("Overview");
      drawParagraph(curriculum.overallDescription, { size: 10.5, color: color.muted });
    }

    if (Array.isArray(curriculum.coreObjectives) && curriculum.coreObjectives.length > 0) {
      drawSectionTitle("Core Objectives");
      drawBulletList(curriculum.coreObjectives, color.teal);
    }

    const unitsOverviewRows = allUnits.map((unit) => ({
      unitId: unit.unitId,
      unitName: unit.unitName,
      description: unit.description,
      topics: unit.topics.join("; "),
      subtopics: unit.subtopics.join("; "),
    }));

    const unitsOverviewColumns = [
      { key: "unitId", label: "Unit ID", width: 72 },
      { key: "unitName", label: "Unit Name", width: 130 },
      { key: "description", label: "Description", width: 180 },
      { key: "topics", label: "Topics", width: 140 },
      { key: "subtopics", label: "Subtopics", width: 140 },
    ].filter((column) => unitsOverviewRows.some((row) => isMeaningfulValue(row[column.key as keyof typeof row])));

    if (unitsOverviewColumns.length > 0 && unitsOverviewRows.length > 0) {
      drawTable(
        "Units Overview",
        unitsOverviewColumns.map((column) => column.label),
        unitsOverviewRows.map((row) => unitsOverviewColumns.map((column) => row[column.key as keyof typeof row] || "")),
        unitsOverviewColumns.map((column) => column.width)
      );
    }

    exportClasses.forEach((cls, classIndex) => {
      const structuredUnitRows = cls.units.map((unit) => ({
        className: cls.className,
        subject: cls.subject,
        unitName: unit.unitName,
        chapterCount: String(unit.chapters.length),
        topics: unit.topics.join("; "),
        subtopics: unit.subtopics.join("; "),
      }));

      const structuredUnitColumns = [
        { key: "className", label: "Class", width: 84 },
        { key: "subject", label: "Subject", width: 92 },
        { key: "unitName", label: "Unit", width: 138 },
        { key: "chapterCount", label: "Chapters", width: 62 },
        { key: "topics", label: "Topics", width: 148 },
        { key: "subtopics", label: "Subtopics", width: 148 },
      ].filter((column) => structuredUnitRows.some((row) => isMeaningfulValue(row[column.key as keyof typeof row])));

      if (structuredUnitRows.length > 0 && structuredUnitColumns.length > 0) {
        drawTable(
          `Structured Units${exportClasses.length > 1 ? ` - Class ${classIndex + 1}` : ""}`,
          structuredUnitColumns.map((column) => column.label),
          structuredUnitRows.map((row) => structuredUnitColumns.map((column) => row[column.key as keyof typeof row] || "")),
          structuredUnitColumns.map((column) => column.width)
        );
      }

      const chapterRows = cls.units.flatMap((unit) =>
        unit.chapters.map((chapter) => ({
          unitName: unit.unitName,
          chapterName: chapter.chapterName,
          topics: chapter.topics.join("; "),
          subtopics: chapter.subtopics.join("; "),
        }))
      );

      const chapterColumns = [
        { key: "unitName", label: "Unit", width: 138 },
        { key: "chapterName", label: "Chapter", width: 160 },
        { key: "topics", label: "Topics", width: 120 },
        { key: "subtopics", label: "Subtopics", width: 120 },
      ].filter((column) => chapterRows.some((row) => isMeaningfulValue(row[column.key as keyof typeof row])));

      if (chapterRows.length > 0 && chapterColumns.length > 0) {
        drawTable(
          `Chapters${exportClasses.length > 1 ? ` - Class ${classIndex + 1}` : ""}`,
          chapterColumns.map((column) => column.label),
          chapterRows.map((row) => chapterColumns.map((column) => row[column.key as keyof typeof row] || "")),
          chapterColumns.map((column) => column.width)
        );
      }

      const topicSubtopicRows = cls.units.flatMap((unit) => {
        const chapterRowsForUnit = unit.chapters.flatMap((chapter) => {
          if (chapter.topics.length > 0) {
            return chapter.topics.map((topic) => ({
              unitName: unit.unitName,
              chapterName: chapter.chapterName,
              topic,
              subtopic: "",
            })).concat(
              chapter.subtopics.map((subtopic) => ({
                unitName: unit.unitName,
                chapterName: chapter.chapterName,
                topic: "",
                subtopic,
              }))
            );
          }

          if (chapter.subtopics.length > 0) {
            return chapter.subtopics.map((subtopic) => ({
              unitName: unit.unitName,
              chapterName: chapter.chapterName,
              topic: "",
              subtopic,
            }));
          }

          return [];
        });

        if (chapterRowsForUnit.length > 0) {
          return chapterRowsForUnit;
        }

        if (unit.topics.length > 0 || unit.subtopics.length > 0) {
          return unit.topics.map((topic) => ({
            unitName: unit.unitName,
            chapterName: "",
            topic,
            subtopic: "",
          })).concat(
            unit.subtopics.map((subtopic) => ({
              unitName: unit.unitName,
              chapterName: "",
              topic: "",
              subtopic,
            }))
          );
        }

        return [];
      });

      const detailColumns = [
        { key: "unitName", label: "Unit", width: 150 },
        { key: "chapterName", label: "Chapter", width: 160 },
        { key: "topic", label: "Topic", width: 110 },
        { key: "subtopic", label: "Subtopic", width: 110 },
      ].filter((column) => topicSubtopicRows.some((row) => isMeaningfulValue(row[column.key as keyof typeof row])));

      if (topicSubtopicRows.length > 0 && detailColumns.length > 0) {
        drawSectionTitle(`Topic And Subtopic Details${exportClasses.length > 1 ? ` - Class ${classIndex + 1}` : ""}`);
        drawParagraph(
          topicSubtopicRows.some((row) => isMeaningfulValue(row.topic))
            ? "Showing the deepest non-empty topic and subtopic mapping available from the extracted hierarchy."
            : "Topics are not available in this extraction, so only meaningful subtopic rows are shown.",
          { size: 9.5, color: color.muted, gapAfter: 10 }
        );
        drawTable(
          "",
          detailColumns.map((column) => column.label),
          topicSubtopicRows.map((row) => detailColumns.map((column) => row[column.key as keyof typeof row] || "")),
          detailColumns.map((column) => column.width)
        );
      }
    });

    if (allUnits.length === 0) {
      drawSectionTitle("No Structured Data Available");
      drawParagraph(
        "The extracted curriculum does not currently include enough structured unit, chapter, topic, or subtopic data to render tables in the PDF.",
        { size: 10.5, color: color.muted }
      );
    }

    if (currentPageOps.length) {
      pages.push(currentPageOps.join("\n"));
    }

    const objects: string[] = [];
    const addObject = (value: string) => {
      objects.push(value);
      return objects.length;
    };
    const catalogObjectNumber = addObject("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesObjectNumber = addObject("");
    const fontObjectNumber = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const boldFontObjectNumber = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    const pageObjectNumbers: number[] = [];

    pages.forEach((pageContent) => {
      const contentObjectNumber = addObject(`<< /Length ${encoder.encode(pageContent).length} >>\nstream\n${pageContent}\nendstream`);
      const pageObjectNumber = addObject(
        `<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R /F2 ${boldFontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
      );
      pageObjectNumbers.push(pageObjectNumber);
    });

    objects[pagesObjectNumber - 1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [0];
    objects.forEach((objectValue, index) => {
      offsets.push(encoder.encode(pdf).length);
      pdf += `${index + 1} 0 obj\n${objectValue}\nendobj\n`;
    });
    const xrefOffset = encoder.encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectNumber} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
  };

  const handleDownloadCurriculumPdf = async () => {
    if (!extractedData) {
      setErrorHeader("Extract a curriculum first before downloading the curriculum PDF.");
      return;
    }

    const subjectLabel = extractedData.subject || "curriculum";
    const gradeLabel = extractedData.gradeLevel || "grade";
    const fileNameBase = [slugifyFileNamePart(subjectLabel), slugifyFileNamePart(gradeLabel), "extracted-curriculum-table"].join("-");
    const pdfBlob = await buildCurriculumPdfBlob(extractedData);
    triggerBlobDownload(pdfBlob, `${fileNameBase}.pdf`);
  };

  const buildAssessmentSectionGroups = (assessment: SessionPlan["assessment"] | undefined) => {
    if (!assessment) return [];

    const rawSections = Array.isArray(assessment.paper?.sections) ? assessment.paper.sections : [];
    const rawQuestions = Array.isArray(assessment.paper?.questions) ? assessment.paper.questions : [];
    const answerKeyItems = Array.isArray(assessment.evaluation?.answerKey?.items) ? assessment.evaluation.answerKey.items : [];
    const rubricItems = Array.isArray(assessment.evaluation?.rubrics?.items) ? assessment.evaluation.rubrics.items : [];
    const markingSchemeItems = Array.isArray(assessment.evaluation?.markingScheme?.items) ? assessment.evaluation.markingScheme.items : [];
    const groupsById = new Map<string, any>();
    const orderedGroups: any[] = [];

    const ensureGroup = (sectionId?: string, sectionTitle?: any) => {
      const rawTitle = formatRenderableText(sectionTitle || rawSections[0]?.title || "Assessment") || "Assessment";
      const rawId = String(sectionId || "").trim() || `section-${orderedGroups.length + 1}`;
      if (!groupsById.has(rawId)) {
        const matchingRawSection = rawSections.find((section: any) =>
          String(section?.id || "").trim() === rawId ||
          formatRenderableText(section?.title || "") === rawTitle
        );
        const group = {
          id: rawId,
          title: rawTitle,
          source: matchingRawSection?.source,
          marks: matchingRawSection?.marks,
          questionCount: matchingRawSection?.questionCount,
          questionRefs: Array.isArray(matchingRawSection?.questionRefs) ? matchingRawSection.questionRefs : [],
          entries: [] as any[],
        };
        groupsById.set(rawId, group);
        orderedGroups.push(group);
      }
      return groupsById.get(rawId);
    };

    rawSections.forEach((section: any, index: number) => {
      ensureGroup(String(section?.id || "").trim() || `section-${index + 1}`, section?.title || `Section ${index + 1}`);
    });

    rawQuestions.forEach((item: any, index: number) => {
      const answerItem = item?.id
        ? answerKeyItems.find((candidate: any) => candidate?.questionId === item.id)
        : answerKeyItems[index];
      const rubricItem = item?.id
        ? rubricItems.find((candidate: any) => candidate?.questionId === item.id)
        : rubricItems[index];
      const markingSchemeItem = item?.id
        ? markingSchemeItems.find((candidate: any) => candidate?.questionId === item.id)
        : markingSchemeItems[index];
        const group = ensureGroup(
          item?.sectionId || answerItem?.sectionId,
          item?.sectionTitle || answerItem?.sectionTitle
        );
      group.entries.push({
        kind: item?.type || "question",
        question: item,
        answerKey: answerItem,
        rubric: rubricItem,
        markingScheme: markingSchemeItem,
        questionNumber: Number(item?.questionNumber || index + 1),
      });
    });

    return orderedGroups
      .filter((group) => group.entries.length > 0)
      .map((group) => ({
        ...group,
        marks: group.entries.reduce((sum: number, entry: any) => sum + Number(entry.question?.marks || 0), 0) || group.marks || 0,
        questionCount: group.entries.length,
        questionRefs: group.entries.map((entry: any) => entry.question?.id || `q${entry.questionNumber}`),
      }));
  };

  const buildAssessmentQuestionPaperText = (session: SessionPlan) => {
    const assessment = session.assessment;
    if (!assessment) return "";
    const sectionGroups = buildAssessmentSectionGroups(assessment);

    const lines: string[] = [
      `${formatRenderableText(session.title)}`,
      `Session ${session.sessionNumber} Assessment`,
      `Duration: ${formatRenderableText(assessment.meta?.durationMinutes ?? session.duration)} minutes`,
      `Total Marks: ${formatRenderableText(assessment.meta?.totalMarks ?? "")}`,
      "",
    ];

    if (Array.isArray(assessment.paper?.instructions) && assessment.paper.instructions.length > 0) {
      lines.push("Instructions:");
      assessment.paper.instructions.forEach((item, idx) => lines.push(`${idx + 1}. ${formatRenderableText(item)}`));
      lines.push("");
    }

    sectionGroups.forEach((group: any) => {
      lines.push(`${group.title} (${group.marks} marks)`);
      lines.push("");
      group.entries.forEach((entry: any) => {
        const subtype = formatAssessmentSubtypeLabel(entry.question?.subtype);
        lines.push(
          `Question ${entry.questionNumber} (Q${entry.questionNumber}). ${formatRenderableText(entry.question?.prompt)} (${entry.question?.marks || 0} marks)${subtype ? ` [${subtype}]` : ""}`
        );
        if (entry.question?.type === "mcq") {
          (entry.question?.options || []).forEach((option: any) => lines.push(`- ${formatRenderableText(option)}`));
        }
        lines.push("");
      });
    });

    return lines.join("\n");
  };

  const buildAssessmentAnswerKeyText = (session: SessionPlan) => {
    const assessment = session.assessment;
    if (!assessment?.evaluation?.answerKey?.items?.length) return "";
    const sectionGroups = buildAssessmentSectionGroups(assessment);

    const lines: string[] = [
      `${formatRenderableText(session.title)}`,
      `Session ${session.sessionNumber} Answer Key`,
      "",
    ];

    sectionGroups.forEach((group: any) => {
      lines.push(group.title);
      lines.push("");
      group.entries.forEach((entry: any) => {
        const answerItem = entry.answerKey;
        const subtype = formatAssessmentSubtypeLabel(answerItem?.subtype || entry.question?.subtype);
        lines.push(
          `Question ${entry.questionNumber} (Q${entry.questionNumber})${subtype ? ` [${subtype}]` : ""}: ${formatRenderableText(answerItem?.answer || "Answer not provided")}`
        );
        if (answerItem?.explanation) lines.push(`Explanation: ${formatRenderableText(answerItem.explanation)}`);
        if (answerItem?.marks != null) lines.push(`Marks: ${formatRenderableText(answerItem.marks)}`);
        lines.push("");
      });
    });

    return lines.join("\n");
  };

  const buildAssessmentRubricsText = (session: SessionPlan) => {
    const assessment = session.assessment;
    if (!assessment?.evaluation) return "";
    const sectionGroups = buildAssessmentSectionGroups(assessment);

    const lines: string[] = [
      `${formatRenderableText(session.title)}`,
      `Session ${session.sessionNumber} Rubrics`,
      "",
    ];

    sectionGroups.forEach((group: any) => {
      const rubricEntries = group.entries.filter((entry: any) => entry.question?.type !== "mcq");
      if (!rubricEntries.length) return;
      lines.push(group.title);
      lines.push("");
      rubricEntries.forEach((entry: any) => {
        const rubricItem = entry.rubric;
        const markingSchemeItem = entry.markingScheme;
        const subtype = formatAssessmentSubtypeLabel(entry.question?.subtype);
        lines.push(`Question ${entry.questionNumber} (Q${entry.questionNumber})${subtype ? ` [${subtype}]` : ""}`);
        if (Array.isArray(rubricItem?.criteria) && rubricItem.criteria.length > 0) {
          rubricItem.criteria.forEach((criterion: any, rubricIdx: number) => {
            const marksLabel = criterion?.marks != null ? ` (${formatRenderableText(criterion.marks)} marks)` : "";
            lines.push(`${rubricIdx + 1}. ${formatRenderableText(criterion?.criterion || "")}${marksLabel}`);
          });
        } else {
          lines.push("No rubric provided.");
        }
        if (Array.isArray(markingSchemeItem?.awardGuidance) && markingSchemeItem.awardGuidance.length > 0) {
          lines.push("Award Guidance:");
          markingSchemeItem.awardGuidance.forEach((guidance: any, guidanceIdx: number) => {
            lines.push(`${guidanceIdx + 1}. ${formatRenderableText(guidance)}`);
          });
        }
        lines.push("");
      });
    });

    if (Array.isArray(assessment.evaluation.generalInstructions) && assessment.evaluation.generalInstructions.length > 0) {
      lines.push("General Marking Guidance");
      assessment.evaluation.generalInstructions.forEach((item, idx) => lines.push(`${idx + 1}. ${formatRenderableText(item)}`));
      lines.push("");
    }

    if (Array.isArray(assessment.evaluation.evaluatorInstructions) && assessment.evaluation.evaluatorInstructions.length > 0) {
      lines.push("Evaluator Instructions");
      assessment.evaluation.evaluatorInstructions.forEach((item, idx) => lines.push(`${idx + 1}. ${formatRenderableText(item)}`));
      lines.push("");
    }

    return lines.join("\n");
  };

  const handleDownloadAssessmentQuestionPaper = (session: SessionPlan) => {
    if (!session.assessment) {
      setErrorHeader("Generate the assessment first before downloading the question paper.");
      return;
    }
    const text = buildAssessmentQuestionPaperText(session);
    triggerBlobDownload(buildSimplePdfBlob(`${session.title} Question Paper`, text), `${buildAssessmentExportBaseName(session)}-question-paper.pdf`);
  };

  const handleDownloadAssessmentAnswerKey = (session: SessionPlan) => {
    if (!session.assessment?.evaluation?.answerKey?.items?.length) {
      setErrorHeader("Generate the assessment first before downloading the answer key.");
      return;
    }
    const text = buildAssessmentAnswerKeyText(session);
    triggerBlobDownload(buildSimplePdfBlob(`${session.title} Answer Key`, text), `${buildAssessmentExportBaseName(session)}-answer-key.pdf`);
  };

  const handleDownloadAssessmentRubrics = (session: SessionPlan) => {
    if (!session.assessment?.evaluation) {
      setErrorHeader("Generate the assessment first before downloading the rubrics.");
      return;
    }
    const text = buildAssessmentRubricsText(session);
    triggerBlobDownload(buildSimplePdfBlob(`${session.title} Rubrics`, text), `${buildAssessmentExportBaseName(session)}-rubrics.pdf`);
  };

  const handleDownloadAssessmentJson = (session: SessionPlan) => {
    if (!session.assessment) {
      setErrorHeader("Generate the assessment first before downloading the assessment JSON.");
      return;
    }
    const payload = {
      sessionNumber: session.sessionNumber,
      title: session.title,
      duration: session.duration,
      assessment: session.assessment,
    };
    triggerDownload(JSON.stringify(payload, null, 2), `${buildAssessmentExportBaseName(session)}-assessment-bundle.json`, "application/json;charset=utf-8");
  };

  const handleDownloadTeacherNotesPdf = async (session: SessionPlan) => {
    if (!session.teacherLessonNotes) {
      setErrorHeader("Generate the teacher notes first before downloading the teacher notes PDF.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Rendering professional teacher notes PDF...");

    try {
      const pdfBlob = await buildProfessionalNotesPdfBlob(session, "teacher");
      triggerBlobDownload(pdfBlob, `${buildSessionExportBaseName(session)}-teacher-notes.pdf`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to build the teacher notes PDF.";
      setErrorHeader(message);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleDownloadStudentNotesPdf = async (session: SessionPlan) => {
    if (!session.studentLessonNotes) {
      setErrorHeader("Generate the student notes first before downloading the student notes PDF.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Rendering Cornell-style student notes PDF with visuals...");

    try {
      const pdfBlob = await buildStudentCornellNotesPdfBlob(session);
      triggerBlobDownload(pdfBlob, `${buildSessionExportBaseName(session)}-student-notes.pdf`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to build the student notes PDF.";
      setErrorHeader(message);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleExportAllGeneratedDocuments = () => {
    if (!selectedTermRow) {
      setErrorHeader("Select a term before exporting the generated document bundle.");
      return;
    }

    const generatedSessionPlans = sessionsOutline.map((outlineItem) => {
      const generated = generatedSessions[outlineItem.sessionNumber];
      return {
        sessionNumber: outlineItem.sessionNumber,
        title: outlineItem.title,
        chapterName: outlineItem.chapterName || null,
        duration: outlineItem.duration,
        status: generated ? "generated" : "outline-only",
        content: generated || null,
      };
    });

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      curriculum: extractedData,
      workspace: activeWorkspace
        ? {
            id: activeWorkspace._id,
            phase: activeWorkspace.phase,
            status: activeWorkspace.status,
            curriculumApproval: activeWorkspace.curriculumApproval,
            academicConfig: activeWorkspace.academicConfig,
            generatedArtifacts: activeWorkspace.generatedArtifacts,
          }
        : null,
      selectedTerm: {
        className: selectedTermRow.className || null,
        term: selectedTermRow.term,
        termNumber: selectedTermRow.termNumber ?? null,
        chapters: selectedTermRow.chapters,
        marks: selectedTermRow.marks,
      },
      termPlan: activeWorkspace?.termPlan || {
        approved: coursePlanApproved,
        recommendedTermCount: preferredTermCount,
        recommendations: recommendedTermAllocations,
        allocations: savedTermAllocations,
      },
      sessionPlan: {
        approved: sessionPlanApproved,
        defaults: sessionPlanningDefaultsDraft,
        availableTabs: sessionTabDefinitions.map((tab) => tab.id),
        roadmap: sessionsOutline,
        allocations: savedSessionAllocations,
      },
      generatedSessionPlans,
    };

    const prettyJson = JSON.stringify(exportPayload, null, 2);
    const subjectLabel = extractedData?.subject || "curriculum";
    const gradeLabel = extractedData?.gradeLevel || "grade";
    const termLabel = selectedTermRow.term || "term";
    const fileStem = `${slugifyFileNamePart(subjectLabel)}-${slugifyFileNamePart(gradeLabel)}-${slugifyFileNamePart(termLabel)}-session-bundle`;
    const htmlDocument = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subjectLabel)} ${escapeHtml(termLabel)} Export Bundle</title>
    <style>
      body { margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; font-family: Inter, Arial, sans-serif; }
      .wrap { max-width: 1100px; margin: 0 auto; }
      .hero { background: linear-gradient(135deg, #36ADAA, #586A71); color: white; padding: 28px; border-radius: 24px; }
      .hero h1 { margin: 0 0 8px; font-size: 30px; font-family: Outfit, Inter, Arial, sans-serif; }
      .hero p { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.88); }
      .card { margin-top: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05); }
      .card h2 { margin: 0 0 12px; font-size: 18px; font-family: Outfit, Inter, Arial, sans-serif; }
      .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 16px; }
      .meta div { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.14); border-radius: 16px; padding: 12px; }
      .meta-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.75; }
      .meta-value { margin-top: 6px; font-size: 14px; font-weight: 700; }
      .badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
      .badge { border-radius: 999px; padding: 6px 10px; background: #dbeafe; color: #1e3a8a; font-size: 12px; font-weight: 700; }
      .session { margin-top: 14px; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; background: #fcfdff; }
      .session h3 { margin: 0 0 6px; font-size: 15px; }
      pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.6; background: #0f172a; color: #e2e8f0; border-radius: 16px; padding: 16px; overflow: auto; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>Lesson Plan Export Bundle</h1>
        <p>Combined export for curriculum extraction, term plan, session plan, and generated session content.</p>
        <div class="meta">
          <div><div class="meta-label">Subject</div><div class="meta-value">${escapeHtml(subjectLabel)}</div></div>
          <div><div class="meta-label">Grade</div><div class="meta-value">${escapeHtml(gradeLabel)}</div></div>
          <div><div class="meta-label">Term</div><div class="meta-value">${escapeHtml(termLabel)}</div></div>
          <div><div class="meta-label">Exported At</div><div class="meta-value">${escapeHtml(new Date().toLocaleString())}</div></div>
        </div>
      </section>
      <section class="card">
        <h2>Export Summary</h2>
        <div class="badge-row">
          <span class="badge">Curriculum extraction</span>
          <span class="badge">Term plan</span>
          <span class="badge">Session plan</span>
          <span class="badge">${escapeHtml(String(generatedSessionPlans.filter((item) => item.content).length))} generated session packs</span>
        </div>
      </section>
      <section class="card">
        <h2>Session Coverage</h2>
        ${generatedSessionPlans.map((item) => `
          <div class="session">
            <h3>Session ${escapeHtml(item.sessionNumber)}: ${escapeHtml(item.title)}</h3>
            <div>Status: ${escapeHtml(item.status)}</div>
            <div>Duration: ${escapeHtml(item.duration)} minutes</div>
            <div>Chapter: ${escapeHtml(item.chapterName || "Not specified")}</div>
          </div>
        `).join("")}
      </section>
      <section class="card">
        <h2>Full Data Export</h2>
        <pre>${escapeHtml(prettyJson)}</pre>
      </section>
    </div>
  </body>
</html>`;

    triggerDownload(htmlDocument, `${fileStem}.html`, "text/html;charset=utf-8");
  };

  const handleExportPptSlidesPdf = async (session: SessionPlan) => {
    const ppt = session.materials?.ppt;
    const slides = getPptSlides(ppt);
    if (!ppt || slides.length === 0) {
      setErrorHeader("Generate PPT slides first before exporting a slide-only PDF.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Preparing visuals and exporting slides PDF...");

    try {
      const enrichedSession = await ensureSlideVisuals(session);
      const enrichedPpt = enrichedSession.materials?.ppt;
      const enrichedSlides = getPptSlides(enrichedPpt);

      const slidesMarkup = enrichedSlides.map((slide, index) => {
        const accent = getPptAccentStyle(index);
        const primaryAsset = getPrimaryPptAsset(slide);
        const onSlideTags = (slide.onSlideText || [])
          .slice(0, 3)
          .map((item) => `<span class="tag ${accent.exportTagClass}">${renderRichValueToExportHtml(item)}</span>`)
          .join("");
        const bullets = (slide.bulletPoints || [])
          .slice(0, 5)
          .map((item) => `<li>${renderRichValueToExportHtml(item)}</li>`)
          .join("");
        const visualSrc = primaryAsset?.imageDataUrl || primaryAsset?.previewUrl || primaryAsset?.sourceUrl || "";
        const visualMarkup = visualSrc
          ? `<img src="${escapeHtml(visualSrc)}" alt="${escapeHtml(primaryAsset?.altText || primaryAsset?.purpose || "Slide visual")}" />`
          : slide.svgDiagram?.svgCode?.trim().startsWith("<svg")
          ? `<div class="svg-wrap">${slide.svgDiagram.svgCode}</div>`
          : `
            <div class="visual-fallback">
              <div class="visual-chip">${renderRichValueToExportHtml(slide.svgDiagram?.title || "Planned Visual")}</div>
              <p>${renderRichValueToExportHtml(slide.visualPlan || "Visual will be finalized during export.")}</p>
            </div>
          `;

        return `
          <section class="slide-page">
            <div class="slide-shell">
              <div class="slide-bar ${accent.exportBarClass}"></div>
              <div class="slide-grid">
                <div class="slide-copy">
                  <div class="deck-label">${renderRichValueToExportHtml(getPptTitle(enrichedPpt))}</div>
                  <h1>${renderRichValueToExportHtml(slide.slideTitle || `Slide ${index + 1}`)}</h1>
                  ${onSlideTags ? `<div class="tag-row">${onSlideTags}</div>` : ""}
                  ${bullets ? `<ul class="bullet-list">${bullets}</ul>` : ""}
                  <div class="slide-footer">
                    ${slide.studentTakeaway ? `<div class="info-card"><div class="info-label">Takeaway</div><div>${renderRichValueToExportHtml(slide.studentTakeaway)}</div></div>` : ""}
                    ${slide.timeEstimateMinutes != null ? `<div class="info-card"><div class="info-label">Timing</div><div>${escapeHtml(slide.timeEstimateMinutes)} minutes</div></div>` : ""}
                  </div>
                </div>
                <div class="slide-visual">
                  <div class="visual-label">Visual Panel</div>
                  <div class="visual-frame">${visualMarkup}</div>
                </div>
              </div>
            </div>
          </section>
        `;
      }).join("");

      const exportWindow = window.open("", "_blank", "width=1440,height=960");
      if (!exportWindow) {
        setErrorHeader("The PDF export window was blocked. Allow pop-ups and try again.");
        return;
      }

      const docTitle = escapeHtml(getPptTitle(enrichedPpt));
      exportWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${docTitle} - Slides PDF</title>
    <style>
      @page { size: landscape; margin: 10mm; }
      ${katexStyles}
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #eef4f7; color: #0f172a; font-family: Inter, Arial, sans-serif; }
      body { padding: 18px; }
      .slide-page { page-break-after: always; break-after: page; margin: 0 0 18px; }
      .slide-page:last-child { page-break-after: auto; break-after: auto; }
      .slide-shell {
        width: 100%;
        aspect-ratio: 16 / 9;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      }
      .slide-bar { height: 16px; }
      .bar-teal { background: #36ADAA; }
      .bar-blue { background: #1EABDA; }
      .bar-purple { background: #7F64EA; }
      .bar-orange { background: #DE8431; }
      .bar-green { background: #3CC583; }
      .slide-grid { display: grid; grid-template-columns: 3fr 2fr; height: calc(100% - 16px); }
      .slide-copy { padding: 34px 38px; display: flex; flex-direction: column; }
      .deck-label { font-size: 11px; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; color: #94a3b8; }
      h1 { margin: 10px 0 0; font-size: 34px; line-height: 1.15; font-weight: 900; font-family: Outfit, Inter, Arial, sans-serif; color: #0f172a; }
      .tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 10px; }
      .tag { display: inline-flex; padding: 7px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #e2e8f0; color: #334155; }
      .bullet-list { margin: 16px 0 0 0; padding-left: 20px; }
      .bullet-list li { margin: 0 0 10px; font-size: 18px; line-height: 1.55; color: #334155; }
      .slide-footer { margin-top: auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding-top: 18px; }
      .info-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 18px; padding: 14px; font-size: 13px; line-height: 1.5; color: #475569; }
      .info-label { font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
      .slide-visual { border-left: 1px solid #e2e8f0; background: rgba(248, 250, 252, 0.9); padding: 24px; display: flex; flex-direction: column; }
      .visual-label { font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #94a3b8; }
      .visual-frame { margin-top: 12px; flex: 1; border: 1px solid #e2e8f0; border-radius: 22px; background: #ffffff; overflow: hidden; display: flex; align-items: center; justify-content: center; }
      .visual-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .svg-wrap { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 16px; }
      .svg-wrap svg { width: 100%; height: 100%; max-width: 100%; max-height: 100%; }
      .visual-fallback { padding: 18px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; width: 100%; }
      .visual-chip { display: inline-flex; align-self: flex-start; padding: 7px 12px; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: 11px; font-weight: 700; }
      .visual-fallback p { margin: 16px 0 0; font-size: 14px; line-height: 1.6; color: #475569; }
      .tag-teal { background: rgba(54, 173, 170, 0.12); color: #1f8d8a; }
      .tag-blue { background: rgba(30, 171, 218, 0.12); color: #0f7aa0; }
      .tag-purple { background: rgba(127, 100, 234, 0.12); color: #4b3ab5; }
      .tag-orange { background: rgba(222, 132, 49, 0.12); color: #b55f1a; }
      .tag-green { background: rgba(60, 197, 131, 0.12); color: #1a8a55; }
    </style>
  </head>
  <body>
    ${slidesMarkup}
  </body>
</html>`);

      exportWindow.document.close();
    } catch (error: any) {
      setErrorHeader(error?.message || "Failed to export slides PDF.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleExportPptx = async (session: SessionPlan) => {
    const ppt = session.materials?.ppt;
    if (!ppt || getPptSlides(ppt).length === 0) {
      setErrorHeader("Generate PPT slides first before exporting the editable PPTX.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Preparing visuals and building PowerPoint deck...");

    try {
      const enrichedSession = await ensureSlideVisuals(session);
      const enrichedPpt = enrichedSession.materials?.ppt;

      const response = await fetch("/api/export-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ppt: enrichedPpt,
          sessionTitle: enrichedSession.title,
          sessionNumber: enrichedSession.sessionNumber,
          subject: academicConfigDraft.subject,
          gradeLevel: academicConfigDraft.className,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorFromResponse(response, "Failed to export PPTX."));
      }

      const blob = await response.blob();
      triggerBlobDownload(blob, `${buildSessionExportBaseName(enrichedSession)}-slides.pptx`);
    } catch (error: any) {
      setErrorHeader(error?.message || "Failed to export PPTX.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const ensureSlideVisuals = async (session: SessionPlan): Promise<SessionPlan> => {
    const slides = session.materials?.ppt?.slides;
    if (!slides || slides.length === 0) return session;

    const visualSlides = slides.filter((slide) => slide.visualAttribution?.visualPlan || slide.visualAttribution?.svgDiagram?.search);
    if (visualSlides.length === 0) return session;

    const allVisualSlidesResolved = visualSlides.every((slide) => {
      const primaryAsset = Array.isArray(slide.assets) ? slide.assets[0] : null;
      return Boolean(
        slide.generatedVisual?.imageDataUrl ||
        primaryAsset?.imageDataUrl ||
        primaryAsset?.previewUrl ||
        primaryAsset?.sourceUrl
      );
    });
    if (allVisualSlidesResolved) return session;

    const response = await fetch("/api/generate-slide-visuals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionPlan: session,
        sessionTitle: session.title,
        sessionNumber: session.sessionNumber,
        subject: academicConfigDraft.subject,
        gradeLevel: academicConfigDraft.className,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorFromResponse(response, "Failed to generate slide visuals."));
    }

    const data = await response.json();
    return data?.sessionPlan || session;
  };

  const buildSessionConfigFromWorkspace = (workspace?: PlanningWorkspace | null): SessionConfig => ({
    includeLearningOutcomes: true,
    includeIntroduction: true,
    includeTheory: true,
    includeAssessments: workspace?.sessionPlanningDefaults?.includeFormativeAssessment ?? true,
    includeAssignments: false,
    includeNotes: workspace?.sessionPlanningDefaults?.includeTeacherNotes ?? true,
    sessionCount: 1,
    durationMinutes:
      Number(workspace?.sessionPlanningDefaults?.sessionDurationMinutes) ||
      Number(workspace?.academicConfig?.periodDurationMinutes) ||
      45,
  });

  const allSessionSections: SessionSectionKey[] = [
    "teacherLessonNotes",
    "studentLessonNotes",
    "learningOutcomes",
    "introduction",
    "theory",
    "activities",
    "materials",
    "homework",
    "assessment",
    "assignment",
  ];

  const sessionTabDefinitions = [
    {
      id: "teacherNotes",
      label: "Teacher Notes",
      sections: ["teacherLessonNotes", "learningOutcomes", "introduction", "theory", "activities"] as SessionSectionKey[],
    },
    { id: "studentNotes", label: "Student Notes", sections: ["studentLessonNotes"] as SessionSectionKey[] },
    { id: "materials", label: "Materials (PPT/PDF/DOC)", sections: ["materials"] as SessionSectionKey[] },
    { id: "homework", label: "Homework Draft", sections: ["homework"] as SessionSectionKey[] },
    { id: "assessments", label: "Assessments (Test + key)", sections: ["assessment"] as SessionSectionKey[] },
    { id: "assignments", label: "Assignments + Key", sections: ["assignment"] as SessionSectionKey[] },
  ] as const;

  const assessmentQuestionTypeCatalog: { type: AssessmentQuestionType; label: string; defaultMarksEach: number }[] = [
    { type: "mcq", label: "MCQs", defaultMarksEach: 1 },
    { type: "veryShortAnswer", label: "Very Short Answer", defaultMarksEach: 1 },
    { type: "shortAnswer", label: "Short Answer", defaultMarksEach: 2 },
    { type: "longAnswer", label: "Long Answer", defaultMarksEach: 5 },
    { type: "caseStudy", label: "Case Study", defaultMarksEach: 4 },
  ];

  const getDefaultAssessmentQuestionTypes = (): AssessmentQuestionTypeRequest[] => [
    { type: "mcq", label: "MCQs", questionCount: 3, marksEach: 1 },
    { type: "veryShortAnswer", label: "Very Short Answer", questionCount: 2, marksEach: 1 },
    { type: "shortAnswer", label: "Short Answer", questionCount: 2, marksEach: 2 },
  ];

  const getSectionsForTab = (tab: typeof activeSubTab): SessionSectionKey[] =>
    sessionTabDefinitions.find((item) => item.id === tab)?.sections || allSessionSections;

  const fetchStoredSessionSections = async (
    sessionNum: number,
    selectedSections: SessionSectionKey[],
    outlineItem?: {
      id?: string;
      title?: string;
      duration?: number;
    }
  ) => {
    if (!currentWorkspaceId) return null;
    const query = new URLSearchParams({ sections: selectedSections.join(",") });
    const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/generated-sessions/${sessionNum}?${query.toString()}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to load saved session content."));
    }
    const data = await res.json();
    const sessionPlan = data.sessionPlan as SessionPlan;
    setGeneratedSessions((prev) => ({
      ...prev,
      [sessionNum]: {
        ...prev[sessionNum],
        ...(outlineItem || {}),
        ...sessionPlan,
        id: sessionPlan.id || outlineItem?.id || prev[sessionNum]?.id || `session-${sessionNum}`,
        title: sessionPlan.title || outlineItem?.title || prev[sessionNum]?.title || `Session ${sessionNum}`,
        duration: sessionPlan.duration || outlineItem?.duration || prev[sessionNum]?.duration || 45,
        sessionNumber: Number(sessionPlan.sessionNumber || sessionNum),
      },
    }));
    return sessionPlan;
  };

  const getAssessmentCustomization = (sessionNum: number): SessionAssessmentCustomization => {
    const stored = assessmentCustomizationBySession[sessionNum];
    const questionTypes = stored?.questionTypes?.length
      ? stored.questionTypes
      : getDefaultAssessmentQuestionTypes();
    const totalQuestions = questionTypes.reduce((sum, item) => sum + Number(item.questionCount || 0), 0);
    const totalMarks = questionTypes.reduce((sum, item) => sum + Number(item.questionCount || 0) * Number(item.marksEach || 0), 0);

    return {
      assessmentType: stored?.assessmentType || "Session assessment",
      difficulty: stored?.difficulty || "Balanced",
      paperObjective: stored?.paperObjective || "",
      questionTypes,
      totalQuestions,
      totalMarks,
    };
  };

  const updateAssessmentCustomization = (sessionNum: number, updater: (draft: SessionAssessmentCustomization) => SessionAssessmentCustomization) => {
    setAssessmentCustomizationBySession((prev) => {
      const nextDraft = updater(getAssessmentCustomization(sessionNum));
      const questionTypes = nextDraft.questionTypes?.length ? nextDraft.questionTypes : getDefaultAssessmentQuestionTypes();
      const totalQuestions = questionTypes.reduce((sum, item) => sum + Number(item.questionCount || 0), 0);
      const totalMarks = questionTypes.reduce((sum, item) => sum + Number(item.questionCount || 0) * Number(item.marksEach || 0), 0);
      return {
        ...prev,
        [sessionNum]: {
          ...nextDraft,
          questionTypes,
          totalQuestions,
          totalMarks,
        },
      };
    });
  };

  const buildAssessmentCustomizationPayload = (sessionNum: number) => {
    const draft = getAssessmentCustomization(sessionNum);
    return {
      assessmentType: draft.assessmentType,
      difficulty: draft.difficulty,
      paperObjective: draft.paperObjective,
      totalMarks: draft.totalMarks,
      totalQuestions: draft.totalQuestions,
      questionTypes: (draft.questionTypes || []).map((item) => ({
        type: item.type,
        label: item.label || assessmentQuestionTypeCatalog.find((entry) => entry.type === item.type)?.label || item.type,
        questionCount: Number(item.questionCount || 0),
        marksEach: Number(item.marksEach || 0),
      })),
    };
  };

  const buildAssessmentCustomizationSignature = (customization: SessionAssessmentCustomization) =>
    JSON.stringify({
      assessmentType: customization.assessmentType || "Session assessment",
      difficulty: customization.difficulty || "Balanced",
      paperObjective: customization.paperObjective || "",
      totalMarks: Number(customization.totalMarks || 0),
      totalQuestions: Number(customization.totalQuestions || 0),
      questionTypes: (customization.questionTypes || []).map((item) => ({
        type: item.type,
        label: item.label || "",
        questionCount: Number(item.questionCount || 0),
        marksEach: Number(item.marksEach || 0),
      })),
    });

  const getPptGenerationOptions = (sessionNum: number, session?: SessionPlan | null): SessionPptGenerationOptions => ({
    pptTemplateId:
      pptGenerationOptionsBySession[sessionNum]?.pptTemplateId ||
      normalizePptTemplateId(session?.materials?.ppt?.templateId) ||
      "academic-split",
    pptThemeId:
      pptGenerationOptionsBySession[sessionNum]?.pptThemeId ||
      session?.materials?.ppt?.themeId ||
      "cbse-academic-blue",
  });

  const updatePptGenerationOption = (
    sessionNum: number,
    field: keyof SessionPptGenerationOptions,
    value: string,
  ) => {
    setPptGenerationOptionsBySession((prev) => ({
      ...prev,
      [sessionNum]: {
        ...getPptGenerationOptions(sessionNum, generatedSessions[sessionNum]),
        ...(prev[sessionNum] || {}),
        [field]: value,
      },
    }));
  };

  const hasAssessmentSourceContent = (session: SessionPlan | undefined | null) =>
    Boolean(
      session &&
      (
        (Array.isArray(session.learningOutcomes) && session.learningOutcomes.length > 0) ||
        (typeof session.introduction === "string" && session.introduction.trim().length > 0) ||
        (session.theory && (session.theory.overview || session.theory.detailedContent || session.theory.keyPoints?.length)) ||
        (Array.isArray(session.activities) && session.activities.length > 0) ||
        session.teacherLessonNotes ||
        session.studentLessonNotes
      )
    );

  const isAssessmentCustomizationDirty = (sessionNum: number, session: SessionPlan | undefined | null) => {
    const customization = getAssessmentCustomization(sessionNum);
    const currentSignature = buildAssessmentCustomizationSignature(customization);
    const savedSignature = session?.assessment?.meta?.requestSignature;
    if (!session?.assessment) {
      return hasAssessmentSourceContent(session);
    }
    return savedSignature !== currentSignature;
  };

  const renderSessionTabEmptyState = (title: string, description: string) => (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <div className="text-sm font-display font-black text-slate-800">{title}</div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );

  const renderTabGeneratePanel = (
    tabId: typeof activeSubTab,
    sessionNum: number,
    outlineItem: any,
    title: string,
    description: string,
    options?: {
      disabled?: boolean;
      disabledReason?: string;
      dirty?: boolean;
      buttonLabel?: string;
    }
  ) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-display font-black text-slate-800">{title}</div>
          {options?.dirty && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
              Customization changed
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{options?.disabled && options.disabledReason ? options.disabledReason : description}</p>
      </div>
      <button
        type="button"
        disabled={Boolean(options?.disabled)}
        onClick={() => void handleGenerateSessionTab(tabId, sessionNum, outlineItem)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
          options?.disabled
            ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
            : "border border-[#36ADAA]/20 bg-[#36ADAA] text-white hover:bg-[#36ADAA]/90"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {options?.buttonLabel || `Generate ${title}`}
      </button>
    </div>
  );

  const formatAssessmentSubtypeLabel = (value?: string) => {
    switch (value) {
      case "mcq":
        return "MCQ";
      case "veryShortAnswer":
        return "Very Short Answer";
      case "shortAnswer":
        return "Short Answer";
      case "longAnswer":
        return "Long Answer";
      case "caseStudy":
        return "Case Study";
      default:
        return "";
    }
  };

  const buildSessionsOutlineFromAllocations = (allocations: ChapterSessionPlan[], durationMinutes: number) => {
    const outline: {
      id: string;
      sessionNumber: number;
      title: string;
      duration: number;
      learningOutcomes: string[];
      chapterName?: string;
      sessionKind?: "lesson" | "strand_practice";
      chapterSessionNumber?: number;
      chapterTotalSessions?: number;
    }[] = [];

    let globalSessionNumber = 1;
    allocations
      .slice()
      .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
      .forEach((allocation) => {
        const chapterTotalSessions = Math.max(1, Number(allocation.estimatedSessions || 0));
        for (let chapterSessionNumber = 1; chapterSessionNumber <= chapterTotalSessions; chapterSessionNumber += 1) {
          outline.push({
            id: allocation.id || `${allocation.chapterName}-${allocation.sequence || globalSessionNumber}-${chapterSessionNumber}`,
            sessionNumber: globalSessionNumber,
            title:
              chapterTotalSessions === 1
                ? allocation.chapterName
                : `${allocation.chapterName} - Session ${chapterSessionNumber}`,
            duration: durationMinutes,
            learningOutcomes: [],
            chapterName: allocation.chapterName,
            sessionKind: allocation.sessionKind,
            chapterSessionNumber,
            chapterTotalSessions,
          });
          globalSessionNumber += 1;
        }
      });

    return outline;
  };

  const normalizeAllocationForComparison = (allocation: TermAllocation) => ({
    className: (allocation.className || "").trim(),
    termName: (allocation.termName || "").trim(),
    termNumber: allocation.termNumber ?? null,
    chapters: (allocation.chapters || []).map((chapter) => chapter.trim()).filter(Boolean),
    recurringStrands: (allocation.recurringStrands || []).map((strand) => strand.trim()).filter(Boolean),
    marks: Number(allocation.marks || 0),
    reasoning: (allocation.reasoning || "").trim(),
    estimatedSessions: allocation.estimatedSessions ?? null,
  });

  const normalizeAllocationsForComparison = (allocations: TermAllocation[] = []) =>
    allocations.map(normalizeAllocationForComparison);

  const countUniqueTerms = (allocations: TermAllocation[] = []) =>
    new Set(
      allocations.map((allocation) =>
        `${(allocation.className || "Curriculum").trim()}::${(allocation.termName || "").trim()}::${allocation.termNumber ?? ""}`
      )
    ).size;

  const getAllocationTermKey = (allocation: TermAllocation) =>
    `${(allocation.className || "Curriculum").trim()}::${(allocation.termName || "").trim()}::${allocation.termNumber ?? ""}`;

  const getAllocationRowPosition = (allocations: TermAllocation[], index: number) => {
    const targetKey = getAllocationTermKey(allocations[index]);
    const matchingIndexes = allocations.reduce<number[]>((acc, allocation, allocationIndex) => {
      if (getAllocationTermKey(allocation) === targetKey) {
        acc.push(allocationIndex);
      }
      return acc;
    }, []);

    return {
      rowNumber: matchingIndexes.indexOf(index) + 1,
      rowCount: matchingIndexes.length,
    };
  };

  const validateCoursePlanAllocations = (allocations: TermAllocation[] = []) => {
    const issues: string[] = [];

    allocations.forEach((allocation, index) => {
      const label = allocation.termName?.trim() || `Allocation ${index + 1}`;
      const chapters = (allocation.chapters || []).map((chapter) => chapter.trim()).filter(Boolean);
      const marks = Number(allocation.marks || 0);

      if (!allocation.termName?.trim()) {
        issues.push(`Allocation ${index + 1} is missing a term name.`);
      }
      if (allocation.termNumber == null) {
        issues.push(`${label} is missing a term number.`);
      }
      if (chapters.length === 0) {
        issues.push(`${label} must include at least one chapter.`);
      }
      if (marks < 0) {
        issues.push(`${label} has invalid marks.`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  };

  const getSessionPlanningDefaultsSeed = (workspace?: PlanningWorkspace | null): SessionPlanningDefaults => ({
    sessionDurationMinutes:
      workspace?.sessionPlanningDefaults?.sessionDurationMinutes ??
      workspace?.academicConfig?.periodDurationMinutes ??
      45,
    language: resolveWorkspaceOutputLanguage(workspace),
    readingLevel: workspace?.sessionPlanningDefaults?.readingLevel || "Grade-aligned",
    responseLength: workspace?.sessionPlanningDefaults?.responseLength || "Balanced",
    creativity: workspace?.sessionPlanningDefaults?.creativity || "Moderate",
    includeRealWorldConnections: workspace?.sessionPlanningDefaults?.includeRealWorldConnections ?? true,
    includeDifferentiation: workspace?.sessionPlanningDefaults?.includeDifferentiation ?? true,
    includeFormativeAssessment: workspace?.sessionPlanningDefaults?.includeFormativeAssessment ?? true,
    includeHomework: workspace?.sessionPlanningDefaults?.includeHomework ?? true,
    includeTeacherNotes: workspace?.sessionPlanningDefaults?.includeTeacherNotes ?? true,
  });

  const normalizeSessionStrategyForComparison = (strategy: TeachingStrategy = {}) => ({
    teachingStyle: [...(strategy.teachingStyle || [])].sort(),
    studentLevel: (strategy.studentLevel || "").trim(),
    pace: (strategy.pace || "").trim(),
    bloomsTaxonomyEmphasis: [...(strategy.bloomsTaxonomyEmphasis || [])].sort(),
    assessmentPreference: [...(strategy.assessmentPreference || [])].sort(),
    targetDifficulty: (strategy.targetDifficulty || "").trim(),
    teachingResources: [...(strategy.teachingResources || [])].sort(),
    specialInstructions: (strategy.specialInstructions || "").trim(),
  });

  const normalizeSessionDefaultsForComparison = (defaults: SessionPlanningDefaults = {}) => ({
    sessionDurationMinutes: defaults.sessionDurationMinutes ?? null,
    language: (defaults.language || "").trim(),
    readingLevel: (defaults.readingLevel || "").trim(),
    responseLength: (defaults.responseLength || "").trim(),
    creativity: (defaults.creativity || "").trim(),
    includeRealWorldConnections: defaults.includeRealWorldConnections ?? false,
    includeDifferentiation: defaults.includeDifferentiation ?? false,
    includeFormativeAssessment: defaults.includeFormativeAssessment ?? false,
    includeHomework: defaults.includeHomework ?? false,
    includeTeacherNotes: defaults.includeTeacherNotes ?? false,
  });

  const normalizeChapterSessionPlanForComparison = (allocation: ChapterSessionPlan) => ({
    id: allocation.id || "",
    chapterName: (allocation.chapterName || "").trim(),
    sessionKind: allocation.sessionKind || "lesson",
    sequence: allocation.sequence ?? null,
    estimatedSessions: Number(allocation.estimatedSessions || 0),
    estimatedMinutes: Number(allocation.estimatedMinutes || 0),
    rationale: (allocation.rationale || allocation.reasoning || "").trim(),
    className: (allocation.className || "").trim(),
    termName: (allocation.termName || "").trim(),
    termNumber: allocation.termNumber ?? null,
  });

  const normalizeChapterSessionPlansForComparison = (allocations: ChapterSessionPlan[] = []) =>
    allocations.map(normalizeChapterSessionPlanForComparison);

  const getSelectedTermKey = (term?: Partial<TermRow> | null) =>
    `${(term?.className || "Curriculum").trim()}::${(term?.term || "").trim()}::${term?.termNumber ?? ""}`;

  const getAnnualSessionCapacity = (academicConfig?: AcademicConfig) => {
    const workingDays = Math.max(0, Number(academicConfig?.calendar?.workingDays || 0));
    const weeklyPeriods = Math.max(1, Number(academicConfig?.weeklyPeriods || 0) || 5);
    const schoolDaysPerWeek = 5;
    const annualSubjectSessions = Math.max(
      1,
      Math.round(((workingDays || schoolDaysPerWeek * 40) / schoolDaysPerWeek) * weeklyPeriods)
    );

    return {
      workingDays,
      weeklyPeriods,
      schoolDaysPerWeek,
      annualSubjectSessions,
    };
  };

  const getSelectedTermCapacity = (term: TermRow | null, allocations: TermAllocation[], academicConfig?: AcademicConfig) => {
    const annualCapacity = getAnnualSessionCapacity(academicConfig);
    const totalMarks = allocations.reduce((sum, allocation) => sum + Number(allocation.marks || 0), 0);
    const uniqueTerms = countUniqueTerms(allocations);
    const selectedTermMarks = term
      ? allocations
          .filter((allocation) => getAllocationTermKey(allocation) === getSelectedTermKey(term))
          .reduce((sum, allocation) => sum + Number(allocation.marks || 0), 0)
      : 0;
    const evenCapacity = Math.max(1, Math.round(annualCapacity.annualSubjectSessions / Math.max(1, uniqueTerms || 1)));
    const weightedCapacity =
      selectedTermMarks > 0 && totalMarks > 0
        ? Math.max(1, Math.round(annualCapacity.annualSubjectSessions * (selectedTermMarks / totalMarks)))
        : evenCapacity;

    return {
      ...annualCapacity,
      termCapacity: Math.min(annualCapacity.annualSubjectSessions, weightedCapacity),
      selectedTermMarks,
      totalMarks,
    };
  };

  const validateSessionAllocationDraft = (
    allocations: ChapterSessionPlan[] = [],
    term: TermRow | null,
    workspace?: PlanningWorkspace | null
  ) => {
    const issues: string[] = [];
    const savedStrategy =
      JSON.stringify(normalizeSessionStrategyForComparison(teachingStrategyDraft)) !==
        JSON.stringify(normalizeSessionStrategyForComparison({})) ||
      Boolean(sessionPlanningDefaultsDraft.sessionDurationMinutes);

    if (!coursePlanApproved) {
      issues.push("Approve the Phase 2 course plan before saving or approving Phase 3.");
    }
    if (!term) {
      issues.push("Select an approved term for session planning.");
    }
    if (!savedStrategy) {
      issues.push("Save the session planning setup before generating chapter allocations.");
    }
    if (allocations.length === 0) {
      issues.push("Generate or save at least one chapter session allocation.");
    }

    allocations.forEach((allocation, index) => {
      if (!(allocation.chapterName || "").trim()) {
        issues.push(`Allocation row ${index + 1} is missing a chapter name.`);
      }
      if (Number(allocation.estimatedSessions || 0) <= 0) {
        issues.push(`${allocation.chapterName || `Allocation row ${index + 1}`} must have at least 1 session.`);
      }
    });

    const capacity = getSelectedTermCapacity(term, workspace?.termPlan?.allocations || savedTermAllocations, workspace?.academicConfig || academicConfigDraft);
    const allocatedSessions = allocations.reduce((sum, allocation) => sum + Number(allocation.estimatedSessions || 0), 0);
    if (allocatedSessions > capacity.termCapacity) {
      issues.push(`Allocated sessions (${allocatedSessions}) exceed the selected term capacity (${capacity.termCapacity}).`);
    }

    return {
      valid: issues.length === 0,
      issues,
      allocatedSessions,
      annualCapacity: capacity.annualSubjectSessions,
      termCapacity: capacity.termCapacity,
    };
  };

  const syncWorkspaceIntoCoursePlanState = (workspace: PlanningWorkspace | null) => {
    if (!workspace) return;

    setAcademicConfigDraft(workspace.academicConfig || {});
    if (workspace.termPlan?.recommendedTermCount) {
      setPreferredTermCount(Number(workspace.termPlan.recommendedTermCount) || 3);
    }

    const sourceAllocations =
      workspace.termPlan?.allocations?.length
        ? workspace.termPlan.allocations
        : workspace.termPlan?.recommendations || [];
    setCoursePlanDraft(sourceAllocations);
    setTeachingStrategyDraft(workspace.teachingStrategy || {});
    setSessionPlanningDefaultsDraft(getSessionPlanningDefaultsSeed(workspace));
    setSessionAllocationDraft(
      workspace.sessionAllocation?.allocations?.length
        ? workspace.sessionAllocation.allocations
        : workspace.sessionAllocation?.recommendations || []
    );
    syncTermRowsFromAllocations(sourceAllocations);
  };

  const loadPlanningWorkspaceById = async (
    workspaceId: string,
    options?: { view?: "planning" | "full" }
  ) => {
    if (!workspaceId) return null;
    const view = options?.view || "planning";
    const res = await fetch(`/api/planning-workspaces/${workspaceId}?view=${view}`);
    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to load planning workspace."));
    }
    const data = await res.json();
    const workspace = data.workspace as PlanningWorkspace;
    syncWorkspaceState(workspace);
    return workspace;
  };

  const ensurePlanningWorkspaceForCurriculum = async (
    curriculumId: string,
    options?: { view?: "planning" | "full" }
  ) => {
    if (!curriculumId) return null;
    const view = options?.view || "planning";

    const existingRes = await fetch(`/api/planning-workspaces/by-curriculum/${curriculumId}?view=${view}`);
    if (existingRes.ok) {
      const existingData = await existingRes.json();
      return existingData.workspace as PlanningWorkspace;
    }

    const createRes = await fetch("/api/planning-workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curriculumId }),
    });
    if (!createRes.ok) {
      throw new Error(await readErrorFromResponse(createRes, "Failed to create planning workspace."));
    }

    const createData = await createRes.json();
    return createData.workspace as PlanningWorkspace;
  };

  const restoreCurriculumById = async (curriculumId: string, options?: { silent?: boolean }) => {
    if (!curriculumId) return;
    const silent = options?.silent ?? false;

    if (!silent) {
      setLoading(true);
      setLoadingMessage("Restoring saved curriculum from MongoDB...");
    }

    try {
      const [res, workspace] = await Promise.all([
        fetch(`/api/curriculums/${curriculumId}`),
        ensurePlanningWorkspaceForCurriculum(curriculumId, { view: "planning" }),
      ]);
      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to restore curriculum."));
      }

      const data = await res.json();
      const curriculumRecord = data.curriculum as SavedCurriculumRecord;
      setCurrentCurriculumId(curriculumRecord._id);
      setFileName(curriculumRecord.fileName || "");
      setInputText(curriculumRecord.sourceText || "");
      setExtractedData(curriculumRecord.extractedCurriculum);
      setEditingJsonText("");
      localStorage.setItem(LAST_CURRICULUM_ID_KEY, curriculumRecord._id);
      if (workspace) {
        syncWorkspaceState(workspace);
      }
      setErrorHeader(null);
    } catch (error: any) {
      console.error("[Frontend] Restore curriculum failed", error);
      localStorage.removeItem(LAST_CURRICULUM_ID_KEY);
      localStorage.removeItem(LAST_WORKSPACE_ID_KEY);
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
    setActiveStep(1);
  };

  const handleDeleteSavedCurriculum = async (curriculumId: string) => {
    setErrorHeader(null);
    try {
      const res = await fetch(`/api/curriculums/${curriculumId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to delete curriculum."));
      }

      if (currentCurriculumId === curriculumId) {
        clearCurriculumWorkspace();
      }

      await fetchSavedCurriculums();
    } catch (error: any) {
      console.error("[Frontend] Delete curriculum failed", error);
      setErrorHeader(error.message || "Unable to delete the saved curriculum.");
    }
  };

  useEffect(() => {
    void (async () => {
      const savedCurriculumsPromise = fetchSavedCurriculums();
      try {
        const lastCurriculumId = localStorage.getItem(LAST_CURRICULUM_ID_KEY);
        if (lastCurriculumId) {
          await restoreCurriculumById(lastCurriculumId, { silent: true });
          await savedCurriculumsPromise;
          return;
        }

        await savedCurriculumsPromise;
        const lastWorkspaceId = localStorage.getItem(LAST_WORKSPACE_ID_KEY);
        if (lastWorkspaceId) {
          await loadPlanningWorkspaceById(lastWorkspaceId, { view: "planning" });
        }
      } catch (error: any) {
        console.error("[Frontend] Initial restore failed", error);
      }
    })();
  }, []);

  useEffect(() => {
    syncWorkspaceIntoCoursePlanState(activeWorkspace);
  }, [activeWorkspace]);

  useEffect(() => {
    setSessionConfig(buildSessionConfigFromWorkspace(activeWorkspace));
    const generatedFromWorkspace =
      activeWorkspace?.generationScope &&
      typeof activeWorkspace.generationScope === "object" &&
      (activeWorkspace.generationScope as Record<string, unknown>).generatedSessions &&
      typeof (activeWorkspace.generationScope as Record<string, unknown>).generatedSessions === "object"
        ? Object.fromEntries(
            Object.entries((activeWorkspace.generationScope as Record<string, unknown>).generatedSessions as Record<string, SessionPlan>).map(([key, value]) => [
              key,
              {
                ...value,
                sessionNumber: Number(key) || value.sessionNumber,
              },
            ])
          )
        : {};
    setGeneratedSessions(generatedFromWorkspace || {});
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeStep !== 4 || !currentWorkspaceId) {
      return;
    }

    const targetOutline = sessionsOutline.find((item) => item.sessionNumber === activeSessionNumber);
    if (!targetOutline) {
      return;
    }
    const requiredSections = getSectionsForTab(activeSubTab);
    const currentSession = generatedSessions[activeSessionNumber];
    if (hasRequiredSessionSections(currentSession, requiredSections)) {
      return;
    }

    void (async () => {
      try {
        await fetchStoredSessionSections(activeSessionNumber, requiredSections, {
          id: targetOutline.id,
          title: targetOutline.title,
          duration: targetOutline.duration,
        });
      } catch (error: any) {
        console.error("[Frontend] Session tab content load failed", error);
        setErrorHeader(error?.message || "Unable to load the saved session content.");
      }
    })();
  }, [activeStep, activeSubTab, activeSessionNumber, currentWorkspaceId, sessionsOutline, generatedSessions]);

  useEffect(() => {
    const duration = Number(sessionPlanningDefaultsDraft.sessionDurationMinutes || academicConfigDraft.periodDurationMinutes || 45);
    const persistedAllocations = activeWorkspace?.sessionAllocation?.allocations || [];
    const sourceAllocations = persistedAllocations.length > 0 ? persistedAllocations : sessionAllocationDraft;
    const filteredAllocations = sourceAllocations.filter(
      (allocation) =>
        getSelectedTermKey({
          className: allocation.className,
          term: allocation.termName,
          termNumber: allocation.termNumber ?? undefined,
        }) === getSelectedTermKey(selectedTermRow)
    );
    const nextOutline = buildSessionsOutlineFromAllocations(filteredAllocations, duration);
    setSessionsOutline(nextOutline);
    if (nextOutline.length > 0) {
      setActiveSessionNumber((current) => {
        const hasCurrent = nextOutline.some((item) => item.sessionNumber === current);
        return hasCurrent ? current : nextOutline[0].sessionNumber;
      });
    } else {
      setActiveSessionNumber(1);
    }
  }, [activeWorkspace?.sessionAllocation?.allocations, sessionAllocationDraft, selectedTermRow, sessionPlanningDefaultsDraft.sessionDurationMinutes, academicConfigDraft.periodDurationMinutes]);

  useEffect(() => {
    const preferredTermKey = activeWorkspace?.sessionAllocation?.selectedTermKey;
    if (!preferredTermKey || termsList.length === 0) return;
    const matchingRows = termsList.filter((row) => getSelectedTermKey(row) === preferredTermKey);
    if (matchingRows.length === 0) return;
    setSelectedTermRow({
      id: `term-${matchingRows[0].className || "Curriculum"}-${matchingRows[0].termNumber || matchingRows[0].term}`,
      className: matchingRows[0].className,
      termNumber: matchingRows[0].termNumber,
      term: matchingRows[0].term,
      unitName: "Whole Term",
      chapters: Array.from(new Set<string>(matchingRows.flatMap((row) => row.chapters as string[]))),
      recurringStrands: Array.from(new Set<string>(matchingRows.flatMap((row) => row.recurringStrands || []))),
      recurringStrandDetails: Array.from(
        new Map(
          matchingRows.flatMap((row) => (row.recurringStrandDetails || []).map((strand) => [strand.title, strand] as const))
        ).values()
      ),
      marks: Number(matchingRows.reduce((sum, row) => sum + row.marks, 0).toFixed(2)),
    });
  }, [activeWorkspace?.sessionAllocation?.selectedTermKey, termsList]);

  const normalizePdfLineToMarkdown = (line: string): string => {
    const trimmed = line.replace(/\s+/g, " ").trim();
    if (!trimmed) return "";

    if (/^(?:[-*•]|[A-Z]\.|[0-9]+[.)])\s+/.test(trimmed)) {
      return trimmed
        .replace(/^•\s+/, "- ")
        .replace(/^([A-Z]\.)\s+/, "- $1 ")
        .replace(/^([0-9]+[.)])\s+/, "- $1 ");
    }

    if (/^(?:chapter|unit|section|part|class|grade|course structure|practical syllabus|question paper design)\b/i.test(trimmed)) {
      return `## ${trimmed}`;
    }

    if (
      trimmed.length <= 90 &&
      /[A-Za-z]/.test(trimmed) &&
      trimmed === trimmed.toUpperCase()
    ) {
      return `## ${trimmed}`;
    }

    return trimmed;
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageTexts: string[] = [];

    console.log(`[Frontend][PDF->MD] Starting conversion for "${file.name}" with ${pdf.numPages} page(s).`);

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const textItems = content.items
        .filter((item): item is typeof content.items[number] & { str: string; transform: number[] } => "str" in item)
        .map((item) => ({
          text: item.str.replace(/\s+/g, " ").trim(),
          x: item.transform[4] || 0,
          y: item.transform[5] || 0,
        }))
        .filter((item) => item.text);

      const lines: { y: number; parts: { x: number; text: string }[] }[] = [];
      for (const item of textItems) {
        const existingLine = lines.find((line) => Math.abs(line.y - item.y) < 3);
        if (existingLine) {
          existingLine.parts.push({ x: item.x, text: item.text });
        } else {
          lines.push({ y: item.y, parts: [{ x: item.x, text: item.text }] });
        }
      }

      const markdownLines = lines
        .sort((a, b) => b.y - a.y)
        .map((line) =>
          normalizePdfLineToMarkdown(
            line.parts
              .sort((a, b) => a.x - b.x)
              .map((part) => part.text)
              .join(" ")
          )
        )
        .filter(Boolean);

      pageTexts.push([
        `# Page ${pageNumber}`,
        "",
        ...markdownLines,
      ].join("\n"));

      console.log(
        `[Frontend][PDF->MD] Page ${pageNumber}/${pdf.numPages} converted with ${markdownLines.length} markdown line(s).`
      );
    }

    const markdownText = pageTexts.join("\n\n---\n\n").trim();
    console.log(
      `[Frontend][PDF->MD] Completed conversion for "${file.name}". Markdown length: ${markdownText.length} chars.`
    );
    console.log(
      `[Frontend][PDF->MD] Markdown preview (first 1000 chars):\n${markdownText.slice(0, 1000)}`
    );
    return markdownText;
  };

  const readTextFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve((event.target?.result as string) || "");
      reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
      reader.readAsText(file);
    });

  const extractCurriculumFileText = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".pdf")) {
      console.log(`[Frontend] PDF upload detected for "${file.name}". Converting to markdown before extraction.`);
      const markdownText = await extractPdfText(file);
      if (!markdownText.trim()) {
        throw new Error("No readable text was extracted from the PDF.");
      }
      console.log(`[Frontend] PDF "${file.name}" converted to markdown and loaded into curriculum input.`);
      return markdownText;
    }

    if (lowerName.endsWith(".txt")) {
      return readTextFile(file);
    }

    throw new Error("Only .txt and .pdf curriculum files are supported for extraction right now.");
  };

  const loadCurriculumFile = async (file: File) => {
    setErrorHeader(null);
    resetTamilIndexState();
    setFileName(file.name);
    setFileSizeStr((file.size / 1024).toFixed(1) + " KB");

    try {
      const text = await extractCurriculumFileText(file);
      setInputText(text);
    } catch (error: any) {
      console.error("[Frontend] File extraction failed", error);
      setInputText("");
      setErrorHeader(error.message || "Unable to extract readable text from the selected file.");
    }
  };

  const loadTamilIndexFile = async (file: File) => {
    setErrorHeader(null);

    try {
      const text = await extractCurriculumFileText(file);
      setTamilIndexFileName(file.name);
      setTamilIndexFileSizeStr((file.size / 1024).toFixed(1) + " KB");
      setTamilIndexText(text);
    } catch (error: any) {
      console.error("[Frontend] Tamil index extraction failed", error);
      setTamilIndexFileName("");
      setTamilIndexFileSizeStr("");
      setTamilIndexText("");
      setErrorHeader(error.message || "Unable to extract readable text from the Tamil textbook index file.");
    }
  };

  const loadTamilStructureFile = async (file: File) => {
    setErrorHeader(null);

    try {
      const text = await extractCurriculumFileText(file);
      setTamilStructureFileName(file.name);
      setTamilStructureFileSizeStr((file.size / 1024).toFixed(1) + " KB");
      setTamilStructureText(text);
      setSunbirdPreviewSummary(null);
    } catch (error: any) {
      console.error("[Frontend] Tamil structure extraction failed", error);
      setTamilStructureFileName("");
      setTamilStructureFileSizeStr("");
      setTamilStructureText("");
      setErrorHeader(error.message || "Unable to extract readable text from the Tamil textbook structure file.");
    }
  };

  const searchTamilSunbirdContent = async () => {
    const res = await fetch("/api/tamil/sunbird/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: sunbirdSearchQuery,
        className: pendingTamilIndexPreflight?.result?.detectedClasses?.[0]?.className || "Class IX",
        board: "CBSE",
        medium: "Tamil",
        subject: "Tamil",
      }),
    });
    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to search Sunbird Tamil textbooks."));
    }
    return res.json() as Promise<{ success: boolean; candidates: SunbirdSearchCandidate[] }>;
  };

  const previewTamilSunbirdStructure = async (candidate: SunbirdSearchCandidate) => {
    const res = await fetch("/api/tamil/sunbird/preview-structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: candidate.identifier,
        source: candidate.source,
        className: pendingTamilIndexPreflight?.result?.detectedClasses?.[0]?.className || "Class IX",
        title: candidate.name,
      }),
    });
    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to fetch Sunbird textbook structure."));
    }
    return res.json() as Promise<SunbirdStructurePreviewResponse>;
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

  const handleTamilIndexFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void loadTamilIndexFile(e.target.files[0]);
    }
  };

  const handleTamilStructureFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void loadTamilStructureFile(e.target.files[0]);
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
    setCurrentWorkspaceId("");
    setActiveWorkspace(null);
    setExtractedData(null);
    setEditingJsonText("");
    closePendingCurriculumSelection();
    setLoading(true);
    setLoadingMessage("Checking the uploaded curriculum for class-specific sections...");

    try {
      const classOptions = await detectCurriculumClassOptions();
      setDetectedCurriculumSubject(classOptions.detectedSubject || "");
      setRequiresTamilIndex(Boolean(classOptions.requiresTamilIndex));

      if (classOptions.requiresTamilIndex && !tamilIndexText.trim()) {
        setPendingTamilIndexPreflight({
          requestId,
          result: classOptions,
        });
        setShowTamilIndexModal(true);
        return;
      }

      await continueCurriculumAnalysisAfterPreflight(requestId, classOptions);
    } catch (err: any) {
      console.error(`[Frontend][${requestId}] Analyze curriculum failed`, err);
      setErrorHeader(err.message || "An exception occurred while building the curriculum framework.");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelectedCurriculumClasses = async () => {
    if (!pendingCurriculumSelection) return;
    if (selectedClassNamesToStore.length === 0) {
      setErrorHeader("Select at least one class before storing the curriculum.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Parsing only the selected class curriculum and preparing the planning workspace...");
    try {
      const requestId = `frontend-analyze-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const data = await runCurriculumExtraction(requestId, selectedClassNamesToStore);
      applyAnalyzedCurriculum(data);
      closePendingCurriculumSelection();
      await fetchSavedCurriculums();
    } catch (err: any) {
      console.error("[Frontend] Save selected classes failed", err);
      setErrorHeader(err.message || "Unable to save the selected classes.");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeTamilCurriculumAnalysis = async () => {
    if (!pendingTamilIndexPreflight) return;
    if (!tamilIndexText.trim()) {
      setErrorHeader("Upload the Tamil textbook index before continuing.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Resuming Tamil curriculum analysis with the textbook index...");
    try {
      const { requestId, result } = pendingTamilIndexPreflight;
      setShowTamilIndexModal(false);
      setPendingTamilIndexPreflight(null);
      setDetectedCurriculumSubject(result.detectedSubject || "");
      setRequiresTamilIndex(Boolean(result.requiresTamilIndex));
      await continueCurriculumAnalysisAfterPreflight(requestId, result);
    } catch (error: any) {
      console.error("[Frontend] Resume Tamil curriculum analysis failed", error);
      setErrorHeader(error.message || "Unable to continue Tamil curriculum analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTamilSunbird = async () => {
    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Searching Sunbird for Tamil textbook candidates...");
    try {
      const result = await searchTamilSunbirdContent();
      setSunbirdSearchResults(result.candidates || []);
    } catch (error: any) {
      console.error("[Frontend] Tamil Sunbird search failed", error);
      setErrorHeader(error.message || "Unable to search Sunbird Tamil textbooks.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleUseTamilSunbirdCandidate = async (candidate: SunbirdSearchCandidate) => {
    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage(`Preparing Tamil structure digest from ${candidate.name}...`);
    try {
      const preview = await previewTamilSunbirdStructure(candidate);
      const structureDocument = preview.supportingDocuments.find((document) => document.role === "sunbird_textbook_structure");
      if (!structureDocument?.text?.trim()) {
        throw new Error("Sunbird returned no usable textbook structure digest.");
      }
      setTamilStructureText(structureDocument.text);
      setTamilStructureFileName(structureDocument.fileName || `${candidate.name}.txt`);
      setTamilStructureFileSizeStr(`${Math.max(1, Math.round(structureDocument.text.length / 1024))} KB`);
      setSunbirdPreviewSummary(preview.summary);
    } catch (error: any) {
      console.error("[Frontend] Tamil Sunbird preview failed", error);
      setErrorHeader(error.message || "Unable to prepare Tamil structure from Sunbird.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  /**
   * Save customized/edited JSON curriculum back to application state
   */
  const handleSaveJsonEdit = async () => {
    try {
      const parsed = JSON.parse(editingJsonText);
      if (!currentCurriculumId) {
        setExtractedData(parsed);
        setIsEditingJson(false);
        setErrorHeader(null);
        return;
      }

      setLoading(true);
      setLoadingMessage("Saving edited curriculum and refreshing the planning workspace...");
      const res = await fetch(`/api/curriculums/${currentCurriculumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedCurriculum: parsed,
          fileName,
          sourceText: inputText,
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to save the edited curriculum."));
      }

      const data = await res.json();
      setExtractedData(data.curriculum.extractedCurriculum);
      setEditingJsonText(JSON.stringify(data.curriculum.extractedCurriculum, null, 2));
      setIsEditingJson(false);
      setErrorHeader(null);
      if (data.workspaceId && data.workspace) {
        syncWorkspaceState(data.workspace as PlanningWorkspace);
      }
      await fetchSavedCurriculums();
    } catch (e) {
      const message =
        e instanceof SyntaxError
          ? "Invalid JSON formulation. Please review brackets and commas."
          : (e as Error)?.message || "Unable to save the edited curriculum.";
      setErrorHeader(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCurriculumWorkspace = async () => {
    if (!currentWorkspaceId) {
      setErrorHeader("No planning workspace is attached to this curriculum yet.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Approving curriculum and unlocking course planning...");

    try {
      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/approve-curriculum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Approved from Step 1 review." }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to approve curriculum."));
      }

      const data = await res.json();
      const workspace = data.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    } catch (error: any) {
      console.error("[Frontend] Curriculum approval failed", error);
      setErrorHeader(error.message || "Unable to approve the curriculum for planning.");
    } finally {
      setLoading(false);
    }
  };

  const updateAcademicConfigField = (field: keyof AcademicConfig, value: string | number | null) => {
    setAcademicConfigDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateAcademicCalendarField = (
    field: keyof NonNullable<AcademicConfig["calendar"]>,
    value: string | number | string[] | null
  ) => {
    setAcademicConfigDraft((prev) => ({
      ...prev,
      calendar: {
        ...(prev.calendar || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveAcademicConfig = async () => {
    if (!currentWorkspaceId) {
      setErrorHeader("No planning workspace is attached to this curriculum yet.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Saving academic configuration for course planning...");

    try {
      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicConfig: academicConfigDraft,
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to save academic configuration."));
      }

      const data = await res.json();
      const workspace = data.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    } catch (error: any) {
      console.error("[Frontend] Academic configuration save failed", error);
      setErrorHeader(error.message || "Unable to save the academic configuration.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Divide the accepted curriculum structure into 1-4 Terms according to curriculum size
   */
  const handleDivideTerms = async () => {
    if (!extractedData) return;
    if (!activeWorkspace?.curriculumApproval?.approved) {
      setErrorHeader("Approve the curriculum in Step 1 before generating course or term plans.");
      return;
    }
    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Building the approved course plan and balancing the curriculum into academic terms...");

    try {
      const saveRes = await fetch(`/api/planning-workspaces/${currentWorkspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicConfig: academicConfigDraft,
        }),
      });

      if (!saveRes.ok) {
        throw new Error(await readErrorFromResponse(saveRes, "Failed to save academic configuration before generating the course plan."));
      }

      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/recommend-course-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredTermCount,
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to build the course plan"));
      }

      const termResponse = await res.json();
      const latestRecommendations = (termResponse?.recommendations || []) as TermAllocation[];
      setCoursePlanDraft(latestRecommendations);
      syncTermRowsFromAllocations(latestRecommendations);
      if (termResponse?.workspace) {
        const workspace = termResponse.workspace as PlanningWorkspace;
        setCurrentWorkspaceId(workspace._id);
        setActiveWorkspace(workspace);
        localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
      }
      setActiveStep(2); // Jump to Term Planner table
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Unable to partition syllabus into designated terms.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseRecommendedCoursePlan = async () => {
    if (!currentWorkspaceId || !activeWorkspace?.termPlan?.recommendations?.length) {
      setErrorHeader("Generate course plan recommendations before saving allocations.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Saving recommended course plan as the active term allocation...");

    try {
      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicConfig: academicConfigDraft,
          termPlan: {
            ...(activeWorkspace.termPlan || {}),
            approved: false,
            allocations: activeWorkspace.termPlan.recommendations,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to save the recommended course plan."));
      }

      const data = await res.json();
      const workspace = data.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    } catch (error: any) {
      console.error("[Frontend] Save course plan allocations failed", error);
      setErrorHeader(error.message || "Unable to save the recommended course plan.");
    } finally {
      setLoading(false);
    }
  };

  const updateCoursePlanDraft = (
    index: number,
    field: keyof TermAllocation,
    value: string | number | string[] | null
  ) => {
    setCoursePlanDraft((prev) => {
      const next = prev.map((allocation, allocationIndex) =>
        allocationIndex === index
          ? {
              ...allocation,
              [field]: value,
            }
          : allocation
      );
      syncTermRowsFromAllocations(next);
      return next;
    });
  };

  const handleAddManualTermAllocation = () => {
    setCoursePlanDraft((prev) => {
      const next = [
        ...prev,
        {
          className: academicConfigDraft.className || extractedData?.gradeLevel || "Curriculum",
          termName: `Term ${prev.length + 1}`,
          termNumber: prev.length + 1,
          chapters: [],
          marks: 0,
          reasoning: "",
          estimatedSessions: null,
        },
      ];
      syncTermRowsFromAllocations(next);
      return next;
    });
  };

  const handleRemoveManualTermAllocation = (index: number) => {
    setCoursePlanDraft((prev) => {
      const next = prev.filter((_, allocationIndex) => allocationIndex !== index);
      syncTermRowsFromAllocations(next);
      return next;
    });
  };

  const handleSaveManualCoursePlan = async () => {
    if (!currentWorkspaceId) {
      setErrorHeader("No planning workspace is attached to this curriculum yet.");
      return;
    }

    if (coursePlanDraft.length === 0) {
      setErrorHeader("Add or select at least one term allocation before saving the course plan.");
      return;
    }

    if (!draftValidation.valid) {
      setErrorHeader(draftValidation.issues[0] || "Fix the course plan allocations before saving.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Saving edited course plan allocations...");

    try {
      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicConfig: academicConfigDraft,
          termPlan: {
            ...(activeWorkspace?.termPlan || {}),
            approved: false,
            allocations: coursePlanDraft,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to save the edited course plan."));
      }

      const data = await res.json();
      const workspace = data.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    } catch (error: any) {
      console.error("[Frontend] Manual course plan save failed", error);
      setErrorHeader(error.message || "Unable to save the edited course plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetCoursePlanDraftToRecommendations = () => {
    const recommendations = activeWorkspace?.termPlan?.recommendations || [];
    setCoursePlanDraft(recommendations);
    syncTermRowsFromAllocations(recommendations);
  };

  const handleApproveCoursePlan = async () => {
    if (!currentWorkspaceId) {
      setErrorHeader("No planning workspace is attached to this curriculum yet.");
      return;
    }

    if (coursePlanDraftDirty) {
      setErrorHeader("Save the edited allocations before approving the course plan.");
      return;
    }

    if (!draftValidation.valid) {
      setErrorHeader(draftValidation.issues[0] || "Fix the course plan allocations before approval.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Approving course plan and unlocking session planning...");

    try {
      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/approve-course-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to approve the course plan."));
      }

      const data = await res.json();
      const workspace = data.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    } catch (error: any) {
      console.error("[Frontend] Course plan approval failed", error);
      setErrorHeader(error.message || "Unable to approve the course plan.");
    } finally {
      setLoading(false);
    }
  };

  const updateTeachingStrategyField = (
    field: keyof TeachingStrategy,
    value: string | string[]
  ) => {
    setTeachingStrategyDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleTeachingStrategyArrayValue = (
    field: "teachingStyle" | "bloomsTaxonomyEmphasis" | "assessmentPreference" | "teachingResources",
    value: string
  ) => {
    setTeachingStrategyDraft((prev) => {
      const currentValues = Array.isArray(prev[field]) ? prev[field] as string[] : [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [field]: nextValues,
      };
    });
  };

  const updateSessionPlanningDefaultField = (
    field: keyof SessionPlanningDefaults,
    value: string | number | boolean | null
  ) => {
    setSessionPlanningDefaultsDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSessionAllocationDraft = (
    index: number,
    field: keyof ChapterSessionPlan,
    value: string | number | null
  ) => {
    setSessionAllocationDraft((prev) =>
      prev.map((allocation, allocationIndex) =>
        allocationIndex === index
          ? {
              ...allocation,
              [field]: value,
            }
          : allocation
      )
    );
  };

  const handleSaveSessionStrategy = async () => {
    if (!currentWorkspaceId) {
      setErrorHeader("No planning workspace is attached to this curriculum yet.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Saving Phase 3 session planning setup...");

    try {
      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/session-strategy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teachingStrategy: teachingStrategyDraft,
          sessionPlanningDefaults: sessionPlanningDefaultsDraft,
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to save the session planning setup."));
      }

      const data = await res.json();
      const workspace = data.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    } catch (error: any) {
      console.error("[Frontend] Session strategy save failed", error);
      setErrorHeader(error.message || "Unable to save the session planning setup.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendSessionAllocation = async () => {
    if (!currentWorkspaceId || !selectedTermRow) {
      setErrorHeader("Select an approved term before generating chapter session allocations.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Building chapter-by-chapter session recommendations for the selected term...");

    try {
      const strategyRes = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/session-strategy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teachingStrategy: teachingStrategyDraft,
          sessionPlanningDefaults: sessionPlanningDefaultsDraft,
        }),
      });

      if (!strategyRes.ok) {
        throw new Error(await readErrorFromResponse(strategyRes, "Failed to save the session planning setup."));
      }

      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/recommend-session-allocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedTermKey: getSelectedTermKey(selectedTermRow),
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to generate chapter session recommendations."));
      }

      const data = await res.json();
      const workspace = data.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      setSessionAllocationDraft(data.recommendations || []);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    } catch (error: any) {
      console.error("[Frontend] Session allocation recommendation failed", error);
      setErrorHeader(error.message || "Unable to generate chapter session recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSessionAllocation = async () => {
    if (!currentWorkspaceId || !selectedTermRow) {
      setErrorHeader("Select an approved term before saving chapter session allocations.");
      return;
    }

    const validation = validateSessionAllocationDraft(sessionAllocationDraft, selectedTermRow, activeWorkspace);
    if (!validation.valid) {
      setErrorHeader(validation.issues[0] || "Fix the session allocation before saving.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Saving chapter session allocations...");

    try {
      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/session-allocation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedTermKey: getSelectedTermKey(selectedTermRow),
          selectedTermSummary: {
            className: selectedTermRow.className || "Curriculum",
            termName: selectedTermRow.term,
            termNumber: selectedTermRow.termNumber ?? null,
            chapterCount: selectedTermRow.chapters.length,
            marks: selectedTermRow.marks,
            totalRows: (savedTermAllocations || []).filter((allocation) => getAllocationTermKey(allocation) === getSelectedTermKey(selectedTermRow)).length,
            recurringStrands: selectedTermRow.recurringStrands || [],
          },
          allocations: sessionAllocationDraft.map((allocation, index) => ({
            ...allocation,
            sequence: Number(allocation.sequence || index + 1),
            estimatedSessions: Number(allocation.estimatedSessions || 0),
            estimatedMinutes:
              Number(allocation.estimatedSessions || 0) *
              Number(sessionPlanningDefaultsDraft.sessionDurationMinutes || academicConfigDraft.periodDurationMinutes || 45),
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to save the chapter session allocations."));
      }

      const data = await res.json();
      const workspace = data.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    } catch (error: any) {
      console.error("[Frontend] Session allocation save failed", error);
      setErrorHeader(error.message || "Unable to save the chapter session allocations.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSessionAllocationToRecommendations = () => {
    setSessionAllocationDraft(activeWorkspace?.sessionAllocation?.recommendations || []);
  };

  const handleApproveSessionAllocation = async () => {
    if (!currentWorkspaceId) {
      setErrorHeader("No planning workspace is attached to this curriculum yet.");
      return;
    }

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage("Approving Phase 3 session planning and unlocking content generation...");

    try {
      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/approve-session-allocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed to approve the session allocation."));
      }

      const data = await res.json();
      const workspace = data.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    } catch (error: any) {
      console.error("[Frontend] Session allocation approval failed", error);
      setErrorHeader(error.message || "Unable to approve the session allocation.");
    } finally {
      setLoading(false);
    }
  };

  const curriculumApproved = !!activeWorkspace?.curriculumApproval?.approved;
  const savedTermAllocations = activeWorkspace?.termPlan?.allocations || [];
  const recommendedTermAllocations = activeWorkspace?.termPlan?.recommendations || [];
  const draftValidation = validateCoursePlanAllocations(coursePlanDraft);
  const coursePlanDraftDirty =
    JSON.stringify(normalizeAllocationsForComparison(coursePlanDraft)) !==
    JSON.stringify(normalizeAllocationsForComparison(savedTermAllocations));
  const effectiveCoursePlanApproved =
    !!activeWorkspace?.termPlan?.approved && !coursePlanDraftDirty && draftValidation.valid;
  const coursePlanApproved = effectiveCoursePlanApproved;
  const recommendationTermCount = countUniqueTerms(recommendedTermAllocations);
  const savedTermCount = countUniqueTerms(savedTermAllocations);
  const draftTermCount = countUniqueTerms(coursePlanDraft);
  const savedSessionStrategy = activeWorkspace?.teachingStrategy || {};
  const savedSessionDefaults = getSessionPlanningDefaultsSeed(activeWorkspace);
  const savedSessionAllocations = activeWorkspace?.sessionAllocation?.allocations || [];
  const recommendedSessionAllocations = activeWorkspace?.sessionAllocation?.recommendations || [];
  const sessionStrategyDirty =
    JSON.stringify(normalizeSessionStrategyForComparison(teachingStrategyDraft)) !==
      JSON.stringify(normalizeSessionStrategyForComparison(savedSessionStrategy)) ||
    JSON.stringify(normalizeSessionDefaultsForComparison(sessionPlanningDefaultsDraft)) !==
      JSON.stringify(normalizeSessionDefaultsForComparison(savedSessionDefaults));
  const sessionAllocationDraftDirty =
    JSON.stringify(normalizeChapterSessionPlansForComparison(sessionAllocationDraft)) !==
    JSON.stringify(normalizeChapterSessionPlansForComparison(savedSessionAllocations));
  const sessionAllocationValidation = validateSessionAllocationDraft(sessionAllocationDraft, selectedTermRow, activeWorkspace);
  const selectedTermCapacity = getSelectedTermCapacity(selectedTermRow, savedTermAllocations, activeWorkspace?.academicConfig || academicConfigDraft);
  const sessionPlanApproved =
    !!activeWorkspace?.sessionAllocation?.approved &&
    !sessionStrategyDirty &&
    !sessionAllocationDraftDirty &&
    sessionAllocationValidation.valid;
  const contentIncludesLearningOutcomes = true;
  const contentIncludesIntroduction = true;
  const contentIncludesTheory = true;
  const contentIncludesAssessments = sessionPlanningDefaultsDraft.includeFormativeAssessment ?? true;
  const contentIncludesAssignments = false;
  const contentIncludesNotes = sessionPlanningDefaultsDraft.includeTeacherNotes ?? true;
  const effectiveSessionAllocations = savedSessionAllocations.length > 0 ? savedSessionAllocations : sessionAllocationDraft;
  const selectedTermSessionAllocations = effectiveSessionAllocations.filter(
    (allocation) => getSelectedTermKey({
      className: allocation.className,
      term: allocation.termName,
      termNumber: allocation.termNumber ?? undefined,
    }) === getSelectedTermKey(selectedTermRow)
  );
  const selectedTermSessionCount = selectedTermSessionAllocations.reduce(
    (sum, allocation) => sum + Number(allocation.estimatedSessions || 0),
    0
  );
  const workspaceConfidence =
    activeWorkspace?.curriculumApproval?.confidence ??
    (extractedData as any)?.structure_confidence ??
    (extractedData as any)?.profile_confidence ??
    null;
  const workspaceConfidencePercent =
    workspaceConfidence == null
      ? null
      : Number(workspaceConfidence) > 1
        ? Math.round(Number(workspaceConfidence))
        : Math.round(Number(workspaceConfidence) * 100);
  const normalizedCurriculum =
    (extractedData as any)?.normalizedStructure ||
    (extractedData as any)?.stagedExtraction?.normalizedStructure ||
    null;
  const extractionStatistics = (extractedData as any)?.stagedExtraction?.statistics || null;
  const extractedLearningOutcomes = Array.isArray((extractedData as any)?.stagedExtraction?.learningOutcomes?.learning_outcomes)
    ? (extractedData as any).stagedExtraction.learningOutcomes.learning_outcomes
    : [];
  const normalizedClasses = Array.isArray(normalizedCurriculum?.classes) ? normalizedCurriculum.classes : [];
  const normalizedUnits = normalizedClasses.flatMap((cls: any) => cls?.units || []);
  const normalizedChapters = normalizedUnits.flatMap((unit: any) => unit?.chapters || []);
  const canonicalUnitsCount =
    Number(extractionStatistics?.total_units || 0) ||
    normalizedUnits.length ||
    extractedData?.units?.length ||
    0;
  const totalTopicsCount = normalizedUnits.length > 0
    ? normalizedUnits.reduce((sum: number, unit: any) => {
        const unitTopicCount = (unit?.topics || []).length;
        const chapterTopicCount = (unit?.chapters || []).reduce(
          (chapterSum: number, chapter: any) => chapterSum + ((chapter?.topics || []).length || 0),
          0
        );
        return sum + unitTopicCount + chapterTopicCount;
      }, 0)
    : Array.isArray(extractedData?.units)
      ? extractedData.units.reduce((sum, unit) => sum + (unit.topics?.length || 0), 0)
      : 0;
  const resolvedTopicsCount = Number(extractionStatistics?.total_topics || 0) || totalTopicsCount;
  const totalSubtopicsCount = normalizedUnits.length > 0
    ? normalizedUnits.reduce((sum: number, unit: any) => {
        const unitSubtopicCount = (unit?.subtopics || []).length;
        const chapterSubtopicCount = (unit?.chapters || []).reduce(
          (chapterSum: number, chapter: any) => chapterSum + ((chapter?.subtopics || []).length || 0),
          0
        );
        return sum + unitSubtopicCount + chapterSubtopicCount;
      }, 0)
    : normalizedChapters.reduce(
        (sum: number, chapter: any) => sum + ((chapter?.subtopics || []).length || 0),
        0
      );
  const resolvedSubtopicsCount = Number(extractionStatistics?.total_subtopics || 0) || totalSubtopicsCount;
  const uniqueLearningOutcomesCount = [
    ...new Set(
      extractedLearningOutcomes.flatMap((entry: any) => entry?.outcomes || []).filter(Boolean)
    ),
  ].length;
  const totalObjectivesCount =
    Number(extractionStatistics?.total_learning_outcomes || 0) ||
    uniqueLearningOutcomesCount ||
    extractedData?.coreObjectives?.length ||
    0;
  const totalPracticalsCount =
    Number(extractionStatistics?.total_practicals || 0) ||
    (Array.isArray(normalizedCurriculum?.practicals) ? normalizedCurriculum.practicals.length : 0) ||
    (Array.isArray((extractedData as any)?.stagedExtraction?.activities?.practicals)
      ? (extractedData as any).stagedExtraction.activities.practicals.length
      : 0);
  const reviewChecklist = [
    {
      label: "Subject and grade detected",
      complete: Boolean(extractedData?.subject && extractedData?.gradeLevel),
    },
    {
      label: "At least one unit extracted",
      complete: canonicalUnitsCount > 0,
    },
    {
      label: "Topics available for planning",
      complete: resolvedTopicsCount > 0,
    },
    {
      label: "Learning outcomes available",
      complete: totalObjectivesCount > 0,
    },
    {
      label: "Planning workspace attached",
      complete: Boolean(currentWorkspaceId),
    },
  ];
  const generatedSessionArtifactKeys = getGeneratedSessionArtifactKeys(activeWorkspace);
  const readySessionCount = new Set([
    ...Array.from(generatedSessionArtifactKeys),
    ...Object.keys(generatedSessions).map((key) => String(key)),
  ]).size;

  /**
   * Term level verification - Proceeding to session specifications
   */
  const handleConfigureSessionsForTerm = (term: TermRow) => {
    if (!coursePlanApproved) {
      setErrorHeader("Approve the course plan in Step 2 before moving to session planning.");
      return;
    }
    setSelectedTermRow(term);
    setActiveStep(3); // Jump to Session Specifier
  };

  /**
   * Generate session structure outline roadmap first based on specifications
   */
  const handleGenerateOutline = async () => {
    if (!selectedTermRow || !sessionPlanApproved) return;
    setActiveStep(4);
  };

  /**
   * On-demand generation of full details for specific Session Number
   */
  const handleBuildSessionDeepDetails = async (sessionNum: number, outlineItem: any, requestedSections: SessionSectionKey[] = allSessionSections) => {
    if (!selectedTermRow || !currentWorkspaceId) return;
    const selectedSections = requestedSections.length ? requestedSections : allSessionSections;

    const previousOutlineItem = sessionsOutline.find((item) => item.sessionNumber === sessionNum - 1);
    const previousGeneratedSession = previousOutlineItem ? generatedSessions[previousOutlineItem.sessionNumber] : null;
    const pptGenerationOptions = getPptGenerationOptions(sessionNum, generatedSessions[sessionNum]);
    const previousSessionContext = previousGeneratedSession
      ? `${previousGeneratedSession.title || `Session ${previousOutlineItem?.sessionNumber}`}: ${
          previousGeneratedSession.teacherLessonNotes?.sessionSummary?.join(" ") ||
          previousGeneratedSession.learningOutcomes?.join(" ") ||
          previousOutlineItem?.title ||
          ""
        }`
      : previousOutlineItem?.title || "";

    setErrorHeader(null);
    setLoading(true);
    setLoadingMessage(
      selectedSections.length === allSessionSections.length
        ? `Generating the complete lesson pack for session ${sessionNum}...`
        : `Generating ${selectedSections.join(", ")} for session ${sessionNum}...`
    );

    try {
      const res = await fetch(`/api/planning-workspaces/${currentWorkspaceId}/generate-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterName: outlineItem.chapterName || selectedTermRow.chapters[0],
          roadmapSessionNumber: sessionNum,
          sessionNumber: outlineItem.chapterSessionNumber || sessionNum,
          totalSessions: outlineItem.chapterTotalSessions || 1,
          durationMinutes:
            outlineItem.duration ||
            Number(sessionPlanningDefaultsDraft.sessionDurationMinutes || academicConfigDraft.periodDurationMinutes || 45),
          sessionTitle: outlineItem.title,
          learningOutcomes: outlineItem.learningOutcomes || [],
          previousSessionContext,
          selectedSections,
          pptGenerationOptions,
          assessmentCustomization: selectedSections.includes("assessment")
            ? buildAssessmentCustomizationPayload(sessionNum)
            : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorFromResponse(res, "Failed session content generation"));
      }

      const detailsResponse = await res.json();
      const details = detailsResponse.sessionPlan as SessionPlan;
      if (detailsResponse.workspace) {
        const workspace = detailsResponse.workspace as PlanningWorkspace;
        setCurrentWorkspaceId(workspace._id);
        setActiveWorkspace(workspace);
        localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
      }
      setGeneratedSessions((prev) => ({
        ...prev,
        [sessionNum]: {
          ...details,
          ...outlineItem,
          id: details.id || outlineItem.id,
          title: details.title || outlineItem.title,
          duration: details.duration || outlineItem.duration,
          sessionNumber: outlineItem.sessionNumber,
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

  const handleGenerateSessionTab = async (
    tabId: typeof activeSubTab,
    sessionNum?: number,
    outlineItem?: any
  ) => {
    const targetOutline = outlineItem || sessionsOutline.find((item) => item.sessionNumber === (sessionNum || activeSessionNumber));
    if (!targetOutline) return;
    const targetSessionNumber = sessionNum || targetOutline.sessionNumber;
    const currentSession = generatedSessions[targetSessionNumber];
    if (tabId === "assessments") {
      const customization = getAssessmentCustomization(targetSessionNumber);
      if (!hasAssessmentSourceContent(currentSession)) {
        setErrorHeader("Generate session teaching content first before creating the assessment.");
        return;
      }
      if (!customization.questionTypes?.length || !customization.totalMarks || !customization.totalQuestions) {
        setErrorHeader("Add at least one assessment question type with marks before generating the assessment.");
        return;
      }
    }
    setActiveSessionNumber(targetSessionNumber);
    await handleBuildSessionDeepDetails(targetSessionNumber, targetOutline, getSectionsForTab(tabId));
  };

  const handleGenerateFullSessionPack = async (sessionNum?: number, outlineItem?: any) => {
    const targetOutline = outlineItem || sessionsOutline.find((item) => item.sessionNumber === (sessionNum || activeSessionNumber));
    if (!targetOutline) return;
    const targetSessionNumber = sessionNum || targetOutline.sessionNumber;
    setActiveSessionNumber(targetSessionNumber);
    await handleBuildSessionDeepDetails(targetSessionNumber, targetOutline, allSessionSections);
  };

  /**
   * Generate All Sessions Sequence (Convenient automated launcher)
   */
  const triggerGenerateAllSessions = async () => {
    if (sessionsOutline.length === 0) return;
    // Process top-down
    for (let i = 0; i < sessionsOutline.length; i++) {
      const item = sessionsOutline[i];
      const isAlreadyGenerated =
        generatedSessionArtifactKeys.has(String(item.sessionNumber)) ||
        Boolean(generatedSessions[item.sessionNumber]);
      if (!isAlreadyGenerated) {
        await handleGenerateFullSessionPack(item.sessionNumber, item);
      }
    }
  };

  /**
   * Custom print trigger for modern layouts
   */
  const handlePrintPlans = () => {
    window.print();
  };

  return (
      <div className="min-h-screen bg-[#FDFEFE] text-[#2B3437] font-sans antialiased selection:bg-[#9FCDD2] selection:text-teal-900 transition-all duration-300">
      
      {/* Dynamic Background Motifs (Montessori Inspired Playful Aesthetics) */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#9FCDD2]/10 to-transparent pointer-events-none rounded-full no-print" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-radial from-[#E9CAB7]/20 to-transparent pointer-events-none rounded-full no-print" />

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
              <span>Overview</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
            {[
              { num: 1, label: "Curriculum" },
              { num: 2, label: "Course Plan" },
              { num: 3, label: "Session Plan" },
              { num: 4, label: "Content" },
              { num: 5, label: "Review" },
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

        {showTamilIndexModal && !loading && (
          <div className="fixed inset-0 z-40 bg-[#2B3437]/45 backdrop-blur-xs flex items-center justify-center p-4 no-print">
            <div className="w-full max-w-2xl rounded-[28px] border-2 border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#36ADAA]">Tamil Curriculum</div>
                  <h3 className="mt-1 text-xl font-display font-black text-slate-900">Upload The Textbook Index</h3>
                  <p className="mt-2 text-sm text-slate-600 max-w-xl">
                    Tamil curriculum parsing needs the textbook index as a second source document so the extraction can preserve the official instructional sequence.
                  </p>
                </div>
                <button
                  onClick={closeTamilIndexModal}
                  className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close Tamil index upload"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <input
                  ref={tamilIndexFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf"
                  onChange={handleTamilIndexFileSelect}
                />
                <input
                  ref={tamilStructureFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf"
                  onChange={handleTamilStructureFileSelect}
                />

                <button
                  onClick={() => tamilIndexFileInputRef.current?.click()}
                  className="w-full rounded-3xl border-2 border-dashed border-slate-200 px-6 py-8 text-center transition hover:border-[#36ADAA] hover:bg-slate-50"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9FCDD2]/25">
                    <BookOpen className="h-6 w-6 text-[#36ADAA]" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">Choose Tamil textbook index file</div>
                  <div className="mt-1 text-xs text-slate-400">Supports `.txt` and `.pdf` files converted into extraction text.</div>
                </button>

                {tamilIndexFileName && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <div className="font-bold text-slate-800">{tamilIndexFileName}</div>
                    <div className="mt-1 text-xs text-slate-500">{tamilIndexFileSizeStr || "Ready for parsing"}</div>
                  </div>
                )}

                <div className="rounded-3xl border border-slate-200 p-4 space-y-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Optional Structure</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">Attach compact textbook structure text</div>
                    <p className="mt-1 text-xs text-slate-500">Upload headings-only Tamil textbook structure to enrich topics and subtopics without sending the full textbook.</p>
                  </div>
                  <button
                    onClick={() => tamilStructureFileInputRef.current?.click()}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Choose textbook structure file
                  </button>
                  {tamilStructureFileName && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      <div className="font-bold">{tamilStructureFileName}</div>
                      <div className="mt-1 text-xs text-emerald-700">{tamilStructureFileSizeStr || "Structure attached"}</div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 p-4 space-y-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Sunbird Assist</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">Fetch textbook structure from Sunbird</div>
                    <p className="mt-1 text-xs text-slate-500">Search a Tamil textbook or collection and convert it into a compact structure digest for this analysis.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={sunbirdSearchQuery}
                      onChange={(e) => setSunbirdSearchQuery(e.target.value)}
                      placeholder="Optional textbook name"
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none"
                    />
                    <button
                      onClick={() => void handleSearchTamilSunbird()}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Search Sunbird
                    </button>
                  </div>
                  {sunbirdSearchResults.length > 0 && (
                    <div className="max-h-52 space-y-2 overflow-y-auto">
                      {sunbirdSearchResults.map((candidate) => (
                        <button
                          key={`${candidate.source}:${candidate.identifier}`}
                          onClick={() => void handleUseTamilSunbirdCandidate(candidate)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:border-[#36ADAA] hover:bg-[#36ADAA]/5"
                        >
                          <div className="text-sm font-bold text-slate-800">{candidate.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {candidate.source} · {(candidate.se_gradeLevels || []).join(", ") || "Class not tagged"} · {(candidate.se_mediums || []).join(", ") || "Medium not tagged"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {sunbirdPreviewSummary && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs text-cyan-900">
                      Sunbird structure ready: {sunbirdPreviewSummary.chapterCandidates} chapter candidates, {sunbirdPreviewSummary.topicCandidates} topic candidates, {sunbirdPreviewSummary.subtopicCandidates} subtopic candidates.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                  We’ll continue the same analysis flow after the required index upload. Structure support is optional enrichment and will never replace the textbook index anchor.
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
                <p className="text-xs text-slate-500">
                  Required because the detected subject is <span className="font-bold text-slate-700">{detectedCurriculumSubject || (requiresTamilIndex ? "Tamil" : "curriculum")}</span>.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={closeTamilIndexModal}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleResumeTamilCurriculumAnalysis()}
                    disabled={!tamilIndexText.trim()}
                    className="rounded-2xl bg-[#36ADAA] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#2f9895] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {pendingCurriculumSelection && !loading && (
          <div className="fixed inset-0 z-40 bg-[#2B3437]/45 backdrop-blur-xs flex items-center justify-center p-4 no-print">
            <div className="w-full max-w-3xl rounded-[28px] border-2 border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#36ADAA]">Multi-Class Curriculum</div>
                  <h3 className="mt-1 text-xl font-display font-black text-slate-900">Choose Which Classes To Extract</h3>
                  <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                    This syllabus contains multiple classes. Choose the class blocks we should extract, and the unselected class content will be skipped entirely.
                  </p>
                </div>
                <button
                  onClick={closePendingCurriculumSelection}
                  className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close class selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {pendingCurriculumSelection.classSummaries.map((summary) => {
                  const checked = selectedClassNamesToStore.includes(summary.className);
                  return (
                    <label
                      key={summary.className}
                      className={`flex items-start gap-4 rounded-3xl border p-4 transition-all cursor-pointer ${
                        checked
                          ? "border-[#36ADAA] bg-[#36ADAA]/5 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedClassNamesToStore((current) =>
                            e.target.checked
                              ? Array.from(new Set([...current, summary.className]))
                              : current.filter((item) => item !== summary.className)
                          );
                        }}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#36ADAA] focus:ring-[#36ADAA]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-display font-black text-slate-900">{summary.className}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            {summary.pageRangeLabel || summary.subject || "Detected in source"}
                          </span>
                        </div>
                        {summary.detectionSource && (
                          <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            Source match: <span className="font-bold text-slate-700">{summary.detectionSource}</span>
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
                <p className="text-xs text-slate-500">
                  Selected: <span className="font-bold text-slate-700">{selectedClassNamesToStore.length}</span> of{" "}
                  <span className="font-bold text-slate-700">{pendingCurriculumSelection.classSummaries.length}</span> classes
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={closePendingCurriculumSelection}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleStoreSelectedCurriculumClasses()}
                    className="rounded-2xl bg-[#36ADAA] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#2f9895] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedClassNamesToStore.length === 0}
                  >
                    Extract Selected Classes
                  </button>
                </div>
              </div>
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
                <span className="text-xs font-bold text-slate-700 font-display">Five-Phase Planner</span>
                <span className="ml-auto text-[10px] bg-sky-50 text-[#1EABDA] px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>

              {/* Navigation Skeleton Placeholders (Disabled / Non-Functional) */}
              <nav className="space-y-2">
                {[
                  { label: "Curriculum Setup", active: activeStep === 1 },
                  { label: "Course Planning", active: activeStep === 2 },
                  { label: "Session Planning", active: activeStep === 3 },
                  { label: "Content Generation", active: activeStep === 4 },
                  { label: "Assessment & Revision", active: activeStep === 5 },
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
                onClick={() => setActiveStep(5)}
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
                    {extractedData?.subject ? "1 Subject" : "No Subject"}
                  </h4>
                  <p className="text-[11px] text-slate-450 font-bold font-sans">
                    {extractedData?.subject || "Awaiting extraction"}
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
                    {extractedData?.units ? `${extractedData.units.length} Units` : "0 Units"}
                  </h4>
                  <p className="text-[11px] text-slate-450 font-bold font-sans">
                    {extractedData?.gradeLevel || "Awaiting extraction"}
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
                    {termsList.length > 0 ? `${termsList.length} Terms` : "0 Terms"}
                  </h4>
                  <p className="text-[11px] text-slate-450 font-bold font-sans">
                    {termsList.reduce((acc, curr) => acc + curr.marks, 0)} Total Marks
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
                    {sessionsOutline.length > 0 ? `${sessionsOutline.length} Sessions` : "0 Sessions"}
                  </h4>
                  <p className="text-[11px] text-slate-450 font-bold font-sans">
                    {sessionsOutline.reduce((acc, curr) => acc + curr.duration, 0)} Total Minutes
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
                    const activeTerms = termsList;

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
                                <td className="p-4 font-display font-black text-slate-800">{termItem.term}</td>
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
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current</div>
                <div className="mt-2 text-sm font-display font-black text-slate-800 truncate">{extractedData?.subject || "No curriculum open"}</div>
                <div className="text-xs text-slate-500 font-semibold truncate">{currentCurriculumId || "No saved curriculum selected"}</div>
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
                  {savedCurriculums.map((curriculum) => (
                    <div key={curriculum._id} className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-display font-black text-slate-800">{curriculum.subject}</span>
                          {currentCurriculumId === curriculum._id && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Active</span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">{curriculum.gradeLevel}</div>
                        <div className="mt-1 text-[11px] text-slate-400 font-medium break-all">{curriculum.fileName || "Untitled upload"} • {new Date(curriculum.updatedAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
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
                  ))}
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
                    onClick={() => setActiveStep(5)}
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
                  <span className="text-xs text-slate-400">PDF and TXT supported</span>
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
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-display font-black text-slate-800">
                              Planning Workspace
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              curriculumApproved
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {curriculumApproved ? "Approved" : "Approval Needed"}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-500">
                            {currentWorkspaceId ? `Workspace ID: ${currentWorkspaceId}` : "Workspace will be attached after analysis."}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
                            <span>{extractedData.subject || "Unknown Subject"}</span>
                            <span>{extractedData.gradeLevel || "Unknown Grade"}</span>
                            {workspaceConfidencePercent != null && (
                              <span>Confidence: {workspaceConfidencePercent}%</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleDownloadCurriculumPdf}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Curriculum PDF
                          </button>
                          <button
                            onClick={handleApproveCurriculumWorkspace}
                            disabled={!currentWorkspaceId || curriculumApproved}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                              !currentWorkspaceId || curriculumApproved
                                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {curriculumApproved ? "Curriculum Approved" : "Approve Curriculum"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Units</div>
                        <div className="mt-1 text-lg font-display font-black text-slate-800">{canonicalUnitsCount}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Topics</div>
                        <div className="mt-1 text-lg font-display font-black text-slate-800">{resolvedTopicsCount}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtopics</div>
                        <div className="mt-1 text-lg font-display font-black text-slate-800">{resolvedSubtopicsCount}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Objectives</div>
                        <div className="mt-1 text-lg font-display font-black text-slate-800">{totalObjectivesCount}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-display font-black text-slate-800">Detected Curriculum Review</h4>
                          <p className="text-xs font-medium text-slate-500">
                            Review the extracted structure, save any edits, then approve to unlock planning.
                          </p>
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 border border-slate-200">
                          Practicals: {totalPracticalsCount}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Summary</div>
                          <div className="mt-2 space-y-2">
                            <div className="text-sm font-bold text-slate-800">
                              {extractedData.subject || "Unknown Subject"} • {extractedData.gradeLevel || "Unknown Grade"}
                            </div>
                            <p className="text-xs leading-relaxed text-slate-600">
                              {extractedData.overallDescription || "No high-level description was generated for this curriculum yet."}
                            </p>
                            {extractedData.coreObjectives?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {extractedData.coreObjectives.slice(0, 6).map((objective, index) => (
                                  <span
                                    key={index}
                                    className="rounded-md bg-[#E9CAB7]/25 px-2 py-1 text-[10px] font-medium text-amber-900"
                                  >
                                    {objective}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Review Checklist</div>
                          <div className="mt-3 space-y-2">
                            {reviewChecklist.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                                  item.complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {item.complete ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                </span>
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

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
                        <div className="flex flex-1 flex-col">
                          <div className="border-b border-slate-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold text-amber-800">
                            Saving curriculum edits will reset approval and downstream planning recommendations so the workflow stays consistent.
                          </div>
                          <textarea
                            value={editingJsonText}
                            onChange={(e) => setEditingJsonText(e.target.value)}
                            className="w-full flex-1 min-h-[320px] p-3 font-mono text-xs bg-slate-900 text-[#3CC583] focus:outline-none overflow-y-auto resize-none"
                          />
                        </div>
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
                        <span className="text-[10px] font-bold text-[#586A71]">
                          {curriculumApproved ? "Auto Term Division" : "Approve Curriculum To Continue"}
                        </span>
                        <button
                          onClick={handleDivideTerms}
                          disabled={!curriculumApproved}
                          className={`text-white font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition ${
                            curriculumApproved
                              ? "bg-[#36ADAA] hover:bg-[#36ADAA]/90"
                              : "bg-slate-300 cursor-not-allowed"
                          }`}
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

        {/* -------------------- STEP 2: COURSE PLANNING -------------------- */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            {!curriculumApproved ? (
              <div className="bg-white p-12 rounded-3xl border-2 border-slate-100 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
                <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-700 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-[#2B3437] text-xl">Curriculum Approval Is Required First</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Complete Phase 1 review and approve the curriculum before building the course plan.
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="px-5 py-3 bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Return to Curriculum Setup
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.4fr] gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-[#586A71]">Phase 2</div>
                          <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800">Course Planning Setup</h2>
                        </div>
                        <button
                          onClick={() => setActiveStep(1)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Back
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Save the academic setup, generate AI term recommendations, then approve the course plan to unlock session planning.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Academic Year</span><input value={academicConfigDraft.academicYear || ""} onChange={(e) => updateAcademicConfigField("academicYear", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="2026-27" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">School</span><input value={academicConfigDraft.school || ""} onChange={(e) => updateAcademicConfigField("school", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="School name" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Board</span><input value={academicConfigDraft.board || ""} onChange={(e) => updateAcademicConfigField("board", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="CBSE / ICSE / State" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Medium</span><input value={academicConfigDraft.medium || ""} onChange={(e) => updateAcademicConfigField("medium", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="English" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Language</span><input value={academicConfigDraft.language || ""} onChange={(e) => updateAcademicConfigField("language", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="English" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class / Grade</span><input value={academicConfigDraft.className || extractedData?.gradeLevel || ""} onChange={(e) => updateAcademicConfigField("className", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="Class IX" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Section</span><input value={academicConfigDraft.section || ""} onChange={(e) => updateAcademicConfigField("section", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="A" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Book</span><input value={academicConfigDraft.book || ""} onChange={(e) => updateAcademicConfigField("book", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="NCERT Mathematics" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Weekly Periods</span><input type="number" min={0} value={academicConfigDraft.weeklyPeriods ?? ""} onChange={(e) => updateAcademicConfigField("weeklyPeriods", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="6" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Period Minutes</span><input type="number" min={0} value={academicConfigDraft.periodDurationMinutes ?? ""} onChange={(e) => updateAcademicConfigField("periodDurationMinutes", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="45" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lab Periods / Week</span><input type="number" min={0} value={academicConfigDraft.labPeriods ?? ""} onChange={(e) => updateAcademicConfigField("labPeriods", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="1" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Working Days</span><input type="number" min={0} value={academicConfigDraft.calendar?.workingDays ?? ""} onChange={(e) => updateAcademicCalendarField("workingDays", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="220" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Revision Weeks</span><input type="number" min={0} value={academicConfigDraft.calendar?.revisionWeeks ?? ""} onChange={(e) => updateAcademicCalendarField("revisionWeeks", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="2" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Buffer Weeks</span><input type="number" min={0} value={academicConfigDraft.calendar?.bufferWeeks ?? ""} onChange={(e) => updateAcademicCalendarField("bufferWeeks", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="1" /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Preferred Terms</span><select value={preferredTermCount} onChange={(e) => setPreferredTermCount(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">{[1, 2, 3, 4].map((count) => (<option key={count} value={count}>{count}</option>))}</select></label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Holiday Calendar</span><textarea value={stringifyMultilineList(academicConfigDraft.calendar?.holidayCalendar)} onChange={(e) => updateAcademicCalendarField("holidayCalendar", parseMultilineList(e.target.value))} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder={"One item per line\nDiwali break\nWinter vacation"} /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Exam Dates</span><textarea value={stringifyMultilineList(academicConfigDraft.calendar?.examDates)} onChange={(e) => updateAcademicCalendarField("examDates", parseMultilineList(e.target.value))} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder={"One item per line\nUnit Test 1 - 2026-08-12\nMid Term - 2026-10-05"} /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">School Events</span><textarea value={stringifyMultilineList(academicConfigDraft.calendar?.schoolEvents)} onChange={(e) => updateAcademicCalendarField("schoolEvents", parseMultilineList(e.target.value))} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder={"One item per line\nScience fair week\nAnnual day rehearsals"} /></label>
                      <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Special Days</span><textarea value={stringifyMultilineList(academicConfigDraft.calendar?.specialDays)} onChange={(e) => updateAcademicCalendarField("specialDays", parseMultilineList(e.target.value))} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder={"One item per line\nNational Mathematics Day\nLab exhibition"} /></label>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button onClick={handleSaveAcademicConfig} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"><Settings className="w-3.5 h-3.5" />Save Academic Setup</button>
                      <button onClick={handleDivideTerms} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36ADAA] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#36ADAA]/90"><Sparkles className="w-3.5 h-3.5" />Generate Course Plan</button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#586A71]">Planner Status</div>
                        <h3 className="text-xl font-display font-extrabold text-slate-800">Term Allocation Review</h3>
                        <p className="text-xs text-slate-500">Recommendations are stored separately from approved allocations so we can keep an edit-friendly workflow.</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${coursePlanApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {coursePlanDraftDirty ? "Draft Has Unsaved Changes" : coursePlanApproved ? "Course Plan Approved" : "Awaiting Approval"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommended Terms</div><div className="mt-1 text-lg font-display font-black text-slate-800">{recommendationTermCount}</div></div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Saved Terms</div><div className="mt-1 text-lg font-display font-black text-slate-800">{savedTermCount}</div></div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Draft Terms</div><div className="mt-1 text-lg font-display font-black text-slate-800">{draftTermCount}</div></div>
                    </div>

                    {(coursePlanDraftDirty || !draftValidation.valid) && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-1">
                        {coursePlanDraftDirty && <div className="font-semibold">The visible term plan has unsaved edits. Save edited allocations before approval.</div>}
                        {!draftValidation.valid && <div>{draftValidation.issues[0]}</div>}
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
                      <div className="text-sm font-display font-black text-slate-800">Phase 2 Checklist</div>
                      {[
                        { label: "Curriculum approved", complete: curriculumApproved },
                        { label: "Academic setup saved", complete: Boolean(activeWorkspace?.academicConfig && Object.keys(activeWorkspace.academicConfig).length > 0) },
                        { label: "Recommendations generated", complete: recommendationTermCount > 0 },
                        { label: "Allocations saved", complete: savedTermCount > 0 },
                        { label: "Draft matches saved plan", complete: !coursePlanDraftDirty },
                        { label: "Draft passes validation", complete: draftValidation.valid },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${item.complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {item.complete ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          </span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleUseRecommendedCoursePlan} disabled={recommendedTermAllocations.length === 0} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${recommendedTermAllocations.length === 0 ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400" : "border border-slate-200 bg-white text-slate-700 hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"}`}><Layers className="w-3.5 h-3.5" />Use Recommendations</button>
                      <button onClick={handleSaveManualCoursePlan} disabled={coursePlanDraft.length === 0 || !draftValidation.valid} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${coursePlanDraft.length === 0 || !draftValidation.valid ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400" : "border border-slate-200 bg-white text-slate-700 hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"}`}><CheckSquare className="w-3.5 h-3.5" />Save Edited Allocations</button>
                      <button onClick={handleApproveCoursePlan} disabled={savedTermCount === 0 || coursePlanApproved || coursePlanDraftDirty || !draftValidation.valid} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${savedTermCount === 0 || coursePlanApproved || coursePlanDraftDirty || !draftValidation.valid ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400" : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}><CheckCircle2 className="w-3.5 h-3.5" />{coursePlanApproved ? "Approved" : "Approve Course Plan"}</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#586A71]">Manual Planning Layer</div>
                      <h3 className="text-xl font-display font-extrabold text-slate-800">Editable Term Allocations</h3>
                      <p className="text-xs text-slate-500">Adjust lesson allocations and recurring strand summaries inside each term before you save the course plan.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleAddManualTermAllocation} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"><Layers className="w-3.5 h-3.5" />Add Term</button>
                      <button onClick={handleResetCoursePlanDraftToRecommendations} disabled={recommendedTermAllocations.length === 0} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${recommendedTermAllocations.length === 0 ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400" : "border border-slate-200 bg-white text-slate-700 hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"}`}><RotateCcw className="w-3.5 h-3.5" />Reset To Recommendations</button>
                    </div>
                  </div>

                  {coursePlanDraft.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Generate recommendations or add a term manually to start editing the course plan.</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">A single term can contain multiple allocation rows. Use additional rows when one term needs separate chapter groupings, marks, or session estimates.</div>
                      {coursePlanDraft.map((allocation, index) => (
                        <div key={`${allocation.termName}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="text-sm font-display font-black text-slate-800">{(allocation.termName || `Term ${allocation.termNumber ?? index + 1}`).trim() || `Allocation ${index + 1}`}</div>
                              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{(() => { const { rowNumber, rowCount } = getAllocationRowPosition(coursePlanDraft, index); return rowCount > 1 ? `Allocation Row ${rowNumber} of ${rowCount}` : "Single allocation row"; })()}</div>
                            </div>
                            <button onClick={() => handleRemoveManualTermAllocation(index)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" />Remove</button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                            <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class</span><input value={allocation.className || ""} onChange={(e) => updateCoursePlanDraft(index, "className", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" /></label>
                            <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Term Name</span><input value={allocation.termName || ""} onChange={(e) => updateCoursePlanDraft(index, "termName", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" /></label>
                            <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Term Number</span><input type="number" min={1} value={allocation.termNumber ?? ""} onChange={(e) => updateCoursePlanDraft(index, "termNumber", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" /></label>
                            <label className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Marks</span><input type="number" min={0} value={allocation.marks ?? ""} onChange={(e) => updateCoursePlanDraft(index, "marks", e.target.value ? Number(e.target.value) : 0)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" /></label>
                            <label className="space-y-1 xl:col-span-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estimated Sessions</span><input type="number" min={0} value={allocation.estimatedSessions ?? ""} onChange={(e) => updateCoursePlanDraft(index, "estimatedSessions", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" /></label>
                          </div>
                          <label className="space-y-1 block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chapters</span><textarea value={stringifyMultilineList(allocation.chapters)} onChange={(e) => updateCoursePlanDraft(index, "chapters", parseMultilineList(e.target.value))} className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder={"One chapter per line\nNumber Systems\nPolynomials"} /></label>
                          <label className="space-y-1 block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recurring Strands</span><textarea value={stringifyMultilineList(allocation.recurringStrands)} onChange={(e) => updateCoursePlanDraft(index, "recurringStrands", parseMultilineList(e.target.value))} className="min-h-16 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder={"One recurring strand per line\nReading Skills\nGrammar"} /></label>
                          <label className="space-y-1 block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reasoning</span><textarea value={allocation.reasoning || ""} onChange={(e) => updateCoursePlanDraft(index, "reasoning", e.target.value)} className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="Why this term grouping works for teaching flow, assessments, and calendar constraints." /></label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#586A71]">Term Selection</div>
                      <h3 className="text-xl font-display font-extrabold text-slate-800">Choose The Active Term For Session Planning</h3>
                      <p className="text-xs text-slate-500">Select one term from the current allocation plan to carry into Session Planning, including any recurring English strands assigned to that term.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Marks</div><div className="mt-1 text-lg font-display font-black text-slate-800">{termDivisionStats.totalMarks}</div></div>
                  </div>

                  {termsList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Save the academic setup and generate a course plan recommendation to start Phase 2 review.</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {classTermGroups.map(({ className, termGroups }) => (
                          <div key={className} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-display font-black text-slate-800">{className}</div>
                              <div className="text-[11px] font-semibold text-slate-500">{termGroups.length} terms</div>
                            </div>
                            <div className="space-y-3">
                              {termGroups.map(({ termName, rows, totalMarks, summaryRow }) => {
                                const isTermSelected = selectedTermRow?.id === summaryRow.id;
                                return (
                                  <button key={`${className}-${termName}`} onClick={() => setSelectedTermRow(summaryRow)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${isTermSelected ? "border-[#36ADAA] bg-[#36ADAA]/8" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-sm font-display font-black text-slate-800">{termName}</span>
                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{rows.length} allocation row{rows.length === 1 ? "" : "s"}</span>
                                          {isTermSelected && <span className="rounded-full bg-[#36ADAA] px-2 py-0.5 text-[10px] font-bold text-white">Selected</span>}
                                        </div>
                                        <p className="text-xs font-semibold text-slate-500">{summaryRow.chapters.length} chapter{summaryRow.chapters.length === 1 ? "" : "s"} across {totalMarks} marks</p>
                                        <div className="flex flex-wrap gap-1">
                                          {summaryRow.chapters.map((chapter, chapterIndex) => (
                                            <span key={`${summaryRow.id}-${chapterIndex}`} className="rounded bg-[#9FCDD2]/20 px-2 py-0.5 text-[10px] text-[#2B3437]">{chapter}</span>
                                          ))}
                                        </div>
                                        {Boolean(summaryRow.recurringStrands?.length) && (
                                          <div className="space-y-1">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recurring Strands</div>
                                            <div className="flex flex-wrap gap-1">
                                              {(summaryRow.recurringStrands || []).map((strand, strandIndex) => (
                                                <span key={`${summaryRow.id}-strand-${strandIndex}`} className="rounded-full border border-[#36ADAA]/20 bg-[#36ADAA]/8 px-2 py-0.5 text-[10px] font-semibold text-[#2B3437]">{strand}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-xs font-bold text-[#DE8431]">{totalMarks} marks</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedTermRow && (
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#3CC583]/15 flex items-center justify-center shrink-0"><CheckSquare className="w-5 h-5 text-[#3CC583]" /></div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-display font-black text-slate-800">{selectedTermRow.term}</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">{selectedTermRow.className || "Curriculum"}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${coursePlanApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{coursePlanApproved ? "Phase 3 Unlocked" : "Waiting For Phase 2 Approval"}</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-500">{selectedTermRow.chapters.length} chapter{selectedTermRow.chapters.length === 1 ? "" : "s"} selected with {selectedTermRow.marks} marks across this term.</p>
                              {Boolean(selectedTermRow.recurringStrands?.length) && (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recurring English Strands</div>
                                  <div className="flex flex-wrap gap-1">
                                    {(selectedTermRow.recurringStrands || []).map((strand, strandIndex) => (
                                      <span key={`selected-term-strand-${strandIndex}`} className="rounded-full border border-[#36ADAA]/20 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#2B3437]">{strand}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                          <p className="text-xs text-slate-400">{coursePlanApproved ? "Open Phase 3 to save teaching strategy, generate chapter session allocations, and approve the session plan." : "Approve the course plan using the single Phase 2 approval action above, then continue into Session Planning."}</p>
                        </div>
                      </div>
                      <button onClick={() => handleConfigureSessionsForTerm(selectedTermRow)} disabled={!coursePlanApproved} className={`font-bold text-xs py-3 px-6 rounded-xl transition flex items-center gap-2 shadow-xs ${coursePlanApproved ? "bg-[#2B3437] hover:bg-[#2B3437]/90 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                        {coursePlanApproved ? "Open Session Planner" : "Session Planning Locked"}
                        <Sliders className="w-4 h-4 text-[#E9CAB7]" />
                      </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* -------------------- STEP 3: SESSION SPECS & RESOURCE CONFIG -------------------- */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            {!coursePlanApproved ? (
              <div className="bg-white p-12 rounded-3xl border-2 border-slate-100 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
                <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-700 mx-auto">
                  <Sliders className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-[#2B3437] text-xl">
                    Course Plan Approval Comes Next
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Finish Phase 2 and approve the course plan before defining session preferences and outlines.
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-3 bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Return to Course Planning
                  </button>
                </div>
              </div>
            ) : !selectedTermRow ? (
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
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[#586A71] font-bold min-w-0">
                        <span>Step 3 of LMS Planner</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[#36ADAA]">{selectedTermRow.term}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="truncate">{selectedTermRow.className || "Curriculum"}</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">
                          Phase 3 Session Planning
                        </h2>
                        <p className="text-slate-500 text-xs">
                          Save teaching strategy and AI defaults, generate chapter session allocations for the approved term, then approve the session plan to unlock content generation.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveStep(2)}
                      className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#586A71]">Band A</div>
                        <h3 className="text-xl font-display font-extrabold text-slate-800">Session Planning Setup</h3>
                        <p className="text-xs text-slate-500">These values become the defaults for later single-session generation.</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${sessionStrategyDirty ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {sessionStrategyDirty ? "Unsaved Changes" : "Saved To Workspace"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Student Level</span>
                        <select value={teachingStrategyDraft.studentLevel || ""} onChange={(e) => updateTeachingStrategyField("studentLevel", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                          <option value="">Select level</option>
                          <option value="Foundational support">Foundational support</option>
                          <option value="Grade-level mixed">Grade-level mixed</option>
                          <option value="Strong independent learners">Strong independent learners</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Learning Pace</span>
                        <select value={teachingStrategyDraft.pace || ""} onChange={(e) => updateTeachingStrategyField("pace", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                          <option value="">Select pace</option>
                          <option value="Supportive">Supportive</option>
                          <option value="Balanced">Balanced</option>
                          <option value="Accelerated">Accelerated</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Difficulty</span>
                        <select value={teachingStrategyDraft.targetDifficulty || ""} onChange={(e) => updateTeachingStrategyField("targetDifficulty", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                          <option value="">Select difficulty</option>
                          <option value="Accessible">Accessible</option>
                          <option value="Balanced">Balanced</option>
                          <option value="Stretch">Stretch</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Session Duration</span>
                        <input type="number" min={30} max={90} value={sessionPlanningDefaultsDraft.sessionDurationMinutes ?? ""} onChange={(e) => updateSessionPlanningDefaultField("sessionDurationMinutes", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Output Language</span>
                        <input value={sessionPlanningDefaultsDraft.language || ""} onChange={(e) => updateSessionPlanningDefaultField("language", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reading Level</span>
                        <select value={sessionPlanningDefaultsDraft.readingLevel || ""} onChange={(e) => updateSessionPlanningDefaultField("readingLevel", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                          <option value="Grade-aligned">Grade-aligned</option>
                          <option value="Simplified support">Simplified support</option>
                          <option value="Extended academic">Extended academic</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Response Length</span>
                        <select value={sessionPlanningDefaultsDraft.responseLength || ""} onChange={(e) => updateSessionPlanningDefaultField("responseLength", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                          <option value="Compact">Compact</option>
                          <option value="Balanced">Balanced</option>
                          <option value="Detailed">Detailed</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Creativity</span>
                        <select value={sessionPlanningDefaultsDraft.creativity || ""} onChange={(e) => updateSessionPlanningDefaultField("creativity", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                          <option value="Low">Low</option>
                          <option value="Moderate">Moderate</option>
                          <option value="High">High</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        ["Interactive facilitation", "teachingStyle", "Interactive facilitation"],
                        ["Direct instruction", "teachingStyle", "Direct instruction"],
                        ["Guided discussion", "teachingStyle", "Guided discussion"],
                        ["Hands-on activity", "teachingStyle", "Hands-on activity"],
                        ["Remember + Understand", "bloomsTaxonomyEmphasis", "Remember + Understand"],
                        ["Apply + Analyze", "bloomsTaxonomyEmphasis", "Apply + Analyze"],
                        ["Evaluate + Create", "bloomsTaxonomyEmphasis", "Evaluate + Create"],
                        ["Blackboard", "teachingResources", "Blackboard"],
                        ["Charts / models", "teachingResources", "Charts / models"],
                        ["Low-cost classroom activity", "teachingResources", "Low-cost classroom activity"],
                        ["Projector / PPT", "teachingResources", "Projector / PPT"],
                      ].map(([label, field, value]) => {
                        const fieldName = field as "teachingStyle" | "bloomsTaxonomyEmphasis" | "teachingResources";
                        const active = (teachingStrategyDraft[fieldName] || []).includes(value);
                        return (
                          <button
                            key={`${field}-${value}`}
                            type="button"
                            onClick={() => toggleTeachingStrategyArrayValue(fieldName, value)}
                            className={`rounded-2xl border px-3 py-3 text-left text-xs font-semibold transition ${active ? "border-[#36ADAA] bg-[#36ADAA]/8 text-[#2B3437]" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        ["Include real-world connections", "includeRealWorldConnections"],
                        ["Include differentiation", "includeDifferentiation"],
                        ["Include formative assessment", "includeFormativeAssessment"],
                        ["Include homework", "includeHomework"],
                        ["Include teacher notes", "includeTeacherNotes"],
                      ].map(([label, field]) => (
                        <label key={field} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(sessionPlanningDefaultsDraft[field as keyof SessionPlanningDefaults])}
                            onChange={(e) => updateSessionPlanningDefaultField(field as keyof SessionPlanningDefaults, e.target.checked)}
                            className="accent-[#36ADAA]"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>

                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Special Instructions</span>
                      <textarea value={teachingStrategyDraft.specialInstructions || ""} onChange={(e) => updateTeachingStrategyField("specialInstructions", e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" placeholder="Any classroom constraints, pedagogy preferences, or teacher notes to carry into session generation." />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleSaveSessionStrategy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-[#36ADAA]/30 hover:text-[#36ADAA]">
                        <Settings className="w-3.5 h-3.5" />
                        Save Session Setup
                      </button>
                      <button onClick={handleRecommendSessionAllocation} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36ADAA] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#36ADAA]/90">
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Session Allocation
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#586A71]">Band C</div>
                        <h3 className="text-xl font-display font-extrabold text-slate-800">Approval & Readiness</h3>
                        <p className="text-xs text-slate-500">One approval action controls the Phase 3 lock and unlocks Phase 4.</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${sessionPlanApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {sessionPlanApproved ? "Approved" : sessionAllocationDraftDirty || sessionStrategyDirty ? "Unsaved Changes" : "Awaiting Approval"}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
                      <div className="text-sm font-display font-black text-slate-800">Active Term</div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">{selectedTermRow.className || "Curriculum"}</span>
                        <span className="font-display font-black text-slate-800">{selectedTermRow.term}</span>
                        <span>{selectedTermRow.chapters.length} chapters</span>
                        <span>{selectedTermRow.marks} marks</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
                      <div className="text-sm font-display font-black text-slate-800">Capacity Summary</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Annual Subject Sessions</div>
                          <div className="mt-1 text-lg font-display font-black text-slate-800">{selectedTermCapacity.annualSubjectSessions}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Term Capacity</div>
                          <div className="mt-1 text-lg font-display font-black text-slate-800">{selectedTermCapacity.termCapacity}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allocated Sessions</div>
                          <div className="mt-1 text-lg font-display font-black text-slate-800">{sessionAllocationValidation.allocatedSessions}</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Baseline capacity uses `working days / 5 * weekly periods`: {selectedTermCapacity.workingDays || 0} / {selectedTermCapacity.schoolDaysPerWeek} * {selectedTermCapacity.weeklyPeriods} = {selectedTermCapacity.annualSubjectSessions}.
                      </p>
                    </div>

                    {(sessionStrategyDirty || sessionAllocationDraftDirty || !sessionAllocationValidation.valid) && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-1">
                        {sessionStrategyDirty && <div className="font-semibold">Session setup has unsaved changes.</div>}
                        {sessionAllocationDraftDirty && <div className="font-semibold">Session allocations have unsaved edits.</div>}
                        {!sessionAllocationValidation.valid && <div>{sessionAllocationValidation.issues[0]}</div>}
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
                      <div className="text-sm font-display font-black text-slate-800">Phase 3 Checklist</div>
                      {[
                        { label: "Phase 2 approved", complete: coursePlanApproved },
                        { label: "Session setup saved", complete: !sessionStrategyDirty },
                        { label: "Recommendations generated", complete: recommendedSessionAllocations.length > 0 },
                        { label: "Allocations saved", complete: savedSessionAllocations.length > 0 },
                        { label: "Draft matches saved plan", complete: !sessionAllocationDraftDirty },
                        { label: "Allocation valid", complete: sessionAllocationValidation.valid },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${item.complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {item.complete ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          </span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleSaveSessionAllocation} disabled={sessionAllocationDraft.length === 0 || !sessionAllocationValidation.valid} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${sessionAllocationDraft.length === 0 || !sessionAllocationValidation.valid ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400" : "border border-slate-200 bg-white text-slate-700 hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"}`}>
                        <CheckSquare className="w-3.5 h-3.5" />
                        Save Session Allocation
                      </button>
                      <button onClick={handleApproveSessionAllocation} disabled={savedSessionAllocations.length === 0 || sessionStrategyDirty || sessionAllocationDraftDirty || !sessionAllocationValidation.valid || sessionPlanApproved} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${savedSessionAllocations.length === 0 || sessionStrategyDirty || sessionAllocationDraftDirty || !sessionAllocationValidation.valid || sessionPlanApproved ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400" : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {sessionPlanApproved ? "Approved" : "Approve Session Plan"}
                      </button>
                      <button
                        onClick={() => setActiveStep(4)}
                        disabled={!sessionPlanApproved}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${!sessionPlanApproved ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400" : "bg-[#2B3437] text-white hover:bg-[#2B3437]/90 shadow-xs"}`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Go to Content Generation
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#586A71]">Band B</div>
                      <h3 className="text-xl font-display font-extrabold text-slate-800">Session Allocation</h3>
                      <p className="text-xs text-slate-500">Generate or edit ordered lesson and practice sessions for the approved term.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleResetSessionAllocationToRecommendations} disabled={recommendedSessionAllocations.length === 0} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${recommendedSessionAllocations.length === 0 ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400" : "border border-slate-200 bg-white text-slate-700 hover:border-[#36ADAA]/30 hover:text-[#36ADAA]"}`}>
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset To Recommendations
                      </button>
                    </div>
                  </div>

                  {sessionAllocationDraft.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Save the Phase 3 setup, then generate session recommendations for the selected term.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessionAllocationDraft
                        .slice()
                        .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
                        .map((allocation, index) => (
                          <div key={allocation.id || `${allocation.chapterName}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-display font-black text-slate-800">{allocation.chapterName}</div>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${allocation.sessionKind === "strand_practice" ? "border border-[#36ADAA]/20 bg-[#36ADAA]/10 text-[#2B3437]" : "border border-slate-200 bg-white text-slate-500"}`}>
                                    {allocation.sessionKind === "strand_practice" ? "Practice" : "Lesson"}
                                  </span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-500">Sequence {allocation.sequence || index + 1}</div>
                              </div>
                              <div className="text-xs font-semibold text-slate-500">{allocation.estimatedMinutes || 0} minutes</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <label className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{allocation.sessionKind === "strand_practice" ? "Practice Session" : "Lesson / Chapter"}</span>
                                <input value={allocation.chapterName || ""} onChange={(e) => updateSessionAllocationDraft(index, "chapterName", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order</span>
                                <input type="number" min={1} value={allocation.sequence ?? index + 1} onChange={(e) => updateSessionAllocationDraft(index, "sequence", e.target.value ? Number(e.target.value) : index + 1)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estimated Sessions</span>
                                <input type="number" min={1} value={allocation.estimatedSessions ?? ""} onChange={(e) => updateSessionAllocationDraft(index, "estimatedSessions", e.target.value ? Number(e.target.value) : 1)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estimated Minutes</span>
                                <input value={Number(allocation.estimatedSessions || 0) * Number(sessionPlanningDefaultsDraft.sessionDurationMinutes || academicConfigDraft.periodDurationMinutes || 45)} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 focus:outline-none" />
                              </label>
                            </div>

                            <label className="space-y-1 block">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rationale</span>
                              <textarea value={allocation.rationale || allocation.reasoning || ""} onChange={(e) => updateSessionAllocationDraft(index, "rationale", e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none" />
                            </label>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* -------------------- STEP 4: DELIVERABLE PLANS DISPLAY DASHBOARD -------------------- */}
        {activeStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            {!sessionPlanApproved ? (
              <div className="bg-white p-12 rounded-3xl border-2 border-slate-100 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
                <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-700 mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-[#2B3437] text-xl">
                    Approve Phase 3 First
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Content Generation unlocks only after the Phase 3 session plan is saved and approved for the selected term.
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-5 py-3 bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Return to Session Planning
                  </button>
                </div>
              </div>
            ) : !selectedTermRow || sessionsOutline.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border-2 border-slate-100 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
                <div className="w-16 h-16 bg-[#36ADAA]/15 rounded-3xl flex items-center justify-center text-[#36ADAA] mx-auto">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-[#2B3437] text-xl">
                    No Content Bundle Generated Yet
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Phase 3 is approved for <span className="font-semibold text-slate-700">{selectedTermRow?.term || "the selected term"}</span>. The content dashboard still needs a generated session roadmap before individual lesson packs appear here.
                  </p>
                  {selectedTermRow && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-800">{selectedTermRow.term} session plan</div>
                      <div>{selectedTermRow.chapters.length} chapters</div>
                      <div>{selectedTermSessionCount} planned sessions</div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (selectedTermRow && sessionPlanApproved) {
                        setActiveStep(3);
                      } else if (termsList.length > 0) {
                        setActiveStep(2);
                      } else {
                        setActiveStep(1);
                      }
                    }}
                    className="px-5 py-3 bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {selectedTermRow ? "Review Approved Session Plan" : termsList.length > 0 ? "Go to Step 2: Terms" : "Go to Step 1: Upload"}
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
                      <span className="text-xs text-slate-400">Planned sessions: {selectedTermSessionCount}</span>
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-display font-black text-slate-800 tracking-tight">
                        Academic Timeline: {selectedTermRow.term}
                      </h2>
                      <p className="text-slate-500 text-xs">
                        Review generated lesson packs, study outlines, and presentation assets for the approved session plan.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                      onClick={triggerGenerateAllSessions}
                      className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Generate All Session Packs
                    </button>
                    <button
                      onClick={handleExportAllGeneratedDocuments}
                      className="py-2.5 px-4 rounded-xl bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export All Docs
                    </button>

                    <button
                      onClick={handlePrintPlans}
                      className="py-2.5 px-4 rounded-xl bg-[#586A71] hover:bg-[#586A71]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Session View
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Dashboard Area */}
            <div className="space-y-4">
              <div className="no-print rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Session Navigator</div>
                    <div className="text-xs text-slate-500">
                      {readySessionCount} of {sessionsOutline.length} sessions ready
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = sessionsOutline.findIndex((item) => item.sessionNumber === activeSessionNumber);
                        if (currentIndex > 0) {
                          setActiveSessionNumber(sessionsOutline[currentIndex - 1].sessionNumber);
                        }
                      }}
                      disabled={sessionsOutline.findIndex((item) => item.sessionNumber === activeSessionNumber) <= 0}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Previous
                    </button>
                    <div className="min-w-0">
                      <select
                        value={activeSessionNumber}
                        onChange={(event) => setActiveSessionNumber(Number(event.target.value))}
                        className="w-full min-w-[280px] max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-[#36ADAA] focus:bg-white"
                      >
                        {sessionsOutline.map((item) => {
                          const hasDeepData =
                            generatedSessionArtifactKeys.has(String(item.sessionNumber)) ||
                            Boolean(generatedSessions[item.sessionNumber]);
                          return (
                            <option key={item.id} value={item.sessionNumber}>
                              {`Session ${item.sessionNumber} • ${item.title} • ${item.sessionKind === "strand_practice" ? "Practice" : "Lesson"} • ${hasDeepData ? "Ready" : "Pending"}`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = sessionsOutline.findIndex((item) => item.sessionNumber === activeSessionNumber);
                        if (currentIndex !== -1 && currentIndex < sessionsOutline.length - 1) {
                          setActiveSessionNumber(sessionsOutline[currentIndex + 1].sessionNumber);
                        }
                      }}
                      disabled={sessionsOutline.findIndex((item) => item.sessionNumber === activeSessionNumber) >= sessionsOutline.length - 1}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-4 print-card">
                
                {sessionsOutline.find((item) => item.sessionNumber === activeSessionNumber) ? (
                  (() => {
                    const outlineItem = sessionsOutline.find((item) => item.sessionNumber === activeSessionNumber)!;
                    const session = {
                      ...outlineItem,
                      ...generatedSessions[activeSessionNumber],
                    } as SessionPlan & {
                      chapterName?: string;
                      chapterSessionNumber?: number;
                      chapterTotalSessions?: number;
                    };
                    const activeAssessmentCustomization = getAssessmentCustomization(activeSessionNumber);
                    const assessmentSectionGroups = buildAssessmentSectionGroups(session.assessment);
                    return (
                      <div className="min-w-0 bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-xs space-y-6">
                        
                        {/* Session Main Title Header Banner Block */}
                        <div className="p-6 md:p-8 bg-[#586A71] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                          {/* Creative school motifs inside head bg */}
                          <div className="absolute right-0 top-0 opacity-10 font-bold font-display text-8xl pointer-events-none select-none">
                            LMS
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#E9CAB7] text-[#2B3437] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                                Session Plan {session.sessionNumber} of {selectedTermSessionCount}
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

                          <div className="no-print flex flex-wrap gap-2">
                            <button
                              onClick={() => void handleGenerateFullSessionPack(activeSessionNumber, outlineItem)}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#E9CAB7]/50 bg-[#E9CAB7]/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-[#E9CAB7]/25"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Generate Full Session Pack
                            </button>
                          </div>
                        </div>

                        {/* Sub nav deliverable categories tabs */}
                        <div className="bg-slate-50 px-6 py-2 border-y border-slate-100 flex flex-wrap gap-2 no-print">
                          {sessionTabDefinitions.map((t) => (
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
                        <div className="min-w-0 p-5 md:p-6 xl:p-8 space-y-6 overflow-x-hidden">

                          {/* SUB TAB: Teacher Notes */}
                          {activeSubTab === "teacherNotes" && (
                            <div className="space-y-6 animate-fadeIn">
                              {renderTabGeneratePanel(
                                "teacherNotes",
                                activeSessionNumber,
                                outlineItem,
                                "Teacher Notes",
                                "Generate or refresh the teacher-facing session notes for this lesson."
                              )}
                              {session.teacherLessonNotes ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#36ADAA]/20 bg-[#36ADAA]/6 px-4 py-3">
                                  <div>
                                    <p className="text-sm font-black text-slate-800">Teacher Notes PDF</p>
                                    <p className="text-xs text-slate-500">Download a polished teaching brief with classroom-ready formatting.</p>
                                  </div>
                                  <button
                                    onClick={() => void handleDownloadTeacherNotesPdf(session)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2B3437] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#2B3437]/90"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Download Teacher PDF
                                  </button>
                                </div>
                              ) : null}
                              {session.teacherLessonNotes && (
                                renderTeacherNotesPanel(session.teacherLessonNotes)
                              )}

                              {/* Learning Outcomds if active */}
                              {contentIncludesLearningOutcomes && session.learningOutcomes && (
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
                              {contentIncludesIntroduction && session.introduction && (
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
                              {contentIncludesTheory && session.theory && (
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

                          {/* SUB TAB: Student Notes */}
                          {activeSubTab === "studentNotes" && (
                            <div className="space-y-6 animate-fadeIn">
                              {renderTabGeneratePanel(
                                "studentNotes",
                                activeSessionNumber,
                                outlineItem,
                                "Student Notes",
                                "Generate or refresh the student-facing notes for this session."
                              )}
                              {session.studentLessonNotes ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1F3B4D]/15 bg-[#1F3B4D]/[0.04] px-4 py-3">
                                  <div>
                                    <p className="text-sm font-black text-slate-800">Student Notes PDF</p>
                                    <p className="text-xs text-slate-500">Download a study handout with refined visuals, summaries, and image placement.</p>
                                  </div>
                                  <button
                                    onClick={() => void handleDownloadStudentNotesPdf(session)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F3B4D] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1F3B4D]/90"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Download Student PDF
                                  </button>
                                </div>
                              ) : null}
                              {session.studentLessonNotes ? (
                                renderStudentNotesPanel(session, session.studentLessonNotes)
                              ) : (
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-xs text-slate-500">
                                  Student lesson notes have not been generated for this session yet.
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUB TAB: Materials (PPT/PDF/DOC) */}
                          {activeSubTab === "materials" && (
                            <div className="space-y-6 animate-fadeIn">
                              {renderTabGeneratePanel(
                                "materials",
                                activeSessionNumber,
                                outlineItem,
                                "Materials",
                                "Generate or refresh the PPT, PDF, and DOC support materials for this session.",
                                {
                                  dirty:
                                    getPptGenerationOptions(activeSessionNumber, session).pptTemplateId !== normalizePptTemplateId(session.materials?.ppt?.templateId) ||
                                    getPptGenerationOptions(activeSessionNumber, session).pptThemeId !== (session.materials?.ppt?.themeId || "cbse-academic-blue"),
                                  buttonLabel: session.materials?.ppt ? "Regenerate Materials" : "Generate Materials",
                                }
                              )}
                              
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
                              {activeMaterialTab === "ppt" && (() => {
                                const ppt = session.materials?.ppt;
                                const pptSettings = getPptGenerationOptions(activeSessionNumber, session);
                                const resolvedTemplateId = normalizePptTemplateId(ppt?.templateId || pptSettings.pptTemplateId);
                                const selectedTemplate = PPT_TEMPLATE_OPTIONS.find((item) => item.id === normalizePptTemplateId(pptSettings.pptTemplateId)) || PPT_TEMPLATE_OPTIONS[1];
                                const selectedTheme = PPT_THEME_OPTIONS.find((item) => item.id === pptSettings.pptThemeId) || PPT_THEME_OPTIONS[0];
                                const themePalette = getPptThemePalette(ppt);
                                const slides = getPptSlides(ppt);

                                return (
                                  <div className="space-y-4">
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
                                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">PPT Settings</div>
                                          <h4 className="mt-1 font-display font-black text-slate-800 text-base">Teacher Deck Configuration</h4>
                                          <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                            Choose a classroom-safe template and theme before generating the CBSE-inspired teaching deck.
                                          </p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                                          <div className="font-bold text-slate-700">Visual strategy</div>
                                          <div className="mt-1">SVG/diagram first for explainers, and your Ollama image model for every picture-based visual.</div>
                                        </div>
                                      </div>

                                      <div className="grid gap-4 xl:grid-cols-2">
                                        <div className="space-y-3">
                                          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Template</div>
                                          <div className="grid gap-3">
                                            {PPT_TEMPLATE_OPTIONS.map((option) => {
                                              const active = pptSettings.pptTemplateId === option.id;
                                              return (
                                                <button
                                                  key={option.id}
                                                  type="button"
                                                  onClick={() => updatePptGenerationOption(activeSessionNumber, "pptTemplateId", option.id)}
                                                  className={`rounded-2xl border px-4 py-3 text-left transition ${active ? "border-[#36ADAA] bg-[#36ADAA]/8" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                                                >
                                                  <div className="text-sm font-black text-slate-800">{option.name}</div>
                                                  <div className="mt-1 text-xs leading-relaxed text-slate-500">{option.description}</div>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        <div className="space-y-3">
                                          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Theme</div>
                                          <div className="grid gap-3">
                                            {PPT_THEME_OPTIONS.map((option) => {
                                              const active = pptSettings.pptThemeId === option.id;
                                              return (
                                                <button
                                                  key={option.id}
                                                  type="button"
                                                  onClick={() => updatePptGenerationOption(activeSessionNumber, "pptThemeId", option.id)}
                                                  className={`rounded-2xl border px-4 py-3 text-left transition ${active ? "border-[#36ADAA] bg-[#36ADAA]/8" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <span className="inline-flex h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: option.colors.primary }} />
                                                    <span className="inline-flex h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: option.colors.accent }} />
                                                    <span className="inline-flex h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: option.colors.soft }} />
                                                  </div>
                                                  <div className="mt-2 text-sm font-black text-slate-800">{option.name}</div>
                                                  <div className="mt-1 text-xs leading-relaxed text-slate-500">{option.description}</div>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {ppt ? (
                                      <>
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                          <div className="p-3 border rounded-xl flex items-center gap-2.5 text-xs flex-1" style={{ backgroundColor: `${themePalette.background}`, borderColor: `${themePalette.primary}22`, color: themePalette.primary }}>
                                            <Info className="w-4 h-4 shrink-0" />
                                            <span>Production-ready teacher deck generated from the approved session plan, with real slides, notes, and export-ready visual assets.</span>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            <button
                                              onClick={() => void handleExportPptx(session)}
                                              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
                                              style={{ backgroundColor: themePalette.primary }}
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              Export Editable PPTX
                                            </button>
                                            <button
                                              onClick={() => handleExportPptSlidesPdf(session)}
                                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              Export Slides PDF
                                            </button>
                                          </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                                          <h4 className="font-display font-black text-slate-800 text-base">
                                            {renderMixedMathLine(getPptTitle(ppt))}
                                          </h4>
                                          <div className="grid gap-2 md:grid-cols-2 text-xs text-slate-600">
                                            <div><span className="font-bold text-slate-700">Template:</span> {formatRenderableText(ppt.templateName || selectedTemplate.name)}</div>
                                            <div><span className="font-bold text-slate-700">Theme preset:</span> {formatRenderableText(ppt.themeName || ppt.theme || selectedTheme.name)}</div>
                                            {ppt.audience && <div><span className="font-bold text-slate-700">Audience:</span> {renderMixedMathLine(ppt.audience)}</div>}
                                            <div><span className="font-bold text-slate-700">Deck mode:</span> {formatRenderableText(ppt.deckMode || "teacher-delivery")}</div>
                                          </div>
                                          {ppt.presentationGoal && (
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                              <span className="font-bold text-slate-700">Goal:</span> {renderMixedMathLine(ppt.presentationGoal)}
                                            </p>
                                          )}
                                          {getPptThemeSummary(ppt) && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Theme details:</span> {getPptThemeSummary(ppt)}
                                            </div>
                                          )}
                                          {!!ppt.coverageSummary?.learningOutcomesCovered?.length && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">LO coverage:</span> {ppt.coverageSummary.learningOutcomesCovered.map((item, idx) => <span key={idx} className="mr-2 inline-block">{renderMixedMathLine(item)}</span>)}
                                            </div>
                                          )}
                                          {!!ppt.coverageSummary?.topicsCovered?.length && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Topics:</span> {ppt.coverageSummary.topicsCovered.map((item, idx) => <span key={idx} className="mr-2 inline-block">{renderMixedMathLine(item)}</span>)}
                                            </div>
                                          )}
                                        </div>

                                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                                          {slides.map((slide, sIdx) => {
                                            const accent = getPptAccentStyle(sIdx);
                                            const primaryAsset = getPrimaryPptAsset(slide);
                                            const hasSvgPreview = Boolean(slide.svgDiagram?.svgCode && slide.svgDiagram.svgCode.trim().startsWith("<svg"));
                                            const primaryVisualSrc = formatRenderableText(primaryAsset?.imageDataUrl || primaryAsset?.previewUrl || primaryAsset?.sourceUrl || "");
                                            const visualSourceLabel =
                                              primaryAsset?.sourceKind === "generated-image"
                                                ? "Generated image"
                                                : primaryAsset?.sourceKind === "svg-diagram"
                                                ? "SVG / diagram"
                                                : primaryAsset?.sourceKind === "reusable-external"
                                                ? "Legacy external"
                                                : hasSvgPreview
                                                ? "SVG / diagram"
                                                : "Planned visual";
                                            const previewColumns =
                                              resolvedTemplateId === "visual-focus"
                                                ? "2fr 3fr"
                                                : resolvedTemplateId === "textbook-clean"
                                                ? "3.2fr 2fr"
                                                : "3fr 2fr";

                                            return (
                                              <div key={sIdx} className="space-y-3">
                                                <div className="rounded-[28px] border border-slate-200 p-4 shadow-sm" style={{ backgroundColor: themePalette.background }}>
                                                  <div className="mb-3 flex items-center justify-between px-1">
                                                    <div className="flex items-center gap-2">
                                                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white ${accent.bar}`}>
                                                        {slide.slideNumber || sIdx + 1}
                                                      </span>
                                                      <div>
                                                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                                                          {renderMixedMathLine(slide.templateSlideTitle || "PowerPoint Slide Preview")}
                                                        </div>
                                                        <div className="text-sm font-display font-black text-slate-800">
                                                          {renderMixedMathLine(slide.slideTitle || `Slide ${sIdx + 1}`)}
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${accent.soft} ${accent.text}`}>
                                                        {formatRenderableText(slide.slideType || "concept")}
                                                      </span>
                                                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 border border-slate-200">
                                                        {visualSourceLabel}
                                                      </span>
                                                    </div>
                                                  </div>

                                                  <div className="aspect-video overflow-hidden rounded-[22px] border border-slate-300 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                                                    <div className="h-4 w-full" style={{ backgroundColor: themePalette.primary }} />
                                                    <div className="grid h-[calc(100%-1rem)] gap-0" style={{ gridTemplateColumns: previewColumns }}>
                                                      <div className="flex min-w-0 flex-col px-8 py-7">
                                                        <div className="mb-5">
                                                          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                            {renderMixedMathLine(getPptTitle(ppt))}
                                                          </div>
                                                          <h5 className="mt-2 leading-tight" style={{ color: themePalette.text, fontSize: resolvedTemplateId === "textbook-clean" ? "1.55rem" : "1.75rem", fontWeight: 900, fontFamily: ppt.themeTokens?.fonts?.heading || "Georgia, serif" }}>
                                                            {renderMixedMathLine(slide.slideTitle || `Slide ${sIdx + 1}`)}
                                                          </h5>
                                                        </div>

                                                        {!!slide.onSlideText?.length && (
                                                          <div className="mb-4 flex flex-wrap gap-2">
                                                            {slide.onSlideText.slice(0, 3).map((item, idx) => (
                                                              <span key={idx} className={`rounded-full px-3 py-1 text-[10px] font-bold ${accent.soft} ${accent.text}`}>
                                                                {renderMixedMathLine(item)}
                                                              </span>
                                                            ))}
                                                          </div>
                                                        )}

                                                        <div className="space-y-3">
                                                          {(slide.bulletPoints || []).slice(0, resolvedTemplateId === "visual-focus" ? 4 : 5).map((bp, bpIdx) => (
                                                            <div key={bpIdx} className="flex items-start gap-3">
                                                              <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${accent.bar}`} />
                                                              <p className="text-[13px] leading-6" style={{ color: themePalette.text }}>
                                                                {renderMixedMathLine(bp)}
                                                              </p>
                                                            </div>
                                                          ))}
                                                        </div>

                                                        <div className="mt-auto pt-5">
                                                          <div className="grid grid-cols-2 gap-3">
                                                            {slide.studentTakeaway && (
                                                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Takeaway</div>
                                                                <div className="mt-1 text-[11px] leading-5 text-slate-700">
                                                                  {renderMixedMathLine(slide.studentTakeaway)}
                                                                </div>
                                                              </div>
                                                            )}
                                                            {slide.timeEstimateMinutes != null && (
                                                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Timing</div>
                                                                <div className="mt-1 text-[11px] leading-5 text-slate-700">
                                                                  {formatRenderableText(slide.timeEstimateMinutes)} minutes
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      <div className="min-w-0 border-l border-slate-200 bg-slate-50/70 px-5 py-6">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                                          Visual Panel
                                                        </div>
                                                        <div className="mt-3 flex h-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                                                          {primaryVisualSrc ? (
                                                            <img
                                                              src={primaryVisualSrc}
                                                              alt={formatRenderableText(primaryAsset?.altText || primaryAsset?.purpose || "Slide visual")}
                                                              className="h-full w-full object-cover"
                                                              loading="lazy"
                                                              referrerPolicy="no-referrer"
                                                            />
                                                          ) : hasSvgPreview ? (
                                                            <div
                                                              className="flex h-full w-full items-center justify-center bg-white p-4 [&_svg]:h-full [&_svg]:w-full [&_svg]:max-h-full [&_svg]:max-w-full"
                                                              dangerouslySetInnerHTML={{ __html: slide.svgDiagram?.svgCode || "" }}
                                                            />
                                                          ) : (
                                                            <div className="flex h-full flex-col justify-between p-4">
                                                              <div>
                                                                <div className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${accent.soft} ${accent.text}`}>
                                                                  {slide.svgDiagram?.title
                                                                    ? renderMixedMathLine(slide.svgDiagram.title)
                                                                    : "Planned visual"}
                                                                </div>
                                                                <p className="mt-3 text-xs leading-5 text-slate-600">
                                                                  {renderMixedMathLine(slide.visualPlan || "This slide uses a teacher-planned visual area in the final PPT.")}
                                                                </p>
                                                              </div>
                                                              {!!slide.svgDiagram?.instructions?.length && (
                                                                <ul className="space-y-2 text-[11px] leading-4 text-slate-500">
                                                                  {slide.svgDiagram.instructions.slice(0, 4).map((item, idx) => (
                                                                    <li key={idx} className="flex gap-2">
                                                                      <span className={`mt-1 inline-block h-2 w-2 rounded-full ${accent.bar}`} />
                                                                      <span>{renderMixedMathLine(item)}</span>
                                                                    </li>
                                                                  ))}
                                                                </ul>
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="grid gap-3 md:grid-cols-2">
                                                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Speaker Notes</div>
                                                    {slide.teacherIntent && (
                                                      <p className="text-xs leading-relaxed text-slate-600">
                                                        <span className="font-bold text-slate-700">Teacher intent:</span> {renderMixedMathLine(slide.teacherIntent)}
                                                      </p>
                                                    )}
                                                    {!!slide.speakerNotes?.length ? (
                                                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                                                        {slide.speakerNotes.map((item, idx) => <li key={idx}>{renderMixedMathLine(item)}</li>)}
                                                      </ul>
                                                    ) : (
                                                      <p className="text-xs text-slate-500">No speaker notes were returned for this slide.</p>
                                                    )}
                                                  </div>

                                                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Visual & Attribution</div>
                                                    {slide.visualPlan && (
                                                      <p className="text-xs leading-relaxed text-slate-600">
                                                        <span className="font-bold text-slate-700">Visual plan:</span> {renderMixedMathLine(slide.visualPlan)}
                                                      </p>
                                                    )}
                                                    {!!slide.assets?.length && slide.assets.map((asset, assetIdx) => (
                                                      <div key={assetIdx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                                                        <div className="flex flex-wrap gap-2">
                                                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                                                            {formatRenderableText(asset.sourceKind || "visual")}
                                                          </span>
                                                          {asset.model && (
                                                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                                                              {formatRenderableText(asset.model)}
                                                            </span>
                                                          )}
                                                        </div>
                                                        {asset.purpose && <div><span className="font-bold text-slate-700">Purpose:</span> {renderMixedMathLine(asset.purpose)}</div>}
                                                        {asset.searchQuery && <div><span className="font-bold text-slate-700">Search:</span> {renderMixedMathLine(asset.searchQuery)}</div>}
                                                        {(asset.sourceSite || asset.sourceUrl) && <div><span className="font-bold text-slate-700">Source:</span> {[asset.sourceSite, asset.sourceUrl].filter(Boolean).map((item) => formatRenderableText(item)).join(" - ")}</div>}
                                                        {asset.licenseType && <div><span className="font-bold text-slate-700">License:</span> {formatRenderableText(asset.licenseType)}</div>}
                                                      </div>
                                                    ))}
                                                    {!slide.assets?.length && slide.svgDiagram && (
                                                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                                                        <div><span className="font-bold text-slate-700">Diagram:</span> {renderMixedMathLine(slide.svgDiagram.title || slide.svgDiagram.type || "SVG-supported visual")}</div>
                                                        {!!slide.svgDiagram.instructions?.length && (
                                                          <div><span className="font-bold text-slate-700">Instructions:</span> {slide.svgDiagram.instructions.map((item, idx) => <span key={idx} className="mr-2 inline-block">{renderMixedMathLine(item)}</span>)}</div>
                                                        )}
                                                      </div>
                                                    )}
                                                    {!!slide.animationHints?.length && (
                                                      <p className="text-xs leading-relaxed text-slate-600">
                                                        <span className="font-bold text-slate-700">Animation:</span> {slide.animationHints.map((item, idx) => <span key={idx} className="mr-2 inline-block">{renderMixedMathLine(item)}</span>)}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {!!ppt.licenseChecklist?.length && (
                                          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">License Checklist</div>
                                            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                                              {ppt.licenseChecklist.map((item, idx) => <li key={idx}>{renderMixedMathLine(item)}</li>)}
                                            </ul>
                                          </div>
                                        )}
                                        {!!ppt.presentationWarnings?.length && (
                                          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-2">
                                            <div className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest">Presentation Warnings</div>
                                            <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                                              {ppt.presentationWarnings.map((item, idx) => <li key={idx}>{renderMixedMathLine(item)}</li>)}
                                            </ul>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                                        <div className="text-sm font-display font-black text-slate-800">No PPT Generated Yet</div>
                                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                          Choose the template and theme above, then generate materials to create the teacher-ready deck.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

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
                                      {renderMixedMathLine(session.materials.pdf.documentTitle)}
                                    </h4>
                                    <span className="text-xs text-slate-400 font-sans italic">
                                      Classroom Fact sheet & Printable Reference Guide
                                    </span>
                                  </div>

                                  <div className="space-y-4 pt-2">
                                    <span className="font-sans font-extrabold text-[11px] uppercase tracking-wider text-[#586A71] block">
                                      I. Student Study Notes / Revision Points
                                    </span>
                                    <ul className="text-xs space-y-2 list-decimal list-inside pl-2">
                                      {session.materials.pdf.keyInformation.map((info, idx) => (
                                        <li key={idx} className="leading-relaxed">
                                          {renderMixedMathLine(info)}
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
                                      {renderMixedMathLine(session.materials.docx.outlineTitle)}
                                    </h4>

                                    <div className="space-y-2">
                                      {session.materials.docx.sections.map((sec, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 text-xs leading-relaxed">
                                          {renderMixedMathLine(sec)}
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
                              {renderTabGeneratePanel(
                                "homework",
                                activeSessionNumber,
                                outlineItem,
                                "Homework",
                                "Generate or refresh the homework pack aligned to this session."
                              )}
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

                                  {session.homework.task ? (
                                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                                      <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 text-slate-400">
                                        <span>Task Directive</span>
                                        {getHomeworkDisplayTime(session.homework) && (
                                          <span className="font-mono bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-bold">
                                            🕒 Expected Completion: {getHomeworkDisplayTime(session.homework)}
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs text-slate-700 font-medium leading-relaxed pt-1">
                                        {renderMixedMathLine(session.homework.task)}
                                      </p>
                                    </div>
                                  ) : getStructuredHomeworkItems(session.homework).length > 0 ? (
                                    <div className="space-y-4">
                                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                                        <div className="flex flex-wrap justify-between gap-2 items-center text-xs pb-2 border-b border-slate-100 text-slate-400">
                                          <span>Structured Homework Plan</span>
                                          {getHomeworkDisplayTime(session.homework) && (
                                            <span className="font-mono bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-bold">
                                              🕒 Expected Completion: {getHomeworkDisplayTime(session.homework)}
                                            </span>
                                          )}
                                        </div>
                                        {session.homework.summary && (
                                          <div className="grid gap-2 md:grid-cols-3 text-xs text-slate-600">
                                            {session.homework.summary.totalQuestions != null && (
                                              <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                <span className="font-bold text-slate-700">Questions:</span> {formatRenderableText(session.homework.summary.totalQuestions)}
                                              </div>
                                            )}
                                            {session.homework.summary.totalMarks != null && (
                                              <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                <span className="font-bold text-slate-700">Marks:</span> {formatRenderableText(session.homework.summary.totalMarks)}
                                              </div>
                                            )}
                                            {session.homework.summary.estimatedCompletionTime && (
                                              <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                <span className="font-bold text-slate-700">Time:</span> {formatRenderableText(session.homework.summary.estimatedCompletionTime)}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {getStructuredHomeworkItems(session.homework).map((item) => (
                                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                                          <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                                {formatRenderableText(item.type || `Task ${item.id}`)}
                                              </div>
                                              <div className="font-bold text-sm text-slate-800 mt-1">
                                                {renderMixedMathLine(item.title || item.question || `Homework Task ${item.id}`)}
                                              </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-[10px]">
                                              {item.difficulty && (
                                                <span className="rounded-full bg-violet-50 px-2 py-1 font-bold text-violet-700">
                                                  {formatRenderableText(item.difficulty)}
                                                </span>
                                              )}
                                              {item.marks != null && (
                                                <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700">
                                                  {formatRenderableText(item.marks)} marks
                                                </span>
                                              )}
                                              {item.estimatedTime && (
                                                <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700">
                                                  {formatRenderableText(item.estimatedTime)}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {item.instructions && (
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                              <span className="font-bold text-slate-800">Instructions:</span> {renderMixedMathLine(item.instructions)}
                                            </p>
                                          )}
                                          {item.question && (
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                              <span className="font-bold text-slate-800">Question:</span> {renderMixedMathLine(item.question)}
                                            </p>
                                          )}
                                          {!!item.options?.length && (
                                            renderRichList(item.options, { className: "list-disc list-inside text-xs text-slate-700 space-y-1" })
                                          )}
                                          {item.answerSpace && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Answer space:</span> {renderMixedMathLine(item.answerSpace)}
                                            </p>
                                          )}
                                          {item.visualRequirement && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Visual requirement:</span> {renderMixedMathLine(item.visualRequirement)}
                                            </p>
                                          )}
                                          {item.expectedResponse && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Expected response:</span> {renderMixedMathLine(item.expectedResponse)}
                                            </p>
                                          )}
                                          {!!item.topicCoverage?.length && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Topics:</span> {item.topicCoverage.map((topic) => formatRenderableText(topic)).join("; ")}
                                            </p>
                                          )}
                                          {!!item.learningOutcomeIds?.length && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Learning outcomes:</span> {item.learningOutcomeIds.map((outcome) => formatRenderableText(outcome)).join("; ")}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                                      <p className="text-xs text-slate-500 leading-relaxed">
                                        Homework data was returned, but it does not match a renderable homework format yet.
                                      </p>
                                    </div>
                                  )}

                                  <div className="text-[11px] text-slate-400">
                                    Tip: Encourage children to write this down in their physical academic logs!
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400">
                                  Homework output is turned off or was not returned for this generated session pack.
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUB TAB: Assessments */}
                          {activeSubTab === "assessments" && (
                            <div className="space-y-6 animate-fadeIn">
                              <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-5 no-print">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-sm font-display font-black text-slate-800">Marks & questions</div>
                                      {isAssessmentCustomizationDirty(activeSessionNumber, session) && (
                                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                                          Customization changed
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {!hasAssessmentSourceContent(session)
                                        ? "Generate session teaching content first. Assessment generation uses the current session notes/content as its source of truth."
                                        : "Set the assessment pattern for this session. The generator will follow these teacher inputs exactly."}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextType = assessmentQuestionTypeCatalog.find(
                                          (item) => !(activeAssessmentCustomization.questionTypes || []).some((entry) => entry.type === item.type)
                                        );
                                        if (!nextType) return;
                                        updateAssessmentCustomization(activeSessionNumber, (draft) => ({
                                          ...draft,
                                          questionTypes: [
                                            ...(draft.questionTypes || []),
                                            {
                                              type: nextType.type,
                                              label: nextType.label,
                                              questionCount: 1,
                                              marksEach: nextType.defaultMarksEach,
                                            },
                                          ],
                                        }));
                                      }}
                                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#7C5CE0] transition hover:border-[#7C5CE0]/30 hover:bg-[#7C5CE0]/5"
                                    >
                                      Add type +
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        !hasAssessmentSourceContent(session) ||
                                        !activeAssessmentCustomization.questionTypes?.length ||
                                        !activeAssessmentCustomization.totalMarks ||
                                        !activeAssessmentCustomization.totalQuestions
                                      }
                                      onClick={() => void handleGenerateSessionTab("assessments", activeSessionNumber, outlineItem)}
                                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                                        !hasAssessmentSourceContent(session) ||
                                        !activeAssessmentCustomization.questionTypes?.length ||
                                        !activeAssessmentCustomization.totalMarks ||
                                        !activeAssessmentCustomization.totalQuestions
                                          ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                          : "border border-[#36ADAA]/20 bg-[#36ADAA] text-white hover:bg-[#36ADAA]/90"
                                      }`}
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Generate Assessment
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total marks</div>
                                    <div className="mt-2 text-2xl font-display font-black text-slate-800">{activeAssessmentCustomization.totalMarks || 0}</div>
                                  </div>
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total questions</div>
                                    <div className="mt-2 text-2xl font-display font-black text-slate-800">{activeAssessmentCustomization.totalQuestions || 0}</div>
                                  </div>
                                  <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Difficulty</span>
                                    <select
                                      value={activeAssessmentCustomization.difficulty || "Balanced"}
                                      onChange={(e) => updateAssessmentCustomization(activeSessionNumber, (draft) => ({ ...draft, difficulty: e.target.value }))}
                                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none"
                                    >
                                      <option value="Accessible">Accessible</option>
                                      <option value="Balanced">Balanced</option>
                                      <option value="Stretch">Stretch</option>
                                    </select>
                                  </label>
                                  <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Assessment type</span>
                                    <input
                                      value={activeAssessmentCustomization.assessmentType || "Session assessment"}
                                      onChange={(e) => updateAssessmentCustomization(activeSessionNumber, (draft) => ({ ...draft, assessmentType: e.target.value }))}
                                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none"
                                      placeholder="Session assessment"
                                    />
                                  </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                  {(activeAssessmentCustomization.questionTypes || []).map((item) => (
                                    <div key={item.type} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-bold text-slate-800">{item.label || assessmentQuestionTypeCatalog.find((entry) => entry.type === item.type)?.label || item.type}</div>
                                        <button
                                          type="button"
                                          onClick={() => updateAssessmentCustomization(activeSessionNumber, (draft) => ({
                                            ...draft,
                                            questionTypes: (draft.questionTypes || []).filter((entry) => entry.type !== item.type),
                                          }))}
                                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:text-red-500"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <label className="space-y-1">
                                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Questions</span>
                                          <input
                                            type="number"
                                            min={0}
                                            value={item.questionCount ?? 0}
                                            onChange={(e) => updateAssessmentCustomization(activeSessionNumber, (draft) => ({
                                              ...draft,
                                              questionTypes: (draft.questionTypes || []).map((entry) => (
                                                entry.type === item.type
                                                  ? { ...entry, questionCount: e.target.value ? Number(e.target.value) : 0 }
                                                  : entry
                                              )),
                                            }))}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none"
                                          />
                                        </label>
                                        <label className="space-y-1">
                                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Marks each</span>
                                          <input
                                            type="number"
                                            min={0}
                                            value={item.marksEach ?? 0}
                                            onChange={(e) => updateAssessmentCustomization(activeSessionNumber, (draft) => ({
                                              ...draft,
                                              questionTypes: (draft.questionTypes || []).map((entry) => (
                                                entry.type === item.type
                                                  ? { ...entry, marksEach: e.target.value ? Number(e.target.value) : 0 }
                                                  : entry
                                              )),
                                            }))}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none"
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <label className="block space-y-2">
                                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Question paper objective (optional)</span>
                                  <textarea
                                    value={activeAssessmentCustomization.paperObjective || ""}
                                    onChange={(e) => updateAssessmentCustomization(activeSessionNumber, (draft) => ({ ...draft, paperObjective: e.target.value }))}
                                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none"
                                    placeholder="Tell chronobot how this paper should feel — exam-style balance, case-based, beginner-friendly, or board pattern."
                                  />
                                </label>
                              </div>

                              {contentIncludesAssessments && session.assessment ? (
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

                                  <div className="rounded-2xl border border-slate-200 bg-white p-4 no-print">
                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Download Options</div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadAssessmentQuestionPaper(session)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Download Question Paper
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadAssessmentAnswerKey(session)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Download Answer Key
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadAssessmentRubrics(session)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Download Rubrics
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadAssessmentJson(session)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Download Question Paper, Answer Key and Rubrics JSON
                                      </button>
                                    </div>
                                  </div>

                                  {(session.assessment.meta || session.assessment.blueprint || session.assessment.paper) && (
                                    <div className="space-y-4">
                                      {session.assessment.meta && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                                          {session.assessment.meta.assessmentType && (
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Assessment Type</div>
                                              <div className="mt-1 text-sm font-bold text-slate-800">{formatRenderableText(session.assessment.meta.assessmentType)}</div>
                                            </div>
                                          )}
                                          {session.assessment.meta.totalMarks != null && (
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Marks</div>
                                              <div className="mt-1 text-sm font-bold text-slate-800">{formatRenderableText(session.assessment.meta.totalMarks)}</div>
                                            </div>
                                          )}
                                          {session.assessment.meta.totalQuestions != null && (
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Questions</div>
                                              <div className="mt-1 text-sm font-bold text-slate-800">{formatRenderableText(session.assessment.meta.totalQuestions)}</div>
                                            </div>
                                          )}
                                          {session.assessment.meta.durationMinutes != null && (
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Duration</div>
                                              <div className="mt-1 text-sm font-bold text-slate-800">{formatRenderableText(session.assessment.meta.durationMinutes)} min</div>
                                            </div>
                                          )}
                                          {session.assessment.meta.preferredDifficulty && (
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Difficulty</div>
                                              <div className="mt-1 text-sm font-bold text-slate-800">{formatRenderableText(session.assessment.meta.preferredDifficulty)}</div>
                                            </div>
                                          )}
                                          {session.assessment.meta.language && (
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Language</div>
                                              <div className="mt-1 text-sm font-bold text-slate-800">{formatRenderableText(session.assessment.meta.language)}</div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {!!session.assessment.paper?.instructions?.length && (
                                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Student Instructions</div>
                                          {renderAssessmentRichList(session.assessment.paper.instructions, { className: "text-sm text-slate-700 list-disc list-inside space-y-2" })}
                                        </div>
                                      )}

                                      {session.assessment.meta?.paperObjective && (
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Paper Objective</div>
                                          <p className="text-xs text-slate-700 leading-relaxed">
                                            {renderMixedMathLine(session.assessment.meta.paperObjective)}
                                          </p>
                                        </div>
                                      )}

                                      {!!session.assessment.meta?.requestedQuestionTypes?.length && (
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Requested Paper Pattern</div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                            {session.assessment.meta.requestedQuestionTypes.map((item, idx) => (
                                              <div key={idx} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                                <span className="font-semibold text-slate-800">{formatRenderableText(item.label || formatAssessmentSubtypeLabel(item.type))}</span>
                                                {" • "}
                                                {formatRenderableText(item.questionCount)} questions
                                                {" • "}
                                                {formatRenderableText(item.marksEach)} marks each
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {!!session.assessment.sessionAnalysis?.assessedConcepts?.length && (
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Session Analysis</div>
                                          <div className="flex flex-wrap gap-2">
                                            {session.assessment.sessionAnalysis.assessedConcepts.map((item, idx) => (
                                              <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                {formatRenderableText(item)}
                                              </span>
                                            ))}
                                          </div>
                                          {!!session.assessment.sessionAnalysis.misconceptionTargets?.length && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-800">Misconception Targets:</span>{" "}
                                              {session.assessment.sessionAnalysis.misconceptionTargets.map((item) => formatRenderableText(item)).join(" • ")}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {session.assessment.blueprint && (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                          {!!session.assessment.blueprint.learningOutcomeCoverage?.length && (
                                            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Learning Outcome Coverage</div>
                                              {session.assessment.blueprint.learningOutcomeCoverage.map((item, idx) => (
                                                <div key={idx} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                                  <div className="font-semibold text-slate-800">{renderMixedMathLine(item.outcome)}</div>
                                                  {!!item.questionRefs?.length && (
                                                    <div className="mt-1 text-slate-500">Questions: {item.questionRefs.map((ref) => formatRenderableText(ref)).join(", ")}</div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          <div className="grid grid-cols-1 gap-4">
                                            {!!session.assessment.blueprint.conceptDistribution?.length && (
                                              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Concept Distribution</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  {session.assessment.blueprint.conceptDistribution.map((item, idx) => (
                                                    <div key={idx} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 space-y-1">
                                                      <div className="font-semibold text-slate-800">{renderMixedMathLine(item.concept)}</div>
                                                      {!!item.questionRefs?.length && (
                                                        <div className="text-slate-500">Questions: {item.questionRefs.map((ref) => formatRenderableText(ref)).join(", ")}</div>
                                                      )}
                                                      {item.competency && <div className="text-slate-500">Competency: {renderMixedMathLine(item.competency)}</div>}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {!!session.assessment.blueprint.sectionPlan?.length && (
                                              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Section Plan</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  {session.assessment.blueprint.sectionPlan.map((item, idx) => (
                                                    <div key={idx} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 space-y-1">
                                                      <div className="font-semibold text-slate-800">{renderMixedMathLine(item.title)}</div>
                                                      <div>
                                                        {formatRenderableText(item.questionCount || 0)} questions
                                                        {" • "}
                                                        {formatRenderableText(item.marks || 0)} marks
                                                      </div>
                                                      {!!item.questionRefs?.length && (
                                                        <div className="text-slate-500">Questions: {item.questionRefs.map((ref) => formatRenderableText(ref)).join(", ")}</div>
                                                      )}
                                                      {item.focus && (
                                                        <div className="text-slate-500">{renderMixedMathLine(item.focus)}</div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {(session.assessment.blueprint.difficultyDistribution || session.assessment.blueprint.bloomsDistribution || session.assessment.blueprint.questionDistribution || session.assessment.blueprint.competencyDistribution) && (
                                              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                                                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Blueprint Summary</div>
                                                {session.assessment.blueprint.difficultyDistribution && (
                                                  <div className="text-xs text-slate-700">
                                                    <span className="font-bold text-slate-800">Difficulty:</span>{" "}
                                                    {Object.entries(session.assessment.blueprint.difficultyDistribution)
                                                      .filter(([, value]) => value != null)
                                                      .map(([key, value]) => `${key} ${formatRenderableText(value)}%`)
                                                      .join(" • ")}
                                                  </div>
                                                )}
                                                {session.assessment.blueprint.bloomsDistribution && (
                                                  <div className="text-xs text-slate-700">
                                                    <span className="font-bold text-slate-800">Bloom's:</span>{" "}
                                                    {Object.entries(session.assessment.blueprint.bloomsDistribution)
                                                      .filter(([, value]) => value != null)
                                                      .map(([key, value]) => `${key} ${formatRenderableText(value)}%`)
                                                      .join(" • ")}
                                                  </div>
                                                )}
                                                {session.assessment.blueprint.competencyDistribution && (
                                                  <div className="text-xs text-slate-700">
                                                    <span className="font-bold text-slate-800">Competencies:</span>{" "}
                                                    {Object.entries(session.assessment.blueprint.competencyDistribution)
                                                      .filter(([, value]) => value != null)
                                                      .map(([key, value]) => `${key} ${formatRenderableText(value)}`)
                                                      .join(" • ")}
                                                  </div>
                                                )}
                                                {session.assessment.blueprint.questionDistribution && (
                                                  <div className="text-xs text-slate-700">
                                                    <span className="font-bold text-slate-800">Questions:</span>{" "}
                                                    {Object.entries(session.assessment.blueprint.questionDistribution)
                                                      .filter(([, value]) => value != null)
                                                      .map(([key, value]) => `${key} ${formatRenderableText(value)}`)
                                                      .join(" • ")}
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {!!session.assessment.blueprint.timeAllocation?.length && (
                                              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Time Allocation</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  {session.assessment.blueprint.timeAllocation.map((item, idx) => (
                                                    <div key={idx} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 flex items-center justify-between gap-2">
                                                      <span className="font-semibold text-slate-800">{formatRenderableText(item.section)}</span>
                                                      <span>{formatRenderableText(item.minutes)} min</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="space-y-6">
                                    {assessmentSectionGroups.map((group) => (
                                      <div key={group.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                          <div>
                                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Assessment Section</div>
                                            <div className="mt-1 text-lg font-display font-black text-slate-800">{group.title}</div>
                                          </div>
                                          <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{group.questionCount} questions</span>
                                            <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700">{group.marks} marks</span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                                          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pb-1 border-b border-slate-200">Questions</span>
                                            <div className="space-y-3">
                                              {group.entries.map((entry: any) => (
                                                <div key={`${group.id}-question-${entry.questionNumber}`} className="min-w-0 overflow-hidden p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-700">
                                                  <p className="font-extrabold pb-1">{`Q${entry.questionNumber}`}. ({entry.question?.marks || 0} marks)</p>
                                                  {entry.question?.subtype && (
                                                    <p className="pb-1 text-slate-500">{formatAssessmentSubtypeLabel(entry.question.subtype)}</p>
                                                  )}
                                                  <div className="min-w-0 overflow-x-auto">{renderAssessmentMathLine(entry.question?.prompt)}</div>
                                                  {entry.question?.expectedLength && (
                                                    <div className="mt-2 min-w-0 overflow-x-auto text-slate-500">
                                                      <div className="font-semibold text-slate-600">Expected depth</div>
                                                      <div className="mt-1">{renderAssessmentMathLine(entry.question.expectedLength)}</div>
                                                    </div>
                                                  )}
                                                  {(entry.question?.difficulty || entry.question?.bloomsLevel) && (
                                                    <p className="mt-1 text-slate-500">
                                                      {[
                                                        entry.question?.difficulty ? `Difficulty: ${formatRenderableText(entry.question.difficulty)}` : "",
                                                        entry.question?.bloomsLevel ? `Bloom's: ${formatRenderableText(entry.question.bloomsLevel)}` : "",
                                                      ].filter(Boolean).join(" • ")}
                                                    </p>
                                                  )}
                                                  {!!entry.question?.learningOutcomeRefs?.length && (
                                                    <div className="mt-2 text-slate-500">
                                                      <span className="font-semibold text-slate-600">Outcomes:</span> {entry.question.learningOutcomeRefs.map((item: any) => formatRenderableText(item)).join(", ")}
                                                    </div>
                                                  )}
                                                  {!!entry.question?.conceptRefs?.length && (
                                                    <div className="mt-1 text-slate-500">
                                                      <span className="font-semibold text-slate-600">Concepts:</span> {entry.question.conceptRefs.map((item: any) => formatRenderableText(item)).join(", ")}
                                                    </div>
                                                  )}
                                                  {entry.question?.type === "mcq" && renderAssessmentRichList(entry.question?.options || [], { className: "mt-3 list-disc list-inside space-y-2 text-slate-700" })}
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="space-y-3 bg-[#3CC583]/5 p-4 rounded-2xl border border-[#3CC583]/20">
                                            <span className="text-[10px] font-extrabold text-[#3CC583] uppercase tracking-widest block pb-1 border-b border-[#3CC583]/20">Evaluation Package</span>
                                            <div className="space-y-3">
                                              {group.entries.map((entry: any) => (
                                                <div key={`${group.id}-answer-${entry.questionNumber}`} className="min-w-0 overflow-hidden p-3 bg-white rounded-xl border border-[#3CC583]/30 text-xs text-slate-700">
                                                  <p className="font-extrabold text-[#3CC583] pb-1">Answer Q{entry.questionNumber}</p>
                                                  {entry.answerKey?.subtype && (
                                                    <p className="pb-1 text-slate-500">{formatAssessmentSubtypeLabel(entry.answerKey.subtype)}</p>
                                                  )}
                                                  <div className="min-w-0 overflow-x-auto">{renderAssessmentMathLine(entry.answerKey?.answer || "Answer not provided")}</div>
                                                  {entry.answerKey?.explanation && (
                                                    <div className="mt-2 min-w-0 overflow-x-auto">
                                                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Explanation</div>
                                                      <div className="mt-1">{renderAssessmentMathLine(entry.answerKey.explanation)}</div>
                                                    </div>
                                                  )}
                                                  {!!entry.markingScheme?.markBreakdown?.length && (
                                                    <div className="mt-3 space-y-2">
                                                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Marking Scheme</div>
                                                      {entry.markingScheme.markBreakdown.map((item: any, idx: number) => (
                                                        <div key={idx} className="rounded-lg bg-slate-50/70 px-2.5 py-2 text-slate-600">
                                                          <div className="flex items-start justify-between gap-3">
                                                            <span className="font-medium text-slate-500">{idx + 1}.</span>
                                                            {item?.marks != null && <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">{formatRenderableText(item.marks)} marks</span>}
                                                          </div>
                                                          <div className="mt-1">{renderAssessmentMathLine(item?.criterion || "")}</div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  {!!entry.rubric?.criteria?.length && (
                                                    <div className="mt-3 space-y-2">
                                                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Rubric</div>
                                                      {entry.rubric.criteria.map((item: any, idx: number) => (
                                                        <div key={idx} className="rounded-lg bg-slate-50/70 px-2.5 py-2 text-slate-600">
                                                          <div className="flex items-start justify-between gap-3">
                                                            <span className="font-medium text-slate-500">{idx + 1}.</span>
                                                            {item?.marks != null && <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">{formatRenderableText(item.marks)} marks</span>}
                                                          </div>
                                                          <div className="mt-1">{renderAssessmentMathLine(item?.criterion || "")}</div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}

                                    {(!!session.assessment.evaluation?.generalInstructions?.length || !!session.assessment.evaluation?.evaluatorInstructions?.length || !!session.assessment.evaluation?.moderationNotes?.length) && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                          <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest mb-2">Evaluator Guidance</div>
                                          {!!session.assessment.evaluation?.generalInstructions?.length && (
                                            renderAssessmentRichList(session.assessment.evaluation.generalInstructions, { className: "text-sm text-amber-900 list-disc list-inside space-y-2" })
                                          )}
                                          {!!session.assessment.evaluation?.evaluatorInstructions?.length && (
                                            renderAssessmentRichList(session.assessment.evaluation.evaluatorInstructions, { className: "mt-3 text-sm text-amber-900 list-disc list-inside space-y-2" })
                                          )}
                                          {!!session.assessment.evaluation?.moderationNotes?.length && (
                                            renderAssessmentRichList(session.assessment.evaluation.moderationNotes, { className: "mt-3 text-sm text-amber-900 list-disc list-inside space-y-2" })
                                          )}
                                      </div>
                                    )}

                                    {session.assessment.validation && (
                                      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Validation Summary</div>
                                        {Object.entries(session.assessment.validation).map(([key, value]) => (
                                          <div key={key} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                            <div className="font-semibold text-slate-800">{formatRenderableText(key)}</div>
                                            <div className="mt-1">{value?.passed ? "Passed" : "Needs review"}</div>
                                            {!!value?.details?.length && (
                                              <div className="mt-1 text-slate-500">{value.details.map((item: any) => formatRenderableText(item)).join(" • ")}</div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                </div>
                              ) : (
                                renderSessionTabEmptyState(
                                  "Assessment not generated yet",
                                  "Click the generate button in the session header to create this assessment using the paper settings above."
                                )
                              )}
                            </div>
                          )}

                          {/* SUB TAB: Assignments */}
                          {activeSubTab === "assignments" && (
                            <div className="space-y-6 animate-fadeIn">
                              {renderTabGeneratePanel(
                                "assignments",
                                activeSessionNumber,
                                outlineItem,
                                "Assignments",
                                "Generate or refresh the assignment bundle for this session."
                              )}
                              {contentIncludesAssignments && session.assignment ? (
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
                                        {renderMixedMathLine(session.assignment.taskDescription)}
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
                                              {renderMixedMathLine(rub)}
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
                                          {renderMixedMathLine(session.assignment.answerKey)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-400 text-center p-8 bg-slate-50 rounded-2xl">
                                  Standalone assignment bundles are not part of the current Phase 4 session-pack flow.
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
                      Generate the full teacher-facing session pack for this approved roadmap item, including lesson content, notes, slides, homework, and checks for understanding.
                    </p>

                    <button
                      onClick={() => {
                        const outlineItem = sessionsOutline.find((s) => s.sessionNumber === activeSessionNumber);
                        if (outlineItem) {
                          handleGenerateFullSessionPack(activeSessionNumber, outlineItem);
                        }
                      }}
                      className="bg-[#36ADAA] hover:bg-[#36ADAA]/90 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition shadow-sm"
                    >
                      Generate Session #{activeSessionNumber} Pack
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

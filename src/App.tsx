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
  AcademicConfig,
  ChapterSessionPlan,
  CurriculumExtraction,
  TermAllocation,
  PlanningWorkspace,
  SavedCurriculumRecord,
  SessionAllocation,
  SessionConfig,
  SessionPlanningDefaults,
  SessionSectionKey,
  SessionPlan,
  TeachingStrategy,
  TermRow,
} from "./types";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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
  const [savedCurriculums, setSavedCurriculums] = useState<SavedCurriculumRecord[]>([]);
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
  }[]>([]);

  // Step 4 State: Deep Sessions Plans
  const [generatedSessions, setGeneratedSessions] = useState<Record<string, SessionPlan>>({});
  const [activeSessionNumber, setActiveSessionNumber] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<"theory" | "materials" | "homework" | "assessments" | "assignments">("theory");
  const [activeMaterialTab, setActiveMaterialTab] = useState<"ppt" | "pdf" | "docx">("ppt");
  const [sessionSectionSelection, setSessionSectionSelection] = useState<Record<SessionSectionKey, boolean>>({
    teacherLessonNotes: true,
    studentLessonNotes: true,
    learningOutcomes: true,
    introduction: true,
    theory: true,
    activities: true,
    materials: true,
    homework: true,
    assessment: true,
    assignment: true,
  });

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

  const clearCurriculumWorkspace = () => {
    setCurrentCurriculumId("");
    setCurrentWorkspaceId("");
    setActiveWorkspace(null);
    setFileName("");
    setFileSizeStr("");
    setInputText("");
    setExtractedData(null);
    setEditingJsonText("");
    setIsEditingJson(false);
    setIsJsonCollapsed(false);
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

  const fetchSavedCurriculums = async () => {
    const res = await fetch("/api/curriculums");
    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to load saved curriculums."));
    }
    const data = await res.json();
    setSavedCurriculums(data.curriculums || []);
    return data.curriculums || [];
  };

  const mapAllocationsToTermRows = (allocations: TermAllocation[] = []) =>
    allocations.map((row, index) => ({
      id: `term-allocation-${index + 1}-${row.termNumber ?? row.termName}`,
      className: row.className || "Curriculum",
      termNumber: row.termNumber ?? undefined,
      term: row.termName,
      unitName: "Whole Term",
      chapters: row.chapters || [],
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

  const formatRenderableText = (value: unknown): string => {
    if (value == null) return "";
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
    Array.isArray(slide.assets) ? slide.assets.find((asset) => Boolean(asset.previewUrl)) : undefined;

  const escapeHtml = (value: unknown) =>
    formatRenderableText(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");

  const handleExportPptSlidesPdf = (ppt?: SessionPlan["materials"] extends infer M ? M extends { ppt: infer P } ? P : never : never) => {
    const slides = getPptSlides(ppt);
    if (!ppt || slides.length === 0) {
      setErrorHeader("Generate PPT slides first before exporting a slide-only PDF.");
      return;
    }

    const slidesMarkup = slides.map((slide, index) => {
      const accent = getPptAccentStyle(index);
      const primaryAsset = getPrimaryPptAsset(slide);
      const onSlideTags = (slide.onSlideText || [])
        .slice(0, 3)
        .map((item) => `<span class="tag ${accent.exportTagClass}">${escapeHtml(item)}</span>`)
        .join("");
      const bullets = (slide.bulletPoints || [])
        .slice(0, 5)
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
      const visualMarkup = primaryAsset?.previewUrl
        ? `<img src="${escapeHtml(primaryAsset.previewUrl)}" alt="${escapeHtml(primaryAsset.altText || primaryAsset.purpose || "Slide visual")}" />`
        : slide.svgDiagram?.svgCode?.trim().startsWith("<svg")
        ? `<div class="svg-wrap">${slide.svgDiagram.svgCode}</div>`
        : `
          <div class="visual-fallback">
            <div class="visual-chip">${escapeHtml(slide.svgDiagram?.title || "Planned Visual")}</div>
            <p>${escapeHtml(slide.visualPlan || "Visual will be finalized during export.")}</p>
          </div>
        `;

      return `
        <section class="slide-page">
          <div class="slide-shell">
            <div class="slide-bar ${accent.exportBarClass}"></div>
            <div class="slide-grid">
              <div class="slide-copy">
                <div class="deck-label">${escapeHtml(getPptTitle(ppt))}</div>
                <h1>${escapeHtml(slide.slideTitle || `Slide ${index + 1}`)}</h1>
                ${onSlideTags ? `<div class="tag-row">${onSlideTags}</div>` : ""}
                ${bullets ? `<ul class="bullet-list">${bullets}</ul>` : ""}
                <div class="slide-footer">
                  ${slide.studentTakeaway ? `<div class="info-card"><div class="info-label">Takeaway</div><div>${escapeHtml(slide.studentTakeaway)}</div></div>` : ""}
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

    const docTitle = escapeHtml(getPptTitle(ppt));
    exportWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${docTitle} - Slides PDF</title>
    <style>
      @page { size: landscape; margin: 10mm; }
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
      .tag-purple { background: rgba(127, 100, 234, 0.12); color: #5f49c3; }
      .tag-orange { background: rgba(222, 132, 49, 0.12); color: #b8651d; }
      .tag-green { background: rgba(60, 197, 131, 0.12); color: #269c63; }
      @media print {
        body { padding: 0; background: #ffffff; }
        .slide-shell { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    ${slidesMarkup}
    <script>
      window.onload = () => {
        setTimeout(() => window.print(), 300);
      };
      window.onafterprint = () => window.close();
    </script>
  </body>
</html>`);
    exportWindow.document.close();
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

  const sessionSectionOptions: { key: SessionSectionKey; label: string }[] = [
    { key: "teacherLessonNotes", label: "Teacher notes" },
    { key: "studentLessonNotes", label: "Student notes" },
    { key: "learningOutcomes", label: "Learning outcomes" },
    { key: "introduction", label: "Introduction hook" },
    { key: "theory", label: "Theory" },
    { key: "activities", label: "Activities" },
    { key: "materials", label: "Materials" },
    { key: "homework", label: "Homework" },
    { key: "assessment", label: "Assessment" },
    { key: "assignment", label: "Assignment" },
  ];

  const getSelectedSessionSections = (): SessionSectionKey[] =>
    sessionSectionOptions
      .filter((option) => sessionSectionSelection[option.key])
      .map((option) => option.key);

  const updateSessionSectionSelection = (key: SessionSectionKey, checked: boolean) => {
    setSessionSectionSelection((prev) => {
      if (checked) {
        return {
          ...prev,
          [key]: true,
        };
      }

      const selectedCount = Object.values(prev).filter(Boolean).length;
      if (selectedCount <= 1 && prev[key]) {
        setErrorHeader("Keep at least one content section selected for session generation.");
        return prev;
      }

      return {
        ...prev,
        [key]: false,
      };
    });
  };

  const buildSessionsOutlineFromAllocations = (allocations: ChapterSessionPlan[], durationMinutes: number) => {
    const outline: {
      id: string;
      sessionNumber: number;
      title: string;
      duration: number;
      learningOutcomes: string[];
      chapterName?: string;
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
            id: `${allocation.chapterName}-${chapterSessionNumber}`,
            sessionNumber: globalSessionNumber,
            title:
              chapterTotalSessions === 1
                ? allocation.chapterName
                : `${allocation.chapterName} - Session ${chapterSessionNumber}`,
            duration: durationMinutes,
            learningOutcomes: [],
            chapterName: allocation.chapterName,
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
    language:
      workspace?.sessionPlanningDefaults?.language ||
      workspace?.academicConfig?.language ||
      "English",
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

  const loadPlanningWorkspaceById = async (workspaceId: string) => {
    if (!workspaceId) return null;
    const res = await fetch(`/api/planning-workspaces/${workspaceId}`);
    if (!res.ok) {
      throw new Error(await readErrorFromResponse(res, "Failed to load planning workspace."));
    }
    const data = await res.json();
    const workspace = data.workspace as PlanningWorkspace;
    setCurrentWorkspaceId(workspace._id);
    setActiveWorkspace(workspace);
    localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    return workspace;
  };

  const ensurePlanningWorkspaceForCurriculum = async (curriculumId: string) => {
    if (!curriculumId) return null;

    const existingRes = await fetch(`/api/planning-workspaces/by-curriculum/${curriculumId}`);
    if (existingRes.ok) {
      const existingData = await existingRes.json();
      const workspace = existingData.workspace as PlanningWorkspace;
      setCurrentWorkspaceId(workspace._id);
      setActiveWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
      return workspace;
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
    const workspace = createData.workspace as PlanningWorkspace;
    setCurrentWorkspaceId(workspace._id);
    setActiveWorkspace(workspace);
    localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspace._id);
    return workspace;
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
      localStorage.setItem(LAST_CURRICULUM_ID_KEY, curriculumRecord._id);
      await ensurePlanningWorkspaceForCurriculum(curriculumRecord._id);
      setErrorHeader(null);
      await fetchSavedCurriculums();
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
      try {
        await fetchSavedCurriculums();
        const lastCurriculumId = localStorage.getItem(LAST_CURRICULUM_ID_KEY);
        if (lastCurriculumId) {
          await restoreCurriculumById(lastCurriculumId, { silent: true });
          return;
        }

        const lastWorkspaceId = localStorage.getItem(LAST_WORKSPACE_ID_KEY);
        if (lastWorkspaceId) {
          await loadPlanningWorkspaceById(lastWorkspaceId);
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

  const loadCurriculumFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    setFileName(file.name);
    setFileSizeStr((file.size / 1024).toFixed(1) + " KB");
    setErrorHeader(null);

    try {
      if (lowerName.endsWith(".pdf")) {
        console.log(`[Frontend] PDF upload detected for "${file.name}". Converting to markdown before extraction.`);
        const markdownText = await extractPdfText(file);
        if (!markdownText.trim()) {
          throw new Error("No readable text was extracted from the PDF.");
        }
        console.log(`[Frontend] PDF "${file.name}" converted to markdown and loaded into curriculum input.`);
        setInputText(markdownText);
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
      if (data.workspaceId && data.workspace) {
        setCurrentWorkspaceId(data.workspaceId);
        setActiveWorkspace(data.workspace as PlanningWorkspace);
        localStorage.setItem(LAST_WORKSPACE_ID_KEY, data.workspaceId);
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
        setCurrentWorkspaceId(data.workspaceId);
        setActiveWorkspace(data.workspace as PlanningWorkspace);
        localStorage.setItem(LAST_WORKSPACE_ID_KEY, data.workspaceId);
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
  const normalizedClasses = Array.isArray(normalizedCurriculum?.classes) ? normalizedCurriculum.classes : [];
  const normalizedUnits = normalizedClasses.flatMap((cls: any) => cls?.units || []);
  const normalizedChapters = normalizedUnits.flatMap((unit: any) => unit?.chapters || []);
  const canonicalUnitsCount = normalizedUnits.length || extractedData?.units?.length || 0;
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
  const totalObjectivesCount = totalSubtopicsCount > 0
    ? totalSubtopicsCount
    : extractedData?.coreObjectives?.length || 0;
  const totalPracticalsCount =
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
      complete: totalTopicsCount > 0,
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
  const handleBuildSessionDeepDetails = async (sessionNum: number, outlineItem: any) => {
    if (!selectedTermRow || !currentWorkspaceId) return;
    const selectedSections = getSelectedSessionSections();
    if (selectedSections.length === 0) {
      setErrorHeader("Select at least one content section before generating this session.");
      return;
    }

    const previousOutlineItem = sessionsOutline.find((item) => item.sessionNumber === sessionNum - 1);
    const previousGeneratedSession = previousOutlineItem ? generatedSessions[previousOutlineItem.sessionNumber] : null;
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
      selectedSections.length === sessionSectionOptions.length
        ? `Generating the complete lesson pack for session ${sessionNum}...`
        : `Generating selected content sections for session ${sessionNum}...`
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

  const handleRegenerateActiveSession = async () => {
    const outlineItem = sessionsOutline.find((item) => item.sessionNumber === activeSessionNumber);
    if (!outlineItem) return;
    await handleBuildSessionDeepDetails(activeSessionNumber, outlineItem);
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
   * Custom print trigger for modern layouts
   */
  const handlePrintPlans = () => {
    window.print();
  };

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
                        <div className="mt-1 text-lg font-display font-black text-slate-800">{totalTopicsCount}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtopics</div>
                        <div className="mt-1 text-lg font-display font-black text-slate-800">{totalSubtopicsCount}</div>
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
                      <p className="text-xs text-slate-500">Adjust allocation rows inside each term before you save the course plan.</p>
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
                      <p className="text-xs text-slate-500">Select one term from the current allocation plan to carry into Session Planning.</p>
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
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assessment Preference</span>
                        <select value={(teachingStrategyDraft.assessmentPreference || [])[0] || ""} onChange={(e) => updateTeachingStrategyField("assessmentPreference", e.target.value ? [e.target.value] : [])} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#36ADAA] focus:outline-none">
                          <option value="">Select assessment style</option>
                          <option value="Observation + oral checks">Observation + oral checks</option>
                          <option value="Worksheet-heavy">Worksheet-heavy</option>
                          <option value="Concept application">Concept application</option>
                          <option value="Mixed formative checks">Mixed formative checks</option>
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
                        Generate Chapter Allocation
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
                        {sessionAllocationDraftDirty && <div className="font-semibold">Chapter allocations have unsaved edits.</div>}
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
                        Save Chapter Allocation
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
                      <h3 className="text-xl font-display font-extrabold text-slate-800">Chapter Session Allocation</h3>
                      <p className="text-xs text-slate-500">Generate or edit integer session counts for each chapter in the approved term.</p>
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
                      Save the Phase 3 setup, then generate chapter-level session recommendations for the selected term.
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
                                <div className="text-sm font-display font-black text-slate-800">{allocation.chapterName}</div>
                                <div className="text-[11px] font-semibold text-slate-500">Sequence {allocation.sequence || index + 1}</div>
                              </div>
                              <div className="text-xs font-semibold text-slate-500">{allocation.estimatedMinutes || 0} minutes</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <label className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chapter</span>
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

            {/* Split Screen Dashboard Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Left Column: List of sessions roadmaps */}
              <div className="space-y-3 lg:col-span-1 no-print">
                <div className="bg-[#36ADAA] text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider">Approved Session Roadmap</span>
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
                              <RotateCcw className="w-3 h-3 animate-spin" /> Ready to generate
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

                          <div className="no-print space-y-3">
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-200">
                                Generate only selected sections
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {sessionSectionOptions.map((option) => (
                                  <label key={option.key} className="flex items-center gap-2 text-[11px] font-semibold text-white/90">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(sessionSectionSelection[option.key])}
                                      onChange={(e) => updateSessionSectionSelection(option.key, e.target.checked)}
                                      className="h-3.5 w-3.5 rounded border-white/30 bg-transparent accent-[#E9CAB7]"
                                    />
                                    <span>{option.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => void handleRegenerateActiveSession()}
                              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Regenerate Selected Content
                            </button>
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
                              {session.teacherLessonNotes && (
                                <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
                                      <BookOpen className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-display font-extrabold text-slate-800 text-sm">Teacher Lesson Notes</h4>
                                  </div>
                                  {!!session.teacherLessonNotes.prerequisiteKnowledge?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Prerequisite Knowledge</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.teacherLessonNotes.prerequisiteKnowledge.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.previousSessionRecap?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Previous Session Recap</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.teacherLessonNotes.previousSessionRecap.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.teachingSequence?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Teaching Sequence</div>
                                      <ol className="text-xs text-slate-700 list-decimal list-inside space-y-1">
                                        {session.teacherLessonNotes.teachingSequence.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ol>
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.guidedPractice?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Guided Practice</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.teacherLessonNotes.guidedPractice.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.lessonPurpose?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Lesson Purpose</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.teacherLessonNotes.lessonPurpose.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.conceptFlow?.length && (
                                    <div className="space-y-3">
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Concept Flow</div>
                                      {session.teacherLessonNotes.conceptFlow.map((concept, idx) => (
                                        <div key={idx} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 space-y-2">
                                          <div className="font-bold text-sm text-slate-800">{formatRenderableText(concept.conceptName)}</div>
                                          {concept.definition && <p className="text-xs text-slate-600"><span className="font-semibold text-slate-700">Definition:</span> {formatRenderableText(concept.definition)}</p>}
                                          {concept.coreExplanation && <p className="text-xs text-slate-700 leading-relaxed">{formatRenderableText(concept.coreExplanation)}</p>}
                                          {!!concept.teacherMoves?.length && (
                                            <div>
                                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Teacher Moves</div>
                                              <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                                {concept.teacherMoves.map((item, moveIdx) => <li key={moveIdx}>{formatRenderableText(item)}</li>)}
                                              </ul>
                                            </div>
                                          )}
                                          {!!concept.examples?.length && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-semibold text-slate-700">Examples:</span> {concept.examples.map((item) => formatRenderableText(item)).join("; ")}
                                            </div>
                                          )}
                                          {!!concept.visuals?.length && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-semibold text-slate-700">Visuals:</span> {concept.visuals.map((item) => formatRenderableText(item)).join("; ")}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.classroomQuestions?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Classroom Questions</div>
                                      <div className="space-y-2">
                                        {session.teacherLessonNotes.classroomQuestions.map((question, idx) => (
                                          <div key={idx} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 space-y-1">
                                            <div className="font-semibold text-slate-800">{formatRenderableText(question.question)}</div>
                                            {question.level && <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{formatRenderableText(question.level)}</div>}
                                            {question.expectedResponse && <div><span className="font-semibold text-slate-700">Expected response:</span> {formatRenderableText(question.expectedResponse)}</div>}
                                            {!!question.answerPoints?.length && (
                                              <ul className="list-disc list-inside space-y-1 text-slate-600">
                                                {question.answerPoints.map((item, pointIdx) => <li key={pointIdx}>{formatRenderableText(item)}</li>)}
                                              </ul>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.timePlan?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Session Time Plan</div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {session.teacherLessonNotes.timePlan.map((block, idx) => (
                                          <div key={idx} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="font-semibold text-slate-800">{formatRenderableText(block.segment)}</span>
                                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{formatRenderableText(block.minutes)} min</span>
                                            </div>
                                            {block.purpose && <div className="mt-1 text-slate-600">{formatRenderableText(block.purpose)}</div>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.formativeChecks?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Formative Checks</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.teacherLessonNotes.formativeChecks.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.sessionSummary?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Session Summary</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.teacherLessonNotes.sessionSummary.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {!!session.teacherLessonNotes.nextSessionBridge?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Next Session Bridge</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.teacherLessonNotes.nextSessionBridge.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {session.studentLessonNotes && (
                                <div className="p-5 bg-[#9FCDD2]/10 border border-[#9FCDD2]/35 rounded-3xl space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#9FCDD2]/30 flex items-center justify-center text-[#2B3437]">
                                      <GraduationCap className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-display font-extrabold text-slate-800 text-sm">Student Lesson Notes</h4>
                                  </div>
                                  {session.studentLessonNotes.introduction && (
                                    <p className="text-xs text-slate-700 leading-relaxed">{session.studentLessonNotes.introduction}</p>
                                  )}
                                  {!!session.studentLessonNotes.learningObjectives?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Learning Objectives</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.studentLessonNotes.learningObjectives.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {!!session.studentLessonNotes.quickRecall?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Quick Recall</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.studentLessonNotes.quickRecall.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {!!session.studentLessonNotes.sections?.length && (
                                    <div className="space-y-3">
                                      {session.studentLessonNotes.sections.map((section, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2">
                                          <div className="font-bold text-sm text-slate-800">{formatRenderableText(section.heading)}</div>
                                          <p className="text-xs text-slate-700 leading-relaxed">{formatRenderableText(section.explanation)}</p>
                                          {section.whyItMatters && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Why it matters:</span> {formatRenderableText(section.whyItMatters)}
                                            </div>
                                          )}
                                          {section.detailedExplanation && (
                                            <p className="text-xs text-slate-600 leading-relaxed">{formatRenderableText(section.detailedExplanation)}</p>
                                          )}
                                          {!!section.keyPoints?.length && (
                                            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                                              {section.keyPoints.map((point, pointIdx) => <li key={pointIdx}>{formatRenderableText(point)}</li>)}
                                            </ul>
                                          )}
                                          {!!section.examples?.length && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Examples:</span> {section.examples.map((example) => formatRenderableText(example)).filter(Boolean).join("; ")}
                                            </div>
                                          )}
                                          {!!section.terminology?.length && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Terminology:</span> {section.terminology.map((item) => formatRenderableText(item)).filter(Boolean).join("; ")}
                                            </div>
                                          )}
                                          {!!section.visualSupport?.length && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Visual support:</span> {section.visualSupport.map((item) => formatRenderableText(item)).filter(Boolean).join("; ")}
                                            </div>
                                          )}
                                          {!!section.importantNotes?.length && (
                                            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                                              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Important Notes</div>
                                              <ul className="text-xs text-amber-900 list-disc list-inside space-y-1">
                                                {section.importantNotes.map((item, itemIdx) => <li key={itemIdx}>{formatRenderableText(item)}</li>)}
                                              </ul>
                                            </div>
                                          )}
                                          {!!section.memoryTechniques?.length && (
                                            <div className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-2">
                                              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 mb-1">Memory Techniques</div>
                                              <ul className="text-xs text-sky-900 list-disc list-inside space-y-1">
                                                {section.memoryTechniques.map((item, itemIdx) => <li key={itemIdx}>{formatRenderableText(item)}</li>)}
                                              </ul>
                                            </div>
                                          )}
                                          {!!section.conceptSummary?.length && (
                                            <div className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Concept summary:</span> {section.conceptSummary.map((item) => formatRenderableText(item)).filter(Boolean).join("; ")}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {!!session.studentLessonNotes.definitions?.length && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {session.studentLessonNotes.definitions.map((definition, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-100">
                                          <div className="text-xs font-extrabold text-slate-800">{formatRenderableText(definition.term)}</div>
                                          <div className="text-xs text-slate-600 mt-1">{formatRenderableText(definition.definition)}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {!!session.studentLessonNotes.workedExamples?.length && (
                                    <div className="space-y-3">
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Worked Examples</div>
                                      {session.studentLessonNotes.workedExamples.map((example, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2">
                                          <div className="font-bold text-sm text-slate-800">{formatRenderableText(example.title)}</div>
                                          {!!example.steps?.length && (
                                            <ol className="text-xs text-slate-700 list-decimal list-inside space-y-1">
                                              {example.steps.map((step, stepIdx) => <li key={stepIdx}>{formatRenderableText(step)}</li>)}
                                            </ol>
                                          )}
                                          {example.explanation && <p className="text-xs text-slate-600 leading-relaxed">{formatRenderableText(example.explanation)}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {session.studentLessonNotes.revisionSection && (
                                    <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Revision Section</div>
                                      {!!session.studentLessonNotes.revisionSection.definitions?.length && (
                                        <div className="text-xs text-slate-600"><span className="font-bold text-slate-700">Definitions:</span> {session.studentLessonNotes.revisionSection.definitions.map((item) => formatRenderableText(item)).join("; ")}</div>
                                      )}
                                      {!!session.studentLessonNotes.revisionSection.formulas?.length && (
                                        <div className="text-xs text-slate-600"><span className="font-bold text-slate-700">Formulas:</span> {session.studentLessonNotes.revisionSection.formulas.map((item) => formatRenderableText(item)).join("; ")}</div>
                                      )}
                                      {!!session.studentLessonNotes.revisionSection.facts?.length && (
                                        <div className="text-xs text-slate-600"><span className="font-bold text-slate-700">Facts:</span> {session.studentLessonNotes.revisionSection.facts.map((item) => formatRenderableText(item)).join("; ")}</div>
                                      )}
                                      {!!session.studentLessonNotes.revisionSection.keywords?.length && (
                                        <div className="text-xs text-slate-600"><span className="font-bold text-slate-700">Keywords:</span> {session.studentLessonNotes.revisionSection.keywords.map((item) => formatRenderableText(item)).join("; ")}</div>
                                      )}
                                      {!!session.studentLessonNotes.revisionSection.conceptMap?.length && (
                                        <div className="text-xs text-slate-600"><span className="font-bold text-slate-700">Concept map:</span> {session.studentLessonNotes.revisionSection.conceptMap.map((item) => formatRenderableText(item)).join("; ")}</div>
                                      )}
                                      {!!session.studentLessonNotes.revisionSection.quickRecap?.length && (
                                        <div className="text-xs text-slate-600"><span className="font-bold text-slate-700">Quick recap:</span> {session.studentLessonNotes.revisionSection.quickRecap.map((item) => formatRenderableText(item)).join("; ")}</div>
                                      )}
                                    </div>
                                  )}
                                  {!!session.studentLessonNotes.selfCheckQuestions?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Self-Check Questions</div>
                                      <ol className="text-xs text-slate-700 list-decimal list-inside space-y-1">
                                        {session.studentLessonNotes.selfCheckQuestions.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ol>
                                    </div>
                                  )}
                                  {!!session.studentLessonNotes.didYouKnow?.length && (
                                    <div>
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Did You Know?</div>
                                      <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                        {session.studentLessonNotes.didYouKnow.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {session.homework && (
                                <div className="p-5 bg-[#7F64EA]/5 border border-[#7F64EA]/20 rounded-3xl space-y-4">
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
                                        {formatRenderableText(session.homework.task)}
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
                                                {formatRenderableText(item.title || item.question || `Homework Task ${item.id}`)}
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
                                              <span className="font-bold text-slate-800">Instructions:</span> {formatRenderableText(item.instructions)}
                                            </p>
                                          )}
                                          {item.question && (
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                              <span className="font-bold text-slate-800">Question:</span> {formatRenderableText(item.question)}
                                            </p>
                                          )}
                                          {!!item.options?.length && (
                                            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                                              {item.options.map((option, optionIdx) => (
                                                <li key={optionIdx}>{formatRenderableText(option)}</li>
                                              ))}
                                            </ul>
                                          )}
                                          {item.answerSpace && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Answer space:</span> {formatRenderableText(item.answerSpace)}
                                            </p>
                                          )}
                                          {item.visualRequirement && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Visual requirement:</span> {formatRenderableText(item.visualRequirement)}
                                            </p>
                                          )}
                                          {item.expectedResponse && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Expected response:</span> {formatRenderableText(item.expectedResponse)}
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
                                </div>
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
                                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="p-3 bg-orange-50 border border-[#DE8431]/20 rounded-xl flex items-center gap-2.5 text-xs text-[#DE8431] flex-1">
                                      <Info className="w-4 h-4 shrink-0" />
                                      <span>Presentation Outline: Real presentation slides generated to map exactly to lessons.</span>
                                    </div>
                                    <button
                                      onClick={() => handleExportPptSlidesPdf(session.materials?.ppt)}
                                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Export Slides PDF
                                    </button>
                                  </div>

                                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                                    <h4 className="font-display font-black text-slate-800 text-base">
                                      {getPptTitle(session.materials.ppt)}
                                    </h4>
                                    <div className="grid gap-2 md:grid-cols-2 text-xs text-slate-600">
                                      {session.materials.ppt.templateName && (
                                        <div><span className="font-bold text-slate-700">Template:</span> {formatRenderableText(session.materials.ppt.templateName)}</div>
                                      )}
                                      {session.materials.ppt.themeId && (
                                        <div><span className="font-bold text-slate-700">Theme preset:</span> {formatRenderableText(session.materials.ppt.themeId)}</div>
                                      )}
                                    </div>
                                    {session.materials.ppt.presentationGoal && (
                                      <p className="text-xs text-slate-600 leading-relaxed">
                                        <span className="font-bold text-slate-700">Goal:</span> {formatRenderableText(session.materials.ppt.presentationGoal)}
                                      </p>
                                    )}
                                    <div className="grid gap-2 md:grid-cols-2 text-xs text-slate-600">
                                      {session.materials.ppt.audience && (
                                        <div><span className="font-bold text-slate-700">Audience:</span> {formatRenderableText(session.materials.ppt.audience)}</div>
                                      )}
                                      {session.materials.ppt.theme && (
                                        <div><span className="font-bold text-slate-700">Theme:</span> {formatRenderableText(session.materials.ppt.theme)}</div>
                                      )}
                                    </div>
                                    {getPptThemeSummary(session.materials.ppt) && (
                                      <div className="text-xs text-slate-600">
                                        <span className="font-bold text-slate-700">Theme details:</span> {getPptThemeSummary(session.materials.ppt)}
                                      </div>
                                    )}
                                    {!!session.materials.ppt.coverageSummary?.learningOutcomesCovered?.length && (
                                      <div className="text-xs text-slate-600">
                                        <span className="font-bold text-slate-700">LO coverage:</span> {session.materials.ppt.coverageSummary.learningOutcomesCovered.map((item) => formatRenderableText(item)).join("; ")}
                                      </div>
                                    )}
                                    {!!session.materials.ppt.coverageSummary?.topicsCovered?.length && (
                                      <div className="text-xs text-slate-600">
                                        <span className="font-bold text-slate-700">Topics:</span> {session.materials.ppt.coverageSummary.topicsCovered.map((item) => formatRenderableText(item)).join("; ")}
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                                    {getPptSlides(session.materials.ppt).map((slide, sIdx) => {
                                      const accent = getPptAccentStyle(sIdx);
                                      const primaryAsset = getPrimaryPptAsset(slide);
                                      const hasSvgPreview = Boolean(slide.svgDiagram?.svgCode && slide.svgDiagram.svgCode.trim().startsWith("<svg"));
                                      
                                      return (
                                        <div key={sIdx} className="space-y-3">
                                          <div className="rounded-[28px] border border-slate-200 bg-[#eef4f7] p-4 shadow-sm">
                                            <div className="mb-3 flex items-center justify-between px-1">
                                              <div className="flex items-center gap-2">
                                                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white ${accent.bar}`}>
                                                  {slide.slideNumber || sIdx + 1}
                                                </span>
                                                <div>
                                                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                                                    {formatRenderableText(slide.templateSlideTitle || "PowerPoint Slide Preview")}
                                                  </div>
                                                  <div className="text-sm font-display font-black text-slate-800">
                                                    {formatRenderableText(slide.slideTitle || `Slide ${sIdx + 1}`)}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end gap-1">
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${accent.soft} ${accent.text}`}>
                                                  {formatRenderableText(slide.slideType || "concept")}
                                                </span>
                                                {slide.templateSlideKey && (
                                                  <span className="text-[10px] font-mono text-slate-400">
                                                    {formatRenderableText(slide.templateSlideKey)}
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="aspect-video overflow-hidden rounded-[22px] border border-slate-300 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                                              <div className={`h-4 w-full ${accent.bar}`} />
                                              <div className="grid h-[calc(100%-1rem)] grid-cols-5 gap-0">
                                                <div className="col-span-3 flex flex-col px-8 py-7">
                                                  <div className="mb-5">
                                                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                      {getPptTitle(session.materials.ppt)}
                                                    </div>
                                                    <h5 className="mt-2 font-display text-[clamp(1.2rem,2vw,2rem)] font-black leading-tight text-slate-900">
                                                      {formatRenderableText(slide.slideTitle || `Slide ${sIdx + 1}`)}
                                                    </h5>
                                                  </div>

                                                  {!!slide.onSlideText?.length && (
                                                    <div className="mb-4 flex flex-wrap gap-2">
                                                      {slide.onSlideText.slice(0, 3).map((item, idx) => (
                                                        <span key={idx} className={`rounded-full px-3 py-1 text-[10px] font-bold ${accent.soft} ${accent.text}`}>
                                                          {formatRenderableText(item)}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  )}

                                                  <div className="space-y-3">
                                                    {(slide.bulletPoints || []).slice(0, 5).map((bp, bpIdx) => (
                                                      <div key={bpIdx} className="flex items-start gap-3">
                                                        <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${accent.bar}`} />
                                                        <p className="text-[13px] leading-6 text-slate-700">
                                                          {formatRenderableText(bp)}
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
                                                            {formatRenderableText(slide.studentTakeaway)}
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

                                                <div className="col-span-2 border-l border-slate-200 bg-slate-50/70 px-5 py-6">
                                                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                                    Visual Panel
                                                  </div>
                                                  <div className="mt-3 flex h-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                                                    {primaryAsset?.previewUrl ? (
                                                      <img
                                                        src={primaryAsset.previewUrl}
                                                        alt={primaryAsset.altText || primaryAsset.purpose || "Slide visual"}
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
                                                              ? formatRenderableText(slide.svgDiagram.title)
                                                              : "Planned visual"}
                                                          </div>
                                                          <p className="mt-3 text-xs leading-5 text-slate-600">
                                                            {formatRenderableText(slide.visualPlan || "This slide uses a teacher-planned visual area in the final PPT.")}
                                                          </p>
                                                        </div>
                                                        {!!slide.svgDiagram?.instructions?.length && (
                                                          <ul className="space-y-2 text-[11px] leading-4 text-slate-500">
                                                            {slide.svgDiagram.instructions.slice(0, 4).map((item, idx) => (
                                                              <li key={idx} className="flex gap-2">
                                                                <span className={`mt-1 inline-block h-2 w-2 rounded-full ${accent.bar}`} />
                                                                <span>{formatRenderableText(item)}</span>
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
                                                  <span className="font-bold text-slate-700">Teacher intent:</span> {formatRenderableText(slide.teacherIntent)}
                                                </p>
                                              )}
                                              {!!slide.speakerNotes?.length ? (
                                                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                                                  {slide.speakerNotes.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                                </ul>
                                              ) : (
                                                <p className="text-xs text-slate-500">No speaker notes were returned for this slide.</p>
                                              )}
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Visual & Attribution</div>
                                              {slide.visualPlan && (
                                                <p className="text-xs leading-relaxed text-slate-600">
                                                  <span className="font-bold text-slate-700">Visual plan:</span> {formatRenderableText(slide.visualPlan)}
                                                </p>
                                              )}
                                              {!!slide.assets?.length && slide.assets.map((asset, assetIdx) => (
                                                <div key={assetIdx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                                                  {asset.purpose && <div><span className="font-bold text-slate-700">Purpose:</span> {formatRenderableText(asset.purpose)}</div>}
                                                  {asset.searchQuery && <div><span className="font-bold text-slate-700">Search:</span> {formatRenderableText(asset.searchQuery)}</div>}
                                                  {(asset.sourceSite || asset.sourceUrl) && <div><span className="font-bold text-slate-700">Source:</span> {[asset.sourceSite, asset.sourceUrl].filter(Boolean).map((item) => formatRenderableText(item)).join(" - ")}</div>}
                                                  {asset.licenseType && <div><span className="font-bold text-slate-700">License:</span> {formatRenderableText(asset.licenseType)}</div>}
                                                </div>
                                              ))}
                                              {!slide.assets?.length && slide.svgDiagram && (
                                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                                                  <div><span className="font-bold text-slate-700">Diagram:</span> {formatRenderableText(slide.svgDiagram.title || slide.svgDiagram.type || "SVG-supported visual")}</div>
                                                  {!!slide.svgDiagram.instructions?.length && (
                                                    <div><span className="font-bold text-slate-700">Instructions:</span> {slide.svgDiagram.instructions.map((item) => formatRenderableText(item)).join("; ")}</div>
                                                  )}
                                                </div>
                                              )}
                                              {typeof slide.isOptionalSlotFilled === "boolean" && (
                                                <p className="text-xs leading-relaxed text-slate-600">
                                                  <span className="font-bold text-slate-700">Template slot status:</span> {slide.isOptionalSlotFilled ? "Filled from session content" : "Kept intentionally low-density"}
                                                </p>
                                              )}
                                              {!!slide.animationHints?.length && (
                                                <p className="text-xs leading-relaxed text-slate-600">
                                                  <span className="font-bold text-slate-700">Animation:</span> {slide.animationHints.map((item) => formatRenderableText(item)).join("; ")}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {!!session.materials.ppt.licenseChecklist?.length && (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">License Checklist</div>
                                      <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                                        {session.materials.ppt.licenseChecklist.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {!!session.materials.ppt.presentationWarnings?.length && (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-2">
                                      <div className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest">Presentation Warnings</div>
                                      <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                                        {session.materials.ppt.presentationWarnings.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                      </ul>
                                    </div>
                                  )}
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
                                      I. Student Study Notes / Revision Points
                                    </span>
                                    <ul className="text-xs space-y-2 list-decimal list-inside pl-2">
                                      {session.materials.pdf.keyInformation.map((info, idx) => (
                                        <li key={idx} className="leading-relaxed">
                                          {formatRenderableText(info)}
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
                                          {formatRenderableText(sec)}
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
                                        {formatRenderableText(session.homework.task)}
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
                                                {formatRenderableText(item.title || item.question || `Homework Task ${item.id}`)}
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
                                              <span className="font-bold text-slate-800">Instructions:</span> {formatRenderableText(item.instructions)}
                                            </p>
                                          )}
                                          {item.question && (
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                              <span className="font-bold text-slate-800">Question:</span> {formatRenderableText(item.question)}
                                            </p>
                                          )}
                                          {!!item.options?.length && (
                                            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                                              {item.options.map((option, optionIdx) => (
                                                <li key={optionIdx}>{formatRenderableText(option)}</li>
                                              ))}
                                            </ul>
                                          )}
                                          {item.answerSpace && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Answer space:</span> {formatRenderableText(item.answerSpace)}
                                            </p>
                                          )}
                                          {item.visualRequirement && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Visual requirement:</span> {formatRenderableText(item.visualRequirement)}
                                            </p>
                                          )}
                                          {item.expectedResponse && (
                                            <p className="text-xs text-slate-600">
                                              <span className="font-bold text-slate-700">Expected response:</span> {formatRenderableText(item.expectedResponse)}
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

                                  <div className="space-y-6">
                                    {!!session.assessment.mcq?.length && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pb-1 border-b border-slate-200">MCQ</span>
                                          <div className="space-y-3">
                                            {session.assessment.mcq.map((q, idx) => (
                                              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-700">
                                                <p className="font-extrabold pb-1">Q{idx + 1}. ({q.marks || 1} mark)</p>
                                                <p className="leading-relaxed">{formatRenderableText(q.question)}</p>
                                                <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
                                                  {q.options.map((option, optionIdx) => <li key={optionIdx}>{formatRenderableText(option)}</li>)}
                                                </ul>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="space-y-3 bg-[#3CC583]/5 p-4 rounded-2xl border border-[#3CC583]/20">
                                          <span className="text-[10px] font-extrabold text-[#3CC583] uppercase tracking-widest block pb-1 border-b border-[#3CC583]/20">MCQ Answer Key</span>
                                          <div className="space-y-3">
                                            {(session.assessment.answerKey?.mcq || []).map((ans, idx) => (
                                              <div key={idx} className="p-3 bg-white rounded-xl border border-[#3CC583]/30 text-xs text-slate-700">
                                                <p className="font-extrabold text-[#3CC583] pb-1">Answer Q{idx + 1}</p>
                                                <p className="leading-relaxed font-mono">{formatRenderableText(ans.answer)}</p>
                                                {ans.explanation && <p className="leading-relaxed mt-1">{formatRenderableText(ans.explanation)}</p>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {!!session.assessment.shortAnswer?.length && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pb-1 border-b border-slate-200">Short Answer Questions</span>
                                          <div className="space-y-3">
                                            {session.assessment.shortAnswer.map((q, idx) => (
                                              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-700">
                                                <p className="font-extrabold pb-1">Q{idx + 1}. ({q.marks || 2} marks)</p>
                                                <p className="leading-relaxed">{formatRenderableText(q.question)}</p>
                                                {q.expectedLength && <p className="mt-1 text-slate-500">Expected depth: {formatRenderableText(q.expectedLength)}</p>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="space-y-3 bg-[#3CC583]/5 p-4 rounded-2xl border border-[#3CC583]/20">
                                          <span className="text-[10px] font-extrabold text-[#3CC583] uppercase tracking-widest block pb-1 border-b border-[#3CC583]/20">Short Answer Key & Rubric</span>
                                          <div className="space-y-3">
                                            {(session.assessment.answerKey?.shortAnswer || []).map((ans, idx) => (
                                              <div key={idx} className="p-3 bg-white rounded-xl border border-[#3CC583]/30 text-xs text-slate-700">
                                                <p className="font-extrabold text-[#3CC583] pb-1">Answer Q{idx + 1}</p>
                                                <p className="leading-relaxed">{formatRenderableText(ans.answer)}</p>
                                                {!!ans.rubric?.length && (
                                                  <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
                                                    {ans.rubric.map((item, rubricIdx) => <li key={rubricIdx}>{formatRenderableText(item)}</li>)}
                                                  </ul>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {!!session.assessment.longAnswer?.length && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pb-1 border-b border-slate-200">Long Answer Questions</span>
                                          <div className="space-y-3">
                                            {session.assessment.longAnswer.map((q, idx) => (
                                              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-700">
                                                <p className="font-extrabold pb-1">Q{idx + 1}. ({q.marks || 5} marks)</p>
                                                <p className="leading-relaxed">{formatRenderableText(q.question)}</p>
                                                {q.expectedLength && <p className="mt-1 text-slate-500">Expected depth: {formatRenderableText(q.expectedLength)}</p>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="space-y-3 bg-[#3CC583]/5 p-4 rounded-2xl border border-[#3CC583]/20">
                                          <span className="text-[10px] font-extrabold text-[#3CC583] uppercase tracking-widest block pb-1 border-b border-[#3CC583]/20">Long Answer Key & Rubric</span>
                                          <div className="space-y-3">
                                            {(session.assessment.answerKey?.longAnswer || []).map((ans, idx) => (
                                              <div key={idx} className="p-3 bg-white rounded-xl border border-[#3CC583]/30 text-xs text-slate-700">
                                                <p className="font-extrabold text-[#3CC583] pb-1">Answer Q{idx + 1}</p>
                                                <p className="leading-relaxed whitespace-pre-wrap">{formatRenderableText(ans.answer)}</p>
                                                {!!ans.rubric?.length && (
                                                  <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
                                                    {ans.rubric.map((item, rubricIdx) => <li key={rubricIdx}>{formatRenderableText(item)}</li>)}
                                                  </ul>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {!!session.assessment.answerKey?.generalMarkingGuidance?.length && (
                                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                        <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest mb-2">CBSE-style Marking Guidance</div>
                                        <ul className="text-xs text-amber-900 list-disc list-inside space-y-1">
                                          {session.assessment.answerKey.generalMarkingGuidance.map((item, idx) => <li key={idx}>{formatRenderableText(item)}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                  </div>

                                </div>
                              ) : (
                                <div className="text-gray-400 text-center p-8 bg-slate-50 rounded-2xl">
                                  Formative assessment output is turned off in the saved Phase 3 defaults.
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUB TAB: Assignments */}
                          {activeSubTab === "assignments" && (
                            <div className="space-y-6 animate-fadeIn">
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
                                              {formatRenderableText(rub)}
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
                                          {formatRenderableText(session.assignment.answerKey)}
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
                          handleBuildSessionDeepDetails(activeSessionNumber, outlineItem);
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

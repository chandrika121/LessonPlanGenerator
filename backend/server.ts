import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { promises as fs, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import mongoose from "mongoose";
import { CurriculumModel } from "./models/Curriculum";
import { PlanningWorkspaceModel } from "./models/PlanningWorkspace";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_FILE_PATH = path.resolve(__dirname, "../.env");

// Load environment variables
dotenv.config({ path: ENV_FILE_PATH });

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3002;
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 4173;
const OLLAMA_NUM_PREDICT = Number(process.env.OLLAMA_NUM_PREDICT) || 8192;
const OLLAMA_STAGE1_NUM_PREDICT = Number(process.env.OLLAMA_STAGE1_NUM_PREDICT) || 4096;
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 600000;
const OLLAMA_IMAGE_TIMEOUT_MS = Number(process.env.OLLAMA_IMAGE_TIMEOUT_MS) || 180000;
const MAX_STUDENT_NOTE_VISUALS = Number(process.env.MAX_STUDENT_NOTE_VISUALS) || 3;
const MAX_CHUNK_SPLIT_DEPTH = 2;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kamalaniketan-lms";
const DEBUG_OUTPUT_DIR = path.resolve(__dirname, "debug-output");
const PROMPTS_DIR = path.resolve(__dirname, "prompts");
const TEMPLATE_PPTX_PATH = path.resolve(PROMPTS_DIR, "Kamalaniketan-pptx template.pptx");
const execFileAsync = promisify(execFile);

const STAGE_ORDER = [
  "Stage 1: Raw Curriculum Extraction",
  "Stage 2: Document Structure Hierarchy",
  "Stage 3: Node Enrichment",
  "Stage 4: Normalized Teaching Blocks",
  "Stage 5: Structural Validation",
  "Stage 6: Competency Extraction",
  "Stage 7: Assessment Extraction",
  "Stage 8: Learning Outcomes Extraction",
  "Stage 9: Activities / Projects / Practicals Extraction",
  "Stage 10: Curriculum Intelligence Generation",
] as const;

type CurriculumProfile =
  | "cbse_unit_topic"
  | "cbse_unit_chapter_topic"
  | "multi_class_board_syllabus"
  | "term_semester_curriculum"
  | "competency_outcomes_curriculum"
  | "language_curriculum"
  | "mixed_or_unknown";

type SchemaVersion = "v1" | "v2";
type SessionSectionKey =
  | "teacherLessonNotes"
  | "studentLessonNotes"
  | "learningOutcomes"
  | "introduction"
  | "theory"
  | "activities"
  | "materials"
  | "homework"
  | "assessment"
  | "assignment";

type OllamaGenerationKind =
  | "default"
  | "sessionContent"
  | "teacherNotes"
  | "studentNotes"
  | "materials"
  | "homework"
  | "assessment"
  | "assignment"
  | "image";

type AssessmentQuestionType =
  | "mcq"
  | "veryShortAnswer"
  | "shortAnswer"
  | "longAnswer"
  | "caseStudy";

type AssessmentQuestionTypeRequest = {
  type: AssessmentQuestionType;
  label?: string;
  questionCount?: number | null;
  marksEach?: number | null;
};

type SessionAssessmentCustomization = {
  assessmentType?: string;
  difficulty?: string;
  paperObjective?: string;
  totalMarks?: number | null;
  totalQuestions?: number | null;
  questionTypes?: AssessmentQuestionTypeRequest[];
};

type SessionPptGenerationOptions = {
  pptTemplateId?: string;
  pptThemeId?: string;
};

type AssessmentRenderedSubtype =
  | "mcq"
  | "veryShortAnswer"
  | "shortAnswer"
  | "longAnswer"
  | "caseStudy";

// CORS - allow frontend dev server
app.use(cors({
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`,
  ],
  credentials: true,
}));

// Set up body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

function loadPrompt(promptName: string): string {
  const promptPath = path.join(PROMPTS_DIR, promptName);
  const content = readFileSync(promptPath, "utf8");
  console.log(`[Prompt] Loaded ${promptName}`);
  return content;
}

function renderPrompt(promptName: string, replacements: Record<string, string>): string {
  let content = loadPrompt(promptName);
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }
  return content;
}

function looksLikeBase64Image(value: string) {
  const normalized = String(value || "").trim();
  return normalized.length > 128 && /^[A-Za-z0-9+/=\s]+$/.test(normalized);
}

function buildImageDataUrl(imageValue: string, mimeType: string = "image/png") {
  const normalized = String(imageValue || "").trim();
  if (!normalized) return "";
  if (normalized.startsWith("data:image/")) return normalized;
  return `data:${mimeType};base64,${normalized.replace(/\s+/g, "")}`;
}

function extractGeneratedImagePayload(data: any) {
  const openAiImage = data?.data?.find?.((item: any) => typeof item?.b64_json === "string" || typeof item?.url === "string");
  if (typeof openAiImage?.b64_json === "string") {
    return {
      imageDataUrl: buildImageDataUrl(openAiImage.b64_json, "image/png"),
      mimeType: "image/png",
    };
  }
  if (typeof openAiImage?.url === "string" && openAiImage.url.trim()) {
    return {
      imageDataUrl: openAiImage.url.trim(),
      mimeType: openAiImage.url.startsWith("data:image/") ? openAiImage.url.slice(5, openAiImage.url.indexOf(";")) : "image/png",
    };
  }

  const possibleImage =
    (Array.isArray(data?.images) && typeof data.images[0] === "string" && data.images[0]) ||
    (typeof data?.image === "string" && data.image) ||
    (typeof data?.response === "string" && looksLikeBase64Image(data.response) ? data.response : "");

  if (typeof possibleImage === "string" && possibleImage.trim()) {
    return {
      imageDataUrl: buildImageDataUrl(possibleImage, "image/png"),
      mimeType: "image/png",
    };
  }

  return null;
}

async function generateImageWithOllama(
  requestId: string,
  debugDir: string,
  stageName: string,
  prompt: string
): Promise<{ imageDataUrl: string; mimeType: string; model: string }> {
  const ollamaConfig = getOllamaConfig("image");
  const negativePrompt = [
    "no words",
    "no text",
    "no letters",
    "no typography",
    "no labels",
    "no captions",
    "no title text",
    "no handwritten text",
    "no gibberish text",
    "no watermark",
  ].join(", ");
  const endpoints = [
    {
      url: `${ollamaConfig.baseUrl}/api/generate`,
      body: {
        model: ollamaConfig.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
          negative_prompt: negativePrompt,
        },
      },
    },
    {
      url: `${ollamaConfig.baseUrl}/v1/images/generations`,
      body: {
        model: ollamaConfig.model,
        prompt,
        negative_prompt: negativePrompt,
        n: 1,
        size: "768x768",
        response_format: "b64_json",
      },
    },
  ];

  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index];
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), OLLAMA_IMAGE_TIMEOUT_MS);
    try {
      await writeDebugFile(
        debugDir,
        `${safeStageName(stageName)}.image-attempt-${index + 1}.request.json`,
        { url: endpoint.url, body: endpoint.body }
      );

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(endpoint.body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        await writeDebugFile(debugDir, `${safeStageName(stageName)}.image-attempt-${index + 1}.error.txt`, errorText);
        continue;
      }

      const data = await response.json();
      await writeDebugFile(debugDir, `${safeStageName(stageName)}.image-attempt-${index + 1}.response.json`, data);
      const extracted = extractGeneratedImagePayload(data);
      if (extracted?.imageDataUrl) {
        return {
          imageDataUrl: extracted.imageDataUrl,
          mimeType: extracted.mimeType,
          model: ollamaConfig.model,
        };
      }
    } catch (error: any) {
      await writeDebugFile(
        debugDir,
        `${safeStageName(stageName)}.image-attempt-${index + 1}.exception.txt`,
        String(error?.message || error)
      );
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  throw new Error(`Unable to generate an image with Ollama model ${ollamaConfig.model}.`);
}

async function enrichStudentLessonNotesWithVisuals(
  requestId: string,
  debugDir: string,
  sessionPlan: any,
  context: {
    subject?: string;
    gradeLevel?: string;
    sessionTitle?: string;
  }
) {
  const sections = Array.isArray(sessionPlan?.studentLessonNotes?.sections)
    ? sessionPlan.studentLessonNotes.sections
    : [];
  if (!sections.length) return sessionPlan;

  let visualsGenerated = 0;
  const enrichedSections: any[] = [];
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const visualSupport = Array.isArray(section?.visualSupport)
      ? section.visualSupport.map((item: any) => String(item || "").trim()).filter(Boolean)
      : [];
    if (!visualSupport.length || visualsGenerated >= MAX_STUDENT_NOTE_VISUALS) {
      enrichedSections.push(section);
      continue;
    }

    const existingAssets = Array.isArray(section?.visualAssets) ? section.visualAssets.filter(Boolean) : [];
    if (existingAssets.length > 0) {
      enrichedSections.push(section);
      continue;
    }

    const imagePrompt = [
      "Create a clean educational study-note illustration for school students.",
      `Subject: ${String(context.subject || "General Science")}.`,
      `Grade level: ${String(context.gradeLevel || "School level")}.`,
      `Session: ${String(context.sessionTitle || "Lesson session")}.`,
      `Concept: ${String(section?.heading || `Concept ${index + 1}`)}.`,
      `Visual requirement: ${visualSupport.join(" ")}`,
      "Style: textbook-friendly, scientific, diagram-like, clear, accurate, uncluttered, centered composition, white or light background, student-safe.",
      "Important: do not draw any words, letters, labels, captions, heading text, numbering, or watermark inside the image.",
      "Show the concept visually only. Keep all explanation outside the image.",
      "Prefer clean shapes, arrows without text, color-coded parts, and simple educational composition.",
    ].join(" ");

    try {
      const generatedVisual = await generateImageWithOllama(
        requestId,
        debugDir,
        `student-notes-visual-${index + 1}`,
        imagePrompt
      );
      visualsGenerated += 1;
      enrichedSections.push({
        ...section,
        visualAssets: [
          {
            prompt: imagePrompt,
            alt: `${String(section?.heading || `Student note visual ${index + 1}`)} illustration`,
            imageDataUrl: generatedVisual.imageDataUrl,
            mimeType: generatedVisual.mimeType,
            model: generatedVisual.model,
          },
        ],
      });
    } catch (error: any) {
      console.warn(
        `[Ollama][${requestId}][student-notes-visual-${index + 1}] Visual generation skipped: ${error?.message || error}`
      );
      enrichedSections.push(section);
    }
  }

  return {
    ...sessionPlan,
    studentLessonNotes: {
      ...sessionPlan.studentLessonNotes,
      sections: enrichedSections,
    },
  };
}

const ALL_SESSION_SECTIONS: SessionSectionKey[] = [
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

const KAMALANIKETAN_TEMPLATE_ID = "kamalaniketan-session-12";
const PPT_TEMPLATE_PRESETS = {
  "textbook-clean": {
    templateId: "textbook-clean",
    templateName: "Textbook Clean",
    description: "Minimal, textbook-like, high-readability classroom slides.",
    layoutMode: "textbook-clean",
    contentDensity: "balanced",
  },
  "academic-split": {
    templateId: "academic-split",
    templateName: "Academic Split",
    description: "Balanced text-plus-visual teaching layout.",
    layoutMode: "academic-split",
    contentDensity: "balanced",
  },
  "visual-focus": {
    templateId: "visual-focus",
    templateName: "Visual Focus",
    description: "Larger visual teaching area with lighter on-slide text.",
    layoutMode: "visual-focus",
    contentDensity: "light",
  },
} as const;

const KAMALANIKETAN_TEMPLATE_SLIDES = [
  { key: "title_identity", label: "Title / Session Identity", slideType: "title", optional: false },
  { key: "learning_outcomes", label: "Learning Outcomes", slideType: "learning-outcomes", optional: false },
  { key: "prerequisite_knowledge", label: "Prior Knowledge / Recall", slideType: "prerequisite", optional: false },
  { key: "lesson_hook", label: "Lesson Hook / Bridge", slideType: "hook", optional: false },
  { key: "topic_introduction", label: "Topic Introduction", slideType: "introduction", optional: false },
  { key: "core_concept_a", label: "Core Concept A", slideType: "concept", optional: false },
  { key: "core_concept_b_visual", label: "Core Concept B / Visual Explanation", slideType: "visual-explanation", optional: false },
  { key: "worked_example", label: "Worked Example / Demonstration", slideType: "worked-example", optional: false },
  { key: "guided_practice", label: "Guided Practice / Activity", slideType: "guided-practice", optional: false },
  { key: "quick_assessment", label: "Formative Check / Quick Assessment", slideType: "quick-assessment", optional: false },
  { key: "summary", label: "Recap / Key Takeaways", slideType: "summary", optional: false },
  { key: "homework_next_session", label: "Homework / Next Class Bridge", slideType: "homework", optional: false },
] as const;

const PPT_THEME_PRESETS: Record<string, {
  themeId: string;
  themeName: string;
  fonts: { heading: string; body: string };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
  };
  visualStyle: {
    topBarStyle: string;
    cardStyle: string;
    visualFrameStyle: string;
  };
}> = {
  "kamalaniketan-classic": {
    themeId: "kamalaniketan-classic",
    themeName: "Kamalaniketan Classic",
    fonts: { heading: "Calibri", body: "Calibri" },
    colors: {
      primary: "#4F81BD",
      secondary: "#1F497D",
      accent: "#F79646",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#1F2937",
      mutedText: "#64748B",
    },
    visualStyle: {
      topBarStyle: "solid academic band",
      cardStyle: "clean rounded content cards",
      visualFrameStyle: "simple textbook-style image frame",
    },
  },
  "cbse-academic-blue": {
    themeId: "cbse-academic-blue",
    themeName: "CBSE Academic Blue",
    fonts: { heading: "Cambria", body: "Aptos" },
    colors: {
      primary: "#1D4E89",
      secondary: "#173B6A",
      accent: "#D97706",
      background: "#F7FAFC",
      surface: "#FFFFFF",
      text: "#1F2937",
      mutedText: "#6B7280",
    },
    visualStyle: {
      topBarStyle: "measured academic title band",
      cardStyle: "light textbook panels",
      visualFrameStyle: "clean labelled-figure frame",
    },
  },
  "kamalaniketan-modern": {
    themeId: "kamalaniketan-modern",
    themeName: "Kamalaniketan Modern",
    fonts: { heading: "Outfit", body: "Inter" },
    colors: {
      primary: "#36ADAA",
      secondary: "#1EABDA",
      accent: "#DE8431",
      background: "#EEF4F7",
      surface: "#FFFFFF",
      text: "#0F172A",
      mutedText: "#64748B",
    },
    visualStyle: {
      topBarStyle: "bold color band with soft contrast surfaces",
      cardStyle: "rounded modern educator cards",
      visualFrameStyle: "large clean visual panel with soft border",
    },
  },
};

function normalizeSessionSections(value: unknown): SessionSectionKey[] {
  if (!Array.isArray(value)) {
    return [...ALL_SESSION_SECTIONS];
  }

  const allowed = new Set<string>(ALL_SESSION_SECTIONS);
  const sections = value
    .map((item) => String(item || "").trim())
    .filter((item): item is SessionSectionKey => allowed.has(item));

  return sections.length > 0 ? Array.from(new Set(sections)) : [...ALL_SESSION_SECTIONS];
}

function pickSessionSections(sessionPlan: any, selectedSections: SessionSectionKey[]) {
  const partial: Record<string, unknown> = {};
  for (const section of selectedSections) {
    if (section in (sessionPlan || {})) {
      partial[section] = sessionPlan[section];
    }
  }
  return partial;
}

function mergeSessionPlanSections(basePlan: any, patchPlan: any, selectedSections: SessionSectionKey[]) {
  const merged = {
    ...(basePlan || {}),
    ...(patchPlan || {}),
  };

  for (const section of ALL_SESSION_SECTIONS) {
    if (!selectedSections.includes(section) && basePlan && section in basePlan) {
      merged[section] = basePlan[section];
    }
  }

  return merged;
}

function normalizeAssessmentCustomization(input: any): SessionAssessmentCustomization | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const questionTypes = Array.isArray(input.questionTypes)
    ? input.questionTypes
        .map((item: any): AssessmentQuestionTypeRequest => ({
          type: String(item?.type || "").trim() as AssessmentQuestionType,
          label: String(item?.label || "").trim() || undefined,
          questionCount: Math.max(0, toNumberOrZero(item?.questionCount)),
          marksEach: Math.max(0, toNumberOrZero(item?.marksEach)),
        }))
        .filter((item: AssessmentQuestionTypeRequest) => item.type && item.questionCount != null && item.marksEach != null)
    : [];

  const derivedTotalQuestions = questionTypes.reduce((sum: number, item: AssessmentQuestionTypeRequest) => sum + Number(item.questionCount || 0), 0);
  const derivedTotalMarks = questionTypes.reduce(
    (sum: number, item: AssessmentQuestionTypeRequest) => sum + Number(item.questionCount || 0) * Number(item.marksEach || 0),
    0
  );

  return {
    assessmentType: String(input.assessmentType || "").trim() || "Session assessment",
    difficulty: String(input.difficulty || "").trim() || "Balanced",
    paperObjective: String(input.paperObjective || "").trim(),
    totalMarks: Math.max(0, toNumberOrZero(input.totalMarks)) || derivedTotalMarks || null,
    totalQuestions: Math.max(0, toNumberOrZero(input.totalQuestions)) || derivedTotalQuestions || null,
    questionTypes,
  };
}

function buildAssessmentCustomizationSignature(customization: SessionAssessmentCustomization | null | undefined) {
  return JSON.stringify({
    assessmentType: String(customization?.assessmentType || "Session assessment"),
    difficulty: String(customization?.difficulty || "Balanced"),
    paperObjective: String(customization?.paperObjective || ""),
    totalMarks: Number(customization?.totalMarks || 0),
    totalQuestions: Number(customization?.totalQuestions || 0),
    questionTypes: Array.isArray(customization?.questionTypes)
      ? customization!.questionTypes!.map((item) => ({
          type: item.type,
          label: item.label || "",
          questionCount: Number(item.questionCount || 0),
          marksEach: Number(item.marksEach || 0),
        }))
      : [],
  });
}

function hasAssessmentCustomizationContent(customization: SessionAssessmentCustomization | null | undefined) {
  const questionTypes = Array.isArray(customization?.questionTypes) ? customization!.questionTypes! : [];
  const totalQuestions = questionTypes.reduce((sum, item) => sum + Number(item.questionCount || 0), 0);
  const totalMarks = questionTypes.reduce((sum, item) => sum + Number(item.questionCount || 0) * Number(item.marksEach || 0), 0);
  return totalQuestions > 0 && totalMarks > 0;
}

function hasAssessmentSourceContent(sessionPlan: any) {
  return Boolean(
    sessionPlan &&
    typeof sessionPlan === "object" &&
    (
      (Array.isArray(sessionPlan.learningOutcomes) && sessionPlan.learningOutcomes.length > 0) ||
      (typeof sessionPlan.introduction === "string" && sessionPlan.introduction.trim().length > 0) ||
      (sessionPlan.theory && (sessionPlan.theory.overview || sessionPlan.theory.detailedContent || sessionPlan.theory.keyPoints?.length)) ||
      (Array.isArray(sessionPlan.activities) && sessionPlan.activities.length > 0) ||
      sessionPlan.teacherLessonNotes ||
      sessionPlan.studentLessonNotes
    )
  );
}

function limitString(value: any, maxLength: number) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function limitStringList(values: any, maxItems: number, maxLengthPerItem: number) {
  return (Array.isArray(values) ? values : [])
    .map((item: any) => limitString(item, maxLengthPerItem))
    .filter(Boolean)
    .slice(0, maxItems);
}

function compactTeacherLessonNotesForAssessment(notes: any) {
  if (!notes || typeof notes !== "object") return null;

  return {
    sessionOverview: limitString(notes.sessionOverview, 500),
    prerequisiteKnowledge: limitStringList(notes.prerequisiteKnowledge, 6, 180),
    learningOutcomes: limitStringList(notes.learningOutcomes, 8, 220),
    lessonPurpose: limitStringList(notes.lessonPurpose, 6, 220),
    teachingSequence: limitStringList(notes.teachingSequence, 8, 220),
    guidedPractice: limitStringList(notes.guidedPractice, 6, 220),
    misconceptions: limitStringList(notes.misconceptions, 6, 180),
    formativeChecks: limitStringList(notes.formativeChecks, 8, 220),
    assessmentQuestions: limitStringList(notes.assessmentQuestions, 8, 220),
    sessionSummary: limitStringList(notes.sessionSummary, 6, 220),
    conceptFlow: (Array.isArray(notes.conceptFlow) ? notes.conceptFlow : []).slice(0, 6).map((item: any) => ({
      conceptName: limitString(item?.conceptName, 140),
      definition: limitString(item?.definition, 220),
      coreExplanation: limitString(item?.coreExplanation, 320),
      importance: limitString(item?.importance, 220),
      keywords: limitStringList(item?.keywords, 6, 80),
      examples: limitStringList(item?.examples, 4, 160),
    })),
    lessonBlocks: (Array.isArray(notes.lessonBlocks) ? notes.lessonBlocks : []).slice(0, 6).map((item: any) => ({
      title: limitString(item?.title, 140),
      durationMinutes: Number(item?.durationMinutes || 0) || undefined,
      explanation: limitStringList(item?.explanation, 3, 220),
      examples: limitStringList(item?.examples, 3, 180),
      checkUnderstanding: limitStringList(item?.checkUnderstanding, 3, 180),
      expectedAnswers: limitStringList(item?.expectedAnswers, 3, 180),
      activity: limitStringList(item?.activity, 2, 180),
    })),
  };
}

function compactStudentLessonNotesForAssessment(notes: any) {
  if (!notes || typeof notes !== "object") return null;

  return {
    title: limitString(notes.title, 220),
    sessionOverview: limitString(notes.sessionOverview, 500),
    introduction: limitString(notes.introduction, 500),
    learningObjectives: limitStringList(notes.learningObjectives, 8, 220),
    keyTerms: limitStringList(notes.keyTerms, 10, 100),
    quickSummary: limitStringList(notes.quickSummary, 6, 220),
    summary: limitStringList(notes.summary, 6, 220),
    rememberPoints: limitStringList(notes.rememberPoints, 8, 180),
    definitions: (Array.isArray(notes.definitions) ? notes.definitions : []).slice(0, 10).map((item: any) => ({
      term: limitString(item?.term, 100),
      definition: limitString(item?.definition, 220),
    })),
    sections: (Array.isArray(notes.sections) ? notes.sections : []).slice(0, 6).map((item: any) => ({
      heading: limitString(item?.heading, 160),
      explanation: limitString(item?.explanation, 320),
      keyPoints: limitStringList(item?.keyPoints, 5, 180),
      examples: limitStringList(item?.examples, 3, 180),
      importantNotes: limitStringList(item?.importantNotes, 4, 180),
      conceptSummary: limitStringList(item?.conceptSummary, 3, 180),
    })),
    workedExamples: (Array.isArray(notes.workedExamples) ? notes.workedExamples : []).slice(0, 4).map((item: any) => ({
      title: limitString(item?.title, 160),
      steps: limitStringList(item?.steps, 5, 180),
      explanation: limitString(item?.explanation, 260),
    })),
    selfCheckQuestions: limitStringList(notes.selfCheckQuestions, 8, 180),
    veryShortAnswerQuestions: (Array.isArray(notes.veryShortAnswerQuestions) ? notes.veryShortAnswerQuestions : []).slice(0, 6).map((item: any) => ({
      question: limitString(item?.question, 180),
      answer: limitString(item?.answer, 220),
    })),
    mcqQuestions: (Array.isArray(notes.mcqQuestions) ? notes.mcqQuestions : []).slice(0, 6).map((item: any) => ({
      question: limitString(item?.question, 180),
      answer: limitString(item?.answer, 140),
    })),
  };
}

function buildAssessmentSourceSessionPayload(sessionPlan: any, fallback: Record<string, unknown>) {
  if (!sessionPlan || typeof sessionPlan !== "object") {
    return fallback;
  }

  return {
    id: sessionPlan.id || fallback.id,
    sessionNumber: sessionPlan.sessionNumber || fallback.sessionNumber,
    title: sessionPlan.title || fallback.title,
    duration: sessionPlan.duration || fallback.duration,
    learningOutcomes: limitStringList(
      Array.isArray(sessionPlan.learningOutcomes) ? sessionPlan.learningOutcomes : fallback.learningOutcomes,
      10,
      220
    ),
    introduction: limitString(sessionPlan.introduction, 700),
    theory: sessionPlan.theory
      ? {
          overview: limitString(sessionPlan.theory.overview, 700),
          keyPoints: limitStringList(sessionPlan.theory.keyPoints, 10, 220),
          detailedContent: limitString(sessionPlan.theory.detailedContent, 1200),
        }
      : null,
    activities: (Array.isArray(sessionPlan.activities) ? sessionPlan.activities : []).slice(0, 8).map((item: any) => ({
      name: limitString(item?.name, 160),
      instructions: limitStringList(item?.instructions, 4, 220),
      durationMinutes: Number(item?.durationMinutes || 0) || undefined,
    })),
    teacherLessonNotes: compactTeacherLessonNotesForAssessment(sessionPlan.teacherLessonNotes),
    studentLessonNotes: compactStudentLessonNotesForAssessment(sessionPlan.studentLessonNotes),
    topicCoverage: limitStringList(sessionPlan.topicCoverage, 12, 140),
  };
}

function buildRequestedSubtypeSequence(
  customization: SessionAssessmentCustomization | null | undefined,
  target: "shortAnswer" | "longAnswer"
) {
  const sourceTypes = Array.isArray(customization?.questionTypes) ? customization!.questionTypes! : [];
  const includedTypes =
    target === "shortAnswer"
      ? (["veryShortAnswer", "shortAnswer"] as AssessmentRenderedSubtype[])
      : (["longAnswer", "caseStudy"] as AssessmentRenderedSubtype[]);

  return sourceTypes.flatMap((item) =>
    includedTypes.includes(item.type as AssessmentRenderedSubtype)
      ? Array.from({ length: Math.max(0, Number(item.questionCount || 0)) }, () => ({
          questionSubtype: item.type as AssessmentRenderedSubtype,
          marksEach: Number(item.marksEach || 0),
        }))
      : []
  );
}

function normalizeAssessmentResponseToCustomization(
  generatedAssessment: any,
  customization: SessionAssessmentCustomization,
  defaults: {
    durationMinutes: number;
    language: string;
    preferredDifficulty: string;
  }
) {
  const assessment = generatedAssessment && typeof generatedAssessment === "object" ? { ...generatedAssessment } : {};
  const requestedQuestionTypes = Array.isArray(customization.questionTypes) ? customization.questionTypes : [];
  const expectedMcqCount = requestedQuestionTypes.reduce(
    (sum, item) => sum + (item.type === "mcq" ? Number(item.questionCount || 0) : 0),
    0
  );
  const shortSubtypeSequence = buildRequestedSubtypeSequence(customization, "shortAnswer");
  const longSubtypeSequence = buildRequestedSubtypeSequence(customization, "longAnswer");

  const mcq = Array.isArray(assessment.mcq) ? assessment.mcq : [];
  const shortAnswer = Array.isArray(assessment.shortAnswer) ? assessment.shortAnswer : [];
  const longAnswer = Array.isArray(assessment.longAnswer) ? assessment.longAnswer : [];

  if (mcq.length !== expectedMcqCount) {
    throw new Error(`Assessment generation did not match the requested MCQ count (${expectedMcqCount}).`);
  }
  if (shortAnswer.length !== shortSubtypeSequence.length) {
    throw new Error(`Assessment generation did not match the requested short-answer count (${shortSubtypeSequence.length}).`);
  }
  if (longAnswer.length !== longSubtypeSequence.length) {
    throw new Error(`Assessment generation did not match the requested long-answer count (${longSubtypeSequence.length}).`);
  }

  const legacyToNormalizedId = new Map<string, string>();
  const makeContinuousQuestionId = (questionNumber: number) => `q${questionNumber}`;

  const normalizedMcq = mcq.map((item: any, index: number) => {
    const requestedType = requestedQuestionTypes.find((entry) => entry.type === "mcq");
    const normalizedId = makeContinuousQuestionId(index + 1);
    if (typeof item?.id === "string" && item.id.trim()) {
      legacyToNormalizedId.set(item.id.trim(), normalizedId);
    }
    return {
      ...item,
      id: normalizedId,
      questionSubtype: "mcq" as const,
      marks: Number(requestedType?.marksEach || item?.marks || 1),
    };
  });

  const normalizedShortAnswer = shortAnswer.map((item: any, index: number) => {
    const normalizedId = makeContinuousQuestionId(normalizedMcq.length + index + 1);
    if (typeof item?.id === "string" && item.id.trim()) {
      legacyToNormalizedId.set(item.id.trim(), normalizedId);
    }
    return {
      ...item,
      id: normalizedId,
      questionSubtype: shortSubtypeSequence[index]?.questionSubtype,
      marks: Number(shortSubtypeSequence[index]?.marksEach || item?.marks || 0),
    };
  });

  const normalizedLongAnswer = longAnswer.map((item: any, index: number) => {
    const normalizedId = makeContinuousQuestionId(normalizedMcq.length + normalizedShortAnswer.length + index + 1);
    if (typeof item?.id === "string" && item.id.trim()) {
      legacyToNormalizedId.set(item.id.trim(), normalizedId);
    }
    return {
      ...item,
      id: normalizedId,
      questionSubtype: longSubtypeSequence[index]?.questionSubtype,
      marks: Number(longSubtypeSequence[index]?.marksEach || item?.marks || 0),
    };
  });

  const derivedMcqAnswerKey = normalizedMcq.map((item: any) => ({
    id: item.id,
    answer: item.answer || "Answer not provided",
    explanation: item.explanation,
    marks: Number(item.marks || 0),
    questionSubtype: "mcq" as const,
  }));
  const derivedShortAnswerKey = normalizedShortAnswer.map((item: any) => ({
    id: item.id,
    answer: item.answer || "Answer not provided",
    rubric: Array.isArray(item.rubric) ? item.rubric : [],
    marks: Number(item.marks || 0),
    questionSubtype: item.questionSubtype,
  }));
  const derivedLongAnswerKey = normalizedLongAnswer.map((item: any) => ({
    id: item.id,
    answer: item.answer || "Answer not provided",
    rubric: Array.isArray(item.rubric) ? item.rubric : [],
    marks: Number(item.marks || 0),
    questionSubtype: item.questionSubtype,
  }));

  const answerKey = {
    ...(assessment.answerKey && typeof assessment.answerKey === "object" ? assessment.answerKey : {}),
    mcq:
      Array.isArray(assessment.answerKey?.mcq) && assessment.answerKey.mcq.length === normalizedMcq.length
        ? assessment.answerKey.mcq.map((item: any, index: number) => ({
            ...item,
            id: normalizedMcq[index]?.id,
            marks: Number(normalizedMcq[index]?.marks || item?.marks || 0),
            questionSubtype: "mcq" as const,
          }))
        : derivedMcqAnswerKey,
    shortAnswer:
      Array.isArray(assessment.answerKey?.shortAnswer) && assessment.answerKey.shortAnswer.length === normalizedShortAnswer.length
        ? assessment.answerKey.shortAnswer.map((item: any, index: number) => ({
            ...item,
            id: normalizedShortAnswer[index]?.id,
            marks: Number(normalizedShortAnswer[index]?.marks || item?.marks || 0),
            questionSubtype: normalizedShortAnswer[index]?.questionSubtype,
          }))
        : derivedShortAnswerKey,
    longAnswer:
      Array.isArray(assessment.answerKey?.longAnswer) && assessment.answerKey.longAnswer.length === normalizedLongAnswer.length
        ? assessment.answerKey.longAnswer.map((item: any, index: number) => ({
            ...item,
            id: normalizedLongAnswer[index]?.id,
            marks: Number(normalizedLongAnswer[index]?.marks || item?.marks || 0),
            questionSubtype: normalizedLongAnswer[index]?.questionSubtype,
          }))
        : derivedLongAnswerKey,
    generalMarkingGuidance: Array.isArray(assessment.answerKey?.generalMarkingGuidance)
      ? assessment.answerKey.generalMarkingGuidance
      : [
          "Award marks exactly according to the requested question pattern.",
          "Accept equivalent correct wording when the concept taught in the session is preserved.",
          "Use the rubric point-wise for short and long answers.",
        ],
  };

  const totalMarks = requestedQuestionTypes.reduce(
    (sum, item) => sum + Number(item.questionCount || 0) * Number(item.marksEach || 0),
    0
  );
  const totalQuestions = requestedQuestionTypes.reduce((sum, item) => sum + Number(item.questionCount || 0), 0);

  return {
    ...assessment,
    assessmentMeta: {
      ...(assessment.assessmentMeta && typeof assessment.assessmentMeta === "object" ? assessment.assessmentMeta : {}),
      assessmentType: customization.assessmentType || assessment.assessmentMeta?.assessmentType || "Session assessment",
      totalMarks,
      totalQuestions,
      durationMinutes: defaults.durationMinutes,
      preferredDifficulty: customization.difficulty || defaults.preferredDifficulty,
      language: defaults.language,
      paperObjective: customization.paperObjective || "",
      requestSignature: buildAssessmentCustomizationSignature(customization),
      requestedQuestionTypes,
    },
    blueprint: {
      ...(assessment.blueprint && typeof assessment.blueprint === "object" ? assessment.blueprint : {}),
      learningOutcomeCoverage: Array.isArray(assessment.blueprint?.learningOutcomeCoverage)
        ? assessment.blueprint.learningOutcomeCoverage.map((item: any) => ({
            ...item,
            questionRefs: Array.isArray(item?.questionRefs)
              ? item.questionRefs.map((ref: any) => {
                  const normalizedRef = typeof ref === "string" ? legacyToNormalizedId.get(ref.trim()) : undefined;
                  return normalizedRef || ref;
                })
              : [],
          }))
        : [],
      questionDistribution: {
        ...(assessment.blueprint?.questionDistribution && typeof assessment.blueprint.questionDistribution === "object"
          ? assessment.blueprint.questionDistribution
          : {}),
        mcq: normalizedMcq.length,
        shortAnswer: normalizedShortAnswer.length,
        longAnswer: normalizedLongAnswer.length,
      },
    },
    mcq: normalizedMcq,
    shortAnswer: normalizedShortAnswer,
    longAnswer: normalizedLongAnswer,
    answerKey,
  };
}

function stripHtmlTags(value: string) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function xmlEscape(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugifyFileNamePart(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

const pptAssetResolutionCache = new Map<string, any>();
const USE_REMOTE_PPT_ASSETS = false;

async function resolveOpenverseImage(query: string) {
  const url = `https://api.openverse.engineering/v1/images?q=${encodeURIComponent(query)}&page_size=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Openverse lookup failed with status ${res.status}`);
  }
  const data = await res.json();
  const item = Array.isArray(data?.results) ? data.results[0] : null;
  if (!item) {
    return null;
  }
  return {
    sourceSite: "Openverse",
    sourceUrl: String(item.foreign_landing_url || item.url || ""),
    previewUrl: String(item.thumbnail || item.url || ""),
    licenseType: [item.license, item.license_version].filter(Boolean).join(" ").trim() || "Reusable",
    attributionText: [item.creator, item.title].filter(Boolean).join(" - "),
    altText: String(item.title || query),
  };
}

async function resolveWikimediaImage(query: string) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Wikimedia lookup failed with status ${res.status}`);
  }
  const data = await res.json();
  const pages = Object.values((data as any)?.query?.pages || {}) as any[];
  const first = pages[0];
  const info = first?.imageinfo?.[0];
  if (!info) {
    return null;
  }
  const meta = info.extmetadata || {};
  return {
    sourceSite: "Wikimedia Commons",
    sourceUrl: String(info.descriptionurl || info.url || ""),
    previewUrl: String(info.thumburl || info.url || ""),
    licenseType: stripHtmlTags(meta?.LicenseShortName?.value || meta?.UsageTerms?.value || "Reusable"),
    attributionText: stripHtmlTags(meta?.Artist?.value || meta?.Credit?.value || first?.title || query),
    altText: stripHtmlTags(meta?.ImageDescription?.value || first?.title || query),
  };
}

async function resolveReusableImageAsset(query: string) {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return null;
  }
  if (pptAssetResolutionCache.has(normalizedQuery)) {
    return pptAssetResolutionCache.get(normalizedQuery);
  }

  let resolved = null;
  try {
    resolved = await resolveOpenverseImage(normalizedQuery);
  } catch (error) {
    console.warn(`[PPT Assets] Openverse lookup failed for "${normalizedQuery}":`, error);
  }

  if (!resolved) {
    try {
      resolved = await resolveWikimediaImage(normalizedQuery);
    } catch (error) {
      console.warn(`[PPT Assets] Wikimedia lookup failed for "${normalizedQuery}":`, error);
    }
  }

  pptAssetResolutionCache.set(normalizedQuery, resolved);
  return resolved;
}

function inferTemplateSlideKey(slide: any, index: number) {
  const explicitKey = String(slide?.templateSlideKey || "").trim();
  if (explicitKey) {
    return explicitKey;
  }

  const normalizedTitle = `${String(slide?.slideTitle || slide?.title || "").toLowerCase()} ${String(slide?.slideType || "").toLowerCase()}`;
  const keywordMap: Array<{ key: string; patterns: string[] }> = [
    { key: "title_identity", patterns: ["title", "building blocks", "session identity", "topic name"] },
    { key: "learning_outcomes", patterns: ["learning outcome", "objective"] },
    { key: "prerequisite_knowledge", patterns: ["prerequisite", "before today", "recall", "prior knowledge"] },
    { key: "lesson_hook", patterns: ["hook", "opening", "story", "session opening", "bridge"] },
    { key: "topic_introduction", patterns: ["introduction", "definition", "topic introduction"] },
    { key: "core_concept_a", patterns: ["core concept a", "core concept", "concept", "key difference", "major organelle"] },
    { key: "core_concept_b_visual", patterns: ["core concept b", "visual explanation", "diagram", "labelled"] },
    { key: "worked_example", patterns: ["worked example", "demonstration", "example"] },
    { key: "guided_practice", patterns: ["guided practice", "activity"] },
    { key: "quick_assessment", patterns: ["assessment", "poll", "question", "formative"] },
    { key: "summary", patterns: ["summary", "takeaway", "recap", "key takeaway"] },
    { key: "homework_next_session", patterns: ["homework", "next session", "next class", "thank you"] },
  ];

  const matched = keywordMap.find((entry) => entry.patterns.some((pattern) => normalizedTitle.includes(pattern)));
  if (matched) {
    return matched.key;
  }

  return KAMALANIKETAN_TEMPLATE_SLIDES[index]?.key || `template_slot_${index + 1}`;
}

function buildTemplateThemeTokens(ppt: any) {
  const requestedThemeId = String(ppt?.themeId || "").trim();
  const preset =
    (requestedThemeId && PPT_THEME_PRESETS[requestedThemeId]) ||
    PPT_THEME_PRESETS["cbse-academic-blue"];

  return {
    themeId: preset.themeId,
    themeName: String(ppt?.themeName || ppt?.theme || preset.themeName),
    fonts: {
      heading: String(ppt?.themeTokens?.fonts?.heading || preset.fonts.heading),
      body: String(ppt?.themeTokens?.fonts?.body || preset.fonts.body),
    },
    colors: {
      primary: String(ppt?.themeTokens?.colors?.primary || preset.colors.primary),
      secondary: String(ppt?.themeTokens?.colors?.secondary || preset.colors.secondary),
      accent: String(ppt?.themeTokens?.colors?.accent || preset.colors.accent),
      background: String(ppt?.themeTokens?.colors?.background || preset.colors.background),
      surface: String(ppt?.themeTokens?.colors?.surface || preset.colors.surface),
      text: String(ppt?.themeTokens?.colors?.text || preset.colors.text),
      mutedText: String(ppt?.themeTokens?.colors?.mutedText || preset.colors.mutedText),
    },
    visualStyle: {
      topBarStyle: String(ppt?.themeTokens?.visualStyle?.topBarStyle || preset.visualStyle.topBarStyle),
      cardStyle: String(ppt?.themeTokens?.visualStyle?.cardStyle || preset.visualStyle.cardStyle),
      visualFrameStyle: String(ppt?.themeTokens?.visualStyle?.visualFrameStyle || preset.visualStyle.visualFrameStyle),
    },
  };
}

function getPptTemplatePreset(templateId?: string | null) {
  const requestedTemplateId = String(templateId || "").trim();
  const normalizedTemplateId =
    !requestedTemplateId || requestedTemplateId === KAMALANIKETAN_TEMPLATE_ID
      ? "academic-split"
      : requestedTemplateId;
  return (
    (normalizedTemplateId && PPT_TEMPLATE_PRESETS[normalizedTemplateId as keyof typeof PPT_TEMPLATE_PRESETS]) ||
    PPT_TEMPLATE_PRESETS["academic-split"]
  );
}

function shouldPreferSvgVisual(slide: any) {
  const type = String(slide?.slideType || "").toLowerCase();
  const key = String(slide?.templateSlideKey || "").toLowerCase();
  return [
    "visual-explanation",
    "concept",
    "worked-example",
    "guided-practice",
    "quick-assessment",
    "summary",
  ].includes(type) || [
    "core_concept_a",
    "core_concept_b_visual",
    "worked_example",
    "guided_practice",
    "quick_assessment",
    "summary",
  ].includes(key);
}

function buildFallbackSvgDiagram(slide: any, themeTokens: any) {
  const title = xmlEscape(String(slide?.slideTitle || "Concept Diagram"));
  const rawItems = Array.isArray(slide?.onSlideText) && slide.onSlideText.length > 0
    ? slide.onSlideText
    : Array.isArray(slide?.bulletPoints)
    ? slide.bulletPoints
    : [];
  const items = rawItems.map((item: any) => String(item || "").trim()).filter(Boolean).slice(0, 4);
  if (!items.length) {
    return "";
  }

  const primary = String(themeTokens?.colors?.primary || "#1D4E89").replace("#", "");
  const accent = String(themeTokens?.colors?.accent || "#D97706").replace("#", "");
  const surface = String(themeTokens?.colors?.surface || "#FFFFFF").replace("#", "");
  const muted = String(themeTokens?.colors?.mutedText || "#6B7280").replace("#", "");
  const text = String(themeTokens?.colors?.text || "#1F2937").replace("#", "");
  const cardWidth = 760;
  const cardHeight = 120;
  const cardX = 100;
  const startY = 170;
  const rowGap = 34;

  const cards = items.map((item: string, index: number) => {
    const y = startY + index * (cardHeight + rowGap);
    const safeText = xmlEscape(item);
    const connector = index < items.length - 1
      ? `<line x1="480" y1="${y + cardHeight}" x2="480" y2="${y + cardHeight + rowGap}" stroke="#${accent}" stroke-width="6" stroke-linecap="round"/>`
      : "";
    return `
      <rect x="${cardX}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="28" fill="#${surface}" stroke="#${primary}" stroke-width="4"/>
      <circle cx="154" cy="${y + 60}" r="28" fill="#${accent}"/>
      <text x="154" y="${y + 70}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="#${surface}">${index + 1}</text>
      <foreignObject x="210" y="${y + 22}" width="600" height="78">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 24px; line-height: 1.35; color: #${text};">
          ${safeText}
        </div>
      </foreignObject>
      ${connector}
    `;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720" role="img" aria-label="${title}">
  <rect x="0" y="0" width="960" height="720" fill="#F8FBFD"/>
  <rect x="60" y="52" width="840" height="84" rx="24" fill="#${primary}"/>
  <text x="88" y="104" font-family="Arial, sans-serif" font-weight="700" font-size="34" fill="#FFFFFF">${title}</text>
  <text x="88" y="146" font-family="Arial, sans-serif" font-size="18" fill="#${muted}">CBSE-inspired classroom explanation flow</text>
  ${cards}
</svg>`;
}

async function resolvePptSlideAssets(
  requestId: string,
  debugDir: string,
  slide: any,
  sessionContext: {
    subject?: string;
    gradeLevel?: string;
    sessionTitle?: string;
  }
) {
  const slideTitle = String(slide?.slideTitle || slide?.title || "Slide visual");
  const existingAssets = Array.isArray(slide?.assets) && slide.assets.length > 0
    ? slide.assets
    : [{
        purpose: `Support visual explanation for ${slideTitle}`,
        searchQuery: `${sessionContext.subject || "classroom"} ${slideTitle} diagram`,
        sourceSite: "Ollama image model",
        sourceUrl: "",
        licenseType: "Internally generated",
        attributionText: "",
        altText: `Illustration or diagram for ${slideTitle}`,
        placementHint: "Right panel or supporting visual zone",
      }];

  const preferSvg = shouldPreferSvgVisual(slide);
  const normalizedAssets = await Promise.all(existingAssets.map(async (asset: any) => {
    const searchQuery = String(asset?.searchQuery || `${sessionContext.subject || "classroom"} ${slideTitle} diagram`);
    const needsResolution =
      !asset?.sourceUrl ||
      String(asset.sourceUrl).includes("example.com") ||
      !asset?.previewUrl;

    let resolved = null;
    if (USE_REMOTE_PPT_ASSETS && !preferSvg && needsResolution) {
      resolved = await resolveReusableImageAsset(searchQuery);
    }

    const assetImageDataUrl = typeof asset?.imageDataUrl === "string" ? asset.imageDataUrl : "";
    const assetMimeType = typeof asset?.mimeType === "string" ? asset.mimeType : "";
    const assetModel = typeof asset?.model === "string" ? asset.model : "";
    const finalAsset: Record<string, any> = {
      purpose: String(asset?.purpose || `Support visual explanation for ${slideTitle}`),
      searchQuery,
      sourceSite: String(asset?.sourceSite || resolved?.sourceSite || (preferSvg ? "Internal SVG" : "Ollama image model")),
      sourceUrl: "",
      previewUrl: assetImageDataUrl || "",
      licenseType: String(asset?.licenseType || resolved?.licenseType || (preferSvg ? "Internal SVG diagram" : "Internally generated")),
      attributionText: "",
      altText: String(asset?.altText || resolved?.altText || `Illustration or diagram for ${slideTitle}`),
      placementHint: String(asset?.placementHint || "Right panel or supporting visual zone"),
      imageDataUrl: assetImageDataUrl,
      mimeType: assetMimeType,
      model: assetModel,
      sourceKind: String(
        assetImageDataUrl
          ? (asset?.sourceKind || "generated-image")
          : preferSvg
          ? "svg-diagram"
          : "none"
      ),
    };

    const hasUsableVisual = Boolean(finalAsset.imageDataUrl);
    if (!preferSvg && hasUsableVisual) {
      return finalAsset;
    }
    if (preferSvg) {
      return {
        ...finalAsset,
        sourceSite: "Internal SVG",
        sourceUrl: "",
        previewUrl: "",
        imageDataUrl: "",
        mimeType: "",
        model: "",
        licenseType: "Internal SVG diagram",
        sourceKind: "svg-diagram",
      };
    }

    const imagePrompt = [
      "Create a clean classroom slide visual for a school teacher presentation.",
      `Subject: ${String(sessionContext.subject || "School subject")}.`,
      `Grade level: ${String(sessionContext.gradeLevel || "School grade")}.`,
      `Session title: ${String(sessionContext.sessionTitle || "Lesson session")}.`,
      `Slide title: ${slideTitle}.`,
      `Visual requirement: ${String(slide?.visualPlan || finalAsset.purpose || searchQuery)}.`,
      "Style: accurate, educational, uncluttered, presentation-friendly, white or light background, teacher-safe, no watermark.",
      "Important: do not include words, labels, text, captions, letters, or numbers inside the image.",
      "Prefer a clean central composition with diagram-like educational clarity.",
      "Do not imitate stock-photo websites or watermarked online classroom graphics.",
    ].join(" ");

    try {
      const generated = await generateImageWithOllama(
        requestId,
        debugDir,
        `ppt-visual-${slugifyFileNamePart(slideTitle || "slide-visual")}`,
        imagePrompt
      );

      return {
        ...finalAsset,
        imageDataUrl: generated.imageDataUrl,
        mimeType: generated.mimeType,
        model: generated.model,
        sourceKind: "generated-image",
        sourceSite: "Ollama image model",
        sourceUrl: "",
        previewUrl: generated.imageDataUrl,
        licenseType: "Internally generated",
        attributionText: "",
      };
    } catch (error) {
      console.warn(`[PPT Assets] Image fallback failed for "${slideTitle}":`, error);
      return {
        ...finalAsset,
        sourceKind: "none",
      };
    }
  }));

  return normalizedAssets;
}

async function normalizePptMaterial(ppt: any, sessionContext: {
  subject?: string;
  gradeLevel?: string;
  sessionTitle?: string;
  learningOutcomes?: string[];
  selectedChapters?: string[];
  requestId?: string;
  debugDir?: string;
  generationOptions?: {
    pptTemplateId?: string;
    pptThemeId?: string;
  };
}) {
  if (!ppt || typeof ppt !== "object") {
    return ppt;
  }

  const templatePreset = getPptTemplatePreset(
    ppt?.templateId ||
    sessionContext.generationOptions?.pptTemplateId
  );
  const themeTokens = buildTemplateThemeTokens({
    ...ppt,
    themeId: ppt?.themeId || sessionContext.generationOptions?.pptThemeId,
  });
  const rawSlides = Array.isArray(ppt.slides) ? ppt.slides : [];
  const normalizedSlidesBySlot = new Map<string, any>();

  for (let index = 0; index < rawSlides.length; index += 1) {
    const slide = rawSlides[index];
    const slideTitle = String(
      slide?.slideTitle ||
      slide?.title ||
      `Slide ${index + 1}`
    );
    const bulletPoints = Array.isArray(slide?.bulletPoints)
      ? slide.bulletPoints.map((item: any) => String(item))
      : [];
    const onSlideText = Array.isArray(slide?.onSlideText)
      ? slide.onSlideText.map((item: any) => String(item))
      : bulletPoints.slice(0, 4);
    const learningOutcomeIds = Array.isArray(slide?.learningOutcomeIds) && slide.learningOutcomeIds.length > 0
      ? slide.learningOutcomeIds.map((item: any) => String(item))
      : (sessionContext.learningOutcomes || []).slice(0, 2);
    const topicCoverage = Array.isArray(slide?.topicCoverage) && slide.topicCoverage.length > 0
      ? slide.topicCoverage.map((item: any) => String(item))
      : (sessionContext.selectedChapters || []);
    const templateSlot =
      KAMALANIKETAN_TEMPLATE_SLIDES.find((entry) => entry.key === inferTemplateSlideKey(slide, index)) ||
      KAMALANIKETAN_TEMPLATE_SLIDES[index] ||
      KAMALANIKETAN_TEMPLATE_SLIDES[KAMALANIKETAN_TEMPLATE_SLIDES.length - 1];
    const normalizedAssets = await resolvePptSlideAssets(
      sessionContext.requestId || makeRequestId("ppt-assets"),
      sessionContext.debugDir || DEBUG_OUTPUT_DIR,
      {
        ...slide,
        slideTitle,
        templateSlideKey: templateSlot.key,
      },
      sessionContext
    );
    const rawSvgCode = String(slide?.svgDiagram?.svgCode || "").trim();
    const shouldUseSvg = shouldPreferSvgVisual({
      ...slide,
      templateSlideKey: templateSlot.key,
    });
    const svgCode = rawSvgCode || (shouldUseSvg ? buildFallbackSvgDiagram({
      ...slide,
      slideTitle,
      templateSlideKey: templateSlot.key,
    }, themeTokens) : "");

    const normalizedSlide = {
      templateId: String(slide?.templateId || templatePreset.templateId),
      templateSlideKey: templateSlot.key,
      templateSlideTitle: String(slide?.templateSlideTitle || templateSlot.label),
      isOptionalSlotFilled: typeof slide?.isOptionalSlotFilled === "boolean"
        ? slide.isOptionalSlotFilled
        : Boolean(
            bulletPoints.length ||
            onSlideText.length ||
            normalizedAssets.length ||
            slide?.visualPlan ||
            slide?.speakerNotes?.length
          ),
      slideNumber: Number(slide?.slideNumber) || index + 1,
      slideType: String(slide?.slideType || templateSlot.slideType),
      slideTitle,
      learningOutcomeIds,
      topicCoverage,
      teacherIntent: String(
        slide?.teacherIntent ||
        `Use this slide to teach ${slideTitle} clearly and keep it aligned to the session flow.`
      ),
      studentTakeaway: String(
        slide?.studentTakeaway ||
        bulletPoints[0] ||
        `Students should understand the core idea behind ${slideTitle}.`
      ),
      layout: String(slide?.layout || `${templatePreset.layoutMode} layout with concise teaching copy and supporting visual area`),
      bulletPoints,
      onSlideText,
      speakerNotes: Array.isArray(slide?.speakerNotes) && slide.speakerNotes.length > 0
        ? slide.speakerNotes.map((item: any) => String(item))
        : bulletPoints.map((item: string) => `Explain: ${item}`),
      visualPlan: String(
        slide?.visualPlan ||
        `Use a precise classroom visual for ${slideTitle}. Prefer diagram/SVG when conceptual accuracy matters.`
      ),
      assets: normalizedAssets,
      svgDiagram: slide?.svgDiagram
        ? slide.svgDiagram
        : {
            title: `${slideTitle} visual`,
            type: shouldUseSvg ? "concept diagram" : "visual support",
            instructions: [
              `If a sourced image is not precise enough, use a compact classroom diagram for ${slideTitle}.`,
              "Prefer labelled structure/flow/comparison visuals only when they directly improve teaching clarity.",
            ],
            svgCode,
          },
      animationHints: Array.isArray(slide?.animationHints) && slide.animationHints.length > 0
        ? slide.animationHints.map((item: any) => String(item))
        : ["Reveal bullets progressively while explaining."],
      timeEstimateMinutes: Number(slide?.timeEstimateMinutes) || 4,
    };

    if (!normalizedSlidesBySlot.has(templateSlot.key)) {
      normalizedSlidesBySlot.set(templateSlot.key, normalizedSlide);
    }
  }

  const normalizedSlides = KAMALANIKETAN_TEMPLATE_SLIDES.map((templateSlot, index) => {
    const existing = normalizedSlidesBySlot.get(templateSlot.key);
    if (existing) {
      return {
        ...existing,
        slideNumber: index + 1,
        templateId: templatePreset.templateId,
        templateSlideKey: templateSlot.key,
        templateSlideTitle: templateSlot.label,
      };
    }

    const lowDensityTitle = templateSlot.label;
    const lowDensityBullets = templateSlot.optional
      ? ["Keep this slide light and session-faithful. No extra content beyond the taught lesson."]
      : [`Cover the ${templateSlot.label.toLowerCase()} for this session using only taught content.`];

    return {
      templateId: templatePreset.templateId,
      templateSlideKey: templateSlot.key,
      templateSlideTitle: templateSlot.label,
      isOptionalSlotFilled: false,
      slideNumber: index + 1,
      slideType: templateSlot.slideType,
      slideTitle: lowDensityTitle,
      learningOutcomeIds: (sessionContext.learningOutcomes || []).slice(0, 2),
      topicCoverage: sessionContext.selectedChapters || [],
      teacherIntent: `Use the ${templateSlot.label.toLowerCase()} slot without inventing new curriculum content.`,
      studentTakeaway: "",
      layout: `${templatePreset.layoutMode} template slide`,
      bulletPoints: lowDensityBullets,
      onSlideText: [lowDensityTitle],
      speakerNotes: ["Leave concise placeholders only when the session does not naturally support this slot."],
      visualPlan: templateSlot.key === "core_concept_b_visual"
        ? "Prefer a clean diagram or labelled visual that matches the taught concept."
        : "Use the template visual area only if it strengthens this session's taught content.",
      assets: [],
      svgDiagram: templateSlot.key === "core_concept_b_visual"
        || templateSlot.key === "core_concept_a"
        ? {
            title: `${lowDensityTitle} visual`,
            type: "labelled diagram",
            instructions: ["Provide a simple session-faithful visual only if the taught concept requires it."],
            svgCode: buildFallbackSvgDiagram({
              slideTitle: lowDensityTitle,
              onSlideText: lowDensityBullets,
              templateSlideKey: templateSlot.key,
            }, themeTokens),
          }
        : null,
      animationHints: [],
      timeEstimateMinutes: 3,
    };
  });

  return {
    deckMode: "teacher-delivery",
    templateId: templatePreset.templateId,
    templateName: String(ppt?.templateName || templatePreset.templateName),
    themeId: String(ppt?.themeId || sessionContext.generationOptions?.pptThemeId || themeTokens.themeId),
    themeName: String(ppt?.themeName || themeTokens.themeName),
    themeTokens,
    title: String(ppt?.title || ppt?.presentationTitle || sessionContext.sessionTitle || "Session Presentation"),
    presentationTitle: String(ppt?.presentationTitle || ppt?.title || sessionContext.sessionTitle || "Session Presentation"),
    presentationGoal: String(
      ppt?.presentationGoal ||
      `Teach all key concepts from ${sessionContext.sessionTitle || "this session"} in clear classroom sequence.`
    ),
    audience: String(ppt?.audience || `${sessionContext.gradeLevel || "Grade-aligned"} classroom`),
    theme: String(ppt?.theme || themeTokens.themeName),
    assetSearchPlan: {
      preferredSources: ["Internal SVG", "Ollama image model"],
      safeSearch: typeof ppt?.assetSearchPlan?.safeSearch === "boolean" ? ppt.assetSearchPlan.safeSearch : true,
      licensingNotes: ["Use internally generated images and in-app SVG diagrams only."],
      fallbackStrategy: String(
        ppt?.assetSearchPlan?.fallbackStrategy ||
        "Prefer SVG diagrams for concept/process slides and use the Ollama image model for all picture-based visuals."
      ),
    },
    licenseChecklist: Array.isArray(ppt?.licenseChecklist) && ppt.licenseChecklist.length > 0
      ? ppt.licenseChecklist
      : [
          "All visuals should be internally generated or rendered as in-app SVG diagrams.",
          "Review generated visuals for classroom accuracy before export.",
        ],
    presentationWarnings: Array.isArray(ppt?.presentationWarnings) && ppt.presentationWarnings.length > 0
      ? ppt.presentationWarnings
      : [
          "Do not extend beyond the taught session scope.",
          "Replace placeholder asset URLs with final selected reusable assets before export if needed.",
        ],
    coverageSummary: {
      learningOutcomesCovered: Array.isArray(ppt?.coverageSummary?.learningOutcomesCovered) && ppt.coverageSummary.learningOutcomesCovered.length > 0
        ? ppt.coverageSummary.learningOutcomesCovered
        : (sessionContext.learningOutcomes || []),
      topicsCovered: Array.isArray(ppt?.coverageSummary?.topicsCovered) && ppt.coverageSummary.topicsCovered.length > 0
        ? ppt.coverageSummary.topicsCovered
        : (sessionContext.selectedChapters || []),
      taughtConceptsCovered: Array.isArray(ppt?.coverageSummary?.taughtConceptsCovered) && ppt.coverageSummary.taughtConceptsCovered.length > 0
        ? ppt.coverageSummary.taughtConceptsCovered
        : normalizedSlides.map((slide: any) => slide.slideTitle),
      omittedContent: Array.isArray(ppt?.coverageSummary?.omittedContent)
        ? ppt.coverageSummary.omittedContent
        : [],
    },
    slides: normalizedSlides,
  };
}

const PPT_NOTES_MASTER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notesMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1" /></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name="" /><p:cNvGrpSpPr /><p:nvPr /></p:nvGrpSpPr><p:grpSpPr><a:xfrm /></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Header Placeholder" /><p:cNvSpPr /><p:nvPr><p:ph type="hdr" sz="quarter" /></p:nvPr></p:nvSpPr><p:spPr><a:prstGeom prst="rect"><a:avLst /></a:prstGeom></p:spPr><p:txBody><a:bodyPr /><a:lstStyle /><a:p /></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Date Placeholder" /><p:cNvSpPr /><p:nvPr><p:ph type="dt" sz="quarter" idx="1" /></p:nvPr></p:nvSpPr><p:spPr><a:prstGeom prst="rect"><a:avLst /></a:prstGeom></p:spPr><p:txBody><a:bodyPr /><a:lstStyle /><a:p /></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="4" name="Slide Image Placeholder" /><p:cNvSpPr /><p:nvPr><p:ph type="sldImg" idx="2" /></p:nvPr></p:nvSpPr><p:spPr><a:prstGeom prst="rect"><a:avLst /></a:prstGeom></p:spPr><p:txBody><a:bodyPr /><a:lstStyle /><a:p /></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="5" name="Notes Placeholder" /><p:cNvSpPr /><p:nvPr><p:ph type="body" sz="quarter" idx="3" /></p:nvPr></p:nvSpPr><p:spPr><a:prstGeom prst="rect"><a:avLst /></a:prstGeom></p:spPr><p:txBody><a:bodyPr /><a:lstStyle /><a:p /></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="6" name="Footer Placeholder" /><p:cNvSpPr /><p:nvPr><p:ph type="ftr" sz="quarter" idx="4" /></p:nvPr></p:nvSpPr><p:spPr><a:prstGeom prst="rect"><a:avLst /></a:prstGeom></p:spPr><p:txBody><a:bodyPr /><a:lstStyle /><a:p /></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="7" name="Slide Number Placeholder" /><p:cNvSpPr /><p:nvPr><p:ph type="sldNum" sz="quarter" idx="5" /></p:nvPr></p:nvSpPr><p:spPr><a:prstGeom prst="rect"><a:avLst /></a:prstGeom></p:spPr><p:txBody><a:bodyPr /><a:lstStyle /><a:p /></p:txBody></p:sp></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink" /><p:notesStyle><a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200" /></a:lvl1pPr></p:notesStyle></p:notesMaster>`;
const PPT_NOTES_MASTER_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="/ppt/notesMasters/theme/theme3.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"/></Relationships>`;
const PPT_NOTES_THEME_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme name="LessonPlanGenerator Notes" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="LessonPlanGenerator Notes"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="173B6A"/></a:dk2><a:lt2><a:srgbClr val="E8E8E8"/></a:lt2><a:accent1><a:srgbClr val="1D4E89"/></a:accent1><a:accent2><a:srgbClr val="D97706"/></a:accent2><a:accent3><a:srgbClr val="36ADAA"/></a:accent3><a:accent4><a:srgbClr val="0F9ED5"/></a:accent4><a:accent5><a:srgbClr val="8B5CF6"/></a:accent5><a:accent6><a:srgbClr val="4EA72E"/></a:accent6><a:hlink><a:srgbClr val="467886"/></a:hlink><a:folHlink><a:srgbClr val="96607D"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light" /><a:ea typeface="Calibri Light" /><a:cs typeface="Calibri Light" /></a:majorFont><a:minorFont><a:latin typeface="Calibri" /><a:ea typeface="Calibri" /><a:cs typeface="Calibri" /></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr" /></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr" /></a:solidFill><a:prstDash val="solid" /></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst /></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr" /></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;

const PPTX_EMU = 914400;
const PPTX_SLIDE_CX = 18288000;
const PPTX_SLIDE_CY = 10287000;

function emu(inches: number) {
  return Math.round(inches * PPTX_EMU);
}

function toHexColor(value: string | undefined, fallback: string) {
  const normalized = String(value || fallback).trim();
  if (!normalized) return fallback.replace("#", "");
  return normalized.replace(/^#/, "") || fallback.replace("#", "");
}

function mimeTypeToExtension(mimeType: string, fallback = "png") {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  if (normalized.includes("svg")) return "svg";
  if (normalized.includes("gif")) return "gif";
  if (normalized.includes("webp")) return "webp";
  return fallback;
}

function decodeDataUrl(dataUrl: string) {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(?:;base64)?,(.*)$/i);
  if (!match) return null;
  const mimeType = match[1] || "application/octet-stream";
  const encoded = match[2] || "";
  const isBase64 = String(dataUrl || "").includes(";base64,");
  const buffer = isBase64
    ? Buffer.from(encoded, "base64")
    : Buffer.from(decodeURIComponent(encoded), "utf8");
  return { mimeType, buffer };
}

async function fetchBinaryAsset(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch asset: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: response.headers.get("content-type") || "image/jpeg",
  };
}

async function resolvePptVisualMedia(slide: any, slideIndex: number) {
  const preferredAsset = Array.isArray(slide?.assets)
    ? slide.assets.find((asset: any) => Boolean(asset?.imageDataUrl))
    : null;

  if (preferredAsset?.imageDataUrl) {
    const decoded = decodeDataUrl(preferredAsset.imageDataUrl);
    if (decoded) {
      return {
        fileName: `generated-slide-${slideIndex + 1}.${mimeTypeToExtension(decoded.mimeType)}`,
        buffer: decoded.buffer,
        mimeType: decoded.mimeType,
        altText: String(preferredAsset.altText || preferredAsset.purpose || slide?.slideTitle || "Slide visual"),
        sourceKind: preferredAsset.sourceKind || "generated-image",
      };
    }
  }

  const svgCode = String(slide?.svgDiagram?.svgCode || "").trim();
  if (svgCode.startsWith("<svg") || svgCode.startsWith("<?xml")) {
    return {
      fileName: `diagram-slide-${slideIndex + 1}.svg`,
      buffer: Buffer.from(svgCode, "utf8"),
      mimeType: "image/svg+xml",
      altText: String(slide?.svgDiagram?.title || slide?.slideTitle || "Slide diagram"),
      sourceKind: "svg-diagram",
    };
  }

  const remoteUrl = String(preferredAsset?.previewUrl || preferredAsset?.sourceUrl || "").trim();
  if (USE_REMOTE_PPT_ASSETS && remoteUrl) {
    const fetched = await fetchBinaryAsset(remoteUrl);
    return {
      fileName: `asset-slide-${slideIndex + 1}.${mimeTypeToExtension(fetched.mimeType)}`,
      buffer: fetched.buffer,
      mimeType: fetched.mimeType,
      altText: String(preferredAsset?.altText || preferredAsset?.purpose || slide?.slideTitle || "Slide visual"),
      sourceKind: preferredAsset?.sourceKind || "generated-image",
    };
  }

  return null;
}

function buildTextParagraphXml(
  text: string,
  options: { fontFace: string; fontSize: number; color: string; bold?: boolean; align?: "l" | "ctr" | "r" }
) {
  const safeText = xmlEscape(text);
  return `<a:p><a:pPr algn="${options.align || "l"}" marL="0" indent="0" lvl="0"/><a:r><a:rPr lang="en-US" sz="${Math.round(options.fontSize * 100)}"${options.bold ? ' b="1"' : ""}><a:solidFill><a:srgbClr val="${options.color}"/></a:solidFill><a:latin typeface="${xmlEscape(options.fontFace)}"/><a:ea typeface="${xmlEscape(options.fontFace)}"/><a:cs typeface="${xmlEscape(options.fontFace)}"/></a:rPr><a:t>${safeText}</a:t></a:r></a:p>`;
}

function buildTextBoxXml(
  id: number,
  x: number,
  y: number,
  cx: number,
  cy: number,
  paragraphs: string[],
  options: {
    fontFace: string;
    fontSize: number;
    color: string;
    bold?: boolean;
    align?: "l" | "ctr" | "r";
    fillColor?: string;
    lineColor?: string;
    roundRect?: boolean;
    inset?: number;
  }
) {
  const body = paragraphs.length > 0
    ? paragraphs.map((paragraph) =>
        buildTextParagraphXml(paragraph, {
          fontFace: options.fontFace,
          fontSize: options.fontSize,
          color: options.color,
          bold: options.bold,
          align: options.align,
        })
      ).join("")
    : "<a:p/>";
  const geometry = options.roundRect ? "roundRect" : "rect";
  const fill = options.fillColor
    ? `<a:solidFill><a:srgbClr val="${options.fillColor}"/></a:solidFill>`
    : "<a:noFill/>";
  const line = options.lineColor
    ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${options.lineColor}"/></a:solidFill><a:prstDash val="solid"/></a:ln>`
    : `<a:ln w="0"><a:noFill/><a:prstDash val="solid"/></a:ln>`;
  const inset = options.inset ?? 0;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="TextBox ${id}"/><p:cNvSpPr txBox="true"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="${geometry}"><a:avLst/></a:prstGeom>${fill}${line}</p:spPr><p:txBody><a:bodyPr anchor="t" rtlCol="false" tIns="${inset}" lIns="${inset}" bIns="${inset}" rIns="${inset}"><a:spAutoFit/></a:bodyPr><a:lstStyle/>${body}</p:txBody></p:sp>`;
}

function buildSolidShapeXml(id: number, x: number, y: number, cx: number, cy: number, fillColor: string) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${fillColor}"/></a:solidFill><a:ln w="0"><a:noFill/></a:ln></p:spPr></p:sp>`;
}

function buildImageShapeXml(id: number, relId: string, x: number, y: number, cx: number, cy: number, borderColor: string) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Visual ${id}" descr="Teacher presentation visual"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom><a:blipFill rotWithShape="true"><a:blip r:embed="${relId}"/><a:stretch><a:fillRect l="0" t="0" r="0" b="0"/></a:stretch></a:blipFill><a:ln w="12700"><a:solidFill><a:srgbClr val="${borderColor}"/></a:solidFill><a:prstDash val="solid"/></a:ln></p:spPr></p:sp>`;
}

function buildTemplateLayout(templateId: string, hasVisual: boolean) {
  if (templateId === "textbook-clean") {
    return {
      bandHeight: 0,
      titleX: emu(1.05),
      titleY: emu(0.82),
      titleW: emu(11.4),
      metaX: emu(1.05),
      metaY: emu(1.62),
      metaW: emu(11.4),
      bodyX: emu(1.05),
      bodyY: emu(2.22),
      bodyW: hasVisual ? emu(10.5) : emu(17.75),
      bodyH: emu(6.0),
      visualX: emu(12.05),
      visualY: emu(2.18),
      visualW: emu(6.75),
      visualH: emu(4.8),
      footerY: emu(9.15),
    };
  }

  if (templateId === "visual-focus") {
    return {
      bandHeight: emu(0.42),
      titleX: emu(0.95),
      titleY: emu(0.78),
      titleW: emu(8.1),
      metaX: emu(0.95),
      metaY: emu(1.58),
      metaW: emu(8.3),
      bodyX: emu(0.95),
      bodyY: emu(2.4),
      bodyW: emu(7.2),
      bodyH: emu(5.65),
      visualX: emu(8.65),
      visualY: emu(1.92),
      visualW: emu(10.15),
      visualH: emu(6.5),
      footerY: emu(9.15),
    };
  }

  return {
    bandHeight: emu(0.42),
    titleX: emu(0.95),
    titleY: emu(0.78),
    titleW: emu(9.8),
    metaX: emu(0.95),
    metaY: emu(1.58),
    metaW: emu(9.8),
    bodyX: emu(0.95),
    bodyY: emu(2.3),
    bodyW: hasVisual ? emu(10.0) : emu(17.8),
    bodyH: emu(5.9),
    visualX: emu(11.35),
    visualY: emu(2.18),
    visualW: emu(7.45),
    visualH: emu(5.25),
    footerY: emu(9.15),
  };
}

function buildPptSlideXml(ppt: any, slide: any, slideIndex: number, visualRelId?: string) {
  const templateId = String(ppt?.templateId || "academic-split");
  const theme = ppt?.themeTokens || {};
  const colors = theme.colors || {};
  const fonts = theme.fonts || {};
  const primary = toHexColor(colors.primary, "#1D4E89");
  const accent = toHexColor(colors.accent, "#D97706");
  const background = toHexColor(colors.background, "#F7FAFC");
  const surface = toHexColor(colors.surface, "#FFFFFF");
  const text = toHexColor(colors.text, "#1F2937");
  const muted = toHexColor(colors.mutedText, "#6B7280");
  const headingFont = String(fonts.heading || "Cambria");
  const bodyFont = String(fonts.body || "Aptos");
  const hasVisual = Boolean(visualRelId);
  const layout = buildTemplateLayout(templateId, hasVisual);
  const slideTitle = String(slide?.slideTitle || `Slide ${slideIndex + 1}`);
  const deckTitle = String(ppt?.presentationTitle || ppt?.title || "Session Presentation");
  const metaLine = [deckTitle, slide?.templateSlideTitle || slide?.slideType || "Teacher deck"].filter(Boolean).join("  •  ");
  const notesCount = Array.isArray(slide?.speakerNotes) ? slide.speakerNotes.length : 0;
  const onSlideText = Array.isArray(slide?.onSlideText) ? slide.onSlideText.slice(0, 3) : [];
  const bulletPoints = Array.isArray(slide?.bulletPoints) ? slide.bulletPoints.slice(0, templateId === "visual-focus" ? 4 : 5) : [];
  const bodyParagraphs = [
    ...onSlideText.map((item: string) => item),
    ...bulletPoints.map((item: string) => `• ${item}`),
  ];
  const footerBits = [
    slide?.studentTakeaway ? `Takeaway: ${slide.studentTakeaway}` : "",
    slide?.timeEstimateMinutes != null ? `Timing: ${slide.timeEstimateMinutes} min` : "",
    notesCount ? `Notes: ${notesCount} cues` : "",
  ].filter(Boolean);

  let shapeId = 2;
  const parts: string[] = [];
  parts.push(buildSolidShapeXml(1, 0, 0, PPTX_SLIDE_CX, PPTX_SLIDE_CY, background));
  if (layout.bandHeight > 0) {
    parts.push(buildSolidShapeXml(shapeId++, 0, 0, PPTX_SLIDE_CX, layout.bandHeight, primary));
  }
  parts.push(
    buildTextBoxXml(shapeId++, layout.titleX, layout.titleY, layout.titleW, emu(0.72), [slideTitle], {
      fontFace: headingFont,
      fontSize: templateId === "textbook-clean" ? 28 : 30,
      color: text,
      bold: true,
    })
  );
  parts.push(
    buildTextBoxXml(shapeId++, layout.metaX, layout.metaY, layout.metaW, emu(0.42), [metaLine], {
      fontFace: bodyFont,
      fontSize: 12,
      color: muted,
    })
  );
  parts.push(
    buildTextBoxXml(shapeId++, layout.bodyX, layout.bodyY, layout.bodyW, layout.bodyH, bodyParagraphs.length ? bodyParagraphs : [slide?.visualPlan || "Teacher-guided explanation slide."], {
      fontFace: bodyFont,
      fontSize: templateId === "visual-focus" ? 18 : 20,
      color: text,
      fillColor: surface,
      lineColor: primary,
      roundRect: true,
      inset: 160000,
    })
  );
  if (visualRelId) {
    parts.push(buildImageShapeXml(shapeId++, visualRelId, layout.visualX, layout.visualY, layout.visualW, layout.visualH, accent));
  } else {
    parts.push(
      buildTextBoxXml(shapeId++, layout.visualX, layout.visualY, layout.visualW, layout.visualH, [
        slide?.svgDiagram?.title || "Planned visual",
        slide?.visualPlan || "Teacher-selected visual support will appear here in export.",
      ], {
        fontFace: bodyFont,
        fontSize: 18,
        color: muted,
        fillColor: surface,
        lineColor: accent,
        roundRect: true,
        inset: 160000,
      })
    );
  }
  if (footerBits.length > 0) {
    parts.push(
      buildTextBoxXml(shapeId++, emu(0.95), layout.footerY, emu(17.8), emu(0.48), [footerBits.join("   •   ")], {
        fontFace: bodyFont,
        fontSize: 11,
        color: muted,
      })
    );
  }
  parts.push(
    buildTextBoxXml(shapeId++, PPTX_SLIDE_CX - emu(1.65), emu(0.55), emu(0.7), emu(0.34), [String(slide.slideNumber || slideIndex + 1)], {
      fontFace: bodyFont,
      fontSize: 11,
      color: primary,
      bold: true,
      align: "r",
    })
  );

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${parts.join("")}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function buildPptSlideRelsXml(slideIndex: number, mediaFileName?: string) {
  const relationships = [
    `<Relationship Id="rId1" Target="../slideLayouts/slideLayout7.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"/>`,
    `<Relationship Id="rId2" Target="../notesSlides/notesSlide${slideIndex + 1}.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide"/>`,
  ];
  if (mediaFileName) {
    relationships.push(`<Relationship Id="rId3" Target="../media/${xmlEscape(mediaFileName)}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/>`);
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join("")}</Relationships>`;
}

function buildNotesSlideXml(slide: any) {
  const speakerNotes = Array.isArray(slide?.speakerNotes) && slide.speakerNotes.length > 0
    ? slide.speakerNotes.map((item: any) => String(item || "").trim()).filter(Boolean)
    : ["No speaker notes were generated for this slide."];
  const noteParagraphs = speakerNotes.map((item: string) =>
    `<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US" sz="1200"><a:latin typeface="Calibri"/><a:ea typeface="Calibri"/><a:cs typeface="Calibri"/></a:rPr><a:t>${xmlEscape(item)}</a:t></a:r></a:p>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm/></p:grpSpPr>
      <p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr/><p:nvPr><p:ph type="sldImg" idx="0"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>
      <p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr/><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${noteParagraphs}</p:txBody></p:sp>
      <p:sp><p:nvSpPr><p:cNvPr id="4" name="Slide Number Placeholder 3"/><p:cNvSpPr/><p:nvPr><p:ph type="sldNum" idx="5"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:notes>`;
}

function buildNotesSlideRelsXml(slideIndex: number) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="/ppt/slides/slide${slideIndex + 1}.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"/><Relationship Id="rId2" Target="/ppt/notesMasters/notesMaster1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster"/></Relationships>`;
}

function injectNotesMasterIntoPresentationXml(xml: string) {
  if (xml.includes("<p:notesMasterIdLst>")) {
    return xml;
  }
  return xml.replace(
    "</p:sldMasterIdLst>",
    `</p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId21"/></p:notesMasterIdLst>`
  );
}

function injectNotesMasterIntoPresentationRels(xml: string) {
  if (xml.includes("notesMaster1.xml")) {
    return xml;
  }
  return xml.replace(
    "</Relationships>",
    `<Relationship Id="rId21" Target="notesMasters/notesMaster1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster"/></Relationships>`
  );
}

function injectNotesContentTypes(xml: string, slideCount: number) {
  let nextXml = xml;
  if (!nextXml.includes('/ppt/notesMasters/notesMaster1.xml')) {
    nextXml = nextXml.replace(
      "</Types>",
      `<Override ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml" PartName="/ppt/notesMasters/notesMaster1.xml"/><Override ContentType="application/vnd.openxmlformats-officedocument.theme+xml" PartName="/ppt/notesMasters/theme/theme3.xml"/></Types>`
    );
  }
  if (!nextXml.includes('Extension="svg"')) {
    nextXml = nextXml.replace(
      '<Default ContentType="application/vnd.openxmlformats-package.relationships+xml" Extension="rels"/>',
      '<Default ContentType="application/vnd.openxmlformats-package.relationships+xml" Extension="rels"/><Default ContentType="image/svg+xml" Extension="svg"/>'
    );
  }
  for (let index = 1; index <= slideCount; index += 1) {
    const marker = `/ppt/notesSlides/notesSlide${index}.xml`;
    if (!nextXml.includes(marker)) {
      nextXml = nextXml.replace(
        "</Types>",
        `<Override ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml" PartName="${marker}"/></Types>`
      );
    }
  }
  return nextXml;
}

async function buildEditablePptxBufferFromMaterial(ppt: any, sessionMeta: {
  sessionTitle?: string;
  sessionNumber?: number;
}) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "lessonplan-pptx-"));
  const workDir = path.join(tempRoot, "deck");
  const outputPath = path.join(tempRoot, "deck.pptx");
  try {
    await fs.mkdir(workDir, { recursive: true });
    await execFileAsync("unzip", ["-qq", TEMPLATE_PPTX_PATH, "-d", workDir]);

    const slides = Array.isArray(ppt?.slides) ? ppt.slides.slice(0, KAMALANIKETAN_TEMPLATE_SLIDES.length) : [];
    const mediaDir = path.join(workDir, "ppt/media");
    const slideDir = path.join(workDir, "ppt/slides");
    const slideRelsDir = path.join(workDir, "ppt/slides/_rels");
    const notesDir = path.join(workDir, "ppt/notesSlides");
    const notesRelsDir = path.join(workDir, "ppt/notesSlides/_rels");
    const notesMasterDir = path.join(workDir, "ppt/notesMasters");
    const notesMasterRelsDir = path.join(workDir, "ppt/notesMasters/_rels");
    const notesThemeDir = path.join(workDir, "ppt/notesMasters/theme");
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.mkdir(notesDir, { recursive: true });
    await fs.mkdir(notesRelsDir, { recursive: true });
    await fs.mkdir(notesMasterDir, { recursive: true });
    await fs.mkdir(notesMasterRelsDir, { recursive: true });
    await fs.mkdir(notesThemeDir, { recursive: true });

    for (let index = 0; index < KAMALANIKETAN_TEMPLATE_SLIDES.length; index += 1) {
      const slide = slides[index] || {
        ...KAMALANIKETAN_TEMPLATE_SLIDES[index],
        slideNumber: index + 1,
        slideTitle: KAMALANIKETAN_TEMPLATE_SLIDES[index].label,
        bulletPoints: ["No session-specific content was generated for this slot."],
        speakerNotes: ["Explain only the taught content linked to this slide slot."],
      };
      let visual = null;
      try {
        visual = await resolvePptVisualMedia(slide, index);
      } catch (error) {
        console.warn(`[PPTX Export] Visual resolution failed for slide ${index + 1}:`, error);
      }
      if (visual) {
        await fs.writeFile(path.join(mediaDir, visual.fileName), visual.buffer);
      }
      const slideXml = buildPptSlideXml(ppt, slide, index, visual ? "rId3" : undefined);
      await fs.writeFile(path.join(slideDir, `slide${index + 1}.xml`), slideXml, "utf8");
      await fs.writeFile(path.join(slideRelsDir, `slide${index + 1}.xml.rels`), buildPptSlideRelsXml(index, visual?.fileName), "utf8");
      await fs.writeFile(path.join(notesDir, `notesSlide${index + 1}.xml`), buildNotesSlideXml(slide), "utf8");
      await fs.writeFile(path.join(notesRelsDir, `notesSlide${index + 1}.xml.rels`), buildNotesSlideRelsXml(index), "utf8");
    }

    await fs.writeFile(path.join(notesMasterDir, "notesMaster1.xml"), PPT_NOTES_MASTER_XML, "utf8");
    await fs.writeFile(path.join(notesMasterRelsDir, "notesMaster1.xml.rels"), PPT_NOTES_MASTER_RELS_XML, "utf8");
    await fs.writeFile(path.join(notesThemeDir, "theme3.xml"), PPT_NOTES_THEME_XML, "utf8");

    const presentationXmlPath = path.join(workDir, "ppt/presentation.xml");
    const presentationRelsPath = path.join(workDir, "ppt/_rels/presentation.xml.rels");
    const contentTypesPath = path.join(workDir, "[Content_Types].xml");
    const corePropsPath = path.join(workDir, "docProps/core.xml");

    const presentationXml = injectNotesMasterIntoPresentationXml(await fs.readFile(presentationXmlPath, "utf8"));
    await fs.writeFile(presentationXmlPath, presentationXml, "utf8");

    const presentationRelsXml = injectNotesMasterIntoPresentationRels(await fs.readFile(presentationRelsPath, "utf8"));
    await fs.writeFile(presentationRelsPath, presentationRelsXml, "utf8");

    const contentTypesXml = injectNotesContentTypes(await fs.readFile(contentTypesPath, "utf8"), KAMALANIKETAN_TEMPLATE_SLIDES.length);
    await fs.writeFile(contentTypesPath, contentTypesXml, "utf8");

    const nowIso = new Date().toISOString();
    const title = xmlEscape(String(ppt?.presentationTitle || ppt?.title || sessionMeta.sessionTitle || "Session Presentation"));
    const corePropsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${title}</dc:title><dc:creator>Lesson Plan Generator</dc:creator><cp:lastModifiedBy>Lesson Plan Generator</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified></cp:coreProperties>`;
    await fs.writeFile(corePropsPath, corePropsXml, "utf8");

    await execFileAsync("zip", ["-qr", outputPath, "."], { cwd: workDir });
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

function extractLearningOutcomeStrings(input: any): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return uniqueStrings(
    input.flatMap((item: any) => {
      if (typeof item === "string") {
        return [item];
      }
      if (!item || typeof item !== "object") {
        return [];
      }
      return [
        item.id,
        item.code,
        item.title,
        item.description,
        item.learningOutcome,
        item.text,
      ].filter((value) => typeof value === "string" && value.trim().length > 0);
    })
  );
}

async function normalizeGeneratedSessionPlanPpt(
  sessionPlan: any,
  defaults: {
    subject?: string;
    gradeLevel?: string;
  }
) {
  if (!sessionPlan || typeof sessionPlan !== "object" || !sessionPlan.materials?.ppt) {
    return sessionPlan;
  }

  return {
    ...sessionPlan,
    materials: {
      ...(sessionPlan.materials || {}),
      ppt: await normalizePptMaterial(sessionPlan.materials.ppt, {
        subject: defaults.subject,
        gradeLevel: defaults.gradeLevel,
        sessionTitle: String(sessionPlan.title || sessionPlan.sessionTitle || "Session Presentation"),
        learningOutcomes: extractLearningOutcomeStrings(sessionPlan.learningOutcomes),
        selectedChapters: uniqueStrings([
          sessionPlan.title,
          sessionPlan.topic,
          ...(Array.isArray(sessionPlan.topicCoverage) ? sessionPlan.topicCoverage : []),
        ].filter((value) => typeof value === "string" && value.trim().length > 0)),
      }),
    },
  };
}

async function hydrateWorkspacePptMaterials(workspace: any) {
  if (!workspace || typeof workspace !== "object") {
    return workspace;
  }

  const generatedSessions =
    workspace.generationScope &&
    typeof workspace.generationScope === "object" &&
    workspace.generationScope.generatedSessions &&
    typeof workspace.generationScope.generatedSessions === "object"
      ? workspace.generationScope.generatedSessions
      : null;

  if (!generatedSessions) {
    return workspace;
  }

  const baseWorkspace =
    typeof workspace.toObject === "function"
      ? workspace.toObject()
      : { ...workspace };

  const subject = String(baseWorkspace.curriculumSnapshot?.subject || baseWorkspace.academicConfig?.subject || "");
  const gradeLevel = String(baseWorkspace.curriculumSnapshot?.gradeLevel || baseWorkspace.academicConfig?.className || "");

  const hydratedGeneratedSessions = Object.fromEntries(
    await Promise.all(
      Object.entries(generatedSessions).map(async ([sessionKey, sessionPlan]) => [
        sessionKey,
        await normalizeGeneratedSessionPlanPpt(sessionPlan, { subject, gradeLevel }),
      ])
    )
  );

  return {
    ...baseWorkspace,
    generationScope: {
      ...(baseWorkspace.generationScope || {}),
      generatedSessions: hydratedGeneratedSessions,
    },
  };
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Ollama returned an empty response.");
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstObject = trimmed.indexOf("{");
  const lastObject = trimmed.lastIndexOf("}");
  if (firstObject !== -1 && lastObject !== -1 && lastObject > firstObject) {
    return trimmed.slice(firstObject, lastObject + 1);
  }

  const firstArray = trimmed.indexOf("[");
  const lastArray = trimmed.lastIndexOf("]");
  if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
    return trimmed.slice(firstArray, lastArray + 1);
  }

  throw new Error(`Unable to locate JSON in Ollama response: ${trimmed.slice(0, 300)}`);
}

function escapeEmbeddedJsonStringValueByKey(raw: string, key: string) {
  const pattern = new RegExp(`(^\\s*"${key}"\\s*:\\s*")(.*)(")(\\s*,?$)`, "gm");
  return raw.replace(pattern, (_match, prefix: string, content: string, closingQuote: string, trailing: string) => {
    let escapedContent = "";
    let isEscaped = false;

    for (const char of content) {
      if (char === "\"" && !isEscaped) {
        escapedContent += "\\\"";
        continue;
      }

      escapedContent += char;
      isEscaped = char === "\\" && !isEscaped;
      if (char !== "\\") {
        isEscaped = false;
      }
    }

    return `${prefix}${escapedContent}${closingQuote}${trailing}`;
  });
}

function sanitizeJsonText(raw: string): { text: string; changed: boolean; fixes: string[] } {
  let changed = false;
  const fixes: string[] = [];
  let source = raw;
  const svgEscaped = escapeEmbeddedJsonStringValueByKey(source, "svgCode");
  if (svgEscaped !== source) {
    source = svgEscaped;
    changed = true;
    fixes.push("escaped_embedded_quotes:svgCode");
  }

  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      output += char;
      continue;
    }

    if (
      char === "0" &&
      /[0-9]/.test(source[index + 1] || "") &&
      !/[A-Za-z0-9_."\]]/.test(source[index - 1] || "")
    ) {
      let end = index + 1;
      while (/[0-9]/.test(source[end] || "")) end += 1;
      const token = source.slice(index, end);
      const trailing = source[end] || "";
      if (/^\d+$/.test(token) && /[\s,\]}]/.test(trailing || " ")) {
        const normalized = String(Number(token));
        if (normalized !== token) {
          output += normalized;
          changed = true;
          fixes.push(`leading_zero_number:${token}->${normalized}`);
          index = end - 1;
          continue;
        }
      }
    }

    output += char;
  }

  return { text: output, changed, fixes: uniqueStrings(fixes) };
}

function tryRepairTruncatedPptJson(raw: string): string | null {
  const matches = Array.from(raw.matchAll(/(\n\s*}),\n\s*{/g));
  if (matches.length === 0) {
    return null;
  }

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    const cutIndex = (match.index ?? 0) + match[1].length;
    const candidate = `${raw.slice(0, cutIndex)}\n      ]\n    }\n  }\n}`;
    try {
      const sanitized = sanitizeJsonText(candidate);
      const parsed = JSON.parse(sanitized.text);
      if (parsed?.materials?.ppt && Array.isArray(parsed.materials.ppt.slides) && parsed.materials.ppt.slides.length > 0) {
        return sanitized.text;
      }
    } catch {
      // Keep walking backward to find the last safely recoverable slide boundary.
    }
  }

  return null;
}

function validateTermAllocations(allocations: any[] = []) {
  const issues: string[] = [];

  allocations.forEach((allocation, index) => {
    const label = String(allocation?.termName || "").trim() || `Allocation ${index + 1}`;
    const termNumber = allocation?.termNumber ?? null;
    const chapters = Array.isArray(allocation?.chapters)
      ? allocation.chapters.map((chapter: any) => String(chapter || "").trim()).filter(Boolean)
      : [];
    const marks = Number(allocation?.marks || 0);

    if (!label || label === `Allocation ${index + 1}`) {
      issues.push(`Allocation ${index + 1} is missing a term name.`);
    }
    if (termNumber == null) {
      issues.push(`${label} is missing a term number.`);
    }
    if (chapters.length === 0) {
      issues.push(`${label} must include at least one chapter.`);
    }
    if (!Number.isFinite(marks) || marks < 0) {
      issues.push(`${label} has invalid marks.`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

function normalizeSourceText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[(){}\[\]]/g, " ")
    .replace(/[_–—-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s&/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildEntityCandidates(entity: string): string[] {
  const raw = entity.trim();
  if (!raw) return [];

  const candidates = new Set<string>();
  candidates.add(normalizeSourceText(raw));

  const parentheticalMatches = [...raw.matchAll(/\(([^)]+)\)/g)]
    .map((match) => normalizeSourceText(match[1] || ""))
    .filter(Boolean);
  for (const match of parentheticalMatches) {
    candidates.add(match);
  }

  const withoutParentheses = normalizeSourceText(raw.replace(/\s*\([^)]*\)\s*/g, " "));
  if (withoutParentheses) {
    candidates.add(withoutParentheses);
  }

  const slashVariants = raw
    .split("/")
    .map((part) => normalizeSourceText(part))
    .filter(Boolean);
  for (const variant of slashVariants) {
    candidates.add(variant);
  }

  return [...candidates].filter(Boolean);
}

function findSourceMatchSnippet(sourceText: string, candidate: string): string | null {
  const candidateTokens = candidate.split(" ").filter(Boolean);
  if (!candidateTokens.length) return null;

  const sourceLines = sourceText.split(/\r?\n/);
  for (const line of sourceLines) {
    const normalizedLine = normalizeSourceText(line);
    if (normalizedLine.includes(candidate)) {
      return line.trim();
    }

    const allTokensPresent = candidateTokens.every((token) => normalizedLine.includes(token));
    if (allTokensPresent) {
      return line.trim();
    }
  }

  return null;
}

function validateEntityAgainstSource(sourceText: string, entity: string) {
  const normalizedEntity = normalizeSourceText(entity);
  const candidates = buildEntityCandidates(entity);

  for (const candidate of candidates) {
    const snippet = findSourceMatchSnippet(sourceText, candidate);
    if (snippet) {
      return {
        matched: true,
        normalizedEntity,
        matchedCandidate: candidate,
        snippet,
      };
    }
  }

  return {
    matched: false,
    normalizedEntity,
    matchedCandidate: "",
    snippet: null,
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function filterFaithfulTopicList(
  sourceText: string,
  values: string[] = [],
  referenceValues: string[] = []
) {
  const normalizedReferenceValues = new Set(
    referenceValues.map((value) => normalizeSourceText(value || "")).filter(Boolean)
  );

  return uniqueStrings(values).filter((value) => {
    const normalizedValue = normalizeSourceText(value || "");
    if (!normalizedValue) return false;
    if (normalizedReferenceValues.has(normalizedValue)) return true;
    return validateEntityAgainstSource(sourceText, value).matched;
  });
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function normalizeSchemaVersion(value: unknown): SchemaVersion {
  return String(value || "").trim().toLowerCase() === "v2" ? "v2" : "v1";
}

function detectCurriculumProfile(sourceText: string, fileName: string = "") {
  const text = normalizeSourceText(sourceText || "");
  const file = normalizeSourceText(fileName || "");
  const hasCbse = /\bcbse\b/.test(text) || /\bncert\b/.test(text) || /\bcbse\b/.test(file);
  const hasMultipleClasses = /\bclass xi\b/.test(text) && /\bclass xii\b/.test(text);
  const hasSemester = /\bsemester\b|\btrimester\b|\bquarter\b|\bterm\s*(?:[-–—:]|\d+|[ivxlcdm]+)\b|\btermwise\b|\bterm-wise\b/.test(text);
  const hasCompetencies = /\bcompetenc(?:y|ies)\b|\blearning outcomes?\b|\boutcomes?\b/.test(text);
  const hasLanguageSignals = /\breading\b|\bwriting\b|\bgrammar\b|\bpoetry\b|\bliterature\b|\bspeaking\b|\blistening\b/.test(text);
  const hasUnits = /\bunit\b/.test(text);
  const hasChapters = /\bchapter\b/.test(text);
  const hasMarksTable = /\bmarks\b|\btotal marks\b/.test(text);
  const hasPracticals = /\bpractical\b|\bproject\b|\blaboratory\b|\blab\b/.test(text);

  let profile: CurriculumProfile = "mixed_or_unknown";
  let confidence = 0.55;
  const reasons: string[] = [];

  if (hasSemester) {
    profile = "term_semester_curriculum";
    confidence = 0.87;
    reasons.push("semester_or_term_markers");
  } else if (hasCompetencies && !hasUnits) {
    profile = "competency_outcomes_curriculum";
    confidence = 0.84;
    reasons.push("competency_outcome_markers");
  } else if (hasLanguageSignals && !hasCbse) {
    profile = "language_curriculum";
    confidence = 0.8;
    reasons.push("language_section_markers");
  } else if (hasMultipleClasses && hasCbse) {
    profile = "multi_class_board_syllabus";
    confidence = 0.91;
    reasons.push("multi_class_board_markers");
  } else if (hasCbse && hasUnits && hasChapters) {
    profile = "cbse_unit_chapter_topic";
    confidence = 0.88;
    reasons.push("cbse_units_and_chapters");
  } else if (hasCbse && hasUnits) {
    profile = "cbse_unit_topic";
    confidence = 0.86;
    reasons.push("cbse_units");
  } else if (hasLanguageSignals) {
    profile = "language_curriculum";
    confidence = 0.72;
    reasons.push("language_markers");
  } else if (hasCompetencies) {
    profile = "competency_outcomes_curriculum";
    confidence = 0.72;
    reasons.push("competency_markers");
  } else if (hasUnits && hasMarksTable && hasPracticals) {
    profile = "cbse_unit_topic";
    confidence = 0.68;
    reasons.push("unit_marks_practical_markers");
  } else {
    reasons.push("generic_fallback");
  }

  return { profile, confidence, reasons };
}

function canonicalCbseUnitCleanupKey(name: string) {
  return canonicalChapterKey(
    String(name || "")
      .replace(/\(\s*implicit unit from context\s*\)/gi, "")
      .replace(/\bclass\s+[ivxlcdm0-9]+\b/gi, "")
      .trim()
  );
}

function getCbseChapterCandidateKeysFromUnitName(name: string) {
  const rawName = String(name || "").replace(/\(\s*implicit unit from context\s*\)/gi, "").trim();
  const suffixAfterColon = rawName.includes(":") ? rawName.split(":").slice(1).join(":").trim() : "";
  return uniqueStrings([
    canonicalChapterKey(rawName),
    canonicalChapterKey(suffixAfterColon),
  ]).filter(Boolean);
}

function getCbseUnitNameParts(name: string) {
  const rawName = String(name || "").replace(/\(\s*implicit unit from context\s*\)/gi, "").trim();
  const hasColon = rawName.includes(":");
  const prefix = hasColon ? rawName.split(":")[0].trim() : "";
  const suffix = hasColon ? rawName.split(":").slice(1).join(":").trim() : "";
  return { rawName, prefix, suffix };
}

function getCbsePlannedChapterNames(unit: any) {
  return uniqueStrings([
    ...((unit?.chapters || []).map((chapter: any) => chapter?.chapter_name || chapter?.source_chapter_name || "")),
    ...(unit?.explicit_chapters || []),
    ...(unit?.possible_chapters || []),
    ...((unit?.chapter_candidates || []).map((candidate: any) => candidate?.title || candidate?.source_chapter_name || "")),
  ]).filter(Boolean);
}

function getCbseLooseContentKey(name: string) {
  const { rawName } = getCbseUnitNameParts(name);
  return canonicalChapterKey(
    rawName.replace(/^(introduction to|basics of|fundamentals of|overview of|concept of)\s+/i, "").trim()
  );
}

function mergeCbseChapterLikeData(targetChapter: any, sourceChapter: any) {
  targetChapter.topics = uniqueStrings([...(targetChapter?.topics || []), ...(sourceChapter?.topics || [])]);
  targetChapter.subtopics = uniqueStrings([...(targetChapter?.subtopics || []), ...(sourceChapter?.subtopics || [])]);
  targetChapter.key_concepts = uniqueStrings([...(targetChapter?.key_concepts || []), ...(sourceChapter?.key_concepts || [])]);
}

function ensureCbseChapterOnUnit(unit: any, chapterName: string) {
  const targetName = String(chapterName || "").trim();
  const targetKey = canonicalChapterKey(targetName);
  const chapters = Array.isArray(unit?.chapters) ? unit.chapters : [];
  const existing = chapters.find((chapter: any) => {
    const chapterKey = canonicalChapterKey(chapter?.chapter_name || chapter?.source_chapter_name || "");
    return chapterKey && chapterKey === targetKey;
  });
  if (existing) return existing;

  const nextChapter = {
    chapter_id: `C${chapters.length + 1}`,
    chapter_name: targetName,
    source_chapter_name: targetName,
    topics: [],
    subtopics: [],
    key_concepts: [],
  };
  chapters.push(nextChapter);
  unit.chapters = chapters;
  return nextChapter;
}

function mergeCbseUnitLikeData(targetUnit: any, sourceUnit: any) {
  targetUnit.explicit_chapters = uniqueStrings([...(targetUnit?.explicit_chapters || []), ...(sourceUnit?.explicit_chapters || [])]);
  targetUnit.headings = uniqueStrings([...(targetUnit?.headings || []), ...(sourceUnit?.headings || [])]);
  targetUnit.possible_chapters = uniqueStrings([...(targetUnit?.possible_chapters || []), ...(sourceUnit?.possible_chapters || [])]);
  targetUnit.topics = uniqueStrings([...(targetUnit?.topics || []), ...(sourceUnit?.topics || [])]);
  targetUnit.subtopics = uniqueStrings([...(targetUnit?.subtopics || []), ...(sourceUnit?.subtopics || [])]);
  targetUnit.key_concepts = uniqueStrings([...(targetUnit?.key_concepts || []), ...(sourceUnit?.key_concepts || [])]);
  targetUnit.chapter_candidates = [...(targetUnit?.chapter_candidates || []), ...(sourceUnit?.chapter_candidates || [])];
  targetUnit.source_nodes = [...(targetUnit?.source_nodes || []), ...(sourceUnit?.source_nodes || [])];

  const targetChapters = Array.isArray(targetUnit?.chapters) ? targetUnit.chapters : [];
  const sourceChapters = Array.isArray(sourceUnit?.chapters) ? sourceUnit.chapters : [];
  const chapterByKey = new Map<string, any>();
  targetChapters.forEach((chapter: any) => {
    const key = canonicalChapterKey(chapter?.chapter_name || chapter?.source_chapter_name || "");
    if (key) chapterByKey.set(key, chapter);
  });

  sourceChapters.forEach((sourceChapter: any, index: number) => {
    const key = canonicalChapterKey(sourceChapter?.chapter_name || sourceChapter?.source_chapter_name || "");
    const existingChapter = key ? chapterByKey.get(key) : null;
    if (existingChapter) {
      mergeCbseChapterLikeData(existingChapter, sourceChapter);
      return;
    }
    const nextChapter = structuredClone(sourceChapter);
    nextChapter.chapter_id = nextChapter.chapter_id || `C${targetChapters.length + index + 1}`;
    targetChapters.push(nextChapter);
    if (key) chapterByKey.set(key, nextChapter);
  });

  targetUnit.chapters = targetChapters;
}

function cleanupCbseStructure(structure: any) {
  const nextStructure = structuredClone(structure);
  nextStructure.classes = (nextStructure?.classes || []).map((cls: any) => {
    const clonedUnits = Array.isArray(cls?.units) ? cls.units.map((unit: any) => structuredClone(unit)) : [];
    const dedupedUnits: any[] = [];
    const unitByKey = new Map<string, any>();

    for (const unit of clonedUnits) {
      const key = canonicalCbseUnitCleanupKey(unit?.unit_name || unit?.unit_id || "");
      if (key && unitByKey.has(key)) {
        mergeCbseUnitLikeData(unitByKey.get(key), unit);
        continue;
      }
      dedupedUnits.push(unit);
      if (key) unitByKey.set(key, unit);
    }

    const chapterIndex = new Map<string, { unit: any; chapter: any }>();
    const plannedChapterUnitIndex = new Map<string, any>();
    dedupedUnits.forEach((unit) => {
      (unit?.chapters || []).forEach((chapter: any) => {
        const chapterKey = canonicalChapterKey(chapter?.chapter_name || chapter?.source_chapter_name || "");
        if (chapterKey) {
          chapterIndex.set(chapterKey, { unit, chapter });
        }
      });
      getCbsePlannedChapterNames(unit).forEach((chapterName) => {
        const chapterKey = canonicalChapterKey(chapterName);
        if (chapterKey && !plannedChapterUnitIndex.has(chapterKey)) {
          plannedChapterUnitIndex.set(chapterKey, unit);
        }
      });
    });

    const cleanedUnits: any[] = [];
    dedupedUnits.forEach((unit) => {
      const unitChapters = Array.isArray(unit?.chapters) ? unit.chapters : [];
      const hasOwnChapters = unitChapters.length > 0;
      const chapterCandidates = getCbseChapterCandidateKeysFromUnitName(unit?.unit_name || "");
      const matchingChapterTarget = chapterCandidates
        .map((candidateKey) => chapterIndex.get(candidateKey))
        .find((entry) => entry && entry.unit !== unit);

      if (matchingChapterTarget) {
        mergeCbseChapterLikeData(matchingChapterTarget.chapter, unit);
        (unit?.chapters || []).forEach((sourceChapter: any) => {
          const sourceChapterKey = canonicalChapterKey(sourceChapter?.chapter_name || sourceChapter?.source_chapter_name || "");
          if (sourceChapterKey && sourceChapterKey === canonicalChapterKey(matchingChapterTarget.chapter?.chapter_name || matchingChapterTarget.chapter?.source_chapter_name || "")) {
            mergeCbseChapterLikeData(matchingChapterTarget.chapter, sourceChapter);
          }
        });
        return;
      }

      if (!hasOwnChapters) {
        const plannedChapterUnit = chapterCandidates
          .map((candidateKey) => plannedChapterUnitIndex.get(candidateKey))
          .find((candidateUnit) => candidateUnit && candidateUnit !== unit);

        if (plannedChapterUnit) {
          const { rawName, suffix } = getCbseUnitNameParts(unit?.unit_name || "");
          const chapterTitle = suffix || rawName;
          const targetChapter = ensureCbseChapterOnUnit(plannedChapterUnit, chapterTitle);
          mergeCbseChapterLikeData(targetChapter, unit);
          return;
        }

        const { prefix, suffix } = getCbseUnitNameParts(unit?.unit_name || "");
        const parentUnit = prefix ? unitByKey.get(canonicalCbseUnitCleanupKey(prefix)) : null;
        if (parentUnit && parentUnit !== unit && suffix) {
          const targetChapter = ensureCbseChapterOnUnit(parentUnit, suffix);
          mergeCbseChapterLikeData(targetChapter, unit);
          return;
        }

        const looseContentKey = getCbseLooseContentKey(unit?.unit_name || "");
        if (looseContentKey && looseContentKey.length >= 5) {
          const overlappingParentUnit = dedupedUnits.find((candidateUnit) => {
            if (!candidateUnit || candidateUnit === unit) return false;
            const candidateUnitKey = canonicalCbseUnitCleanupKey(candidateUnit?.unit_name || candidateUnit?.unit_id || "");
            return candidateUnitKey.includes(looseContentKey) || looseContentKey.includes(candidateUnitKey);
          });
          if (overlappingParentUnit) {
            const { rawName } = getCbseUnitNameParts(unit?.unit_name || "");
            const targetChapter = ensureCbseChapterOnUnit(overlappingParentUnit, rawName);
            mergeCbseChapterLikeData(targetChapter, unit);
            return;
          }
        }
      }

      cleanedUnits.push(unit);
    });

    return {
      ...cls,
      units: cleanedUnits,
    };
  });

  return nextStructure;
}

function getCurriculumProfileConfig(profile: CurriculumProfile) {
  const base = {
    stage1SchemaExtension: {},
    extraRules: [] as string[],
    allowUnitFallbackChapters: true,
    expectedStructureType: "mixed",
  };

  switch (profile) {
    case "cbse_unit_topic":
      return {
        ...base,
        extraRules: [
          "- Prefer unit -> topic when the source lists topics directly under a unit",
          "- Do not invent chapters from unit names in CBSE-style syllabi",
        ],
        allowUnitFallbackChapters: false,
        expectedStructureType: "unit_topic",
      };
    case "cbse_unit_chapter_topic":
      return {
        ...base,
        extraRules: [
          "- Preserve explicit chapter headings only when they are clearly present",
          "- Keep unit -> chapter -> topic hierarchy for chapter-organized board syllabi",
        ],
        allowUnitFallbackChapters: true,
        expectedStructureType: "unit_chapter_topic",
      };
    case "multi_class_board_syllabus":
      return {
        ...base,
        extraRules: [
          "- Preserve separate classes/grades when multiple classes appear in one document",
          "- Never merge Class XI and Class XII structures together",
        ],
        allowUnitFallbackChapters: false,
        expectedStructureType: "multi_class_unit_topic",
      };
    case "term_semester_curriculum":
      return {
        ...base,
        stage1SchemaExtension: { terms: [{ name: "", units: [""] }] },
        extraRules: [
          "- Preserve term/semester structure when present",
          "- Do not flatten semesters into plain unit lists",
        ],
        allowUnitFallbackChapters: true,
        expectedStructureType: "term_unit_topic",
      };
    case "competency_outcomes_curriculum":
      return {
        ...base,
        stage1SchemaExtension: { competencies: [{ title: "", outcomes: [""] }] },
        extraRules: [
          "- Preserve competencies and learning outcomes as first-class entities",
          "- Do not flatten outcomes into generic topics if they are the main structure",
        ],
        allowUnitFallbackChapters: true,
        expectedStructureType: "competency_outcome",
      };
    case "language_curriculum":
      return {
        ...base,
        extraRules: [
          "- Preserve language sections like reading, writing, grammar, literature",
          "- Do not force fake unit/chapter hierarchy over section-based language syllabi",
        ],
        allowUnitFallbackChapters: true,
        expectedStructureType: "section_topic",
      };
    default:
      return {
        ...base,
        extraRules: [
          "- Use the most source-faithful hierarchy available",
          "- Preserve ambiguous structure conservatively and avoid invented chapters",
        ],
        allowUnitFallbackChapters: true,
        expectedStructureType: "mixed",
      };
  }
}

function buildVersionedCurriculumPayload(
  schemaVersion: SchemaVersion,
  basePayload: Record<string, any>,
  extras?: {
    structureType?: string;
    terms?: any[];
    competenciesCatalog?: any[];
  }
) {
  if (schemaVersion === "v2") {
    return {
      ...basePayload,
      structure_type: extras?.structureType || "mixed",
      terms: extras?.terms || [],
      competencies_catalog: extras?.competenciesCatalog || [],
    };
  }
  return basePayload;
}

function buildSlimStructurePayload(classes: any[] = []) {
  return {
    classes: (classes || []).map((cls: any) => ({
      class_name: canonicalizeClassName(cls?.class_name || ""),
      subject: canonicalizeSubjectName(cls?.subject || ""),
      units: (cls?.units || []).map((unit: any, unitIndex: number) => ({
        unit_id: unit?.unit_id || `U${unitIndex + 1}`,
        unit_name: unit?.unit_name || "",
        topics: uniqueStrings(unit?.topics || []),
        subtopics: uniqueStrings(unit?.subtopics || []),
        key_concepts: uniqueStrings(unit?.key_concepts || []),
        chapters: (unit?.chapters || []).map((chapter: any, chapterIndex: number) => ({
          chapter_id: chapter?.chapter_id || `C${chapterIndex + 1}`,
          chapter_name: chapter?.chapter_name || chapter?.source_chapter_name || "",
          topics: uniqueStrings(chapter?.topics || []),
          subtopics: uniqueStrings(chapter?.subtopics || []),
          key_concepts: uniqueStrings(chapter?.key_concepts || []),
        })),
      })),
    })),
  };
}

function buildFaithfulStructureFromRawExtraction(rawExtraction: any) {
  return {
    document_metadata: rawExtraction?.document_metadata || {},
    classes: (rawExtraction?.classes || []).map((cls: any) => ({
      class_name: canonicalizeClassName(cls?.class_name || ""),
      subject: canonicalizeSubjectName(cls?.subject || ""),
      part_or_section: cls?.part_or_section || "",
      units: (cls?.units || []).map((unit: any, unitIndex: number) => ({
        unit_id: unit?.unit_id || `U${unitIndex + 1}`,
        unit_name: unit?.unit_name || "",
        marks: unit?.marks ?? null,
        explicit_chapters: uniqueStrings(unit?.explicit_chapters || []),
        topics: uniqueStrings(unit?.topics || []),
        subtopics: uniqueStrings(unit?.subtopics || []),
        key_concepts: uniqueStrings(unit?.key_concepts || []),
        chapters: uniqueStrings(unit?.explicit_chapters || []).map((chapterName, chapterIndex) => {
          const matchingChapter = (unit?.chapter_details || []).find(
            (chapter: any) => canonicalChapterKey(chapter?.chapter_name || "") === canonicalChapterKey(chapterName)
          ) || {};
          return {
            chapter_id: matchingChapter?.chapter_id || `C${chapterIndex + 1}`,
            chapter_name: chapterName,
            source_chapter_name: matchingChapter?.source_chapter_name || chapterName,
            topics: uniqueStrings(matchingChapter?.topics || []),
            subtopics: uniqueStrings(matchingChapter?.subtopics || []),
            key_concepts: uniqueStrings(matchingChapter?.key_concepts || []),
          };
        }),
      })),
    })),
    practicals: rawExtraction?.practicals || [],
    activities: rawExtraction?.activities || [],
    projects: rawExtraction?.projects || [],
    formative_only_content: rawExtraction?.formative_only_content || [],
    assessment_information: rawExtraction?.assessment_information || {},
  };
}

function buildHierarchyComparisonReport(faithfulStructure: any, planningStructure: any) {
  const faithfulClasses = faithfulStructure?.classes || [];
  const planningClasses = planningStructure?.classes || [];
  const planningByClassKey = new Map(
    planningClasses.map((cls: any) => [buildCanonicalClassKey(cls?.class_name || ""), cls])
  );

  const perClass = faithfulClasses.map((faithfulClass: any) => {
    const planningClass: any = planningByClassKey.get(buildCanonicalClassKey(faithfulClass?.class_name || "")) || {};
    const faithfulUnits = faithfulClass?.units || [];
    const planningUnits = planningClass?.units || [];
    const faithfulUnitTopics = faithfulUnits.reduce((sum: number, unit: any) => sum + (unit?.topics || []).length, 0);
    const faithfulChapterTopics = faithfulUnits.reduce(
      (sum: number, unit: any) => sum + (unit?.chapters || []).reduce((inner: number, chapter: any) => inner + (chapter?.topics || []).length, 0),
      0
    );
    const planningChapterTopics = planningUnits.reduce(
      (sum: number, unit: any) => sum + (unit?.chapters || []).reduce((inner: number, chapter: any) => inner + (chapter?.topics || []).length, 0),
      0
    );
    return {
      class_name: faithfulClass?.class_name || "",
      faithful_units: faithfulUnits.length,
      faithful_chapters: faithfulUnits.reduce((sum: number, unit: any) => sum + (unit?.chapters || []).length, 0),
      faithful_unit_topics: faithfulUnitTopics,
      faithful_chapter_topics: faithfulChapterTopics,
      planning_units: planningUnits.length,
      planning_chapters: planningUnits.reduce((sum: number, unit: any) => sum + (unit?.chapters || []).length, 0),
      planning_chapter_topics: planningChapterTopics,
    };
  });

  return {
    per_class: perClass,
    totals: {
      faithful_units: perClass.reduce((sum: number, item: any) => sum + item.faithful_units, 0),
      faithful_chapters: perClass.reduce((sum: number, item: any) => sum + item.faithful_chapters, 0),
      faithful_unit_topics: perClass.reduce((sum: number, item: any) => sum + item.faithful_unit_topics, 0),
      faithful_chapter_topics: perClass.reduce((sum: number, item: any) => sum + item.faithful_chapter_topics, 0),
      planning_units: perClass.reduce((sum: number, item: any) => sum + item.planning_units, 0),
      planning_chapters: perClass.reduce((sum: number, item: any) => sum + item.planning_chapters, 0),
      planning_chapter_topics: perClass.reduce((sum: number, item: any) => sum + item.planning_chapter_topics, 0),
    },
  };
}

function collectFaithfulStructureWarnings(faithfulStructure: any) {
  const warnings: string[] = [];
  for (const cls of faithfulStructure?.classes || []) {
    for (const unit of cls?.units || []) {
      const unitTopics = unit?.topics || [];
      const chapters = unit?.chapters || [];
      if (unitTopics.length === 0 && chapters.length === 0) {
        warnings.push(`Unit "${unit?.unit_name || ""}" in ${cls?.class_name || ""} has no topics and no chapters.`);
      }
      for (const chapter of chapters) {
        if (canonicalChapterKey(chapter?.chapter_name || "") === canonicalChapterKey(unit?.unit_name || "")) {
          warnings.push(`Unit "${unit?.unit_name || ""}" in ${cls?.class_name || ""} is duplicated as a chapter name.`);
        }
      }
    }
  }
  return uniqueStrings(warnings);
}

function buildStage8PayloadForClass(className: string, classes: any[] = [], competencyGroups: any[] = []) {
  const normalizedClassName = canonicalizeClassName(className);
  const matchedClass = (classes || []).find(
    (cls: any) => canonicalizeClassName(cls?.class_name || "") === normalizedClassName
  );
  if (!matchedClass) return null;

  const unitNameSet = new Set(
    (matchedClass?.units || []).map((unit: any) => normalizeSourceText(unit?.unit_name || "")).filter(Boolean)
  );
  const chapterNameSet = new Set(
    (matchedClass?.units || []).flatMap((unit: any) =>
      (unit?.chapters || []).map((chapter: any) => normalizeSourceText(chapter?.chapter_name || chapter?.source_chapter_name || ""))
    ).filter(Boolean)
  );
  const filteredCompetencies = (competencyGroups || []).filter((group: any) => {
    const unitKey = normalizeSourceText(group?.unit_name || "");
    const chapterKey = normalizeSourceText(group?.chapter_name || "");
    return unitNameSet.has(unitKey) || chapterNameSet.has(chapterKey);
  });

  return {
    class_name: normalizedClassName,
    units: (matchedClass?.units || []).map((unit: any, unitIndex: number) => ({
      unit_id: unit?.unit_id || `U${unitIndex + 1}`,
      unit_name: unit?.unit_name || "",
      chapters: (unit?.chapters || []).map((chapter: any, chapterIndex: number) => ({
        chapter_id: chapter?.chapter_id || `C${chapterIndex + 1}`,
        chapter_name: chapter?.chapter_name || chapter?.source_chapter_name || "",
      })),
    })),
    chapters: (matchedClass?.units || []).flatMap((unit: any, unitIndex: number) =>
      (unit?.chapters || []).map((chapter: any, chapterIndex: number) => ({
        unit_id: unit?.unit_id || `U${unitIndex + 1}`,
        unit_name: unit?.unit_name || "",
        chapter_id: chapter?.chapter_id || `C${chapterIndex + 1}`,
        chapter_name: chapter?.chapter_name || chapter?.source_chapter_name || "",
      }))
    ),
    competencies: filteredCompetencies,
  };
}

function safeStageName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureDebugDir(requestId: string): Promise<string> {
  const dir = path.join(DEBUG_OUTPUT_DIR, requestId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function writeDebugFile(dir: string, fileName: string, data: unknown) {
  const target = path.join(dir, fileName);
  const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  await fs.writeFile(target, content, "utf8");
}

function normalizeChapterTitle(value: string): string {
  return normalizeSourceText(
    value
      .replace(/^\s*chapter[\s:.-]*((\d+)|([ivxlcdm]+))?[\s:.-]*/i, "")
      .trim()
  );
}

function canonicalChapterKey(name: string): string {
  return normalizeSourceText(
    String(name || "")
      .replace(/^\s*chapter(?:\s*[-–—:.]?\s*|\s+)((\d+)|([ivxlcdm]+))?\s*[-–—:.]?\s*/i, "")
      .replace(/^\s*unit(?:\s*[-–—:.]?\s*|\s+)((\d+)|([ivxlcdm]+)|([a-z]))?\s*[-–—:.]?\s*/i, "")
      .replace(/\s*\((formative|summative|practical)\)\s*$/i, "")
      .replace(/\s+(formative|summative|practical)\s*$/i, "")
      .replace(/^[\s\-–—:.,;()]+/, "")
      .trim()
  );
}

function canonicalizeClassName(value: string): string {
  const cleaned = String(value || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:theory|practical|core|elective)\b/gi, " ")
    .replace(/[-–—/:]+/g, " ")
    .replace(/\b\d{4}\s*-\s*\d{2,4}\b/g, " ")
    .replace(/\b\d{4}\s*-\s*\d{4}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = normalizeSourceText(cleaned);
  if (!normalized) return "";

  const digitMatch = normalized.match(/\b(?:class|grade|std|standard)?\s*(9|10|11|12)\b/);
  if (digitMatch?.[1] === "9") return "Class IX";
  if (digitMatch?.[1] === "10") return "Class X";
  if (digitMatch?.[1] === "11") return "Class XI";
  if (digitMatch?.[1] === "12") return "Class XII";

  if (/\bix\b/.test(normalized) && !/\bxi\b|\bxii\b/.test(normalized)) return "Class IX";
  if (/\bx\b/.test(normalized) && !/\bix\b|\bxi\b|\bxii\b/.test(normalized)) return "Class X";
  if (/\bxi\b/.test(normalized) && !/\bxii\b/.test(normalized)) return "Class XI";
  if (/\bxii\b/.test(normalized)) return "Class XII";

  // Ignore subject-only labels like "Physics (Theory)" as class identities.
  if (!/\bclass\b|\bgrade\b|\bstd\b|\bstandard\b/.test(normalized)) {
    return "";
  }

  return cleaned || value.trim();
}

function extractClassNumber(value: string): number | null {
  const normalized = normalizeSourceText(String(value || ""));
  if (!normalized) return null;

  const digitMatch = normalized.match(/\b(?:class|grade|std|standard)?\s*(9|10|11|12)\b/);
  if (digitMatch?.[1]) return Number(digitMatch[1]);

  if (/\bix\b/.test(normalized) && !/\bxi\b|\bxii\b/.test(normalized)) return 9;
  if (/\bx\b/.test(normalized) && !/\bix\b|\bxi\b|\bxii\b/.test(normalized)) return 10;
  if (/\bxi\b/.test(normalized) && !/\bxii\b/.test(normalized)) return 11;
  if (/\bxii\b/.test(normalized)) return 12;

  return null;
}

function classNumberToDisplayName(classNumber: number): string {
  switch (classNumber) {
    case 9: return "Class IX";
    case 10: return "Class X";
    case 11: return "Class XI";
    case 12: return "Class XII";
    default: return "";
  }
}

function classNumberToCanonicalKey(classNumber: number): string {
  return `class_${classNumber}`;
}

function buildDocumentClassContext(entries: any[] = []) {
  const detectedClassNumbers = new Set<number>();
  for (const entry of entries) {
    for (const snippet of [
      entry?.class_name || "",
      entry?.part_or_section || "",
      entry?.subject || "",
      entry?.unit_name || "",
      entry?.chapter_name || "",
    ]) {
      const classNumber = extractClassNumber(snippet);
      if (classNumber) {
        detectedClassNumbers.add(classNumber);
      }
    }
  }

  return {
    detectedClassNumbers: [...detectedClassNumbers].sort((a, b) => a - b),
  };
}

function inferClassNumberFromEntry(entry: any, documentContext?: { detectedClassNumbers?: number[] }): number | null {
  for (const snippet of [
    entry?.class_name || "",
    entry?.part_or_section || "",
    entry?.subject || "",
    entry?.unit_name || "",
    entry?.chapter_name || "",
  ]) {
    const classNumber = extractClassNumber(snippet);
    if (classNumber) {
      return classNumber;
    }
  }

  if ((documentContext?.detectedClassNumbers || []).length === 1) {
    return documentContext?.detectedClassNumbers?.[0] || null;
  }

  return null;
}

function resolveClassName(entry: any, documentContext?: { detectedClassNumbers?: number[] }) {
  const classNumber = inferClassNumberFromEntry(entry, documentContext);
  if (classNumber) {
    return classNumberToDisplayName(classNumber);
  }
  if ((documentContext?.detectedClassNumbers || []).length > 1) {
    return "unresolved_class";
  }
  return canonicalizeClassName(entry?.class_name || "");
}

function canonicalizeSubjectName(value: string): string {
  return String(value || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:theory|practical|core|elective)\b/gi, " ")
    .replace(/[-–—/:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLanguageSubject(subject: string): boolean {
  const normalized = normalizeSourceText(subject || "");
  return [
    "english",
    "first language english",
    "english language",
    "communicative english",
    "language",
  ].some((candidate) => normalized.includes(candidate));
}

function buildLanguageFallbackStage1Facts(sourceText: string, existingFacts: any) {
  const lines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headingPatterns = [
    "reading",
    "writing",
    "grammar",
    "literature",
    "prose",
    "poetry",
    "supplementary reader",
    "prescribed books",
    "assessment",
    "listening",
    "speaking",
    "skill",
  ];

  const matches = uniqueStrings(
    lines.filter((line) => {
      const normalized = normalizeSourceText(line);
      return headingPatterns.some((pattern) => normalized === pattern || normalized.startsWith(`${pattern} `) || normalized.includes(` ${pattern}`));
    })
  );

  const units = matches.map((heading, index) => ({
    class_name: existingFacts?.classes?.[0]?.class_name || existingFacts?.document_metadata?.class || "",
    subject: existingFacts?.document_metadata?.subject || existingFacts?.classes?.[0]?.subject || "",
    part_or_section: "",
    unit_id: `U${index + 1}`,
    unit_name: heading,
    marks: null,
  }));

  const chapters = matches.map((heading, index) => ({
    class_name: existingFacts?.classes?.[0]?.class_name || existingFacts?.document_metadata?.class || "",
    subject: existingFacts?.document_metadata?.subject || existingFacts?.classes?.[0]?.subject || "",
    part_or_section: "",
    unit_id: `U${index + 1}`,
    unit_name: heading,
    chapter_name: heading,
    marks: null,
  }));

  return {
    document_metadata: existingFacts?.document_metadata || {},
    classes: existingFacts?.classes || (units.length ? [{
      class_name: existingFacts?.document_metadata?.class || "",
      subject: existingFacts?.document_metadata?.subject || "",
      part_or_section: "",
    }] : []),
    units,
    chapters,
    fallbackApplied: units.length > 0,
    fallbackUnitsCount: units.length,
  };
}

function cleanChapterName(value: string, unitName: string = ""): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const prefix = cleanInferredUnitTitle(unitName || "");
  if (prefix) {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(`^${escapedPrefix}\\s*:\\s*`, "i");
    if (prefixRegex.test(raw)) {
      return raw.replace(prefixRegex, "").trim();
    }
  }
  const genericSplit = raw.match(/^[^:]{2,}:\s*(.+)$/);
  return stripInternalParserLabel((genericSplit?.[1] || raw).trim());
}

function cleanUnitTitle(value: string): string {
  const raw = stripInternalParserLabel(String(value || "").trim());
  if (!raw) return "";
  const unitPrefixMatch = raw.match(/^(\s*unit\s*[\-–—:.]?\s*(\d+|[ivxlcdm]+|[a-z])\s*[\-–—:.]?\s*)(.*)$/i);
  if (!unitPrefixMatch) {
    return raw;
  }

  const prefix = (unitPrefixMatch[1] || "").trim().replace(/\s+/g, " ");
  let remainder = (unitPrefixMatch[3] || "").trim();
  if (!remainder) {
    return prefix;
  }

  const stopPattern = /\s{2,}|[.;]\s+|\s+-\s+|\s+[–—]\s+|\b(?:chapter|chapters|topic|topics|subtopic|subtopics|learning outcomes?|competencies?|notes?|assessment|practicals?)\b/i;
  const stopMatch = remainder.match(stopPattern);
  if (stopMatch?.index && stopMatch.index > 0) {
    remainder = remainder.slice(0, stopMatch.index).trim();
  }

  return `${prefix}${remainder ? ` ${remainder}` : ""}`.trim();
}

function cleanInferredUnitTitle(value: string): string {
  const cleaned = cleanUnitTitle(value || "");
  const withoutPrefix = cleaned
    .replace(/^unit\s*[\-–—:.]?\s*(\d+|[ivxlcdm]+|[a-z])\s*[\-–—:.]?\s*/i, "")
    .trim();

  if (!withoutPrefix) return "";

  let candidate = withoutPrefix;
  const stopPattern = /\s{2,}|[.;]\s+|\s+-\s+|\s+[–—]\s+|\b(?:chapter|chapters|topic|topics|subtopic|subtopics|learning outcomes?|competencies?|notes?|assessment|practicals?)\b/i;
  const stopMatch = candidate.match(stopPattern);
  if (stopMatch?.index && stopMatch.index > 0) {
    candidate = candidate.slice(0, stopMatch.index).trim();
  }

  candidate = candidate
    .split(/\s{2,}/)[0]
    .split(/\.\s+/)[0]
    .trim();

  return candidate;
}

function cleanRecoveredUnitName(value: string): string {
  const cleaned = stripInternalParserLabel(cleanUnitTitle(value || ""));
  if (!cleaned) return "";

  const unitPrefixMatch = cleaned.match(/^(\s*unit\s*[\-â€“â€”:.]?\s*(\d+|[ivxlcdm]+|[a-z])\s*[\-â€“â€”:.]?\s*)(.*)$/i);
  if (!unitPrefixMatch) {
    return cleaned;
  }

  const prefix = (unitPrefixMatch[1] || "").trim().replace(/\s+/g, " ");
  let remainder = (unitPrefixMatch[3] || "").trim();
  if (!remainder) {
    return prefix;
  }

  const topicListMatch = remainder.match(/^(.+?)\s+([A-Z][A-Za-z-]+),\s+[A-Z]/);
  if (topicListMatch?.[1]) {
    const candidate = topicListMatch[1].trim();
    if ((candidate.match(/\S+/g) || []).length >= 2) {
      remainder = candidate;
    }
  }

  remainder = remainder
    .split(/\s{2,}/)[0]
    .split(/[.;]\s+/)[0]
    .trim();

  return `${prefix}${remainder ? ` ${remainder}` : ""}`.trim();
}

function stripInternalParserLabel(value: string) {
  return String(value || "")
    .replace(/\s*\(implicit from context[^)]*\)\s*$/i, "")
    .replace(/\s*\(reconstructed[^)]*\)\s*$/i, "")
    .replace(/\s*\(fallback[^)]*\)\s*$/i, "")
    .trim();
}

function buildPublicWarningMessage(warning: string) {
  const normalized = normalizeSourceText(warning || "");
  if (!normalized) return "";
  if (normalized.includes("fallback chapters present")) {
    return "Some units were reconstructed because explicit chapter headings were unavailable in the uploaded document.";
  }
  if (normalized.includes("multi class board syllabus detected but fewer than two classes were preserved")) {
    return "The document appears to contain multiple classes, but only one class could be preserved reliably.";
  }
  if (normalized.includes("term semester curriculum detected but term semester entities were not preserved")) {
    return "Term or semester labels were detected in the document, but some of them could not be preserved reliably.";
  }
  return warning;
}

function buildPublicFallbackLabel(value: string) {
  if (value === "pdf_to_markdown") return value;
  if (value.startsWith("unit_fallback:")) return "reconstructed_chapter_headings";
  return value;
}

function buildStableUnitId(className: string, subject: string, baseUnitId: string, fallbackIndex: number) {
  const classSlug = (buildCanonicalClassKey(className || "") || `class_${fallbackIndex + 1}`).replace(/_/g, "-");
  const subjectSlug = normalizeSourceText(subject || "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "general";
  const unitSlug = normalizeSourceText(baseUnitId || `u${fallbackIndex + 1}`)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || `u${fallbackIndex + 1}`;
  return `${classSlug}-${subjectSlug}-${unitSlug}`;
}

function canonicalUnitKey(value: string): string {
  return normalizeSourceText(cleanUnitTitle(value || ""));
}

function canonicalUnitNameKey(value: string): string {
  return normalizeSourceText(cleanInferredUnitTitle(value || "") || cleanUnitTitle(value || "") || value || "");
}

function canonicalUnitStructuralNameKey(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withoutPrefix = raw
    .replace(/^unit\s*[\-–—:.]?\s*(\d+|[ivxlcdm]+|[a-z])\s*[\-–—:.]?\s*/i, "")
    .trim();
  return normalizeSourceText(withoutPrefix || raw);
}

function buildUnitStructuralKey(entry: {
  class_name?: string;
  subject?: string;
  part_or_section?: string;
  unit_name?: string;
}, documentContext?: { detectedClassNumbers?: number[] }) {
  return [
    normalizeSourceText(buildCanonicalClassKey(entry?.class_name || "", documentContext)),
    normalizeSourceText(canonicalizeSubjectName(entry?.subject || "")),
    normalizeSourceText(entry?.part_or_section || ""),
    canonicalUnitStructuralNameKey(entry?.unit_name || ""),
  ].join("::");
}

function buildChapterStructuralKey(entry: {
  class_name?: string;
  subject?: string;
  part_or_section?: string;
  unit_name?: string;
  chapter_name?: string;
}, documentContext?: { detectedClassNumbers?: number[] }) {
  return [
    buildUnitStructuralKey(entry, documentContext),
    canonicalChapterKey(entry?.chapter_name || ""),
  ].join("::");
}

function canonicalUnitId(value: string): string {
  const normalized = normalizeSourceText(String(value || ""));
  const match = normalized.match(/\bu\s*(\d+)\b/) || normalized.match(/\bunit\s*(\d+)\b/);
  if (match?.[1]) {
    return `u${match[1]}`;
  }
  return normalized.replace(/\s+/g, "");
}

function buildCanonicalClassKey(value: string, documentContext?: { detectedClassNumbers?: number[] }) {
  const classNumber = extractClassNumber(value || "");
  if (classNumber) {
    return classNumberToCanonicalKey(classNumber);
  }
  const inferredClassNumber = inferClassNumberFromEntry({ class_name: value || "" }, documentContext);
  if (inferredClassNumber) {
    return classNumberToCanonicalKey(inferredClassNumber);
  }
  if ((documentContext?.detectedClassNumbers || []).length > 1) {
    return "unresolved_class";
  }
  return normalizeSourceText(canonicalizeClassName(value || ""));
}

function hasValidTeachingUnitId(unitId: string) {
  return /^u\d+$/i.test(canonicalUnitId(unitId || ""));
}

function hasTheoryStructureEvidence(unit: any) {
  return Boolean(
    unit?.marks !== null && unit?.marks !== undefined && unit?.marks !== "" ||
    (unit?.explicit_chapters || []).length ||
    (unit?.possible_chapters || []).length ||
    (unit?.headings || []).length ||
    (unit?.chapter_candidates || []).length ||
    (unit?.chapters || []).length
  );
}

function isPracticalLikeSection(value: string) {
  const normalized = normalizeSourceText(value || "");
  return (
    normalized.includes("practical") ||
    normalized.includes("practical syllabus") ||
    normalized.includes("section a") ||
    normalized.includes("section b") ||
    normalized.includes("mandatory") ||
    normalized.includes("laboratory") ||
    normalized.includes("lab") ||
    normalized.includes("evaluation") ||
    normalized.includes("project work") ||
    normalized.includes("viva") ||
    normalized.includes("internal assessment")
  );
}

function isTeachingUnitCandidate(unit: any) {
  const unitId = String(unit?.unit_id || "").trim();
  const unitName = cleanUnitTitle(unit?.unit_name || "");
  const partOrSection = String(unit?.part_or_section || "").trim();
  const marks = unit?.marks;
  const hasTheoryEvidence = hasTheoryStructureEvidence(unit);

  if (!unitName) return false;
  if (isPracticalLikeSection(partOrSection)) return false;
  if (isPracticalLikeSection(unitName)) return false;
  if ((marks === null || marks === undefined || marks === "") && isPracticalLikeSection(`${partOrSection} ${unitName}`)) {
    return false;
  }
  if (!hasValidTeachingUnitId(unitId) && !hasTheoryEvidence) return false;

  return true;
}

function isFormativeOrPracticalLabel(value: string) {
  const normalized = normalizeSourceText(value || "");
  return (
    normalized.includes("practical syllabus") ||
    normalized.includes("practical") ||
    normalized.includes("formative") ||
    normalized.includes("internal assessment") ||
    normalized.includes("project work") ||
    normalized.includes("viva")
  );
}

function buildClassIdentityKey(entry: { class_name?: string; subject?: string }) {
  return [
    normalizeSourceText(buildCanonicalClassKey(entry?.class_name || "")),
    normalizeSourceText(canonicalizeSubjectName(entry?.subject || "")),
  ].join("::");
}

function buildSectionKey(entry: { class_name?: string; subject?: string; part_or_section?: string }) {
  return [
    normalizeSourceText(canonicalizeClassName(entry?.class_name || "")),
    normalizeSourceText(canonicalizeSubjectName(entry?.subject || "")),
    normalizeSourceText(entry?.part_or_section || ""),
  ].join("::");
}

function getExplicitChapters(rawUnit: any): string[] {
  return uniqueStrings(rawUnit?.explicit_chapters || rawUnit?.possible_chapters || []);
}

function getChapterHeadings(rawUnit: any): string[] {
  return uniqueStrings(rawUnit?.headings || []);
}

function buildNormalizedLookup(values: string[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const value of values) {
    const normalized = normalizeChapterTitle(value || "");
    if (normalized && !lookup.has(normalized)) {
      lookup.set(normalized, value);
    }
  }
  return lookup;
}

function getStage1ExtractionCounts(extraction: any) {
  return {
    classes: (extraction?.classes || []).length,
    units: (extraction?.units || []).length,
    chapters: (extraction?.chapters || []).length,
  };
}

function extractRelevantClassSourceText(sourceText: string, rawClass: any, maxLength: number = 14000) {
  const canonicalClass = canonicalizeClassName(rawClass?.class_name || "");
  const classNeedles = uniqueStrings([
    canonicalClass,
    rawClass?.class_name || "",
    rawClass?.subject ? `${canonicalClass} ${rawClass.subject}` : "",
    rawClass?.subject ? `${rawClass.subject} ${canonicalClass}` : "",
  ]).filter(Boolean);

  const lines = sourceText.split(/\r?\n/);
  const matchedLineIndexes = new Set<number>();

  lines.forEach((line, index) => {
    const normalizedLine = normalizeSourceText(line);
    if (classNeedles.some((needle) => normalizedLine.includes(normalizeSourceText(needle)))) {
      for (let offset = -4; offset <= 14; offset += 1) {
        const targetIndex = index + offset;
        if (targetIndex >= 0 && targetIndex < lines.length) {
          matchedLineIndexes.add(targetIndex);
        }
      }
    }
  });

  const orderedIndexes = [...matchedLineIndexes].sort((a, b) => a - b);
  const excerpt = orderedIndexes.map((index) => lines[index]).join("\n").trim();
  if (excerpt && excerpt.length <= maxLength) {
    return excerpt;
  }
  if (excerpt) {
    return excerpt.slice(0, maxLength);
  }

  return sourceText.slice(0, maxLength);
}

function filterTheoryUnitsForEnrichment(rawClass: any, structureClass: any) {
  const rawUnits = (rawClass?.units || []).filter((unit: any) => isTeachingUnitCandidate(unit));
  const structureUnits = (structureClass?.units || []).filter((unit: any) => isTeachingUnitCandidate(unit));
  const allowedUnitKeys = new Set(rawUnits.map((unit: any) => buildUnitStructuralKey({
    class_name: rawClass?.class_name || "",
    subject: rawClass?.subject || "",
    part_or_section: rawClass?.part_or_section || "",
    unit_name: unit?.unit_name || "",
  })).filter(Boolean));
  const practicalItemsCount = (rawClass?.units || []).filter((unit: any) => !isTeachingUnitCandidate(unit) && isPracticalLikeSection(`${unit?.part_or_section || ""} ${unit?.unit_name || ""}`)).length;
  const formativeRefsCount = (structureClass?.raw_nodes || []).filter((node: any) => isFormativeOrPracticalLabel(node?.title || "")).length;
  const ignoredAppendixCount = (rawClass?.units || []).filter((unit: any) => !isTeachingUnitCandidate(unit)).length - practicalItemsCount;

  return {
    rawClass: {
      ...rawClass,
      units: rawUnits,
    },
    structureClass: {
      ...structureClass,
      units: structureUnits.filter((unit: any) => allowedUnitKeys.has(buildUnitStructuralKey({
        class_name: rawClass?.class_name || "",
        subject: rawClass?.subject || "",
        part_or_section: rawClass?.part_or_section || "",
        unit_name: unit?.unit_name || "",
      }))),
      raw_nodes: (structureClass?.raw_nodes || []).filter((node: any) => {
        const parent = normalizeSourceText(node?.parent || "");
        return !isPracticalLikeSection(parent) && !isFormativeOrPracticalLabel(node?.title || "");
      }),
    },
    counts: {
      rawExtractedUnitsCount: (rawClass?.units || []).length,
      approvedTheoryUnitsCount: rawUnits.length,
      practicalItemsCount,
      formativeRefsCount,
      ignoredAppendixCount: Math.max(0, ignoredAppendixCount),
    },
  };
}

function classifyCurriculumItem(unit: any) {
  const unitName = String(unit?.unit_name || "");
  const partOrSection = String(unit?.part_or_section || "");
  if (isTeachingUnitCandidate(unit)) return "THEORY_UNIT";
  if (isPracticalLikeSection(`${partOrSection} ${unitName}`)) return "PRACTICAL_ITEM";
  if (isFormativeOrPracticalLabel(unitName)) return "FORMATIVE_REF";
  if (!String(unit?.unit_id || "").trim()) return "APPENDIX_ITEM";
  return "IGNORE";
}

function buildApprovedTheoryHierarchy(rawExtraction: any, documentHierarchy: any) {
  const practicals: any[] = [];
  const formativeContentRefs: any[] = [];
  const ignoredItems: any[] = [];

  const classes = (rawExtraction?.classes || []).map((rawClass: any, classIndex: number) => {
    const structureClass = (documentHierarchy?.classes || [])[classIndex] || {};
    const classKey = buildClassIdentityKey(rawClass);
    const canonicalClassName = canonicalizeClassName(rawClass?.class_name || "");
    const canonicalSubjectName = canonicalizeSubjectName(rawClass?.subject || "");
    const exactClassChapters = (rawExtraction?.chapters || []).filter(
      (chapter: any) => buildClassIdentityKey(chapter) === classKey
    );
    const fallbackClassChapters = (rawExtraction?.chapters || []).filter((chapter: any) => {
      const sameClass = canonicalizeClassName(chapter?.class_name || "") === canonicalClassName;
      if (!sameClass) return false;
      const chapterSubject = canonicalizeSubjectName(chapter?.subject || "");
      return !canonicalSubjectName || !chapterSubject || chapterSubject === canonicalSubjectName;
    });
    const classChapters = [...exactClassChapters, ...fallbackClassChapters].filter(
      (chapter: any, chapterIndex: number, allChapters: any[]) =>
        allChapters.findIndex((entry: any) => buildChapterStructuralKey({
          class_name: canonicalClassName,
          subject: canonicalSubjectName,
          part_or_section: chapter?.part_or_section || "",
          unit_name: entry?.unit_name || "",
          chapter_name: entry?.chapter_name || entry?.unit_name || "",
        }) === buildChapterStructuralKey({
          class_name: canonicalClassName,
          subject: canonicalSubjectName,
          part_or_section: chapter?.part_or_section || "",
          unit_name: chapter?.unit_name || "",
          chapter_name: chapter?.chapter_name || chapter?.unit_name || "",
        })) === chapterIndex
    );
    const structureUnitByKey = new Map<string, any>(
      (structureClass?.units || [])
        .map((unit: any): [string, any] => [buildUnitStructuralKey({
          class_name: canonicalClassName,
          subject: canonicalSubjectName,
          part_or_section: unit?.part_or_section || "",
          unit_name: unit?.unit_name || "",
        }), unit])
        .filter(([key]: [string, any]) => Boolean(key))
    );
    const approvedUnitMap = new Map<string, any>();

    for (const rawUnit of rawClass?.units || []) {
      const classification = classifyCurriculumItem(rawUnit);
      if (classification !== "THEORY_UNIT") {
        const payload = {
          class_name: canonicalizeClassName(rawClass?.class_name || ""),
          subject: canonicalizeSubjectName(rawClass?.subject || ""),
          unit_id: rawUnit?.unit_id || "",
          unit_name: rawUnit?.unit_name || "",
          classification,
        };
        if (classification === "PRACTICAL_ITEM") practicals.push(payload);
        else if (classification === "FORMATIVE_REF") formativeContentRefs.push(payload);
        else ignoredItems.push(payload);
        continue;
      }

      const structuralUnitKey = buildUnitStructuralKey({
        class_name: canonicalClassName,
        subject: canonicalSubjectName,
        part_or_section: rawUnit?.part_or_section || "",
        unit_name: rawUnit?.unit_name || "",
      });
      const structureUnit = structureUnitByKey.get(structuralUnitKey) || {};
      approvedUnitMap.set(structuralUnitKey, {
        unit_id: rawUnit?.unit_id || structureUnit?.unit_id || "",
        unit_name: String(rawUnit?.unit_name || structureUnit?.unit_name || "").trim(),
        part_or_section: rawUnit?.part_or_section || structureUnit?.part_or_section || "",
        marks: rawUnit?.marks ?? null,
        topics: uniqueStrings(rawUnit?.topics || []),
        subtopics: uniqueStrings(rawUnit?.subtopics || []),
        key_concepts: uniqueStrings(rawUnit?.key_concepts || []),
        chapters: [],
      });
    }

    for (const rawChapter of classChapters) {
      const structuralUnitKey = buildUnitStructuralKey({
        class_name: canonicalClassName,
        subject: canonicalSubjectName,
        part_or_section: rawChapter?.part_or_section || "",
        unit_name: rawChapter?.unit_name || "",
      });
      if (!structuralUnitKey) {
        continue;
      }

      const candidateUnit = {
        unit_id: rawChapter?.unit_id || "",
        unit_name: rawChapter?.unit_name || "",
        part_or_section: rawChapter?.part_or_section || "",
        marks: rawChapter?.marks ?? null,
      };
      const classification = classifyCurriculumItem(candidateUnit);
      if (classification !== "THEORY_UNIT") {
        continue;
      }

      if (!approvedUnitMap.has(structuralUnitKey)) {
        const structureUnit = structureUnitByKey.get(structuralUnitKey) || {};
        const recoveredUnitName = cleanRecoveredUnitName(rawChapter?.unit_name || structureUnit?.unit_name || "");
        approvedUnitMap.set(structuralUnitKey, {
          unit_id: rawChapter?.unit_id || structureUnit?.unit_id || "",
          unit_name: recoveredUnitName,
          part_or_section: rawChapter?.part_or_section || structureUnit?.part_or_section || "",
          marks: rawChapter?.marks ?? null,
          topics: [],
          subtopics: [],
          key_concepts: [],
          chapters: [],
        });
      }
    }

    for (const unit of approvedUnitMap.values()) {
      const structuralUnitKey = buildUnitStructuralKey({
        class_name: canonicalClassName,
        subject: canonicalSubjectName,
        part_or_section: unit?.part_or_section || "",
        unit_name: unit?.unit_name || "",
      });
      const normalizedUnitId = canonicalUnitId(unit?.unit_id || "");
      const structureUnit = structureUnitByKey.get(structuralUnitKey) || {};
      const chapterCandidatesFromStage1 = classChapters
        .filter((chapter: any) => buildUnitStructuralKey({
          class_name: canonicalClassName,
          subject: canonicalSubjectName,
          part_or_section: chapter?.part_or_section || "",
          unit_name: chapter?.unit_name || "",
        }) === structuralUnitKey || (normalizedUnitId && canonicalUnitId(chapter?.unit_id || "") === normalizedUnitId))
        .filter((chapter: any) => !isPracticalLikeSection(chapter?.chapter_name || "") && !isFormativeOrPracticalLabel(chapter?.chapter_name || ""))
        .map((chapter: any, chapterIndex: number) => {
          const recoveredUnitName = cleanRecoveredUnitName(chapter?.unit_name || unit?.unit_name || "");
          const fallbackChapterName = chapter?.chapter_name || cleanInferredUnitTitle(recoveredUnitName) || recoveredUnitName;
          return ({
          chapter_id: `C${chapterIndex + 1}`,
          chapter_name: cleanChapterName(fallbackChapterName, recoveredUnitName),
          source_chapter_name: cleanChapterName(fallbackChapterName, recoveredUnitName),
          source_heading: cleanChapterName(fallbackChapterName, recoveredUnitName),
          source_type: "explicit_chapter",
          topics: uniqueStrings(chapter?.topics || []),
          subtopics: uniqueStrings(chapter?.subtopics || []),
          key_concepts: uniqueStrings(chapter?.key_concepts || []),
          });
        });
      const chapterCandidatesFromStructure = (structureUnit?.chapter_candidates || [])
        .filter((candidate: any) => !isPracticalLikeSection(candidate?.title || "") && !isFormativeOrPracticalLabel(candidate?.title || ""))
        .map((candidate: any, chapterIndex: number) => ({
          chapter_id: `C${chapterIndex + 1}`,
          chapter_name: cleanChapterName(candidate?.title || "", unit?.unit_name || structureUnit?.unit_name || ""),
          source_chapter_name: cleanChapterName(candidate?.title || "", unit?.unit_name || structureUnit?.unit_name || ""),
          source_heading: cleanChapterName(candidate?.title || "", unit?.unit_name || structureUnit?.unit_name || ""),
          source_type: candidate?.source_type || "explicit_chapter",
          topics: [],
          subtopics: [],
          key_concepts: [],
        }));
      const chapterCandidates = (chapterCandidatesFromStage1.length ? chapterCandidatesFromStage1 : chapterCandidatesFromStructure)
        .filter((candidate: any) => Boolean(candidate?.chapter_name))
        .filter((candidate: any, candidateIndex: number, allCandidates: any[]) =>
          allCandidates.findIndex((entry: any) => canonicalChapterKey(entry?.chapter_name || "") === canonicalChapterKey(candidate?.chapter_name || "")) === candidateIndex
        );
      unit.chapters = chapterCandidates;
      if (!unit.unit_name) {
        unit.unit_name = cleanRecoveredUnitName(structureUnit?.unit_name || chapterCandidates[0]?.chapter_name || "");
      }
    }

    const approvedUnits = [...approvedUnitMap.values()].sort((left: any, right: any) => {
      const leftId = canonicalUnitId(left?.unit_id || "");
      const rightId = canonicalUnitId(right?.unit_id || "");
      return leftId.localeCompare(rightId, undefined, { numeric: true });
    });
    console.log(
      `[ApprovedHierarchy] ${canonicalClassName} unit ids after recovery: ${JSON.stringify(approvedUnits.map((unit: any) => unit?.unit_id || "").filter(Boolean))}`
    );

    return {
      class_name: canonicalClassName,
      subject: canonicalSubjectName,
      part_or_section: "",
      units: approvedUnits,
    };
  });

  return {
    classes,
    practicals,
    formative_content_refs: formativeContentRefs,
    ignored_items: ignoredItems,
  };
}

function isTheoryEnrichmentResult(result: any, expectedUnitIds: string[]) {
  const units = Array.isArray(result?.units) ? result.units : [];
  if (!units.length) return false;

  const expectedIds = expectedUnitIds.map((value) => canonicalUnitId(value)).filter(Boolean);
  const actualIds = units.map((unit: any) => canonicalUnitId(unit?.unit_id || "")).filter(Boolean);
  const practicalLikeOnly = units.every((unit: any) => isStrongExplicitNonTheoryUnit(unit));

  if (practicalLikeOnly) return false;
  if (!actualIds.length) return false;
  if (!expectedIds.length) return units.some((unit: any) => (unit?.chapters || []).length > 0);
  return actualIds.every((id: string) => expectedIds.includes(id));
}

function isValidStage3Enrichment(result: any, expectedUnitIds: string[]) {
  const units = Array.isArray(result?.units) ? result.units : [];
  const expectedIds = expectedUnitIds.map((value) => canonicalUnitId(value)).filter(Boolean);
  const actualIds = units.map((unit: any) => canonicalUnitId(unit?.unit_id || "")).filter(Boolean);
  const actualIdSet = uniqueStrings(actualIds);
  const expectedIdSet = uniqueStrings(expectedIds);
  const practicalLikeOnly = units.length > 0 && units.every((unit: any) => isStrongExplicitNonTheoryUnit(unit));
  const hasChapterContent = units.some((unit: any) => (unit?.chapters || []).length > 0);

  return {
    valid:
      units.length > 0 &&
      !practicalLikeOnly &&
      hasChapterContent &&
      (
        expectedIdSet.length === 0 ||
        (
          actualIdSet.length >= expectedIdSet.length &&
          actualIdSet.every((id) => expectedIdSet.includes(id)) &&
          expectedIdSet.every((id) => actualIdSet.includes(id))
        )
      ),
    practicalLikeOnly,
    actualCount: actualIdSet.length,
    expectedCount: expectedIdSet.length,
  };
}

function scoreStage3Enrichment(result: any, expectedUnitIds: string[]) {
  const units = Array.isArray(result?.units) ? result.units : [];
  const expectedIds = uniqueStrings(expectedUnitIds.map((value) => canonicalUnitId(value)).filter(Boolean));
  const actualIds = uniqueStrings(units.map((unit: any) => canonicalUnitId(unit?.unit_id || "")).filter(Boolean));
  const chapterCount = units.reduce((sum: number, unit: any) => sum + ((unit?.chapters || []).length || 0), 0);
  const missingExpectedUnits = expectedIds.filter((id) => !actualIds.includes(id));
  return {
    unitCount: actualIds.length,
    chapterCount,
    nonTheoryCount: units.filter((unit: any) => isStrongExplicitNonTheoryUnit(unit)).length,
    missingExpectedUnitsCount: missingExpectedUnits.length,
    missingExpectedUnits,
  };
}

function isStrongExplicitNonTheoryUnit(unit: any) {
  const unitStatus = String(unit?.assessment_status || "").toLowerCase().trim();
  if (["formative", "practical", "project"].includes(unitStatus)) {
    return true;
  }

  const labels = [
    unit?.unit_name || "",
    unit?.section_heading || "",
    ...(unit?.chapters || []).flatMap((chapter: any) => [
      chapter?.chapter_name || "",
      chapter?.source_chapter_name || "",
      chapter?.source_heading || "",
      chapter?.section_heading || "",
    ]),
  ].join(" ");
  const normalizedLabels = normalizeSourceText(labels);

  if (
    isPracticalLikeSection(labels) ||
    /\bproject\b|\bactivity\b|\blab\b|\blaboratory\b|\bexperiment\b|\binternal assessment\b/.test(normalizedLabels) ||
    normalizedLabels.includes("formative only") ||
    normalizedLabels.includes("not for summative assessment")
  ) {
    return true;
  }

  const chapterStatuses = (unit?.chapters || []).map((chapter: any) => String(chapter?.assessment_status || "").toLowerCase().trim());
  return chapterStatuses.length > 0 && chapterStatuses.every((status: string) => ["formative", "practical", "project"].includes(status));
}

function ensureUnitHasFallbackChapter(unit: any) {
  const chapters = Array.isArray(unit?.chapters) ? unit.chapters.filter(Boolean) : [];
  if (chapters.length > 0) {
    return { ...unit, chapters };
  }
  const fallbackName = cleanChapterName(unit?.unit_name || "", unit?.unit_name || "") || unit?.unit_name || "Untitled Chapter";
  return {
    ...unit,
    chapters: [{
      chapter_id: "C1",
      chapter_name: fallbackName,
      source_chapter_name: fallbackName,
      source_heading: fallbackName,
      source_type: "unit_fallback",
      assessment_status: "summative",
      topics: [],
      subtopics: [],
      key_concepts: [],
    }],
  };
}

function makeNodeId(prefix: string, index: number): string {
  return `${prefix}${index + 1}`;
}

function buildDocumentStructureHierarchy(rawExtraction: any, headingClassification?: any) {
  const classifiedClasses = headingClassification?.classes || [];
  const classes = (rawExtraction?.classes || []).map((rawClass: any, classIndex: number) => {
    const classifiedClass = classifiedClasses[classIndex] || {};
    const units = (rawClass?.units || []).map((rawUnit: any, unitIndex: number) => {
      const classifiedUnit = (classifiedClass?.units || [])[unitIndex] || {};
      const sourceUnitName = rawUnit?.unit_name || `Unit ${unitIndex + 1}`;
      const explicitChapters = getExplicitChapters(rawUnit);
      const topicLookup = new Set(
        [
          ...(rawUnit?.topics || []),
          ...(rawUnit?.subtopics || []),
          ...(rawUnit?.key_concepts || []),
        ]
          .map((value: string) => normalizeChapterTitle(value || ""))
          .filter(Boolean)
      );
      const classifiedChapterHeadings = uniqueStrings(
        (classifiedUnit?.classified_blocks || [])
          .filter((block: any) => block?.classification === "chapter")
          .map((block: any) => block?.source_heading || "")
      );
      const fallbackChapterHeadings = getChapterHeadings(rawUnit).filter((heading) => {
        const normalizedHeading = normalizeChapterTitle(heading);
        return Boolean(normalizedHeading) &&
          normalizedHeading !== normalizeChapterTitle(sourceUnitName) &&
          !topicLookup.has(normalizedHeading);
      });
      const chapterHeadings = (classifiedChapterHeadings.length ? classifiedChapterHeadings : fallbackChapterHeadings).filter((heading) => {
        const normalizedHeading = normalizeChapterTitle(heading);
        return Boolean(normalizedHeading) &&
          normalizedHeading !== normalizeChapterTitle(sourceUnitName) &&
          !topicLookup.has(normalizedHeading);
      });
      const chapterCandidates = explicitChapters.length
        ? explicitChapters.map((title, chapterIndex) => ({
            node_id: `${rawUnit?.unit_id || makeNodeId("U", unitIndex)}-C${chapterIndex + 1}`,
            title,
            level: "chapter",
            parent: sourceUnitName,
            source_text: title,
            source_type: "explicit_chapter",
          }))
        : chapterHeadings.length
          ? chapterHeadings.map((title, chapterIndex) => ({
              node_id: `${rawUnit?.unit_id || makeNodeId("U", unitIndex)}-H${chapterIndex + 1}`,
              title,
              level: "chapter_heading",
              parent: sourceUnitName,
              source_text: title,
              source_type: "chapter_heading",
            }))
          : [{
              node_id: `${rawUnit?.unit_id || makeNodeId("U", unitIndex)}-F1`,
              title: sourceUnitName,
              level: "unit_fallback",
              parent: sourceUnitName,
              source_text: sourceUnitName,
              source_type: "unit_fallback",
            }];
      const sourceNodes = [
        {
          node_id: rawUnit?.unit_id || makeNodeId("U", unitIndex),
          title: sourceUnitName,
          level: "unit",
          parent: rawClass?.subject || rawClass?.class_name || "",
          source_text: sourceUnitName,
        },
        ...chapterCandidates,
        ...(rawUnit?.topics || []).map((title: string, topicIndex: number) => ({
          node_id: `${rawUnit?.unit_id || makeNodeId("U", unitIndex)}-T${topicIndex + 1}`,
          title,
          level: "topic",
          parent: sourceUnitName,
          source_text: title,
        })),
        ...(rawUnit?.subtopics || []).map((title: string, subtopicIndex: number) => ({
          node_id: `${rawUnit?.unit_id || makeNodeId("U", unitIndex)}-S${subtopicIndex + 1}`,
          title,
          level: "subtopic",
          parent: sourceUnitName,
          source_text: title,
        })),
        ...(rawUnit?.key_concepts || []).map((title: string, conceptIndex: number) => ({
          node_id: `${rawUnit?.unit_id || makeNodeId("U", unitIndex)}-K${conceptIndex + 1}`,
          title,
          level: "key_concept",
          parent: sourceUnitName,
          source_text: title,
        })),
      ];

      return {
        unit_id: rawUnit?.unit_id || makeNodeId("U", unitIndex),
        unit_name: sourceUnitName,
        marks: rawUnit?.marks ?? null,
        explicit_chapters: explicitChapters,
        possible_chapters: uniqueStrings(rawUnit?.possible_chapters || []),
        headings: chapterHeadings,
        topics: uniqueStrings(rawUnit?.topics || []),
        subtopics: uniqueStrings(rawUnit?.subtopics || []),
        key_concepts: uniqueStrings(rawUnit?.key_concepts || []),
        chapter_candidates: chapterCandidates,
        source_nodes: sourceNodes,
        structure_type: explicitChapters.length
          ? "unit_chapter_topic"
          : chapterHeadings.length
            ? "unit_heading_topic"
            : "unit_topic",
      };
    });

    return {
      class_name: rawClass?.class_name || "",
      subject: rawClass?.subject || "",
      part_or_section: rawClass?.part_or_section || "",
      detected_structure: units.some((unit: any) => unit.explicit_chapters.length) ? "unit_chapter_topic" : "mixed_structure",
      units,
      raw_nodes: units.flatMap((unit: any) => unit.source_nodes || []),
    };
  });

  return {
    document_metadata: rawExtraction?.document_metadata || {},
    classes,
  };
}

function validateStage2Classifications(rawClasses: any[], headingClassification: any) {
  const classifiedClasses = headingClassification?.classes || [];

  classifiedClasses.forEach((classifiedClass: any, classIndex: number) => {
    const rawClass = rawClasses[classIndex] || {};
    const rawUnits = rawClass?.units || [];
    const classifiedUnits = classifiedClass?.units || [];

    classifiedUnits.forEach((classifiedUnit: any, unitIndex: number) => {
      const rawUnit = rawUnits[unitIndex] || {};
      const explicitChapters = getExplicitChapters(rawUnit);
      const possibleChapters = uniqueStrings(rawUnit?.possible_chapters || []);
      const validChapterNames = new Set(
        [...explicitChapters, ...possibleChapters]
          .map((value) => normalizeChapterTitle(value || ""))
          .filter(Boolean)
      );
      const sourceSectionKey = [
        normalizeSourceText(rawClass?.class_name || ""),
        normalizeSourceText(rawClass?.subject || ""),
        normalizeSourceText(rawUnit?.unit_id || ""),
      ].join("::");

      for (const block of classifiedUnit?.classified_blocks || []) {
        if (block?.classification === "chapter") {
          const normalizedHeading = normalizeChapterTitle(block?.source_heading || "");
          let matchedSource = "";

          if (validChapterNames.has(normalizedHeading)) {
            matchedSource = explicitChapters
              .concat(possibleChapters)
              .find((value) => normalizeChapterTitle(value || "") === normalizedHeading) || "";
          } else if (
            validChapterNames.size === 0 &&
            normalizeChapterTitle(rawUnit?.unit_name || "") === normalizedHeading
          ) {
            matchedSource = rawUnit?.unit_name || "";
          }

          console.log(
            `[Validation][Stage2] unit_name: "${rawUnit?.unit_name || ""}" | explicit_chapters: ${JSON.stringify(explicitChapters)} | possible_chapters: ${JSON.stringify(possibleChapters)} | source_heading: "${block?.source_heading || ""}" | matched_source: "${matchedSource}"`
          );

          if (!matchedSource) {
            throw new Error(`Stage 2 invented chapter: ${block?.source_heading || ""}`);
          }
          console.log(
            `[Validation][Stage2] sectionKey: "${sourceSectionKey}" | source_heading: "${block?.source_heading || ""}" | normalized: "${normalizedHeading}" | matchedInStage1Unit: true`
          );
        }
      }
    });
  });
}

function buildValidationStatus(unit: any, chapter: any, sourceUnit: any, rawUnit: any) {
  const originalCandidate = chapter?.source_chapter_name || chapter?.chapter_name || "";
  const sourceType = chapter?.source_type || "explicit_chapter";
  const normalizedStage3ChapterName = normalizeChapterTitle(originalCandidate);
  const normalizedStage3SourceHeading = normalizeChapterTitle(chapter?.source_heading || "");
  const normalizedSourceChapters = uniqueStrings(
    (sourceUnit?.chapters || []).map((item: any) => item?.chapter_name || item?.source_chapter_name || "").filter(Boolean)
  );
  const explicitChapters = normalizedSourceChapters.length ? normalizedSourceChapters : getExplicitChapters(rawUnit);
  const chapterHeadings = getChapterHeadings(rawUnit);
  const explicitChapterLookup = buildNormalizedLookup(explicitChapters);
  const chapterHeadingLookup = buildNormalizedLookup(chapterHeadings);
  const normalizedStage1ChapterNames = explicitChapters.map((name) => normalizeChapterTitle(name));
  const normalizedUnitName = normalizeChapterTitle(unit?.unit_name || "");
  const usesUnitFallbackName = normalizedStage3ChapterName === normalizedUnitName;
  const chapterCandidateType = sourceType === "unit_fallback" ? "unit" : "chapter";
  const stage3Candidates = [normalizedStage3ChapterName, normalizedStage3SourceHeading].filter(Boolean);
  const chapterMatch = stage3Candidates.find((candidate) => explicitChapterLookup.has(candidate)) || "";
  const headingMatch = stage3Candidates.find((candidate) => chapterHeadingLookup.has(candidate)) || "";
  let matchedCandidate = chapterMatch || headingMatch;

  const normalizedFallbackValid =
    sourceType === "unit_fallback" &&
    (
      usesUnitFallbackName ||
      stage3Candidates.includes(normalizedUnitName) ||
      normalizedStage1ChapterNames.includes(normalizedStage3ChapterName) ||
      normalizedStage1ChapterNames.includes(normalizedStage3SourceHeading) ||
      (chapterMatch.length > 0) ||
      (headingMatch.length > 0)
    );

  if (!matchedCandidate && normalizedFallbackValid) {
    matchedCandidate = unit?.unit_name || "";
  }

  const result = matchedCandidate ? "validated" : normalizedFallbackValid ? "normalized" : "not_found";
  console.log(
    `[Validation] ${JSON.stringify({
      stage3: normalizedStage3ChapterName || normalizedStage3SourceHeading,
      stage1Chapters: normalizedStage1ChapterNames,
      stage1Headings: chapterHeadings.map((name) => normalizeChapterTitle(name)),
      chapterMatch: Boolean(chapterMatch),
      headingMatch: Boolean(headingMatch),
      result,
    })}`
  );

  return {
    source_type: sourceType,
    chapter_candidate_type: chapterCandidateType,
    validation_status: result,
    matched_candidate:
      (matchedCandidate && (explicitChapterLookup.get(matchedCandidate) || chapterHeadingLookup.get(matchedCandidate))) ||
      (normalizedFallbackValid ? unit?.unit_name || "" : ""),
    source_snippet:
      (matchedCandidate && (explicitChapterLookup.get(matchedCandidate) || chapterHeadingLookup.get(matchedCandidate))) ||
      chapter?.source_heading ||
      null,
    normalized_fallback_valid: normalizedFallbackValid,
    uses_unit_fallback_name: usesUnitFallbackName,
    stage1_original_chapters: explicitChapters,
    stage1_normalized_chapters: normalizedStage1ChapterNames,
    stage1_original_headings: chapterHeadings,
    stage1_normalized_headings: chapterHeadings.map((name) => normalizeChapterTitle(name)),
    stage3_original_chapter: originalCandidate,
    stage3_normalized_chapter: normalizedStage3ChapterName,
  };
}

async function validateNormalizedStructure(
  requestId: string,
  debugDir: string,
  sourceText: string,
  normalized: any,
  rawExtraction?: any
) {
  const invalidChapters: string[] = [];
  let validatedUnits = 0;
  let validatedChapters = 0;
  const validationLog: any[] = [];

  for (const cls of normalized?.classes || []) {
    const stage3SectionKey = buildSectionKey({
      class_name: cls?.class_name || "",
      subject: cls?.subject || "",
      part_or_section: cls?.part_or_section || "",
    });
    for (const unit of cls?.units || []) {
      validationLog.push({
        entityType: "unit",
        className: cls?.class_name || "",
        extractedName: unit?.unit_name || "",
        normalizedName: normalizeSourceText(unit?.unit_name || ""),
        matched: true,
        skipped: true,
        reason: "unit_level_validation_skipped",
      });
      validatedUnits += 1;

      for (const chapter of unit?.chapters || []) {
        const rawClass = (rawExtraction?.classes || []).find(
          (candidate: any) =>
            buildSectionKey({
              class_name: candidate?.class_name || "",
              subject: candidate?.subject || "",
              part_or_section: candidate?.part_or_section || "",
            }) === stage3SectionKey
        );
        const stage1SectionKey = rawClass
          ? buildSectionKey({
              class_name: rawClass?.class_name || "",
              subject: rawClass?.subject || "",
              part_or_section: rawClass?.part_or_section || "",
            })
          : "";
        if (!rawClass) {
          validationLog.push({
            entityType: "chapter",
            className: cls?.class_name || "",
            subject: cls?.subject || "",
            unitName: unit?.unit_name || "",
            extractedName: chapter?.chapter_name || "",
            sectionKeyStage1: "",
            sectionKeyStage3: stage3SectionKey,
            skipped: true,
            reason: "section_key_mismatch",
          });
          console.log(
            `[Validation][${requestId}] Section key mismatch | Stage1: "" | Stage3: "${stage3SectionKey}" | skipping chapter comparison for "${chapter?.chapter_name || ""}"`
          );
          continue;
        }
        const rawUnit = (rawClass?.units || []).find(
          (candidate: any) => normalizeSourceText(candidate?.unit_name || "") === normalizeSourceText(unit?.unit_name || "")
        );
        const sourceUnit = (cls?.units || []).find(
          (candidate: any) => normalizeSourceText(candidate?.unit_name || "") === normalizeSourceText(unit?.unit_name || "")
        ) || unit;
        const chapterStatus = buildValidationStatus(unit, chapter, sourceUnit, rawUnit || {});
        console.log(
          `[Validation][${requestId}] Source chapters for class "${cls?.class_name || ""}" unit "${unit?.unit_name || ""}": ${JSON.stringify((sourceUnit?.chapters || []).map((item: any) => item?.chapter_name || item?.source_chapter_name || "").filter(Boolean))}`
        );
        console.log(
          `[Validation][${requestId}] Enrichment chapters for class "${cls?.class_name || ""}" unit "${unit?.unit_name || ""}": ${JSON.stringify((unit?.chapters || []).map((item: any) => item?.chapter_name || item?.source_chapter_name || "").filter(Boolean))}`
        );
        if (chapterStatus.chapter_candidate_type === "unit" && chapterStatus.source_type !== "unit_fallback") {
          validationLog.push({
            entityType: "chapter",
            chapterCandidateType: "unit",
            className: cls?.class_name || "",
            subject: cls?.subject || "",
            unitName: unit?.unit_name || "",
            extractedName: chapterStatus.stage3_original_chapter,
            normalizedName: chapterStatus.stage3_normalized_chapter,
            skipped: true,
            reason: "unit_label_not_validated_as_chapter",
            sectionKeyStage1: stage1SectionKey,
            sectionKeyStage3: stage3SectionKey,
          });
          console.log(
            `[Validation][${requestId}] Chapter candidate skipped | chapterCandidateType: unit | Stage3 original: "${chapterStatus.stage3_original_chapter}" | Stage3 normalized: "${chapterStatus.stage3_normalized_chapter}"`
          );
          continue;
        }
        chapter.validation_status = chapterStatus.validation_status;
        chapter.source_text_excerpt = chapter?.source_text_excerpt || chapterStatus.source_snippet || "";
        validationLog.push({
          entityType: "chapter",
          chapterCandidateType: "chapter",
          className: cls?.class_name || "",
          subject: cls?.subject || "",
          unitName: unit?.unit_name || "",
          extractedName: chapter?.chapter_name || "",
          normalizedName: chapterStatus.stage3_normalized_chapter,
          matched: chapterStatus.validation_status !== "not_found",
          matchedCandidate: chapterStatus.matched_candidate,
          snippet: chapterStatus.source_snippet,
          isNormalized: Boolean(chapter?.is_normalized),
          confidence: chapter?.confidence ?? 0,
          sourceType: chapterStatus.source_type,
          validationStatus: chapterStatus.validation_status,
          normalizedFallbackValid: chapterStatus.normalized_fallback_valid,
          usesUnitFallbackName: chapterStatus.uses_unit_fallback_name,
          stage1OriginalChapters: chapterStatus.stage1_original_chapters,
          stage1NormalizedChapters: chapterStatus.stage1_normalized_chapters,
          stage1OriginalHeadings: chapterStatus.stage1_original_headings,
          stage1NormalizedHeadings: chapterStatus.stage1_normalized_headings,
          stage3OriginalChapter: chapterStatus.stage3_original_chapter,
          stage3NormalizedChapter: chapterStatus.stage3_normalized_chapter,
          sectionKeyStage1: stage1SectionKey,
          sectionKeyStage3: stage3SectionKey,
        });
        console.log(
          `[Validation][${requestId}] Chapter compare | sectionKey(Stage1): "${stage1SectionKey}" | sectionKey(Stage3): "${stage3SectionKey}" | sourceType: "${chapterStatus.source_type}" | Stage1 chapters original: ${JSON.stringify(chapterStatus.stage1_original_chapters)} | Stage1 chapters normalized: ${JSON.stringify(chapterStatus.stage1_normalized_chapters)} | Stage1 headings original: ${JSON.stringify(chapterStatus.stage1_original_headings)} | Stage1 headings normalized: ${JSON.stringify(chapterStatus.stage1_normalized_headings)} | Stage3 original: "${chapterStatus.stage3_original_chapter}" | Stage3 normalized: "${chapterStatus.stage3_normalized_chapter}" | result: ${chapterStatus.validation_status}`
        );

        if (chapterStatus.validation_status === "not_found") {
          invalidChapters.push(chapter?.chapter_name || "");
        } else {
          validatedChapters += 1;
        }
      }
    }
  }

  const report = {
    units_validated: validatedUnits,
    chapters_validated: validatedChapters,
    invalid_units: [],
    invalid_chapters: invalidChapters.filter(Boolean),
  };

  normalized.validation_report = {
    ...(normalized.validation_report || {}),
    ...report,
  };

  await writeDebugFile(debugDir, "normalized-validation-log.json", validationLog);
  console.log(`[Validation][${requestId}] Units validated: ${validatedUnits}`);
  console.log(`[Validation][${requestId}] Chapters validated: ${validatedChapters}`);
  console.log(`[Validation][${requestId}] Invalid chapters: ${report.invalid_chapters.join(", ") || "none"}`);

  if (report.invalid_chapters.length) {
    throw new Error(
      `Validation failed. Invalid chapters: ${report.invalid_chapters.join(", ") || "none"}.`
    );
  }

  return report;
}

function computeCurriculumStatistics(normalized: any) {
  const classes = normalized?.classes || [];
  const perClassCounts = classes.map((cls: any) => {
    const units = cls?.units || [];
    const chapters = units
      .flatMap((unit: any) => unit?.chapters || [])
      .filter((chapter: any) => chapter?.validation_status !== "not_found");
    const topics = chapters.flatMap((chapter: any) => chapter?.topics || []);
    return {
      class_name: cls?.class_name || "",
      total_units: units.length,
      total_chapters: chapters.length,
      total_topics: topics.length,
      total_formative_items: (cls?.formative_content_refs || cls?.formative_content || []).length,
      total_excluded_items: (cls?.excluded_content || []).length,
      total_practicals: (cls?.practicals || []).length,
      total_projects: (cls?.projects || []).length,
      total_activities: (cls?.activities || []).length,
      total_assessment_components: Object.keys(cls?.assessment_framework || cls?.assessment_information || {}).length,
    };
  });

  return {
    total_classes: classes.length,
    total_units: perClassCounts.reduce((sum: number, item: any) => sum + item.total_units, 0),
    total_chapters: perClassCounts.reduce((sum: number, item: any) => sum + item.total_chapters, 0),
    total_topics: perClassCounts.reduce((sum: number, item: any) => sum + item.total_topics, 0),
    total_formative_items: perClassCounts.reduce((sum: number, item: any) => sum + item.total_formative_items, 0),
    total_excluded_items: perClassCounts.reduce((sum: number, item: any) => sum + item.total_excluded_items, 0),
    total_practicals: perClassCounts.reduce((sum: number, item: any) => sum + item.total_practicals, 0),
    total_projects: perClassCounts.reduce((sum: number, item: any) => sum + item.total_projects, 0),
    total_activities: perClassCounts.reduce((sum: number, item: any) => sum + item.total_activities, 0),
    total_assessment_components: perClassCounts.reduce((sum: number, item: any) => sum + item.total_assessment_components, 0),
    per_class_counts: perClassCounts,
  };
}

function toNumberOrZero(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getNormalizedStructureFromCurriculum(curriculum: any) {
  if (!curriculum) return null;
  const directNormalized =
    curriculum?.stagedExtraction?.normalizedStructure ||
    curriculum?.normalizedStructure ||
    (Array.isArray(curriculum?.classes) && curriculum?.document_metadata ? curriculum : null) ||
    (Array.isArray(curriculum?.classes) ? curriculum : null);

  if (directNormalized?.classes?.length) {
    return directNormalized;
  }

  if (Array.isArray(curriculum?.units) && curriculum.units.length) {
    return {
      document_metadata: {
        subject: curriculum?.subject || "",
        grade: curriculum?.gradeLevel || "",
      },
      classes: [{
        class_name: curriculum?.gradeLevel || "",
        subject: curriculum?.subject || "",
        part_or_section: "",
        units: curriculum.units.map((unit: any, index: number) => ({
          unit_id: unit?.unitId || `U${index + 1}`,
          unit_name: unit?.unitName || `Unit ${index + 1}`,
          marks: null,
          topics: uniqueStrings(unit?.topics || []),
          subtopics: [],
          key_concepts: [],
          chapters: [],
          teaching_blocks: [{
            block_id: `${unit?.unitId || `U${index + 1}`}::TB1`,
            block_name: unit?.unitName || `Unit ${index + 1}`,
            block_type: "unit",
            topics: uniqueStrings(unit?.topics || []),
            estimated_sessions: Math.max(1, Math.ceil((unit?.topics || []).length / 3)),
            marks: null,
            difficulty: null,
          }],
        })),
      }],
      validation_report: {
        fallback_generated_from_summary_units: true,
      },
    };
  }

  return null;
}

function buildCurriculumSnapshot(curriculum: any) {
  return {
    subject: curriculum?.subject || "",
    gradeLevel: curriculum?.gradeLevel || "",
    overallDescription: curriculum?.overallDescription || "",
    units: Array.isArray(curriculum?.units) ? curriculum.units : [],
    documentMetadata:
      curriculum?.document_metadata ||
      curriculum?.normalizedStructure?.document_metadata ||
      curriculum?.stagedExtraction?.normalizedStructure?.document_metadata ||
      {},
    normalizedStructure: getNormalizedStructureFromCurriculum(curriculum),
  };
}

function createDefaultPlanningWorkspacePayload(curriculumId: string, curriculum: any) {
  return {
    curriculumId,
    phase: "curriculum_setup",
    status: "draft",
    curriculumSnapshot: buildCurriculumSnapshot(curriculum),
    curriculumApproval: {
      approved: false,
      approvedAt: null,
      notes: "",
      confidence: curriculum?.structure_confidence ?? curriculum?.profile_confidence ?? null,
    },
    academicConfig: {},
    termPlan: {
      approved: false,
      recommendedTermCount: null,
      recommendations: [],
      allocations: [],
    },
    teachingStrategy: {},
    sessionPlanningDefaults: {},
    sessionAllocation: {
      approved: false,
      approvedAt: null,
      selectedTermKey: "",
      selectedTermSummary: null,
      recommendations: [],
      allocations: [],
      validation: {
        valid: false,
        issues: [],
        annualCapacity: null,
        termCapacity: null,
        allocatedSessions: null,
      },
    },
    generationScope: {},
    generatedArtifacts: [],
    revisionState: {
      history: [],
    },
  };
}

async function ensurePlanningWorkspaceForCurriculum(curriculumId: string, curriculum: any) {
  await connectToMongo();
  const existingWorkspace = await PlanningWorkspaceModel.findOne({ curriculumId })
    .sort({ updatedAt: -1 });

  if (existingWorkspace) {
    existingWorkspace.curriculumSnapshot = buildCurriculumSnapshot(curriculum);
    if (existingWorkspace.curriculumApproval?.confidence == null) {
      existingWorkspace.curriculumApproval = {
        ...(existingWorkspace.curriculumApproval || {}),
        confidence: curriculum?.structure_confidence ?? curriculum?.profile_confidence ?? null,
      };
    }
    await existingWorkspace.save();
    return existingWorkspace;
  }

  return PlanningWorkspaceModel.create(
    createDefaultPlanningWorkspacePayload(curriculumId, curriculum)
  );
}

function buildWorkspaceStateAfterCurriculumChange(curriculum: any) {
  return {
    phase: "curriculum_setup",
    status: "draft",
    curriculumSnapshot: buildCurriculumSnapshot(curriculum),
    curriculumApproval: {
      approved: false,
      approvedAt: null,
      notes: "",
      confidence: curriculum?.structure_confidence ?? curriculum?.profile_confidence ?? null,
    },
    termPlan: {
      approved: false,
      recommendedTermCount: null,
      recommendations: [],
      allocations: [],
    },
    teachingStrategy: {},
    sessionPlanningDefaults: {},
    sessionAllocation: {
      approved: false,
      approvedAt: null,
      selectedTermKey: "",
      selectedTermSummary: null,
      recommendations: [],
      allocations: [],
      validation: {
        valid: false,
        issues: [],
        annualCapacity: null,
        termCapacity: null,
        allocatedSessions: null,
      },
    },
    generationScope: {},
    generatedArtifacts: [],
    revisionState: {
      history: [],
    },
  };
}

async function syncPlanningWorkspaceAfterCurriculumChange(curriculumId: string, curriculum: any) {
  await connectToMongo();
  const workspace = await PlanningWorkspaceModel.findOne({ curriculumId })
    .sort({ updatedAt: -1 });

  if (!workspace) {
    return PlanningWorkspaceModel.create(
      createDefaultPlanningWorkspacePayload(curriculumId, curriculum)
    );
  }

  const nextState = buildWorkspaceStateAfterCurriculumChange(curriculum);
  workspace.phase = nextState.phase;
  workspace.status = nextState.status;
  workspace.curriculumSnapshot = nextState.curriculumSnapshot;
  workspace.curriculumApproval = nextState.curriculumApproval;
  workspace.termPlan = nextState.termPlan;
  workspace.teachingStrategy = nextState.teachingStrategy;
  workspace.sessionPlanningDefaults = nextState.sessionPlanningDefaults;
  workspace.sessionAllocation = nextState.sessionAllocation;
  workspace.generationScope = nextState.generationScope;
  workspace.generatedArtifacts = nextState.generatedArtifacts;
  workspace.revisionState = nextState.revisionState;
  await workspace.save();
  return workspace;
}

async function loadCurriculumRecordById(curriculumId: string) {
  await connectToMongo();
  return CurriculumModel.findOne({ _id: curriculumId }).lean();
}

async function loadPlanningWorkspaceById(workspaceId: string) {
  await connectToMongo();
  return PlanningWorkspaceModel.findOne({ _id: workspaceId });
}

function detectTeachingBlocks(normalizedStructure: any) {
  const classes = normalizedStructure?.classes || [];
  const detected = classes.map((cls: any) => {
    const classScope = [
      normalizeSourceText(cls?.class_name || ""),
      normalizeSourceText(cls?.subject || ""),
      normalizeSourceText(cls?.part_or_section || ""),
    ].join("::") || "class-scope";
    const units = cls?.units || [];
    const classTeachingBlocks = units.flatMap((unit: any) => {
      const chapters = Array.isArray(unit?.chapters) ? unit.chapters : [];
      if (chapters.length) {
        const numericUnitMarks = unit?.marks == null ? null : Number(unit.marks);
        const validUnitMarks = Number.isFinite(numericUnitMarks) ? numericUnitMarks : null;
        const perChapterFallbackMarks = validUnitMarks != null ? validUnitMarks / chapters.length : null;
        return [{
          unit_id: unit?.unit_id || "",
          unit_name: unit?.unit_name || "",
          teaching_blocks: chapters.map((chapter: any, chapterIndex: number) => ({
            block_id: `${classScope}::${unit?.unit_id || "U"}::${chapter?.chapter_id || `C${chapterIndex + 1}`}`,
            block_name: chapter?.chapter_name || chapter?.source_chapter_name || `Chapter ${chapterIndex + 1}`,
            block_type: "chapter",
            topics: uniqueStrings([
              ...(chapter?.topics || []),
              ...(chapter?.subtopics || []),
              ...(chapter?.key_concepts || []),
            ]),
            estimated_sessions:
              toNumberOrZero(chapter?.estimated_sessions) ||
              Math.max(1, Math.ceil(uniqueStrings([
                ...(chapter?.topics || []),
                ...(chapter?.subtopics || []),
                ...(chapter?.key_concepts || []),
              ]).length / 3)),
            marks: chapter?.marks ?? perChapterFallbackMarks,
            difficulty: chapter?.difficulty ?? null,
          })),
        }];
      }

      const directTeachingBlocks = Array.isArray(unit?.teaching_blocks) && unit.teaching_blocks.length
        ? unit.teaching_blocks.map((block: any, blockIndex: number) => {
            const numericUnitMarks = unit?.marks == null ? null : Number(unit.marks);
            const validUnitMarks = Number.isFinite(numericUnitMarks) ? numericUnitMarks : null;
            const perBlockFallbackMarks = validUnitMarks != null ? validUnitMarks / unit.teaching_blocks.length : null;
            return ({
            block_id: block?.block_id || `${classScope}::${unit?.unit_id || "U"}::TB${blockIndex + 1}`,
            block_name: block?.block_name || block?.title || `Teaching Block ${blockIndex + 1}`,
            block_type: "teaching_block",
            topics: uniqueStrings(block?.topics || []),
            estimated_sessions: toNumberOrZero(block?.estimated_sessions),
            marks: block?.marks ?? perBlockFallbackMarks,
            difficulty: block?.difficulty ?? null,
          });
        })
        : [];

      if (directTeachingBlocks.length) {
        return [{
          unit_id: unit?.unit_id || "",
          unit_name: unit?.unit_name || "",
          teaching_blocks: directTeachingBlocks,
        }];
      }

      return [{
        unit_id: unit?.unit_id || "",
        unit_name: unit?.unit_name || "",
        teaching_blocks: [{
          block_id: `${classScope}::${unit?.unit_id || "U"}`,
          block_name: unit?.unit_name || "Unit",
          block_type: "unit",
          topics: uniqueStrings([
            ...(unit?.topics || []),
            ...(unit?.subtopics || []),
            ...(unit?.key_concepts || []),
          ]),
          estimated_sessions:
            toNumberOrZero(unit?.estimated_sessions) ||
            Math.max(1, Math.ceil(uniqueStrings([
              ...(unit?.topics || []),
              ...(unit?.subtopics || []),
              ...(unit?.key_concepts || []),
            ]).length / 3)),
          marks: unit?.marks ?? null,
          difficulty: unit?.difficulty ?? null,
        }],
      }];
    });

    return {
      class_name: cls?.class_name || "",
      subject: cls?.subject || "",
      units: classTeachingBlocks,
    };
  });

  const flatBlocks = detected.flatMap((cls: any) =>
    (cls.units || []).flatMap((unit: any) =>
      (unit.teaching_blocks || []).map((block: any, index: number) => ({
        sequence: index,
        class_name: cls.class_name,
        subject: cls.subject,
        unit_id: unit.unit_id,
        unit_name: unit.unit_name,
        ...block,
      }))
    )
  );

  return {
    classes: detected,
    flatBlocks,
  };
}

function determineTermCount(totalTeachingBlocks: number, preferredTermCount?: number) {
  if (preferredTermCount && preferredTermCount >= 1 && preferredTermCount <= 4) {
    return { termCount: preferredTermCount, method: "preferred" as const };
  }
  if (totalTeachingBlocks <= 10) return { termCount: 1, method: "automatic" as const };
  if (totalTeachingBlocks <= 20) return { termCount: 2, method: "automatic" as const };
  if (totalTeachingBlocks <= 30) return { termCount: 3, method: "automatic" as const };
  return { termCount: 4, method: "automatic" as const };
}

function buildTermDivision(normalizedStructure: any, preferredTermCount?: number) {
  const detected = detectTeachingBlocks(normalizedStructure);
  const flatBlocks = detected.flatBlocks.map((block: any, index: number) => ({ ...block, sequence: index }));
  const totalBlocks = flatBlocks.length;
  const totalTopics = flatBlocks.reduce((sum: number, block: any) => sum + (block.topics?.length || 0), 0);
  const totalEstimatedSessions = flatBlocks.reduce((sum: number, block: any) => sum + toNumberOrZero(block.estimated_sessions), 0);
  const totalUnits = detected.classes.reduce((sum: number, cls: any) => sum + (cls.units?.length || 0), 0);
  const totalSourceMarks = (normalizedStructure?.classes || []).reduce((classSum: number, cls: any) => {
    return classSum + (cls?.units || []).reduce((unitSum: number, unit: any) => {
      const numericUnitMarks = unit?.marks == null ? null : Number(unit.marks);
      if (Number.isFinite(numericUnitMarks)) {
        return unitSum + Number(numericUnitMarks);
      }
      const chapterMarks = (unit?.chapters || []).reduce((chapterSum: number, chapter: any) => {
        const numericChapterMarks = chapter?.marks == null ? null : Number(chapter.marks);
        return chapterSum + (Number.isFinite(numericChapterMarks) ? Number(numericChapterMarks) : 0);
      }, 0);
      return unitSum + chapterMarks;
    }, 0);
  }, 0);
  const determination = determineTermCount(totalBlocks, preferredTermCount);
  const termCount = determination.termCount;
  const targetWeight = Math.max(
    1,
    flatBlocks.reduce((sum: number, block: any) => {
      const marksWeight = block.marks == null ? 0 : Math.max(0, Number(block.marks) || 0);
      const topicWeight = block.topics?.length || 0;
      const sessionWeight = toNumberOrZero(block.estimated_sessions);
      const difficultyWeight = block.difficulty === "high" ? 3 : block.difficulty === "medium" ? 2 : block.difficulty === "low" ? 1 : 0;
      return sum + Math.max(1, topicWeight + sessionWeight + marksWeight + difficultyWeight);
    }, 0) / termCount
  );

  const terms: any[] = [];
  let currentBlocks: any[] = [];
  let currentWeight = 0;

  flatBlocks.forEach((block: any, index: number) => {
    const remainingBlocks = flatBlocks.length - index;
    const remainingTerms = termCount - terms.length;
    const blockWeight = Math.max(
      1,
      (block.topics?.length || 0) +
      toNumberOrZero(block.estimated_sessions) +
      (block.marks == null ? 0 : Number(block.marks) || 0) +
      (block.difficulty === "high" ? 3 : block.difficulty === "medium" ? 2 : block.difficulty === "low" ? 1 : 0)
    );
    const mustReserveBlocksForRemainingTerms =
      terms.length < termCount - 1 &&
      currentBlocks.length > 0 &&
      remainingBlocks === remainingTerms;
    const mustStartNewTerm =
      mustReserveBlocksForRemainingTerms ||
      terms.length < termCount - 1 &&
      currentBlocks.length > 0 &&
      currentWeight + blockWeight > targetWeight &&
      remainingBlocks >= remainingTerms;

    if (mustStartNewTerm) {
      terms.push(currentBlocks);
      currentBlocks = [];
      currentWeight = 0;
    }

    currentBlocks.push(block);
    currentWeight += blockWeight;
  });

  if (currentBlocks.length) {
    terms.push(currentBlocks);
  }

  while (terms.length < termCount) {
    terms.push([]);
  }

  const normalizedTerms = terms.map((blocks: any[], termIndex: number) => {
    const groupedUnits = new Map<string, any>();
    blocks.forEach((block) => {
      const key = `${block.class_name}::${block.subject}::${block.unit_id}`;
      if (!groupedUnits.has(key)) {
        groupedUnits.set(key, {
          unit_id: block.unit_id,
          unit_name: block.unit_name,
          teaching_blocks: [],
        });
      }
      groupedUnits.get(key).teaching_blocks.push({
        block_id: block.block_id,
        block_name: block.block_name,
        block_type: block.block_type,
        topics: block.topics || [],
        estimated_sessions: toNumberOrZero(block.estimated_sessions),
        marks: block.marks ?? null,
        difficulty: block.difficulty ?? null,
      });
    });
    const unitItems = [...groupedUnits.values()];
    const termTopics = unitItems.reduce(
      (sum: number, unit: any) => sum + unit.teaching_blocks.reduce((inner: number, tb: any) => inner + (tb.topics?.length || 0), 0),
      0
    );
    const termSessions = unitItems.reduce(
      (sum: number, unit: any) => sum + unit.teaching_blocks.reduce((inner: number, tb: any) => inner + toNumberOrZero(tb.estimated_sessions), 0),
      0
    );
    const termBlocks = unitItems.reduce((sum: number, unit: any) => sum + (unit.teaching_blocks?.length || 0), 0);
    return {
      term_number: termIndex + 1,
      term_name: `Term ${termIndex + 1}`,
      items: unitItems,
      total_units: unitItems.length,
      total_teaching_blocks: termBlocks,
      total_topics: termTopics,
      estimated_sessions: termSessions,
      coverage_percentage: totalBlocks ? (termBlocks / totalBlocks) * 100 : 0,
    };
  });

  if (normalizedTerms.length && totalBlocks > 0) {
    const priorCoverage = normalizedTerms
      .slice(0, -1)
      .reduce((sum: number, term: any) => sum + term.coverage_percentage, 0);
    normalizedTerms[normalizedTerms.length - 1].coverage_percentage = Math.max(0, 100 - priorCoverage);
  }

  const originalBlockIds = flatBlocks.map((block: any) => block.block_id);
  const termBlockIds = normalizedTerms.flatMap((term) =>
    term.items.flatMap((item: any) => item.teaching_blocks.map((block: any) => block.block_id))
  );
  const duplicateIds = termBlockIds.filter((id: string, index: number) => termBlockIds.indexOf(id) !== index);
  const missingIds = originalBlockIds.filter((id: string) => !termBlockIds.includes(id));
  const extraIds = termBlockIds.filter((id: string) => !originalBlockIds.includes(id));
  const coverageTotal = Number(
    normalizedTerms.reduce((sum: number, term: any) => sum + term.coverage_percentage, 0).toFixed(6)
  );
  const validationErrors: string[] = [];

  if (missingIds.length) validationErrors.push(`Missing teaching blocks: ${missingIds.join(", ")}`);
  if (duplicateIds.length) validationErrors.push(`Duplicate teaching blocks: ${uniqueStrings(duplicateIds).join(", ")}`);
  if (extraIds.length) validationErrors.push(`New teaching blocks created: ${uniqueStrings(extraIds).join(", ")}`);
  if (termCount < 1 || termCount > 4) validationErrors.push(`Term count ${termCount} is outside the allowed range 1-4.`);
  if (Math.abs(coverageTotal - 100) > 0.0001 && totalBlocks > 0) validationErrors.push(`Coverage total must equal 100, received ${coverageTotal}.`);
  if (termCount > 1 && normalizedTerms.some((term: any) => term.total_teaching_blocks === 0)) {
    validationErrors.push("Term distribution is invalid because one or more generated terms are empty.");
  }

  normalizedTerms.forEach((term: any) => {
    term.coverage_percentage = Number(term.coverage_percentage.toFixed(2));
  });

  return {
    term_count: termCount,
    term_determination_method: determination.method,
    statistics: {
      total_units: totalUnits,
      total_teaching_blocks: totalBlocks,
      total_topics: totalTopics,
      total_estimated_sessions: totalEstimatedSessions,
      total_marks: Number(totalSourceMarks.toFixed(2)),
    },
    terms: normalizedTerms,
    validation: {
      all_units_preserved: missingIds.length === 0,
      all_teaching_blocks_preserved: missingIds.length === 0,
      no_duplicate_teaching_blocks: duplicateIds.length === 0,
      no_new_content_created: extraIds.length === 0,
      coverage_total: coverageTotal,
      valid: validationErrors.length === 0,
      errors: validationErrors,
    },
  };
}

function flattenTermDivisionToRows(termDivision: any) {
  return (termDivision?.terms || []).flatMap((term: any) =>
    (term.items || []).map((item: any) => ({
      id: `${term.term_number}-${item.unit_id}`,
      className: termDivision?.class_name || "",
      termNumber: term.term_number,
      term: term.term_name,
      unitId: item.unit_id,
      unitName: item.unit_name,
      chapters: (item.teaching_blocks || []).map((block: any) => block.block_name),
      marks: Number((item.teaching_blocks || []).reduce((sum: number, block: any) => sum + toNumberOrZero(block.marks), 0).toFixed(2)),
      sourceEstimatedSessions: (item.teaching_blocks || []).reduce(
        (sum: number, block: any) => sum + toNumberOrZero(block.estimated_sessions),
        0
      ),
      sourceTopicCount: (item.teaching_blocks || []).reduce(
        (sum: number, block: any) => sum + ((block.topics || []).length || 0),
        0
      ),
      termEstimatedSessions: toNumberOrZero(term.estimated_sessions),
    }))
  );
}

function estimateSessionBudgetFromAcademicConfig(academicConfig: any, termCount: number) {
  const weeklyPeriods = Math.max(1, toNumberOrZero(academicConfig?.weeklyPeriods) || 5);
  const labPeriods = Math.max(0, toNumberOrZero(academicConfig?.labPeriods));
  const workingDays = Math.max(0, toNumberOrZero(academicConfig?.calendar?.workingDays));
  const revisionWeeks = Math.max(0, toNumberOrZero(academicConfig?.calendar?.revisionWeeks));
  const bufferWeeks = Math.max(0, toNumberOrZero(academicConfig?.calendar?.bufferWeeks));
  const workingWeeks = workingDays > 0 ? workingDays / 5 : 40;
  const usableWeeks = Math.max(1, workingWeeks - revisionWeeks - bufferWeeks);
  // Phase 2 course planning should estimate regular teaching periods.
  // Lab periods can be planned separately later and should not inflate
  // the core chapter-session totals by default.
  const weeklySessionBudget = weeklyPeriods;
  const yearlySessionBudget = Math.max(termCount, Math.round(usableWeeks * weeklySessionBudget));
  const perTermSessionBudget = Math.max(1, Math.round(yearlySessionBudget / Math.max(1, termCount)));

  return {
    weeklyPeriods,
    labPeriods,
    workingDays,
    workingWeeks,
    usableWeeks,
    weeklySessionBudget,
    yearlySessionBudget,
    perTermSessionBudget,
  };
}

function getSchoolDaysPerWeek(_: any) {
  return 5;
}

function estimateAnnualSubjectSessionCapacity(academicConfig: any) {
  const weeklyPeriods = Math.max(1, toNumberOrZero(academicConfig?.weeklyPeriods) || 5);
  const workingDays = Math.max(0, toNumberOrZero(academicConfig?.calendar?.workingDays));
  const schoolDaysPerWeek = getSchoolDaysPerWeek(academicConfig);
  const annualSubjectSessions = Math.max(
    1,
    Math.round(
      (workingDays > 0 ? workingDays : schoolDaysPerWeek * 40) / schoolDaysPerWeek * weeklyPeriods
    )
  );

  return {
    weeklyPeriods,
    workingDays,
    schoolDaysPerWeek,
    annualSubjectSessions,
  };
}

function buildTermAllocationKey(term: {
  className?: string;
  termName?: string;
  termNumber?: number | null;
  term?: string;
}) {
  return `${term.className || "Curriculum"}::${term.termName || term.term || ""}::${term.termNumber ?? ""}`;
}

function buildSavedTermGroups(allocations: any[] = []) {
  const groups = new Map<string, any[]>();
  allocations.forEach((allocation) => {
    const key = buildTermAllocationKey(allocation);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(allocation);
  });
  return groups;
}

function findNormalizedChapterInsight(normalizedStructure: any, chapterName: string) {
  const target = normalizeSourceText(chapterName || "");
  if (!target) {
    return {
      topicCount: 0,
      estimatedSessions: 0,
    };
  }

  const classes = Array.isArray(normalizedStructure?.classes) ? normalizedStructure.classes : [];
  for (const cls of classes) {
    const units = Array.isArray(cls?.units) ? cls.units : [];
    for (const unit of units) {
      const chapters = Array.isArray(unit?.chapters) ? unit.chapters : [];
      for (const chapter of chapters) {
        const candidateNames = [
          chapter?.chapter_name,
          chapter?.source_chapter_name,
          chapter?.title,
        ].map((value) => normalizeSourceText(String(value || "")));
        if (candidateNames.includes(target)) {
          const topicCount = uniqueStrings([
            ...(chapter?.topics || []),
            ...(chapter?.subtopics || []),
            ...(chapter?.key_concepts || []),
          ]).length;
          return {
            topicCount,
            estimatedSessions: toNumberOrZero(chapter?.estimated_sessions),
          };
        }
      }
    }
  }

  return {
    topicCount: 0,
    estimatedSessions: 0,
  };
}

function distributeIntegerSessions(totalSessions: number, weights: number[]) {
  if (weights.length === 0) return [];
  const safeTotal = Math.max(weights.length, totalSessions);
  const totalWeight = Math.max(1, weights.reduce((sum, weight) => sum + Math.max(0, weight), 0));
  const exactShares = weights.map((weight) => (safeTotal * Math.max(0, weight)) / totalWeight);
  const base = exactShares.map((share) => Math.max(1, Math.floor(share)));
  let assigned = base.reduce((sum, value) => sum + value, 0);

  if (assigned < safeTotal) {
    const remainders = exactShares
      .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
      .sort((a, b) => b.remainder - a.remainder);
    let cursor = 0;
    while (assigned < safeTotal) {
      base[remainders[cursor % remainders.length].index] += 1;
      assigned += 1;
      cursor += 1;
    }
  }

  if (assigned > safeTotal) {
    const candidates = exactShares
      .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
      .sort((a, b) => a.remainder - b.remainder);
    let cursor = 0;
    while (assigned > safeTotal && candidates.length > 0) {
      const targetIndex = candidates[cursor % candidates.length].index;
      if (base[targetIndex] > 1) {
        base[targetIndex] -= 1;
        assigned -= 1;
      }
      cursor += 1;
      if (cursor > candidates.length * 4) {
        break;
      }
    }
  }

  return base;
}

function buildPhase3StrategySaved(strategy: any, defaults: any) {
  return Boolean(
    (Array.isArray(strategy?.teachingStyle) && strategy.teachingStyle.length > 0) ||
    strategy?.studentLevel ||
    strategy?.pace ||
    strategy?.targetDifficulty ||
    toNumberOrZero(defaults?.sessionDurationMinutes)
  );
}

function validateSessionAllocationState(workspace: any, overrides?: {
  selectedTermSummary?: any;
  allocations?: any[];
}) {
  const issues: string[] = [];
  const allocations = Array.isArray(overrides?.allocations)
    ? overrides!.allocations
    : Array.isArray(workspace?.sessionAllocation?.allocations)
      ? workspace.sessionAllocation.allocations
      : [];
  const selectedTermSummary = overrides?.selectedTermSummary || workspace?.sessionAllocation?.selectedTermSummary;
  const annualCapacity = estimateAnnualSubjectSessionCapacity(workspace?.academicConfig || {}).annualSubjectSessions;
  const totalPlanMarks = (workspace?.termPlan?.allocations || []).reduce(
    (sum: number, allocation: any) => sum + toNumberOrZero(allocation?.marks),
    0
  );
  const uniqueTerms = buildSavedTermGroups(workspace?.termPlan?.allocations || []);
  const fallbackTermCapacity = Math.max(1, Math.round(annualCapacity / Math.max(1, uniqueTerms.size || 1)));
  const weightedCapacity = selectedTermSummary?.marks && totalPlanMarks > 0
    ? Math.max(1, Math.round(annualCapacity * (toNumberOrZero(selectedTermSummary.marks) / totalPlanMarks)))
    : fallbackTermCapacity;
  const termCapacity = Math.min(annualCapacity, weightedCapacity);

  if (!workspace?.termPlan?.approved) {
    issues.push("Phase 2 course plan must be approved before Phase 3 can be approved.");
  }
  if (!buildPhase3StrategySaved(workspace?.teachingStrategy || {}, workspace?.sessionPlanningDefaults || {})) {
    issues.push("Save the session planning strategy before approving the session allocation.");
  }
  if (!selectedTermSummary) {
    issues.push("Choose an approved term before generating or approving session allocations.");
  }
  if (allocations.length === 0) {
    issues.push("Generate or save at least one chapter session allocation.");
  }

  const allocatedSessions = allocations.reduce(
    (sum: number, allocation: any) => sum + Math.max(0, toNumberOrZero(allocation?.estimatedSessions)),
    0
  );

  allocations.forEach((allocation: any, index: number) => {
    if (!String(allocation?.chapterName || "").trim()) {
      issues.push(`Allocation row ${index + 1} is missing a chapter name.`);
    }
    if (toNumberOrZero(allocation?.estimatedSessions) <= 0) {
      issues.push(`${allocation?.chapterName || `Allocation row ${index + 1}`} must have at least 1 session.`);
    }
  });

  if (allocatedSessions > termCapacity) {
    issues.push(`Allocated sessions (${allocatedSessions}) exceed the selected term capacity (${termCapacity}).`);
  }

  return {
    valid: issues.length === 0,
    issues,
    annualCapacity,
    termCapacity,
    allocatedSessions,
  };
}

function estimateRecommendedAllocationSessions(recommendations: any[], academicConfig: any, termCount: number) {
  const budget = estimateSessionBudgetFromAcademicConfig(academicConfig, termCount);
  const groups = new Map<string, any[]>();

  for (const row of recommendations) {
    const groupKey = `${row.className || ""}::${row.termNumber ?? ""}::${row.term || ""}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)?.push(row);
  }

  return recommendations.map((row) => {
    const groupKey = `${row.className || ""}::${row.termNumber ?? ""}::${row.term || ""}`;
    const termRows = groups.get(groupKey) || [row];
    const rowWeight = Math.max(
      1,
      toNumberOrZero(row.sourceEstimatedSessions) +
      toNumberOrZero(row.sourceTopicCount) +
      ((row.chapters || []).length * 2) +
      (toNumberOrZero(row.marks) / 2)
    );
    const termWeight = Math.max(
      1,
      termRows.reduce((sum: number, termRow: any) => {
        return sum + Math.max(
          1,
          toNumberOrZero(termRow.sourceEstimatedSessions) +
          toNumberOrZero(termRow.sourceTopicCount) +
          ((termRow.chapters || []).length * 2) +
          (toNumberOrZero(termRow.marks) / 2)
        );
      }, 0)
    );
    const estimatedSessions = Math.max(
      1,
      Math.round(budget.perTermSessionBudget * (rowWeight / termWeight))
    );

    return {
      ...row,
      estimatedSessions,
      estimationBasis: {
        perTermSessionBudget: budget.perTermSessionBudget,
        yearlySessionBudget: budget.yearlySessionBudget,
        weeklyPeriods: budget.weeklyPeriods,
        labPeriods: budget.labPeriods,
        usableWeeks: Number(budget.usableWeeks.toFixed(2)),
      },
    };
  });
}

function buildNormalizedTeachingBlocks(
  approvedClasses: any[],
  structureClasses: any[],
  enrichedClassMap: Map<string, any>,
  curriculumUnits: any[] = [],
  curriculumChapters: any[] = []
) {
  return approvedClasses.map((rawClass: any, classIndex: number) => {
    const classKey = buildCanonicalClassKey(rawClass?.class_name || "");
    const enrichedResult = enrichedClassMap.get(classKey);
    const structureClass = structureClasses[classIndex] || {};
    const normalizedClassName = canonicalizeClassName(rawClass?.class_name || enrichedResult?.class_name || "");
    if (!enrichedResult) {
      console.error(
        `[Normalization] Missing enrichment for raw class key "${classKey}" | raw class name: "${rawClass?.class_name || ""}" | available enrichment keys: ${JSON.stringify([...enrichedClassMap.keys()])}`
      );
      throw new Error(`Missing enrichment result for class "${rawClass?.class_name || classIndex + 1}".`);
    }
    const approvedUnits = rawClass?.units || [];
    const approvedUnitById = new Map(
      approvedUnits
        .map((unit: any): [string, any] => [canonicalUnitId(unit?.unit_id || ""), unit])
        .filter(([key]: [string, any]) => Boolean(key))
    );
    const approvedUnitByKey = new Map(
      approvedUnits
        .map((unit: any): [string, any] => [canonicalUnitKey(unit?.unit_name || ""), unit])
        .filter(([key]: [string, any]) => Boolean(key))
    );
    const approvedUnitByStructuralKey = new Map(
      approvedUnits
        .map((unit: any): [string, any] => [buildUnitStructuralKey({
          class_name: rawClass?.class_name || "",
          subject: rawClass?.subject || "",
          part_or_section: unit?.part_or_section || rawClass?.part_or_section || "",
          unit_name: unit?.unit_name || "",
        }), unit])
        .filter(([key]: [string, any]) => Boolean(key))
    );
    const allEnrichedUnits = Array.isArray(enrichedResult?.units)
      ? enrichedResult.units
      : Array.isArray(enrichedResult?.curriculum?.units)
        ? enrichedResult.curriculum.units
        : Array.isArray(enrichedResult?.data?.units)
          ? enrichedResult.data.units
          : [];
    console.log("[Normalization] enrichment keys", Object.keys(enrichedResult || {}));
    console.log("[Normalization] enriched units length", allEnrichedUnits.length);
    const expectedUnitKeysFromUnits = approvedUnits.map((unit: any) => canonicalUnitKey(unit?.unit_name || "")).filter(Boolean);
    const expectedUnitKeysFromChapters = approvedUnits
      .flatMap((unit: any) => (unit?.chapters || []).map((chapter: any) => canonicalUnitKey(chapter?.source_chapter_name || chapter?.chapter_name || "")))
      .filter(Boolean);
    const expectedUnitKeys = expectedUnitKeysFromUnits;
    const expectedUnitIds = approvedUnits.map((unit: any) => canonicalUnitId(unit?.unit_id || "")).filter(Boolean);
    const expectedChapterCount = approvedUnits.reduce((sum: number, unit: any) => sum + ((unit?.chapters || []).length || 0), 0);
    const sourceUnitById = Object.fromEntries(
      approvedUnits
        .map((unit: any): [string, any] => [canonicalUnitId(unit?.unit_id || ""), unit])
        .filter(([key]: [string, any]) => Boolean(key))
    ) as Record<string, any>;
    const preparedEnrichedUnits = allEnrichedUnits.map((unit: any) => ensureUnitHasFallbackChapter(unit));
    const stage3TheoryCandidates = preparedEnrichedUnits.filter((unit: any) => !isStrongExplicitNonTheoryUnit(unit) && (unit?.chapters || []).length > 0);
    const stage3TheoryCandidateCount = stage3TheoryCandidates.length;
    const stage3TheoryChapterCount = stage3TheoryCandidates.reduce((sum: number, unit: any) => sum + ((unit?.chapters || []).length || 0), 0);
    const expectedUnitsClearlyIncomplete =
      expectedUnitIds.length === 0 ||
      (approvedUnits.length === 0 && stage3TheoryCandidateCount > 0) ||
      (expectedChapterCount === 0 && stage3TheoryChapterCount > 0);
    const recoveredFromStage3Fallback = expectedUnitsClearlyIncomplete && stage3TheoryCandidateCount > 0;
    const enrichedUnits = preparedEnrichedUnits.filter((unit: any) => {
      if (isStrongExplicitNonTheoryUnit(unit)) {
        return false;
      }
      if (recoveredFromStage3Fallback) {
        return true;
      }
      const candidateUnitId = canonicalUnitId(unit?.unit_id || "");
      const candidateStructuralKey = buildUnitStructuralKey({
        class_name: rawClass?.class_name || "",
        subject: rawClass?.subject || "",
        part_or_section: unit?.part_or_section || rawClass?.part_or_section || "",
        unit_name: unit?.unit_name || unit?.chapters?.[0]?.source_chapter_name || "",
      });
      const sourceUnit =
        approvedUnitByStructuralKey.get(candidateStructuralKey) ||
        sourceUnitById[candidateUnitId] ||
        approvedUnitByKey.get(canonicalUnitKey(unit?.unit_name || unit?.chapters?.[0]?.source_chapter_name || ""));
      return Boolean(sourceUnit);
    });
    const enrichedUnitMap = new Map<string, any>();
    for (const unit of enrichedUnits) {
      if (recoveredFromStage3Fallback) {
        const fallbackUnitId = canonicalUnitId(unit?.unit_id || unit?.unit_name || "");
        if (fallbackUnitId) {
          enrichedUnitMap.set(fallbackUnitId, unit);
        }
        continue;
      }
      const candidateUnitId = canonicalUnitId(unit?.unit_id || "");
      const candidateStructuralKey = buildUnitStructuralKey({
        class_name: rawClass?.class_name || "",
        subject: rawClass?.subject || "",
        part_or_section: unit?.part_or_section || rawClass?.part_or_section || "",
        unit_name: unit?.unit_name || unit?.chapters?.[0]?.source_chapter_name || "",
      });
      const sourceUnit =
        approvedUnitByStructuralKey.get(candidateStructuralKey) ||
        sourceUnitById[candidateUnitId] ||
        approvedUnitByKey.get(canonicalUnitKey(unit?.unit_name || unit?.chapters?.[0]?.source_chapter_name || ""));
      if (!sourceUnit) {
        continue;
      }
      enrichedUnitMap.set(canonicalUnitId(sourceUnit?.unit_id || ""), unit);
    }
    const divertedUnits = preparedEnrichedUnits.filter((unit: any) => !enrichedUnits.includes(unit));
    const outputUnitKeys = approvedUnits
      .filter((unit: any) => enrichedUnitMap.has(canonicalUnitId(unit?.unit_id || "")))
      .map((unit: any) => canonicalUnitKey(unit?.unit_name || ""))
      .filter(Boolean);
    const outputUnitIds = approvedUnits
      .filter((unit: any) => enrichedUnitMap.has(canonicalUnitId(unit?.unit_id || "")))
      .map((unit: any) => canonicalUnitId(unit?.unit_id || ""))
      .filter(Boolean);
    const missingUnitKeys = expectedUnitKeys.filter((key: string) => !outputUnitKeys.includes(key));
    const extraUnitKeys = enrichedUnits
      .map((unit: any) => {
        const candidateStructuralKey = buildUnitStructuralKey({
          class_name: rawClass?.class_name || "",
          subject: rawClass?.subject || "",
          part_or_section: unit?.part_or_section || rawClass?.part_or_section || "",
          unit_name: unit?.unit_name || unit?.chapters?.[0]?.source_chapter_name || "",
        });
        const approvedUnit =
          approvedUnitByStructuralKey.get(candidateStructuralKey) ||
          sourceUnitById[canonicalUnitId(unit?.unit_id || "")] ||
          approvedUnitByKey.get(canonicalUnitKey(unit?.unit_name || unit?.chapters?.[0]?.source_chapter_name || ""));
        return approvedUnit ? "" : canonicalUnitKey(unit?.unit_name || unit?.chapters?.[0]?.source_chapter_name || "");
      })
      .filter(Boolean);
    console.log(
      `[Normalization] Class "${normalizedClassName}" | expectedUnitIdsCount=${expectedUnitIds.length} | stage3UnitsCount=${preparedEnrichedUnits.length} | recoveredFromStage3Fallback=${recoveredFromStage3Fallback} | acceptedTheoryUnitsCount=${enrichedUnits.length} | divertedFormativeCount=${divertedUnits.length} | outputUnitIds=${JSON.stringify(outputUnitIds)} | outputUnitKeys=${JSON.stringify(outputUnitKeys)} | missingUnitKeys=${JSON.stringify(uniqueStrings(missingUnitKeys))} | extraUnitKeys=${JSON.stringify(uniqueStrings(extraUnitKeys))}`
    );
    if (divertedUnits.length) {
      console.log(
        `[Normalization] Class "${normalizedClassName}" | diverted practical/formative units: ${JSON.stringify(
          divertedUnits.map((unit: any) => unit?.unit_name || unit?.chapters?.[0]?.source_chapter_name || unit?.unit_id || "")
        )}`
      );
    }

    if (!recoveredFromStage3Fallback && enrichedUnits.length > 0 && (extraUnitKeys.length || missingUnitKeys.length)) {
      if (missingUnitKeys.length) {
        throw new Error(
          `Normalization changed unit hierarchy for class "${rawClass?.class_name || classIndex + 1}". Missing unit keys: ${uniqueStrings(missingUnitKeys).join(", ") || "none"}. Extra unit keys: ${uniqueStrings(extraUnitKeys).join(", ") || "none"}.`
        );
      }
    }

    const normalizationSourceUnits = recoveredFromStage3Fallback
      ? enrichedUnits.map((unit: any, unitIndex: number) => ({
          unit_id: unit?.unit_id || `U${unitIndex + 1}`,
          unit_name: unit?.unit_name || unit?.chapters?.[0]?.chapter_name || `Unit ${unitIndex + 1}`,
          marks: unit?.marks ?? null,
          chapters: (unit?.chapters || []).map((chapter: any) => ({
            chapter_name: chapter?.source_chapter_name || chapter?.chapter_name || unit?.unit_name || "",
            source_chapter_name: chapter?.source_chapter_name || chapter?.chapter_name || unit?.unit_name || "",
            source_type: chapter?.source_type || "explicit_chapter",
          })),
        }))
      : approvedUnits;

    const normalizedUnits = normalizationSourceUnits.map((approvedUnit: any, unitIndex: number) => {
      const approvedUnitId = canonicalUnitId(approvedUnit?.unit_id || "");
      const enrichedUnit = enrichedUnitMap.get(approvedUnitId);
      if (!enrichedUnit) {
        throw new Error(
          `Normalization changed unit hierarchy for class "${rawClass?.class_name || classIndex + 1}". Missing approved unit_id "${approvedUnit?.unit_id || unitIndex + 1}".`
        );
      }
      const structureUnit = (structureClass?.units || [])[unitIndex] || {};
      const sourceUnitName = approvedUnit?.unit_name || "";
      const chapterSources: Array<{
        name: string;
        sourceType: "explicit_chapter" | "chapter_heading" | "unit_fallback";
        topics: string[];
        subtopics: string[];
        key_concepts: string[];
      }> =
        (approvedUnit?.chapters || []).map((chapter: any) => ({
          name: chapter?.chapter_name || chapter?.source_chapter_name || "",
          sourceType: chapter?.source_type || "explicit_chapter",
          topics: uniqueStrings(chapter?.topics || []),
          subtopics: uniqueStrings(chapter?.subtopics || []),
          key_concepts: uniqueStrings(chapter?.key_concepts || []),
        }));
      const normalizedChapterMap = new Map<string, any>();
      for (const chapter of enrichedUnit?.chapters || []) {
        const rawName = chapter?.source_chapter_name || chapter?.chapter_name || "";
        const canonicalKey = canonicalChapterKey(rawName);
        if (canonicalKey && !normalizedChapterMap.has(canonicalKey)) {
          normalizedChapterMap.set(canonicalKey, chapter);
        }
        const normalizedKey = normalizeSourceText(rawName);
        if (normalizedKey && !normalizedChapterMap.has(normalizedKey)) {
          normalizedChapterMap.set(normalizedKey, chapter);
        }
      }
      if (!recoveredFromStage3Fallback && (enrichedUnit?.chapters || []).length < chapterSources.length) {
        console.warn(
          `[Normalization] Unit "${sourceUnitName}" returned fewer Stage 3 chapters than Stage 1. Preserving Stage 1 chapters as source of truth. Stage1=${chapterSources.length} Stage3=${(enrichedUnit?.chapters || []).length}`
        );
      }
      const inputRawChapterNames = chapterSources.map((chapterSource) => chapterSource.name || "");
      const outputRawChapterNames = (enrichedUnit?.chapters || []).map(
        (chapter: any) => chapter?.source_chapter_name || chapter?.chapter_name || ""
      );
      const inputChapterNames = inputRawChapterNames
        .map((name: string) => canonicalChapterKey(name))
        .filter(Boolean)
        .sort();
      const outputChapterNames = outputRawChapterNames
        .map((name: string) => canonicalChapterKey(name))
        .filter(Boolean)
        .sort();
      console.log(
        `[Normalization] Unit "${sourceUnitName}" | input raw chapters: ${JSON.stringify(inputRawChapterNames)} | output raw chapters: ${JSON.stringify(outputRawChapterNames)} | input canonical keys: ${JSON.stringify(inputChapterNames)} | output canonical keys: ${JSON.stringify(outputChapterNames)}`
      );
      const missingChapterKeys = inputChapterNames.filter((name: string) => !outputChapterNames.includes(name));
      if (!recoveredFromStage3Fallback && missingChapterKeys.length) {
        console.warn(
          `[Normalization] Unit "${sourceUnitName}" is missing Stage 3 chapter matches for ${JSON.stringify(missingChapterKeys)}. Falling back to Stage 1 chapter structure.`
        );
      }
      const enforcedChapters = chapterSources.map((chapterSource, chapterIndex: number) => {
        const chapterName = chapterSource.name;
        const normalizedChapter = (
          normalizedChapterMap.get(canonicalChapterKey(chapterName)) ||
          normalizedChapterMap.get(normalizeSourceText(chapterName)) ||
          {}
        ) as any;
        const isUnitFallback = chapterSource.sourceType === "unit_fallback";
        const topicValues = uniqueStrings((normalizedChapter?.topics || chapterSource?.topics || []).slice(0, 5));
        const subtopicValues = uniqueStrings(normalizedChapter?.subtopics || chapterSource?.subtopics || []);
        const keyConceptValues = uniqueStrings(normalizedChapter?.key_concepts || chapterSource?.key_concepts || []).filter((value: string) => {
          const normalizedValue = normalizeSourceText(value || "");
          return normalizedValue && !topicValues.some((topic: string) => normalizeSourceText(topic || "") === normalizedValue);
        });
        return {
          chapter_id: `C${chapterIndex + 1}`,
          chapter_name: stripInternalParserLabel(chapterName),
          source_chapter_name: stripInternalParserLabel(chapterName),
          source_heading: stripInternalParserLabel(chapterName),
          source_type: chapterSource.sourceType,
          is_normalized: isUnitFallback,
          confidence: normalizedChapter?.confidence ?? (isUnitFallback ? 0.75 : 0.95),
          topics: topicValues,
          subtopics: subtopicValues,
          key_concepts: keyConceptValues,
          assessment_status: normalizedChapter?.assessment_status || "summative",
        };
      });

      return {
        unit_id: buildStableUnitId(
          rawClass?.class_name || enrichedResult?.class_name || "",
          rawClass?.subject || enrichedResult?.subject || "",
          approvedUnit?.unit_id || enrichedUnit?.unit_id || `U${unitIndex + 1}`,
          unitIndex
        ),
        unit_name: stripInternalParserLabel(approvedUnit?.unit_name || ""),
        marks: approvedUnit?.marks ?? enrichedUnit?.marks ?? null,
        explicit_chapters: (approvedUnit?.chapters || []).map((chapter: any) => stripInternalParserLabel(chapter?.chapter_name || chapter?.source_chapter_name || "")),
        headings: structureUnit?.headings || [],
        topics: uniqueStrings(approvedUnit?.topics || []),
        subtopics: uniqueStrings(approvedUnit?.subtopics || []),
        key_concepts: uniqueStrings(approvedUnit?.key_concepts || []).filter((value: string) => {
          const normalizedValue = normalizeSourceText(value || "");
          return normalizedValue && !uniqueStrings(approvedUnit?.topics || []).some((topic: string) => normalizeSourceText(topic || "") === normalizedValue);
        }),
        chapters: enforcedChapters,
      };
    });

    return {
      class_name: rawClass?.class_name || enrichedResult?.class_name || "",
      subject: rawClass?.subject || enrichedResult?.subject || "",
      part_or_section: rawClass?.part_or_section || "",
      units: normalizedUnits,
      formative_content_refs: [
        ...(enrichedResult?.formative_content_refs || []),
        ...divertedUnits.map((unit: any) => ({
          title: unit?.unit_name || unit?.chapters?.[0]?.source_chapter_name || unit?.unit_id || "Formative content",
          related_unit: "",
          related_chapter: "",
          assessment_status: "formative",
        })),
      ],
      validation_report: enrichedResult?.validation_report || {},
    };
  });
}

function sanitizeStage3EnrichmentToSource(
  stage3Result: any,
  rawClass: any,
  sourceText: string
) {
  const approvedUnits = rawClass?.units || [];
  const approvedUnitById = new Map(
    approvedUnits
      .map((unit: any): [string, any] => [canonicalUnitId(unit?.unit_id || ""), unit])
      .filter(([key]: [string, any]) => Boolean(key))
  );

  const sanitizedUnits = (stage3Result?.units || []).map((unit: any) => {
    const sourceUnit = (approvedUnitById.get(canonicalUnitId(unit?.unit_id || "")) || {}) as any;
    const sourceChapterByName = new Map(
      (sourceUnit?.chapters || [])
        .map((chapter: any): [string, any] => [canonicalChapterKey(chapter?.chapter_name || chapter?.source_chapter_name || ""), chapter])
        .filter(([key]: [string, any]) => Boolean(key))
    );

    const sanitizedChapters = (unit?.chapters || []).map((chapter: any) => {
      const sourceChapter = (
        sourceChapterByName.get(canonicalChapterKey(chapter?.source_chapter_name || chapter?.chapter_name || "")) || {}
      ) as any;
      const referenceValues = uniqueStrings([
        ...(sourceChapter?.topics || []),
        ...(sourceChapter?.subtopics || []),
        ...(sourceChapter?.key_concepts || []),
      ]);

      return {
        ...chapter,
        topics: filterFaithfulTopicList(sourceText, chapter?.topics || [], referenceValues),
        subtopics: filterFaithfulTopicList(sourceText, chapter?.subtopics || [], referenceValues),
        key_concepts: filterFaithfulTopicList(sourceText, chapter?.key_concepts || [], referenceValues),
      };
    });

    return {
      ...unit,
      chapters: sanitizedChapters,
    };
  });

  return {
    ...stage3Result,
    units: sanitizedUnits,
  };
}

async function normalizeClassTheory(
  requestId: string,
  debugDir: string,
  classIndex: number,
  approvedClass: any,
  sourceText: string
) {
  const theoryRawClass = approvedClass;
  const theoryStructureClass = approvedClass;
  console.log(
    `[Pipeline][${requestId}] ${canonicalizeClassName(theoryRawClass?.class_name || "")} | approved theory units count: ${(theoryRawClass?.units || []).length}`
  );
  const expectedTheoryUnitIds = (theoryRawClass?.units || []).map((unit: any) => unit?.unit_id || "").filter(Boolean);
  console.log(`[Pipeline][${requestId}] Stage 3 input unit ids for ${canonicalizeClassName(theoryRawClass?.class_name || "")}: ${JSON.stringify(expectedTheoryUnitIds)}`);
  const classLabel = [
    canonicalizeClassName(theoryRawClass?.class_name || ""),
    canonicalizeSubjectName(theoryRawClass?.subject || ""),
  ].filter(Boolean).join(" - ") || `Item ${classIndex + 1}`;
  const stageName = `${STAGE_ORDER[2]} - ${classLabel}`;
  const relevantSourceText = extractRelevantClassSourceText(sourceText, theoryRawClass, 8000);
  console.log(`[Pipeline][${requestId}] ${stageName} relevant source length: ${relevantSourceText.length}`);
  const schema = {
    units: [{
      unit_id: "",
      chapters: [{
        source_chapter_name: "",
        source_type: "explicit_chapter",
        node_type: "chapter",
        topics: [""],
        subtopics: [""],
        key_concepts: [""],
        assessment_status: "summative",
      }],
    }],
    formative_content_refs: [{
      title: "",
      related_unit: "",
      related_chapter: "",
      assessment_status: "formative",
    }],
    validation_report: {
      suspicious_chapter_names: [""],
      long_chapter_names_reclassified: [""],
      unit_count: 0,
      chapter_count: 0,
    },
  };

  const prompt = renderPrompt("node-enrichment.md", {
    STAGE_NAME: stageName,
    RAW_CLASS_JSON: JSON.stringify(theoryRawClass, null, 2),
    STRUCTURE_CLASS_JSON: JSON.stringify(theoryStructureClass, null, 2),
    SOURCE_TEXT: relevantSourceText,
  });
  if (prompt.length > 20000) {
    console.warn(`[Pipeline][${requestId}] ${stageName} prompt length ${prompt.length} exceeds target. Continuing with theory-only reduced payload.`);
  }

  let firstResult: any = null;
  try {
    const result = await runStage(requestId, debugDir, stageName, prompt, schema);
    const normalizedResult = sanitizeStage3EnrichmentToSource({
      ...result,
      units: (result?.units || []).filter((unit: any) => String(unit?.unit_id || "").trim()),
    }, theoryRawClass, relevantSourceText);
    const firstAcceptedUnitIds = (normalizedResult.units || []).map((unit: any) => unit?.unit_id || "").filter(Boolean);
    const firstDiscardedUnitIds = (result?.units || [])
      .filter((unit: any) => !String(unit?.unit_id || "").trim())
      .map((unit: any) => unit?.unit_id || "");
    console.log(`[Pipeline][${requestId}] ${stageName} output accepted unit ids: ${JSON.stringify(firstAcceptedUnitIds)}`);
    console.log(`[Pipeline][${requestId}] ${stageName} output discarded unit ids: ${JSON.stringify(firstDiscardedUnitIds)}`);
    firstResult = normalizedResult;
    const firstValidation = isValidStage3Enrichment(normalizedResult, expectedTheoryUnitIds);
    const retryNeeded = !firstValidation.valid;
    console.log(`[Pipeline][${requestId}] ${stageName} | First enrichment valid: ${firstValidation.valid} | Retry needed: ${retryNeeded}`);
    if (!retryNeeded) {
      console.log(`[Pipeline][${requestId}] ${stageName} | Using first enrichment`);
      return normalizedResult;
    }
    if (firstValidation.practicalLikeOnly) {
      throw new OllamaRequestError(
        `Stage 3 returned practical/formative enrichment for ${classLabel}. Retrying with theory-only input.`,
        {
          code: "STAGE3_NON_THEORY_RESULT",
          retryable: false,
          stageName,
          promptLength: prompt.length,
          timeoutMs: OLLAMA_TIMEOUT_MS,
        }
      );
    }
    throw new OllamaRequestError(
      `Stage 3 returned fewer theory units than expected for ${classLabel}. Retrying with theory-only input.`,
      {
        code: "STAGE3_INCOMPLETE_RESULT",
        retryable: false,
        stageName,
        promptLength: prompt.length,
        timeoutMs: OLLAMA_TIMEOUT_MS,
      }
    );
  } catch (error: any) {
    const needsRetry =
      String(error?.code || "") === "OLLAMA_OUTPUT_TRUNCATED" ||
      String(error?.code || "") === "STAGE3_NON_THEORY_RESULT" ||
      String(error?.code || "") === "STAGE3_INCOMPLETE_RESULT" ||
      String(error?.message || "").includes("Model output truncated");
    console.log(`[Pipeline][${requestId}] ${stageName} | First enrichment valid: false | Retry needed: ${needsRetry}`);
    if (!needsRetry) {
      throw error;
    }

    const fallbackSourceText = extractRelevantClassSourceText(sourceText, theoryRawClass, 5000);
    const fallbackPrompt = renderPrompt("node-enrichment.md", {
      STAGE_NAME: `${stageName} - Retry`,
      RAW_CLASS_JSON: JSON.stringify(theoryRawClass, null, 2),
      STRUCTURE_CLASS_JSON: JSON.stringify(theoryStructureClass, null, 2),
      SOURCE_TEXT: fallbackSourceText,
    });
    const retryResult = await runStage(requestId, debugDir, `${stageName} - Retry`, fallbackPrompt, schema);
    const normalizedRetryResult = sanitizeStage3EnrichmentToSource({
      ...retryResult,
      units: (retryResult?.units || []).filter((unit: any) => String(unit?.unit_id || "").trim()),
    }, theoryRawClass, fallbackSourceText);
    const retryAcceptedUnitIds = (normalizedRetryResult.units || []).map((unit: any) => unit?.unit_id || "").filter(Boolean);
    const retryDiscardedUnitIds = (retryResult?.units || [])
      .filter((unit: any) => !String(unit?.unit_id || "").trim())
      .map((unit: any) => unit?.unit_id || "");
    console.log(`[Pipeline][${requestId}] ${stageName} - Retry output accepted unit ids: ${JSON.stringify(retryAcceptedUnitIds)}`);
    console.log(`[Pipeline][${requestId}] ${stageName} - Retry output discarded unit ids: ${JSON.stringify(retryDiscardedUnitIds)}`);
    const retryValidation = isValidStage3Enrichment(normalizedRetryResult, expectedTheoryUnitIds);
    const firstValidation = firstResult ? isValidStage3Enrichment(firstResult, expectedTheoryUnitIds) : null;
    const firstScore = firstResult ? scoreStage3Enrichment(firstResult, expectedTheoryUnitIds) : null;
    const retryScore = scoreStage3Enrichment(normalizedRetryResult, expectedTheoryUnitIds);
    console.log(`[Pipeline][${requestId}] ${stageName} | First enrichment unit ids: ${JSON.stringify((firstResult?.units || []).map((unit: any) => unit?.unit_id || "").filter(Boolean))}`);
    console.log(`[Pipeline][${requestId}] ${stageName} | Retry enrichment unit ids: ${JSON.stringify(retryAcceptedUnitIds)}`);
    const shouldUseFirst =
      Boolean(firstResult) &&
      Boolean(firstScore) &&
      (
        (firstScore!.unitCount > retryScore.unitCount) ||
        (firstScore!.unitCount === retryScore.unitCount && firstScore!.chapterCount > retryScore.chapterCount) ||
        (
          firstScore!.unitCount === retryScore.unitCount &&
          firstScore!.chapterCount === retryScore.chapterCount &&
          firstScore!.missingExpectedUnitsCount <= retryScore.missingExpectedUnitsCount
        )
      );
    console.log(
      `[Pipeline][${requestId}] ${stageName} | Chosen enrichment reason: ${JSON.stringify({
        first_units: firstScore?.unitCount || 0,
        retry_units: retryScore.unitCount,
        selected: shouldUseFirst ? "first" : "retry",
      })}`
    );
    if (shouldUseFirst) {
      console.log(`[Pipeline][${requestId}] ${stageName} | Retry was worse. Using first enrichment`);
      return firstResult;
    }
    if (retryValidation.valid) {
      console.log(`[Pipeline][${requestId}] ${stageName} | Using retry`);
      return normalizedRetryResult;
    }
    if (retryValidation.practicalLikeOnly) {
      throw new Error(`Stage 3 retry returned practical/formative units for ${classLabel} instead of theory units.`);
    }
    return normalizedRetryResult;
  }
}

async function classifyUnitHeadings(
  requestId: string,
  debugDir: string,
  classIndex: number,
  unitIndex: number,
  className: string,
  unit: any
) {
  const stageName = `${STAGE_ORDER[1]} - ${className || `Item ${classIndex + 1}`} - Unit ${unitIndex + 1}`;
  const schema = {
    unit_id: "",
    classified_blocks: [{
      source_heading: "",
      source_text_excerpt: "",
      classification: "unit",
      confidence: 0.0,
      parent_chapter: "",
    }],
  };

  const prompt = renderPrompt("heading-classification-unit.md", {
    STAGE_NAME: stageName,
    CLASS_NAME: className,
    UNIT_JSON: JSON.stringify(unit, null, 2),
  });

  return runStage(requestId, debugDir, stageName, prompt, schema);
}

async function classifyHeadingsForClass(
  requestId: string,
  debugDir: string,
  classIndex: number,
  rawClass: any
) {
  const classLabel = [rawClass?.class_name, rawClass?.subject].filter(Boolean).join(" - ") || `Item ${classIndex + 1}`;
  const stageName = `${STAGE_ORDER[1]} - ${classLabel}`;
  const schema = {
    units: [{
      unit_id: "",
      classified_blocks: [{
        source_heading: "",
        source_text_excerpt: "",
        classification: "unit",
        confidence: 0.0,
        parent_chapter: "",
      }],
    }],
  };

  const prompt = renderPrompt("heading-classification-class.md", {
    STAGE_NAME: stageName,
    RAW_CLASS_JSON: JSON.stringify(rawClass, null, 2),
  });

  try {
    return await runStage(requestId, debugDir, stageName, prompt, schema);
  } catch (error: any) {
    if (!String(error?.message || "").includes("Model output truncated")) {
      throw error;
    }

    console.warn(`[Pipeline][${requestId}] ${stageName} truncated. Retrying per unit...`);
    const classifiedUnits = [];
    const units = rawClass?.units || [];
    for (let unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
      const classifiedUnit = await classifyUnitHeadings(
        requestId,
        debugDir,
        classIndex,
        unitIndex,
        rawClass?.class_name || "",
        units[unitIndex]
      );
      classifiedUnits.push(classifiedUnit);
    }

    return {
      units: classifiedUnits,
    };
  }
}

function assertCurriculumReadyForPlanning(curriculum: any) {
  const normalized = getNormalizedStructureFromCurriculum(curriculum);
  const validation = normalized?.validation_report || curriculum?.stagedExtraction?.structuralValidation || {};
  if (!normalized?.classes?.length) {
    throw new Error("Curriculum normalization is missing. Cannot continue to term division.");
  }
  if ((validation.invalid_units || []).length || (validation.invalid_chapters || []).length) {
    throw new Error("Curriculum contains invalid structural entities. Resolve validation issues before term division.");
  }
  if ((validation.suspicious_long_chapter_names || []).length) {
    throw new Error("Curriculum contains suspicious long chapter names. Resolve normalization issues before term division.");
  }
}

let mongoConnectionPromise: Promise<typeof mongoose> | null = null;
let lastMongoUnavailableLogAt = 0;

function isMongoUnavailableError(error: any) {
  const message = String(error?.message || "");
  const causeMessage = String(error?.cause?.message || "");
  return (
    error?.name === "MongooseServerSelectionError" ||
    message.includes("ECONNREFUSED 127.0.0.1:27017") ||
    message.includes("Server selection timed out") ||
    causeMessage.includes("ECONNREFUSED 127.0.0.1:27017")
  );
}

function logMongoUnavailable(scope: string, error: any) {
  const now = Date.now();
  if (now - lastMongoUnavailableLogAt < 15000) {
    return;
  }
  lastMongoUnavailableLogAt = now;
  console.error(`[${scope}] MongoDB unavailable at ${MONGODB_URI}. ${String(error?.message || error)}`);
}

function sendMongoUnavailable(res: express.Response, fallbackMessage: string) {
  return res.status(503).json({
    error: fallbackMessage,
    code: "MONGODB_UNAVAILABLE",
    details: `MongoDB is not reachable at ${MONGODB_URI}.`,
  });
}

async function connectToMongo() {
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    }).catch((error) => {
      mongoConnectionPromise = null;
      throw error;
    });
  }
  return mongoConnectionPromise;
}

async function validateStructureAgainstSource(requestId: string, debugDir: string, sourceText: string, structure: any) {
  const invalidUnits: string[] = [];
  const invalidChapters: string[] = [];
  const validationLog: Array<{
    entityType: "unit" | "chapter";
    extractedName: string;
    normalizedName: string;
    matched: boolean;
    matchedCandidate: string;
    snippet: string | null;
  }> = [];
  let validatedUnits = 0;
  let validatedChapters = 0;

  for (const unit of structure?.units || []) {
    if (unit?.unit_name) {
      const unitValidation = validateEntityAgainstSource(sourceText, unit.unit_name);
      validationLog.push({
        entityType: "unit",
        extractedName: unit.unit_name,
        normalizedName: unitValidation.normalizedEntity,
        matched: unitValidation.matched,
        matchedCandidate: unitValidation.matchedCandidate,
        snippet: unitValidation.snippet,
      });
      console.log(`[Validation][${requestId}] Unit "${unit.unit_name}" -> normalized "${unitValidation.normalizedEntity}" -> ${unitValidation.matched ? "MATCH" : "NO MATCH"}${unitValidation.snippet ? ` | snippet: ${unitValidation.snippet}` : ""}`);

      if (!unitValidation.matched) {
        invalidUnits.push(unit.unit_name);
      } else {
        validatedUnits += 1;
      }
    }

    for (const chapter of unit?.chapters || []) {
      if (chapter?.chapter_name) {
        const chapterValidation = validateEntityAgainstSource(sourceText, chapter.chapter_name);
        validationLog.push({
          entityType: "chapter",
          extractedName: chapter.chapter_name,
          normalizedName: chapterValidation.normalizedEntity,
          matched: chapterValidation.matched,
          matchedCandidate: chapterValidation.matchedCandidate,
          snippet: chapterValidation.snippet,
        });
        console.log(`[Validation][${requestId}] Chapter "${chapter.chapter_name}" -> normalized "${chapterValidation.normalizedEntity}" -> ${chapterValidation.matched ? "MATCH" : "NO MATCH"}${chapterValidation.snippet ? ` | snippet: ${chapterValidation.snippet}` : ""}`);

        if (!chapterValidation.matched) {
          invalidChapters.push(chapter.chapter_name);
        } else {
          validatedChapters += 1;
        }
      }
    }
  }

  await writeDebugFile(debugDir, "stage-1-validation-log.json", validationLog);
  console.log(`[Validation][${requestId}] Units validated: ${validatedUnits}`);
  console.log(`[Validation][${requestId}] Chapters validated: ${validatedChapters}`);
  console.log(`[Validation][${requestId}] Invalid units: ${invalidUnits.join(", ") || "none"}`);
  console.log(`[Validation][${requestId}] Invalid chapters: ${invalidChapters.join(", ") || "none"}`);

  if (invalidUnits.length || invalidChapters.length) {
    throw new Error(
      `Validation failed. Structural entities not present in source text. Invalid units: ${invalidUnits.join(", ") || "none"}. Invalid chapters: ${invalidChapters.join(", ") || "none"}.`
    );
  }
}

type OllamaStageResult = {
  doneReason: string;
  numPredict: number;
  outputLength: number;
  promptLength: number;
  text: string;
};

type StageValidationResult<T> = {
  parsed: T;
  valid: boolean;
  sanitized?: {
    text: string;
    changed: boolean;
    fixes: string[];
  };
};

type OllamaRequestOptions = {
  baseUrl?: string;
  model?: string;
  numPredict?: number;
  timeoutMs?: number;
  retries?: number;
};

function refreshRuntimeEnv() {
  dotenv.config({ path: ENV_FILE_PATH, override: true });
}

function normalizeSessionPptGenerationOptions(input: any): SessionPptGenerationOptions {
  if (!input || typeof input !== "object") {
    return {};
  }
  const pptTemplateId = String(input?.pptTemplateId || "").trim();
  const pptThemeId = String(input?.pptThemeId || "").trim();
  return {
    ...(pptTemplateId ? { pptTemplateId } : {}),
    ...(pptThemeId ? { pptThemeId } : {}),
  };
}

function getOllamaConfig(kind: OllamaGenerationKind): { baseUrl: string; model: string } {
  refreshRuntimeEnv();
  const defaultBaseUrl = process.env.OLLAMA_BASE_URL || "http://192.168.1.82:11434";
  const defaultModel = process.env.OLLAMA_MODEL || "qwen3.5:35b";
  const sessionContentBaseUrl = process.env.OLLAMA_SESSION_CONTENT_BASE_URL || defaultBaseUrl;
  const sessionContentModel = process.env.OLLAMA_SESSION_CONTENT_MODEL || defaultModel;
  const imageBaseUrl = process.env.OLLAMA_IMAGE_BASE_URL || defaultBaseUrl;
  const imageModel = process.env.OLLAMA_IMAGE_MODEL || "x/z-image-turbo:bf16";

  switch (kind) {
    case "teacherNotes":
      return {
        baseUrl: process.env.OLLAMA_TEACHER_NOTES_BASE_URL || sessionContentBaseUrl,
        model: process.env.OLLAMA_TEACHER_NOTES_MODEL || sessionContentModel,
      };
    case "studentNotes":
      return {
        baseUrl: process.env.OLLAMA_STUDENT_NOTES_BASE_URL || sessionContentBaseUrl,
        model: process.env.OLLAMA_STUDENT_NOTES_MODEL || sessionContentModel,
      };
    case "materials":
      return {
        baseUrl: process.env.OLLAMA_MATERIALS_BASE_URL || sessionContentBaseUrl,
        model: process.env.OLLAMA_MATERIALS_MODEL || sessionContentModel,
      };
    case "homework":
      return {
        baseUrl: process.env.OLLAMA_HOMEWORK_BASE_URL || sessionContentBaseUrl,
        model: process.env.OLLAMA_HOMEWORK_MODEL || sessionContentModel,
      };
    case "assessment":
      return {
        baseUrl: process.env.OLLAMA_ASSESSMENT_BASE_URL || sessionContentBaseUrl,
        model: process.env.OLLAMA_ASSESSMENT_MODEL || sessionContentModel,
      };
    case "assignment":
      return {
        baseUrl: process.env.OLLAMA_ASSIGNMENT_BASE_URL || sessionContentBaseUrl,
        model: process.env.OLLAMA_ASSIGNMENT_MODEL || sessionContentModel,
      };
    case "sessionContent":
      return { baseUrl: sessionContentBaseUrl, model: sessionContentModel };
    case "image":
      return { baseUrl: imageBaseUrl, model: imageModel };
    case "default":
    default:
      return { baseUrl: defaultBaseUrl, model: defaultModel };
  }
}

class OllamaRequestError extends Error {
  code: string;
  retryable: boolean;
  stageName: string;
  promptLength: number;
  timeoutMs: number;

  constructor(message: string, options: {
    code: string;
    retryable: boolean;
    stageName: string;
    promptLength: number;
    timeoutMs: number;
  }) {
    super(message);
    this.name = "OllamaRequestError";
    this.code = options.code;
    this.retryable = options.retryable;
    this.stageName = options.stageName;
    this.promptLength = options.promptLength;
    this.timeoutMs = options.timeoutMs;
  }
}

function isStage1LikeStage(stageName: string) {
  return stageName.startsWith(STAGE_ORDER[0]);
}

function validateStageOutput<T>(stageName: string, responseText: string): StageValidationResult<T> {
  const sanitized = sanitizeJsonText(responseText);
  const parsed = JSON.parse(sanitized.text) as T;

  if (isStage1LikeStage(stageName)) {
    const stage1 = parsed as any;
    const hasArrays =
      Array.isArray(stage1?.classes) &&
      Array.isArray(stage1?.units) &&
      Array.isArray(stage1?.chapters);
    const hasUsefulFacts =
      (stage1?.classes?.length || 0) > 0 ||
      (stage1?.units?.length || 0) > 0 ||
      (stage1?.chapters?.length || 0) > 0;
    return {
      parsed,
      valid: hasArrays && hasUsefulFacts,
      sanitized,
    };
  }

  return { parsed, valid: true, sanitized };
}

function getStageRequestOptions(stageName: string): OllamaRequestOptions {
  if (stageName.startsWith(STAGE_ORDER[0])) {
    return {
      numPredict: OLLAMA_STAGE1_NUM_PREDICT,
      timeoutMs: OLLAMA_TIMEOUT_MS,
      retries: 2,
    };
  }
  return {
    numPredict: OLLAMA_NUM_PREDICT,
    timeoutMs: OLLAMA_TIMEOUT_MS,
    retries: 3,
  };
}

function isRetryableOllamaError(error: any) {
  const code = String(error?.code || error?.cause?.code || "");
  const message = String(error?.message || "");
  if (
    code === "UND_ERR_HEADERS_TIMEOUT" ||
    code === "ABORT_ERR" ||
    message.includes("Headers Timeout Error") ||
    message.includes("Request timed out")
  ) {
    return false;
  }

  return (
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("429") ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "UND_ERR_CONNECT_TIMEOUT"
  );
}

function splitCurriculumTextIntoChunks(text: string, maxChunkLength: number = 12000): string[] {
  const pageBreakChunks = text
    .split(/\f|(?:\r?\n){3,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (pageBreakChunks.length <= 1 && text.length <= maxChunkLength) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  for (const part of pageBreakChunks.length ? pageBreakChunks : [text]) {
    if (!part) continue;
    const candidate = currentChunk ? `${currentChunk}\n\n${part}` : part;
    if (candidate.length <= maxChunkLength) {
      currentChunk = candidate;
      continue;
    }
    if (currentChunk) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
    if (part.length <= maxChunkLength) {
      currentChunk = part;
      continue;
    }
    for (let index = 0; index < part.length; index += maxChunkLength) {
      chunks.push(part.slice(index, index + maxChunkLength).trim());
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter(Boolean);
}

function splitTextIntoPageSegments(text: string): string[] {
  const pagePattern = /--- Page \d+ ---/g;
  const matches = [...text.matchAll(pagePattern)];
  if (!matches.length) {
    return splitCurriculumTextIntoChunks(text, 8000);
  }

  const segments: string[] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index ?? 0;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? text.length) : text.length;
    const segment = text.slice(start, end).trim();
    if (segment) {
      segments.push(segment);
    }
  }
  return segments.length ? segments : splitCurriculumTextIntoChunks(text, 8000);
}

function getAdaptiveStage1ChunkCount(textLength: number) {
  if (textLength < 10000) return 1;
  if (textLength <= 20000) return 2;
  if (textLength <= 35000) return 4;
  return Math.max(6, Math.ceil(textLength / 8000));
}

function buildAdaptiveStage1Chunks(text: string, requestedChunkCount?: number): string[] {
  const pages = splitTextIntoPageSegments(text);
  const chunkCount = Math.max(1, requestedChunkCount || getAdaptiveStage1ChunkCount(text.length));
  if (pages.length <= 1 && chunkCount === 1) {
    return [text];
  }

  const targetChunkSize = Math.ceil(pages.length / chunkCount);
  const chunks: string[] = [];
  for (let index = 0; index < pages.length; index += targetChunkSize) {
    chunks.push(pages.slice(index, index + targetChunkSize).join("\n\n").trim());
  }
  return chunks.filter(Boolean);
}

function splitChunkForRetry(text: string): string[] {
  const pages = splitTextIntoPageSegments(text);
  if (pages.length > 1) {
    const midpoint = Math.ceil(pages.length / 2);
    return [
      pages.slice(0, midpoint).join("\n\n").trim(),
      pages.slice(midpoint).join("\n\n").trim(),
    ].filter(Boolean);
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (paragraphs.length > 1) {
    const midpoint = Math.ceil(paragraphs.length / 2);
    return [
      paragraphs.slice(0, midpoint).join("\n\n").trim(),
      paragraphs.slice(midpoint).join("\n\n").trim(),
    ].filter(Boolean);
  }

  const midpoint = Math.ceil(text.length / 2);
  return [text.slice(0, midpoint).trim(), text.slice(midpoint).trim()].filter(Boolean);
}

function mergeStage1FactExtractions(extractions: any[]) {
  const mergedClasses = new Map<string, any>();
  const mergedUnits = new Map<string, any>();
  const mergedChapters = new Map<string, any>();
  const merged = {
    document_metadata: {} as Record<string, any>,
    classes: [] as any[],
    units: [] as any[],
    chapters: [] as any[],
  };

  const beforeCounts = extractions.reduce((acc: { classes: number; units: number; chapters: number }, extraction: any) => {
    const counts = getStage1ExtractionCounts(extraction);
    return {
      classes: acc.classes + counts.classes,
      units: acc.units + counts.units,
      chapters: acc.chapters + counts.chapters,
    };
  }, { classes: 0, units: 0, chapters: 0 });

  const documentContext = buildDocumentClassContext(
    extractions.flatMap((extraction: any) => [
      ...(extraction?.classes || []),
      ...(extraction?.units || []),
      ...(extraction?.chapters || []),
    ])
  );

  const classKey = (entry: any) => [
    buildCanonicalClassKey(entry?.class_name || "", documentContext),
    normalizeSourceText(canonicalizeSubjectName(entry?.subject || "")),
  ].join("::");

  const unitKey = (entry: any) => [
    buildCanonicalClassKey(entry?.class_name || "", documentContext),
    canonicalUnitId(entry?.unit_id || entry?.unit_name || ""),
    canonicalUnitNameKey(entry?.unit_name || ""),
  ].join("::");

  const chapterKey = (entry: any) => [
    buildCanonicalClassKey(entry?.class_name || "", documentContext),
    canonicalUnitId(entry?.unit_id || entry?.unit_name || ""),
    canonicalUnitNameKey(entry?.unit_name || ""),
    canonicalChapterKey(entry?.chapter_name || ""),
  ].join("::");

  for (const extraction of extractions) {
    if ((extraction?.units?.length || 0) === 0 && (extraction?.chapters?.length || 0) === 0) {
      console.warn(`[Pipeline][Stage1Merge] Skipping empty curriculum chunk`);
      continue;
    }

    merged.document_metadata = { ...merged.document_metadata, ...(extraction?.document_metadata || {}) };

    for (const rawClass of extraction?.classes || []) {
      const key = classKey(rawClass);
      if (!mergedClasses.has(key)) {
        mergedClasses.set(key, {
          class_name: resolveClassName(rawClass, documentContext),
          subject: canonicalizeSubjectName(rawClass?.subject || ""),
          part_or_section: "",
        });
      }
    }

    for (const rawUnit of extraction?.units || []) {
      const currentUnitKey = unitKey(rawUnit);
      if (!mergedUnits.has(currentUnitKey)) {
        mergedUnits.set(currentUnitKey, {
          class_name: resolveClassName(rawUnit, documentContext),
          subject: canonicalizeSubjectName(rawUnit?.subject || ""),
          part_or_section: "",
          unit_id: rawUnit?.unit_id || "",
          unit_name: String(rawUnit?.unit_name || "").trim(),
          marks: rawUnit?.marks ?? null,
          topics: uniqueStrings(rawUnit?.topics || []),
          subtopics: uniqueStrings(rawUnit?.subtopics || []),
          key_concepts: uniqueStrings(rawUnit?.key_concepts || []),
        });
        continue;
      }

      const existingUnit = mergedUnits.get(currentUnitKey) as any;
      existingUnit.unit_id = existingUnit.unit_id || rawUnit?.unit_id || "";
      existingUnit.unit_name = existingUnit.unit_name || String(rawUnit?.unit_name || "").trim();
      existingUnit.marks = existingUnit.marks ?? rawUnit?.marks ?? null;
      existingUnit.topics = uniqueStrings([...(existingUnit.topics || []), ...(rawUnit?.topics || [])]);
      existingUnit.subtopics = uniqueStrings([...(existingUnit.subtopics || []), ...(rawUnit?.subtopics || [])]);
      existingUnit.key_concepts = uniqueStrings([...(existingUnit.key_concepts || []), ...(rawUnit?.key_concepts || [])]);
    }

    for (const rawChapter of extraction?.chapters || []) {
      const currentChapterKey = chapterKey(rawChapter);
      if (!mergedChapters.has(currentChapterKey)) {
        mergedChapters.set(currentChapterKey, {
          class_name: resolveClassName(rawChapter, documentContext),
          subject: canonicalizeSubjectName(rawChapter?.subject || ""),
          part_or_section: "",
          unit_id: rawChapter?.unit_id || "",
          unit_name: String(rawChapter?.unit_name || "").trim(),
          chapter_name: cleanChapterName(rawChapter?.chapter_name || "", rawChapter?.unit_name || ""),
          marks: rawChapter?.marks ?? null,
          topics: uniqueStrings(rawChapter?.topics || []),
          subtopics: uniqueStrings(rawChapter?.subtopics || []),
          key_concepts: uniqueStrings(rawChapter?.key_concepts || []),
        });
        continue;
      }

      const existingChapter = mergedChapters.get(currentChapterKey) as any;
      existingChapter.unit_id = existingChapter.unit_id || rawChapter?.unit_id || "";
      existingChapter.unit_name = existingChapter.unit_name || String(rawChapter?.unit_name || "").trim();
      existingChapter.chapter_name = existingChapter.chapter_name || cleanChapterName(rawChapter?.chapter_name || "", rawChapter?.unit_name || "");
      existingChapter.marks = existingChapter.marks ?? rawChapter?.marks ?? null;
      existingChapter.topics = uniqueStrings([...(existingChapter.topics || []), ...(rawChapter?.topics || [])]);
      existingChapter.subtopics = uniqueStrings([...(existingChapter.subtopics || []), ...(rawChapter?.subtopics || [])]);
      existingChapter.key_concepts = uniqueStrings([...(existingChapter.key_concepts || []), ...(rawChapter?.key_concepts || [])]);
    }
  }

  merged.classes = [...mergedClasses.entries()]
    .filter(([key, value]) => key && value?.class_name && value.class_name !== "unresolved_class")
    .map(([, value]) => value);
  merged.units = [...mergedUnits.values()];
  merged.chapters = [...mergedChapters.values()];

  console.log(`[Pipeline][Stage1Merge] Before deduplication -> Classes: ${beforeCounts.classes} Units: ${beforeCounts.units} Chapters: ${beforeCounts.chapters}`);
  console.log(`[Pipeline][Stage1Merge] After deduplication -> Classes: ${merged.classes.length} Units: ${merged.units.length} Chapters: ${merged.chapters.length}`);

  return merged;
}

function expandStage1FactsToRawExtraction(stage1Facts: any) {
  const documentContext = buildDocumentClassContext([
    ...(stage1Facts?.classes || []),
    ...(stage1Facts?.units || []),
    ...(stage1Facts?.chapters || []),
  ]);
  const classMap = new Map<string, any>();
  for (const rawClass of stage1Facts?.classes || []) {
    const resolvedClassName = resolveClassName(rawClass, documentContext);
    if (!resolvedClassName || resolvedClassName === "unresolved_class") {
      continue;
    }
    classMap.set([
      buildCanonicalClassKey(resolvedClassName, documentContext),
      normalizeSourceText(canonicalizeSubjectName(rawClass?.subject || "")),
    ].join("::"), {
      class_name: resolvedClassName,
      subject: canonicalizeSubjectName(rawClass?.subject || ""),
      part_or_section: "",
    });
  }
  for (const entry of [...(stage1Facts?.units || []), ...(stage1Facts?.chapters || [])]) {
    const resolvedClassName = resolveClassName(entry, documentContext);
    if (!resolvedClassName || resolvedClassName === "unresolved_class") {
      console.warn(`[Stage1Expand] Unresolved class for entry "${entry?.unit_name || entry?.chapter_name || ""}"`);
      continue;
    }
    const key = [
      buildCanonicalClassKey(resolvedClassName, documentContext),
      normalizeSourceText(canonicalizeSubjectName(entry?.subject || "")),
    ].join("::");
    if (!classMap.has(key)) {
      classMap.set(key, {
        class_name: resolvedClassName,
        subject: canonicalizeSubjectName(entry?.subject || ""),
        part_or_section: "",
      });
    }
  }

  const classes = [...classMap.values()].map((rawClass: any) => {
    const classUnits = (stage1Facts?.units || [])
      .filter((unit: any) => {
        const resolvedClassName = resolveClassName(unit, documentContext);
        return (
          resolvedClassName &&
          resolvedClassName !== "unresolved_class" &&
          buildCanonicalClassKey(resolvedClassName, documentContext) === buildCanonicalClassKey(rawClass?.class_name || "", documentContext)
        );
      })
      .map((unit: any) => {
        const matchingChapters = (stage1Facts?.chapters || [])
          .filter((chapter: any) => {
            const resolvedClassName = resolveClassName(chapter, documentContext);
            return (
              resolvedClassName &&
              resolvedClassName !== "unresolved_class" &&
              buildCanonicalClassKey(resolvedClassName, documentContext) === buildCanonicalClassKey(rawClass?.class_name || "", documentContext) &&
              buildUnitStructuralKey({
                class_name: resolvedClassName,
                subject: chapter?.subject || rawClass?.subject || "",
                part_or_section: chapter?.part_or_section || "",
                unit_name: chapter?.unit_name || "",
              }, documentContext) === buildUnitStructuralKey({
                class_name: resolvedClassName,
                subject: unit?.subject || rawClass?.subject || "",
                part_or_section: unit?.part_or_section || "",
                unit_name: unit?.unit_name || "",
              }, documentContext)
            );
          })
          .map((chapter: any, chapterIndex: number) => ({
            chapter_id: chapter?.chapter_id || `C${chapterIndex + 1}`,
            chapter_name: cleanChapterName(chapter?.chapter_name || "", chapter?.unit_name || unit?.unit_name || ""),
            source_chapter_name: cleanChapterName(chapter?.chapter_name || "", chapter?.unit_name || unit?.unit_name || ""),
            topics: uniqueStrings(chapter?.topics || []),
            subtopics: uniqueStrings(chapter?.subtopics || []),
            key_concepts: uniqueStrings(chapter?.key_concepts || []),
          }))
          .filter((chapter: any) => Boolean(chapter?.chapter_name));
        const explicitChapters = matchingChapters.map((chapter: any) => chapter.chapter_name);

        return {
          unit_id: unit?.unit_id || "",
          unit_name: String(unit?.unit_name || "").trim(),
          marks: unit?.marks ?? null,
          explicit_chapters: uniqueStrings(explicitChapters),
          headings: [],
          possible_chapters: [],
          topics: uniqueStrings(unit?.topics || []),
          subtopics: uniqueStrings(unit?.subtopics || []),
          key_concepts: uniqueStrings(unit?.key_concepts || []),
          chapter_details: matchingChapters,
        };
      });

    return {
      class_name: rawClass?.class_name || "",
      subject: rawClass?.subject || "",
      part_or_section: rawClass?.part_or_section || "",
      raw_nodes: [],
      units: classUnits,
    };
  });

  return {
    document_metadata: stage1Facts?.document_metadata || {},
    raw_nodes: [],
    classes,
    formative_only_content: [],
    practicals: [],
    activities: [],
    projects: [],
    assessment_information: {
      marks_distribution: [],
      excluded_or_non_assessed_content: [],
      teacher_notes: [],
    },
  };
}

function shouldUseChunkedStage1Fallback(error: any, sourceText: string) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  return (
    sourceText.length > 12000 &&
    (
      code === "UND_ERR_HEADERS_TIMEOUT" ||
      code === "ABORT_ERR" ||
      code === "OLLAMA_OUTPUT_TRUNCATED" ||
      code === "ECONNRESET" ||
      code === "ETIMEDOUT" ||
      code === "UND_ERR_CONNECT_TIMEOUT" ||
      message.includes("Headers Timeout Error") ||
      message.includes("timed out") ||
      message.includes("fetch failed") ||
      message.includes("Model output truncated")
    )
  );
}

async function runStage1ChunkWithAdaptiveRetry(
  requestId: string,
  debugDir: string,
  stageName: string,
  buildPrompt: (sourceText: string, chunkLabel?: string) => string,
  schema: any,
  chunkText: string,
  chunkLabel: string,
  depth: number = 0
): Promise<any> {
  try {
    const stageOptions = {
      numPredict: OLLAMA_STAGE1_NUM_PREDICT,
      timeoutMs: OLLAMA_TIMEOUT_MS,
      retries: 2,
    };
    return await runStage(
      requestId,
      debugDir,
      stageName,
      buildPrompt(chunkText, chunkLabel),
      schema,
      stageOptions
    );
  } catch (error: any) {
    const errorCode = String(error?.code || "");
    const errorMessage = String(error?.message || "");
    const isTruncated = String(error?.code || "") === "OLLAMA_OUTPUT_TRUNCATED" || String(error?.message || "").includes("Model output truncated");
    const isRetryableTransportFailure =
      Boolean(error?.retryable) ||
      errorCode === "ECONNRESET" ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "UND_ERR_CONNECT_TIMEOUT" ||
      errorMessage.includes("fetch failed");
    if (isRetryableTransportFailure && !isTruncated) {
      if (depth >= MAX_CHUNK_SPLIT_DEPTH || chunkText.length < 5000) {
        console.warn(
          `[Pipeline][${requestId}] ${stageName} chunk "${chunkLabel}" hit retryable transport failure (${errorCode || errorMessage}). Retrying same chunk once with a smaller output target.`
        );
        return await runStage(
          requestId,
          debugDir,
          `${stageName} - Transport Retry`,
          buildPrompt(chunkText, chunkLabel),
          schema,
          {
            numPredict: Math.min(2048, OLLAMA_STAGE1_NUM_PREDICT),
            timeoutMs: OLLAMA_TIMEOUT_MS,
            retries: 2,
          }
        );
      }

      console.warn(
        `[Pipeline][${requestId}] ${stageName} chunk "${chunkLabel}" failed with retryable transport error (${errorCode || errorMessage}). Splitting chunk for recovery.`
      );
      const smallerChunks = splitChunkForRetry(chunkText);
      if (smallerChunks.length > 1) {
        const chunkResults: any[] = [];
        for (let index = 0; index < smallerChunks.length; index += 1) {
          chunkResults.push(
            await runStage1ChunkWithAdaptiveRetry(
              requestId,
              debugDir,
              stageName,
              buildPrompt,
              schema,
              smallerChunks[index],
              `${chunkLabel} retry ${depth + 1}.${index + 1}/${smallerChunks.length}`,
              depth + 1
            )
          );
        }
        return mergeStage1FactExtractions(chunkResults);
      }
    }

    if (!isTruncated) {
      throw error;
    }

    const shouldRetrySameChunkWithHigherNumPredict = chunkText.length < 5000;
    if (shouldRetrySameChunkWithHigherNumPredict) {
      console.warn(`[Pipeline][${requestId}] ${stageName} chunk "${chunkLabel}" truncated at prompt length under 5000. Retrying same chunk with higher num_predict.`);
      return await runStage(
        requestId,
        debugDir,
        `${stageName} - High Output Retry`,
        buildPrompt(chunkText, chunkLabel),
        schema,
        {
          numPredict: 4096,
          timeoutMs: OLLAMA_TIMEOUT_MS,
          retries: 1,
        }
      );
    }

    if (depth >= MAX_CHUNK_SPLIT_DEPTH) {
      console.warn(`[Pipeline][${requestId}] ${stageName} chunk "${chunkLabel}" hit max split depth. Retrying same chunk once with higher num_predict.`);
      return await runStage(
        requestId,
        debugDir,
        `${stageName} - Max Depth Retry`,
        buildPrompt(chunkText, chunkLabel),
        schema,
        {
          numPredict: 4096,
          timeoutMs: OLLAMA_TIMEOUT_MS,
          retries: 1,
        }
      );
    }

    const smallerChunks = splitChunkForRetry(chunkText);
    if (smallerChunks.length <= 1) {
      return await runStage(
        requestId,
        debugDir,
        `${stageName} - Fallback Retry`,
        buildPrompt(chunkText, chunkLabel),
        schema,
        {
          numPredict: 4096,
          timeoutMs: OLLAMA_TIMEOUT_MS,
          retries: 1,
        }
      );
    }

    console.warn(`[Pipeline][${requestId}] ${stageName} chunk "${chunkLabel}" truncated. Retrying with ${smallerChunks.length} smaller chunks at depth ${depth + 1}/${MAX_CHUNK_SPLIT_DEPTH}.`);
    const results = [];
    for (let index = 0; index < smallerChunks.length; index += 1) {
      results.push(await runStage1ChunkWithAdaptiveRetry(
        requestId,
        debugDir,
        `${stageName} - Retry ${depth + 1}`,
        buildPrompt,
        schema,
        smallerChunks[index],
        `${chunkLabel}.${index + 1}`,
        depth + 1
      ));
    }
    return mergeStage1FactExtractions(results);
  }
}

async function runStage6CompetencyExtractionWithFallback(
  requestId: string,
  debugDir: string,
  extractionRules: string,
  structurePayload: any,
  sourceText: string,
  competencySchema: any
) {
  const buildStage6Prompt = (stageName: string, payload: any, stageSourceText: string) =>
    renderPrompt("competency-extraction.md", {
      EXTRACTION_RULES: extractionRules,
      STAGE_NAME: stageName,
      STAGE_PAYLOAD_JSON: serializeJson(payload),
      SOURCE_TEXT: stageSourceText,
    });

  const fullPrompt = buildStage6Prompt(STAGE_ORDER[5], structurePayload, sourceText);

  try {
    return await runStage(requestId, debugDir, STAGE_ORDER[5], fullPrompt, competencySchema);
  } catch (error: any) {
    const isTruncated =
      String(error?.code || "") === "OLLAMA_OUTPUT_TRUNCATED" ||
      String(error?.message || "").includes("Model output truncated");
    if (!isTruncated) {
      throw error;
    }

    const classes = structurePayload?.classes || [];
    if (classes.length <= 1) {
      throw error;
    }

    console.warn(
      `[Pipeline][${requestId}] ${STAGE_ORDER[5]} truncated. Retrying with ${classes.length} class-scoped competency prompts.`
    );

    const competencyGroups: any[] = [];
    for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
      const cls = classes[classIndex];
      const classStageName = `${STAGE_ORDER[5]} - ${cls?.class_name || `Class ${classIndex + 1}`}`;
      const classPayload = buildSlimStructurePayload([cls]);
      const classSourceText = extractRelevantClassSourceText(sourceText, cls, 8000);
      const classPrompt = buildStage6Prompt(classStageName, classPayload, classSourceText);
      const classResult = await runStage(
        requestId,
        debugDir,
        classStageName,
        classPrompt,
        competencySchema,
        {
          numPredict: Math.min(4096, OLLAMA_NUM_PREDICT),
          timeoutMs: OLLAMA_TIMEOUT_MS,
          retries: 1,
        }
      );
      competencyGroups.push(...(classResult?.competency_groups || []));
    }

    return {
      competency_groups: competencyGroups,
    };
  }
}

async function runStage<T>(requestId: string, debugDir: string, stageName: string, prompt: string, schema: T, options?: OllamaRequestOptions): Promise<T> {
  console.log(`[Pipeline][${requestId}] ${stageName} started`);
  await writeDebugFile(debugDir, `${safeStageName(stageName)}.prompt.txt`, prompt);
  const stageResult = await generateWithOllama(requestId, debugDir, stageName, prompt, schema, options);
  console.log(`[Pipeline][${requestId}] ${stageName} prompt length: ${stageResult.promptLength}`);
  console.log(`[Pipeline][${requestId}] ${stageName} output length: ${stageResult.outputLength}`);
  console.log(`[Pipeline][${requestId}] ${stageName} done_reason: ${stageResult.doneReason}`);
  console.log(`[Pipeline][${requestId}] ${stageName} num_predict: ${stageResult.numPredict}`);
  const responseText = stageResult.text;
  console.log(`[Pipeline][${requestId}] ${stageName} content length before JSON.parse: ${responseText.length}`);
  console.log(`[Pipeline][${requestId}] ${stageName} extracted JSON length: ${responseText.length}`);
  let parsed: T;
  let valid = true;
  try {
    const validation = validateStageOutput<T>(stageName, responseText);
    if (validation.sanitized?.changed) {
      console.warn(
        `[Pipeline][${requestId}] ${stageName} JSON sanitizer modified response. Fixes: ${JSON.stringify(validation.sanitized.fixes)}`
      );
      await writeDebugFile(
        debugDir,
        `${safeStageName(stageName)}.sanitized.json.txt`,
        validation.sanitized.text
      );
    }
    parsed = validation.parsed;
    valid = validation.valid;
  } catch (_error: any) {
    if (stageResult.doneReason === "length") {
      throw new OllamaRequestError(
        `Model output truncated during ${stageName}. Returned JSON was incomplete or invalid.`,
        {
          code: "OLLAMA_OUTPUT_TRUNCATED",
          retryable: false,
          stageName,
          promptLength: stageResult.promptLength,
          timeoutMs: options?.timeoutMs || getStageRequestOptions(stageName).timeoutMs || OLLAMA_TIMEOUT_MS,
        }
      );
    }
    throw _error;
  }
  if (stageResult.doneReason === "length" && !valid) {
    throw new OllamaRequestError(
      `Model output truncated during ${stageName}. Returned JSON was missing required data.`,
      {
        code: "OLLAMA_OUTPUT_TRUNCATED",
        retryable: false,
        stageName,
        promptLength: stageResult.promptLength,
        timeoutMs: options?.timeoutMs || getStageRequestOptions(stageName).timeoutMs || OLLAMA_TIMEOUT_MS,
      }
    );
  }
  const finalJson = JSON.stringify(parsed);
  console.log(`[Pipeline][${requestId}] ${stageName} final JSON length: ${finalJson.length}`);
  await writeDebugFile(debugDir, `${safeStageName(stageName)}.parsed.json`, parsed);
  console.log(`[Pipeline][${requestId}] ${stageName} completed`);
  return parsed;
}

// Ollama chat API call with retry logic and detailed logging
async function generateWithOllama(
  requestId: string,
  debugDir: string,
  stageName: string,
  prompt: string,
  schema?: any,
  options?: OllamaRequestOptions
): Promise<OllamaStageResult> {
  const resolvedOptions = {
    ...getStageRequestOptions(stageName),
    ...(options || {}),
  };
  let attempt = 0;
  let delay = 1000;
  const retries = Math.max(1, resolvedOptions.retries || 1);
  const defaultOllamaConfig = getOllamaConfig("default");
  const baseUrl = resolvedOptions.baseUrl || defaultOllamaConfig.baseUrl;
  const model = resolvedOptions.model || defaultOllamaConfig.model;
  const timeoutMs = resolvedOptions.timeoutMs || OLLAMA_TIMEOUT_MS;
  const numPredict = resolvedOptions.numPredict || OLLAMA_NUM_PREDICT;
  while (attempt < retries) {
    try {
      const schemaHint = schema
        ? `Return valid JSON only. Match this target schema shape exactly:\n${JSON.stringify(schema, null, 2)}`
        : "Return valid JSON only with no markdown fences or extra commentary.";
      const fullPrompt = [prompt, schemaHint].filter(Boolean).join("\n\n");

      const requestUrl = `${baseUrl}/api/chat`;
      console.log(`[Ollama][${requestId}][${stageName}] Sending request to: ${requestUrl}`);
      console.log(`[Ollama][${requestId}][${stageName}] Model: ${model}`);
      console.log(`[Ollama][${requestId}][${stageName}] Prompt length: ${fullPrompt.length} characters`);
      console.log(`[Ollama][${requestId}][${stageName}] Timeout: ${timeoutMs}ms`);
      console.log(`[Ollama][${requestId}][${stageName}] Attempt: ${attempt + 1}/${retries}`);
      console.log(`[Ollama][${requestId}][${stageName}] num_predict: ${numPredict}`);

      const requestBody = {
        model,
        stream: false,
        think: false,
        format: schema || "json",
        options: {
          temperature: 0.1,
          num_predict: numPredict,
        },
        messages: [
          {
            role: "system",
            content: "Return only valid JSON that matches the requested schema. Do not include markdown or explanations.",
          },
          {
            role: "user",
            content: fullPrompt,
          },
        ],
      };

      await writeDebugFile(
        debugDir,
        `${safeStageName(stageName)}.attempt-${attempt + 1}.chat.request.json`,
        requestBody
      );

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      let ollamaResponse: Response;
      try {
        ollamaResponse = await fetch(requestUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } catch (error: any) {
        if (controller.signal.aborted) {
          throw new OllamaRequestError(
            `Ollama request timed out after ${timeoutMs}ms during ${stageName}. Try a smaller curriculum input, chunked extraction, or increase OLLAMA_TIMEOUT_MS.`,
            {
              code: "ABORT_ERR",
              retryable: false,
              stageName,
              promptLength: fullPrompt.length,
              timeoutMs,
            }
          );
        }

        const code = String(error?.code || error?.cause?.code || "");
        const message = String(error?.message || "Ollama request failed.");
        const retryable = isRetryableOllamaError(error);
        throw new OllamaRequestError(message, {
          code: code || "FETCH_FAILED",
          retryable,
          stageName,
          promptLength: fullPrompt.length,
          timeoutMs,
        });
      } finally {
        clearTimeout(timeoutHandle);
      }

      console.log(`[Ollama][${requestId}][${stageName}] Response status: ${ollamaResponse.status} ${ollamaResponse.statusText}`);

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        await writeDebugFile(debugDir, `${safeStageName(stageName)}.attempt-${attempt + 1}.chat.error.txt`, errorText);
        console.error(`[Ollama][${requestId}][${stageName}] Error response body: ${errorText}`);
        throw new Error(`Ollama request failed with status ${ollamaResponse.status}: ${errorText}`);
      }

      const data = await ollamaResponse.json();
      await writeDebugFile(debugDir, `${safeStageName(stageName)}.attempt-${attempt + 1}.chat.raw.json`, data);
      const responseText = data?.message?.content || data?.response || "";
      const thinkingText =
        data?.message?.thinking ||
        data?.thinking ||
        data?.message?.reasoning ||
        data?.reasoning ||
        "";
      const responseLength = data?.response?.length || 0;
      const messageContentLength = data?.message?.content?.length || 0;
      const thinkingLength = thinkingText.length || 0;
      const reasoningLength = data?.message?.reasoning?.length || data?.reasoning?.length || 0;
      console.log(`[Ollama][${requestId}][${stageName}] Full /api/chat response: ${JSON.stringify(data)}`);
      console.log(`[Ollama][${requestId}][${stageName}] Response keys: ${Object.keys(data || {}).join(", ")}`);
      console.log(`[Ollama][${requestId}][${stageName}] Field lengths -> response: ${responseLength}, message.content: ${messageContentLength}, message.thinking: ${thinkingLength}, reasoning: ${reasoningLength}`);
      await writeDebugFile(debugDir, `${safeStageName(stageName)}.attempt-${attempt + 1}.chat.message-content.txt`, responseText);
      await writeDebugFile(debugDir, `${safeStageName(stageName)}.attempt-${attempt + 1}.chat.message-thinking.txt`, thinkingText);
      console.log(`[Ollama][${requestId}][${stageName}] ${stageName} raw content length: ${responseText.length}`);

      const doneReason = data?.done_reason || "";
      console.log(`[Ollama][${requestId}][${stageName}] done_reason: ${doneReason}`);

      if (!responseText.trim()) {
        if (thinkingText.trim()) {
          console.error(`[Ollama][${requestId}][${stageName}] Output contained reasoning but no JSON content.`);
          throw new Error("Ollama returned reasoning in message.thinking but no final JSON in message.content.");
        }
        console.error(`[Ollama][${requestId}][${stageName}] Empty /api/chat message.content payload.`);
        throw new Error("Ollama returned an empty chat response body.");
      }

      if (doneReason === "length") {
        return {
          text: responseText,
          doneReason,
          numPredict,
          outputLength: responseText.length,
          promptLength: fullPrompt.length,
        };
      }

      const extracted = extractJsonText(responseText);
      await writeDebugFile(debugDir, `${safeStageName(stageName)}.attempt-${attempt + 1}.chat.extracted.json.txt`, extracted);
      console.log(`[Ollama][${requestId}][${stageName}] Parsed response length: ${extracted.length}`);
      return {
        text: extracted,
        doneReason,
        numPredict,
        outputLength: responseText.length,
        promptLength: fullPrompt.length,
      };
    } catch (error: any) {
      attempt++;
      console.error(`[Ollama][${requestId}][${stageName}] Error on attempt ${attempt}/${retries}: ${error?.message || error}`);
      if (error?.cause) console.error(`[Ollama][${requestId}][${stageName}] Error cause:`, error.cause);
      if (error?.code) console.error(`[Ollama][${requestId}][${stageName}] Error code: ${error.code}`);
      console.error(`[Ollama][${requestId}][${stageName}] Clear reason: stage="${stageName}" model="${model}" timeoutMs=${timeoutMs} promptLength=${error?.promptLength || prompt.length}`);

      const isTransient = Boolean(error?.retryable ?? isRetryableOllamaError(error));
      if (isTransient && attempt < retries) {
        console.warn(`[Ollama][${requestId}][${stageName}] Transient error. Retrying attempt ${attempt}/${retries} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = delay * 2;
      } else {
        console.error(`[Ollama][${requestId}][${stageName}] Non-retryable error or max retries reached. Throwing...`);
        throw error;
      }
    }
  }
  throw new Error("All retries exhausted.");
}

// ======== API ROUTES ========

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running"
  });
});

app.get("/api/health", (_req, res) => {
  const defaultOllamaConfig = getOllamaConfig("default");
  res.json({ status: "ok", ollama: defaultOllamaConfig.baseUrl, model: defaultOllamaConfig.model });
});

app.get("/api/curriculums", async (_req, res) => {
  try {
    await connectToMongo();
    const curriculums = await CurriculumModel.find()
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, curriculums });
  } catch (error: any) {
    if (isMongoUnavailableError(error)) {
      logMongoUnavailable("Curriculums", error);
      return sendMongoUnavailable(res, "Saved curriculums are unavailable because MongoDB is not connected.");
    }
    console.error("[Curriculums] List failed:", error);
    res.status(500).json({ error: error?.message || "Failed to load saved curriculums." });
  }
});

app.get("/api/curriculums/:id", async (req, res) => {
  try {
    await connectToMongo();
    const curriculum = await CurriculumModel.findOne({ _id: req.params.id }).lean();
    if (!curriculum) {
      return res.status(404).json({ error: "Curriculum not found." });
    }
    res.json({ success: true, curriculum });
  } catch (error: any) {
    if (isMongoUnavailableError(error)) {
      logMongoUnavailable("Curriculums", error);
      return sendMongoUnavailable(res, "Saved curriculums are unavailable because MongoDB is not connected.");
    }
    console.error("[Curriculums] Fetch failed:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch curriculum." });
  }
});

app.patch("/api/curriculums/:id", async (req, res) => {
  const { extractedCurriculum, fileName, sourceText } = req.body || {};
  if (!extractedCurriculum) {
    return res.status(400).json({ error: "extractedCurriculum is required." });
  }

  try {
    await connectToMongo();
    const curriculum = await CurriculumModel.findOne({ _id: req.params.id });
    if (!curriculum) {
      return res.status(404).json({ error: "Curriculum not found." });
    }

    curriculum.extractedCurriculum = extractedCurriculum;
    curriculum.subject = extractedCurriculum?.subject || curriculum.subject;
    curriculum.gradeLevel = extractedCurriculum?.gradeLevel || curriculum.gradeLevel;
    if (typeof fileName === "string") {
      curriculum.fileName = fileName;
    }
    if (typeof sourceText === "string") {
      curriculum.sourceText = sourceText;
    }
    curriculum.extractionMetadata = {
      ...(curriculum.extractionMetadata || {}),
      manuallyEdited: true,
      lastManualEditAt: new Date().toISOString(),
    };
    await curriculum.save();

    const workspace = await syncPlanningWorkspaceAfterCurriculumChange(
      String(curriculum._id),
      extractedCurriculum
    );

    res.json({
      success: true,
      curriculumId: String(curriculum._id),
      curriculum,
      workspaceId: String(workspace._id),
      workspace,
    });
  } catch (error: any) {
    console.error("[Curriculums] Update failed:", error);
    res.status(500).json({ error: error?.message || "Failed to update curriculum." });
  }
});

app.get("/api/planning-workspaces/:id", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }
    res.json({ success: true, workspace: await hydrateWorkspacePptMaterials(workspace) });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Fetch failed:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch planning workspace." });
  }
});

app.get("/api/planning-workspaces/by-curriculum/:curriculumId", async (req, res) => {
  try {
    await connectToMongo();
    const workspace = await PlanningWorkspaceModel.findOne({ curriculumId: req.params.curriculumId })
      .sort({ updatedAt: -1 })
      .lean();
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found for this curriculum." });
    }
    res.json({ success: true, workspace: await hydrateWorkspacePptMaterials(workspace) });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Fetch by curriculum failed:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch planning workspace." });
  }
});

app.post("/api/planning-workspaces", async (req, res) => {
  const { curriculumId } = req.body;
  if (!curriculumId) {
    return res.status(400).json({ error: "curriculumId is required." });
  }

  try {
    const curriculumRecord = await loadCurriculumRecordById(curriculumId);
    if (!curriculumRecord) {
      return res.status(404).json({ error: "Curriculum not found." });
    }

    const workspace = await ensurePlanningWorkspaceForCurriculum(
      String(curriculumRecord._id),
      curriculumRecord.extractedCurriculum
    );
    res.status(201).json({ success: true, workspaceId: String(workspace._id), workspace });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Create failed:", error);
    res.status(500).json({ error: error?.message || "Failed to create planning workspace." });
  }
});

app.patch("/api/planning-workspaces/:id", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }

    const allowedFields = [
      "phase",
      "status",
      "curriculumApproval",
      "academicConfig",
      "termPlan",
      "teachingStrategy",
      "sessionPlanningDefaults",
      "sessionAllocation",
      "generationScope",
      "generatedArtifacts",
      "revisionState",
    ];

    for (const field of allowedFields) {
      if (field in req.body) {
        (workspace as any)[field] = req.body[field];
      }
    }

    await workspace.save();
    res.json({ success: true, workspace });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Update failed:", error);
    res.status(500).json({ error: error?.message || "Failed to update planning workspace." });
  }
});

app.post("/api/planning-workspaces/:id/approve-curriculum", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }

    const notes = String(req.body?.notes || "");
    workspace.curriculumApproval = {
      ...(workspace.curriculumApproval || {}),
      approved: true,
      approvedAt: new Date().toISOString(),
      notes,
    };
    workspace.phase = "course_planning";
    workspace.status = "in_progress";
    await workspace.save();

    res.json({ success: true, workspace });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Curriculum approval failed:", error);
    res.status(500).json({ error: error?.message || "Failed to approve curriculum." });
  }
});

app.post("/api/planning-workspaces/:id/recommend-course-plan", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }
    if (!workspace.curriculumApproval?.approved) {
      return res.status(400).json({ error: "Approve the curriculum before requesting a course plan." });
    }

    const normalizedStructure = workspace.curriculumSnapshot?.normalizedStructure;
    if (!normalizedStructure) {
      return res.status(400).json({ error: "No normalized curriculum structure available for planning." });
    }

    const academicConfig = workspace.academicConfig || {};
    const preferredTermCount = Number(req.body?.preferredTermCount || 0) || undefined;
    const classTermPlans = (normalizedStructure?.classes || []).length > 1
      ? normalizedStructure.classes.map((cls: any) => ({
          class_name: cls?.class_name || "",
          ...buildTermDivision(
            {
              ...normalizedStructure,
              classes: [cls],
            },
            preferredTermCount
          ),
        }))
      : [{
          class_name: normalizedStructure?.classes?.[0]?.class_name || "",
          ...buildTermDivision(normalizedStructure, preferredTermCount),
        }];

    const rawRecommendations = classTermPlans.flatMap((plan: any) =>
      flattenTermDivisionToRows(plan).map((row: any) => ({
        className: row.className || "",
        termName: row.term,
        termNumber: row.termNumber ?? null,
        chapters: row.chapters || [],
        marks: row.marks || 0,
        reasoning: row.marks > 0
          ? "Balanced using curriculum structure, unit coverage, and marks distribution."
          : "Balanced using curriculum structure and chapter coverage.",
        sourceEstimatedSessions: row.sourceEstimatedSessions || 0,
        sourceTopicCount: row.sourceTopicCount || 0,
      }))
    );
    const recommendations = estimateRecommendedAllocationSessions(
      rawRecommendations,
      academicConfig,
      classTermPlans[0]?.term_count || preferredTermCount || 1
    );

    workspace.termPlan = {
      approved: false,
      recommendedTermCount: classTermPlans[0]?.term_count || preferredTermCount || null,
      recommendations,
      allocations: [],
    };
    await workspace.save();

    res.json({
      success: true,
      workspace,
      class_term_plans: classTermPlans,
      recommendations,
    });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Course plan recommendation failed:", error);
    res.status(500).json({ error: error?.message || "Failed to build course plan recommendations." });
  }
});

app.post("/api/planning-workspaces/:id/approve-course-plan", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }

    if (!workspace.curriculumApproval?.approved) {
      return res.status(400).json({ error: "Approve the curriculum before approving the course plan." });
    }

    const academicConfig = workspace.academicConfig || {};
    const hasAcademicSetup = Boolean(
      academicConfig.academicYear ||
      academicConfig.school ||
      academicConfig.board ||
      academicConfig.subject ||
      academicConfig.className
    );

    if (!hasAcademicSetup) {
      return res.status(400).json({
        error: "Add and save the academic configuration before approving the course plan.",
      });
    }

    const allocations = Array.isArray(workspace.termPlan?.allocations)
      ? workspace.termPlan.allocations
      : [];

    if (allocations.length === 0) {
      return res.status(400).json({
        error: "Select or save at least one term allocation before approving the course plan.",
      });
    }

    const allocationValidation = validateTermAllocations(allocations);
    if (!allocationValidation.valid) {
      return res.status(400).json({
        error: allocationValidation.issues[0] || "Saved term allocations are invalid.",
        issues: allocationValidation.issues,
      });
    }

    workspace.termPlan = {
      ...(workspace.termPlan || {}),
      approved: true,
      allocations,
    };
    workspace.phase = "session_planning";
    workspace.status = "in_progress";
    await workspace.save();

    res.json({ success: true, workspace });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Course plan approval failed:", error);
    res.status(500).json({ error: error?.message || "Failed to approve the course plan." });
  }
});

app.patch("/api/planning-workspaces/:id/session-strategy", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }

    workspace.teachingStrategy = req.body?.teachingStrategy || {};
    workspace.sessionPlanningDefaults = req.body?.sessionPlanningDefaults || {};
    workspace.phase = "session_planning";
    workspace.status = "in_progress";
    await workspace.save();

    res.json({ success: true, workspace });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Session strategy save failed:", error);
    res.status(500).json({ error: error?.message || "Failed to save the session planning strategy." });
  }
});

app.get("/api/planning-workspaces/:id/session-allocation", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }

    res.json({
      success: true,
      sessionAllocation: workspace.sessionAllocation || {},
      teachingStrategy: workspace.teachingStrategy || {},
      sessionPlanningDefaults: workspace.sessionPlanningDefaults || {},
    });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Session allocation fetch failed:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch the session allocation." });
  }
});

app.post("/api/planning-workspaces/:id/recommend-session-allocation", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }
    if (!workspace.termPlan?.approved) {
      return res.status(400).json({ error: "Approve the course plan before generating session allocations." });
    }

    const savedAllocations = Array.isArray(workspace.termPlan?.allocations) ? workspace.termPlan.allocations : [];
    if (savedAllocations.length === 0) {
      return res.status(400).json({ error: "Save at least one approved course-plan allocation first." });
    }

    const termGroups = buildSavedTermGroups(savedAllocations);
    const requestedTermKey = String(req.body?.selectedTermKey || workspace.sessionAllocation?.selectedTermKey || "");
    const selectedTermKey = requestedTermKey && termGroups.has(requestedTermKey)
      ? requestedTermKey
      : [...termGroups.keys()][0];
    const selectedRows = termGroups.get(selectedTermKey) || [];

    if (selectedRows.length === 0) {
      return res.status(400).json({ error: "No approved term allocation was found for session planning." });
    }

    const chapterNames = Array.from(
      new Set(
        selectedRows.flatMap((row: any) =>
          (Array.isArray(row?.chapters) ? row.chapters : [])
            .map((chapter: string) => String(chapter || "").trim())
            .filter(Boolean)
        )
      )
    );

    if (chapterNames.length === 0) {
      return res.status(400).json({ error: "The selected term does not contain any chapters to allocate." });
    }

    const annualCapacity = estimateAnnualSubjectSessionCapacity(workspace.academicConfig || {});
    const totalPlanMarks = savedAllocations.reduce((sum: number, row: any) => sum + toNumberOrZero(row?.marks), 0);
    const selectedTermMarks = selectedRows.reduce((sum: number, row: any) => sum + toNumberOrZero(row?.marks), 0);
    const evenTermCapacity = Math.max(1, Math.round(annualCapacity.annualSubjectSessions / Math.max(1, termGroups.size)));
    const weightedTermCapacity = totalPlanMarks > 0 && selectedTermMarks > 0
      ? Math.max(1, Math.round(annualCapacity.annualSubjectSessions * (selectedTermMarks / totalPlanMarks)))
      : evenTermCapacity;
    const termCapacity = Math.min(annualCapacity.annualSubjectSessions, weightedTermCapacity);

    const recommendationsBase = chapterNames.map((chapterName, index) => {
      const insight = findNormalizedChapterInsight(workspace.curriculumSnapshot?.normalizedStructure, chapterName);
      const sourceRow = selectedRows.find((row: any) => (row?.chapters || []).includes(chapterName));
      const marksShare = sourceRow?.chapters?.length
        ? toNumberOrZero(sourceRow?.marks) / sourceRow.chapters.length
        : 0;
      return {
        id: `${selectedTermKey}::${index + 1}`,
        className: selectedRows[0]?.className || "",
        termName: selectedRows[0]?.termName || selectedRows[0]?.term || "",
        termNumber: selectedRows[0]?.termNumber ?? null,
        chapterName,
        unitName: sourceRow?.unitName || "Whole Term",
        sequence: index + 1,
        sourceTopicCount: insight.topicCount,
        sourceEstimatedSessions: insight.estimatedSessions,
        marksShare,
      };
    });

    const weights = recommendationsBase.map((item) =>
      Math.max(
        1,
        toNumberOrZero(item.sourceEstimatedSessions) +
        Math.max(1, toNumberOrZero(item.sourceTopicCount)) +
        Math.max(0, item.marksShare)
      )
    );
    const durationMinutes = Math.max(
      30,
      toNumberOrZero(workspace.sessionPlanningDefaults?.sessionDurationMinutes) ||
      toNumberOrZero(workspace.academicConfig?.periodDurationMinutes) ||
      45
    );
    const recommendations = distributeIntegerSessions(termCapacity, weights).map((estimatedSessions, index) => {
      const base = recommendationsBase[index];
      return {
        ...base,
        recommendedSessions: estimatedSessions,
        adjustedSessions: null,
        estimatedSessions,
        estimatedMinutes: estimatedSessions * durationMinutes,
        rationale: `Allocated ${estimatedSessions} sessions using the selected term's capacity, chapter topic density, source pacing, and marks balance.`,
        reasoning: `Allocated ${estimatedSessions} sessions using the selected term's capacity, chapter topic density, source pacing, and marks balance.`,
      };
    });

    const selectedTermSummary = {
      className: selectedRows[0]?.className || "",
      termName: selectedRows[0]?.termName || selectedRows[0]?.term || "",
      termNumber: selectedRows[0]?.termNumber ?? null,
      chapterCount: chapterNames.length,
      marks: selectedTermMarks,
      totalRows: selectedRows.length,
    };
    const validation = validateSessionAllocationState(workspace, {
      selectedTermSummary,
      allocations: recommendations,
    });

    workspace.phase = "session_planning";
    workspace.status = "in_progress";
    workspace.sessionAllocation = {
      approved: false,
      approvedAt: null,
      selectedTermKey,
      selectedTermSummary,
      recommendations,
      allocations: [],
      validation,
    };
    await workspace.save();

    res.json({
      success: true,
      workspace,
      annualCapacity: annualCapacity.annualSubjectSessions,
      termCapacity,
      selectedTermKey,
      recommendations,
    });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Session allocation recommendation failed:", error);
    res.status(500).json({ error: error?.message || "Failed to build session allocation recommendations." });
  }
});

app.patch("/api/planning-workspaces/:id/session-allocation", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }

    const allocations = Array.isArray(req.body?.allocations) ? req.body.allocations : [];
    const selectedTermKey = String(req.body?.selectedTermKey || workspace.sessionAllocation?.selectedTermKey || "");
    const selectedTermSummary = req.body?.selectedTermSummary || workspace.sessionAllocation?.selectedTermSummary || null;
    const validation = validateSessionAllocationState(workspace, {
      selectedTermSummary,
      allocations,
    });

    workspace.phase = "session_planning";
    workspace.status = "in_progress";
    workspace.sessionAllocation = {
      ...(workspace.sessionAllocation || {}),
      approved: false,
      approvedAt: null,
      selectedTermKey,
      selectedTermSummary,
      allocations,
      validation,
    };
    await workspace.save();

    res.json({ success: true, workspace, validation });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Session allocation save failed:", error);
    res.status(500).json({ error: error?.message || "Failed to save the session allocation." });
  }
});

app.post("/api/planning-workspaces/:id/approve-session-allocation", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }

    const validation = validateSessionAllocationState(workspace);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.issues[0] || "Fix the session allocation before approval.",
        validation,
      });
    }

    workspace.sessionAllocation = {
      ...(workspace.sessionAllocation || {}),
      approved: true,
      approvedAt: new Date().toISOString(),
      validation,
    };
    workspace.phase = "content_generation";
    workspace.status = "in_progress";
    await workspace.save();

    res.json({ success: true, workspace, validation });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Session allocation approval failed:", error);
    res.status(500).json({ error: error?.message || "Failed to approve the session allocation." });
  }
});

app.post("/api/planning-workspaces/:id/generate-content", async (req, res) => {
  try {
    const workspace = await loadPlanningWorkspaceById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Planning workspace not found." });
    }
    if (!workspace.sessionAllocation?.approved) {
      return res.status(400).json({ error: "Approve the Phase 3 session allocation before generating content." });
    }

    const sessionNumber = Math.max(1, toNumberOrZero(req.body?.sessionNumber) || 1);
    const roadmapSessionNumber = Math.max(1, toNumberOrZero(req.body?.roadmapSessionNumber) || sessionNumber);
    const chapterName = String(req.body?.chapterName || "").trim();
    const totalSessions = Math.max(1, toNumberOrZero(req.body?.totalSessions) || 1);
    const durationMinutes = Math.max(
      30,
      toNumberOrZero(req.body?.durationMinutes) ||
      toNumberOrZero(workspace.sessionPlanningDefaults?.sessionDurationMinutes) ||
      toNumberOrZero(workspace.academicConfig?.periodDurationMinutes) ||
      45
    );
    if (!chapterName) {
      return res.status(400).json({ error: "chapterName is required for session generation." });
    }

    const selectedSections = normalizeSessionSections(req.body?.selectedSections);
    const assessmentCustomization = normalizeAssessmentCustomization(req.body?.assessmentCustomization);
    const pptGenerationOptions = normalizeSessionPptGenerationOptions(req.body?.pptGenerationOptions);
    const generatedSessionKey = String(roadmapSessionNumber);
    const existingGeneratedSessions = typeof workspace.generationScope?.generatedSessions === "object" && workspace.generationScope?.generatedSessions
      ? workspace.generationScope.generatedSessions
      : {};
    const existingSessionPlan = existingGeneratedSessions?.[generatedSessionKey];
    const assessmentOnly = selectedSections.length === 1 && selectedSections[0] === "assessment";

    if (assessmentOnly) {
      if (!hasAssessmentSourceContent(existingSessionPlan)) {
        return res.status(400).json({ error: "Generate session teaching content first before creating the assessment." });
      }
      if (!hasAssessmentCustomizationContent(assessmentCustomization)) {
        return res.status(400).json({ error: "Add at least one assessment question type with marks before generating the assessment." });
      }
    }

    const config = {
      includeLearningOutcomes: true,
      includeIntroduction: true,
      includeTheory: true,
      includeAssessments: workspace.sessionPlanningDefaults?.includeFormativeAssessment ?? true,
      includeAssignments: false,
      includeNotes: workspace.sessionPlanningDefaults?.includeTeacherNotes ?? true,
    };

    const sessionPlan = await generateSessionDetailsArtifact({
      subject: String(workspace.curriculumSnapshot?.subject || workspace.academicConfig?.subject || ""),
      gradeLevel: String(workspace.curriculumSnapshot?.gradeLevel || workspace.academicConfig?.className || ""),
      selectedChapters: [chapterName],
      sessionNumber,
      totalSessions,
      durationMinutes,
      config,
      selectedSections,
      sessionTitle: String(req.body?.sessionTitle || chapterName || `Session ${sessionNumber}`),
      learningOutcomes: Array.isArray(req.body?.learningOutcomes) ? req.body.learningOutcomes : [],
      previousSessionContext: String(req.body?.previousSessionContext || "").trim(),
      teachingStrategy: workspace.teachingStrategy || {},
      sessionPlanningDefaults: workspace.sessionPlanningDefaults || {},
      assessmentCustomization,
      pptGenerationOptions,
      sourceSessionPlan: assessmentOnly ? existingSessionPlan : null,
    });
    const mergedSessionPlan = {
      id: existingSessionPlan?.id || `session-${generatedSessionKey}`,
      sessionNumber: existingSessionPlan?.sessionNumber || roadmapSessionNumber,
      title: existingSessionPlan?.title || String(req.body?.sessionTitle || `${chapterName} - Session ${roadmapSessionNumber}`),
      duration: existingSessionPlan?.duration || durationMinutes,
      ...mergeSessionPlanSections(existingSessionPlan, sessionPlan, selectedSections),
    };
    workspace.generationScope = {
      ...(workspace.generationScope || {}),
      generatedSessions: {
        ...existingGeneratedSessions,
        [generatedSessionKey]: mergedSessionPlan,
      },
    };

    const nextArtifact = {
      id: `session-${generatedSessionKey}`,
      scope: "session",
      artifactType: "session_bundle",
      title: `${chapterName} - Session ${roadmapSessionNumber}`,
      status: "generated",
      updatedAt: new Date().toISOString(),
    };
    const existingArtifacts = Array.isArray(workspace.generatedArtifacts) ? workspace.generatedArtifacts : [];
    workspace.generatedArtifacts = [
      ...existingArtifacts.filter((artifact: any) => artifact?.id !== nextArtifact.id),
      nextArtifact,
    ];
    workspace.phase = "content_generation";
    workspace.status = "in_progress";
    await workspace.save();

    const responseWorkspace = await hydrateWorkspacePptMaterials(workspace);

    res.json({
      success: true,
      sessionPlan: mergedSessionPlan,
      generatedSessionKey,
      selectedSections,
      workspace: responseWorkspace,
    });
  } catch (error: any) {
    console.error("[PlanningWorkspaces] Content generation failed:", error);
    res.status(500).json({ error: error?.message || "Failed to generate session content." });
  }
});

app.post("/api/export-pptx", async (req, res) => {
  try {
    const rawPpt = req.body?.ppt;
    const requestId = makeRequestId("export-pptx");
    const debugDir = await ensureDebugDir(requestId);
    const ppt = await normalizePptMaterial(rawPpt, {
      subject: req.body?.subject,
      gradeLevel: req.body?.gradeLevel,
      sessionTitle: String(req.body?.sessionTitle || rawPpt?.presentationTitle || rawPpt?.title || "Session Presentation"),
      requestId,
      debugDir,
    });
    if (!ppt || typeof ppt !== "object" || !Array.isArray(ppt.slides) || ppt.slides.length === 0) {
      return res.status(400).json({ error: "A generated PPT payload with slides is required." });
    }

    const sessionTitle = String(req.body?.sessionTitle || ppt.presentationTitle || ppt.title || "session-presentation");
    const sessionNumber = Math.max(1, toNumberOrZero(req.body?.sessionNumber) || 1);
    const buffer = await buildEditablePptxBufferFromMaterial(ppt, {
      sessionTitle,
      sessionNumber,
    });
    const fileName = `${slugifyFileNamePart(sessionTitle)}-session-${sessionNumber}.pptx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error: any) {
    console.error("[PPTX Export] Export failed:", error);
    res.status(500).json({ error: error?.message || "Failed to export PPTX." });
  }
});

app.post("/api/curriculums", async (req, res) => {
  try {
    await connectToMongo();
    const curriculum = await CurriculumModel.create(req.body);
    res.status(201).json({ success: true, curriculumId: curriculum._id, curriculum });
  } catch (error: any) {
    console.error("[Curriculums] Create failed:", error);
    res.status(500).json({ error: error?.message || "Failed to save curriculum." });
  }
});

app.delete("/api/curriculums/:id", async (req, res) => {
  try {
    await connectToMongo();
    const deleted = await CurriculumModel.findOneAndDelete({ _id: req.params.id }).lean();
    if (!deleted) {
      return res.status(404).json({ error: "Curriculum not found." });
    }
    await PlanningWorkspaceModel.deleteMany({ curriculumId: req.params.id });
    res.json({ success: true, curriculumId: req.params.id });
  } catch (error: any) {
    console.error("[Curriculums] Delete failed:", error);
    res.status(500).json({ error: error?.message || "Failed to delete curriculum." });
  }
});

app.post("/api/analyze-curriculum", async (req, res) => {
  const { text, fileName = "", schemaVersion: requestedSchemaVersion } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "No curriculum text provided." });
  }
  const requestIdHeader = req.headers["x-debug-request-id"];
  const requestId = typeof requestIdHeader === "string" && requestIdHeader.trim()
    ? requestIdHeader
    : makeRequestId("analyze-curriculum");
  const debugDir = await ensureDebugDir(requestId);
  const sourceText = String(text);
  const schemaVersion = normalizeSchemaVersion(requestedSchemaVersion);
  const detectedProfile = detectCurriculumProfile(sourceText, fileName);
  const profileConfig = getCurriculumProfileConfig(detectedProfile.profile);
  const isPdfUpload = String(fileName).toLowerCase().endsWith(".pdf");
  const looksLikeMarkdown =
    /^\s*#\s+Page\s+\d+/m.test(sourceText) ||
    /^\s*##\s+/m.test(sourceText) ||
    /^\s*-\s+/m.test(sourceText);
  console.log(`[Request][${requestId}] /api/analyze-curriculum started`);
  console.log(`[Request][${requestId}] File name: ${fileName || "(none)"}`);
  console.log(`[Request][${requestId}] Source text length: ${sourceText.length}`);
  console.log(`[Request][${requestId}] Schema version: ${schemaVersion}`);
  console.log(`[Request][${requestId}] Curriculum profile: ${detectedProfile.profile} (${detectedProfile.confidence})`);
  console.log(`[Request][${requestId}] PDF upload detected: ${isPdfUpload ? "yes" : "no"}`);
  console.log(`[Request][${requestId}] Source text looks like markdown: ${looksLikeMarkdown ? "yes" : "no"}`);
  if (isPdfUpload && looksLikeMarkdown) {
    console.log(`[Request][${requestId}] Using PDF->Markdown converted source text for curriculum extraction.`);
  }
  console.log(`[Request][${requestId}] Source text preview (first 2000 chars):\n${sourceText.slice(0, 2000)}`);
  await writeDebugFile(debugDir, "request-body.json", req.body);
  await writeDebugFile(debugDir, "source-text.txt", sourceText);
  await writeDebugFile(debugDir, "detected-profile.json", {
    schema_version: schemaVersion,
    curriculum_profile: detectedProfile.profile,
    profile_confidence: detectedProfile.confidence,
    profile_reasons: detectedProfile.reasons,
    expected_structure_type: profileConfig.expectedStructureType,
  });
  if (isPdfUpload && looksLikeMarkdown) {
    await writeDebugFile(debugDir, "source-text.md", sourceText);
  }
  try {
    const stage1FactsSchema = {
      document_metadata: {
        board: "",
        subject: "",
        class: "",
        grade: "",
        stream: "",
        academic_year: "",
        total_pages: "",
      },
      classes: [{
        class_name: "",
        subject: "",
        part_or_section: "",
      }],
      units: [{
        class_name: "",
        subject: "",
        part_or_section: "",
        unit_id: "U1",
        unit_name: "Unit heading from source",
        marks: null,
        topics: [""],
        subtopics: [""],
        key_concepts: [""],
      }],
      chapters: [{
        class_name: "",
        subject: "",
        part_or_section: "",
        unit_id: "U1",
        unit_name: "Unit heading from source",
        chapter_name: "",
        marks: null,
        topics: [""],
        subtopics: [""],
        key_concepts: [""],
      }],
      ...profileConfig.stage1SchemaExtension,
    };

    const extractionRules = `Extraction-first architecture is mandatory.
Complete stages strictly in this order:
${STAGE_ORDER.join("\n")}

Rules:
- explicit curriculum structure is the source of truth
- do not invent unit names or chapter names
- do not perform analysis during extraction stages
- no recommendations outside Stage 6
- return JSON only`;
    const profileSpecificRules = [
      `- Detected curriculum profile: ${detectedProfile.profile}`,
      `- Expected structure type: ${profileConfig.expectedStructureType}`,
      ...profileConfig.extraRules,
    ].join("\n");
    const buildStage1Prompt = (sourceText: string, chunkLabel?: string) => renderPrompt("curriculum-extraction.md", {
      STAGE_NAME: STAGE_ORDER[0],
      EXTRACTION_RULES: `${extractionRules}\n${profileSpecificRules}`,
      CHUNK_RULE: chunkLabel ? `- This is partial curriculum input for ${chunkLabel}; extract only what is present in this chunk` : "",
      SOURCE_TEXT: sourceText,
    });

    const initialStage1ChunkCount = text.length > 15000 ? getAdaptiveStage1ChunkCount(text.length) : 1;
    let stage1Facts: any;
    if (initialStage1ChunkCount === 1) {
      try {
        const stage1Prompt = buildStage1Prompt(text);
        stage1Facts = await runStage(
          requestId,
          debugDir,
          STAGE_ORDER[0],
          stage1Prompt,
          stage1FactsSchema,
          {
            numPredict: OLLAMA_STAGE1_NUM_PREDICT,
            timeoutMs: OLLAMA_TIMEOUT_MS,
            retries: 1,
          }
        );
      } catch (error: any) {
        if (!shouldUseChunkedStage1Fallback(error, text)) {
          throw error;
        }

        console.warn(`[Pipeline][${requestId}] ${STAGE_ORDER[0]} switching to chunked fallback after timeout/header failure.`);
        const chunks = buildAdaptiveStage1Chunks(text, 2);
        console.warn(`[Pipeline][${requestId}] ${STAGE_ORDER[0]} chunk count: ${chunks.length}`);
        await writeDebugFile(debugDir, "stage-1-chunks.json", {
          chunkCount: chunks.length,
          chunkLengths: chunks.map((chunk, index) => ({ index: index + 1, length: chunk.length })),
        });

        const chunkExtractions: any[] = [];
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
          const chunkStageName = `${STAGE_ORDER[0]} - Chunk ${chunkIndex + 1}/${chunks.length}`;
          const chunkExtraction = await runStage1ChunkWithAdaptiveRetry(
            requestId,
            debugDir,
            chunkStageName,
            buildStage1Prompt,
            stage1FactsSchema,
            chunks[chunkIndex],
            `chunk ${chunkIndex + 1} of ${chunks.length}`
          );
          chunkExtractions.push(chunkExtraction);
        }

        stage1Facts = mergeStage1FactExtractions(chunkExtractions);
        await writeDebugFile(debugDir, `${safeStageName(STAGE_ORDER[0])}.chunked-merged.parsed.json`, stage1Facts);
      }
    } else {
      const chunks = buildAdaptiveStage1Chunks(text, initialStage1ChunkCount);
      console.warn(`[Pipeline][${requestId}] ${STAGE_ORDER[0]} chunk count: ${chunks.length}`);
      await writeDebugFile(debugDir, "stage-1-chunks.json", {
        chunkCount: chunks.length,
        chunkLengths: chunks.map((chunk, index) => ({ index: index + 1, length: chunk.length })),
      });

      const chunkExtractions: any[] = [];
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
        const chunkStageName = `${STAGE_ORDER[0]} - Chunk ${chunkIndex + 1}/${chunks.length}`;
        const chunkExtraction = await runStage1ChunkWithAdaptiveRetry(
          requestId,
          debugDir,
          chunkStageName,
          buildStage1Prompt,
          stage1FactsSchema,
          chunks[chunkIndex],
          `chunk ${chunkIndex + 1} of ${chunks.length}`
        );
        chunkExtractions.push(chunkExtraction);
      }

      stage1Facts = mergeStage1FactExtractions(chunkExtractions);
      await writeDebugFile(debugDir, `${safeStageName(STAGE_ORDER[0])}.chunked-merged.parsed.json`, stage1Facts);
    }

    const mergedStage1UnitCount = (stage1Facts?.units || []).length;
    const mergedStage1ChapterCount = (stage1Facts?.chapters || []).length;
    const mergedStage1ClassCount = (stage1Facts?.classes || []).length;
    const detectedSubject = canonicalizeSubjectName(stage1Facts?.document_metadata?.subject || stage1Facts?.classes?.[0]?.subject || "");
    const initialChunkCount = initialStage1ChunkCount;
    if (mergedStage1UnitCount === 0 && mergedStage1ChapterCount === 0) {
      console.warn(
        `[Pipeline][${requestId}] Stage 1 merge returned empty extraction | subject="${detectedSubject}" | class="${stage1Facts?.document_metadata?.class || ""}" | sourceLength=${text.length} | chunkCount=${initialChunkCount}`
      );
      if (isLanguageSubject(detectedSubject)) {
        const languageFallback = buildLanguageFallbackStage1Facts(text, stage1Facts);
        if (languageFallback.fallbackApplied) {
          console.warn(
            `[Pipeline][${requestId}] Language fallback applied | subject="${detectedSubject}" | recoveredUnits=${languageFallback.fallbackUnitsCount}`
          );
          stage1Facts = {
            ...stage1Facts,
            classes: languageFallback.classes,
            units: languageFallback.units,
            chapters: languageFallback.chapters,
          };
        } else {
          throw new Error(
            `Stage 1 extraction returned no units or chapters, and language fallback could not recover structure. Subject="${detectedSubject}" class="${stage1Facts?.document_metadata?.class || ""}" sourceLength=${text.length} chunkCount=${initialChunkCount}.`
          );
        }
      } else {
        throw new Error(
          `Stage 1 extraction returned no units or chapters. Empty LLM extraction for subject="${detectedSubject}" class="${stage1Facts?.document_metadata?.class || ""}" sourceLength=${text.length} chunkCount=${initialChunkCount}.`
        );
      }
    }

    await writeDebugFile(debugDir, `${safeStageName(STAGE_ORDER[0])}.facts.parsed.json`, stage1Facts);
    const rawExtraction = expandStage1FactsToRawExtraction(stage1Facts);
    let faithfulStructure = buildFaithfulStructureFromRawExtraction(rawExtraction);
    if (detectedProfile.profile === "cbse_unit_topic" || detectedProfile.profile === "cbse_unit_chapter_topic") {
      faithfulStructure = cleanupCbseStructure(faithfulStructure);
    }
    await writeDebugFile(debugDir, "faithful-structure.parsed.json", faithfulStructure);
    const faithfulWarnings = collectFaithfulStructureWarnings(faithfulStructure);
    await writeDebugFile(debugDir, "faithful-structure-warnings.json", faithfulWarnings);
    if (faithfulWarnings.length) {
      console.warn(`[Pipeline][${requestId}] Faithful structure warnings: ${JSON.stringify(faithfulWarnings)}`);
    }
    const rawClasses = rawExtraction.classes || [];
    const documentHierarchy = buildDocumentStructureHierarchy(rawExtraction);
    await writeDebugFile(debugDir, `${safeStageName(STAGE_ORDER[1])}.parsed.json`, documentHierarchy);
    const approvedHierarchy = buildApprovedTheoryHierarchy(rawExtraction, documentHierarchy);
    await writeDebugFile(debugDir, "approved-hierarchy.parsed.json", approvedHierarchy);
    console.log(`[Pipeline][${requestId}] raw extracted units count: ${rawClasses.reduce((sum: number, cls: any) => sum + ((cls?.units || []).length), 0)}`);
    console.log(`[Pipeline][${requestId}] approved theory units count: ${(approvedHierarchy?.classes || []).reduce((sum: number, cls: any) => sum + ((cls?.units || []).length), 0)}`);
    console.log(`[Pipeline][${requestId}] practical items count: ${(approvedHierarchy?.practicals || []).length}`);
    console.log(`[Pipeline][${requestId}] formative refs count: ${(approvedHierarchy?.formative_content_refs || []).length}`);
    console.log(`[Pipeline][${requestId}] ignored appendix items count: ${(approvedHierarchy?.ignored_items || []).length}`);

    const hierarchyClasses = approvedHierarchy.classes || [];
    const enrichedClasses: any[] = [];
    const enrichedClassMap = new Map<string, any>();

    for (let classIndex = 0; classIndex < hierarchyClasses.length; classIndex += 1) {
      const enrichmentResult = await normalizeClassTheory(
        requestId,
        debugDir,
        classIndex,
        hierarchyClasses[classIndex] || {},
        text
      );
      const rawClass = (hierarchyClasses[classIndex] || {}) as any;
      const classKey = buildCanonicalClassKey(rawClass?.class_name || "");
      const enrichedClass = {
        class_name: canonicalizeClassName(rawClass?.class_name || ""),
        subject: canonicalizeSubjectName(rawClass?.subject || ""),
        part_or_section: rawClass?.part_or_section || "",
        canonical_class_key: classKey,
        units: enrichmentResult?.units || [],
        formative_content_refs: enrichmentResult?.formative_content_refs || [],
        validation_report: enrichmentResult?.validation_report || {},
      };
      enrichedClasses.push(enrichedClass);
      enrichedClassMap.set(classKey, enrichedClass);
    }

    const nodeEnrichment = {
      classes: enrichedClasses,
      formative_content: approvedHierarchy.formative_content_refs || rawExtraction.formative_only_content || [],
      excluded_content: rawExtraction.assessment_information?.excluded_or_non_assessed_content || [],
      teacher_notes: rawExtraction.assessment_information?.teacher_notes || [],
    };
    await writeDebugFile(debugDir, `${safeStageName(STAGE_ORDER[2])}.parsed.json`, nodeEnrichment);

    const enforcedNormalizedClasses = buildNormalizedTeachingBlocks(
      hierarchyClasses,
      hierarchyClasses,
      enrichedClassMap,
      stage1Facts.units || [],
      stage1Facts.chapters || []
    );

    let normalizedStructure: any = {
      document_metadata: rawExtraction.document_metadata || {},
      source_hierarchy: documentHierarchy,
      classes: enforcedNormalizedClasses,
      practicals: approvedHierarchy.practicals || rawExtraction.practicals || [],
      activities: rawExtraction.activities || [],
      projects: rawExtraction.projects || [],
      assessment_information: rawExtraction.assessment_information || {},
      teacher_notes: nodeEnrichment.teacher_notes || rawExtraction.assessment_information?.teacher_notes || [],
      excluded_content: nodeEnrichment.excluded_content || rawExtraction.assessment_information?.excluded_or_non_assessed_content || [],
      validation_report: {
        structural_source_of_truth_enforced: true,
        suspicious_chapter_names: uniqueStrings(enforcedNormalizedClasses.flatMap((cls: any) => cls?.validation_report?.suspicious_chapter_names || [])),
        long_chapter_names_reclassified: uniqueStrings(enforcedNormalizedClasses.flatMap((cls: any) => cls?.validation_report?.long_chapter_names_reclassified || [])),
      },
    };
    if (detectedProfile.profile === "cbse_unit_topic" || detectedProfile.profile === "cbse_unit_chapter_topic") {
      normalizedStructure = cleanupCbseStructure(normalizedStructure);
    }
    await writeDebugFile(debugDir, `${safeStageName(STAGE_ORDER[3])}.parsed.json`, normalizedStructure);
    const hierarchyComparison = buildHierarchyComparisonReport(faithfulStructure, normalizedStructure);
    await writeDebugFile(debugDir, "hierarchy-comparison.parsed.json", hierarchyComparison);
    console.log(`[Pipeline][${requestId}] Faithful/planning hierarchy comparison: ${JSON.stringify(hierarchyComparison.totals)}`);
    const validationReport = await validateNormalizedStructure(requestId, debugDir, text, normalizedStructure, rawExtraction);
    const profileWarnings = [...faithfulWarnings];
    if (detectedProfile.profile === "cbse_unit_topic") {
      const suspiciousFallbacks = (normalizedStructure.classes || []).flatMap((cls: any) =>
        (cls.units || []).flatMap((unit: any) =>
          (unit.chapters || []).filter((chapter: any) => chapter?.source_type === "unit_fallback").map((chapter: any) => `${cls.class_name}::${unit.unit_name}::${chapter.chapter_name}`)
        )
      );
      if (suspiciousFallbacks.length) {
        profileWarnings.push("Some units were reconstructed because explicit chapter headings were unavailable in the uploaded document.");
      }
    }
    if (detectedProfile.profile === "multi_class_board_syllabus" && (faithfulStructure.classes || []).length < 2) {
      profileWarnings.push("multi_class_board_syllabus detected but fewer than two classes were preserved");
    }
    if (detectedProfile.profile === "term_semester_curriculum" && !/\bsemester\b|\bterm\b/.test(normalizeSourceText(JSON.stringify(stage1Facts || {})))) {
      profileWarnings.push("term_semester_curriculum detected but term/semester entities were not preserved in Stage 1 facts");
    }
    const structureConfidence = Math.max(
      0.35,
      Math.min(
        0.99,
        detectedProfile.confidence - (profileWarnings.length * 0.06) - ((validationReport.invalid_chapters || []).length * 0.04)
      )
    );
    const fallbacksUsed = uniqueStrings([
      ...(isPdfUpload && looksLikeMarkdown ? ["pdf_to_markdown"] : []),
      ...((normalizedStructure.classes || []).flatMap((cls: any) =>
        (cls.units || []).flatMap((unit: any) =>
          (unit.chapters || []).some((chapter: any) => chapter?.source_type === "unit_fallback") ? ["reconstructed_chapter_headings"] : []
        )
      )),
    ]);
    await writeDebugFile(debugDir, "profile-validation.json", {
      curriculum_profile: detectedProfile.profile,
      profile_confidence: detectedProfile.confidence,
      structure_confidence: structureConfidence,
      warnings: uniqueStrings(profileWarnings.map(buildPublicWarningMessage).filter(Boolean)),
      fallbacks_used: uniqueStrings(fallbacksUsed.map(buildPublicFallbackLabel).filter(Boolean)),
    });
    const statistics = computeCurriculumStatistics(normalizedStructure);
    await writeDebugFile(debugDir, "statistics.parsed.json", statistics);

    const mergedNormalizedClasses = normalizedStructure.classes || [];
    const stage1UnitCount = mergedNormalizedClasses.reduce((acc: number, cls: any) => acc + (cls.units?.length || 0), 0);
    const stage1ChapterCount = mergedNormalizedClasses.reduce(
      (acc: number, cls: any) => acc + (cls.units || []).reduce((inner: number, unit: any) => inner + (unit.chapters?.length || 0), 0),
      0
    );
    console.log(`[Pipeline][${requestId}] Normalized unit count: ${stage1UnitCount}`);
    console.log(`[Pipeline][${requestId}] Normalized chapter count: ${stage1ChapterCount}`);
    if (stage1UnitCount === 0 || stage1ChapterCount === 0) {
      throw new Error(
        `Normalized structure is insufficient. Units: ${stage1UnitCount}, Chapters: ${stage1ChapterCount}, Subject: "${detectedSubject}", Class: "${stage1Facts?.document_metadata?.class || ""}", SourceLength: ${text.length}, ChunkCount: ${initialChunkCount}.`
      );
    }

    const competencySchema = {
      competency_groups: [{
        code: "",
        title: "",
        description: "",
        competencies: [""],
        unit_name: "",
        chapter_name: "",
      }],
    };

    const structurePayload = buildSlimStructurePayload(normalizedStructure.classes || []);

    const competencies = await runStage6CompetencyExtractionWithFallback(
      requestId,
      debugDir,
      extractionRules,
      structurePayload,
      text,
      competencySchema
    );

    const assessmentSchema = {
      assessment_framework: {
        marks_distribution: [""],
        question_paper_design: [""],
        competency_weightage: [""],
        bloom_levels: [""],
        internal_assessment: [""],
        practical_assessment: [""],
        project_assessment: [""],
      },
    };

    const stage7Prompt = renderPrompt("assessment-extraction.md", {
      EXTRACTION_RULES: extractionRules,
      STAGE_NAME: STAGE_ORDER[6],
      STAGE_PAYLOAD_JSON: serializeJson(structurePayload),
      SOURCE_TEXT: text,
    });

    const assessment = await runStage(requestId, debugDir, STAGE_ORDER[6], stage7Prompt, assessmentSchema);
    normalizedStructure.assessment_information = assessment.assessment_framework || {};

    const outcomesSchema = {
      learning_outcomes: [{
        unit_name: "",
        chapter_name: "",
        topic: "",
        outcomes: [""],
      }],
    };

    const stage8Payloads = [
      { stageName: "Stage 8A - Class XI", payload: buildStage8PayloadForClass("Class XI", normalizedStructure.classes || [], competencies.competency_groups || []) },
      { stageName: "Stage 8B - Class XII", payload: buildStage8PayloadForClass("Class XII", normalizedStructure.classes || [], competencies.competency_groups || []) },
    ].filter((entry) => Boolean(entry.payload));

    const stage8Results: any[] = [];
    for (const entry of stage8Payloads) {
      const payload = entry.payload as any;
      const payloadText = serializeJson(payload);
      const unitsCount = (payload?.units || []).length;
      const chaptersCount = (payload?.chapters || []).length;
      const competenciesCount = (payload?.competencies || []).length;
      console.log(`[Pipeline][${requestId}] ${entry.stageName} payload size before request: ${payloadText.length} characters`);
      console.log(`[Pipeline][${requestId}] ${entry.stageName} units count: ${unitsCount}`);
      console.log(`[Pipeline][${requestId}] ${entry.stageName} chapters count: ${chaptersCount}`);
      console.log(`[Pipeline][${requestId}] ${entry.stageName} competencies count: ${competenciesCount}`);

      const stage8Prompt = renderPrompt("learning-outcomes-extraction.md", {
        EXTRACTION_RULES: extractionRules,
        STAGE_NAME: entry.stageName,
        STAGE_PAYLOAD_JSON: payloadText,
      });
      stage8Results.push(await runStage(requestId, debugDir, entry.stageName, stage8Prompt, outcomesSchema));
    }

    const outcomes = {
      learning_outcomes: stage8Results.flatMap((result: any) => result?.learning_outcomes || []),
    };
    await writeDebugFile(debugDir, `${safeStageName(STAGE_ORDER[7])}.parsed.json`, outcomes);

    const activitySchema = {
      activities: [{
        type: "activity",
        title: "",
        unit_name: "",
        chapter_name: "",
        details: "",
      }],
      projects: [{
        title: "",
        unit_name: "",
        chapter_name: "",
        details: "",
      }],
      practicals: [{
        title: "",
        unit_name: "",
        chapter_name: "",
        details: "",
      }],
    };

    const stage9Prompt = renderPrompt("activities-extraction.md", {
      EXTRACTION_RULES: extractionRules,
      STAGE_NAME: STAGE_ORDER[8],
      STAGE_PAYLOAD_JSON: serializeJson(structurePayload),
      SOURCE_TEXT: text,
    });

    const activities = await runStage(requestId, debugDir, STAGE_ORDER[8], stage9Prompt, activitySchema);
    normalizedStructure.activities = activities.activities || [];
    normalizedStructure.projects = activities.projects || [];
    normalizedStructure.practicals = activities.practicals || [];

    const intelligenceSchema = {
      dependency_graph: [{
        topic: "",
        prerequisites: [""],
        dependent_topics: [""],
      }],
      lesson_planning_intelligence: [{
        unit_name: "",
        chapter_name: "",
        difficulty_level: "",
        concept_density: "",
        estimated_teaching_hours: "",
        estimated_sessions: "",
        practical_requirement: "",
        assessment_requirement: "",
      }],
      validation_report: {
        structural_source_of_truth_enforced: true,
        invalid_unit_names: [""],
        invalid_chapter_names: [""],
      },
    };

    const stage10Prompt = renderPrompt("curriculum-intelligence.md", {
      EXTRACTION_RULES: extractionRules,
      STAGE_NAME: STAGE_ORDER[9],
      NORMALIZED_STRUCTURE_JSON: serializeJson(structurePayload),
      COMPETENCIES_JSON: serializeJson(competencies),
      ASSESSMENT_JSON: serializeJson(assessment),
      OUTCOMES_JSON: serializeJson(outcomes),
      ACTIVITIES_JSON: serializeJson(activities),
    });

    const intelligence = await runStage(requestId, debugDir, STAGE_ORDER[9], stage10Prompt, intelligenceSchema);

    const flattenedOutcomes = uniqueStrings(
      (outcomes.learning_outcomes || []).flatMap((item: any) => item.outcomes || [])
    );

    const classNames = uniqueStrings(
      mergedNormalizedClasses.map((cls: any) => canonicalizeClassName(cls?.class_name || "")).filter(Boolean)
    );
    const units = mergedNormalizedClasses.flatMap((cls: any, classIndex: number) =>
      (cls.units || []).map((unit: any, unitIndex: number) => ({
        unitId: unit.unit_id || buildStableUnitId(cls?.class_name || "", cls?.subject || "", `U${classIndex + 1}-${unitIndex + 1}`, unitIndex),
        unitName: unit.unit_name,
        className: cls.class_name || "",
        description: uniqueStrings((unit.chapters || []).map((chapter: any) => chapter.chapter_name)).join(", "),
        topics: uniqueStrings(
          (unit.chapters || []).flatMap((chapter: any) => [
            ...(chapter.topics || []),
            ...(chapter.subtopics || []),
          ])
        ),
      }))
    );

    const normalizedMetadata = (normalizedStructure.document_metadata || {}) as Record<string, any>;
    const rawMetadata = (rawExtraction.document_metadata || {}) as Record<string, any>;
    const subject = normalizedMetadata.subject || rawMetadata.subject || "";
    const resolvedDocumentMetadata = {
      ...normalizedStructure.document_metadata,
      class: classNames.length > 1
        ? classNames.join(", ")
        : classNames[0] || normalizedMetadata.class || rawMetadata.class || "",
      grade: classNames.length > 1 ? "" : (normalizedMetadata.grade || rawMetadata.grade || ""),
    };
    normalizedStructure.document_metadata = resolvedDocumentMetadata;
    const gradeLevel = [
      classNames.length > 1 ? classNames.join(" / ") : classNames[0],
      normalizedMetadata.grade,
      normalizedMetadata.stream,
    ].filter(Boolean).join(" / ") || "";

    const overallDescription = `${statistics.total_units} units, ${statistics.total_chapters} chapters, and ${statistics.total_topics} topics extracted through raw extraction, document-structure hierarchy building, node enrichment, normalized teaching blocks, validation, and statistics generation.`;
    const basePayload = {
      schema_version: schemaVersion,
      curriculum_profile: detectedProfile.profile,
      profile_confidence: detectedProfile.confidence,
      structure_confidence: structureConfidence,
      warnings: uniqueStrings(profileWarnings.map(buildPublicWarningMessage).filter(Boolean)),
      fallbacks_used: uniqueStrings(fallbacksUsed.map(buildPublicFallbackLabel).filter(Boolean)),
      subject,
      gradeLevel,
      overallDescription,
      coreObjectives: flattenedOutcomes.slice(0, 12),
      units,
      faithful_structure: faithfulStructure,
      planning_structure: normalizedStructure,
      normalizedStructure,
      classes: normalizedStructure.classes || [],
      document_metadata: resolvedDocumentMetadata,
      stagedExtraction: {
        rawExtraction,
        faithfulStructure,
        documentHierarchy,
        nodeEnrichment,
        normalizedStructure,
        hierarchyComparison,
        structuralValidation: validationReport,
        statistics,
        competencies,
        assessment,
        learningOutcomes: outcomes,
        activities,
        intelligence,
      },
    };
    const finalPayload = buildVersionedCurriculumPayload(schemaVersion, basePayload, {
      structureType: profileConfig.expectedStructureType,
      terms: (stage1Facts as any)?.terms || [],
      competenciesCatalog: (stage1Facts as any)?.competencies || [],
    });
    await connectToMongo();
    const savedCurriculum = await CurriculumModel.create({
      fileName,
      subject,
      gradeLevel,
      sourceText: text,
      extractedCurriculum: finalPayload,
      extractionMetadata: {
        requestId,
        sourceTextLength: text.length,
        stage1UnitCount,
        stage1ChapterCount,
      },
    });
    const planningWorkspace = await ensurePlanningWorkspaceForCurriculum(
      String(savedCurriculum._id),
      finalPayload
    );
    const responsePayload = {
      success: true,
      curriculumId: String(savedCurriculum._id),
      curriculum: finalPayload,
      workspaceId: String(planningWorkspace._id),
      workspace: planningWorkspace,
    };
    await writeDebugFile(debugDir, "final-response.json", responsePayload);
    console.log(`[Request][${requestId}] Final response JSON length: ${JSON.stringify(responsePayload).length}`);
    res.json(responsePayload);
  } catch (error: any) {
    console.error(`[Request][${requestId}] Curriculum extraction failed:`, error);
    const userFriendlyMessage =
      error instanceof OllamaRequestError
        ? error.message
        : error?.message || "Curriculum extraction failed.";
    await writeDebugFile(debugDir, "error.json", {
      message: userFriendlyMessage,
      stack: error?.stack || "",
      code: error?.code || "",
    });
    res.status(500).json({ error: userFriendlyMessage });
  }
});

app.post("/api/divide-terms", async (req, res) => {
  const { curriculum, termCount, preferred_term_count } = req.body;
  if (!curriculum) {
    return res.status(400).json({ error: "No curriculum structure provided." });
  }
  const requestId = makeRequestId("divide-terms");
  const debugDir = await ensureDebugDir(requestId);
  await writeDebugFile(debugDir, "request-body.json", req.body);
  try {
    assertCurriculumReadyForPlanning(curriculum);
    const normalizedStructure = getNormalizedStructureFromCurriculum(curriculum);
    const normalizedClasses = normalizedStructure?.classes || [];
    const classTermPlans = normalizedClasses.length > 1
      ? normalizedClasses.map((cls: any) => {
          const classNormalizedStructure = {
            ...normalizedStructure,
            classes: [cls],
          };
          const classPlan = buildTermDivision(
            classNormalizedStructure,
            preferred_term_count ?? termCount
          );
          return {
            class_name: cls?.class_name || "",
            ...classPlan,
          };
        })
      : [{
          class_name: normalizedClasses[0]?.class_name || "",
          ...buildTermDivision(
            normalizedStructure,
            preferred_term_count ?? termCount
          ),
        }];
    await writeDebugFile(debugDir, "term-division.json", classTermPlans);
    const invalidClassPlans = classTermPlans.filter((plan: any) => !plan.validation.valid);
    if (invalidClassPlans.length) {
      const allErrors = invalidClassPlans.flatMap((plan: any) =>
        (plan.validation.errors || []).map((error: string) => `${plan.class_name || "Unknown Class"}: ${error}`)
      );
      throw new Error(`Term division validation failed: ${allErrors.join(" | ")}`);
    }
    const legacyRows = classTermPlans.flatMap((plan: any) => flattenTermDivisionToRows(plan));
    const totalMarks = classTermPlans.reduce((sum: number, plan: any) => sum + toNumberOrZero(plan?.statistics?.total_marks), 0);
    const responsePayload = {
      class_term_plans: classTermPlans,
      term_count: classTermPlans.length === 1 ? classTermPlans[0].term_count : undefined,
      statistics: {
        total_marks: Number(totalMarks.toFixed(2)),
      },
      rows: legacyRows,
    };
    await writeDebugFile(debugDir, "final-response.json", responsePayload);
    res.json(responsePayload);
  } catch (error: any) {
    console.error(`[Request][${requestId}] Term division failed:`, error);
    res.status(500).json({ error: error?.message || "Term division failed." });
  }
});

app.post("/api/generate-session-details", async (req, res) => {
  const { subject, gradeLevel, selectedChapters, sessionNumber, totalSessions, durationMinutes, config } = req.body;
  const requestId = makeRequestId("generate-session-details");
  const debugDir = await ensureDebugDir(requestId);
  await writeDebugFile(debugDir, "request-body.json", req.body);
  try {
    const prompt = renderPrompt("session-generation.md", {
      SESSION_NUMBER: String(sessionNumber),
      TOTAL_SESSIONS: String(totalSessions),
      DURATION_MINUTES: String(durationMinutes),
      SUBJECT: String(subject || ""),
      GRADE_LEVEL: String(gradeLevel || ""),
      SELECTED_CHAPTERS_JSON: JSON.stringify(selectedChapters),
      INCLUDE_LEARNING_OUTCOMES: config.includeLearningOutcomes ? "YES" : "NO",
      INCLUDE_INTRODUCTION: config.includeIntroduction ? "YES" : "NO",
      INCLUDE_THEORY: config.includeTheory ? "YES" : "NO",
      INCLUDE_ASSESSMENTS: config.includeAssessments ? "YES" : "NO",
      INCLUDE_ASSIGNMENTS: config.includeAssignments ? "YES" : "NO",
      INCLUDE_NOTES: config.includeNotes ? "YES" : "NO",
      SELECTED_SECTIONS_JSON: JSON.stringify(ALL_SESSION_SECTIONS),
    });

    const schema = {
      id: "unique-session-id",
      sessionNumber: sessionNumber,
      title: "Vibrant, educational title for this session",
      duration: durationMinutes,
      teacherLessonNotes: {
        sessionOverview: "Teacher-facing overview of this session",
        prerequisiteKnowledge: ["What students should already know"],
        previousSessionRecap: ["Short recap points from the previous lesson"],
        learningOutcomes: ["Specific session outcome phrased for teacher delivery"],
        teachingPlan: [{
          minutes: 5,
          topic: "Introduction",
          teachingStrategy: "Questioning with simple real-life example"
        }],
        teachingSequence: ["Teacher-facing lesson flow with explanation steps"],
        guidedPractice: ["Teacher-led checks and guided responses"],
        lessonBlocks: [{
          title: "Introduction",
          durationMinutes: 5,
          teacherPrompt: ["Prompt teachers can ask"],
          explanation: ["What the teacher should explain"],
          examples: ["Simple classroom example"],
          boardWork: ["What to write on the board"],
          checkUnderstanding: ["Quick question to ask students"],
          expectedAnswers: ["Expected student answer"],
          activity: ["Optional mini activity"]
        }],
        differentiation: {
          slowLearners: ["Support strategies"],
          averageLearners: ["Core expectations"],
          advancedLearners: ["Extension prompts"]
        },
        teacherTips: ["Pedagogical tips"],
        misconceptions: ["Likely misconceptions to address"],
        commonMisconceptionsDetailed: [{
          misconception: "Common wrong idea",
          correction: "Teacher correction for that misconception"
        }],
        assessmentQuestions: ["Oral or written assessment question"],
        blackboardSummary: ["Key point for board summary"],
        endOfClassRecap: [{
          prompt: "A cell is the ________ unit of life.",
          expectedAnswer: "basic"
        }]
      },
    studentLessonNotes: {
      title: "Student lesson note title",
      sessionOverview: "Simple overview of what this session covers",
      introduction: "Student-friendly introduction",
      learningObjectives: ["After this lesson you will be able to..."],
      quickRecall: ["Short prerequisite revision point"],
      easyToRemember: ["Simple memory line for the concept"],
      comparisonTables: [{
        title: "Comparison table title",
        headers: ["Feature", "Type A", "Type B"],
        rows: [["Example feature", "Example A", "Example B"]]
      }],
      sections: [{
        heading: "Main idea",
        explanation: "Comprehensive but student-friendly explanation",
        keyPoints: ["Revision point"],
        examples: ["Worked example or everyday example"],
        whyItMatters: "Why students should care about this concept",
        terminology: ["Important term"],
        detailedExplanation: "A slightly deeper but student-friendly explanation",
        observedIn: ["Where students observe it"],
        visualSupport: ["Diagram or visual suggestion"],
        visualAssets: [{
          prompt: "Image generation prompt",
          alt: "Student-friendly illustration alt text",
          imageDataUrl: "data:image/png;base64,...",
          mimeType: "image/png",
          model: "runtime image model"
        }],
        importantNotes: ["Exam point or caution note"],
        memoryTechniques: ["Mnemonic or memory tip"],
        conceptSummary: ["One-line takeaway"]
      }],
      definitions: [{ term: "Key term", definition: "Clear definition" }],
      workedExamples: [{
        title: "Worked example title",
        steps: ["Step 1", "Step 2"],
        explanation: "How this example works"
      }],
      revisionSection: {
        definitions: ["Important definition"],
        formulas: ["Useful formula if applicable"],
        facts: ["Important fact"],
        keywords: ["Keyword"],
        conceptMap: ["Concept map cue"],
        quickRecap: ["Fast revision point"]
      },
      selfCheckQuestions: ["Question students can answer independently"],
      quickSummary: ["Short summary point"],
      keyTerms: ["Important keyword"],
      fillInTheBlanks: [{
        prompt: "A ________ is the basic unit of life.",
        answer: "cell"
      }],
      mcqQuestions: [{
        question: "Which organelle controls the cell?",
        options: ["A. Ribosome", "B. Nucleus", "C. Vacuole", "D. Cytoplasm"],
        answer: "B. Nucleus"
      }],
      veryShortAnswerQuestions: [{
        question: "What is a cell?",
        answer: "The basic structural and functional unit of life."
      }],
      didYouKnow: ["Interesting supporting fact"],
      summary: ["Short summary point"],
      quickRevision: ["Revision cue"],
      rememberPoints: ["Cell -> Basic Unit of Life"]
    },
      learningOutcomes: ["Specific action-oriented objectives"],
      introduction: "A exciting 3-5 minute hook, inquiry question, or classroom starter",
      theory: {
        overview: "Plain language conceptual summary",
        keyPoints: ["3-5 fundamental bullet points"],
        detailedContent: "In-depth content discussion with examples"
      },
      activities: [{
        name: "Name of classroom task",
        instructions: ["Step-by-step instructions for teachers & students"],
        durationMinutes: 10
      }],
      materials: {
        ppt: {
          templateId: KAMALANIKETAN_TEMPLATE_ID,
          templateName: "Kamalaniketan Session PPT Template",
          themeId: "kamalaniketan-modern",
          title: "Presentation title",
          presentationTitle: "Presentation title",
          presentationGoal: "What this PPT helps achieve in the session",
          audience: "Grade-specific classroom audience",
          theme: "Visual theme for the deck",
          themeTokens: {
            fonts: { heading: "Outfit", body: "Inter" },
            colors: {
              primary: "#36ADAA",
              secondary: "#1EABDA",
              accent: "#DE8431",
              background: "#EEF4F7",
              surface: "#FFFFFF",
              text: "#0F172A",
              mutedText: "#64748B"
            },
            visualStyle: {
              topBarStyle: "bold color band",
              cardStyle: "rounded modern educator cards",
              visualFrameStyle: "large clean visual panel"
            }
          },
          slides: [{
            templateId: KAMALANIKETAN_TEMPLATE_ID,
            templateSlideKey: "title_identity",
            templateSlideTitle: "Title / Session Identity",
            isOptionalSlotFilled: true,
            slideTitle: "Slide title",
            bulletPoints: ["Key point"]
          }]
        },
        pdf: { documentTitle: "Student PDF / revision document title", keyInformation: ["Student-facing study note or revision point"] },
        docx: { outlineTitle: "Teacher lesson note outline title", sections: ["Teacher-facing section content"] }
      },
      homework: { task: "Interactive or practical homework task", estimatedTimeMinutes: 30 },
      assessment: {
        mcq: [{
          questionSubtype: "mcq",
          question: "MCQ question",
          options: ["A. option", "B. option", "C. option", "D. option"],
          answer: "Correct option",
          explanation: "Why this option is correct",
          marks: 1
        }],
        shortAnswer: [{
          questionSubtype: "shortAnswer",
          question: "Short-answer question",
          answer: "Model short answer",
          expectedLength: "1-2 clear points",
          marks: 2,
          rubric: ["1 mark for first correct point", "1 mark for second correct point"]
        }],
        longAnswer: [{
          questionSubtype: "longAnswer",
          question: "Long-answer question",
          answer: "Model long answer",
          expectedLength: "4-5 well-structured points with explanation",
          marks: 5,
          rubric: ["Marks awarded point-wise", "Credit explanation quality", "Credit labelled example or diagram if relevant"]
        }],
        answerKey: {
          mcq: [{ answer: "Correct option", explanation: "Brief explanation", marks: 1, questionSubtype: "mcq" }],
          shortAnswer: [{ answer: "Point-wise short answer", rubric: ["Point 1", "Point 2"], marks: 2, questionSubtype: "shortAnswer" }],
          longAnswer: [{ answer: "Structured long answer", rubric: ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"], marks: 5, questionSubtype: "longAnswer" }],
          generalMarkingGuidance: [
            "Award marks point-wise for each valid idea.",
            "Accept equivalent scientific wording if the meaning is correct.",
            "For long answers, reward structure, explanation, and relevant examples."
          ]
        }
      },
      assignment: { taskDescription: "Written assignment or project task", rubric: ["Evaluation points/criteria"], answerKey: "Sample answer or response key for teacher reference" }
    };

    const response = await generateWithOllama(requestId, debugDir, "generate-session-details", prompt, schema, {
      ...getOllamaConfig("sessionContent"),
    });
    if (response.doneReason === "length") {
      throw new Error("Model output truncated during generate-session-details. Reduce stage scope or increase num_predict.");
    }
    const parsedSession = JSON.parse(response.text || "{}");
    await writeDebugFile(debugDir, "final-response.json", parsedSession);
    res.json(parsedSession);
  } catch (error: any) {
    console.error(`[Request][${requestId}] Session detail generation failed:`, error);
    res.status(500).json({ error: error?.message || "Session detail generation failed." });
  }
});

async function generateSessionDetailsArtifact({
  subject,
  gradeLevel,
  selectedChapters,
  sessionNumber,
  totalSessions,
  durationMinutes,
  config,
  selectedSections = ALL_SESSION_SECTIONS,
  sessionTitle = "",
  learningOutcomes = [],
  previousSessionContext = "",
  teachingStrategy = {},
  sessionPlanningDefaults = {},
  assessmentCustomization = null,
  pptGenerationOptions = {},
  sourceSessionPlan = null,
}: {
  subject: string;
  gradeLevel: string;
  selectedChapters: string[];
  sessionNumber: number;
  totalSessions: number;
  durationMinutes: number;
  config: any;
  selectedSections?: SessionSectionKey[];
  sessionTitle?: string;
  learningOutcomes?: string[];
  previousSessionContext?: string;
  teachingStrategy?: Record<string, any>;
  sessionPlanningDefaults?: Record<string, any>;
  assessmentCustomization?: SessionAssessmentCustomization | null;
  pptGenerationOptions?: SessionPptGenerationOptions;
  sourceSessionPlan?: Record<string, any> | null;
}) {
  const requestId = makeRequestId("generate-content-session");
  const debugDir = await ensureDebugDir(requestId);
  await writeDebugFile(debugDir, "request-body.json", {
    subject,
    gradeLevel,
    selectedChapters,
    sessionNumber,
    totalSessions,
    durationMinutes,
    config,
    selectedSections,
    sessionTitle,
    learningOutcomes,
    previousSessionContext,
    teachingStrategy,
    sessionPlanningDefaults,
    assessmentCustomization,
    pptGenerationOptions,
    sourceSessionPlan,
  });

  const baseSchema = {
    id: "unique-session-id",
    sessionNumber,
    title: "Vibrant, educational title for this session",
    duration: durationMinutes,
    teacherLessonNotes: {
      sessionOverview: "Teacher-facing overview of this session",
      prerequisiteKnowledge: ["What students should already know"],
      previousSessionRecap: ["Short recap points from the previous lesson"],
      learningOutcomes: ["Specific session outcome phrased for teacher delivery"],
      teachingPlan: [{
        minutes: 5,
        topic: "Introduction",
        teachingStrategy: "Questioning with simple real-life example"
      }],
      lessonPurpose: ["Why this lesson matters"],
      teachingSequence: ["Teacher-facing lesson flow with explanation steps"],
      guidedPractice: ["Teacher-led checks and guided responses"],
      lessonBlocks: [{
        title: "Introduction",
        durationMinutes: 5,
        teacherPrompt: ["Prompt teachers can ask"],
        explanation: ["What the teacher should explain"],
        examples: ["Simple classroom example"],
        boardWork: ["What to write on the board"],
        checkUnderstanding: ["Quick question to ask students"],
        expectedAnswers: ["Expected student answer"],
        activity: ["Optional mini activity"]
      }],
      conceptFlow: [{
        conceptName: "Concept name",
        definition: "Short definition",
        coreExplanation: "Teacher-facing explanation",
        importance: "Why it matters",
        observedIn: ["Where students observe it"],
        whyStudyIt: "Why students study it",
        relationshipWithPrevious: "Connection with previous concepts",
        relationshipWithFuture: "Connection with future learning without teaching it",
        keywords: ["Important keyword"],
        teacherMoves: ["Explain this first"],
        examples: ["Useful example"],
        visuals: ["Suggested visual support"]
      }],
      classroomQuestions: [{
        question: "Teacher question",
        level: "Understanding",
        expectedResponse: "Likely student response",
        answerPoints: ["Point teachers should listen for"]
      }],
      commonMisconceptionsDetailed: [{
        misconception: "Common wrong idea",
        correction: "Teacher correction for that misconception"
      }],
      differentiation: {
        slowLearners: ["Support strategies"],
        averageLearners: ["Core expectations"],
        advancedLearners: ["Extension prompts"]
      },
      teacherTips: ["Pedagogical tips"],
      misconceptions: ["Likely misconceptions to address"],
      formativeChecks: ["Natural formative assessment checkpoint"],
      assessmentQuestions: ["Oral or written assessment question"],
      blackboardSummary: ["Key point for board summary"],
      timePlan: [{
        segment: "Recap",
        minutes: 5,
        purpose: "Refresh prerequisite ideas"
      }],
      sessionSummary: ["Closing recap point"],
      endOfClassRecap: [{
        prompt: "A cell is the ________ unit of life.",
        expectedAnswer: "basic"
      }],
      nextSessionBridge: ["How today connects to the next lesson"]
    },
    studentLessonNotes: {
      title: "Student lesson note title",
      sessionOverview: "Simple overview of what this session covers",
      introduction: "Student-friendly introduction",
      learningObjectives: ["After this lesson you will be able to..."],
      quickRecall: ["Short prerequisite revision point"],
      easyToRemember: ["Simple memory line for the concept"],
      comparisonTables: [{
        title: "Comparison table title",
        headers: ["Feature", "Type A", "Type B"],
        rows: [["Example feature", "Example A", "Example B"]]
      }],
      sections: [{
        heading: "Main idea",
        explanation: "Comprehensive but student-friendly explanation",
        keyPoints: ["Revision point"],
        examples: ["Worked example or everyday example"],
        whyItMatters: "Why students should care about this concept",
        terminology: ["Important term"],
        detailedExplanation: "A slightly deeper but student-friendly explanation",
        observedIn: ["Where students observe it"],
        visualSupport: ["Diagram or visual suggestion"],
        visualAssets: [{
          prompt: "Image generation prompt",
          alt: "Student-friendly illustration alt text",
          imageDataUrl: "data:image/png;base64,...",
          mimeType: "image/png",
          model: "runtime image model"
        }],
        importantNotes: ["Exam point or caution note"],
        memoryTechniques: ["Mnemonic or memory tip"],
        conceptSummary: ["One-line takeaway"]
      }],
      definitions: [{ term: "Key term", definition: "Clear definition" }],
      workedExamples: [{
        title: "Worked example title",
        steps: ["Step 1", "Step 2"],
        explanation: "How this example works"
      }],
      revisionSection: {
        definitions: ["Important definition"],
        formulas: ["Useful formula if applicable"],
        facts: ["Important fact"],
        keywords: ["Keyword"],
        conceptMap: ["Concept map cue"],
        quickRecap: ["Fast revision point"]
      },
      selfCheckQuestions: ["Question students can answer independently"],
      quickSummary: ["Short summary point"],
      keyTerms: ["Important keyword"],
      fillInTheBlanks: [{
        prompt: "A ________ is the basic unit of life.",
        answer: "cell"
      }],
      mcqQuestions: [{
        question: "Which organelle controls the cell?",
        options: ["A. Ribosome", "B. Nucleus", "C. Vacuole", "D. Cytoplasm"],
        answer: "B. Nucleus"
      }],
      veryShortAnswerQuestions: [{
        question: "What is a cell?",
        answer: "The basic structural and functional unit of life."
      }],
      didYouKnow: ["Interesting supporting fact"],
      summary: ["Short summary point"],
      quickRevision: ["Revision cue"],
      rememberPoints: ["Cell -> Basic Unit of Life"]
    },
    learningOutcomes: ["Specific action-oriented objectives"],
    introduction: "A exciting 3-5 minute hook, inquiry question, or classroom starter",
    theory: {
      overview: "Plain language conceptual summary",
      keyPoints: ["3-5 fundamental bullet points"],
      detailedContent: "In-depth content discussion with examples"
    },
    activities: [{
      name: "Name of classroom task",
      instructions: ["Step-by-step instructions for teachers & students"],
      durationMinutes: 10
    }],
    materials: {
      ppt: {
        templateId: KAMALANIKETAN_TEMPLATE_ID,
        templateName: "Kamalaniketan Session PPT Template",
        themeId: "kamalaniketan-modern",
        title: "Presentation title",
        presentationTitle: "Presentation title",
        presentationGoal: "What this PPT helps achieve in the session",
        audience: "Grade-specific classroom audience",
        theme: "Visual theme for the deck",
        themeTokens: {
          fonts: {
            heading: "Outfit",
            body: "Inter"
          },
          colors: {
            primary: "#36ADAA",
            secondary: "#1EABDA",
            accent: "#DE8431",
            background: "#EEF4F7",
            surface: "#FFFFFF",
            text: "#0F172A",
            mutedText: "#64748B"
          },
          visualStyle: {
            topBarStyle: "bold color band",
            cardStyle: "rounded modern educator cards",
            visualFrameStyle: "large clean visual panel"
          }
        },
        assetSearchPlan: {
          preferredSources: ["Internal SVG", "Ollama image model"],
          safeSearch: true,
          licensingNotes: ["Use internally generated images and in-app SVG diagrams only."],
          fallbackStrategy: "Prefer SVG diagrams for concept/process slides and the Ollama image model for all picture-based visuals."
        },
        licenseChecklist: ["Review generated visuals for classroom accuracy before final export."],
        presentationWarnings: ["Do not include untaught future-session content."],
        coverageSummary: {
          learningOutcomesCovered: ["Learning outcome id or text"],
          topicsCovered: ["Topic covered"],
          taughtConceptsCovered: ["Concept covered"],
          omittedContent: []
        },
        slides: [{
          templateId: KAMALANIKETAN_TEMPLATE_ID,
          templateSlideKey: "title_identity",
          templateSlideTitle: "Title / Session Identity",
          isOptionalSlotFilled: true,
          slideNumber: 1,
          slideType: "hook | concept | comparison | process | summary",
          slideTitle: "Slide title",
          learningOutcomeIds: ["LO1"],
          topicCoverage: ["Topic"],
          teacherIntent: "Why this slide exists",
          studentTakeaway: "What students should leave with",
          layout: "Title + 2-column visual explainer",
          bulletPoints: ["Key point"],
          onSlideText: ["Exact concise on-slide text"],
          speakerNotes: ["Teacher delivery cue"],
          visualPlan: "What visual should appear and why",
          assets: [{
            purpose: "Why this asset is needed",
            searchQuery: "ollama image prompt seed",
            sourceSite: "Ollama image model",
            sourceUrl: "",
            licenseType: "Internally generated",
            attributionText: "",
            altText: "Accessible description",
            placementHint: "Right panel / full bleed / inset"
          }],
          svgDiagram: {
            title: "Diagram title",
            type: "flowchart | timeline | labelled diagram | comparison chart",
            instructions: ["How the diagram should communicate the concept"],
            svgCode: "<svg><!-- optional compact svg --></svg>"
          },
          animationHints: ["Reveal arrows step-by-step"],
          timeEstimateMinutes: 5
        }]
      },
      pdf: { documentTitle: "Student PDF / revision document title", keyInformation: ["Student-facing study note or revision point"] },
      docx: { outlineTitle: "Teacher lesson note outline title", sections: ["Teacher-facing section content"] }
    },
    homework: { task: "Interactive or practical homework task", estimatedTimeMinutes: 30 },
    assessment: {
      assessmentMeta: {
        assessmentType: "Mixed formative checks",
        totalMarks: 15,
        totalQuestions: 7,
        durationMinutes: 15,
        preferredDifficulty: "Balanced",
        language: "English",
        paperObjective: "Assess only the taught session content with the requested paper pattern.",
        requestSignature: "stable-customization-signature",
        requestedQuestionTypes: [{
          type: "mcq",
          label: "MCQs",
          questionCount: 4,
          marksEach: 1
        }],
        instructions: ["Answer all questions based only on the concepts taught in this session."]
      },
      blueprint: {
        learningOutcomeCoverage: [{
          outcome: "Learning outcome text",
          questionRefs: ["q1", "q5"]
        }],
        difficultyDistribution: {
          easy: 40,
          medium: 40,
          hard: 20
        },
        bloomsDistribution: {
          recall: 20,
          understanding: 30,
          application: 25,
          analysis: 15,
          evaluation: 10
        },
        questionDistribution: {
          mcq: 4,
          shortAnswer: 2,
          longAnswer: 1
        },
        timeAllocation: [{
          section: "MCQ",
          minutes: 5
        }]
      },
      mcq: [{
        id: "q1",
        questionSubtype: "mcq",
        question: "MCQ question",
        options: ["A. option", "B. option", "C. option", "D. option"],
        answer: "Correct option",
        explanation: "Why this option is correct",
        marks: 1,
        learningOutcomeIds: ["LO1"],
        topicCoverage: ["Topic"],
        difficulty: "easy",
        bloomsLevel: "understanding"
      }],
      shortAnswer: [{
        id: "q5",
        questionSubtype: "shortAnswer",
        question: "Short-answer question",
        answer: "Model short answer",
        expectedLength: "1-2 clear points",
        marks: 2,
        rubric: ["1 mark for first correct point", "1 mark for second correct point"],
        learningOutcomeIds: ["LO1"],
        topicCoverage: ["Topic"],
        difficulty: "medium",
        bloomsLevel: "application"
      }],
      longAnswer: [{
        id: "q7",
        questionSubtype: "longAnswer",
        question: "Long-answer question",
        answer: "Model long answer",
        expectedLength: "4-5 well-structured points with explanation",
        marks: 5,
        rubric: ["Marks awarded point-wise", "Credit explanation quality", "Credit labelled example or diagram if relevant"],
        learningOutcomeIds: ["LO1"],
        topicCoverage: ["Topic"],
        difficulty: "hard",
        bloomsLevel: "analysis"
      }],
      answerKey: {
        mcq: [{ answer: "Correct option", explanation: "Brief explanation", marks: 1, questionSubtype: "mcq" }],
        shortAnswer: [{ answer: "Point-wise short answer", rubric: ["Point 1", "Point 2"], marks: 2, questionSubtype: "shortAnswer" }],
        longAnswer: [{ answer: "Structured long answer", rubric: ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"], marks: 5, questionSubtype: "longAnswer" }],
        generalMarkingGuidance: [
          "Award marks point-wise for each valid idea.",
          "Accept equivalent scientific wording if the meaning is correct.",
          "For long answers, reward structure, explanation, and relevant examples."
        ]
      }
    },
    assignment: { taskDescription: "Written assignment or project task", rubric: ["Evaluation points/criteria"], answerKey: "Sample answer or response key for teacher reference" }
  };

  const teacherNotesOnly = selectedSections.length === 1 && selectedSections[0] === "teacherLessonNotes";
  const studentNotesOnly = selectedSections.length === 1 && selectedSections[0] === "studentLessonNotes";
  const materialsOnly = selectedSections.length === 1 && selectedSections[0] === "materials";
  const homeworkOnly = selectedSections.length === 1 && selectedSections[0] === "homework";
  const assessmentOnly = selectedSections.length === 1 && selectedSections[0] === "assessment";
  if (assessmentOnly && !hasAssessmentSourceContent(sourceSessionPlan)) {
    throw new Error("Generate session teaching content first before creating the assessment.");
  }
  const sessionContextPayload = {
    sessionNumber,
    sessionTitle: sessionTitle || `Session ${sessionNumber}`,
    subject,
    gradeLevel,
    selectedChapters,
    totalSessions,
    durationMinutes,
    learningOutcomes,
    previousSessionContext,
    teachingStrategy,
    sessionPlanningDefaults,
    assessmentCustomization,
    config,
  };
  const assessmentSourcePayload = assessmentOnly
    ? buildAssessmentSourceSessionPayload(sourceSessionPlan, {
        id: `session-${sessionNumber}`,
        sessionNumber,
        title: sessionTitle || `Session ${sessionNumber}`,
        duration: durationMinutes,
        learningOutcomes,
      })
    : sessionContextPayload;
  const derivedAssessmentDuration = Math.max(10, Math.min(30, Math.round(durationMinutes / 3 / 5) * 5 || 15));
  const derivedAssessmentMarks = Math.max(10, Math.min(30, Math.round(durationMinutes / 3)));
  const requestedQuestionTypes = Array.isArray(assessmentCustomization?.questionTypes) ? assessmentCustomization.questionTypes : [];
  const requestedMarksFromQuestionTypes = requestedQuestionTypes.reduce(
    (sum, item) => sum + Number(item.questionCount || 0) * Number(item.marksEach || 0),
    0
  );
  const requestedQuestionsFromQuestionTypes = requestedQuestionTypes.reduce(
    (sum, item) => sum + Number(item.questionCount || 0),
    0
  );
  const assessmentType = String(assessmentCustomization?.assessmentType || "Session assessment");
  const preferredDifficulty = String(assessmentCustomization?.difficulty || teachingStrategy?.targetDifficulty || "Balanced");
  const assessmentLanguage = String(sessionPlanningDefaults?.language || "English");
  const targetBlooms = Array.isArray(teachingStrategy?.bloomsTaxonomyEmphasis)
    ? teachingStrategy.bloomsTaxonomyEmphasis
    : [];
  const requestedTotalMarks = Math.max(1, Number(assessmentCustomization?.totalMarks || requestedMarksFromQuestionTypes || derivedAssessmentMarks));
  const requestedTotalQuestions = Math.max(0, Number(assessmentCustomization?.totalQuestions || requestedQuestionsFromQuestionTypes || 0));
  const assessmentInstructionsPrompt = renderPrompt("assessment-generation.md", {
    SUBJECT: String(subject || ""),
    GRADE_LEVEL: String(gradeLevel || ""),
    SESSION_TITLE: String(sessionTitle || `Session ${sessionNumber}`),
    SESSION_NUMBER: String(sessionNumber),
    TOTAL_SESSIONS: String(totalSessions),
    DURATION_MINUTES: String(durationMinutes),
    SELECTED_CHAPTERS_JSON: JSON.stringify(selectedChapters),
    LEARNING_OUTCOMES_JSON: JSON.stringify(learningOutcomes),
    PREVIOUS_SESSION_CONTEXT: previousSessionContext || "No previous session context provided.",
    LEARNING_PACE: String(teachingStrategy?.pace || "Balanced"),
    TARGET_DIFFICULTY: preferredDifficulty,
    OUTPUT_LANGUAGE: assessmentLanguage,
    ASSESSMENT_TYPE: assessmentType,
    REQUESTED_TOTAL_MARKS: String(requestedTotalMarks),
    REQUESTED_DURATION_MINUTES: String(derivedAssessmentDuration),
    ASSESSMENT_PREFERENCE_JSON: JSON.stringify([]),
    BLOOMS_DISTRIBUTION_JSON: JSON.stringify(targetBlooms),
    REQUESTED_TOTAL_QUESTIONS: String(requestedTotalQuestions),
    REQUESTED_QUESTION_TYPES_JSON: JSON.stringify(requestedQuestionTypes),
    QUESTION_PAPER_OBJECTIVE: String(assessmentCustomization?.paperObjective || "Not specified."),
    TEACHER_ASSESSMENT_REQUEST_JSON: JSON.stringify(assessmentCustomization || {}, null, 2),
    SESSION_JSON: JSON.stringify(assessmentSourcePayload, null, 2),
    ASSESSMENT_SCHEMA_JSON: JSON.stringify({ assessment: baseSchema.assessment }, null, 2),
  });
  const embeddedAssessmentInstructions = [
    "Assessment block rules:",
    "- Use only taught session content.",
    "- Assess each learning outcome intentionally.",
    `- Assessment type: ${assessmentType}.`,
    `- Total marks: ${requestedTotalMarks}.`,
    `- Duration: ${derivedAssessmentDuration} minutes.`,
    `- Preferred difficulty: ${preferredDifficulty}.`,
    `- Language: ${assessmentLanguage}.`,
    `- Requested total questions: ${requestedTotalQuestions}.`,
    `- Requested question type mix: ${JSON.stringify(requestedQuestionTypes)}.`,
    `- Paper objective: ${String(assessmentCustomization?.paperObjective || "Not specified.")}.`,
    "- Match the requested question counts and marks exactly.",
    "- Keep answer-key sections aligned one-to-one with the generated questions.",
    "- Return the assessment block with assessmentMeta, blueprint, mcq, shortAnswer, longAnswer, and answerKey.",
    "- Keep marks and duration exact.",
    "- Progress from easier to harder questions.",
    "- Add learningOutcomeCoverage, difficultyDistribution, bloomsDistribution, questionDistribution, and timeAllocation in blueprint.",
    "- Keep answer keys and rubrics aligned with the generated questions.",
  ].join("\n");
  const prompt = teacherNotesOnly
    ? renderPrompt("teacher-notes-generation.md", {
        SUBJECT: String(subject || ""),
        GRADE_LEVEL: String(gradeLevel || ""),
        SELECTED_CHAPTERS_JSON: JSON.stringify(selectedChapters),
        SESSION_TITLE: String(sessionTitle || `Session ${sessionNumber}`),
        SESSION_NUMBER: String(sessionNumber),
        TOTAL_SESSIONS: String(totalSessions),
        DURATION_MINUTES: String(durationMinutes),
        LEARNING_OUTCOMES_JSON: JSON.stringify(learningOutcomes),
        PREVIOUS_SESSION_CONTEXT: previousSessionContext || "No previous session context provided.",
        TEACHING_STYLE_JSON: JSON.stringify(teachingStrategy?.teachingStyle || []),
        STUDENT_LEVEL: String(teachingStrategy?.studentLevel || "Mixed classroom"),
        LEARNING_PACE: String(teachingStrategy?.pace || "Balanced"),
        TARGET_DIFFICULTY: String(teachingStrategy?.targetDifficulty || "Moderate"),
        ASSESSMENT_PREFERENCE_JSON: JSON.stringify(teachingStrategy?.assessmentPreference || []),
        SPECIAL_INSTRUCTIONS: String(teachingStrategy?.specialInstructions || "None"),
        TEACHING_RESOURCES_JSON: JSON.stringify(teachingStrategy?.teachingResources || []),
        OUTPUT_LANGUAGE: String(sessionPlanningDefaults?.language || "English"),
        READING_LEVEL: String(sessionPlanningDefaults?.readingLevel || "Grade-aligned"),
        RESPONSE_LENGTH: String(sessionPlanningDefaults?.responseLength || "Balanced"),
        CREATIVITY: String(sessionPlanningDefaults?.creativity || "Moderate"),
      })
    : studentNotesOnly
    ? renderPrompt("student-notes-generation.md", {
        SUBJECT: String(subject || ""),
        GRADE_LEVEL: String(gradeLevel || ""),
        SELECTED_CHAPTERS_JSON: JSON.stringify(selectedChapters),
        SESSION_TITLE: String(sessionTitle || `Session ${sessionNumber}`),
        SESSION_NUMBER: String(sessionNumber),
        TOTAL_SESSIONS: String(totalSessions),
        DURATION_MINUTES: String(durationMinutes),
        LEARNING_OUTCOMES_JSON: JSON.stringify(learningOutcomes),
        PREVIOUS_SESSION_CONTEXT: previousSessionContext || "No previous session context provided.",
        LEARNING_PACE: String(teachingStrategy?.pace || "Balanced"),
        TARGET_DIFFICULTY: String(teachingStrategy?.targetDifficulty || "Moderate"),
        OUTPUT_LANGUAGE: String(sessionPlanningDefaults?.language || "English"),
        READING_LEVEL: String(sessionPlanningDefaults?.readingLevel || "Grade-aligned"),
        RESPONSE_LENGTH: String(sessionPlanningDefaults?.responseLength || "Balanced"),
        CREATIVITY: String(sessionPlanningDefaults?.creativity || "Moderate"),
      })
    : materialsOnly
    ? renderPrompt("session-ppt-prompt.md", {
        SUBJECT: String(subject || ""),
        GRADE_LEVEL: String(gradeLevel || ""),
        SESSION_TITLE: String(sessionTitle || `Session ${sessionNumber}`),
        SESSION_NUMBER: String(sessionNumber),
        TOTAL_SESSIONS: String(totalSessions),
        DURATION_MINUTES: String(durationMinutes),
        LEARNING_OUTCOMES_JSON: JSON.stringify(learningOutcomes),
        PREVIOUS_SESSION_CONTEXT: previousSessionContext || "No previous session context provided.",
        LEARNING_PACE: String(teachingStrategy?.pace || "Balanced"),
        TARGET_DIFFICULTY: String(teachingStrategy?.targetDifficulty || "Moderate"),
        TEACHING_STYLE_JSON: JSON.stringify(teachingStrategy?.teachingStyle || []),
        TEACHING_RESOURCES_JSON: JSON.stringify(teachingStrategy?.teachingResources || []),
        OUTPUT_LANGUAGE: String(sessionPlanningDefaults?.language || "English"),
        READING_LEVEL: String(sessionPlanningDefaults?.readingLevel || "Grade-aligned"),
        RESPONSE_LENGTH: String(sessionPlanningDefaults?.responseLength || "Balanced"),
        CREATIVITY: String(sessionPlanningDefaults?.creativity || "Moderate"),
        SELECTED_CHAPTERS_JSON: JSON.stringify(selectedChapters),
        SESSION_JSON: JSON.stringify(sessionContextPayload, null, 2),
        SLIDE_CONFIG_JSON: JSON.stringify({
          templateId: pptGenerationOptions?.pptTemplateId || "academic-split",
          templateDeck: "Kamalaniketan-pptx template.pptx",
          fixedSlideCount: KAMALANIKETAN_TEMPLATE_SLIDES.length,
          canonicalSlideSequence: KAMALANIKETAN_TEMPLATE_SLIDES,
          themeMode: "themeable_system",
          defaultThemeId: "cbse-academic-blue",
          selectedTemplateId: pptGenerationOptions?.pptTemplateId || "academic-split",
          selectedThemeId: pptGenerationOptions?.pptThemeId || "cbse-academic-blue",
          availableTemplates: Object.values(PPT_TEMPLATE_PRESETS),
          availableThemes: Object.values(PPT_THEME_PRESETS).map((preset) => ({
            themeId: preset.themeId,
            themeName: preset.themeName,
            fonts: preset.fonts,
            colors: preset.colors,
            visualStyle: preset.visualStyle,
          })),
          assetPolicy: ["Internal SVG", "Ollama image model"],
          imageFallbackPolicy: "svg first for explainers, Ollama image model for all picture-based visuals",
          deckRatio: "16:9",
          outputDepth: "full_slide_spec",
          diagrams: "svg_preferred_for_process_and_structure",
          includePdfDocxFallback: true,
          referenceVisualStyle: {
            sourceDeck: "Kamalaniketan-pptx template.pptx",
            theme: "school-ready classroom instructional deck",
            layoutPatterns: [
              "title slide with session identity",
              "learning outcome board",
              "prerequisite and recall prompt slide",
              "opening hook slide",
              "introduction slide",
              "core concept teaching slide",
              "visual explanation slide",
              "worked example slide",
              "guided practice slide",
              "quick assessment slide",
              "summary slide",
              "homework and next-session slide",
            ],
            qualityBar: [
              "preserve the 12-slide teaching skeleton",
              "keep content session-faithful",
              "theme changes must not alter content structure",
            ],
          },
        }, null, 2),
      })
    : homeworkOnly
    ? renderPrompt("homework-generation.md", {
        SUBJECT: String(subject || ""),
        GRADE_LEVEL: String(gradeLevel || ""),
        SESSION_TITLE: String(sessionTitle || `Session ${sessionNumber}`),
        SESSION_NUMBER: String(sessionNumber),
        TOTAL_SESSIONS: String(totalSessions),
        EXPECTED_HOMEWORK_DURATION: String(sessionPlanningDefaults?.sessionDurationMinutes || durationMinutes || 30),
        LEARNING_OUTCOMES_JSON: JSON.stringify(learningOutcomes),
        PREVIOUS_SESSION_CONTEXT: previousSessionContext || "No previous session context provided.",
        LEARNING_PACE: String(teachingStrategy?.pace || "Balanced"),
        TARGET_DIFFICULTY: String(teachingStrategy?.targetDifficulty || "Moderate"),
        HOMEWORK_PREFERENCES_JSON: JSON.stringify({
          includeHomework: sessionPlanningDefaults?.includeHomework ?? true,
          includeDifferentiation: sessionPlanningDefaults?.includeDifferentiation ?? true,
          includeRealWorldConnections: sessionPlanningDefaults?.includeRealWorldConnections ?? true,
        }),
        OUTPUT_LANGUAGE: String(sessionPlanningDefaults?.language || "English"),
        READING_LEVEL: String(sessionPlanningDefaults?.readingLevel || "Grade-aligned"),
        SESSION_JSON: JSON.stringify(sessionContextPayload, null, 2),
      })
    : assessmentOnly
    ? assessmentInstructionsPrompt
    : renderPrompt("session-generation.md", {
        SESSION_NUMBER: String(sessionNumber),
        TOTAL_SESSIONS: String(totalSessions),
        DURATION_MINUTES: String(durationMinutes),
        SUBJECT: String(subject || ""),
        GRADE_LEVEL: String(gradeLevel || ""),
        SELECTED_CHAPTERS_JSON: JSON.stringify(selectedChapters),
        INCLUDE_LEARNING_OUTCOMES: config.includeLearningOutcomes ? "YES" : "NO",
        INCLUDE_INTRODUCTION: config.includeIntroduction ? "YES" : "NO",
        INCLUDE_THEORY: config.includeTheory ? "YES" : "NO",
        INCLUDE_ASSESSMENTS: config.includeAssessments ? "YES" : "NO",
        INCLUDE_ASSIGNMENTS: config.includeAssignments ? "YES" : "NO",
        INCLUDE_NOTES: config.includeNotes ? "YES" : "NO",
        SELECTED_SECTIONS_JSON: JSON.stringify(selectedSections),
        ASSESSMENT_ENGINE_INSTRUCTIONS: embeddedAssessmentInstructions,
      });

  const schema = teacherNotesOnly
    ? { teacherLessonNotes: baseSchema.teacherLessonNotes }
    : studentNotesOnly
    ? { studentLessonNotes: baseSchema.studentLessonNotes }
    : materialsOnly
    ? { materials: baseSchema.materials }
    : homeworkOnly
    ? {
        homework: {
          sessionInformation: {
            sessionNumber: "",
            sessionTitle: "",
            subject: "",
            grade: "",
            difficultyLevel: "",
            learningPace: "",
            estimatedHomeworkDuration: ""
          },
          homework: [{
            id: 1,
            type: "",
            title: "",
            learningOutcomeIds: [""],
            topicCoverage: [""],
            difficulty: "",
            marks: 0,
            estimatedTime: "",
            instructions: "",
            question: "",
            options: [""],
            answerSpace: "",
            visualRequirement: "",
            expectedResponse: ""
          }],
          summary: {
            totalQuestions: 0,
            totalMarks: 0,
            estimatedCompletionTime: "",
            learningOutcomesCovered: [""],
            topicsCovered: [""],
            subtopicsCovered: [""],
            taskDistribution: {},
            homeExperimentIncluded: false,
            parentEngagementIncluded: false
          }
        }
      }
    : assessmentOnly
    ? {
        assessment: baseSchema.assessment
      }
    : baseSchema;

  const generationKind: OllamaGenerationKind = teacherNotesOnly
    ? "teacherNotes"
    : studentNotesOnly
    ? "studentNotes"
    : materialsOnly
    ? "materials"
    : homeworkOnly
    ? "homework"
    : assessmentOnly
    ? "assessment"
    : "sessionContent";

  const response = await generateWithOllama(
    requestId,
    debugDir,
    teacherNotesOnly
      ? "generate-content-session-teacher-notes"
      : studentNotesOnly
      ? "generate-content-session-student-notes"
      : materialsOnly
      ? "generate-content-session-ppt-materials"
      : homeworkOnly
      ? "generate-content-session-homework"
      : assessmentOnly
      ? "generate-content-session-assessment"
      : "generate-content-session",
    prompt,
    schema,
    {
      ...getOllamaConfig(generationKind),
      numPredict:
        assessmentOnly
          ? Math.max(12288, OLLAMA_NUM_PREDICT)
          : selectedSections.includes("assessment")
          ? Math.max(10240, OLLAMA_NUM_PREDICT)
          : OLLAMA_NUM_PREDICT,
    }
  );
  let responseText = response.text || "{}";
  if (response.doneReason === "length") {
    const recoveredPptText = materialsOnly ? tryRepairTruncatedPptJson(responseText) : null;
    if (recoveredPptText) {
      responseText = recoveredPptText;
      await writeDebugFile(debugDir, "truncated-ppt-recovery.json", responseText);
      console.warn(`[Ollama][${requestId}] Recovered truncated PPT response by trimming to the last complete slide boundary.`);
    } else {
      throw new Error("Model output truncated during session content generation. Reduce session scope or increase num_predict.");
    }
  }
  const parsedSession = JSON.parse(sanitizeJsonText(responseText).text || "{}");
  if (parsedSession?.studentLessonNotes) {
    const enrichedStudentNotesSession = await enrichStudentLessonNotesWithVisuals(requestId, debugDir, parsedSession, {
      subject,
      gradeLevel,
      sessionTitle: sessionTitle || `Session ${sessionNumber}`,
    });
    parsedSession.studentLessonNotes = enrichedStudentNotesSession?.studentLessonNotes || parsedSession.studentLessonNotes;
  }
  if (parsedSession?.materials?.ppt) {
    parsedSession.materials.ppt = await normalizePptMaterial(parsedSession.materials.ppt, {
      subject,
      gradeLevel,
      sessionTitle: sessionTitle || `Session ${sessionNumber}`,
      learningOutcomes,
      selectedChapters,
      requestId,
      debugDir,
      generationOptions: pptGenerationOptions,
    });
  }
  if (parsedSession?.assessment && assessmentCustomization && hasAssessmentCustomizationContent(assessmentCustomization)) {
    parsedSession.assessment = normalizeAssessmentResponseToCustomization(parsedSession.assessment, assessmentCustomization, {
      durationMinutes: derivedAssessmentDuration,
      language: assessmentLanguage,
      preferredDifficulty,
    });
  }
  const normalizedSession = teacherNotesOnly || studentNotesOnly || assessmentOnly
    ? pickSessionSections(parsedSession, selectedSections)
    : {
        ...pickSessionSections(parsedSession, selectedSections),
        id: parsedSession?.id || `session-${sessionNumber}`,
        sessionNumber: parsedSession?.sessionNumber || sessionNumber,
        title: parsedSession?.title || sessionTitle || `Session ${sessionNumber}`,
        duration: parsedSession?.duration || durationMinutes,
      };
  await writeDebugFile(debugDir, "final-response.json", normalizedSession);
  return normalizedSession;
}

app.post("/api/generate-sessions-outline", async (req, res) => {
  const { subject, gradeLevel, selectedChapters, termName, config } = req.body;
  const requestId = makeRequestId("generate-sessions-outline");
  const debugDir = await ensureDebugDir(requestId);
  await writeDebugFile(debugDir, "request-body.json", req.body);
  try {
    const prompt = renderPrompt("term-division.md", {
      SESSION_COUNT: String(config.sessionCount),
      DURATION_MINUTES: String(config.durationMinutes),
      SUBJECT: String(subject || ""),
      GRADE_LEVEL: String(gradeLevel || ""),
      TERM_NAME: String(termName || ""),
      SELECTED_CHAPTERS_JSON: JSON.stringify(selectedChapters),
    });

    const schema = [{
      id: "unique-id",
      sessionNumber: 1,
      title: "Vibrant and clear session title",
      duration: config.durationMinutes,
      learningOutcomes: ["Primary goals of this specific session"]
    }];

    const response = await generateWithOllama(requestId, debugDir, "generate-sessions-outline", prompt, schema);
    if (response.doneReason === "length") {
      throw new Error("Model output truncated during generate-sessions-outline. Reduce stage scope or increase num_predict.");
    }
    const parsedOutline = JSON.parse(response.text || "[]");
    await writeDebugFile(debugDir, "final-response.json", parsedOutline);
    res.json(parsedOutline);
  } catch (error: any) {
    console.error(`[Request][${requestId}] Session outline generation failed:`, error);
    res.status(500).json({ error: error?.message || "Session outline generation failed." });
  }
});

export {
  buildApprovedTheoryHierarchy,
  buildFaithfulStructureFromRawExtraction,
  buildVersionedCurriculumPayload,
  cleanupCbseStructure,
  detectCurriculumProfile,
  getCurriculumProfileConfig,
  buildNormalizedTeachingBlocks,
  buildLanguageFallbackStage1Facts,
  expandStage1FactsToRawExtraction,
  isLanguageSubject,
  mergeStage1FactExtractions,
  sanitizeStage3EnrichmentToSource,
  sanitizeJsonText,
};

// ======== START SERVER ========
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    const defaultOllamaConfig = getOllamaConfig("default");
    console.log(`[Backend] API server running on http://0.0.0.0:${PORT}`);
    console.log(`[Backend] Ollama: ${defaultOllamaConfig.baseUrl} | Model: ${defaultOllamaConfig.model}`);
    console.log(`[Backend] MongoDB: ${MONGODB_URI}`);
    console.log(`[Backend] CORS enabled for http://localhost:${FRONTEND_PORT}`);
    void connectToMongo()
      .then(() => {
        console.log("[Backend] MongoDB connected");
      })
      .catch((error) => {
        logMongoUnavailable("Backend", error);
      });
  });
}

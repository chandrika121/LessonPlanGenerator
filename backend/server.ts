import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { promises as fs, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { CurriculumModel } from "./models/Curriculum";
import { PlanningWorkspaceModel } from "./models/PlanningWorkspace";

// Load environment variables
dotenv.config({ path: "../.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3002;
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 4173;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://192.168.1.82:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:35b";
const OLLAMA_NUM_PREDICT = Number(process.env.OLLAMA_NUM_PREDICT) || 8192;
const OLLAMA_STAGE1_NUM_PREDICT = Number(process.env.OLLAMA_STAGE1_NUM_PREDICT) || 4096;
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 600000;
const MAX_CHUNK_SPLIT_DEPTH = 2;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kamalaniketan-lms";
const DEBUG_OUTPUT_DIR = path.resolve(__dirname, "debug-output");
const PROMPTS_DIR = path.resolve(__dirname, "prompts");

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

function sanitizeJsonText(raw: string): { text: string; changed: boolean; fixes: string[] } {
  let changed = false;
  const fixes: string[] = [];
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

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
      /[0-9]/.test(raw[index + 1] || "") &&
      !/[A-Za-z0-9_."\]]/.test(raw[index - 1] || "")
    ) {
      let end = index + 1;
      while (/[0-9]/.test(raw[end] || "")) end += 1;
      const token = raw.slice(index, end);
      const trailing = raw[end] || "";
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
  const hasSemester = /\bsemester\b|\bterm\b|\btrimester\b|\bquarter\b/.test(text);
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
    sessionAllocation: {
      approved: false,
      recommendations: [],
      allocations: [],
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
    sessionAllocation: {
      approved: false,
      recommendations: [],
      allocations: [],
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
    }))
  );
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

async function connectToMongo() {
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGODB_URI);
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
  numPredict?: number;
  timeoutMs?: number;
  retries?: number;
};

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
  const timeoutMs = resolvedOptions.timeoutMs || OLLAMA_TIMEOUT_MS;
  const numPredict = resolvedOptions.numPredict || OLLAMA_NUM_PREDICT;
  while (attempt < retries) {
    try {
      const schemaHint = schema
        ? `Return valid JSON only. Match this target schema shape exactly:\n${JSON.stringify(schema, null, 2)}`
        : "Return valid JSON only with no markdown fences or extra commentary.";
      const fullPrompt = [prompt, schemaHint].filter(Boolean).join("\n\n");

      const requestUrl = `${OLLAMA_BASE_URL}/api/chat`;
      console.log(`[Ollama][${requestId}][${stageName}] Sending request to: ${requestUrl}`);
      console.log(`[Ollama][${requestId}][${stageName}] Model: ${OLLAMA_MODEL}`);
      console.log(`[Ollama][${requestId}][${stageName}] Prompt length: ${fullPrompt.length} characters`);
      console.log(`[Ollama][${requestId}][${stageName}] Timeout: ${timeoutMs}ms`);
      console.log(`[Ollama][${requestId}][${stageName}] Attempt: ${attempt + 1}/${retries}`);
      console.log(`[Ollama][${requestId}][${stageName}] num_predict: ${numPredict}`);

      const requestBody = {
        model: OLLAMA_MODEL,
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
      console.error(`[Ollama][${requestId}][${stageName}] Clear reason: stage="${stageName}" model="${OLLAMA_MODEL}" timeoutMs=${timeoutMs} promptLength=${error?.promptLength || prompt.length}`);

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
  res.json({ status: "ok", ollama: OLLAMA_BASE_URL, model: OLLAMA_MODEL });
});

app.get("/api/curriculums", async (_req, res) => {
  try {
    await connectToMongo();
    const curriculums = await CurriculumModel.find()
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, curriculums });
  } catch (error: any) {
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
    res.json({ success: true, workspace });
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
    res.json({ success: true, workspace });
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

    const recommendations = classTermPlans.flatMap((plan: any) =>
      flattenTermDivisionToRows(plan).map((row: any) => ({
        className: row.className || "",
        termName: row.term,
        termNumber: row.termNumber ?? null,
        chapters: row.chapters || [],
        marks: row.marks || 0,
        reasoning: row.marks > 0
          ? "Balanced using curriculum structure, unit coverage, and marks distribution."
          : "Balanced using curriculum structure and chapter coverage.",
        estimatedSessions: Math.max(1, Math.ceil((row.chapters || []).length * 1.5)),
      }))
    );

    workspace.termPlan = {
      approved: false,
      recommendedTermCount: classTermPlans[0]?.term_count || preferredTermCount || null,
      recommendations,
      allocations: workspace.termPlan?.allocations || [],
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
    const faithfulStructure = buildFaithfulStructureFromRawExtraction(rawExtraction);
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

    const normalizedStructure: any = {
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
    });

    const schema = {
      id: "unique-session-id",
      sessionNumber: sessionNumber,
      title: "Vibrant, educational title for this session",
      duration: durationMinutes,
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
        ppt: { title: "Presentation title", slides: [{ slideTitle: "Slide title", bulletPoints: ["Key point"] }] },
        pdf: { documentTitle: "Document title", keyInformation: ["Key info"] },
        docx: { outlineTitle: "Outline title", sections: ["Section content"] }
      },
      homework: { task: "Interactive or practical homework task", estimatedTimeMinutes: 30 },
      assessment: { questions: ["Quiz / test questions based on the theory"], answerKey: ["Corresponding explicit answers"] },
      assignment: { taskDescription: "Written assignment or project task", rubric: ["Evaluation points/criteria"], answerKey: "Sample answer or response key for teacher reference" }
    };

    const response = await generateWithOllama(requestId, debugDir, "generate-session-details", prompt, schema);
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
    console.log(`[Backend] API server running on http://0.0.0.0:${PORT}`);
    console.log(`[Backend] Ollama: ${OLLAMA_BASE_URL} | Model: ${OLLAMA_MODEL}`);
    console.log(`[Backend] MongoDB: ${MONGODB_URI}`);
    console.log(`[Backend] CORS enabled for http://localhost:${FRONTEND_PORT}`);
    void connectToMongo()
      .then(() => {
        console.log("[Backend] MongoDB connected");
      })
      .catch((error) => {
        console.error("[Backend] MongoDB connection failed:", error);
      });
  });
}

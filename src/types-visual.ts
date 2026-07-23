/**
 * Visual System Types for K12 Image Orchestration Service
 * Part of the Image Orchestrator Service architecture
 */

export type VisualType =
  | "scientific_diagram"
  | "math_graph"
  | "geometry_diagram"
  | "flowchart"
  | "map"
  | "real_photo"
  | "concept_illustration"
  | "formula_visual"
  | "experiment_setup"
  | "comparison_table"
  | "none";

export type GeneratorType =
  | "svg_template"
  | "matplotlib"
  | "geometry_engine"
  | "mermaid"
  | "wikimedia"
  | "ai_image"
  | "latex_svg";

export interface SlideContentAnalysis {
  slideId: string;
  slideTitle: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  subtopic?: string;
  imageNeed: VisualType;
  confidence: number;
  suggestedGenerator: GeneratorType;
  templateId?: string;
  description?: string;
  mustInclude?: string[];
  avoid?: string[];
}

export interface GeneratedVisualAsset {
  assetId: string;
  slideId?: string;
  sessionId?: string;
  subject?: string;
  visualType: VisualType;
  generator: GeneratorType;
  imageUrl: string;
  thumbnailUrl?: string;
  svgCode?: string;
  license: string;
  attribution: string | null;
  altText: string;
  validated: boolean;
  validationScore?: number;
  validationNotes?: string[];
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface VisualGenerationBatch {
  batchId: string;
  sessionId: string;
  status: "pending" | "generating" | "validating" | "completed" | "failed";
  analyses: SlideContentAnalysis[];
  assets: GeneratedVisualAsset[];
  failures: { slideId: string; reason: string; fallbackUsed: boolean }[];
  createdAt: string;
  completedAt?: string;
}

export interface VisualValidationRequest {
  imageUrl: string;
  visualType: VisualType;
  subject: string;
  gradeLevel: number;
  expectedLabels?: string[];
  mustInclude?: string[];
  avoid?: string[];
}

export interface VisualValidationResult {
  passed: boolean;
  confidence: number;
  checks: {
    ageAppropriate: boolean;
    scientificallyAccurate: boolean;
    labelsCorrect: boolean;
    noExtraElements: boolean;
    textCorrect: boolean;
    culturallyAppropriate: boolean;
  };
  failureReasons?: string[];
  suggestedAction: "accept" | "regenerate" | "use_curated" | "use_svg";
}

export interface VisualGenerationRequest {
  sessionId: string;
  slideId: string;
  visualType: VisualType;
  params: Record<string, any>;
  subject: string;
  gradeLevel: number;
  topic: string;
  subtopic?: string;
  description?: string;
  mustInclude?: string[];
  avoid?: string[];
  outputFormat?: "png" | "svg";
}

export interface VisualAnalyzeRequest {
  sessionId: string;
  slides: {
    slideId: string;
    slideTitle: string;
    content: string;
    bulletPoints?: string[];
  }[];
  subject: string;
  gradeLevel: string;
  topic: string;
  subtopic?: string;
}

export interface VisualAnalyzeResponse {
  analyses: SlideContentAnalysis[];
  summary: {
    totalSlides: number;
    visualsNeeded: number;
    programmaticCount: number;
    aiCount: number;
    noneCount: number;
  };
}

export interface VisualBatchRequest {
  sessionId: string;
  analyses: SlideContentAnalysis[];
  preferredGenerators?: Partial<Record<VisualType, GeneratorType>>;
}

export interface VisualBatchResponse {
  batchId: string;
  assets: GeneratedVisualAsset[];
  failures: { slideId: string; reason: string; fallbackAction: string }[];
  status: string;
}

// Routing table entry
export interface GeneratorRoute {
  visualType: VisualType;
  primary: GeneratorType;
  secondary: GeneratorType;
  neverUse: GeneratorType[];
  minConfidence: number;
}

// SVG Template types
export interface SvgTemplateParams {
  gradeLevel: number;
  labels?: string[];
  style?: "clean" | "textbook" | "simple";
  width?: number;
  height?: number;
  [key: string]: any;
}

export type SvgTemplateFn = (params: SvgTemplateParams) => string;

export interface SvgTemplateRegistryEntry {
  id: string;
  name: string;
  subject: string;
  gradeRange: [number, number];
  visualType: VisualType;
  template: SvgTemplateFn;
  defaultParams: SvgTemplateParams;
}

// Math graph types
export interface MathGraphRequest {
  type: "coordinate_plot" | "bar_chart" | "number_line" | "function_plot" | "scatter_plot" | "histogram";
  params: {
    xRange?: [number, number];
    yRange?: [number, number];
    points?: { x: number; y: number; label?: string }[];
    function?: string;
    bars?: { label: string; value: number; color?: string }[];
    bins?: number[];
    title?: string;
    xLabel?: string;
    yLabel?: string;
    grid?: boolean;
  };
  outputFormat?: "png" | "svg";
  width?: number;
  height?: number;
}

// Mermaid types
export interface MermaidRequest {
  diagramType: "flowchart" | "sequence" | "gantt" | "mindmap" | "stateDiagram" | "graph";
  sourceCode: string;
  theme?: "default" | "forest" | "dark" | "neutral";
  outputFormat?: "png" | "svg";
  width?: number;
  height?: number;
}

// Wikimedia types
export interface WikimediaRequest {
  searchQuery: string;
  category?: string;
  minResolution?: number;
  licenseFilter?: "cc-by" | "cc-by-sa" | "public_domain" | "any_open";
  maxResults?: number;
  gradeLevel?: number;
}

export interface WikimediaAsset {
  title: string;
  pageUrl: string;
  imageUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  license: string;
  attributionText: string;
  source: "wikimedia";
  confidence: number;
}

// AI image types
export interface AiImageRequest {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  style?: "illustration" | "photorealistic" | "cartoon" | "watercolor";
  aspectRatio?: "16:9" | "4:3" | "1:1";
  gradeLevel: number;
  subject: string;
  mustInclude?: string[];
  avoid?: string[];
  outputFormat?: "png" | "jpeg";
}

// Enhanced PPT types
export interface PptResolvedVisual {
  assetId: string;
  imageUrl: string;
  source: GeneratorType;
  license: string;
  attribution: string | null;
  altText: string;
  validated: boolean;
  validationScore: number;
  svgCode?: string;
}

export interface PptSlideVisualRequirement {
  visualType: VisualType;
  confidence: number;
  description: string;
  suggestedGenerator: GeneratorType;
  templateId?: string;
}

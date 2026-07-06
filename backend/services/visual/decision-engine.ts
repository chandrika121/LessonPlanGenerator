/**
 * Visual Decision Engine
 * Routes visual generation requests to the appropriate generator based on content analysis
 */

import type {
  VisualType,
  GeneratorType,
  SlideContentAnalysis,
  GeneratorRoute,
  VisualGenerationRequest,
} from "../../../src/types-visual.js";
import { findTemplateForContent } from "./svg-template-engine.js";

// ───────────────────────────────────────────────
// ROUTING TABLE
// ───────────────────────────────────────────────

const GENERATOR_ROUTES: GeneratorRoute[] = [
  // Science: exact diagrams → SVG templates
  { visualType: "scientific_diagram", primary: "svg_template", secondary: "ai_image", neverUse: [], minConfidence: 0.7 },
  { visualType: "experiment_setup", primary: "svg_template", secondary: "ai_image", neverUse: [], minConfidence: 0.65 },
  // Math: graphs → matplotlib, geometry → SVG
  { visualType: "math_graph", primary: "matplotlib", secondary: "svg_template", neverUse: ["ai_image"], minConfidence: 0.8 },
  { visualType: "geometry_diagram", primary: "geometry_engine", secondary: "svg_template", neverUse: ["ai_image"], minConfidence: 0.75 },
  // Flowcharts → Mermaid
  { visualType: "flowchart", primary: "mermaid", secondary: "svg_template", neverUse: ["ai_image"], minConfidence: 0.8 },
  // Maps → Wikimedia / SVG
  { visualType: "map", primary: "wikimedia", secondary: "svg_template", neverUse: ["ai_image"], minConfidence: 0.6 },
  // Real photos → Wikimedia
  { visualType: "real_photo", primary: "wikimedia", secondary: "ai_image", neverUse: [], minConfidence: 0.5 },
  // Formula visuals → LaTeX/SVG
  { visualType: "formula_visual", primary: "latex_svg", secondary: "svg_template", neverUse: ["ai_image"], minConfidence: 0.85 },
  // Concept illustrations → AI (fallback)
  { visualType: "concept_illustration", primary: "ai_image", secondary: "svg_template", neverUse: [], minConfidence: 0.5 },
  // Comparison tables → SVG
  { visualType: "comparison_table", primary: "svg_template", secondary: "ai_image", neverUse: [], minConfidence: 0.7 },
  // None needed
  { visualType: "none", primary: "svg_template", secondary: "ai_image", neverUse: [], minConfidence: 0 },
];

// Topic keyword → visual type mapping for quick detection
const TOPIC_VISUAL_MAP: { keywords: string[]; visualType: VisualType; preferredGenerator: GeneratorType }[] = [
  // Cell biology
  { keywords: ["cell", "organelle", "nucleus", "mitochondria", "chloroplast", "cell wall", "cell membrane"], visualType: "scientific_diagram", preferredGenerator: "svg_template" },
  // Body systems
  { keywords: ["digestive system", "respiratory system", "circulatory system", "heart", "brain", "kidney", "liver"], visualType: "scientific_diagram", preferredGenerator: "svg_template" },
  // Physics experiments
  { keywords: ["electric circuit", "circuit diagram", "magnet", "lens", "prism", "pendulum", "pulley"], visualType: "experiment_setup", preferredGenerator: "svg_template" },
  // Water cycle, carbon cycle
  { keywords: ["water cycle", "carbon cycle", "nitrogen cycle", "food chain", "food web", "ecosystem"], visualType: "scientific_diagram", preferredGenerator: "svg_template" },
  // Periodic table
  { keywords: ["periodic table", "element", "atomic structure", "electron configuration"], visualType: "scientific_diagram", preferredGenerator: "svg_template" },
  // Graphs
  { keywords: ["graph", "chart", "plot", "histogram", "bar chart", "line graph", "scatter plot"], visualType: "math_graph", preferredGenerator: "matplotlib" },
  // Geometry
  { keywords: ["triangle", "circle", "angle", "congruent", "similar", "theorem", "construction", "perpendicular", "parallel"], visualType: "geometry_diagram", preferredGenerator: "geometry_engine" },
  // Flowcharts
  { keywords: ["flowchart", "process", "steps", "algorithm", "workflow", "cycle", "sequence"], visualType: "flowchart", preferredGenerator: "mermaid" },
  // Maps
  { keywords: ["map", "continent", "country", "latitude", "longitude", "climate zone", "plate tectonics"], visualType: "map", preferredGenerator: "wikimedia" },
  // Historical photos
  { keywords: ["photo", "photograph", "image of", "picture of", "historical", "monument", "building"], visualType: "real_photo", preferredGenerator: "wikimedia" },
  // Chemical apparatus
  { keywords: ["apparatus", "beaker", "flask", "test tube", "bunsen burner", "distillation", "titration"], visualType: "experiment_setup", preferredGenerator: "svg_template" },
  // Formulas
  { keywords: ["formula", "equation", "theorem", "proof", "derivation", "identity"], visualType: "formula_visual", preferredGenerator: "latex_svg" },
];

// ───────────────────────────────────────────────
// DECISION ENGINE
// ───────────────────────────────────────────────

export function determineGenerator(analysis: SlideContentAnalysis): {
  generator: GeneratorType;
  confidence: number;
  fallback: GeneratorType;
  reason: string;
 } {
  const visualType = analysis.imageNeed || "none";
  const route = GENERATOR_ROUTES.find((r) => r.visualType === visualType);
  if (!route) {
    return { generator: "ai_image", confidence: 0.5, fallback: "svg_template", reason: "No route found for visual type, using AI fallback" };
  }

  // Check if SVG template exists for this exact topic
  if (route.primary === "svg_template" || route.secondary === "svg_template") {
    const templateMatch = findTemplateForContent(
      analysis.subject,
      analysis.gradeLevel,
      visualType,
      analysis.topic
    );

    if (templateMatch && templateMatch.confidence >= route.minConfidence) {
      return {
        generator: "svg_template",
        confidence: templateMatch.confidence,
        fallback: route.secondary === "svg_template" ? route.primary : route.secondary,
        reason: `Matched SVG template: ${templateMatch.templateName}`,
      };
    }
  }

  // Use primary generator if confidence is sufficient
  if (analysis.confidence >= route.minConfidence) {
    return {
      generator: route.primary,
      confidence: analysis.confidence,
      fallback: route.secondary,
      reason: `Primary generator for ${visualType}`,
    };
  }

  // Confidence too low — use secondary or fallback
  return {
    generator: route.secondary,
    confidence: analysis.confidence * 0.8,
    fallback: "ai_image",
    reason: `Low confidence (${analysis.confidence}), using secondary generator`,
  };
}

export function detectVisualTypeFromContent(
  slideTitle: string,
  content: string,
  subject: string,
  gradeLevel: number
): { visualType: VisualType; confidence: number; suggestedGenerator: GeneratorType; reason: string } {
  const combinedText = `${slideTitle} ${content}`.toLowerCase();
  const normalizedSubject = subject.toLowerCase();

  // Check topic keyword map
  for (const entry of TOPIC_VISUAL_MAP) {
    for (const keyword of entry.keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        // Check if SVG template exists for this
        const templateMatch = findTemplateForContent(subject, gradeLevel, entry.visualType, slideTitle);
        if (templateMatch) {
          return {
            visualType: entry.visualType,
            confidence: 0.85,
            suggestedGenerator: "svg_template",
            reason: `Keyword match: "${keyword}" — SVG template available: ${templateMatch.templateName}`,
          };
        }
        return {
          visualType: entry.visualType,
          confidence: 0.7,
          suggestedGenerator: entry.preferredGenerator,
          reason: `Keyword match: "${keyword}"`,
        };
      }
    }
  }

  // Subject-specific heuristics
  if (normalizedSubject.includes("math") || normalizedSubject.includes("mathematics")) {
    if (combinedText.includes("graph") || combinedText.includes("plot") || combinedText.includes("chart")) {
      return { visualType: "math_graph", confidence: 0.75, suggestedGenerator: "matplotlib", reason: "Math subject with graph keywords" };
    }
    if (combinedText.includes("diagram") || combinedText.includes("figure") || combinedText.includes("shape")) {
      return { visualType: "geometry_diagram", confidence: 0.65, suggestedGenerator: "geometry_engine", reason: "Math subject with diagram keywords" };
    }
    if (combinedText.includes("formula") || combinedText.includes("equation")) {
      return { visualType: "formula_visual", confidence: 0.7, suggestedGenerator: "latex_svg", reason: "Math subject with formula keywords" };
    }
  }

  if (normalizedSubject.includes("science")) {
    if (combinedText.includes("diagram") || combinedText.includes("structure") || combinedText.includes("system")) {
      return { visualType: "scientific_diagram", confidence: 0.7, suggestedGenerator: "svg_template", reason: "Science subject with diagram keywords" };
    }
    if (combinedText.includes("experiment") || combinedText.includes("apparatus") || combinedText.includes("setup")) {
      return { visualType: "experiment_setup", confidence: 0.65, suggestedGenerator: "svg_template", reason: "Science subject with experiment keywords" };
    }
  }

  if (normalizedSubject.includes("social") || normalizedSubject.includes("sst") || normalizedSubject.includes("geography")) {
    if (combinedText.includes("map") || combinedText.includes("location") || combinedText.includes("region")) {
      return { visualType: "map", confidence: 0.7, suggestedGenerator: "wikimedia", reason: "SST subject with map keywords" };
    }
  }

  // No strong signal — default to none or concept illustration
  if (combinedText.length < 50) {
    return { visualType: "none", confidence: 0.9, suggestedGenerator: "svg_template", reason: "Short content, no visual needed" };
  }

  return { visualType: "concept_illustration", confidence: 0.4, suggestedGenerator: "ai_image", reason: "No specific visual signal detected, using AI concept illustration" };
}

export function buildGenerationRequest(
  analysis: SlideContentAnalysis
): VisualGenerationRequest {
  const decision = determineGenerator(analysis);
  const visualType = analysis.imageNeed || analysis.suggestedGenerator;

  return {
    sessionId: "",
    slideId: analysis.slideId,
    visualType: visualType as VisualType,
    params: {
      templateId: analysis.templateId,
      description: analysis.description,
      labels: analysis.mustInclude,
      gradeLevel: analysis.gradeLevel,
    },
    subject: analysis.subject,
    gradeLevel: analysis.gradeLevel,
    topic: analysis.topic,
    subtopic: analysis.subtopic,
    description: analysis.description,
    mustInclude: analysis.mustInclude,
    avoid: analysis.avoid,
    outputFormat: decision.generator === "svg_template" ? "svg" : "png",
  };
}

export function getRouteForVisualType(visualType: VisualType): GeneratorRoute | undefined {
  return GENERATOR_ROUTES.find((r) => r.visualType === visualType);
}

export function shouldUseAiImage(visualType: VisualType): boolean {
  const route = getRouteForVisualType(visualType);
  if (!route) return true;
  return route.primary === "ai_image" || route.secondary === "ai_image";
}

export function shouldUseProgrammatic(visualType: VisualType): boolean {
  const route = getRouteForVisualType(visualType);
  if (!route) return false;
  return route.primary !== "ai_image" && route.primary !== "wikimedia";
}

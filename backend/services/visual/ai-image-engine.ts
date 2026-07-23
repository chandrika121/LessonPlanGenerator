/**
 * AI Image Engine
 * Generates images using local Ollama image generation models.
 */

import type { AiImageRequest } from "../../../src/types-visual.js";

const OLLAMA_API_KEY = "ollama";
const OLLAMA_OPENAI_IMAGES_PATH = "/v1/images/generations";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_IMAGE_TIMEOUT_MS || process.env.OLLAMA_TIMEOUT_MS) || 180000;

type OllamaImageResponse = {
  error?: {
    message?: string;
  };
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
};

export async function generateAiImage(request: AiImageRequest): Promise<{
  imageUrl: string;
  width: number;
  height: number;
}> {
  const {
    prompt,
    model,
    negativePrompt,
    style = "illustration",
    aspectRatio = "16:9",
    gradeLevel,
    subject,
    mustInclude = [],
    avoid = [],
  } = request;

  const enhancedPrompt = enhancePromptForEducation(
    prompt,
    gradeLevel,
    subject,
    style,
    mustInclude,
    avoid,
    negativePrompt,
  );

  const { width, height } = getDimensionsForAspectRatio(aspectRatio);
  const { baseUrl, primaryModel, fallbackModel } = resolveOllamaImageConfig(model);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const imageUrl =
      await generateWithOllamaImageModel(baseUrl, primaryModel, enhancedPrompt, aspectRatio, controller.signal)
        .catch(async (primaryError) => {
          if (!fallbackModel || fallbackModel === primaryModel) {
            throw primaryError;
          }
          return generateWithOllamaImageModel(baseUrl, fallbackModel, enhancedPrompt, aspectRatio, controller.signal);
        });

    return {
      imageUrl,
      width,
      height,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Ollama image generation timed out after ${OLLAMA_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function resolveOllamaImageConfig(explicitModel?: string) {
  const baseUrl =
    String(process.env.OLLAMA_IMAGE_BASE_URL || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").trim().replace(/\/$/, "");
  const primaryModel =
    String(explicitModel || process.env.OLLAMA_IMAGE_MODEL || "x/z-image-turbo:bf16").trim();
  const fallbackModel =
    String(process.env.OLLAMA_IMAGE_FALLBACK_MODEL || "x/flux2-klein:9b").trim();

  return {
    baseUrl,
    primaryModel,
    fallbackModel,
  };
}

async function generateWithOllamaImageModel(
  baseUrl: string,
  model: string,
  prompt: string,
  aspectRatio: "16:9" | "4:3" | "1:1",
  signal: AbortSignal,
) {
  const response = await fetch(`${baseUrl}${OLLAMA_OPENAI_IMAGES_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OLLAMA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: getOllamaImageSize(aspectRatio),
      response_format: "b64_json",
    }),
    signal,
  });

  const responseText = await response.text();
  let payload: OllamaImageResponse | null = null;

  try {
    payload = responseText ? JSON.parse(responseText) as OllamaImageResponse : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const apiMessage = payload?.error?.message || responseText || `HTTP ${response.status}`;
    throw new Error(`Ollama image generation failed for model ${model}: ${apiMessage}`);
  }

  const imageUrl = extractOllamaImageUrl(payload);
  if (!imageUrl) {
    throw new Error(`Ollama returned no image payload for model ${model}`);
  }

  return imageUrl;
}

function getOllamaImageSize(aspectRatio: "16:9" | "4:3" | "1:1") {
  if (aspectRatio === "4:3") {
    return "1536x1152";
  }
  if (aspectRatio === "1:1") {
    return "1024x1024";
  }
  return "1792x1024";
}

function enhancePromptForEducation(
  prompt: string,
  gradeLevel: number,
  subject: string,
  style: string,
  mustInclude: string[],
  avoid: string[],
  negativePrompt?: string,
): string {
  const gradeSpecific = getGradeSpecificTerms(gradeLevel);
  const styleTerms = getStyleTerms(style);
  const subjectContext = getSubjectContext(subject);

  const parts = [
    prompt,
    `for ${gradeSpecific} grade`,
    subjectContext,
    styleTerms,
    mustInclude.length ? `Must include visually: ${mustInclude.join(", ")}` : "",
    negativeClause(avoid, negativePrompt),
    "K12 education, classroom safe, polished composition, visually clear, concept-focused",
    "Do not include any text, letters, words, labels, captions, headings, equations, numbers, banners, watermarks, UI chrome, or slide layout inside the image.",
    "Generate only the image scene, not a presentation slide.",
  ];

  return parts.filter(Boolean).join(". ");
}

function negativeClause(avoid: string[], negativePrompt?: string): string {
  const combined = [
    ...avoid,
    negativePrompt || "",
    "text",
    "labels",
    "captions",
    "headings",
    "poster layout",
    "presentation slide",
    "worksheet",
    "infographic",
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return combined.length ? `Avoid: ${combined.join(", ")}` : "";
}

function getGradeSpecificTerms(gradeLevel: number): string {
  if (gradeLevel <= 2) return "preschool to kindergarten";
  if (gradeLevel <= 5) return "elementary";
  if (gradeLevel <= 8) return "middle school";
  if (gradeLevel <= 10) return "high school";
  return "secondary school";
}

function getStyleTerms(style: string): string {
  const styles: Record<string, string> = {
    illustration: "modern educational illustration, clean composition, presentation-quality visual",
    photorealistic: "photorealistic, detailed, classroom-safe, clean educational composition",
    cartoon: "friendly illustrated educational scene, simple but polished composition",
    watercolor: "watercolor educational illustration, soft but clear classroom-safe palette",
  };
  return styles[style] || "educational illustration";
}

function getSubjectContext(subject: string): string {
  const contexts: Record<string, string> = {
    mathematics: "mathematical concept visual, no in-image equations or labels",
    science: "scientific concept visual, accurate and classroom-appropriate",
    biology: "biological concept visual, accurate and classroom-appropriate",
    chemistry: "chemical concept visual, accurate and classroom-appropriate",
    physics: "physics concept visual, accurate and classroom-appropriate",
    "social studies": "historical or geographical educational context",
    "language arts": "reading or literary educational context",
    art: "artistic educational context",
    music: "music educational context",
  };
  return contexts[subject.toLowerCase()] || "educational content";
}

function getDimensionsForAspectRatio(aspectRatio: string): { width: number; height: number } {
  if (aspectRatio === "4:3") {
    return { width: 1536, height: 1152 };
  }
  if (aspectRatio === "1:1") {
    return { width: 1024, height: 1024 };
  }
  return { width: 1792, height: 1024 };
}

function extractOllamaImageUrl(payload: OllamaImageResponse | null): string | null {
  const images = payload?.data || [];
  for (const image of images) {
    if (image.b64_json) {
      return `data:image/png;base64,${image.b64_json}`;
    }
    if (image.url) {
      return image.url;
    }
  }
  return null;
}

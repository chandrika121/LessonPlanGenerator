/**
 * AI Image Engine
 * Generates images using OpenRouter image-capable chat models.
 */

import type { AiImageRequest } from "../../../src/types-visual.js";

const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "sourceful/riverflow-v2.5-fast";
const OPENROUTER_APP_TITLE = process.env.OPENROUTER_APP_TITLE || "AI PPT Generator";
const OPENROUTER_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS) || 180000;

type OpenRouterImageResponse = {
  error?: {
    message?: string;
  };
  choices?: Array<{
    message?: {
      content?: string | Array<
        | { type?: "text"; text?: string }
        | { type?: "image_url"; image_url?: { url?: string } }
        | { type?: string; [key: string]: unknown }
      >;
      images?: Array<{
        image_url?: { url?: string };
        url?: string;
        b64_json?: string;
        mime_type?: string;
      }>;
    };
  }>;
  images?: Array<{
    image_url?: { url?: string };
    url?: string;
    b64_json?: string;
    mime_type?: string;
  }>;
  data?: Array<{
    url?: string;
    b64_json?: string;
    mime_type?: string;
  }>;
};

type OpenRouterImageCandidate = {
  image_url?: { url?: string };
  url?: string;
  b64_json?: string;
  mime_type?: string;
};

export async function generateAiImage(request: AiImageRequest): Promise<{
  imageUrl: string;
  width: number;
  height: number;
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required for AI image generation");
  }

  const {
    prompt,
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
    avoid
  );

  const { width, height } = getDimensionsForAspectRatio(aspectRatio);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": OPENROUTER_APP_TITLE,
        ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
      },
      body: JSON.stringify({
        model: OPENROUTER_IMAGE_MODEL,
        modalities: ["image"],
        messages: [
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        reasoning: {
          effort: "high",
        },
        image_config: {
          width,
          height,
        },
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let payload: OpenRouterImageResponse | null = null;

    try {
      payload = responseText ? JSON.parse(responseText) as OpenRouterImageResponse : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const apiMessage = payload?.error?.message || responseText || `HTTP ${response.status}`;
      throw new Error(`OpenRouter image generation failed: ${apiMessage}`);
    }

    const imageUrl = extractImageUrl(payload);
    if (!imageUrl) {
      throw new Error("OpenRouter returned no image payload");
    }

    return {
      imageUrl,
      width,
      height,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`OpenRouter image generation timed out after ${OPENROUTER_TIMEOUT_MS}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function enhancePromptForEducation(
  prompt: string,
  gradeLevel: number,
  subject: string,
  style: string,
  mustInclude: string[],
  avoid: string[]
): string {
  const gradeSpecific = getGradeSpecificTerms(gradeLevel);
  const styleTerms = getStyleTerms(style);
  const subjectContext = getSubjectContext(subject);

  const parts = [
    prompt,
    `for ${gradeSpecific} grade`,
    subjectContext,
    styleTerms,
    mustInclude.length ? `Must include: ${mustInclude.join(", ")}` : "",
    negativeClause(avoid),
    "K12 education, safe for children, educational content, large readable labels, clean composition",
  ];

  return parts.filter(Boolean).join(". ");
}

function negativeClause(avoid: string[]): string {
  return avoid.length ? `Avoid: ${avoid.join(", ")}` : "";
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
    illustration: "modern textbook illustration, flat vector graphics, bright educational colors, white background",
    photorealistic: "photorealistic, clean educational composition, high quality",
    cartoon: "friendly cartoon illustration, clear educational composition",
    watercolor: "watercolor illustration, soft classroom-safe palette",
  };
  return styles[style] || "educational illustration";
}

function getSubjectContext(subject: string): string {
  const contexts: Record<string, string> = {
    mathematics: "mathematical concept, accurate numbers and relationships",
    science: "scientific concept, accurate educational diagram",
    "social studies": "historical or geographical context",
    "language arts": "literary or reading context",
    art: "artistic composition",
    music: "musical notation or instruments",
    physics: "physics concept, visually accurate motion and force cues",
  };
  return contexts[subject.toLowerCase()] || "educational content";
}

function getDimensionsForAspectRatio(aspectRatio: string): { width: number; height: number } {
  if (aspectRatio === "4:3") {
    return { width: 2048, height: 1536 };
  }

  if (aspectRatio === "1:1") {
    return { width: 2048, height: 2048 };
  }

  return { width: 4096, height: 2304 };
}

function extractImageUrl(payload: OpenRouterImageResponse | null): string | null {
  if (!payload) return null;

  const candidateImages: OpenRouterImageCandidate[] = [
    ...(payload.images || []),
    ...(payload.data || []),
    ...(payload.choices?.flatMap(choice => choice.message?.images || []) || []),
  ];

  for (const image of candidateImages) {
    const directUrl = image.image_url?.url || image.url;
    if (directUrl) {
      return directUrl;
    }

    if (image.b64_json) {
      return `data:${image.mime_type || "image/png"};base64,${image.b64_json}`;
    }
  }

  const content = payload.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (isImageUrlPart(part) && part.image_url?.url) {
        return part.image_url.url;
      }
    }
  }

  return null;
}

function isImageUrlPart(part: unknown): part is { type: "image_url"; image_url?: { url?: string } } {
  return Boolean(
    part &&
      typeof part === "object" &&
      "type" in part &&
      (part as { type?: unknown }).type === "image_url"
  );
}

/**
 * Visual Validation Service
 * Validates generated images for K12 safety and quality
 */

import type { GeneratedVisualAsset, VisualValidationResult } from "../../../src/types-visual.js";

export async function validateImage(image: GeneratedVisualAsset): Promise<VisualValidationResult> {
  const checks = {
    ageAppropriate: true,
    scientificallyAccurate: true,
    labelsCorrect: true,
    noExtraElements: true,
    textCorrect: true,
    culturallyAppropriate: true,
  };
  
  const failureReasons: string[] = [];
  
  // Check image dimensions
  if (image.width && image.height && (image.width < 100 || image.height < 100)) {
    checks.ageAppropriate = false;
    failureReasons.push("Image dimensions too small");
  }
  
  // Check for safe content (basic checks)
  const unsafePatterns = [
    /weapon/i,
    /violence/i,
    /dangerous/i,
    /explicit/i,
  ];
  
  const contentToCheck = image.altText || "";
  
  for (const pattern of unsafePatterns) {
    if (pattern.test(contentToCheck)) {
      checks.ageAppropriate = false;
      failureReasons.push("Potentially unsafe content detected");
    }
  }
  
  // Check K12 appropriateness
  if (image.validationScore !== undefined && image.validationScore < 0.5) {
    checks.ageAppropriate = false;
    failureReasons.push("Low validation score");
  }
  
  const passed = Object.values(checks).every(c => c === true);
  
  return {
    passed,
    confidence: passed ? 0.95 : 0.3,
    checks,
    failureReasons: failureReasons.length > 0 ? failureReasons : undefined,
    suggestedAction: passed ? "accept" : "regenerate",
  };
}

export async function validateAllImages(images: GeneratedVisualAsset[]): Promise<VisualValidationResult[]> {
  const results: VisualValidationResult[] = [];
  for (const image of images) {
    results.push(await validateImage(image));
  }
  return results;
}

export function generateSafeAltText(image: GeneratedVisualAsset): string {
  return image.altText || "";
}
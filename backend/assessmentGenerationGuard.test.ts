import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const { getAssessmentGenerationGuard } = await import("./server.ts");

  const withoutSourceContent = getAssessmentGenerationGuard(["assessment"], null, null);
  assert.equal(withoutSourceContent.allowed, true, "assessment-only generation should proceed even without cached teaching content");

  const withSourceContentButNoCustomization = getAssessmentGenerationGuard(["assessment"], { introduction: "Intro" }, { questionTypes: [] });
  assert.equal(withSourceContentButNoCustomization.allowed, false, "assessment generation should still be blocked when no question types are configured");
  assert.match(String(withSourceContentButNoCustomization.error || ""), /question type/i);

  console.log("assessmentGenerationGuard regression passed");
}

void main();

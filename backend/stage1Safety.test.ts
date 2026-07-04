import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const {
    sanitizeJsonText,
    isLanguageSubject,
    buildLanguageFallbackStage1Facts,
    generateWithOllama,
    tryRepairSessionJson,
  } = await import("./server.ts");

  const sanitizedMarks = sanitizeJsonText('{"marks": 05}');
  assert.equal(sanitizedMarks.changed, true);
  assert.deepEqual(JSON.parse(sanitizedMarks.text), { marks: 5 });

  const sanitizedQuoted = sanitizeJsonText('{"code":"05","marks":08}');
  assert.deepEqual(JSON.parse(sanitizedQuoted.text), { code: "05", marks: 8 });

  const repairedSessionJson = tryRepairSessionJson(`{
    "sessionNumber": 1,
    "title": "Sample Session",
    "teacherLessonNotes": {
      "sessionOverview": "Overview"
    },
  }`);
  assert.ok(repairedSessionJson, "repairable session JSON should produce a repaired candidate");
  assert.equal(JSON.parse(repairedSessionJson || "{}").title, "Sample Session");

  const unrecoverableSessionJson = tryRepairSessionJson(`{
    "sessionNumber": 1,
    "title": "Broken Session",
    "teacherLessonNotes": {
      "sessionOverview": "Overview"
  `);
  assert.equal(unrecoverableSessionJson, null);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        model: "",
        created_at: "0001-01-01T00:00:00Z",
        message: {
          role: "assistant",
          content: "{\"sessionNumber\":1,\"title\":\"Partial Session\"",
        },
        done: false,
      }),
    } as any);
  try {
    await assert.rejects(
      () => generateWithOllama("test-request", "/tmp", "generate-content-session", "Prompt", { sessionNumber: 1 }),
      (error: any) => error?.code === "OLLAMA_INCOMPLETE_RESPONSE"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(isLanguageSubject("English"), true);
  assert.equal(isLanguageSubject("Mathematics"), false);

  const englishFallback = buildLanguageFallbackStage1Facts(
    `CLASS IX ENGLISH
Reading
Writing
Grammar
Literature
Supplementary Reader`,
    {
      document_metadata: { subject: "English", class: "Class IX" },
      classes: [{ class_name: "Class IX", subject: "English" }],
      units: [],
      chapters: [],
    }
  );
  assert.equal(englishFallback.fallbackApplied, true);
  assert.ok((englishFallback.units || []).length > 0);

  const mathFallback = buildLanguageFallbackStage1Facts(
    `CLASS IX MATHEMATICS
Number System
Algebra`,
    {
      document_metadata: { subject: "Mathematics", class: "Class IX" },
      classes: [{ class_name: "Class IX", subject: "Mathematics" }],
      units: [],
      chapters: [],
    }
  );
  assert.equal((mathFallback.units || []).length, 0);

  console.log("stage1 safety regression passed");
}

void main();

import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const {
    sanitizeJsonText,
    isLanguageSubject,
    buildLanguageFallbackStage1Facts,
  } = await import("./server.ts");

  const sanitizedMarks = sanitizeJsonText('{"marks": 05}');
  assert.equal(sanitizedMarks.changed, true);
  assert.deepEqual(JSON.parse(sanitizedMarks.text), { marks: 5 });

  const sanitizedQuoted = sanitizeJsonText('{"code":"05","marks":08}');
  assert.deepEqual(JSON.parse(sanitizedQuoted.text), { code: "05", marks: 8 });

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

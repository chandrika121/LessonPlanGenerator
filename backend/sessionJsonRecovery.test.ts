import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const { tryRepairSessionJson } = await import("./server.ts");

  const malformed = `{
    "id": "sess-1",
    "title": "Sample session",
    "teacherLessonNotes": {
      "lessonBlocks": [
        {
          "title": "Activity",
          "teacherPrompt": [
            "Discuss the issue"
          ],
          "instructions": [
            "Divide the class into four groups.",
            "Present a scenario on the board.",
              - History: What was here before? Who used it historically?
          ]
        }
      ]
    }
  }`;

  const repaired = tryRepairSessionJson(malformed);
  assert.ok(repaired, "repair should recover the malformed bullet list entries");

  const parsed = JSON.parse(repaired!);
  assert.ok(Array.isArray(parsed.teacherLessonNotes.lessonBlocks));
  const instructions = parsed.teacherLessonNotes.lessonBlocks[0].instructions;
  assert.ok(Array.isArray(instructions));
  assert.equal(instructions[2], "History: What was here before? Who used it historically?");

  console.log("sessionJsonRecovery regression passed");
}

void main();

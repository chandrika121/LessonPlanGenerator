import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const { buildCurriculumUnitsSummary } = await import("./server.ts");

  const englishUnits = buildCurriculumUnitsSummary([
    {
      document_metadata: {
        subject: "English Language and Literature",
      },
      classes: [{
        class_name: "Class IX",
        subject: "English Language and Literature",
        units: [
          {
            unit_id: "U1",
            unit_name: "Reading Skills",
            topics: ["Reading Comprehension through Unseen Passage"],
            subtopics: ["Discursive passage", "Case-based passage"],
            key_concepts: [],
            chapters: [],
          },
          {
            unit_id: "U2",
            unit_name: "Beehive (Prose)",
            explicit_chapters: ["The Fun They Had", "The Sound of Music"],
            topics: [],
            subtopics: [],
            key_concepts: [],
            chapters: [
              {
                chapter_name: "The Fun They Had",
                topics: [],
                subtopics: [],
                key_concepts: [],
              },
              {
                chapter_name: "The Sound of Music",
                topics: [],
                subtopics: [],
                key_concepts: [],
              },
            ],
          },
          {
            unit_id: "U3",
            unit_name: "Language through Literature",
            explicit_chapters: ["Reference to the Context", "Short & Long Answer Questions"],
            topics: [],
            subtopics: [],
            key_concepts: [],
            chapters: [
              {
                chapter_name: "Reference to the Context",
                topics: [],
                subtopics: [],
                key_concepts: [],
              },
              {
                chapter_name: "Short & Long Answer Questions",
                topics: [],
                subtopics: [],
                key_concepts: [],
              },
            ],
          },
        ],
      }],
    },
    {
      document_metadata: {
        subject: "English Language and Literature",
      },
      classes: [{
        class_name: "Class IX",
        subject: "English Language and Literature",
        units: [
          {
            unit_id: "U1",
            unit_name: "Reading Skills",
            topics: [],
            subtopics: [],
            key_concepts: ["Vocabulary", "Inference"],
            chapters: [],
          },
          {
            unit_id: "U2",
            unit_name: "Beehive (Prose)",
            topics: [],
            subtopics: [],
            key_concepts: [],
            chapters: [
              {
                chapter_name: "The Fun They Had",
                topics: ["Theme", "Characterisation"],
                subtopics: [],
                key_concepts: [],
              },
            ],
          },
        ],
      }],
    },
  ]);

  const readingSkills = englishUnits.find((unit: any) => unit.unitName === "Reading Skills");
  assert.ok(readingSkills, "Reading Skills summary unit should exist");
  assert.ok(readingSkills.topics.includes("Reading Comprehension through Unseen Passage"));
  assert.ok(readingSkills.topics.includes("Discursive passage"));
  assert.ok(readingSkills.topics.includes("Vocabulary"));
  assert.ok(readingSkills.topics.includes("Inference"));

  const beehiveProse = englishUnits.find((unit: any) => unit.unitName === "Beehive (Prose)");
  assert.ok(beehiveProse, "Beehive prose summary unit should exist");
  assert.ok(beehiveProse.topics.includes("The Fun They Had"));
  assert.ok(beehiveProse.topics.includes("The Sound of Music"));
  assert.ok(beehiveProse.topics.includes("Theme"));
  assert.match(beehiveProse.description, /The Fun They Had/);

  const literatureAssessment = englishUnits.find((unit: any) => unit.unitName === "Language through Literature");
  assert.ok(literatureAssessment, "Literature assessment summary unit should exist");
  assert.ok(literatureAssessment.topics.includes("Reference to the Context"));
  assert.ok(literatureAssessment.topics.includes("Short & Long Answer Questions"));

  const mathUnits = buildCurriculumUnitsSummary([{
    document_metadata: {
      subject: "Mathematics",
    },
    classes: [{
      class_name: "Class IX",
      subject: "Mathematics",
      units: [{
        unit_id: "U1",
        unit_name: "Algebra",
        topics: ["Polynomials", "Linear Equations in Two Variables"],
        subtopics: [],
        key_concepts: [],
        chapters: [{
          chapter_name: "Algebra",
          topics: [],
          subtopics: [],
          key_concepts: [],
        }],
      }],
    }],
  }]);

  assert.equal(mathUnits.length, 1);
  assert.deepEqual(
    mathUnits[0].topics,
    ["Polynomials", "Linear Equations in Two Variables"],
    "Summary units should ignore duplicate fallback chapters that only repeat the unit name"
  );

  console.log("curriculum summary regression passed");
}

void main();

import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const {
    detectCurriculumClassSegmentsFromSource,
    filterCurriculumToSelectedClasses,
    filterSourceTextToSelectedClasses,
    summarizeCurriculumClasses,
  } = await import("./server.ts");

  const sourceText = `
# Page 7
## ENGLISH LANGUAGE AND LITERATURE
## CLASS – IX (2025-26)
## Section A
Reading Skills
## 1.BEEHIVE
Poems
- 1. The Road Not Taken

# Page 8
## ENGLISH LANGUAGE AND LITERATURE
## CLASS-X (2025-26)
## Section A
Reading Skills
## 1. FIRST FLIGHT
Poems
- 1. Fog
`;

  const detectedSegments = detectCurriculumClassSegmentsFromSource(sourceText);
  assert.deepEqual(
    detectedSegments.map((segment: any) => segment.className),
    ["Class IX", "Class X"],
    "Source detection should find both classes before extraction"
  );

  const selectedSource = filterSourceTextToSelectedClasses(sourceText, ["Class IX"]);
  assert.equal(selectedSource.filtered, true);
  assert.deepEqual(selectedSource.selectedClassNames, ["Class IX"]);
  assert.ok(selectedSource.sourceText.includes("CLASS – IX"));
  assert.ok(!selectedSource.sourceText.includes("CLASS-X"));

  const curriculum = {
    subject: "English Language and Literature",
    gradeLevel: "Class IX / Class X",
    overallDescription: "Combined curriculum",
    units: [
      { unitId: "ix-u1", unitName: "Poems", className: "Class IX", description: "The Road Not Taken", topics: [] },
      { unitId: "x-u1", unitName: "Poems", className: "Class X", description: "Fog", topics: [] },
    ],
    classes: [
      {
        class_name: "Class IX",
        subject: "English Language and Literature",
        units: [
          {
            unit_id: "U1",
            unit_name: "Poems",
            topics: ["The Road Not Taken"],
            subtopics: [],
            key_concepts: [],
            chapters: [
              { chapter_id: "C1", chapter_name: "The Road Not Taken", topics: [], subtopics: [], key_concepts: [] },
            ],
          },
        ],
      },
      {
        class_name: "Class X",
        subject: "English Language and Literature",
        units: [
          {
            unit_id: "U1",
            unit_name: "Poems",
            topics: ["Fog"],
            subtopics: [],
            key_concepts: [],
            chapters: [
              { chapter_id: "C1", chapter_name: "Fog", topics: [], subtopics: [], key_concepts: [] },
            ],
          },
        ],
      },
    ],
    document_metadata: {
      subject: "English Language and Literature",
      class: "Class IX, Class X",
      grade: "",
    },
    normalizedStructure: {
      document_metadata: {
        subject: "English Language and Literature",
        class: "Class IX, Class X",
        grade: "",
      },
      classes: [
        {
          class_name: "Class IX",
          subject: "English Language and Literature",
          units: [
            {
              unit_id: "U1",
              unit_name: "Poems",
              topics: ["The Road Not Taken"],
              subtopics: [],
              key_concepts: [],
              chapters: [
                { chapter_id: "C1", chapter_name: "The Road Not Taken", topics: [], subtopics: [], key_concepts: [] },
              ],
            },
          ],
        },
        {
          class_name: "Class X",
          subject: "English Language and Literature",
          units: [
            {
              unit_id: "U1",
              unit_name: "Poems",
              topics: ["Fog"],
              subtopics: [],
              key_concepts: [],
              chapters: [
                { chapter_id: "C1", chapter_name: "Fog", topics: [], subtopics: [], key_concepts: [] },
              ],
            },
          ],
        },
      ],
    },
    planning_structure: {
      document_metadata: {
        subject: "English Language and Literature",
        class: "Class IX, Class X",
        grade: "",
      },
      classes: [
        {
          class_name: "Class IX",
          subject: "English Language and Literature",
          units: [
            {
              unit_id: "U1",
              unit_name: "Poems",
              topics: ["The Road Not Taken"],
              subtopics: [],
              key_concepts: [],
              chapters: [
                { chapter_id: "C1", chapter_name: "The Road Not Taken", topics: [], subtopics: [], key_concepts: [] },
              ],
            },
          ],
        },
        {
          class_name: "Class X",
          subject: "English Language and Literature",
          units: [
            {
              unit_id: "U1",
              unit_name: "Poems",
              topics: ["Fog"],
              subtopics: [],
              key_concepts: [],
              chapters: [
                { chapter_id: "C1", chapter_name: "Fog", topics: [], subtopics: [], key_concepts: [] },
              ],
            },
          ],
        },
      ],
    },
    faithful_structure: {
      document_metadata: {
        subject: "English Language and Literature",
        class: "Class IX, Class X",
        grade: "",
      },
      classes: [
        {
          class_name: "Class IX",
          subject: "English Language and Literature",
          units: [
            {
              unit_id: "U1",
              unit_name: "Poems",
              topics: ["The Road Not Taken"],
              subtopics: [],
              key_concepts: [],
              chapters: [
                { chapter_id: "C1", chapter_name: "The Road Not Taken", topics: [], subtopics: [], key_concepts: [] },
              ],
            },
          ],
        },
        {
          class_name: "Class X",
          subject: "English Language and Literature",
          units: [
            {
              unit_id: "U1",
              unit_name: "Poems",
              topics: ["Fog"],
              subtopics: [],
              key_concepts: [],
              chapters: [
                { chapter_id: "C1", chapter_name: "Fog", topics: [], subtopics: [], key_concepts: [] },
              ],
            },
          ],
        },
      ],
    },
    stagedExtraction: {
      normalizedStructure: {
        document_metadata: {
          subject: "English Language and Literature",
          class: "Class IX, Class X",
          grade: "",
        },
        classes: [
          {
            class_name: "Class IX",
            subject: "English Language and Literature",
            units: [{ unit_id: "U1", unit_name: "Poems", chapters: [{ chapter_name: "The Road Not Taken" }] }],
          },
          {
            class_name: "Class X",
            subject: "English Language and Literature",
            units: [{ unit_id: "U1", unit_name: "Poems", chapters: [{ chapter_name: "Fog" }] }],
          },
        ],
      },
    },
  };

  const classSummaries = summarizeCurriculumClasses(curriculum);
  assert.deepEqual(
    classSummaries.map((item: any) => item.className),
    ["Class IX", "Class X"],
    "Multi-class curriculum should report both classes separately"
  );

  const filtered = filterCurriculumToSelectedClasses(curriculum, ["Class IX"]);
  assert.deepEqual(filtered.selectedClassNames, ["Class IX"]);
  assert.equal(filtered.curriculum.gradeLevel, "Class IX");
  assert.equal(filtered.curriculum.units.length, 1);
  assert.equal(filtered.curriculum.units[0].className, "Class IX");
  assert.equal(filtered.curriculum.classes.length, 1);
  assert.equal(filtered.curriculum.classes[0].class_name, "Class IX");
  assert.equal(filtered.curriculum.normalizedStructure.classes.length, 1);
  assert.equal(filtered.curriculum.normalizedStructure.classes[0].class_name, "Class IX");
  assert.equal(filtered.curriculum.planning_structure.classes.length, 1);
  assert.equal(filtered.curriculum.faithful_structure.classes.length, 1);
  assert.equal(filtered.curriculum.document_metadata.class, "Class IX");

  console.log("class selection regression passed");
}

void main();

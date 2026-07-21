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

  const classXiiSource = `
# Page 9
## CLASS – XII
Unit I
Relations and Functions

# Page 10
Prescribed Books:
- 1) Mathematics Textbook for Class XI, NCERT Publications
- 2) Mathematics Part I - Textbook for Class XII, NCERT Publication
- 3) Mathematics Exemplar Problem for Class XI, Published by NCERT
`;
  const classXiiSegments = detectCurriculumClassSegmentsFromSource(classXiiSource);
  assert.deepEqual(
    classXiiSegments.map((segment: any) => segment.className),
    ["Class XII"],
    "Reference-only book lines mentioning another class should not create extra class segments"
  );
  const selectedClassXiiSource = filterSourceTextToSelectedClasses(classXiiSource, ["Class XII"]);
  assert.equal(selectedClassXiiSource.filtered, false);
  assert.deepEqual(selectedClassXiiSource.selectedClassNames, ["Class XII"]);

  const tamilMixedHeadingSource = `
# Page 1
## IX TAMIL (CODE:005)
## இயல் 1
தமிழின் இனிமை

# Page 2
## X TAMIL (CODE:006)
## இயல் 1
மொழி பயணம்
`;
  const tamilSegments = detectCurriculumClassSegmentsFromSource(tamilMixedHeadingSource);
  assert.deepEqual(
    tamilSegments.map((segment: any) => segment.className),
    ["Class IX", "Class X"],
    "Leading grade headings like IX TAMIL / X TAMIL should create separate class segments"
  );
  const tamilSelectedSource = filterSourceTextToSelectedClasses(tamilMixedHeadingSource, ["Class IX"]);
  assert.equal(tamilSelectedSource.filtered, true);
  assert.deepEqual(tamilSelectedSource.selectedClassNames, ["Class IX"]);
  assert.ok(tamilSelectedSource.sourceText.includes("IX TAMIL"));
  assert.ok(!/^## X TAMIL\b/m.test(tamilSelectedSource.sourceText));

  const scienceMixedHeadingSource = `
# Page 3
## Classes XI and XII

# Page 4
## Class –XI
## Physics
Unit I Electrostatics

# Page 5
## XII Chemistry
Unit I Solid State

# Page 6
Prescribed Books:
- Physics, Class XI, Part I
- Chemistry, Class XII, Part II
`;
  const scienceSegments = detectCurriculumClassSegmentsFromSource(scienceMixedHeadingSource);
  assert.deepEqual(
    scienceSegments.map((segment: any) => segment.className),
    ["Class XI", "Class XII"],
    "Mixed heading styles should still separate Class XI and Class XII"
  );
  const scienceSelectedSource = filterSourceTextToSelectedClasses(scienceMixedHeadingSource, ["Class XI"]);
  assert.equal(scienceSelectedSource.filtered, true);
  assert.deepEqual(scienceSelectedSource.selectedClassNames, ["Class XI"]);
  assert.ok(scienceSelectedSource.sourceText.includes("Class –XI"));
  assert.ok(!/^## XII Chemistry\b/m.test(scienceSelectedSource.sourceText));
  assert.ok(!/^.*\bClass XII\b.*$/m.test(scienceSelectedSource.sourceText));

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
  assert.equal(filtered.curriculum.document_metadata.grade, "Class IX");

  const selectedClassOnlyCurriculum = {
    subject: "Mathematics",
    gradeLevel: "Class XII",
    units: [
      {
        unitId: "xii-u1",
        unitName: "Prescribed Books - Mathematics Textbook for Class XI, NCERT Publications",
        className: "Class XII",
        topics: [],
      },
    ],
    classes: [
      {
        class_name: "Class XII",
        subject: "Mathematics",
        units: [
          {
            unit_id: "U1",
            unit_name: "Prescribed Books - Mathematics Textbook for Class XI, NCERT Publications",
            topics: [],
            subtopics: [],
            key_concepts: [],
            chapters: [
              { chapter_id: "C1", chapter_name: "Prescribed Books - Mathematics Textbook for Class XI, NCERT Publications", topics: [], subtopics: [], key_concepts: [] },
            ],
          },
        ],
      },
    ],
    document_metadata: {
      subject: "Mathematics",
      class: "Class XII",
      grade: "Class XII",
    },
    normalizedStructure: {
      classes: [
        {
          class_name: "Class XII",
          subject: "Mathematics",
          units: [
            {
              unit_id: "U1",
              unit_name: "Prescribed Books - Mathematics Textbook for Class XI, NCERT Publications",
              chapters: [{ chapter_name: "Prescribed Books - Mathematics Textbook for Class XI, NCERT Publications" }],
            },
          ],
        },
      ],
    },
    planning_structure: {
      classes: [
        {
          class_name: "Class XII",
          subject: "Mathematics",
          units: [
            {
              unit_id: "U1",
              unit_name: "Prescribed Books - Mathematics Textbook for Class XI, NCERT Publications",
              chapters: [{ chapter_name: "Prescribed Books - Mathematics Textbook for Class XI, NCERT Publications" }],
            },
          ],
        },
      ],
    },
    faithful_structure: {
      classes: [
        {
          class_name: "Class XII",
          subject: "Mathematics",
          units: [
            {
              unit_id: "U1",
              unit_name: "Prescribed Books - Mathematics Textbook for Class XI, NCERT Publications",
              chapters: [{ chapter_name: "Prescribed Books - Mathematics Textbook for Class XI, NCERT Publications" }],
            },
          ],
        },
      ],
    },
  };
  const filteredXiiOnly = filterCurriculumToSelectedClasses(selectedClassOnlyCurriculum, ["Class XII"]);
  assert.deepEqual(filteredXiiOnly.selectedClassNames, ["Class XII"]);
  assert.equal(filteredXiiOnly.curriculum.document_metadata.class, "Class XII");
  assert.equal(filteredXiiOnly.curriculum.classes.length, 1);
  assert.equal(filteredXiiOnly.curriculum.classes[0].class_name, "Class XII");

  const mixedHeadingCurriculum = {
    subject: "Science",
    gradeLevel: "Class XI / Class XII",
    units: [
      { unitId: "xi-u1", unitName: "Electrostatics", className: "Class XI", topics: [] },
      { unitId: "xii-u1", unitName: "Solid State", className: "Class XII", topics: [] },
    ],
    classes: [
      { class_name: "Class XI", subject: "Physics", units: [{ unit_id: "U1", unit_name: "Electrostatics", chapters: [] }] },
      { class_name: "Class XII", subject: "Chemistry", units: [{ unit_id: "U1", unit_name: "Solid State", chapters: [] }] },
    ],
    document_metadata: {
      class: "Class XI, Class XII",
      grade: "",
    },
    normalizedStructure: {
      document_metadata: {
        class: "Class XI, Class XII",
        grade: "",
      },
      classes: [
        { class_name: "Class XI", subject: "Physics", units: [{ unit_id: "U1", unit_name: "Electrostatics", chapters: [] }] },
        { class_name: "Class XII", subject: "Chemistry", units: [{ unit_id: "U1", unit_name: "Solid State", chapters: [] }] },
      ],
    },
    planning_structure: {
      classes: [
        { class_name: "Class XI", subject: "Physics", units: [{ unit_id: "U1", unit_name: "Electrostatics", chapters: [] }] },
        { class_name: "Class XII", subject: "Chemistry", units: [{ unit_id: "U1", unit_name: "Solid State", chapters: [] }] },
      ],
    },
    faithful_structure: {
      classes: [
        { class_name: "Class XI", subject: "Physics", units: [{ unit_id: "U1", unit_name: "Electrostatics", chapters: [] }] },
        { class_name: "Class XII", subject: "Chemistry", units: [{ unit_id: "U1", unit_name: "Solid State", chapters: [] }] },
      ],
    },
  };
  const filteredXiOnly = filterCurriculumToSelectedClasses(mixedHeadingCurriculum, ["Class XI"]);
  assert.deepEqual(filteredXiOnly.selectedClassNames, ["Class XI"]);
  assert.equal(filteredXiOnly.curriculum.gradeLevel, "Class XI");
  assert.equal(filteredXiOnly.curriculum.document_metadata.class, "Class XI");
  assert.equal(filteredXiOnly.curriculum.document_metadata.grade, "Class XI");
  assert.deepEqual(
    filteredXiOnly.curriculum.normalizedStructure.classes.map((item: any) => item.class_name),
    ["Class XI"]
  );
  assert.deepEqual(
    filteredXiOnly.curriculum.planning_structure.classes.map((item: any) => item.class_name),
    ["Class XI"]
  );
  assert.deepEqual(
    filteredXiOnly.curriculum.faithful_structure.classes.map((item: any) => item.class_name),
    ["Class XI"]
  );
  assert.deepEqual(
    filteredXiOnly.curriculum.units.map((item: any) => item.className),
    ["Class XI"]
  );

  console.log("class selection regression passed");
}

void main();

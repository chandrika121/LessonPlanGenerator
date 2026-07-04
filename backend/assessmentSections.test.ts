import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const {
    deriveAssessmentSectionsForSession,
    normalizeAssessmentResponseToCustomization,
  } = await import("./server.ts");

  const englishStructure = {
    document_metadata: {
      subject: "English Language and Literature",
      class: "Class X",
    },
    assessment_information: {
      marks_distribution: [
        "Section A: Reading Skills (20 Marks)",
        "Section B: Writing Skills and Grammar (20 Marks)",
        "Section C: Language through Literature (40 Marks)",
      ],
    },
    classes: [{
      class_name: "Class X",
      subject: "English Language and Literature",
      units: [
        {
          unit_id: "U1",
          unit_name: "Reading Skills",
          part_or_section: "Section A - Reading Skills",
          topics: ["Reading Comprehension through Unseen Passage"],
          chapters: [{
            chapter_name: "Reading Skills",
            part_or_section: "Section A - Reading Skills",
            topics: ["Reading Comprehension through Unseen Passage"],
          }],
        },
        {
          unit_id: "U2",
          unit_name: "First Flight",
          part_or_section: "Section C - Literature",
          chapters: [{
            chapter_name: "A Letter to God",
            part_or_section: "Section C - Literature",
            topics: ["Theme", "Character sketch"],
          }],
        },
      ],
    }],
  };

  const readingSections = deriveAssessmentSectionsForSession({
    curriculumStructure: englishStructure,
    selectedChapters: ["Reading Comprehension through Unseen Passage"],
    gradeLevel: "Class X",
  });
  assert.deepEqual(
    readingSections.map((item: any) => item.title),
    ["Section A - Reading Skills"],
    "English reading session should derive its curriculum section from part_or_section"
  );

  const literatureSections = deriveAssessmentSectionsForSession({
    curriculumStructure: englishStructure,
    selectedChapters: ["A Letter to God"],
    gradeLevel: "Class X",
  });
  assert.deepEqual(
    literatureSections.map((item: any) => item.title),
    ["Section C - Literature"],
    "English literature session should derive its literature section from the matched chapter"
  );

  const scienceFallbackSections = deriveAssessmentSectionsForSession({
    curriculumStructure: {
      document_metadata: { subject: "Science", class: "Class IX" },
      classes: [{
        class_name: "Class IX",
        subject: "Science",
        units: [{
          unit_id: "U1",
          unit_name: "Cell Structure",
          topics: ["Cell organelles"],
          chapters: [{ chapter_name: "Cell Structure" }],
        }],
      }],
    },
    selectedChapters: ["Cell Structure"],
    gradeLevel: "Class IX",
  });
  assert.deepEqual(
    scienceFallbackSections.map((item: any) => item.title),
    ["Assessment"],
    "Chapter-based subjects without explicit sections should fall back to a single Assessment section"
  );
  assert.equal(scienceFallbackSections[0].source, "fallback");

  const economicsFrameworkSections = deriveAssessmentSectionsForSession({
    curriculumStructure: {
      document_metadata: { subject: "Economics", class: "Class XII" },
      assessment_information: {
        marks_distribution: [
          "Section A: Introductory Microeconomics (40 Marks)",
          "Section B: Introductory Macroeconomics (40 Marks)",
        ],
      },
      classes: [{
        class_name: "Class XII",
        subject: "Economics",
        units: [{
          unit_id: "U1",
          unit_name: "Demand",
          chapters: [{ chapter_name: "Demand" }],
        }],
      }],
    },
    selectedChapters: ["National Income"],
    gradeLevel: "Class XII",
  });
  assert.deepEqual(
    economicsFrameworkSections.map((item: any) => item.title),
    ["Section A: Introductory Microeconomics", "Section B: Introductory Macroeconomics"],
    "When no curriculum section matches, assessment framework sections should be used in order"
  );
  assert.ok(economicsFrameworkSections.every((item: any) => item.source === "assessment_framework"));

  const customization = {
    assessmentType: "Session assessment",
    questionTypes: [
      { type: "mcq", questionCount: 2, marksEach: 1 },
      { type: "shortAnswer", questionCount: 1, marksEach: 2 },
      { type: "longAnswer", questionCount: 1, marksEach: 5 },
    ],
  };

  const normalizedSingleSection = normalizeAssessmentResponseToCustomization(
    {
      paper: {
        questions: [
          { id: "legacy-mcq-1", sectionId: "wrong-section", prompt: "Q1", options: ["A", "B"] },
          { prompt: "Q2", options: ["A", "B"] },
          { prompt: "Q3", expectedLength: "1 point" },
          { prompt: "Q4", expectedLength: "2 points" },
        ],
      },
      evaluation: {
        answerKey: {
          items: [
            { answer: "A" },
            { answer: "B" },
            { answer: "Model short" },
            { answer: "Model long" },
          ],
        },
        rubrics: {
          items: [
            { questionId: "q3", criteria: [{ criterion: "Point 1", marks: 2 }] },
            { questionId: "q4", criteria: [{ criterion: "Point 1", marks: 3 }, { criterion: "Point 2", marks: 2 }] },
          ],
        },
      },
      blueprint: {
        sectionPlan: [{ sectionId: "section-reading", title: "Section A - Reading Skills", focus: "Inference and comprehension" }],
      },
    },
    customization as any,
    {
      durationMinutes: 15,
      language: "English",
      preferredDifficulty: "Balanced",
    },
    [{ id: "section-reading", title: "Section A - Reading Skills", source: "curriculum" }]
  );

  assert.ok(
    normalizedSingleSection.paper.questions.every((item: any) => item.sectionId === "section-reading" && item.sectionTitle === "Section A - Reading Skills"),
    "Single valid section should auto-fill or correct question section ids"
  );
  assert.deepEqual(
    normalizedSingleSection.paper.sections,
    [{
      id: "section-reading",
      title: "Section A - Reading Skills",
      marks: 9,
      questionCount: 4,
      questionRefs: ["q1", "q2", "q3", "q4"],
      source: "curriculum",
    }],
    "Rebuilt assessment.sections should reflect normalized question ids and marks"
  );
  assert.equal(normalizedSingleSection.blueprint.sectionPlan[0].focus, "Inference and comprehension");
  assert.deepEqual(
    normalizedSingleSection.evaluation.answerKey.items[2],
    {
      questionId: "q3",
      sectionId: "section-reading",
      sectionTitle: "Section A - Reading Skills",
      answer: "Model short",
      explanation: "",
      marks: 2,
      subtype: "shortAnswer",
    },
    "Answer key entries should align one-to-one with normalized question ids and sections"
  );
  assert.equal(normalizedSingleSection.validation.marksChecks.passed, true);
  assert.equal(normalizedSingleSection.validation.alignmentChecks.passed, true);

  assert.throws(
    () => normalizeAssessmentResponseToCustomization(
      {
        paper: {
          questions: [{ prompt: "Q1", options: ["A", "B"] }],
        },
      },
      {
        assessmentType: "Session assessment",
        questionTypes: [{ type: "mcq", questionCount: 1, marksEach: 1 }],
      } as any,
      {
        durationMinutes: 10,
        language: "English",
        preferredDifficulty: "Balanced",
      },
      [
        { id: "section-a", title: "Section A", source: "assessment_framework" },
        { id: "section-b", title: "Section B", source: "assessment_framework" },
      ]
    ),
    /valid section/,
    "Multiple valid sections should require an explicit section assignment"
  );

  console.log("assessment section regression passed");
}

void main();

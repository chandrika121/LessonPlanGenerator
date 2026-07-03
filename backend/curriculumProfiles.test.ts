import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const {
    buildVersionedCurriculumPayload,
    cleanupCbseStructure,
    detectEnglishModeFromCurriculumInput,
    detectIndicCurriculumModeFromInput,
    detectCurriculumProfile,
    getCurriculumExtractionOllamaOverrides,
    getCurriculumProfileConfig,
    getNotesPromptName,
    isEnglishSubject,
    isIndicCurriculumSubject,
    mergeStage1FactExtractions,
    expandStage1FactsToRawExtraction,
    buildFaithfulStructureFromRawExtraction,
    renderPromptWithEnglishIntelligence,
    shouldUseEnglishIntelligence,
  } = await import("./server.ts");

  const cbseUnitTopic = detectCurriculumProfile(
    "CBSE Class XII Computer Science Unit 1 Computational Thinking and Programming - 2 Unit 2 Computer Networks Unit 3 Database Management Practical Work",
    "Computer_Science_SrSec_2024-25.pdf"
  );
  assert.equal(cbseUnitTopic.profile, "cbse_unit_topic");
  assert.ok(cbseUnitTopic.confidence >= 0.8);

  const multiClass = detectCurriculumProfile(
    "CBSE Class XI Physics Course Structure Class XII Physics Course Structure Unit 1 Motion Unit 1 Electrostatics",
    "Physics_SrSec.pdf"
  );
  assert.equal(multiClass.profile, "multi_class_board_syllabus");

  const semester = detectCurriculumProfile(
    "Semester I Unit 1 Introduction Semester II Unit 2 Advanced Concepts Term End Examination",
    "university_curriculum.pdf"
  );
  assert.equal(semester.profile, "term_semester_curriculum");

  const cbseMath = detectCurriculumProfile(
    "CBSE Mathematics Class IX identify the degree and terms of terms in a polynomial use equations and graphs UNIT II ALGEBRA UNIT IV GEOMETRY UNIT VI STATISTICS AND PROBABILITY",
    "Maths_SecP1IX_2026-27.pdf"
  );
  assert.ok(
    ["cbse_unit_topic", "cbse_unit_chapter_topic"].includes(cbseMath.profile),
    `CBSE math syllabus should stay in a CBSE unit-based profile, got ${cbseMath.profile}`
  );

  const competency = detectCurriculumProfile(
    "Competencies Learning Outcomes Outcome 1 Outcome 2 Performance indicators",
    "outcomes_framework.pdf"
  );
  assert.equal(competency.profile, "competency_outcomes_curriculum");

  const language = detectCurriculumProfile(
    "Reading Writing Grammar Literature Poetry Listening Speaking",
    "english_language_curriculum.pdf"
  );
  assert.equal(language.profile, "language_curriculum");

  assert.equal(isEnglishSubject("English"), true);
  assert.equal(isEnglishSubject("English Language"), true);
  assert.equal(isEnglishSubject("Communicative English"), true);
  assert.equal(isEnglishSubject("Hindi Language"), false);
  assert.equal(isEnglishSubject("Sanskrit"), false);
  assert.equal(isIndicCurriculumSubject("Hindi"), true);
  assert.equal(isIndicCurriculumSubject("Tamil Language"), true);
  assert.equal(isIndicCurriculumSubject("Mathematics"), false);

  assert.equal(
    detectEnglishModeFromCurriculumInput(
      "Subject: English\nReading comprehension\nWriting skills\nGrammar practice",
      "Class_IX_English.pdf"
    ),
    true
  );
  assert.equal(
    detectEnglishModeFromCurriculumInput(
      "Reading Writing Grammar Literature Poetry Listening Speaking",
      "general_language_curriculum.pdf"
    ),
    false
  );
  assert.equal(
    detectIndicCurriculumModeFromInput(
      "Subject: Hindi\nगद्य खंड\nव्याकरण",
      "Class_IX_Hindi.pdf"
    ),
    true
  );
  assert.equal(
    detectIndicCurriculumModeFromInput(
      "தமிழ் பாடத்திட்டம்\nஇலக்கியம்\nஇலக்கணம்",
      "Class_X_Tamil.pdf"
    ),
    true
  );
  assert.equal(
    detectIndicCurriculumModeFromInput(
      "Subject: English\nReading comprehension\nWriting skills",
      "Class_IX_English.pdf"
    ),
    false
  );

  assert.equal(
    shouldUseEnglishIntelligence({
      subject: "English Language",
      sourceText: "Reading Writing Grammar",
      fileName: "english_language_curriculum.pdf",
    }),
    true
  );
  assert.equal(
    shouldUseEnglishIntelligence({
      subject: "Hindi",
      sourceText: "Reading Writing Grammar",
      fileName: "general_language_curriculum.pdf",
    }),
    false
  );
  assert.equal(
    getCurriculumExtractionOllamaOverrides({
      subject: "Hindi",
      sourceText: "गद्य खंड\nव्याकरण",
      fileName: "Class_IX_Hindi.pdf",
    }).model,
    "qwen3.5:35b"
  );
  assert.equal(
    Boolean(getCurriculumExtractionOllamaOverrides({
      subject: "Mathematics",
      sourceText: "Number Systems\nAlgebra",
      fileName: "Class_IX_Math.pdf",
    }).model),
    false
  );

  const mixed = detectCurriculumProfile(
    "Module A General Studies Reference Material Notes and Suggested Readings",
    "mixed.txt"
  );
  assert.equal(mixed.profile, "mixed_or_unknown");

  const cbseConfig = getCurriculumProfileConfig("cbse_unit_topic");
  assert.equal(cbseConfig.allowUnitFallbackChapters, false);
  assert.equal(cbseConfig.expectedStructureType, "unit_topic");

  const termConfig = getCurriculumProfileConfig("term_semester_curriculum");
  assert.equal(termConfig.expectedStructureType, "term_unit_topic");
  assert.ok("terms" in termConfig.stage1SchemaExtension);

  assert.equal(getNotesPromptName("teacher", "Mathematics"), "teacher-notes-generation-math.md");
  assert.equal(getNotesPromptName("student", "Mathematics"), "student-notes-generation-math.md");
  assert.equal(getNotesPromptName("teacher", "English"), "teacher-notes-generation.md");

  const englishWrappedPrompt = renderPromptWithEnglishIntelligence("session-generation.md", {
    SESSION_NUMBER: "1",
    TOTAL_SESSIONS: "10",
    DURATION_MINUTES: "40",
    SUBJECT: "English",
    GRADE_LEVEL: "Class IX",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Poetry", "Grammar"]),
    INCLUDE_LEARNING_OUTCOMES: "YES",
    INCLUDE_INTRODUCTION: "YES",
    INCLUDE_THEORY: "YES",
    INCLUDE_ASSESSMENTS: "YES",
    INCLUDE_ASSIGNMENTS: "YES",
    INCLUDE_NOTES: "YES",
    SELECTED_SECTIONS_JSON: JSON.stringify(["teacherLessonNotes", "studentLessonNotes"]),
    ASSESSMENT_ENGINE_INSTRUCTIONS: "Use the assessment section only for taught content.",
  }, {
    englishMode: true,
    stageLabel: "Session detail generation",
  });
  assert.match(englishWrappedPrompt, /English Subject Intelligence Layer \(Active\)/);
  assert.match(englishWrappedPrompt, /English Curriculum and Pedagogical Intelligence Engine/);

  const genericPrompt = renderPromptWithEnglishIntelligence("session-generation.md", {
    SESSION_NUMBER: "1",
    TOTAL_SESSIONS: "8",
    DURATION_MINUTES: "45",
    SUBJECT: "Mathematics",
    GRADE_LEVEL: "Class IX",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Linear Equations"]),
    INCLUDE_LEARNING_OUTCOMES: "YES",
    INCLUDE_INTRODUCTION: "YES",
    INCLUDE_THEORY: "YES",
    INCLUDE_ASSESSMENTS: "YES",
    INCLUDE_ASSIGNMENTS: "YES",
    INCLUDE_NOTES: "YES",
    SELECTED_SECTIONS_JSON: JSON.stringify(["teacherLessonNotes"]),
    ASSESSMENT_ENGINE_INSTRUCTIONS: "Use the assessment section only for taught content.",
  }, {
    englishMode: false,
    stageLabel: "Session detail generation",
  });
  assert.doesNotMatch(genericPrompt, /English Subject Intelligence Layer \(Active\)/);

  const stage1Facts = mergeStage1FactExtractions([{
    document_metadata: { subject: "Computer Science", class: "Class XII" },
    classes: [{ class_name: "Class XII", subject: "Computer Science" }],
    units: [{
      class_name: "Class XII",
      subject: "Computer Science",
      unit_id: "U3",
      unit_name: "Database Management",
      topics: ["SQL", "Joins"],
    }],
    chapters: [],
  }]);
  const raw = expandStage1FactsToRawExtraction(stage1Facts);
  const faithful = buildFaithfulStructureFromRawExtraction(raw);
  assert.equal(faithful.classes.length, 1);
  assert.equal(faithful.classes[0].units[0].unit_name, "Database Management");
  assert.deepEqual(faithful.classes[0].units[0].topics, ["SQL", "Joins"]);

  const cleanedCbse = cleanupCbseStructure({
    classes: [{
      class_name: "Class IX",
      subject: "Mathematics",
      units: [
        {
          unit_id: "U4",
          unit_name: "Geometry",
          chapters: [
            { chapter_name: "Lines and Angles", topics: [], subtopics: [] },
            { chapter_name: "Circles", topics: [], subtopics: [] },
          ],
          topics: [],
          subtopics: [],
        },
        {
          unit_id: "U4A",
          unit_name: "Geometry (Implicit Unit from Context)",
          chapters: [
            { chapter_name: "Triangles - Congruence Theorems", topics: [], subtopics: [] },
            { chapter_name: "4-gons (Quadrilaterals)", topics: [], subtopics: [] },
          ],
          topics: [],
          subtopics: [],
        },
        {
          unit_id: "U5",
          unit_name: "Mensuration",
          chapters: [
            { chapter_name: "Area and Perimeter", topics: [], subtopics: [] },
          ],
          topics: [],
          subtopics: [],
        },
        {
          unit_id: "U5A",
          unit_name: "Mensuration: Surface Area and Volume",
          chapters: [],
          topics: ["Surface areas and volumes of spheres"],
          subtopics: [],
        },
        {
          unit_id: "U6",
          unit_name: "Statistics and Probability",
          chapters: [
            { chapter_name: "Statistics", topics: [], subtopics: [] },
          ],
          topics: [],
          subtopics: [],
        },
        {
          unit_id: "U6A",
          unit_name: "Introduction to Probability",
          chapters: [],
          topics: ["Concept of probability and randomness"],
          subtopics: [],
        },
      ],
    }],
  });

  assert.equal(cleanedCbse.classes[0].units.length, 3);
  const cleanedGeometry = cleanedCbse.classes[0].units.find((unit: any) => unit.unit_name === "Geometry");
  assert.equal(cleanedGeometry?.chapters?.length, 4);
  const cleanedMensuration = cleanedCbse.classes[0].units.find((unit: any) => unit.unit_name === "Mensuration");
  assert.equal(cleanedMensuration?.chapters?.length, 2);
  assert.ok(
    cleanedMensuration?.chapters?.some((chapter: any) => chapter.chapter_name === "Surface Area and Volume"),
    "Mensuration chapter promoted as a unit should be merged back into the Mensuration unit"
  );
  const cleanedStats = cleanedCbse.classes[0].units.find((unit: any) => unit.unit_name === "Statistics and Probability");
  assert.equal(cleanedStats?.chapters?.length, 2);
  assert.ok(
    cleanedStats?.chapters?.some((chapter: any) => chapter.chapter_name === "Introduction to Probability"),
    "Standalone Introduction to Probability unit should be merged into Statistics and Probability"
  );

  const v1 = buildVersionedCurriculumPayload("v1", { schema_version: "v1", subject: "Computer Science" }, {
    structureType: "unit_topic",
    terms: [{ name: "Semester I" }],
    competenciesCatalog: [{ title: "C1" }],
  });
  assert.equal(v1.schema_version, "v1");
  assert.ok(!("structure_type" in v1));

  const v2 = buildVersionedCurriculumPayload("v2", { schema_version: "v2", subject: "Computer Science" }, {
    structureType: "unit_topic",
    terms: [{ name: "Semester I" }],
    competenciesCatalog: [{ title: "C1" }],
  });
  assert.equal(v2.schema_version, "v2");
  assert.equal(v2.structure_type, "unit_topic");
  assert.equal(v2.terms.length, 1);
  assert.equal(v2.competencies_catalog.length, 1);

  console.log("curriculum profile regression passed");
}

void main();

import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const {
    buildVersionedCurriculumPayload,
    detectCurriculumProfile,
    getCurriculumProfileConfig,
    mergeStage1FactExtractions,
    expandStage1FactsToRawExtraction,
    buildFaithfulStructureFromRawExtraction,
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

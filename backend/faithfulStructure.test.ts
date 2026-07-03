import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const {
    mergeStage1FactExtractions,
    expandStage1FactsToRawExtraction,
    buildFaithfulStructureFromRawExtraction,
    buildApprovedTheoryHierarchy,
  } = await import("./server.ts");

  const stage1Facts = mergeStage1FactExtractions([{
    document_metadata: {
      board: "CBSE",
      subject: "Computer Science",
      class: "Class XI, Class XII",
      grade: "12",
    },
    classes: [
      { class_name: "Class XI", subject: "Computer Science" },
      { class_name: "Class XII", subject: "Computer Science" },
    ],
    units: [
      {
        class_name: "Class XI",
        subject: "Computer Science",
        unit_id: "U2",
        unit_name: "Computational Thinking and Programming - I",
        topics: [
          "Problem solving",
          "Python basics",
          "Data types",
          "Operators",
          "Flow of control",
        ],
        subtopics: ["Strings", "Lists", "Tuples", "Dictionary"],
        key_concepts: ["Python modules"],
      },
      {
        class_name: "Class XII",
        subject: "Computer Science",
        unit_id: "U2",
        unit_name: "Computer Networks",
        topics: [
          "Evolution of networking",
          "Transmission media",
          "Network devices",
        ],
      },
      {
        class_name: "Class XII",
        subject: "Computer Science",
        unit_id: "U3",
        unit_name: "Database Management",
        topics: [
          "Relation",
          "Attribute",
          "Tuple",
          "Domain",
          "Keys",
          "SQL commands",
          "Constraints",
          "Joins",
          "Python-SQL connectivity",
        ],
      },
    ],
    chapters: [],
  }]);

  const raw = expandStage1FactsToRawExtraction(stage1Facts);
  const faithful = buildFaithfulStructureFromRawExtraction(raw);

  assert.equal(faithful.classes.length, 2, "Combined XI/XII syllabus should preserve separate classes");

  const classXI = faithful.classes.find((cls: any) => cls.class_name === "Class XI");
  const classXII = faithful.classes.find((cls: any) => cls.class_name === "Class XII");
  assert.ok(classXI, "Class XI should exist in faithful structure");
  assert.ok(classXII, "Class XII should exist in faithful structure");

  const xiProgramming = classXI.units.find((unit: any) => unit.unit_name === "Computational Thinking and Programming - I");
  assert.deepEqual(
    xiProgramming.topics,
    ["Problem solving", "Python basics", "Data types", "Operators", "Flow of control"],
    "Unit-level topics should be preserved for CBSE unit-topic syllabi"
  );
  assert.deepEqual(
    xiProgramming.subtopics,
    ["Strings", "Lists", "Tuples", "Dictionary"],
    "Unit-level subtopics should be preserved"
  );

  const xiiNetworks = classXII.units.find((unit: any) => unit.unit_name === "Computer Networks");
  const xiiDatabase = classXII.units.find((unit: any) => unit.unit_name === "Database Management");
  assert.ok(xiiNetworks, "Computer Networks should remain a unit");
  assert.ok(xiiDatabase, "Database Management should remain a unit");
  assert.equal(xiiNetworks.chapters.length, 0, "Unit-topic structure should not invent chapter records");
  assert.equal(xiiDatabase.chapters.length, 0, "Unit-topic structure should not invent chapter records");
  assert.ok(xiiDatabase.topics.includes("SQL commands"));
  assert.ok(xiiDatabase.topics.includes("Python-SQL connectivity"));

  const approvedHierarchy = buildApprovedTheoryHierarchy(raw, { classes: raw.classes });
  const planningClassXII = approvedHierarchy.classes.find((cls: any) => cls.class_name === "Class XII");
  const planningDatabaseUnit = planningClassXII.units.find((unit: any) => unit.unit_name === "Database Management");
  assert.ok(planningDatabaseUnit, "Planning hierarchy should still include Database Management as a unit");

  const englishStage1 = mergeStage1FactExtractions([{
    document_metadata: {
      subject: "English",
      class: "Class IX",
    },
    classes: [
      { class_name: "Class IX", subject: "English" },
    ],
    units: [
      {
        class_name: "Class IX",
        subject: "English",
        part_or_section: "Beehive",
        unit_id: "U3",
        unit_name: "Prose",
        topics: ["The Fun They Had", "The Sound of Music"],
      },
      {
        class_name: "Class IX",
        subject: "English",
        part_or_section: "Section C - Literature",
        unit_id: "U3",
        unit_name: "First Flight",
      },
    ],
    chapters: [
      {
        class_name: "Class IX",
        subject: "English",
        part_or_section: "Section C - Literature",
        unit_id: "U3",
        unit_name: "First Flight",
        chapter_name: "Poems",
        topics: ["Dust of Snow", "The Road Not Taken"],
      },
    ],
  }]);

  const englishRaw = expandStage1FactsToRawExtraction(englishStage1);
  const englishFaithful = buildFaithfulStructureFromRawExtraction(englishRaw);
  const englishClassIX = englishFaithful.classes.find((cls: any) => cls.class_name === "Class IX");
  assert.ok(englishClassIX, "English faithful structure should preserve Class IX");
  assert.equal(
    new Set((englishClassIX.units || []).map((unit: any) => unit.unit_id)).size,
    (englishClassIX.units || []).length,
    "English faithful structure should normalize duplicate unit ids within the same class"
  );
  const proseUnit = englishClassIX.units.find((unit: any) => unit.unit_name === "Prose");
  assert.equal(proseUnit?.part_or_section, "Beehive");
  assert.deepEqual(
    (proseUnit?.chapters || []).map((chapter: any) => chapter.chapter_name),
    ["The Fun They Had", "The Sound of Music"],
    "English category units should promote lesson titles into faithful chapters"
  );
  const firstFlightUnit = englishClassIX.units.find((unit: any) => unit.unit_name === "First Flight");
  assert.deepEqual(
    (firstFlightUnit?.chapters || []).map((chapter: any) => chapter.chapter_name),
    ["Dust of Snow", "The Road Not Taken"],
    "English book/category containers should promote actual lesson titles instead of keeping category labels as final chapters"
  );
  assert.ok(
    (firstFlightUnit?.chapters || []).every((chapter: any) => chapter.category_name === "Poems"),
    "Promoted English chapters should preserve their category label"
  );

  console.log("faithful structure regression passed");
}

void main();

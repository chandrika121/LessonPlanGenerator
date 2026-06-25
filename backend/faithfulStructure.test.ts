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

  console.log("faithful structure regression passed");
}

void main();

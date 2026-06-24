import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const {
    mergeStage1FactExtractions,
    expandStage1FactsToRawExtraction,
    buildApprovedTheoryHierarchy,
    buildNormalizedTeachingBlocks,
  } = await import("./server.ts");

  const buildHierarchyFromRaw = (raw: any) => ({
    classes: (raw?.classes || []).map((cls: any) => ({
      class_name: cls.class_name,
      subject: cls.subject,
      units: (cls.units || []).map((unit: any) => ({
        unit_id: unit.unit_id,
        unit_name: unit.unit_name,
        chapter_candidates: (unit.explicit_chapters || []).map((chapterName: string) => ({
          title: chapterName,
          source_type: "explicit_chapter",
        })),
      })),
      raw_nodes: [],
    })),
  });

  const mathStage1 = mergeStage1FactExtractions([{
    classes: [
      { class_name: "Class IX", subject: "Mathematics" },
      { class_name: "Class 9", subject: "Mathematics" },
      { class_name: "", subject: "Mathematics" },
    ],
    units: [
      { class_name: "Class IX", subject: "Mathematics", unit_id: "U1", unit_name: "UNIT I: NUMBER SYSTEM" },
      { class_name: "Class 9", subject: "Mathematics", unit_id: "U2", unit_name: "UNIT II: ALGEBRA" },
      { class_name: "", subject: "Mathematics", unit_id: "U2", unit_name: "Algebra" },
      { class_name: "", subject: "Mathematics", unit_id: "U3", unit_name: "Coordinate Geometry" },
      { class_name: "", subject: "Mathematics", unit_id: "U4", unit_name: "Geometry" },
      { class_name: "", subject: "Mathematics", unit_id: "U5", unit_name: "UNIT V: MENSURATION" },
      { class_name: "", subject: "Mathematics", unit_id: "U5", unit_name: "Mensuration" },
      { class_name: "", subject: "Mathematics", unit_id: "U6", unit_name: "UNIT VI: STATISTICS AND PROBABILITY" },
      { class_name: "", subject: "Mathematics", unit_id: "U6", unit_name: "Statistics and Probability" },
    ],
    chapters: [
      { class_name: "", subject: "Mathematics", unit_id: "U1", unit_name: "UNIT I: NUMBER SYSTEM", chapter_name: "Number System" },
      { class_name: "", subject: "Mathematics", unit_id: "U2", unit_name: "UNIT II: ALGEBRA", chapter_name: "Introduction to Polynomials" },
      { class_name: "", subject: "Mathematics", unit_id: "U2", unit_name: "Algebra", chapter_name: "Sequences and Progressions" },
      { class_name: "", subject: "Mathematics", unit_id: "U2", unit_name: "Algebra", chapter_name: "Exploring Algebraic Identities" },
      { class_name: "", subject: "Mathematics", unit_id: "U2", unit_name: "Algebra", chapter_name: "Linear Equations in Two Variables" },
      { class_name: "", subject: "Mathematics", unit_id: "U3", unit_name: "Coordinate Geometry", chapter_name: "Coordinate Geometry" },
      { class_name: "", subject: "Mathematics", unit_id: "U4", unit_name: "Geometry", chapter_name: "Introduction to Euclid's Geometry: Axioms and Postulates" },
      { class_name: "", subject: "Mathematics", unit_id: "U4", unit_name: "Geometry", chapter_name: "Lines and Angles" },
      { class_name: "", subject: "Mathematics", unit_id: "U4", unit_name: "Geometry", chapter_name: "Triangles - Congruence Theorems" },
      { class_name: "", subject: "Mathematics", unit_id: "U4", unit_name: "Geometry", chapter_name: "4-gons (Quadrilaterals)" },
      { class_name: "", subject: "Mathematics", unit_id: "U4", unit_name: "Geometry", chapter_name: "Circles" },
      { class_name: "", subject: "Mathematics", unit_id: "U5", unit_name: "UNIT V: MENSURATION", chapter_name: "Mensuration : Area and Perimeter" },
      { class_name: "", subject: "Mathematics", unit_id: "U5", unit_name: "Mensuration", chapter_name: "Area and Perimeter" },
      { class_name: "", subject: "Mathematics", unit_id: "U5", unit_name: "Mensuration", chapter_name: "Mensuration : Surface Area and Volume" },
      { class_name: "", subject: "Mathematics", unit_id: "U6", unit_name: "Statistics and Probability", chapter_name: "Statistics" },
      { class_name: "", subject: "Mathematics", unit_id: "U6", unit_name: "UNIT VI: STATISTICS AND PROBABILITY", chapter_name: "Introduction to Probability" },
    ],
  }]);

  const mathRaw = expandStage1FactsToRawExtraction(mathStage1);
  const mathApproved = buildApprovedTheoryHierarchy(mathRaw, buildHierarchyFromRaw(mathRaw));
  assert.equal(mathApproved.classes.length, 1, "Math single-class PDF should collapse to one class");
  assert.equal(mathApproved.classes[0].class_name, "Class IX");
  assert.equal(mathApproved.classes[0].units.length, 6);
  assert.equal(mathApproved.classes[0].units.reduce((sum: number, unit: any) => sum + (unit.chapters?.length || 0), 0), 15);
  assert.ok(!mathApproved.classes.some((cls: any) => !cls.class_name), "Math single-class PDF should not contain blank classes");

  const scienceStage1 = mergeStage1FactExtractions([{
    classes: [
      { class_name: "Class XI", subject: "Physics" },
      { class_name: "Class 11", subject: "Physics" },
      { class_name: "Class XII", subject: "Physics" },
      { class_name: "Class 12", subject: "Physics" },
    ],
    units: [
      ...Array.from({ length: 10 }, (_, i) => ({ class_name: i % 2 === 0 ? "Class XI" : "Class 11", subject: "Physics", unit_id: `U${i + 1}`, unit_name: `Unit ${i + 1}: XI Topic ${i + 1}` })),
      ...Array.from({ length: 9 }, (_, i) => ({ class_name: i % 2 === 0 ? "Class XII" : "Class 12", subject: "Physics", unit_id: `U${i + 1}`, unit_name: `Unit ${i + 1}: XII Topic ${i + 1}` })),
    ],
    chapters: [
      ...Array.from({ length: 14 }, (_, i) => ({ class_name: i % 2 === 0 ? "Class XI" : "Class 11", subject: "Physics", unit_id: `U${Math.min(i + 1, 10)}`, unit_name: `Unit ${Math.min(i + 1, 10)}: XI Topic ${Math.min(i + 1, 10)}`, chapter_name: `XI Chapter ${i + 1}` })),
      ...Array.from({ length: 14 }, (_, i) => ({ class_name: i % 2 === 0 ? "Class XII" : "Class 12", subject: "Physics", unit_id: `U${Math.min(i + 1, 9)}`, unit_name: `Unit ${Math.min(i + 1, 9)}: XII Topic ${Math.min(i + 1, 9)}`, chapter_name: `XII Chapter ${i + 1}` })),
    ],
  }]);

  const scienceRaw = expandStage1FactsToRawExtraction(scienceStage1);
  const scienceApproved = buildApprovedTheoryHierarchy(scienceRaw, buildHierarchyFromRaw(scienceRaw));
  assert.equal(scienceApproved.classes.length, 2, "Physics XI-XII should preserve two classes");
  const classXI = scienceApproved.classes.find((cls: any) => cls.class_name === "Class XI");
  const classXII = scienceApproved.classes.find((cls: any) => cls.class_name === "Class XII");
  assert.equal(classXI?.units.length, 10);
  assert.equal(classXI?.units.reduce((sum: number, unit: any) => sum + (unit.chapters?.length || 0), 0), 14);
  assert.equal(classXII?.units.length, 9);
  assert.equal(classXII?.units.reduce((sum: number, unit: any) => sum + (unit.chapters?.length || 0), 0), 14);

  const chemistryStage1 = mergeStage1FactExtractions([{
    classes: [
      { class_name: "Class XI", subject: "Chemistry" },
      { class_name: "Class XII", subject: "Chemistry" },
    ],
    units: [
      ...Array.from({ length: 9 }, (_, i) => ({ class_name: "Class XI", subject: "Chemistry", unit_id: `U${i + 1}`, unit_name: `Unit ${i + 1}: XI Chemistry ${i + 1}` })),
      ...Array.from({ length: 10 }, (_, i) => ({ class_name: "Class XII", subject: "Chemistry", unit_id: `U${i + 1}`, unit_name: `Unit ${i + 1}: XII Chemistry ${i + 1}` })),
    ],
    chapters: [
      ...Array.from({ length: 9 }, (_, i) => ({ class_name: "Class XI", subject: "Chemistry", unit_id: `U${i + 1}`, unit_name: `Unit ${i + 1}: XI Chemistry ${i + 1}`, chapter_name: `XI Chemistry Chapter ${i + 1}` })),
      ...Array.from({ length: 10 }, (_, i) => ({ class_name: "Class XII", subject: "Chemistry", unit_id: `U${i + 1}`, unit_name: `Unit ${i + 1}: XII Chemistry ${i + 1}`, chapter_name: `XII Chemistry Chapter ${i + 1}` })),
    ],
  }]);

  const chemistryRaw = expandStage1FactsToRawExtraction(chemistryStage1);
  const chemistryApproved = buildApprovedTheoryHierarchy(chemistryRaw, buildHierarchyFromRaw(chemistryRaw));
  assert.equal(chemistryApproved.classes.length, 2, "Chemistry XI-XII should preserve two classes");
  const chemXI = chemistryApproved.classes.find((cls: any) => cls.class_name === "Class XI");
  const chemXII = chemistryApproved.classes.find((cls: any) => cls.class_name === "Class XII");
  assert.equal(chemXI?.units.length, 9);
  assert.equal(chemXI?.units.reduce((sum: number, unit: any) => sum + (unit.chapters?.length || 0), 0), 9);
  assert.equal(chemXII?.units.length, 10);
  assert.equal(chemXII?.units.reduce((sum: number, unit: any) => sum + (unit.chapters?.length || 0), 0), 10);

  const sparseStage1Class = {
    class_name: "Class IX",
    subject: "Science",
    part_or_section: "",
    units: [],
  };
  const stage3Recovered = new Map<string, any>([
    ["class_9", {
      class_name: "Class IX",
      subject: "Science",
      units: [
        {
          unit_id: "U1",
          unit_name: "Matter in Our Surroundings",
          chapters: [{ chapter_name: "Matter in Our Surroundings", source_chapter_name: "Matter in Our Surroundings", assessment_status: "summative", topics: [] }],
        },
        {
          unit_id: "U2",
          unit_name: "Is Matter Around Us Pure",
          chapters: [{ chapter_name: "Is Matter Around Us Pure", source_chapter_name: "Is Matter Around Us Pure", assessment_status: "summative", topics: [] }],
        },
      ],
      formative_content_refs: [],
      validation_report: {},
    }],
  ]);
  const normalizedRecovered = buildNormalizedTeachingBlocks([sparseStage1Class], [sparseStage1Class], stage3Recovered);
  assert.equal(normalizedRecovered.length, 1, "Sparse Stage 1 class should still normalize");
  assert.equal(normalizedRecovered[0].units.length, 2, "Stage 3 summative units should be recovered when Stage 1 units are empty");
  assert.equal((normalizedRecovered[0].formative_content_refs || []).length, 0, "Recovered Stage 3 summative units must not be diverted to formative content");

  const duplicateIdAcrossClasses = mergeStage1FactExtractions([{
    classes: [
      { class_name: "Class IX", subject: "Biology" },
      { class_name: "Class X", subject: "Biology" },
    ],
    units: [
      { class_name: "Class IX", subject: "Biology", part_or_section: "", unit_id: "U1", unit_name: "Cell" },
      { class_name: "Class X", subject: "Biology", part_or_section: "", unit_id: "U1", unit_name: "Heredity" },
    ],
    chapters: [
      { class_name: "Class IX", subject: "Biology", part_or_section: "", unit_id: "U1", unit_name: "Cell", chapter_name: "Cell Structure" },
      { class_name: "Class X", subject: "Biology", part_or_section: "", unit_id: "U1", unit_name: "Heredity", chapter_name: "Mendelian Inheritance" },
    ],
  }]);
  const duplicateClassesRaw = expandStage1FactsToRawExtraction(duplicateIdAcrossClasses);
  const duplicateClassesApproved = buildApprovedTheoryHierarchy(duplicateClassesRaw, buildHierarchyFromRaw(duplicateClassesRaw));
  assert.equal(duplicateClassesApproved.classes.length, 2);
  assert.equal(duplicateClassesApproved.classes[0].units.length, 1);
  assert.equal(duplicateClassesApproved.classes[1].units.length, 1);

  const theoryAndPracticalCollision = {
    classes: [{
      class_name: "Class IX",
      subject: "Biology",
      part_or_section: "",
      units: [
        { unit_id: "U1", unit_name: "Tissues", marks: 10, chapters: [{ chapter_name: "Plant Tissues", source_chapter_name: "Plant Tissues", source_type: "explicit_chapter" }] },
        { unit_id: "U1", unit_name: "Practical Work", marks: null, part_or_section: "Practical", chapters: [] },
      ],
    }],
    chapters: [
      { class_name: "Class IX", subject: "Biology", part_or_section: "", unit_id: "U1", unit_name: "Tissues", chapter_name: "Plant Tissues" },
      { class_name: "Class IX", subject: "Biology", part_or_section: "Practical", unit_id: "U1", unit_name: "Practical Work", chapter_name: "Slide Preparation" },
    ],
  };
  const theoryPracticalApproved = buildApprovedTheoryHierarchy(theoryAndPracticalCollision, buildHierarchyFromRaw(theoryAndPracticalCollision));
  assert.equal(theoryPracticalApproved.classes[0].units.length, 1, "Practical section must not overwrite theory unit with same unit_id");
  assert.equal(theoryPracticalApproved.classes[0].units[0].unit_name, "Tissues");

  const stage1BiologyClass = {
    class_name: "Class IX",
    subject: "Biology",
    part_or_section: "",
    units: [{
      unit_id: "U1",
      unit_name: "Cell",
      marks: 10,
      chapters: [
        { chapter_name: "Cell Structure", source_chapter_name: "Cell Structure", source_type: "explicit_chapter" },
        { chapter_name: "Cell Division", source_chapter_name: "Cell Division", source_type: "explicit_chapter" },
      ],
    }],
  };
  const stage3EmptyChapterMap = new Map<string, any>([
    ["class_9", {
      class_name: "Class IX",
      subject: "Biology",
      units: [
        { unit_id: "U1", unit_name: "Cell", chapters: [] },
      ],
      formative_content_refs: [],
      validation_report: {},
    }],
  ]);
  const normalizedEmptyStage3 = buildNormalizedTeachingBlocks([stage1BiologyClass], [stage1BiologyClass], stage3EmptyChapterMap);
  assert.equal(normalizedEmptyStage3[0].units[0].chapters.length, 2, "Empty Stage 3 chapters must preserve Stage 1 chapters");
  assert.ok(normalizedEmptyStage3[0].units[0].chapters.every((chapter: any) => chapter.chapter_name !== "Unit"));

  const stage3PartialChapterMap = new Map<string, any>([
    ["class_9", {
      class_name: "Class IX",
      subject: "Biology",
      units: [
        {
          unit_id: "U1",
          unit_name: "Cell",
          chapters: [
            {
              chapter_name: "Cell Structure",
              source_chapter_name: "Cell Structure",
              topics: ["Cell membrane"],
              key_concepts: ["Organelle"],
              assessment_status: "summative",
            },
          ],
        },
      ],
      formative_content_refs: [],
      validation_report: {},
    }],
  ]);
  const normalizedPartialStage3 = buildNormalizedTeachingBlocks([stage1BiologyClass], [stage1BiologyClass], stage3PartialChapterMap);
  assert.equal(normalizedPartialStage3[0].units[0].chapters.length, 2, "Partial Stage 3 chapters must not drop unmatched Stage 1 chapters");
  assert.deepEqual(normalizedPartialStage3[0].units[0].chapters[0].topics, ["Cell membrane"]);
  assert.deepEqual(normalizedPartialStage3[0].units[0].chapters[1].topics, []);

  console.log("class normalization regression passed");
}

void main();

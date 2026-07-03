import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const { buildTermDivision } = await import("./server.ts");

  const englishStructure = {
    document_metadata: {
      subject: "English Language and Literature",
      class: "Class IX",
    },
    classes: [{
      class_name: "Class IX",
      subject: "English Language and Literature",
      units: [
        {
          unit_id: "U1",
          unit_name: "Reading Skills",
          marks: 20,
          topics: ["Reading Comprehension through Unseen Passage"],
          subtopics: ["Discursive passage", "Case-based passage"],
          key_concepts: [],
          chapters: [],
        },
        {
          unit_id: "U2",
          unit_name: "Writing Skills and Grammar",
          marks: 20,
          topics: ["Descriptive paragraph", "Story writing"],
          subtopics: ["Determiners", "Tenses", "Modals", "Reported speech"],
          key_concepts: [],
          chapters: [],
        },
        {
          unit_id: "U3",
          unit_name: "Language through Literature",
          marks: 40,
          topics: ["Reference to the Context", "Short & Long Answer Questions"],
          subtopics: [],
          key_concepts: [],
          chapters: [
            { chapter_id: "C1", chapter_name: "Reference to the Context", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C2", chapter_name: "Short & Long Answer Questions", topics: [], subtopics: [], key_concepts: [] },
          ],
        },
        {
          unit_id: "U4",
          unit_name: "Beehive (Prose)",
          marks: null,
          topics: [],
          subtopics: [],
          key_concepts: [],
          chapters: [
            { chapter_id: "C1", chapter_name: "The Fun They Had", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C2", chapter_name: "The Sound of Music", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C3", chapter_name: "The Little Girl", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C4", chapter_name: "A Truly Beautiful Mind", topics: [], subtopics: [], key_concepts: [] },
          ],
        },
        {
          unit_id: "U5",
          unit_name: "Beehive (Poems)",
          marks: null,
          topics: [],
          subtopics: [],
          key_concepts: [],
          chapters: [
            { chapter_id: "C1", chapter_name: "The Road Not Taken", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C2", chapter_name: "Wind", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C3", chapter_name: "Rain on the Roof", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C4", chapter_name: "A Slumber Did My Spirit Seal", topics: [], subtopics: [], key_concepts: [] },
          ],
        },
        {
          unit_id: "U6",
          unit_name: "Moments",
          marks: null,
          topics: [],
          subtopics: [],
          key_concepts: [],
          chapters: [
            { chapter_id: "C1", chapter_name: "The Lost Child", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C2", chapter_name: "The Adventures of Toto", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C3", chapter_name: "Iswaran the Storyteller", topics: [], subtopics: [], key_concepts: [] },
            { chapter_id: "C4", chapter_name: "The Beggar", topics: [], subtopics: [], key_concepts: [] },
          ],
        },
      ],
    }],
  };

  const division = buildTermDivision(englishStructure, 3);
  assert.equal(division.term_count, 3);

  const termBlockCounts = division.terms.map((term: any) => term.total_teaching_blocks);
  const termMarks = division.terms.map((term: any) =>
    Number(
      (term.items || []).reduce(
        (sum: number, item: any) => sum + (item.teaching_blocks || []).reduce((inner: number, block: any) => inner + Number(block.marks || 0), 0),
        0
      ).toFixed(2)
    )
  );
  const blockNames = division.terms.flatMap((term: any) =>
    (term.items || []).flatMap((item: any) => (item.teaching_blocks || []).map((block: any) => String(block.block_name || "")))
  );

  assert.ok(
    Math.max(...termBlockCounts) - Math.min(...termBlockCounts) <= 1,
    `English term division should stay block-balanced across terms, received ${JSON.stringify(termBlockCounts)}`
  );
  assert.ok(termMarks.every((marks: number) => marks > 0), `English term marks should be distributed across all terms, received ${JSON.stringify(termMarks)}`);
  assert.equal(
    Number(termMarks.reduce((sum: number, marks: number) => sum + marks, 0).toFixed(2)),
    80,
    "Distributed English term marks should preserve the original annual total"
  );
  assert.ok(
    !blockNames.includes("Reference to the Context") && !blockNames.includes("Short & Long Answer Questions"),
    "Assessment-pattern English literature labels should not appear as teachable term blocks"
  );

  assert.ok(
    division.terms[0].items.some((item: any) => item.unit_name === "Writing Skills and Grammar"),
    "Term 1 should include both foundational skills blocks instead of isolating them into separate terms"
  );
  assert.ok(
    division.terms[1].items.some((item: any) => item.unit_name === "Beehive (Prose)"),
    "Middle term should include literature chapters instead of pushing all literature to the last term"
  );
  assert.ok(
    division.terms[2].items.some((item: any) => item.unit_name === "Moments"),
    "Later term should still retain ordered literature coverage"
  );

  console.log("term division regression passed");
}

void main();

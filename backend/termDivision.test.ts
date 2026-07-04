import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const { buildTermDivision, buildSessionAllocationRecommendationsForTerm } = await import("./server.ts");

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
  const termMarks = division.terms.map((term: any) => Number(term.total_marks || 0));
  const blockNames = division.terms.flatMap((term: any) =>
    (term.items || []).flatMap((item: any) => (item.teaching_blocks || []).map((block: any) => String(block.block_name || "")))
  );
  const recurringStrandTitlesByTerm = division.terms.map((term: any) =>
    (term.recurring_strands || []).map((strand: any) => strand.title)
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
    division.terms.every((term: any) =>
      (term.recurring_strands || []).some((strand: any) => strand.title === "Reading Skills") &&
      (term.recurring_strands || []).some((strand: any) => strand.title === "Writing Skills") &&
      (term.recurring_strands || []).some((strand: any) => strand.title === "Grammar")
    ),
    `English recurring strands should be distributed across every term, received ${JSON.stringify(recurringStrandTitlesByTerm)}`
  );
  const literatureUnitsByTerm = division.terms.map((term: any) =>
    (term.items || []).map((item: any) => item.unit_name)
  );
  assert.ok(
    literatureUnitsByTerm.filter((items: string[]) =>
      items.some((item) => item === "Beehive (Prose)" || item === "Beehive (Poems)" || item === "Moments")
    ).length >= 2,
    `English literature coverage should be spread across multiple terms, received ${JSON.stringify(literatureUnitsByTerm)}`
  );
  assert.ok(
    literatureUnitsByTerm[literatureUnitsByTerm.length - 1].some((item: string) => item === "Beehive (Poems)" || item === "Moments"),
    "Later terms should still retain ordered literature coverage"
  );
  assert.ok(
    division.terms.every((term: any) =>
      !(term.items || []).some((item: any) => item.unit_name === "Reading Skills" || item.unit_name === "Writing Skills and Grammar")
    ),
    "English recurring strands should not remain as one-time discrete chapter units inside term items"
  );

  const termRows = division.terms.flatMap((term: any) => {
    const recurringStrandDetails = (term.recurring_strands || []).map((strand: any) => ({
      title: strand.title,
      marks: strand.allocated_marks,
      estimatedSessions: strand.estimated_sessions,
    }));
    return (term.items || []).map((item: any) => ({
      className: "Class IX",
      termName: term.term_name,
      termNumber: term.term_number,
      unitName: item.unit_name,
      chapters: (item.teaching_blocks || []).map((block: any) => block.block_name),
      recurringStrands: recurringStrandDetails.map((strand: any) => strand.title),
      recurringStrandDetails,
      marks: (item.teaching_blocks || []).reduce((sum: number, block: any) => sum + Number(block.marks || 0), 0),
    }));
  });
  const termOneRows = termRows.filter((row: any) => row.termNumber === 1);
  const sessionRecommendations = buildSessionAllocationRecommendationsForTerm({
    normalizedStructure: englishStructure,
    selectedRows: termOneRows,
    selectedTermKey: "Class IX::Term 1::1",
    subject: "English Language and Literature",
    termCapacity: 10,
    durationMinutes: 45,
  }).recommendations;

  assert.ok(
    sessionRecommendations.some((item: any) => item.chapterName === "Reading Skills Practice"),
    "English session recommendations should interleave recurring reading practice"
  );
  assert.ok(
    sessionRecommendations.some((item: any) => item.chapterName === "Writing Skills Practice"),
    "English session recommendations should interleave recurring writing practice"
  );
  assert.ok(
    sessionRecommendations.some((item: any) => item.chapterName === "Grammar Practice"),
    "English session recommendations should interleave recurring grammar practice"
  );
  assert.ok(
    sessionRecommendations.some((item: any) => item.chapterName === "The Fun They Had"),
    "English session recommendations should still include literature chapters"
  );
  const firstThreeRecommendations = sessionRecommendations.slice(0, 3).map((item: any) => item.chapterName);
  assert.ok(
    firstThreeRecommendations.every((name: string) => !name.includes("Practice") && !name.includes("Vocabulary Development")),
    `English session recommendations should begin with lesson-based sessions, received ${JSON.stringify(firstThreeRecommendations)}`
  );
  assert.ok(
    sessionRecommendations.slice(0, 2).every((item: any) => item.sessionKind === "lesson"),
    "English session recommendations should mark the opening rows as lesson sessions"
  );
  assert.ok(
    sessionRecommendations.some((item: any) => item.sessionKind === "strand_practice"),
    "English session recommendations should retain explicit practice session rows"
  );
  assert.ok(
    sessionRecommendations.slice(2).some((item: any) => item.sessionKind === "strand_practice"),
    "English session recommendations should introduce practice sessions only after lesson flow begins"
  );

  const mathRecommendations = buildSessionAllocationRecommendationsForTerm({
    normalizedStructure: {
      document_metadata: { subject: "Mathematics", class: "Class IX" },
      classes: [{
        class_name: "Class IX",
        subject: "Mathematics",
        units: [{
          unit_id: "M1",
          unit_name: "Algebra",
          chapters: [
            { chapter_id: "C1", chapter_name: "Number Systems", topics: ["Real numbers"] },
            { chapter_id: "C2", chapter_name: "Polynomials", topics: ["Polynomials"] },
          ],
        }],
      }],
    },
    selectedRows: [{
      className: "Class IX",
      termName: "Term 1",
      termNumber: 1,
      unitName: "Algebra",
      chapters: ["Number Systems", "Polynomials"],
      recurringStrands: [],
      recurringStrandDetails: [],
      marks: 20,
    }],
    selectedTermKey: "Class IX::Term 1::1",
    subject: "Mathematics",
    termCapacity: 4,
    durationMinutes: 45,
  }).recommendations;
  assert.ok(
    mathRecommendations.every((item: any) => item.sessionKind === "lesson" || item.sessionKind == null),
    "Non-English session recommendations should remain lesson-based"
  );

  console.log("term division regression passed");
}

void main();

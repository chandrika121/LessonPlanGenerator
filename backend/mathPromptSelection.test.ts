import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const { isMathSubject, getNotesPromptName, normalizeMathGeneratedNotes, sanitizeMathDiagramSpec } = await import("./server.ts");

  assert.equal(isMathSubject("Mathematics"), true);
  assert.equal(isMathSubject("Maths"), true);
  assert.equal(isMathSubject("Applied Mathematics"), true);
  assert.equal(isMathSubject("Physics"), false);

  assert.equal(getNotesPromptName("teacher", "Mathematics"), "teacher-notes-generation-math.md");
  assert.equal(getNotesPromptName("student", "Applied Mathematics"), "student-notes-generation-math.md");
  assert.equal(getNotesPromptName("teacher", "Chemistry"), "teacher-notes-generation.md");

  const unsafeDiagram = sanitizeMathDiagramSpec({
    id: "bad",
    type: "rightTriangle",
    title: "<script>alert(1)</script>",
    svgCode: "<svg></svg>",
    points: [{ id: "A", x: -100, y: 1000 }, { id: "B", x: 245, y: 155 }, { id: "C", x: 65, y: 55 }],
    lines: [{ from: "A", to: "B", label: "base", highlight: true }, { from: "A", to: "Z" }],
  });
  assert.equal(unsafeDiagram.type, "rightTriangle");
  assert.equal(unsafeDiagram.template, "rightTriangle");
  assert.equal("svgCode" in unsafeDiagram, false);
  assert.equal(unsafeDiagram.title.includes("<"), false);
  assert.equal(unsafeDiagram.points[0].x, 0);
  assert.equal(unsafeDiagram.points[0].y, 220);
  assert.equal(unsafeDiagram.lines.length, 1);

  const normalized = normalizeMathGeneratedNotes({
    studentLessonNotes: {
      title: "Pythagoras theorem",
      revisionSection: { formulas: ["a^2 + b^2 = c^2"] },
      sections: [{ heading: "Visual", explanation: "A right triangle", visualAssets: [{ imageDataUrl: "data:image/png;base64,bad" }] }],
      workedExamples: [{ title: "Find hypotenuse", problem: "Right triangle with legs 3 and 4", steps: ["Use Pythagoras"] }],
    },
  }, {
    subject: "Mathematics",
    selectedChapters: ["Triangles", "Pythagoras theorem"],
    sessionTitle: "Right triangle applications",
  });
  assert.equal(normalized.studentLessonNotes.geometryDiagrams.length, 1);
  assert.equal(normalized.studentLessonNotes.geometryDiagrams[0].type, "rightTriangle");
  assert.equal(normalized.studentLessonNotes.geometryDiagrams[0].template, "rightTriangle");
  assert.equal(normalized.studentLessonNotes.formulaCards.length, 1);
  assert.equal(normalized.studentLessonNotes.sections[0].visualAssets.length, 0);
  assert.equal(normalized.studentLessonNotes.workedExamples[0].diagramRef, normalized.studentLessonNotes.geometryDiagrams[0].id);
  assert.equal(typeof normalized.studentLessonNotes.formulaCards[0].formula, "object");
  assert.equal(normalized.studentLessonNotes.formulaCards[0].formula.latex, "a^2 + b^2 = c^2");

  const rootConstruction = normalizeMathGeneratedNotes({
    studentLessonNotes: {
      title: "Constructing square roots on a number line",
      geometryDiagrams: [{
        id: "sqrt-bad",
        type: "rightTriangle",
        title: "Constructing √2 and √3",
        caption: "A spiral of right triangles starting from the origin to locate irrational numbers.",
        labels: [
          { text: "√2", x: 120, y: 210 },
          { text: "√3", x: 125, y: 214 },
          { text: "90 deg", x: 128, y: 216 },
        ],
      }],
      workedExamples: [{ title: "Locate √5", problem: "Construct and locate √5 on the number line." }],
    },
  }, {
    subject: "Maths",
    selectedChapters: ["Irrational numbers"],
    sessionTitle: "Constructing irrational numbers",
  });
  assert.equal(rootConstruction.studentLessonNotes.geometryDiagrams[0].type, "numberLine");
  assert.equal(["sqrtNumberLineConstruction", "theodorusSpiral"].includes(rootConstruction.studentLessonNotes.geometryDiagrams[0].template), true);
  assert.deepEqual(rootConstruction.studentLessonNotes.geometryDiagrams[0].params.roots, [2, 3, 5]);

  const upgradedMath = normalizeMathGeneratedNotes({
    studentLessonNotes: {
      title: "Rationalising the denominator",
      workedExamples: [{
        title: "Render fraction",
        problem: "Rationalise 5/√3",
        given: ["5/√3"],
        formula: ["a/b = a/b"],
        solutionSteps: ["Multiply numerator and denominator by sqrt(3)", "[5(√3)] / [(√3)(√3)]", "5√3 / 3"],
        finalAnswer: "5/√3 = 5√3/3",
      }],
    },
  }, {
    subject: "Mathematics",
    selectedChapters: ["Real numbers"],
    sessionTitle: "Rationalising denominators",
  });
  const upgradedExample = upgradedMath.studentLessonNotes.workedExamples[0];
  assert.equal(typeof upgradedExample.given[0], "object");
  assert.equal(upgradedExample.given[0].text, "");
  assert.equal(String(upgradedExample.given[0].latex).includes("\\frac"), true);
  assert.equal(typeof upgradedExample.solutionSteps[1], "object");
  assert.equal(upgradedExample.solutionSteps[1].text, "");
  assert.equal(String(upgradedExample.solutionSteps[1].latex).includes("\\frac"), true);
  assert.equal(typeof upgradedExample.finalAnswer, "object");

  const repairedFraction = normalizeMathGeneratedNotes({
    studentLessonNotes: {
      title: "Rationalising binomial denominators",
      workedExamples: [{
        title: "Malformed fraction recovery",
        problem: "Simplify 4/(2-√3).",
        solutionSteps: ["\\frac4(2+\\sqrt{3})4-3"],
        finalAnswer: "\\frac4(2+\\sqrt{3})4-3",
      }],
    },
  }, {
    subject: "Mathematics",
    selectedChapters: ["Real numbers"],
    sessionTitle: "Rationalising denominators",
  });
  const repairedExample = repairedFraction.studentLessonNotes.workedExamples[0];
  assert.equal(typeof repairedExample.solutionSteps[0], "object");
  assert.equal(repairedExample.solutionSteps[0].latex, "\\frac{4(2+\\sqrt{3})}{4-3}");
  assert.equal(repairedExample.finalAnswer.latex, "\\frac{4(2+\\sqrt{3})}{4-3}");

  const latexTextHybrid = normalizeMathGeneratedNotes({
    studentLessonNotes: {
      title: "Rationalising surds",
      sections: [{
        heading: "Main idea",
        explanation: "Simplify \\frac{3}{\\sqrt{5}} by rationalizing the denominator.",
      }],
      proofSteps: ["\\text{Expression: } \\frac{3}{\\sqrt{5}}"],
      workedExamples: [{
        title: "Labelled expression",
        given: ["\\text{Expression: } \\frac{3}{\\sqrt{5}}"],
        formula: ["\\text{Rule: } \\frac{a}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b}"],
        solutionSteps: ["\\text{Multiply by: } \\sqrt{5}"],
        finalAnswer: "\\text{Answer: } \\frac{3\\sqrt{5}}{5}",
      }],
      revisionSection: {
        formulas: ["\\text{Expression: } \\frac{3}{\\sqrt{5}}"],
      },
    },
  }, {
    subject: "Mathematics",
    selectedChapters: ["Real numbers"],
    sessionTitle: "Rationalising denominators",
  });
  const labelledExample = latexTextHybrid.studentLessonNotes.workedExamples[0];
  assert.equal(typeof latexTextHybrid.studentLessonNotes.sections[0].explanation, "string");
  assert.equal(typeof latexTextHybrid.studentLessonNotes.workedExamples[0].solutionSteps[0], "object");
  assert.equal(typeof latexTextHybrid.studentLessonNotes.proofSteps[0], "object");
  assert.equal(latexTextHybrid.studentLessonNotes.proofSteps[0].text, "Expression:");
  assert.equal(latexTextHybrid.studentLessonNotes.proofSteps[0].latex, "\\frac{3}{\\sqrt{5}}");
  assert.equal(typeof labelledExample.given[0], "object");
  assert.equal(labelledExample.given[0].text, "Expression:");
  assert.equal(labelledExample.given[0].latex, "\\frac{3}{\\sqrt{5}}");
  assert.equal(labelledExample.formula[0].text, "Rule:");
  assert.equal(labelledExample.formula[0].displayLatex, "\\frac{a}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b}");
  assert.equal(labelledExample.solutionSteps[0].text, "Multiply by:");
  assert.equal(labelledExample.solutionSteps[0].latex, "\\sqrt{5}");
  assert.equal(labelledExample.finalAnswer.text, "Answer:");
  assert.equal(labelledExample.finalAnswer.latex, "\\frac{3\\sqrt{5}}{5}");
  assert.equal(typeof latexTextHybrid.studentLessonNotes.revisionSection.formulas[0], "object");
  assert.equal(latexTextHybrid.studentLessonNotes.revisionSection.formulas[0].text, "Expression:");

  const partiallyNormalizedMathObject = normalizeMathGeneratedNotes({
    studentLessonNotes: {
      title: "Rationalising surds",
      workedExamples: [{
        title: "Already object-shaped but duplicated",
        given: [{
          text: "Expression: 5/√3",
          latex: "Expression: \\frac{5}{\\sqrt{3}}",
          displayLatex: "Expression: \\frac{5}{\\sqrt{3}}",
        }],
        finalAnswer: {
          text: "\\text{Answer: } \\frac{5\\sqrt{3}}{3}",
          latex: "\\text{Answer: } \\frac{5\\sqrt{3}}{3}",
          displayLatex: "\\text{Answer: } \\frac{5\\sqrt{3}}{3}",
        },
      }],
    },
  }, {
    subject: "Mathematics",
    selectedChapters: ["Real numbers"],
    sessionTitle: "Rationalising denominators",
  });
  const normalizedObjectExample = partiallyNormalizedMathObject.studentLessonNotes.workedExamples[0];
  assert.equal(normalizedObjectExample.given[0].text, "Expression:");
  assert.equal(normalizedObjectExample.given[0].latex, "\\frac{5}{\\sqrt{3}}");
  assert.equal(normalizedObjectExample.given[0].displayLatex, "\\frac{5}{\\sqrt{3}}");
  assert.equal(normalizedObjectExample.finalAnswer.text, "Answer:");
  assert.equal(normalizedObjectExample.finalAnswer.latex, "\\frac{5\\sqrt{3}}{3}");
  assert.equal(normalizedObjectExample.finalAnswer.displayLatex, "\\frac{5\\sqrt{3}}{3}");

  const legTypoCleanup = normalizeMathGeneratedNotes({
    studentLessonNotes: {
      title: "Pythagoras theorem",
      workedExamples: [{
        title: "Find the hypotenuse",
        given: [
          "Leg a = 6 cm",
          { text: "Leg b = 8 cm", latex: "b = 8" },
        ],
      }],
    },
  }, {
    subject: "Mathematics",
    selectedChapters: ["Triangles"],
    sessionTitle: "Right triangle applications",
  });
  const typoCleanupExample = legTypoCleanup.studentLessonNotes.workedExamples[0];
  assert.equal(typoCleanupExample.given[0], "Let a = 6 cm");
  assert.equal(typoCleanupExample.given[1], "Let b = 8 cm");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

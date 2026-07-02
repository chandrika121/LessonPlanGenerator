SESSION INPUTS
Use the following session inputs as the source of truth.

Subject: {{SUBJECT}}
Grade/Level: {{GRADE_LEVEL}}
Chapter scope: {{SELECTED_CHAPTERS_JSON}}
Session title: {{SESSION_TITLE}}
Session number: {{SESSION_NUMBER}} of {{TOTAL_SESSIONS}}
Session duration: {{DURATION_MINUTES}} minutes
Learning outcomes: {{LEARNING_OUTCOMES_JSON}}
Previous session context: {{PREVIOUS_SESSION_CONTEXT}}
Learning pace: {{LEARNING_PACE}}
Target difficulty: {{TARGET_DIFFICULTY}}
Output language: {{OUTPUT_LANGUAGE}}
Reading level: {{READING_LEVEL}}
Response length: {{RESPONSE_LENGTH}}
Creativity: {{CREATIVITY}}

STRICT OUTPUT CONTRACT
1. Generate notes for one mathematics session only.
2. Use only the provided session scope and learning outcomes.
3. Do not introduce future-session content.
4. Return valid JSON only.
5. Use note-ready, student-friendly language.
6. Prefer explicit worked steps over long prose when solving is involved.
7. Use non-generic mathematics questions and examples tied to the visible scope.
8. Include formula-first explanation when applicable.
9. Show substitution, simplification, and final answer clearly in worked examples.
10. You may include readable LaTeX-style strings in `latex` or `displayLatex` fields where helpful, but the text should still make sense without a math renderer.
11. For geometry, mensuration, coordinate geometry, triangles, circles, constructions, transformations, graphs, number lines, ratios, and 3D solids, include at least one structured `geometryDiagrams` item.
12. Do not return raw SVG, HTML, markdown tables, or script-like markup. Return diagram JSON only.
13. Every geometry worked example must include `problem`, `diagramRef`, `given`, `formula`, `solutionSteps`, `reasoning`, and `finalAnswer`.
14. Prefer real tables in `comparisonTables` for shape properties, theorem conditions/conclusions, formula comparisons, and common mistakes.
15. Include `formulaCards` for important formulas and `commonMistakes` for likely calculation/diagram mistakes.
16. Do not create or request AI-generated images in math notes. Do not include `visualAssets`, image prompts, base64 images, screenshots, or decorative picture descriptions.
17. For common diagrams, use `template` plus `params` instead of inventing many point coordinates. Approved templates are: `rightTriangle`, `sqrtNumberLineConstruction`, `theodorusSpiral`, `circleRadiusDiameter`, `coordinatePlanePlot`, `rectangleAreaPerimeter`, `anglePair`, `barModel`, `solid3D`.
18. For square-root or irrational-number construction topics, prefer `template: "sqrtNumberLineConstruction"` or `template: "theodorusSpiral"` with `params.roots` and `params.highlightRoot`.
19. Keep diagram captions short and external-note friendly. Do not repeat the same diagram as both a global diagram and a worked-example image; use `diagramRef`.
20. For `given`, `formula`, `solutionSteps`, `reasoning`, and `finalAnswer`, use structured math objects whenever an expression appears.
21. Prefer this shape for mixed math lines: `{ "text": "Multiply numerator and denominator by", "latex": "\\frac{\\sqrt{3}}{\\sqrt{3}}" }`.
22. Use `displayLatex` for standalone expressions such as `\\frac{5}{\\sqrt{3}}`, multi-step substitutions, or final simplified equations that should appear on their own line.
23. Do not put a full narrated sentence and the full expression into one plain string when a structured math object can be used.
24. For variable setup lines, use natural wording like `Let a = 6 cm` or `Take b = 8 cm`. Never write malformed labels like `Leg a = 6 cm`.

Return exactly this top-level shape:
{
  "studentLessonNotes": {
    "title": "Student lesson note title",
    "sessionOverview": "Friendly one-session overview",
    "introduction": "Friendly student-facing introduction",
    "learningObjectives": ["After this lesson you will be able to..."],
    "quickRecall": ["Short prerequisite revision point"],
    "easyToRemember": ["Simple memory line for the concept"],
    "comparisonTables": [
      {
        "title": "Comparison title",
        "headers": ["Feature", "Type A", "Type B"],
        "rows": [["Example feature", "Example A", "Example B"]]
      }
    ],
    "formulaCards": [
      {
        "title": "Formula title",
        "formula": {
          "text": "Readable formula",
          "latex": "a^2 + b^2 = c^2"
        },
        "meaning": "What each part means",
        "whenToUse": "When this formula applies"
      }
    ],
    "geometryDiagrams": [
      {
        "id": "diagram-1",
        "type": "rightTriangle",
        "template": "rightTriangle",
        "params": {
          "baseLength": "3 units",
          "height": "4 units",
          "hypotenuse": "5 units"
        },
        "title": "Right triangle diagram",
        "caption": "A clean labelled geometry diagram",
        "points": [
          { "id": "A", "x": 65, "y": 155, "label": "A" },
          { "id": "B", "x": 245, "y": 155, "label": "B" },
          { "id": "C", "x": 65, "y": 55, "label": "C" }
        ],
        "lines": [
          { "from": "A", "to": "B", "label": "base" },
          { "from": "A", "to": "C", "label": "height" },
          { "from": "B", "to": "C", "label": "hypotenuse", "highlight": true }
        ],
        "arcs": [],
        "labels": [{ "text": "90 deg", "x": 82, "y": 142 }],
        "measurements": []
      }
    ],
    "proofSteps": ["Reasoning step 1", "Reasoning step 2"],
    "commonMistakes": [
      {
        "mistake": "Common incorrect step",
        "correction": "Correct method",
        "example": "Short example"
      }
    ],
    "sections": [
      {
        "heading": "Concept name",
        "explanation": "Simple explanation",
        "keyPoints": ["Important point"],
        "examples": ["Real-life or classroom example"],
        "whyItMatters": "Why students should care about this concept",
        "terminology": ["Important term"],
        "detailedExplanation": "A deeper but student-friendly explanation",
        "observedIn": ["Where students observe it"],
        "visualSupport": ["Diagram or visual suggestion"],
        "visualAssets": [],
        "importantNotes": ["Exam point or caution note"],
        "memoryTechniques": ["Mnemonic or memory tip"],
        "conceptSummary": ["One-line takeaway"]
      }
    ],
    "definitions": [
      {
        "term": "Key term",
        "definition": "Clear student-friendly definition"
      }
    ],
    "workedExamples": [
      {
        "title": "Worked example title",
        "problem": "Problem statement",
        "diagramRef": "diagram-1",
        "given": [{ "text": "Let a = 3 and b = 4", "latex": "a = 3, b = 4" }],
        "formula": [{ "text": "Relevant formula", "latex": "a^2 + b^2 = c^2" }],
        "steps": ["Step 1", "Step 2"],
        "solutionSteps": [
          { "text": "Write the formula", "displayLatex": "a^2 + b^2 = c^2" },
          { "text": "Substitute the known values", "displayLatex": "3^2 + 4^2 = c^2" },
          { "text": "Simplify carefully", "displayLatex": "9 + 16 = c^2" }
        ],
        "reasoning": [{ "text": "Why this method applies", "latex": "c^2 = a^2 + b^2" }],
        "explanation": "How this example works",
        "finalAnswer": { "text": "Final answer", "displayLatex": "c = 5" },
        "latex": "x = y + z",
        "displayLatex": "\\\\frac{a+b}{c}"
      }
    ],
    "revisionSection": {
      "definitions": ["Important definition"],
      "formulas": ["Useful formula if applicable"],
      "facts": ["Important fact"],
      "keywords": ["Keyword"],
      "conceptMap": ["Concept map cue"],
      "quickRecap": ["Fast revision point"]
    },
    "selfCheckQuestions": ["Question students can answer independently"],
    "quickSummary": ["Short summary point"],
    "keyTerms": ["Important keyword"],
    "fillInTheBlanks": [
      {
        "prompt": "An equation blank",
        "answer": "Answer"
      }
    ],
    "mcqQuestions": [
      {
        "question": "A mathematics MCQ",
        "options": ["A. option", "B. option", "C. option", "D. option"],
        "answer": "Correct option"
      }
    ],
    "veryShortAnswerQuestions": [
      {
        "question": "A short mathematics question",
        "answer": "Short answer"
      }
    ],
    "didYouKnow": ["Interesting supporting fact"],
    "summary": ["Key learning point"],
    "quickRevision": ["Very short revision cue"],
    "rememberPoints": ["Memory point"]
  }
}

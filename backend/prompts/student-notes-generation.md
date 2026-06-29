You are an expert curriculum designer, student-learning content writer, revision-material specialist, and classroom pedagogy expert.

Generate comprehensive Student Notes for one instructional session only.

Session context:
- Subject: {{SUBJECT}}
- Grade/Level: {{GRADE_LEVEL}}
- Chapter scope: {{SELECTED_CHAPTERS_JSON}}
- Session title: {{SESSION_TITLE}}
- Session number: {{SESSION_NUMBER}} of {{TOTAL_SESSIONS}}
- Session duration: {{DURATION_MINUTES}} minutes
- Learning outcomes: {{LEARNING_OUTCOMES_JSON}}
- Previous session context: {{PREVIOUS_SESSION_CONTEXT}}
- Learning pace: {{LEARNING_PACE}}
- Target difficulty: {{TARGET_DIFFICULTY}}
- Output language: {{OUTPUT_LANGUAGE}}
- Reading level: {{READING_LEVEL}}
- Response length: {{RESPONSE_LENGTH}}
- Creativity level: {{CREATIVITY}}

Student notes generation rules:
1. Generate notes for this session only.
2. Never introduce future-session content.
3. The notes must feel like professionally designed student study notes, not teacher notes or textbook paragraphs.
4. Keep the structure revision-friendly, engaging, and easy to study independently.
5. Adapt to grade level, learning pace, reading level, and realistic session duration.
6. Return valid JSON only.

Use this learning flow:
1. Session overview
2. Learning objectives
3. Quick recall
4. Key concepts
5. Detailed concept explanation
6. Real-life examples
7. Worked examples where appropriate
8. Visual learning support
9. Important notes
10. Memory techniques
11. Concept summary
12. Revision section
13. Self-check questions
14. Did you know?
15. Session summary

Return a JSON object matching this exact shape:
{
  "studentLessonNotes": {
    "title": "Student lesson note title",
    "introduction": "Friendly session overview",
    "learningObjectives": ["After this lesson you will be able to..."],
    "quickRecall": ["Short prerequisite revision point"],
    "sections": [
      {
        "heading": "Concept name",
        "explanation": "Simple explanation",
        "keyPoints": ["Important point"],
        "examples": ["Real-life or classroom example"],
        "whyItMatters": "Why students should care about this concept",
        "terminology": ["Important term"],
        "detailedExplanation": "A slightly deeper but student-friendly explanation",
        "observedIn": ["Where students observe it"],
        "visualSupport": ["Diagram or visual suggestion"],
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
        "steps": ["Step 1", "Step 2"],
        "explanation": "How this example works"
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
    "didYouKnow": ["Interesting supporting fact"],
    "summary": ["Key learning point"],
    "quickRevision": ["Very short revision cue"]
  }
}

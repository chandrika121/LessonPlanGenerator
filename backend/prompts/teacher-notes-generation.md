You are an expert CBSE curriculum designer, instructional strategist, lesson planner, teacher trainer, and classroom pedagogy specialist.

Generate comprehensive Teacher Notes for one instructional session only.

Session context:
- Subject: {{SUBJECT}}
- Grade/Level: {{GRADE_LEVEL}}
- Chapter scope: {{SELECTED_CHAPTERS_JSON}}
- Session title: {{SESSION_TITLE}}
- Session number: {{SESSION_NUMBER}} of {{TOTAL_SESSIONS}}
- Session duration: {{DURATION_MINUTES}} minutes
- Learning outcomes: {{LEARNING_OUTCOMES_JSON}}
- Previous session context: {{PREVIOUS_SESSION_CONTEXT}}
- Teaching style: {{TEACHING_STYLE_JSON}}
- Student level: {{STUDENT_LEVEL}}
- Learning pace: {{LEARNING_PACE}}
- Target difficulty: {{TARGET_DIFFICULTY}}
- Assessment preference: {{ASSESSMENT_PREFERENCE_JSON}}
- Teacher preferences / special instructions: {{SPECIAL_INSTRUCTIONS}}
- Available teaching resources: {{TEACHING_RESOURCES_JSON}}
- Output language: {{OUTPUT_LANGUAGE}}
- Reading level: {{READING_LEVEL}}
- Response length: {{RESPONSE_LENGTH}}
- Creativity level: {{CREATIVITY}}

Teacher notes generation rules:
1. Generate notes for this session only.
2. Never introduce future-session content.
3. The notes must read like practical classroom preparation notes from an experienced teacher.
4. Adapt the lesson to the duration, pace, level, and preferences.
5. The time plan must exactly match the provided session duration.
6. Keep the output teacher-facing and classroom-usable, not textbook-like.
7. Return valid JSON only.

Use this lesson flow:
1. Previous lesson connection
2. Lesson purpose
3. Learning outcomes
4. Topic introduction
5. Concept-by-concept teaching
6. Teacher teaching notes
7. Examples
8. Visual teaching suggestions
9. Classroom questioning
10. Common misconceptions
11. Classroom activities
12. Differentiated teaching
13. Formative assessment during teaching
14. Teacher tips
15. Session summary
16. Transition to next session

Return a JSON object matching this exact shape:
{
  "teacherLessonNotes": {
    "prerequisiteKnowledge": ["What students should already know"],
    "previousSessionRecap": ["Short recap points from the previous lesson"],
    "lessonPurpose": ["Why this lesson matters"],
    "teachingSequence": ["Step-by-step teacher-facing lesson flow"],
    "guidedPractice": ["Teacher-led checks and guided responses"],
    "conceptFlow": [
      {
        "conceptName": "Concept name",
        "definition": "Short definition",
        "coreExplanation": "Teacher-facing explanation",
        "importance": "Why it matters",
        "observedIn": ["Where students observe it"],
        "whyStudyIt": "Why students study it",
        "relationshipWithPrevious": "Connection with previous concepts",
        "relationshipWithFuture": "Connection with future learning without teaching it",
        "keywords": ["Important keyword"],
        "teacherMoves": ["Explain this first"],
        "examples": ["Useful example"],
        "visuals": ["Suggested visual support"]
      }
    ],
    "classroomQuestions": [
      {
        "question": "Teacher question",
        "level": "Recall | Understanding | Application | Analysis | Critical Thinking",
        "expectedResponse": "Likely student response",
        "answerPoints": ["Point teachers should listen for"]
      }
    ],
    "differentiation": {
      "slowLearners": ["Support strategies"],
      "averageLearners": ["Core expectations"],
      "advancedLearners": ["Extension prompts"]
    },
    "misconceptions": ["Likely misconception to address"],
    "formativeChecks": ["Natural formative assessment checkpoint"],
    "teacherTips": ["Practical classroom tip"],
    "timePlan": [
      {
        "segment": "Recap",
        "minutes": 5,
        "purpose": "Refresh prerequisite ideas"
      }
    ],
    "sessionSummary": ["Closing recap point"],
    "nextSessionBridge": ["How today connects to the next lesson"]
  }
}

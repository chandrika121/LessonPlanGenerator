import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const {
    buildAdaptiveStage1Chunks,
    backfillStage1MarksFromSource,
    buildScienceGenerationMetadata,
    buildCombinedCurriculumSourceText,
    buildDeterministicStage3FallbackFromApprovedClass,
    buildTamilStructureDigest,
    computeCurriculumStatistics,
    buildUnitChapterFallbackStage1Facts,
    buildTamilFastStage1Facts,
    buildEmptyStage1FactExtraction,
    buildStage1TransportRecoveryChunks,
    buildVersionedCurriculumPayload,
    cleanupCbseStructure,
    detectCurriculumSubjectFromInput,
    detectEnglishModeFromCurriculumInput,
    detectIndicCurriculumModeFromInput,
    detectCurriculumProfile,
    filterSourceTextToSelectedClasses,
    getCurriculumExtractionOllamaOverrides,
    getCurriculumProfileConfig,
    getAdaptiveStage1ChunkCount,
    hardenTamilStage1Facts,
    enrichTamilStage1FactsWithStructure,
    getNotesPromptName,
    isEnglishSubject,
    isIndicCurriculumSubject,
    isLanguageSubject,
    isRetryableOllamaError,
    isTamilCurriculumSubject,
    resolveGenerationOutputLanguage,
    mergeStage1FactExtractions,
    normalizeSupportingCurriculumDocuments,
    expandStage1FactsToRawExtraction,
    parseTamilAssessmentSectionsFromSource,
    parseTamilTextbookIndexUnits,
    buildFaithfulStructureFromRawExtraction,
    renderPromptWithEnglishIntelligence,
    renderPromptWithEnglishDownstreamIntelligence,
    renderStage1PromptWithCurriculumIntelligence,
    isScienceSubject,
    shouldUseScienceIntelligence,
    STAGE1_PROMPT_SAFE_BUDGET,
    splitChunkToPromptBudget,
    shouldUseChunkedStage1Fallback,
    requiresTamilTextbookIndexFromInput,
    shouldUseEnglishIntelligence,
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

  const cbseMath = detectCurriculumProfile(
    "CBSE Mathematics Class IX identify the degree and terms of terms in a polynomial use equations and graphs UNIT II ALGEBRA UNIT IV GEOMETRY UNIT VI STATISTICS AND PROBABILITY",
    "Maths_SecP1IX_2026-27.pdf"
  );
  assert.ok(
    ["cbse_unit_topic", "cbse_unit_chapter_topic"].includes(cbseMath.profile),
    `CBSE math syllabus should stay in a CBSE unit-based profile, got ${cbseMath.profile}`
  );

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

  assert.equal(isEnglishSubject("English"), true);
  assert.equal(isEnglishSubject("English Language"), true);
  assert.equal(isEnglishSubject("Communicative English"), true);
  assert.equal(isEnglishSubject("Hindi Language"), false);
  assert.equal(isEnglishSubject("Sanskrit"), false);
  assert.equal(isIndicCurriculumSubject("Hindi"), true);
  assert.equal(isIndicCurriculumSubject("Tamil Language"), true);
  assert.equal(isIndicCurriculumSubject("Mathematics"), false);
  assert.equal(isLanguageSubject("Tamil"), true);
  assert.equal(isLanguageSubject("Hindi"), true);
  assert.equal(isLanguageSubject("Mathematics"), false);
  assert.equal(isTamilCurriculumSubject("Tamil"), true);
  assert.equal(isTamilCurriculumSubject("Mathematics"), false);
  assert.equal(resolveGenerationOutputLanguage("Hindi", "English"), "Hindi");
  assert.equal(resolveGenerationOutputLanguage("Hindi Language", ""), "Hindi");
  assert.equal(resolveGenerationOutputLanguage("Tamil", "English"), "Tamil");
  assert.equal(resolveGenerationOutputLanguage("Mathematics", "English"), "English");
  assert.equal(isScienceSubject("Science"), true);
  assert.equal(isScienceSubject("Physics"), true);
  assert.equal(isScienceSubject("Chemistry"), true);
  assert.equal(isScienceSubject("Biology"), true);
  assert.equal(isScienceSubject("Social Science"), false);
  assert.equal(isScienceSubject("Computer Science"), false);
  assert.equal(isScienceSubject("Mathematics"), false);
  assert.equal(isRetryableOllamaError({ code: "OLLAMA_EMPTY_RESPONSE", message: "Ollama returned an empty chat response body." }), true);
  assert.equal(
    isRetryableOllamaError({
      code: "HTTP_500",
      message: "Ollama request failed with status 500: {\"error\":\"unexpected EOF\"}",
    }),
    true
  );
  assert.equal(
    shouldUseChunkedStage1Fallback(
      {
        code: "OLLAMA_EMPTY_RESPONSE",
        message: "Ollama returned an empty chat response body.",
        promptLength: 19526,
      },
      "short tamil source"
    ),
    true
  );

  assert.equal(
    detectEnglishModeFromCurriculumInput(
      "Subject: English\nReading comprehension\nWriting skills\nGrammar practice",
      "Class_IX_English.pdf"
    ),
    true
  );
  assert.equal(
    detectEnglishModeFromCurriculumInput(
      "Reading Writing Grammar Literature Poetry Listening Speaking",
      "general_language_curriculum.pdf"
    ),
    false
  );
  assert.equal(
    detectIndicCurriculumModeFromInput(
      "Subject: Hindi\nगद्य खंड\nव्याकरण",
      "Class_IX_Hindi.pdf"
    ),
    true
  );
  assert.equal(
    detectIndicCurriculumModeFromInput(
      "தமிழ் பாடத்திட்டம்\nஇலக்கியம்\nஇலக்கணம்",
      "Class_X_Tamil.pdf"
    ),
    true
  );
  assert.equal(
    detectIndicCurriculumModeFromInput(
      "Subject: English\nReading comprehension\nWriting skills",
      "Class_IX_English.pdf"
    ),
    false
  );
  assert.equal(
    detectCurriculumSubjectFromInput(
      "Subject: Tamil\nஇயல் 1\nஇலக்கியம்",
      "Class_X_Tamil.pdf"
    ),
    "Tamil"
  );
  assert.equal(
    detectCurriculumSubjectFromInput(
      "Number Systems\nAlgebra",
      "Class_IX_Math.pdf"
    ),
    "Mathematics"
  );
  assert.equal(
    detectCurriculumSubjectFromInput(
      "# SCIENCE\nScience draws knowledge from Biology, Chemistry, Physics, Earth Science, Mathematics, Computational Sciences.",
      "Science_SecP1_2026-27.pdf"
    ),
    "Science"
  );
  assert.equal(
    requiresTamilTextbookIndexFromInput(
      "தமிழ் பாடத்திட்டம்\nஇயல் 1",
      "Class_X_Tamil.pdf"
    ),
    true
  );
  assert.equal(
    requiresTamilTextbookIndexFromInput(
      "Reading comprehension\nWriting skills",
      "Class_IX_English.pdf"
    ),
    false
  );

  assert.equal(
    shouldUseEnglishIntelligence({
      subject: "English Language",
      sourceText: "Reading Writing Grammar",
      fileName: "english_language_curriculum.pdf",
    }),
    true
  );
  assert.equal(
    shouldUseEnglishIntelligence({
      subject: "Hindi",
      sourceText: "Reading Writing Grammar",
      fileName: "general_language_curriculum.pdf",
    }),
    false
  );
  assert.ok(
    Boolean(getCurriculumExtractionOllamaOverrides({
      subject: "Hindi",
      sourceText: "गद्य खंड\nव्याकरण",
      fileName: "Class_IX_Hindi.pdf",
    }).model),
    "Indic curriculum extraction should activate a dedicated model override"
  );
  assert.equal(
    Boolean(getCurriculumExtractionOllamaOverrides({
      subject: "Mathematics",
      sourceText: "Number Systems\nAlgebra",
      fileName: "Class_IX_Math.pdf",
    }).model),
    false
  );
  assert.equal(
    shouldUseScienceIntelligence({
      subject: "Physics",
      sourceText: "",
      fileName: "",
    }),
    true
  );
  assert.equal(
    shouldUseScienceIntelligence({
      subject: "",
      sourceText: "Subject: Science\nPracticals\nLaboratory work\nChemical reactions",
      fileName: "Class_X_Science.pdf",
    }),
    true
  );
  assert.equal(
    shouldUseScienceIntelligence({
      subject: "",
      sourceText: "Number Systems\nAlgebra\nGraphs",
      fileName: "Class_IX_Math.pdf",
    }),
    false
  );

  const scienceFallback = buildUnitChapterFallbackStage1Facts(
    [
      "# SCIENCE",
      "Class X (2026-27)",
      "Theme: Materials",
      "## Unit I: Chemical Substances - Nature and Behaviour",
      "Chemical Reactions and Equations: Chemical reactions, Chemical equation.",
      "Acids, Bases and Salts: Acids and Bases.",
      "Theme: The World of the Living",
      "## Unit II: World of Living",
      "Life processes: Living Being.",
      "Control and co-ordination in animals and plants: Tropic movements in plants.",
      "## PRACTICALS",
    ].join("\n"),
    {},
    {
      fileName: "Science_SecP1_2026-27.pdf",
      detectedProfile: "cbse_unit_chapter_topic",
    }
  );
  assert.equal(scienceFallback.fallbackApplied, true);
  assert.equal(scienceFallback.document_metadata.subject, "Science");
  assert.equal(scienceFallback.units.length, 2);
  assert.equal(scienceFallback.chapters.length, 4);
  assert.equal(scienceFallback.units[0].unit_name, "Unit I: Chemical Substances - Nature and Behaviour");
  assert.equal(scienceFallback.chapters[0].chapter_name, "Chemical Reactions and Equations");

  const scienceMarksBackfill = backfillStage1MarksFromSource({
    document_metadata: {
      subject: "Science",
      class: "Class X",
    },
    units: [
      { unit_id: "U13", unit_name: "Unit IV: Effects of Current", marks: null, topics: [], subtopics: [], key_concepts: [] },
      { unit_id: "U14", unit_name: "Unit V: Natural Resources", marks: null, topics: [], subtopics: [], key_concepts: [] },
      { unit_id: "U20", unit_name: "Unit - IV", marks: null, topics: ["Determination of the equivalent resistance of two resistors when connected in series and parallel"], subtopics: [], key_concepts: [] },
    ],
    chapters: [],
  }, [
    "## Unit No. Unit Marks",
    "I Chemical Substances-Nature and Behaviour 25",
    "II World of Living 25",
    "III Natural Phenomena 12",
    "IV Effects of Current 13",
    "V Natural Resources 05",
  ].join("\n"));
  assert.equal(scienceMarksBackfill.units[0].marks, 13);
  assert.equal(scienceMarksBackfill.units[1].marks, 5);
  assert.equal(scienceMarksBackfill.units[2].marks, null);

  const curriculumStatistics = computeCurriculumStatistics({
    practicals: [{ title: "Practical 1" }],
    activities: [{ title: "Activity 1" }],
    projects: [{ title: "Project 1" }],
    classes: [{
      class_name: "Class X",
      units: [{
        unit_id: "U1",
        unit_name: "Chemical Substances",
        topics: ["Chemical Reactions", "Acids, Bases and Salts"],
        subtopics: ["Balanced chemical equations"],
        chapters: [{
          chapter_id: "C1",
          chapter_name: "Chemical Reactions and Equations",
          topics: ["Types of reactions"],
          subtopics: ["Combination reaction", "Decomposition reaction"],
        }],
      }],
    }],
  }, [{
    class_name: "Class X",
    unit_name: "Chemical Substances",
    chapter_name: "Chemical Reactions and Equations",
    outcomes: ["Explain balancing", "Classify reaction types"],
  }]);
  assert.equal(curriculumStatistics.total_units, 1);
  assert.equal(curriculumStatistics.total_chapters, 1);
  assert.equal(curriculumStatistics.total_topics, 3);
  assert.equal(curriculumStatistics.total_subtopics, 3);
  assert.equal(curriculumStatistics.total_learning_outcomes, 2);
  assert.equal(curriculumStatistics.total_practicals, 1);
  assert.equal(curriculumStatistics.total_activities, 1);
  assert.equal(curriculumStatistics.total_projects, 1);

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

  assert.equal(getNotesPromptName("teacher", "Mathematics"), "teacher-notes-generation-math.md");
  assert.equal(getNotesPromptName("student", "Mathematics"), "student-notes-generation-math.md");
  assert.equal(getNotesPromptName("teacher", "English"), "teacher-notes-generation.md");

  const englishWrappedPrompt = renderPromptWithEnglishIntelligence("session-generation.md", {
    SESSION_NUMBER: "1",
    TOTAL_SESSIONS: "10",
    DURATION_MINUTES: "40",
    SUBJECT: "English",
    GRADE_LEVEL: "Class IX",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Poetry", "Grammar"]),
    INCLUDE_LEARNING_OUTCOMES: "YES",
    INCLUDE_INTRODUCTION: "YES",
    INCLUDE_THEORY: "YES",
    INCLUDE_ASSESSMENTS: "YES",
    INCLUDE_ASSIGNMENTS: "YES",
    INCLUDE_NOTES: "YES",
    SELECTED_SECTIONS_JSON: JSON.stringify(["teacherLessonNotes", "studentLessonNotes"]),
    ASSESSMENT_ENGINE_INSTRUCTIONS: "Use the assessment section only for taught content.",
  }, {
    englishMode: true,
    stageLabel: "Session detail generation",
  });
  assert.match(englishWrappedPrompt, /English Subject Intelligence Layer \(Active\)/);
  assert.match(englishWrappedPrompt, /English Curriculum and Pedagogical Intelligence Engine/);
  assert.match(englishWrappedPrompt, /English terms must never be divided only by textbook chapters\./);
  assert.doesNotMatch(englishWrappedPrompt, /Never allocate these components entirely to a single term\./);

  const englishDownstreamPrompt = renderPromptWithEnglishDownstreamIntelligence("session-generation.md", {
    SESSION_NUMBER: "1",
    TOTAL_SESSIONS: "10",
    DURATION_MINUTES: "40",
    SUBJECT: "English",
    GRADE_LEVEL: "Class IX",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Poetry", "Grammar"]),
    INCLUDE_LEARNING_OUTCOMES: "YES",
    INCLUDE_INTRODUCTION: "YES",
    INCLUDE_THEORY: "YES",
    INCLUDE_ASSESSMENTS: "YES",
    INCLUDE_ASSIGNMENTS: "YES",
    INCLUDE_NOTES: "YES",
    SELECTED_SECTIONS_JSON: JSON.stringify(["teacherLessonNotes", "studentLessonNotes"]),
    ASSESSMENT_ENGINE_INSTRUCTIONS: "Use the assessment section only for taught content.",
  }, {
    englishMode: true,
    stageLabel: "Session detail generation",
  });
  assert.match(englishDownstreamPrompt, /English Subject Intelligence Layer \(Active\)/);
  assert.match(englishDownstreamPrompt, /English terms must never be divided solely by textbook chapters or units\./);
  assert.match(englishDownstreamPrompt, /Never allocate these components entirely to a single term\./);
  assert.match(englishDownstreamPrompt, /English sessions should be planned as an integrated language-learning progression/);

  const scienceDownstreamPrompt = renderPromptWithEnglishDownstreamIntelligence("assessment-generation.md", {
    SUBJECT: "Physics",
    GRADE_LEVEL: "Class XI",
    SESSION_TITLE: "Motion in a Straight Line",
    SESSION_NUMBER: "1",
    TOTAL_SESSIONS: "20",
    DURATION_MINUTES: "45",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Motion in a Straight Line"]),
    LEARNING_OUTCOMES_JSON: JSON.stringify(["Explain displacement and velocity"]),
    PREVIOUS_SESSION_CONTEXT: "No previous session context provided.",
    LEARNING_PACE: "Balanced",
    TARGET_DIFFICULTY: "Moderate",
    OUTPUT_LANGUAGE: "English",
    ASSESSMENT_TYPE: "Class test",
    REQUESTED_TOTAL_MARKS: "20",
    REQUESTED_TOTAL_QUESTIONS: "10",
    REQUESTED_DURATION_MINUTES: "20",
    ASSESSMENT_PREFERENCE_JSON: JSON.stringify([]),
    BLOOMS_DISTRIBUTION_JSON: JSON.stringify([]),
    REQUESTED_QUESTION_TYPES_JSON: JSON.stringify([]),
    ASSESSMENT_SECTION_CONTEXT_JSON: JSON.stringify([]),
    QUESTION_PAPER_OBJECTIVE: "Check conceptual understanding.",
    TEACHER_ASSESSMENT_REQUEST_JSON: JSON.stringify({}),
    SESSION_JSON: JSON.stringify({ subject: "Physics", sessionTitle: "Motion in a Straight Line" }),
    ASSESSMENT_SCHEMA_JSON: JSON.stringify({ assessment: {} }),
  }, {
    stageLabel: "Assessment generation",
  });
  assert.match(scienceDownstreamPrompt, /Science Subject Intelligence Layer \(Active\)/);
  assert.match(scienceDownstreamPrompt, /Science Curriculum and Pedagogical Intelligence Engine/);
  assert.match(scienceDownstreamPrompt, /Physics/);
  assert.match(scienceDownstreamPrompt, /Science Generation Policy Layer \(Active\)/);
  assert.match(scienceDownstreamPrompt, /balanced science blueprint by default/i);

  const scienceTeacherPrompt = renderPromptWithEnglishDownstreamIntelligence("teacher-notes-generation.md", {
    SUBJECT: "Chemistry",
    GRADE_LEVEL: "Class X",
    SESSION_TITLE: "Chemical Reactions and Equations",
    SESSION_NUMBER: "1",
    TOTAL_SESSIONS: "20",
    DURATION_MINUTES: "45",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Chemical Reactions and Equations"]),
    LEARNING_OUTCOMES_JSON: JSON.stringify(["Explain evidence of chemical change"]),
    PREVIOUS_SESSION_CONTEXT: "No previous session context provided.",
    TEACHING_STYLE_JSON: JSON.stringify(["Guided discussion"]),
    STUDENT_LEVEL: "Grade-level mixed",
    LEARNING_PACE: "Balanced",
    TARGET_DIFFICULTY: "Moderate",
    ASSESSMENT_PREFERENCE_JSON: JSON.stringify([]),
    SPECIAL_INSTRUCTIONS: "",
    TEACHING_RESOURCES_JSON: JSON.stringify(["Low-cost classroom activity"]),
    OUTPUT_LANGUAGE: "English",
    READING_LEVEL: "Grade-aligned",
    RESPONSE_LENGTH: "Balanced",
    CREATIVITY: "Moderate",
    SESSION_JSON: JSON.stringify({ subject: "Chemistry", sessionTitle: "Chemical Reactions and Equations", selectedChapters: ["Chemical Reactions and Equations"] }),
  }, {
    stageLabel: "Teacher notes generation",
  });
  assert.match(scienceTeacherPrompt, /SCIENCE TEACHER NOTES RULES/);
  assert.match(scienceTeacherPrompt, /formula literacy/i);
  assert.match(scienceTeacherPrompt, /expected observations/i);

  const scienceStudentPrompt = renderPromptWithEnglishDownstreamIntelligence("student-notes-generation.md", {
    SUBJECT: "Biology",
    GRADE_LEVEL: "Class X",
    SESSION_TITLE: "Life Processes",
    SESSION_NUMBER: "3",
    TOTAL_SESSIONS: "20",
    DURATION_MINUTES: "45",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Life Processes"]),
    LEARNING_OUTCOMES_JSON: JSON.stringify(["Describe respiration and transport"]),
    PREVIOUS_SESSION_CONTEXT: "No previous session context provided.",
    LEARNING_PACE: "Balanced",
    TARGET_DIFFICULTY: "Moderate",
    OUTPUT_LANGUAGE: "English",
    READING_LEVEL: "Grade-aligned",
    RESPONSE_LENGTH: "Balanced",
    CREATIVITY: "Moderate",
    SESSION_JSON: JSON.stringify({ subject: "Biology", sessionTitle: "Life Processes" }),
  }, {
    stageLabel: "Student notes generation",
  });
  assert.match(scienceStudentPrompt, /SCIENCE STUDENT NOTES RULES/);
  assert.match(scienceStudentPrompt, /labeled diagram/i);
  assert.match(scienceStudentPrompt, /process sequence/i);

  const sciencePptPrompt = renderPromptWithEnglishDownstreamIntelligence("session-ppt-prompt.md", {
    SUBJECT: "Science",
    GRADE_LEVEL: "Class VII",
    SESSION_TITLE: "Acids and Bases",
    SESSION_NUMBER: "2",
    TOTAL_SESSIONS: "15",
    DURATION_MINUTES: "40",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Acids and Bases"]),
    LEARNING_OUTCOMES_JSON: JSON.stringify(["Differentiate acids and bases"]),
    PREVIOUS_SESSION_CONTEXT: "No previous session context provided.",
    LEARNING_PACE: "Balanced",
    TARGET_DIFFICULTY: "Moderate",
    TEACHING_STYLE_JSON: JSON.stringify(["Interactive facilitation"]),
    TEACHING_RESOURCES_JSON: JSON.stringify(["Projector / PPT"]),
    OUTPUT_LANGUAGE: "English",
    READING_LEVEL: "Grade-aligned",
    RESPONSE_LENGTH: "Balanced",
    CREATIVITY: "Moderate",
    SESSION_JSON: JSON.stringify({ subject: "Science", sessionTitle: "Acids and Bases" }),
    SLIDE_CONFIG_JSON: JSON.stringify({}),
  }, {
    stageLabel: "PPT and materials generation",
  });
  assert.match(sciencePptPrompt, /SCIENCE PPT AND MATERIALS RULES/);
  assert.match(sciencePptPrompt, /visual academic science deck/i);
  assert.match(sciencePptPrompt, /concept diagram/i);

  const scienceHomeworkPrompt = renderPromptWithEnglishDownstreamIntelligence("homework-generation.md", {
    SUBJECT: "Physics",
    GRADE_LEVEL: "Class XI",
    SESSION_TITLE: "Motion in a Straight Line",
    SESSION_NUMBER: "5",
    TOTAL_SESSIONS: "30",
    EXPECTED_HOMEWORK_DURATION: "30",
    LEARNING_OUTCOMES_JSON: JSON.stringify(["Solve displacement and velocity problems"]),
    PREVIOUS_SESSION_CONTEXT: "No previous session context provided.",
    LEARNING_PACE: "Balanced",
    TARGET_DIFFICULTY: "Moderate",
    HOMEWORK_PREFERENCES_JSON: JSON.stringify({}),
    OUTPUT_LANGUAGE: "English",
    READING_LEVEL: "Grade-aligned",
    SESSION_JSON: JSON.stringify({ subject: "Physics", sessionTitle: "Motion in a Straight Line" }),
  }, {
    stageLabel: "Homework generation",
  });
  assert.match(scienceHomeworkPrompt, /SCIENCE HOMEWORK RULES/);
  assert.match(scienceHomeworkPrompt, /numerical\/problem solving for Physics/i);

  const scienceSessionMetadata = buildScienceGenerationMetadata("assessment-generation.md", {
    SUBJECT: "Physics",
    GRADE_LEVEL: "Class XI",
    SESSION_TITLE: "Motion in a Straight Line",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Motion in a Straight Line"]),
    LEARNING_OUTCOMES_JSON: JSON.stringify(["Solve numerical problems using velocity"]),
    SESSION_JSON: JSON.stringify({ subject: "Physics", sessionTitle: "Motion in a Straight Line" }),
    ASSESSMENT_TYPE: "Session assessment",
    QUESTION_PAPER_OBJECTIVE: "Check conceptual understanding and application.",
  });
  assert.equal(scienceSessionMetadata?.scienceMode, "Physics");
  assert.equal(scienceSessionMetadata?.scienceArtifact, "assessment");
  assert.ok((scienceSessionMetadata?.scienceContentModes || []).includes("numerical"));

  const scienceStage1Prompt = renderStage1PromptWithCurriculumIntelligence("curriculum-extraction.md", {
    STAGE_NAME: "Stage 1 - Raw Curriculum Extraction",
    EXTRACTION_RULES: "return JSON only",
    CHUNK_RULE: "",
    SOURCE_TEXT: "Subject: Chemistry\nUnits\nChemical Reactions\nPracticals",
  }, {
    stageLabel: "Stage 1 - Raw Curriculum Extraction",
  });
  assert.match(scienceStage1Prompt, /Science Subject Intelligence Layer \(Active\)/);
  assert.match(scienceStage1Prompt, /Never force a fixed curriculum structure\./);

  const tamilWrappedPrompt = renderStage1PromptWithCurriculumIntelligence("curriculum-extraction.md", {
    STAGE_NAME: "Stage 1 - Raw Curriculum Extraction",
    EXTRACTION_RULES: "return JSON only",
    CHUNK_RULE: "",
    SOURCE_TEXT: "தமிழ் பாடத்திட்டம்",
  }, {
    tamilMode: true,
    stageLabel: "Stage 1 - Raw Curriculum Extraction",
  });
  assert.match(tamilWrappedPrompt, /Tamil Curriculum Multi-Source Intelligence Layer \(Active\)/);
  assert.match(tamilWrappedPrompt, /UNIVERSAL MULTI-SOURCE CURRICULUM UNDERSTANDING & EXTRACTION ENGINE/);

  const genericPrompt = renderPromptWithEnglishIntelligence("session-generation.md", {
    SESSION_NUMBER: "1",
    TOTAL_SESSIONS: "8",
    DURATION_MINUTES: "45",
    SUBJECT: "Mathematics",
    GRADE_LEVEL: "Class IX",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Linear Equations"]),
    INCLUDE_LEARNING_OUTCOMES: "YES",
    INCLUDE_INTRODUCTION: "YES",
    INCLUDE_THEORY: "YES",
    INCLUDE_ASSESSMENTS: "YES",
    INCLUDE_ASSIGNMENTS: "YES",
    INCLUDE_NOTES: "YES",
    SELECTED_SECTIONS_JSON: JSON.stringify(["teacherLessonNotes"]),
    ASSESSMENT_ENGINE_INSTRUCTIONS: "Use the assessment section only for taught content.",
  }, {
    englishMode: false,
    stageLabel: "Session detail generation",
  });
  assert.doesNotMatch(genericPrompt, /English Subject Intelligence Layer \(Active\)/);

  const genericDownstreamPrompt = renderPromptWithEnglishDownstreamIntelligence("session-generation.md", {
    SESSION_NUMBER: "1",
    TOTAL_SESSIONS: "8",
    DURATION_MINUTES: "45",
    SUBJECT: "Mathematics",
    GRADE_LEVEL: "Class IX",
    SELECTED_CHAPTERS_JSON: JSON.stringify(["Linear Equations"]),
    INCLUDE_LEARNING_OUTCOMES: "YES",
    INCLUDE_INTRODUCTION: "YES",
    INCLUDE_THEORY: "YES",
    INCLUDE_ASSESSMENTS: "YES",
    INCLUDE_ASSIGNMENTS: "YES",
    INCLUDE_NOTES: "YES",
    SELECTED_SECTIONS_JSON: JSON.stringify(["teacherLessonNotes"]),
    ASSESSMENT_ENGINE_INSTRUCTIONS: "Use the assessment section only for taught content.",
  }, {
    englishMode: false,
    stageLabel: "Session detail generation",
  });
  assert.doesNotMatch(genericDownstreamPrompt, /English Subject Intelligence Layer \(Active\)/);

  const nonTamilStage1Prompt = renderStage1PromptWithCurriculumIntelligence("curriculum-extraction.md", {
    STAGE_NAME: "Stage 1 - Raw Curriculum Extraction",
    EXTRACTION_RULES: "return JSON only",
    CHUNK_RULE: "",
    SOURCE_TEXT: "Number Systems",
  });
  assert.doesNotMatch(nonTamilStage1Prompt, /Tamil Curriculum Multi-Source Intelligence Layer \(Active\)/);

  const normalizedSupportingDocuments = normalizeSupportingCurriculumDocuments([
    { role: "textbook_index", fileName: "Tamil Index.pdf", text: "Iyal 1\nIyal 2" },
    { role: "textbook_structure", fileName: "Tamil Structure.txt", text: "Chapter: மணிமேகலை" },
    { role: "ignored", fileName: "Other.pdf", text: "Should not pass" },
  ]);
  assert.equal(normalizedSupportingDocuments.length, 2);
  assert.equal(normalizedSupportingDocuments[0].role, "textbook_index");
  assert.equal(normalizedSupportingDocuments[1].role, "textbook_structure");

  const combinedSourceText = buildCombinedCurriculumSourceText(
    "Class X Tamil Curriculum",
    "tamil-curriculum.pdf",
    normalizedSupportingDocuments
  );
  assert.match(combinedSourceText, /Role: primary_curriculum/);
  assert.match(combinedSourceText, /Role: textbook_index/);
  assert.match(combinedSourceText, /Role: textbook_structure/);
  assert.ok(
    combinedSourceText.indexOf("Role: primary_curriculum") < combinedSourceText.indexOf("Role: textbook_index"),
    "primary curriculum text should stay ahead of the textbook index in the combined source"
  );

  const tamilPromptLengthEstimator = (chunkText: string) =>
    renderStage1PromptWithCurriculumIntelligence("curriculum-extraction.md", {
      STAGE_NAME: "Stage 1 - Raw Curriculum Extraction",
      EXTRACTION_RULES: "return JSON only",
      CHUNK_RULE: "",
      SOURCE_TEXT: chunkText,
    }, {
      tamilMode: true,
      stageLabel: "Stage 1 - Raw Curriculum Extraction",
    }).length;
  const nonTamilPromptLengthEstimator = (chunkText: string) =>
    renderStage1PromptWithCurriculumIntelligence("curriculum-extraction.md", {
      STAGE_NAME: "Stage 1 - Raw Curriculum Extraction",
      EXTRACTION_RULES: "return JSON only",
      CHUNK_RULE: "",
      SOURCE_TEXT: chunkText,
    }, {
      tamilMode: false,
      stageLabel: "Stage 1 - Raw Curriculum Extraction",
    }).length;

  const tamilPrimarySource = [
    "# Page 1",
    "CLASS IX TAMIL",
    "Section A Reading",
    "Section B Grammar",
    "Section C Main Course Book",
  ].join("\n\n");
  const tamilIndexSource = "இயல் 1\n".repeat(900);
  const tamilCombinedSource = buildCombinedCurriculumSourceText(
    tamilPrimarySource,
    "Tamil_SecP1_2026-27.pdf",
    [{ role: "textbook_index", fileName: "Tamil Index.pdf", text: tamilIndexSource }]
  );
  const tamilRenderedPromptLength = tamilPromptLengthEstimator(tamilCombinedSource);
  assert.ok(tamilRenderedPromptLength > STAGE1_PROMPT_SAFE_BUDGET);
  assert.ok(
    getAdaptiveStage1ChunkCount(tamilCombinedSource.length, {
      estimatedPromptLength: tamilRenderedPromptLength,
      promptBudget: STAGE1_PROMPT_SAFE_BUDGET,
    }) > 1,
    "Tamil prompt planning should pre-chunk when the rendered prompt exceeds budget"
  );
  const tamilPlannedChunks = buildAdaptiveStage1Chunks(tamilCombinedSource, {
    estimatePromptLength: tamilPromptLengthEstimator,
    promptBudget: STAGE1_PROMPT_SAFE_BUDGET,
  });
  assert.ok(tamilPlannedChunks.length > 1);
  tamilPlannedChunks.forEach((chunk) => {
    assert.ok(
      tamilPromptLengthEstimator(chunk) <= STAGE1_PROMPT_SAFE_BUDGET,
      "Tamil planned chunks should stay within the rendered prompt budget"
    );
  });

  const nonTamilSource = [
    "# Page 1",
    "CLASS IX MATHEMATICS",
    "Unit 1 Number Systems",
    "Unit 2 Algebra",
    "Unit 3 Coordinate Geometry",
  ].join("\n\n");
  const nonTamilRenderedPromptLength = nonTamilPromptLengthEstimator(nonTamilSource);
  assert.ok(nonTamilRenderedPromptLength < STAGE1_PROMPT_SAFE_BUDGET);
  const nonTamilPlannedChunks = buildAdaptiveStage1Chunks(nonTamilSource, {
    estimatePromptLength: nonTamilPromptLengthEstimator,
    promptBudget: STAGE1_PROMPT_SAFE_BUDGET,
  });
  assert.equal(nonTamilPlannedChunks.length, 1);

  const oversizedSinglePageTamilChunk = `# Page 1\n\n${"இயல் 1 தமிழ் பாடம்\n".repeat(500)}`;
  const deeplySplitChunks = splitChunkToPromptBudget(oversizedSinglePageTamilChunk, {
    estimatePromptLength: tamilPromptLengthEstimator,
    promptBudget: STAGE1_PROMPT_SAFE_BUDGET,
  });
  assert.ok(deeplySplitChunks.length > 1);
  deeplySplitChunks.forEach((chunk) => {
    assert.ok(
      tamilPromptLengthEstimator(chunk) <= STAGE1_PROMPT_SAFE_BUDGET,
      "Paragraph/character fallback should reduce oversized single-page Tamil chunks"
    );
  });
  const transportRecoveryChunks = buildStage1TransportRecoveryChunks("First paragraph.\n\nSecond paragraph.", {
    estimatePromptLength: () => STAGE1_PROMPT_SAFE_BUDGET - 10,
    promptBudget: STAGE1_PROMPT_SAFE_BUDGET,
  });
  assert.equal(transportRecoveryChunks.length, 2);
  assert.deepEqual(buildEmptyStage1FactExtraction(), {
    document_metadata: {},
    classes: [],
    units: [],
    chapters: [],
  });

  const selectedTamilSource = [
    "# Page 1",
    "CLASS IX TAMIL",
    "Section A Reading",
    "---",
    "# Page 2",
    "CLASS X TAMIL",
    "Section A Reading",
  ].join("\n");
  const selectedTamilFilter = filterSourceTextToSelectedClasses(selectedTamilSource, ["Class IX"]);
  const filteredTamilCombinedSource = buildCombinedCurriculumSourceText(
    selectedTamilFilter.sourceText,
    "Tamil_SecP1_2026-27.pdf",
    [{ role: "textbook_index", fileName: "Tamil Index.pdf", text: "IX INDEX\nX INDEX" }]
  );
  assert.match(filteredTamilCombinedSource, /CLASS IX TAMIL/);
  assert.doesNotMatch(filteredTamilCombinedSource, /CLASS X TAMIL/);
  assert.match(filteredTamilCombinedSource, /IX INDEX\nX INDEX/);
  const selectedTamilStage1Prompt = renderStage1PromptWithCurriculumIntelligence("curriculum-extraction.md", {
    STAGE_NAME: "Stage 1 - Raw Curriculum Extraction",
    EXTRACTION_RULES: "return JSON only",
    CHUNK_RULE: "",
    SOURCE_TEXT: selectedTamilFilter.sourceText,
  }, {
    tamilMode: true,
    stageLabel: "Stage 1 - Raw Curriculum Extraction",
  });
  assert.match(selectedTamilStage1Prompt, /CLASS IX TAMIL/);
  assert.doesNotMatch(selectedTamilStage1Prompt, /CLASS X TAMIL/);
  assert.doesNotMatch(selectedTamilStage1Prompt, /IX INDEX/);

  const markdownPageSource = [
    "# Page 1",
    "CLASS IX MATHEMATICS",
    "Unit 1 Number Systems",
    "---",
    "# Page 2",
    "Unit 2 Algebra",
    "---",
    "# Page 3",
    "Unit 3 Coordinate Geometry",
  ].join("\n\n");
  const markdownPageChunks = buildAdaptiveStage1Chunks(markdownPageSource, {
    requestedChunkCount: 3,
    estimatePromptLength: nonTamilPromptLengthEstimator,
    promptBudget: STAGE1_PROMPT_SAFE_BUDGET,
  });
  assert.equal(markdownPageChunks.length, 3);
  assert.ok(markdownPageChunks.every((chunk) => chunk.includes("# Page ")));
  assert.ok(markdownPageChunks.every((chunk) => chunk.length > 20));
  assert.ok(markdownPageChunks.every((chunk) => !/^\s*---\s*$/m.test(chunk)));

  const tamilAssessmentSections = parseTamilAssessmentSectionsFromSource(`
    Section – A - Reading Unseen Passage - 10 marks
    Section -B Grammar - 12 marks
    Section -C Main Course Book - 31 Marks
    Section – D Non-detail 10 Marks
    Section – E Creative Writing - 17 Marks
  `);
  assert.deepEqual(
    tamilAssessmentSections.map((section: any) => `${section.title}:${section.marks}`),
    [
      "Reading:10",
      "Grammar:12",
      "Main Course Book:31",
      "Non-detail:10",
      "Creative Writing:17",
    ]
  );

  const tamilIndexUnits = parseTamilTextbookIndexUnits(`
    1 மொழி தமிழ்விடு தூது திராவிட மொழிக்குடும்பம் அமுதென்று பேர் தமிழ் காவியம் ஆறாம் திணை எழுத்து - அளபெடை
    2 இயற்கை நீரின்றி அமையாது உலகு புறநானூறு தண்ணீர் பகுபத உறுப்பிலக்கணம்
    3 பண்பாடு ஏறு தழுவுதல் மணிதமகர்ல மார்கழிப் பெருவிழா தாய்மைக்கு வறட்சி இல்லை தொடர் இலக்கணம் ஆகுபெயர் திருக்குறள்
    4 கல்வி கல்வியில் சிறந்த பெண்கள் குடும்ப விளக்கு வீட்டிற்கோர் புத்தகசாலை துணை வினைகள்
    5 கலை சிற்பக்கர்ல செய்தி வல்லினம் மிகும் இடங்கள் திருக்குறள்
    6 நாடு தமிழர் பங்கு சீவக சிந்தாமணி விண்ணையும் சாடுவோம் வல்லினம் மிகா இடங்கள்
    7 அறம் பெரியாரின் சிந்தனைகள் ஓ, என் சமகாலத் தோழர்களே! யசோதர காவியம் மகனுக்கு எழுதிய கடிதம் யாப்பிலக்கணம் திருக்குறள்
  `, "Class IX");
  assert.equal(tamilIndexUnits.length, 7);
  assert.equal(tamilIndexUnits[4]?.theme, "கலை");
  assert.equal(tamilIndexUnits[5]?.theme, "நாடு");
  assert.equal(tamilIndexUnits[6]?.theme, "அறம்");
  assert.ok(tamilIndexUnits[2]?.chapters.includes("மணிமேகலை"));
  assert.ok(tamilIndexUnits[2]?.chapters.includes("தொடர் இலக்கணம்"));
  assert.ok(tamilIndexUnits[5]?.chapters.includes("விண்ணையும் சாடுவோம்"));

  const tamilFastPathFacts = buildTamilFastStage1Facts(`
    # Page 2

    ## TAMIL SYLLABUS (CODE: 006)
    ## CLASS –IX (2026- 2027)
    ## IYAL 1 - 7
    ## Section – A - Reading Unseen Passage - 10 marks
    ## Section -B Grammar - 12 marks (MCQ)
    ## Section -C Main Course Book - 31 Marks
    ## Section – D Non-detail 10 Marks
    ## Section – E Creative Writing - 17 Marks
    Page 2 of 14
  `, "Tamil_SecP1_2026-27.pdf", {
    selectedClassNames: ["Class IX"],
    supportingDocuments: [{
      role: "textbook_index",
      fileName: "Tamil Index.pdf",
      text: `
        1 மொழி தமிழ்விடு தூது திராவிட மொழிக்குடும்பம் அமுதென்று பேர் தமிழ் காவியம் ஆறாம் திணை எழுத்து - அளபெடை
        2 இயற்கை நீரின்றி அமையாது உலகு புறநானூறு தண்ணீர் பகுபத உறுப்பிலக்கணம்
        3 பண்பாடு ஏறு தழுவுதல் மணிதமகர்ல மார்கழிப் பெருவிழா தாய்மைக்கு வறட்சி இல்லை தொடர் இலக்கணம் ஆகுபெயர் திருக்குறள்
        4 கல்வி கல்வியில் சிறந்த பெண்கள் குடும்ப விளக்கு வீட்டிற்கோர் புத்தகசாலை துணை வினைகள்
        5 கலை சிற்பக்கர்ல செய்தி வல்லினம் மிகும் இடங்கள் திருக்குறள்
        6 நாடு தமிழர் பங்கு சீவக சிந்தாமணி விண்ணையும் சாடுவோம் வல்லினம் மிகா இடங்கள்
        7 அறம் பெரியாரின் சிந்தனைகள் ஓ, என் சமகாலத் தோழர்களே! யசோதர காவியம் மகனுக்கு எழுதிய கடிதம் யாப்பிலக்கணம் திருக்குறள்
      `,
    }],
  });
  assert.ok(tamilFastPathFacts);
  assert.equal(tamilFastPathFacts?.document_metadata?.subject, "Tamil");
  assert.equal(tamilFastPathFacts?.document_metadata?.class, "Class IX");
  assert.equal(tamilFastPathFacts?.document_metadata?.academic_year, "2026- 2027");
  assert.equal(tamilFastPathFacts?.document_metadata?.total_pages, "14");
  assert.equal(tamilFastPathFacts?.units?.length, 7);
  assert.ok(tamilFastPathFacts?.chapters?.some((chapter: any) => chapter.chapter_name === "திராவிட மொழிக்குடும்பம்"));
  assert.deepEqual(
    tamilFastPathFacts?.assessment_information?.marks_distribution,
    [
      "Reading - 10 Marks",
      "Grammar - 12 Marks",
      "Main Course Book - 31 Marks",
      "Non-detail - 10 Marks",
      "Creative Writing - 17 Marks",
    ]
  );
  const tamilStructureDigest = buildTamilStructureDigest(`
    Iyal 3: பண்பாடு
    Chapter: மணிமேகலை
    Topic: மார்கழிப் பெருவிழா
    Subtopic: திருவிழா சூழல்
    Topic: தொடர் இலக்கணம்
    Subtopic: ஆகுபெயர்
  `, {
    className: "Class IX",
    subject: "Tamil",
    title: "Tamil Structure Digest",
  });
  assert.ok(tamilStructureDigest);
  assert.equal(tamilStructureDigest?.chapter_candidates[0]?.chapter_name, "மணிமேகலை");
  assert.equal(tamilStructureDigest?.topic_candidates.length, 2);
  assert.equal(tamilStructureDigest?.subtopic_candidates.length, 2);

  const enrichedTamilFacts = enrichTamilStage1FactsWithStructure(tamilFastPathFacts, [{
    role: "textbook_structure",
    fileName: "Tamil Structure.txt",
    text: `
      Iyal 3: பண்பாடு
      Chapter: மணிமேகலை
      Topic: மார்கழிப் பெருவிழா
      Subtopic: திருவிழா சூழல்
      Topic: தொடர் இலக்கணம்
      Subtopic: ஆகுபெயர்
    `,
  }], {
    className: "Class IX",
  });
  const enrichedManimekalai = enrichedTamilFacts.stage1Facts.chapters.find((chapter: any) => chapter.chapter_name === "மணிமேகலை");
  assert.ok(enrichedManimekalai);
  assert.ok(enrichedManimekalai.topics.includes("மார்கழிப் பெருவிழா"));
  assert.ok(enrichedManimekalai.topics.includes("தொடர் இலக்கணம்"));
  assert.ok(enrichedManimekalai.subtopics.includes("திருவிழா சூழல்"));
  assert.ok(enrichedManimekalai.subtopics.includes("ஆகுபெயர்"));

  const hardenedTamil = hardenTamilStage1Facts({
    document_metadata: { subject: "Tamil", class: "8th Standard" },
    classes: [{ class_name: "8th Standard", subject: "Tamil", part_or_section: "" }],
    units: [
      { class_name: "8th Standard", subject: "Tamil", part_or_section: "Reading", unit_id: "U1", unit_name: "Reading", topics: [], subtopics: [], key_concepts: [] },
      { class_name: "Class IX", subject: "Tamil", part_or_section: "Grammar", unit_id: "U2", unit_name: "Grammar", topics: [], subtopics: [], key_concepts: [] },
      { class_name: "Class IX", subject: "Tamil", part_or_section: "Creative Writing", unit_id: "class-9-tamil-u1", unit_name: "Creative Writing", topics: [], subtopics: [], key_concepts: [] },
    ],
    chapters: [],
    assessment_information: {},
  }, {
    primarySourceText: `
      ## CLASS –IX (2026- 2027)
      Section – A - Reading Unseen Passage - 10 marks
      Section -B Grammar - 12 marks
      Section -C Main Course Book - 31 Marks
      Section – D Non-detail 10 Marks
      Section – E Creative Writing - 17 Marks
    `,
    selectedClassNames: ["Class IX"],
    supportingDocuments: [{
      role: "textbook_index",
      fileName: "Tamil Index.pdf",
      text: `
        1 மொழி தமிழ்விடு தூது திராவிட மொழிக்குடும்பம்
        2 இயற்கை நீரின்றி அமையாது உலகு தண்ணீர்
        3 பண்பாடு ஏறு தழுவுதல் மணிதமகர்ல தொடர் இலக்கணம் ஆகுபெயர்
        4 கல்வி கல்வியில் சிறந்த பெண்கள் குடும்ப விளக்கு
        5 கலை சிற்பக்கர்ல செய்தி
        6 நாடு தமிழர் பங்கு சீவக சிந்தாமணி விண்ணையும் சாடுவோம்
        7 அறம் பெரியாரின் சிந்தனைகள் மகனுக்கு எழுதிய கடிதம் யாப்பிலக்கணம்
      `,
    }],
  });
  assert.equal(hardenedTamil.metadata.tamilNormalizationApplied, true);
  assert.equal(hardenedTamil.metadata.resolvedClassName, "Class IX");
  assert.equal(hardenedTamil.metadata.recoveredTextbookUnitCount, 7);
  assert.equal(hardenedTamil.metadata.dedupedAssessmentSectionCount, 5);
  assert.equal(hardenedTamil.stage1Facts.document_metadata.class, "Class IX");
  assert.equal(hardenedTamil.stage1Facts.classes[0].class_name, "Class IX");
  assert.equal(hardenedTamil.stage1Facts.units.length, 7);
  assert.deepEqual(
    hardenedTamil.stage1Facts.units.map((unit: any) => unit.unit_id),
    ["U1", "U2", "U3", "U4", "U5", "U6", "U7"]
  );
  assert.ok(
    hardenedTamil.stage1Facts.units.every((unit: any) => /^Iyal \d+ - /.test(unit.unit_name)),
    "Tamil hardening should replace duplicate section-like units with textbook Iyal units"
  );
  assert.ok(
    hardenedTamil.stage1Facts.chapters.some((chapter: any) => chapter.chapter_name === "மணிமேகலை"),
    "Tamil OCR correction should recover cleaner textbook chapter titles where supported"
  );
  assert.deepEqual(
    hardenedTamil.stage1Facts.assessment_information.marks_distribution,
    [
      "Reading - 10 Marks",
      "Grammar - 12 Marks",
      "Main Course Book - 31 Marks",
      "Non-detail - 10 Marks",
      "Creative Writing - 17 Marks",
    ]
  );

  const deterministicTamilStage3Fallback = buildDeterministicStage3FallbackFromApprovedClass({
    class_name: "Class IX",
    subject: "Tamil",
    part_or_section: "",
    units: [
      {
        unit_id: "U1",
        unit_name: "Iyal 1 - மொழி",
        part_or_section: "மொழி",
        chapters: [
          {
            chapter_name: "திராவிட மொழிக்குடும்பம்",
            source_type: "explicit_chapter",
          },
          {
            chapter_name: "எழுத்து - அளபெடை",
            source_type: "explicit_chapter",
          },
        ],
      },
    ],
  }, {
    reason: "test-empty-response",
    stageName: "Stage 3: Node Enrichment - Class IX - Tamil",
  });
  assert.equal(deterministicTamilStage3Fallback.units.length, 1);
  assert.equal(deterministicTamilStage3Fallback.units[0].unit_id, "U1");
  assert.deepEqual(
    deterministicTamilStage3Fallback.units[0].chapters.map((chapter: any) => chapter.source_chapter_name),
    ["திராவிட மொழிக்குடும்பம்", "எழுத்து - அளபெடை"]
  );
  assert.equal(deterministicTamilStage3Fallback.validation_report.deterministic_fallback_applied, true);
  assert.equal(deterministicTamilStage3Fallback.validation_report.chapter_count, 2);
  assert.equal(
    deterministicTamilStage3Fallback.validation_report.fallback_reason,
    "test-empty-response"
  );

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

  const tamilRaw = expandStage1FactsToRawExtraction(tamilFastPathFacts);
  assert.deepEqual(
    tamilRaw.assessment_information.marks_distribution,
    [
      "Reading - 10 Marks",
      "Grammar - 12 Marks",
      "Main Course Book - 31 Marks",
      "Non-detail - 10 Marks",
      "Creative Writing - 17 Marks",
    ]
  );

  const cleanedCbse = cleanupCbseStructure({
    classes: [{
      class_name: "Class IX",
      subject: "Mathematics",
      units: [
        {
          unit_id: "U4",
          unit_name: "Geometry",
          chapters: [
            { chapter_name: "Lines and Angles", topics: [], subtopics: [] },
            { chapter_name: "Circles", topics: [], subtopics: [] },
          ],
          topics: [],
          subtopics: [],
        },
        {
          unit_id: "U4A",
          unit_name: "Geometry (Implicit Unit from Context)",
          chapters: [
            { chapter_name: "Triangles - Congruence Theorems", topics: [], subtopics: [] },
            { chapter_name: "4-gons (Quadrilaterals)", topics: [], subtopics: [] },
          ],
          topics: [],
          subtopics: [],
        },
        {
          unit_id: "U5",
          unit_name: "Mensuration",
          chapters: [
            { chapter_name: "Area and Perimeter", topics: [], subtopics: [] },
          ],
          topics: [],
          subtopics: [],
        },
        {
          unit_id: "U5A",
          unit_name: "Mensuration: Surface Area and Volume",
          chapters: [],
          topics: ["Surface areas and volumes of spheres"],
          subtopics: [],
        },
        {
          unit_id: "U6",
          unit_name: "Statistics and Probability",
          chapters: [
            { chapter_name: "Statistics", topics: [], subtopics: [] },
          ],
          topics: [],
          subtopics: [],
        },
        {
          unit_id: "U6A",
          unit_name: "Introduction to Probability",
          chapters: [],
          topics: ["Concept of probability and randomness"],
          subtopics: [],
        },
      ],
    }],
  });

  assert.equal(cleanedCbse.classes[0].units.length, 3);
  const cleanedGeometry = cleanedCbse.classes[0].units.find((unit: any) => unit.unit_name === "Geometry");
  assert.equal(cleanedGeometry?.chapters?.length, 4);
  const cleanedMensuration = cleanedCbse.classes[0].units.find((unit: any) => unit.unit_name === "Mensuration");
  assert.equal(cleanedMensuration?.chapters?.length, 2);
  assert.ok(
    cleanedMensuration?.chapters?.some((chapter: any) => chapter.chapter_name === "Surface Area and Volume"),
    "Mensuration chapter promoted as a unit should be merged back into the Mensuration unit"
  );
  const cleanedStats = cleanedCbse.classes[0].units.find((unit: any) => unit.unit_name === "Statistics and Probability");
  assert.equal(cleanedStats?.chapters?.length, 2);
  assert.ok(
    cleanedStats?.chapters?.some((chapter: any) => chapter.chapter_name === "Introduction to Probability"),
    "Standalone Introduction to Probability unit should be merged into Statistics and Probability"
  );

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

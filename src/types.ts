/**
 * Types for the Lesson Plan Generator Module
 */

export interface CurriculumExtraction {
  subject: string;
  gradeLevel: string;
  overallDescription: string;
  coreObjectives: string[];
  units: {
    unitId: string;
    unitName: string;
    className?: string;
    description: string;
    topics: string[];
  }[];
  classes?: Array<{
    class_name: string;
    subject?: string;
    part_or_section?: string;
    units?: Array<{
      unit_id?: string;
      unit_name?: string;
      topics?: string[];
      chapters?: Array<{
        chapter_id?: string;
        chapter_name?: string;
        topics?: string[];
        subtopics?: string[];
      }>;
    }>;
  }>;
  stagedExtraction?: Record<string, unknown>;
  document_metadata?: Record<string, unknown>;
  normalizedStructure?: Record<string, unknown>;
}

export interface CurriculumClassSummary {
  className: string;
  subject: string;
  unitCount: number;
  chapterCount: number;
  topicCount: number;
  pageRangeLabel?: string;
  detectionSource?: string;
}

export interface CurriculumSupportingDocument {
  role: "textbook_index" | "textbook_structure" | "sunbird_textbook_structure" | "sunbird_content_manifest";
  fileName: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface SunbirdSearchCandidate {
  identifier: string;
  name: string;
  contentType?: string;
  mimeType?: string;
  board?: string;
  se_boards?: string[];
  se_gradeLevels?: string[];
  se_mediums?: string[];
  se_subjects?: string[];
  source: "production" | "sandbox";
}

export interface SunbirdStructurePreviewResponse {
  success: boolean;
  source: "production" | "sandbox";
  contentId: string;
  title: string;
  digestText: string;
  summary: {
    totalNodes: number;
    chapterCandidates: number;
    topicCandidates: number;
    subtopicCandidates: number;
  };
  supportingDocuments: CurriculumSupportingDocument[];
}

export interface CurriculumClassOptionsResponse {
  success: boolean;
  fileName: string;
  detectedClasses: CurriculumClassSummary[];
  requiresClassSelection: boolean;
  detectedSubject: string;
  requiresTamilIndex: boolean;
}

export interface SavedCurriculumRecord {
  _id: string;
  fileName: string;
  subject: string;
  gradeLevel: string;
  sourceText: string;
  extractedCurriculum: CurriculumExtraction;
  extractionMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SavedCurriculumSummary {
  _id: string;
  fileName: string;
  subject: string;
  gradeLevel: string;
  createdAt: string;
  updatedAt: string;
}

export interface TermRow {
  id: string;
  className?: string;
  termNumber?: number;
  term: string; // e.g. "Term 1", "Term 2"
  unitId?: string;
  unitName: string;
  chapters: string[];
  recurringStrands?: string[];
  recurringStrandDetails?: RecurringStrandAllocation[];
  marks: number;
}

export interface RecurringStrandAllocation {
  title: string;
  marks?: number;
  estimatedSessions?: number | null;
}

export interface SessionConfig {
  includeLearningOutcomes: boolean;
  includeIntroduction: boolean;
  includeTheory: boolean;
  includeAssessments: boolean;
  includeAssignments: boolean;
  includeNotes: boolean; // HTML/PPT/PDF/DOCX materials
  sessionCount: number;
  durationMinutes: number;
}

export type SessionSectionKey =
  | "teacherLessonNotes"
  | "studentLessonNotes"
  | "learningOutcomes"
  | "introduction"
  | "theory"
  | "activities"
  | "materials"
  | "homework"
  | "assessment"
  | "assignment";

export type AssessmentQuestionType =
  | "mcq"
  | "veryShortAnswer"
  | "shortAnswer"
  | "longAnswer"
  | "caseStudy";

export interface AssessmentQuestionTypeRequest {
  type: AssessmentQuestionType;
  label?: string;
  questionCount?: number | null;
  marksEach?: number | null;
}

export interface SessionAssessmentCustomization {
  assessmentType?: string;
  difficulty?: string;
  paperObjective?: string;
  totalMarks?: number | null;
  totalQuestions?: number | null;
  questionTypes?: AssessmentQuestionTypeRequest[];
}

export interface SessionPptGenerationOptions {
  pptTemplateId?: string;
  pptThemeId?: string;
}

export type AssessmentRenderedSubtype =
  | "mcq"
  | "veryShortAnswer"
  | "shortAnswer"
  | "longAnswer"
  | "caseStudy";

export interface MathRichText {
  text?: string;
  latex?: string;
  displayLatex?: string;
}

export type RenderableMathText = string | MathRichText;

export type MathDiagramType =
  | "triangle"
  | "rightTriangle"
  | "circle"
  | "quadrilateral"
  | "polygon"
  | "anglePair"
  | "coordinatePlane"
  | "numberLine"
  | "barModel"
  | "solid3D";

export type MathDiagramTemplate =
  | "rightTriangle"
  | "sqrtNumberLineConstruction"
  | "theodorusSpiral"
  | "circleRadiusDiameter"
  | "coordinatePlanePlot"
  | "rectangleAreaPerimeter"
  | "anglePair"
  | "barModel"
  | "solid3D";

export interface MathDiagramPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export interface MathDiagramLine {
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed";
  highlight?: boolean;
}

export interface MathDiagramArc {
  center: string;
  radius: number;
  startAngle: number;
  endAngle: number;
  label?: string;
  highlight?: boolean;
}

export interface MathDiagramLabel {
  text: string;
  x: number;
  y: number;
  latex?: string;
}

export interface MathDiagramSpec {
  id: string;
  type: MathDiagramType;
  template?: MathDiagramTemplate;
  params?: {
    roots?: number[];
    highlightRoot?: number;
    baseLength?: string | number;
    height?: string | number;
    hypotenuse?: string | number;
    radius?: string | number;
    diameter?: string | number;
    width?: string | number;
    length?: string | number;
    angleA?: string | number;
    angleB?: string | number;
    plottedPoints?: { x: number; y: number; label?: string }[];
    [key: string]: unknown;
  };
  title?: string;
  caption?: string;
  points?: MathDiagramPoint[];
  lines?: MathDiagramLine[];
  arcs?: MathDiagramArc[];
  labels?: MathDiagramLabel[];
  highlights?: string[];
  measurements?: MathDiagramLabel[];
  axis?: {
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    points?: MathDiagramPoint[];
  };
  bars?: {
    label?: string;
    value?: string | number;
    segments?: { label?: string; value?: string | number; highlight?: boolean }[];
  }[];
  solid?: {
    width?: string | number;
    height?: string | number;
    depth?: string | number;
  };
}

export interface MathFormulaCard {
  title?: string;
  formula?: string | MathRichText;
  meaning?: string;
  whenToUse?: string;
}

export interface AssessmentSectionSummary {
  id?: string;
  title: RenderableMathText;
  marks?: number;
  questionCount?: number;
  questionRefs?: RenderableMathText[];
  source?: "curriculum" | "assessment_framework" | "fallback";
}

export interface AssessmentSectionPlanItem {
  sectionId?: string;
  title: RenderableMathText;
  marks?: number;
  questionCount?: number;
  questionRefs?: RenderableMathText[];
  focus?: RenderableMathText;
}

export interface CanonicalAssessmentQuestion {
  id?: string;
  questionNumber?: number;
  sectionId?: string;
  sectionTitle?: RenderableMathText;
  type?: "mcq" | "shortAnswer" | "longAnswer";
  subtype?: AssessmentRenderedSubtype;
  prompt: RenderableMathText;
  options?: RenderableMathText[];
  marks?: number;
  expectedLength?: RenderableMathText;
  learningOutcomeRefs?: string[];
  conceptRefs?: RenderableMathText[];
  topicCoverage?: string[];
  subtopicCoverage?: string[];
  bloomsLevel?: string;
  competencyTag?: RenderableMathText;
  difficulty?: string;
  sourceEvidence?: RenderableMathText[];
}

export interface CanonicalAssessmentAnswerKeyItem {
  questionId?: string;
  sectionId?: string;
  sectionTitle?: RenderableMathText;
  answer: RenderableMathText;
  explanation?: RenderableMathText;
  marks?: number;
  subtype?: AssessmentRenderedSubtype;
}

export interface CanonicalAssessmentMarkBreakdownItem {
  criterion: RenderableMathText;
  marks?: number;
}

export interface CanonicalAssessmentMarkingSchemeItem {
  questionId?: string;
  totalMarks?: number;
  markBreakdown?: CanonicalAssessmentMarkBreakdownItem[];
  awardGuidance?: RenderableMathText[];
}

export interface CanonicalAssessmentRubricItem {
  questionId?: string;
  totalMarks?: number;
  criteria?: CanonicalAssessmentMarkBreakdownItem[];
  sampleAnswer?: RenderableMathText;
}

export interface CanonicalAssessmentValidationCheck {
  passed?: boolean;
  details?: RenderableMathText[];
}

export interface CanonicalAssessmentPackage {
  assessmentMeta?: {
    assessmentType?: string;
    totalMarks?: number;
    totalQuestions?: number;
    durationMinutes?: number;
    language?: string;
    instructions?: RenderableMathText[];
    preferredDifficulty?: string;
    paperObjective?: RenderableMathText;
    requestSignature?: string;
    requestedQuestionTypes?: AssessmentQuestionTypeRequest[];
  };
  meta?: {
    assessmentType?: string;
    totalMarks?: number;
    totalQuestions?: number;
    durationMinutes?: number;
    language?: string;
    instructions?: RenderableMathText[];
    preferredDifficulty?: string;
    paperObjective?: RenderableMathText;
    requestSignature?: string;
    requestedQuestionTypes?: AssessmentQuestionTypeRequest[];
  };
  sessionAnalysis?: {
    assessedLearningOutcomes?: RenderableMathText[];
    assessedConcepts?: RenderableMathText[];
    conceptCoveragePriorities?: RenderableMathText[];
    misconceptionTargets?: RenderableMathText[];
    competencyFocus?: RenderableMathText[];
  };
  blueprint?: {
    sectionPlan?: AssessmentSectionPlanItem[];
    conceptDistribution?: {
      concept: RenderableMathText;
      questionRefs?: RenderableMathText[];
      competency?: RenderableMathText;
      importance?: RenderableMathText;
    }[];
    learningOutcomeCoverage?: {
      outcome: RenderableMathText;
      questionRefs: RenderableMathText[];
    }[];
    bloomsDistribution?: {
      recall?: number;
      understanding?: number;
      application?: number;
      analysis?: number;
      evaluation?: number;
      creation?: number;
    };
    competencyDistribution?: Record<string, number>;
    difficultyDistribution?: {
      easy?: number;
      medium?: number;
      hard?: number;
    };
    questionDistribution?: Record<string, number>;
    timeAllocation?: {
      section: RenderableMathText;
      minutes: number;
    }[];
  };
  paper?: {
    instructions?: RenderableMathText[];
    sections?: AssessmentSectionSummary[];
    questions?: CanonicalAssessmentQuestion[];
  };
  mcq?: Array<{
    question?: RenderableMathText;
    options?: RenderableMathText[];
    marks?: number;
    questionSubtype?: RenderableMathText;
    difficulty?: RenderableMathText;
    bloomsLevel?: RenderableMathText;
    expectedLength?: RenderableMathText;
  }>;
  shortAnswer?: Array<{
    question?: RenderableMathText;
    options?: RenderableMathText[];
    marks?: number;
    questionSubtype?: RenderableMathText;
    difficulty?: RenderableMathText;
    bloomsLevel?: RenderableMathText;
    expectedLength?: RenderableMathText;
  }>;
  longAnswer?: Array<{
    question?: RenderableMathText;
    options?: RenderableMathText[];
    marks?: number;
    questionSubtype?: RenderableMathText;
    difficulty?: RenderableMathText;
    bloomsLevel?: RenderableMathText;
    expectedLength?: RenderableMathText;
  }>;
  evaluation?: {
    answerKey?: {
      items?: CanonicalAssessmentAnswerKeyItem[];
    };
    markingScheme?: {
      items?: CanonicalAssessmentMarkingSchemeItem[];
    };
    rubrics?: {
      items?: CanonicalAssessmentRubricItem[];
    };
    generalInstructions?: RenderableMathText[];
    evaluatorInstructions?: RenderableMathText[];
    moderationNotes?: RenderableMathText[];
  };
  summary?: {
    coverageSummary?: RenderableMathText[];
    omittedContent?: RenderableMathText[];
    balanceNotes?: RenderableMathText[];
  };
  validation?: {
    exactPatternChecks?: CanonicalAssessmentValidationCheck;
    marksChecks?: CanonicalAssessmentValidationCheck;
    sectionChecks?: CanonicalAssessmentValidationCheck;
    alignmentChecks?: CanonicalAssessmentValidationCheck;
    scopeBoundaryChecks?: CanonicalAssessmentValidationCheck;
  };
}

export interface SessionPlan {
  id: string;
  sessionKey?: string;
  sessionNumber: number;
  title: string;
  duration: number; // in mins
  teacherLessonNotes?: {
    sessionOverview?: string;
    prerequisiteKnowledge?: string[];
    previousSessionRecap?: string[];
    learningOutcomes?: string[];
    teachingPlan?: {
      minutes: number;
      topic: string;
      teachingStrategy?: string;
    }[];
    teachingSequence?: RenderableMathText[];
    guidedPractice?: RenderableMathText[];
    lessonBlocks?: {
      title: string;
      durationMinutes?: number;
      teacherPrompt?: RenderableMathText[];
      explanation?: RenderableMathText[];
      examples?: RenderableMathText[];
      boardWork?: RenderableMathText[];
      boardSteps?: (string | MathRichText)[];
      solutionFlow?: (string | MathRichText)[];
      geometryDiagrams?: MathDiagramSpec[];
      proofSteps?: (string | MathRichText)[];
      checkUnderstanding?: RenderableMathText[];
      expectedAnswers?: RenderableMathText[];
      activity?: RenderableMathText[];
    }[];
    differentiation?: {
      slowLearners?: RenderableMathText[];
      averageLearners?: RenderableMathText[];
      advancedLearners?: RenderableMathText[];
    };
    teacherTips?: RenderableMathText[];
    misconceptions?: RenderableMathText[];
    lessonPurpose?: RenderableMathText[];
    classroomQuestions?: {
      question: RenderableMathText;
      level?: string;
      expectedResponse?: RenderableMathText;
      answerPoints?: RenderableMathText[];
    }[];
    commonMisconceptionsDetailed?: {
      misconception: RenderableMathText;
      correction: RenderableMathText;
    }[];
    assessmentQuestions?: RenderableMathText[];
    blackboardSummary?: RenderableMathText[];
    endOfClassRecap?: {
      prompt: RenderableMathText;
      expectedAnswer?: RenderableMathText;
    }[];
    conceptFlow?: {
      conceptName: RenderableMathText;
      definition?: RenderableMathText;
      coreExplanation?: RenderableMathText;
      importance?: RenderableMathText;
      observedIn?: RenderableMathText[];
      whyStudyIt?: RenderableMathText;
      relationshipWithPrevious?: RenderableMathText;
      relationshipWithFuture?: RenderableMathText;
      keywords?: RenderableMathText[];
      teacherMoves?: RenderableMathText[];
      examples?: RenderableMathText[];
      visuals?: RenderableMathText[];
      solutionFlow?: (string | MathRichText)[];
      geometryDiagrams?: MathDiagramSpec[];
      proofSteps?: (string | MathRichText)[];
    }[];
    timePlan?: {
      segment: string;
      minutes: number;
      purpose?: RenderableMathText;
    }[];
    formativeChecks?: RenderableMathText[];
    sessionSummary?: RenderableMathText[];
    nextSessionBridge?: RenderableMathText[];
  };
  studentLessonNotes?: {
    title?: string;
    sessionOverview?: RenderableMathText;
    introduction?: RenderableMathText;
    learningObjectives?: RenderableMathText[];
    quickRecall?: RenderableMathText[];
    easyToRemember?: RenderableMathText[];
    comparisonTables?: {
      title: string;
      headers?: string[];
      rows?: string[][];
    }[];
    formulaCards?: MathFormulaCard[];
    geometryDiagrams?: MathDiagramSpec[];
    proofSteps?: (string | MathRichText)[];
    commonMistakes?: {
      mistake: string;
      correction?: string;
      example?: string;
    }[];
    sections?: {
      heading: string;
      explanation: RenderableMathText;
      keyPoints?: RenderableMathText[];
      examples?: RenderableMathText[];
      whyItMatters?: RenderableMathText;
      terminology?: RenderableMathText[];
      detailedExplanation?: RenderableMathText;
      observedIn?: RenderableMathText[];
      visualSupport?: RenderableMathText[];
      visualAssets?: {
        prompt?: string;
        alt?: string;
        imageDataUrl?: string;
        mimeType?: string;
        model?: string;
      }[];
      importantNotes?: RenderableMathText[];
      memoryTechniques?: RenderableMathText[];
      conceptSummary?: RenderableMathText[];
    }[];
    definitions?: { term: RenderableMathText; definition: RenderableMathText }[];
    workedExamples?: {
      title: string;
      problem?: RenderableMathText;
      diagramRef?: string;
      given?: (string | MathRichText)[];
      formula?: (string | MathRichText)[];
      steps?: RenderableMathText[];
      solutionSteps?: (string | MathRichText)[];
      reasoning?: (string | MathRichText)[];
      explanation?: RenderableMathText;
      finalAnswer?: RenderableMathText;
      latex?: string;
      displayLatex?: string;
    }[];
    revisionSection?: {
      definitions?: RenderableMathText[];
      formulas?: (string | MathRichText)[];
      facts?: RenderableMathText[];
      keywords?: RenderableMathText[];
      conceptMap?: RenderableMathText[];
      quickRecap?: RenderableMathText[];
    };
    selfCheckQuestions?: RenderableMathText[];
    quickSummary?: RenderableMathText[];
    keyTerms?: RenderableMathText[];
    fillInTheBlanks?: {
      prompt: RenderableMathText;
      answer?: RenderableMathText;
    }[];
    mcqQuestions?: {
      question: RenderableMathText;
      options: RenderableMathText[];
      answer?: RenderableMathText;
    }[];
    veryShortAnswerQuestions?: {
      question: RenderableMathText;
      answer?: RenderableMathText;
    }[];
    didYouKnow?: RenderableMathText[];
    summary?: RenderableMathText[];
    quickRevision?: RenderableMathText[];
    rememberPoints?: RenderableMathText[];
  };
  learningOutcomes?: string[];
  introduction?: string;
  theory?: {
    overview: string;
    keyPoints: string[];
    detailedContent: string;
  };
  activities?: {
    name: string;
    instructions: string[];
    durationMinutes: number;
  }[];
  materials?: {
    ppt: {
      deckMode?: "teacher-delivery";
      templateId?: string;
      templateName?: string;
      themeId?: string;
      themeName?: string;
      title?: RenderableMathText;
      presentationTitle?: RenderableMathText;
      presentationGoal?: RenderableMathText;
      audience?: RenderableMathText;
      theme?: RenderableMathText;
      themeTokens?: {
        fonts?: {
          heading?: string;
          body?: string;
        };
        colors?: {
          primary?: string;
          secondary?: string;
          accent?: string;
          background?: string;
          surface?: string;
          text?: string;
          mutedText?: string;
        };
        visualStyle?: {
          topBarStyle?: string;
          cardStyle?: string;
          visualFrameStyle?: string;
        };
      };
      assetSearchPlan?: {
        preferredSources?: string[];
        safeSearch?: boolean;
        licensingNotes?: string[];
        fallbackStrategy?: string;
      };
      licenseChecklist?: RenderableMathText[];
      presentationWarnings?: RenderableMathText[];
      coverageSummary?: {
        learningOutcomesCovered?: RenderableMathText[];
        topicsCovered?: RenderableMathText[];
        taughtConceptsCovered?: RenderableMathText[];
        omittedContent?: RenderableMathText[];
      };
      slides: {
        templateId?: string;
        templateSlideKey?: string;
        templateSlideTitle?: string;
        isOptionalSlotFilled?: boolean;
        slideTitle?: RenderableMathText;
        bulletPoints?: RenderableMathText[];
        slideNumber?: number;
        slideType?: string;
        learningOutcomeIds?: string[];
        topicCoverage?: string[];
        teacherIntent?: RenderableMathText;
        studentTakeaway?: RenderableMathText;
        layout?: RenderableMathText;
        onSlideText?: RenderableMathText[];
        speakerNotes?: RenderableMathText[];
        visualAttribution?: {
          visualPlan?: RenderableMathText;
          svgDiagram?: {
            purpose?: RenderableMathText;
            search?: RenderableMathText;
            source?: RenderableMathText;
            license?: RenderableMathText;
            animation?: RenderableMathText;
          };
        };
        visualPlan?: RenderableMathText;
        assets?: {
          purpose?: RenderableMathText;
          searchQuery?: RenderableMathText;
          sourceSite?: RenderableMathText;
          sourceUrl?: RenderableMathText;
          previewUrl?: RenderableMathText;
          licenseType?: RenderableMathText;
          attributionText?: RenderableMathText;
          altText?: RenderableMathText;
          placementHint?: RenderableMathText;
          imageDataUrl?: string;
          mimeType?: string;
          model?: RenderableMathText;
          sourceKind?: "reusable-external" | "generated-image" | "svg-diagram" | "none";
        }[];
        svgDiagram?: {
          title?: RenderableMathText;
          type?: string;
          instructions?: RenderableMathText[];
          svgCode?: string;
        };
        generatedVisual?: {
          visualPlan?: RenderableMathText;
          svgDiagram?: {
            purpose?: RenderableMathText;
            search?: RenderableMathText;
            source?: RenderableMathText;
            license?: RenderableMathText;
            animation?: RenderableMathText;
          };
          imageDataUrl?: string;
          mimeType?: string;
          model?: RenderableMathText;
          sourceSite?: RenderableMathText;
          licenseType?: RenderableMathText;
        };
        animationHints?: RenderableMathText[];
        timeEstimateMinutes?: number;
      }[];
    };
    pdf: { documentTitle: RenderableMathText; keyInformation: RenderableMathText[] };
    docx: { outlineTitle: RenderableMathText; sections: RenderableMathText[] };
  };
  homework?: {
    task?: RenderableMathText;
    estimatedTimeMinutes?: number;
    sessionInformation?: {
      sessionNumber?: string;
      sessionTitle?: RenderableMathText;
      subject?: RenderableMathText;
      grade?: RenderableMathText;
      difficultyLevel?: RenderableMathText;
      learningPace?: RenderableMathText;
      estimatedHomeworkDuration?: RenderableMathText;
    };
    homework?: {
      id: number;
      type?: RenderableMathText;
      title?: RenderableMathText;
      learningOutcomeIds?: string[];
      topicCoverage?: string[];
      difficulty?: string;
      marks?: number;
      estimatedTime?: RenderableMathText;
      instructions?: RenderableMathText;
      question?: RenderableMathText;
      options?: RenderableMathText[];
      answerSpace?: RenderableMathText;
      visualRequirement?: RenderableMathText;
      expectedResponse?: RenderableMathText;
    }[];
    summary?: {
      totalQuestions?: number;
      totalMarks?: number;
      estimatedCompletionTime?: RenderableMathText;
      learningOutcomesCovered?: RenderableMathText[];
      topicsCovered?: RenderableMathText[];
      subtopicsCovered?: RenderableMathText[];
      taskDistribution?: Record<string, number>;
      homeExperimentIncluded?: boolean;
      parentEngagementIncluded?: boolean;
    };
  };
  assessment?: CanonicalAssessmentPackage;
  assignment?: {
    taskDescription: RenderableMathText;
    rubric: RenderableMathText[];
    answerKey: RenderableMathText;
  };
}

export type PlanningWorkspacePhase =
  | "curriculum_setup"
  | "course_planning"
  | "session_planning"
  | "content_generation"
  | "assessment_revision";

export interface CurriculumApprovalState {
  approved: boolean;
  approvedAt?: string | null;
  notes?: string;
  confidence?: number | null;
}

export interface AcademicCalendarConfig {
  workingDays?: number | null;
  holidayCalendar?: string[];
  examDates?: string[];
  schoolEvents?: string[];
  specialDays?: string[];
  revisionWeeks?: number | null;
  bufferWeeks?: number | null;
}

export interface AcademicConfig {
  academicYear?: string;
  school?: string;
  board?: string;
  medium?: string;
  language?: string;
  subject?: string;
  className?: string;
  section?: string;
  book?: string;
  weeklyPeriods?: number | null;
  periodDurationMinutes?: number | null;
  labPeriods?: number | null;
  calendar?: AcademicCalendarConfig;
}

export interface TermAllocation {
  className?: string;
  termName: string;
  termNumber?: number | null;
  chapters: string[];
  recurringStrands?: string[];
  recurringStrandDetails?: RecurringStrandAllocation[];
  marks: number;
  reasoning?: string;
  estimatedSessions?: number | null;
}

export interface TermPlan {
  approved: boolean;
  recommendedTermCount?: number | null;
  recommendations: TermAllocation[];
  allocations: TermAllocation[];
}

export interface TeachingStrategy {
  teachingStyle?: string[];
  studentLevel?: string;
  pace?: string;
  bloomsTaxonomyEmphasis?: string[];
  assessmentPreference?: string[];
  targetDifficulty?: string;
  teachingResources?: string[];
  specialInstructions?: string;
}

export interface SessionPlanningDefaults {
  sessionDurationMinutes?: number | null;
  language?: string;
  readingLevel?: string;
  responseLength?: string;
  creativity?: string;
  includeRealWorldConnections?: boolean;
  includeDifferentiation?: boolean;
  includeFormativeAssessment?: boolean;
  includeHomework?: boolean;
  includeTeacherNotes?: boolean;
}

export interface ChapterSessionPlan {
  id?: string;
  className?: string;
  termName?: string;
  termNumber?: number | null;
  unitName?: string;
  chapterName: string;
  sessionKind?: "lesson" | "strand_practice";
  sequence?: number | null;
  recommendedSessions?: number | null;
  adjustedSessions?: number | null;
  estimatedSessions: number;
  estimatedMinutes?: number | null;
  rationale?: string;
  reasoning?: string;
  sourceTopicCount?: number | null;
  sourceEstimatedSessions?: number | null;
}

export interface SessionAllocation {
  approved: boolean;
  approvedAt?: string | null;
  selectedTermKey?: string;
  selectedTermSummary?: {
    className?: string;
    termName?: string;
    termNumber?: number | null;
    chapterCount?: number;
    marks?: number;
    totalRows?: number;
    recurringStrands?: string[];
  };
  recommendations: ChapterSessionPlan[];
  allocations: ChapterSessionPlan[];
  validation?: {
    valid: boolean;
    issues: string[];
    annualCapacity?: number | null;
    termCapacity?: number | null;
    allocatedSessions?: number | null;
  };
}

export interface GeneratedArtifact {
  id: string;
  scope: "course" | "term" | "chapter" | "session" | "artifact-only";
  artifactType: string;
  title: string;
  status: "draft" | "generated" | "approved" | "regenerated";
  updatedAt?: string;
}

export interface RevisionAction {
  id: string;
  scope: "course" | "term" | "chapter" | "session" | "artifact-only";
  artifactType?: string;
  notes?: string;
  createdAt?: string;
}

export interface PlanningWorkspace {
  _id: string;
  curriculumId: string;
  schoolId?: string;
  teacherId?: string;
  createdBy?: string;
  classId?: string;
  subjectId?: string;
  phase: PlanningWorkspacePhase;
  status: "draft" | "in_progress" | "approved";
  curriculumSnapshot: {
    subject: string;
    gradeLevel: string;
    overallDescription?: string;
    units?: CurriculumExtraction["units"];
    documentMetadata?: Record<string, unknown>;
    normalizedStructure?: Record<string, unknown>;
  };
  curriculumApproval: CurriculumApprovalState;
  academicConfig: AcademicConfig;
  termPlan: TermPlan;
  teachingStrategy: TeachingStrategy;
  sessionPlanningDefaults?: SessionPlanningDefaults;
  sessionAllocation: SessionAllocation;
  generationScope: Record<string, unknown>;
  generatedArtifacts: GeneratedArtifact[];
  revisionState: {
    history: RevisionAction[];
  };
  createdAt: string;
  updatedAt: string;
}

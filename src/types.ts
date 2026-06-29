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
    description: string;
    topics: string[];
  }[];
  stagedExtraction?: Record<string, unknown>;
  document_metadata?: Record<string, unknown>;
  normalizedStructure?: Record<string, unknown>;
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

export interface TermRow {
  id: string;
  className?: string;
  termNumber?: number;
  term: string; // e.g. "Term 1", "Term 2"
  unitId?: string;
  unitName: string;
  chapters: string[];
  marks: number;
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

export type AssessmentRenderedSubtype =
  | "mcq"
  | "veryShortAnswer"
  | "shortAnswer"
  | "longAnswer"
  | "caseStudy";

export interface SessionPlan {
  id: string;
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
    teachingSequence?: string[];
    guidedPractice?: string[];
    lessonBlocks?: {
      title: string;
      durationMinutes?: number;
      teacherPrompt?: string[];
      explanation?: string[];
      examples?: string[];
      boardWork?: string[];
      checkUnderstanding?: string[];
      expectedAnswers?: string[];
      activity?: string[];
    }[];
    differentiation?: {
      slowLearners?: string[];
      averageLearners?: string[];
      advancedLearners?: string[];
    };
    teacherTips?: string[];
    misconceptions?: string[];
    lessonPurpose?: string[];
    classroomQuestions?: {
      question: string;
      level?: string;
      expectedResponse?: string;
      answerPoints?: string[];
    }[];
    commonMisconceptionsDetailed?: {
      misconception: string;
      correction: string;
    }[];
    assessmentQuestions?: string[];
    blackboardSummary?: string[];
    endOfClassRecap?: {
      prompt: string;
      expectedAnswer?: string;
    }[];
    conceptFlow?: {
      conceptName: string;
      definition?: string;
      coreExplanation?: string;
      importance?: string;
      observedIn?: string[];
      whyStudyIt?: string;
      relationshipWithPrevious?: string;
      relationshipWithFuture?: string;
      keywords?: string[];
      teacherMoves?: string[];
      examples?: string[];
      visuals?: string[];
    }[];
    timePlan?: {
      segment: string;
      minutes: number;
      purpose?: string;
    }[];
    formativeChecks?: string[];
    sessionSummary?: string[];
    nextSessionBridge?: string[];
  };
  studentLessonNotes?: {
    title?: string;
    sessionOverview?: string;
    introduction?: string;
    learningObjectives?: string[];
    quickRecall?: string[];
    easyToRemember?: string[];
    comparisonTables?: {
      title: string;
      headers?: string[];
      rows?: string[][];
    }[];
    sections?: {
      heading: string;
      explanation: string;
      keyPoints?: string[];
      examples?: string[];
      whyItMatters?: string;
      terminology?: string[];
      detailedExplanation?: string;
      observedIn?: string[];
      visualSupport?: string[];
      importantNotes?: string[];
      memoryTechniques?: string[];
      conceptSummary?: string[];
    }[];
    definitions?: { term: string; definition: string }[];
    workedExamples?: {
      title: string;
      steps?: string[];
      explanation?: string;
    }[];
    revisionSection?: {
      definitions?: string[];
      formulas?: string[];
      facts?: string[];
      keywords?: string[];
      conceptMap?: string[];
      quickRecap?: string[];
    };
    selfCheckQuestions?: string[];
    quickSummary?: string[];
    keyTerms?: string[];
    fillInTheBlanks?: {
      prompt: string;
      answer?: string;
    }[];
    mcqQuestions?: {
      question: string;
      options: string[];
      answer?: string;
    }[];
    veryShortAnswerQuestions?: {
      question: string;
      answer?: string;
    }[];
    didYouKnow?: string[];
    summary?: string[];
    quickRevision?: string[];
    rememberPoints?: string[];
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
      templateId?: string;
      templateName?: string;
      themeId?: string;
      title?: string;
      presentationTitle?: string;
      presentationGoal?: string;
      audience?: string;
      theme?: string;
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
      licenseChecklist?: string[];
      presentationWarnings?: string[];
      coverageSummary?: {
        learningOutcomesCovered?: string[];
        topicsCovered?: string[];
        taughtConceptsCovered?: string[];
        omittedContent?: string[];
      };
      slides: {
        templateId?: string;
        templateSlideKey?: string;
        templateSlideTitle?: string;
        isOptionalSlotFilled?: boolean;
        slideTitle?: string;
        bulletPoints?: string[];
        slideNumber?: number;
        slideType?: string;
        learningOutcomeIds?: string[];
        topicCoverage?: string[];
        teacherIntent?: string;
        studentTakeaway?: string;
        layout?: string;
        onSlideText?: string[];
        speakerNotes?: string[];
        visualPlan?: string;
        assets?: {
          purpose?: string;
          searchQuery?: string;
          sourceSite?: string;
          sourceUrl?: string;
          previewUrl?: string;
          licenseType?: string;
          attributionText?: string;
          altText?: string;
          placementHint?: string;
        }[];
        svgDiagram?: {
          title?: string;
          type?: string;
          instructions?: string[];
          svgCode?: string;
        };
        animationHints?: string[];
        timeEstimateMinutes?: number;
      }[];
    };
    pdf: { documentTitle: string; keyInformation: string[] };
    docx: { outlineTitle: string; sections: string[] };
  };
  homework?: {
    task?: string;
    estimatedTimeMinutes?: number;
    sessionInformation?: {
      sessionNumber?: string;
      sessionTitle?: string;
      subject?: string;
      grade?: string;
      difficultyLevel?: string;
      learningPace?: string;
      estimatedHomeworkDuration?: string;
    };
    homework?: {
      id: number;
      type?: string;
      title?: string;
      learningOutcomeIds?: string[];
      topicCoverage?: string[];
      difficulty?: string;
      marks?: number;
      estimatedTime?: string;
      instructions?: string;
      question?: string;
      options?: string[];
      answerSpace?: string;
      visualRequirement?: string;
      expectedResponse?: string;
    }[];
    summary?: {
      totalQuestions?: number;
      totalMarks?: number;
      estimatedCompletionTime?: string;
      learningOutcomesCovered?: string[];
      topicsCovered?: string[];
      subtopicsCovered?: string[];
      taskDistribution?: Record<string, number>;
      homeExperimentIncluded?: boolean;
      parentEngagementIncluded?: boolean;
    };
  };
  assessment?: {
    assessmentMeta?: {
      assessmentType?: string;
      totalMarks?: number;
      totalQuestions?: number;
      durationMinutes?: number;
      preferredDifficulty?: string;
      language?: string;
      paperObjective?: string;
      requestSignature?: string;
      requestedQuestionTypes?: AssessmentQuestionTypeRequest[];
      instructions?: string[];
    };
    blueprint?: {
      learningOutcomeCoverage?: {
        outcome: string;
        questionRefs: string[];
      }[];
      difficultyDistribution?: {
        easy?: number;
        medium?: number;
        hard?: number;
      };
      bloomsDistribution?: {
        recall?: number;
        understanding?: number;
        application?: number;
        analysis?: number;
        evaluation?: number;
        creation?: number;
      };
      questionDistribution?: {
        mcq?: number;
        shortAnswer?: number;
        longAnswer?: number;
      };
      timeAllocation?: {
        section: string;
        minutes: number;
      }[];
    };
    mcq?: {
      id?: string;
      questionSubtype?: "mcq";
      question: string;
      options: string[];
      answer: string;
      explanation?: string;
      marks?: number;
      learningOutcomeIds?: string[];
      topicCoverage?: string[];
      difficulty?: string;
      bloomsLevel?: string;
    }[];
    shortAnswer?: {
      id?: string;
      questionSubtype?: "veryShortAnswer" | "shortAnswer";
      question: string;
      answer: string;
      expectedLength?: string;
      marks?: number;
      rubric?: string[];
      learningOutcomeIds?: string[];
      topicCoverage?: string[];
      difficulty?: string;
      bloomsLevel?: string;
    }[];
    longAnswer?: {
      id?: string;
      questionSubtype?: "longAnswer" | "caseStudy";
      question: string;
      answer: string;
      expectedLength?: string;
      marks?: number;
      rubric?: string[];
      learningOutcomeIds?: string[];
      topicCoverage?: string[];
      difficulty?: string;
      bloomsLevel?: string;
    }[];
    answerKey?: {
      mcq?: { answer: string; explanation?: string; marks?: number; questionSubtype?: "mcq" }[];
      shortAnswer?: { answer: string; rubric?: string[]; marks?: number; questionSubtype?: "veryShortAnswer" | "shortAnswer" }[];
      longAnswer?: { answer: string; rubric?: string[]; marks?: number; questionSubtype?: "longAnswer" | "caseStudy" }[];
      generalMarkingGuidance?: string[];
    };
  };
  assignment?: {
    taskDescription: string;
    rubric: string[];
    answerKey: string;
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

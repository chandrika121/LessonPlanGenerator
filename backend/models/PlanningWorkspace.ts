import mongoose, { Model, Schema } from "mongoose";

const PlanningWorkspaceSchema = new Schema(
  {
    curriculumId: { type: Schema.Types.ObjectId, ref: "Curriculum", required: true, index: true },
    schoolId: { type: String, default: "", index: true },
    teacherId: { type: String, default: "", index: true },
    createdBy: { type: String, default: "" },
    classId: { type: String, default: "", index: true },
    subjectId: { type: String, default: "" },
    // Ownership fields for isolation
    academicYear: { type: String, default: "", index: true },
    sectionId: { type: String, default: "", index: true },
    phase: {
      type: String,
      enum: [
        "curriculum_setup",
        "course_planning",
        "session_planning",
        "content_generation",
        "assessment_revision",
      ],
      default: "curriculum_setup",
    },
    status: {
      type: String,
      enum: ["draft", "in_progress", "approved"],
      default: "draft",
    },
    curriculumSnapshot: { type: Schema.Types.Mixed, default: {} },
    curriculumApproval: {
      type: Schema.Types.Mixed,
      default: {
        approved: false,
        approvedAt: null,
        notes: "",
        confidence: null,
      },
    },
    academicConfig: { type: Schema.Types.Mixed, default: {} },
    termPlan: {
      type: Schema.Types.Mixed,
      default: {
        approved: false,
        recommendedTermCount: null,
        recommendations: [],
        allocations: [],
      },
    },
    teachingStrategy: { type: Schema.Types.Mixed, default: {} },
    sessionPlanningDefaults: { type: Schema.Types.Mixed, default: {} },
    sessionAllocation: {
      type: Schema.Types.Mixed,
      default: {
        approved: false,
        approvedAt: null,
        selectedTermKey: "",
        selectedTermSummary: null,
        recommendations: [],
        allocations: [],
        validation: {
          valid: false,
          issues: [],
          annualCapacity: null,
          termCapacity: null,
          allocatedSessions: null,
        },
      },
    },
    generationScope: { type: Schema.Types.Mixed, default: {} },
    generatedArtifacts: { type: [Schema.Types.Mixed], default: [] },
    revisionState: {
      type: Schema.Types.Mixed,
      default: {
        history: [],
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PlanningWorkspaceSchema.index({ curriculumId: 1, updatedAt: -1 });

// Composite index for teacher isolation
PlanningWorkspaceSchema.index(
  { schoolId: 1, teacherId: 1, academicYear: 1, classId: 1, sectionId: 1, subjectId: 1 },
  { name: "workspace_teacher_isolation" }
);

export const PlanningWorkspaceModel: Model<any> =
  mongoose.models.PlanningWorkspace || mongoose.model("PlanningWorkspace", PlanningWorkspaceSchema);
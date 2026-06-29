import mongoose, { Model, Schema } from "mongoose";

const PlanningWorkspaceSchema = new Schema(
  {
    curriculumId: { type: Schema.Types.ObjectId, ref: "Curriculum", required: true, index: true },
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

export const PlanningWorkspaceModel: Model<any> =
  mongoose.models.PlanningWorkspace || mongoose.model("PlanningWorkspace", PlanningWorkspaceSchema);

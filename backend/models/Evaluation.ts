import mongoose, { Model, Schema } from "mongoose";

const EvaluationSchema = new Schema(
  {
    title: { type: String, default: "" },
    schoolId: { type: String, default: "", index: true },
    teacherId: { type: String, default: "", index: true },
    classId: { type: String, default: "", index: true },
    subjectId: { type: String, default: "" },
    evaluationMode: { type: String, default: "" },
    status: { type: String, enum: ["draft", "completed", "saved"], default: "completed", index: true },
    totalMarks: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    // Ownership fields for isolation
    academicYear: { type: String, default: "", index: true },
    sectionId: { type: String, default: "", index: true },
    curriculumId: { type: String, default: "", index: true },
    termId: { type: String, default: "", index: true },
    sessionId: { type: String, default: "", index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Composite index for teacher isolation
EvaluationSchema.index(
  { schoolId: 1, teacherId: 1, classId: 1, subjectId: 1, academicYear: 1 },
  { name: "evaluation_teacher_isolation" }
);

export const EvaluationModel: Model<any> =
  mongoose.models.Evaluation || mongoose.model("Evaluation", EvaluationSchema);
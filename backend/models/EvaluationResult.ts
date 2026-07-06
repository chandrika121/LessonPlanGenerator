import mongoose, { Model, Schema } from "mongoose";

const EvaluationResultSchema = new Schema(
  {
    evaluationId: { type: Schema.Types.ObjectId, ref: "Evaluation", default: null, index: true },
    schoolId: { type: String, default: "", index: true },
    teacherId: { type: String, default: "", index: true },
    studentId: { type: String, default: "", index: true },
    classId: { type: String, default: "", index: true },
    subjectId: { type: String, default: "" },
    totalMarks: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: "" },
    status: { type: String, default: "saved" },
    viewedAt: { type: Date, default: null },
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
EvaluationResultSchema.index(
  { schoolId: 1, teacherId: 1, classId: 1, subjectId: 1, academicYear: 1 },
  { name: "evaluation_result_teacher_isolation" }
);

// Composite index for student queries
EvaluationResultSchema.index(
  { schoolId: 1, studentId: 1, classId: 1 },
  { name: "evaluation_result_student_lookup" }
);

export const EvaluationResultModel: Model<any> =
  mongoose.models.EvaluationResult || mongoose.model("EvaluationResult", EvaluationResultSchema);
import mongoose, { Model, Schema } from "mongoose";

const CurriculumSchema = new Schema(
  {
    fileName: { type: String, default: "" },
    subject: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    schoolId: { type: String, default: "", index: true },
    teacherId: { type: String, default: "", index: true },
    createdBy: { type: String, default: "" },
    sourceText: { type: String, required: true },
    extractedCurriculum: { type: Schema.Types.Mixed, required: true },
    extractionMetadata: { type: Schema.Types.Mixed, default: {} },
    // Ownership fields for isolation
    academicYear: { type: String, default: "", index: true },
    classId: { type: String, default: "", index: true },
    sectionId: { type: String, default: "", index: true },
    subjectId: { type: String, default: "", index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Composite index for teacher isolation queries
CurriculumSchema.index(
  { schoolId: 1, teacherId: 1, academicYear: 1, classId: 1, sectionId: 1, subjectId: 1 },
  { name: "curriculum_teacher_isolation" }
);

// Composite index for student/principal queries
CurriculumSchema.index(
  { schoolId: 1, academicYear: 1, classId: 1, sectionId: 1, subjectId: 1 },
  { name: "curriculum_student_access" }
);

export const CurriculumModel: Model<any> =
  mongoose.models.Curriculum || mongoose.model("Curriculum", CurriculumSchema);
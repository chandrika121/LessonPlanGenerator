import mongoose, { Model, Schema } from "mongoose";

const TeacherClassAllocationSchema = new Schema(
  {
    schoolId: { type: String, default: "", index: true },
    teacherId: { type: String, required: true, index: true },
    classId: { type: String, required: true, index: true },
    className: { type: String, default: "" },
    section: { type: String, default: "" },
    subjectIds: { type: [String], default: [] },
    subjects: { type: [String], default: [] },
    academicYear: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

TeacherClassAllocationSchema.index({ schoolId: 1, teacherId: 1, classId: 1, section: 1, academicYear: 1 }, { unique: true });

export const TeacherClassAllocationModel: Model<any> =
  mongoose.models.TeacherClassAllocation || mongoose.model("TeacherClassAllocation", TeacherClassAllocationSchema);

import mongoose, { Model, Schema } from "mongoose";

const ClassSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    schoolId: { type: String, default: "", index: true },
    section: { type: String, default: "" },
    gradeLevel: { type: String, default: "" },
    subjectIds: { type: [String], default: [] },
    teacherIds: { type: [String], default: [] },
    studentCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ClassModel: Model<any> =
  mongoose.models.Class || mongoose.model("Class", ClassSchema);

import mongoose, { Model, Schema } from "mongoose";

const ActivityLogSchema = new Schema(
  {
    schoolId: { type: String, default: "", index: true },
    userId: { type: String, default: "", index: true },
    role: { type: String, default: "", index: true },
    teacherId: { type: String, default: "", index: true },
    studentId: { type: String, default: "", index: true },
    classId: { type: String, default: "", index: true },
    subjectId: { type: String, default: "", index: true },
    academicYear: { type: String, default: "" },
    actionType: { type: String, default: "", index: true },
    actionLabel: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ActivityLogModel: Model<any> =
  mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);

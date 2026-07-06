import mongoose, { Model, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, default: "" },
    role: { type: String, enum: ["teacher", "student", "principal"], required: true, index: true },
    schoolId: { type: String, default: "", index: true },
    phone: { type: String, default: "" },
    classId: { type: String, default: "", index: true },
    section: { type: String, default: "" },
    stream: { type: String, default: "" },
    subjectIds: { type: [String], default: [] },
    subjects: { type: [String], default: [] },
    assignedClasses: { type: [String], default: [] },
    assignedSections: { type: [String], default: [] },
    address: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },
    designation: { type: String, default: "" },
    employeeId: { type: String, default: "" },
    rollNo: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserModel: Model<any> =
  mongoose.models.User || mongoose.model("User", UserSchema);

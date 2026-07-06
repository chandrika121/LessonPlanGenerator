import mongoose, { Schema } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    schoolId: { type: String, default: "", index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    author: { type: String, default: "Principal" },
    audience: { type: String, default: "all", enum: ["all", "teachers", "students"] },
    createdBy: { type: String, default: "" },
    status: { type: String, default: "active", enum: ["active", "archived"] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AnnouncementSchema.index({ schoolId: 1, createdAt: -1 });
AnnouncementSchema.index({ schoolId: 1, audience: 1, status: 1 });

export const AnnouncementModel =
  mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
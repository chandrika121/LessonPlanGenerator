import mongoose, { Model, Schema } from "mongoose";

const CurriculumSchema = new Schema(
  {
    fileName: { type: String, default: "" },
    subject: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    sourceText: { type: String, required: true },
    extractedCurriculum: { type: Schema.Types.Mixed, required: true },
    extractionMetadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const CurriculumModel: Model<any> =
  mongoose.models.Curriculum || mongoose.model("Curriculum", CurriculumSchema);

import mongoose, { Model, Schema } from "mongoose";

const VisualGenerationBatchSchema = new Schema({
  batchId: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ["pending", "generating", "validating", "completed", "failed"],
    required: true 
  },
  analyses: [{
    slideId: String,
    slideTitle: String,
    subject: String,
    gradeLevel: Number,
    topic: String,
    subtopic: String,
    imageNeed: { 
      type: String, 
      enum: [
        "scientific_diagram",
        "math_graph", 
        "geometry_diagram",
        "flowchart",
        "map",
        "real_photo",
        "concept_illustration",
        "formula_visual",
        "experiment_setup",
        "comparison_table",
        "none"
      ] 
    },
    confidence: Number,
    suggestedGenerator: String,
    description: String,
    mustInclude: [String],
    avoid: [String],
  }],
  assets: [{
    assetId: String,
    slideId: String,
    visualType: String,
    generator: String,
    imageUrl: String,
    license: String,
    attribution: String,
    altText: String,
    validated: Boolean,
    validationScore: Number,
    mimeType: String,
    width: Number,
    height: Number,
  }],
  failures: [{
    slideId: String,
    reason: String,
    fallbackUsed: Boolean,
  }],
}, {
  timestamps: true,
  versionKey: false,
});

export const VisualGenerationBatchModel: Model<any> =
  mongoose.models.VisualGenerationBatch || mongoose.model("VisualGenerationBatch", VisualGenerationBatchSchema);
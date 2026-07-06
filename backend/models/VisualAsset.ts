import mongoose, { Model, Schema } from "mongoose";

const VisualAssetSchema = new Schema({
  assetId: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  slideId: { type: String },
  visualType: { 
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
    ], 
    required: true 
  },
  generator: { 
    type: String, 
    enum: ["svg_template", "matplotlib", "geometry_engine", "mermaid", "wikimedia", "ai_image", "latex_svg"],
    required: true 
  },
  imageUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  svgCode: { type: String },
  license: { type: String, required: true },
  attribution: { type: String },
  altText: { type: String, required: true },
  validated: { type: Boolean, default: false },
  validationScore: { type: Number },
  validationNotes: [{ type: String }],
  metadata: { type: Schema.Types.Mixed },
  width: { type: Number },
  height: { type: Number },
  mimeType: { type: String, default: "image/svg+xml" },
}, {
  timestamps: true,
  versionKey: false,
});

export const VisualAssetModel: Model<any> =
  mongoose.models.VisualAsset || mongoose.model("VisualAsset", VisualAssetSchema);
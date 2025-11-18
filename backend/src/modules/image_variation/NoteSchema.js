import mongoose from "mongoose";

// Define base schema first (without recursion)
const noteItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sequence: { type: Number, required: true }, // order of the note
});

// Now add recursive field (after schema creation)
noteItemSchema.add({
  subNotes: [noteItemSchema], // self-reference safely
});

// Export it
export { noteItemSchema };

// Sub-schema for Time Logs
export const timeLogItemSchema = new mongoose.Schema({
  datetime: { type: Date, required: true, default: Date.now },
  text: { type: String, required: true },
  sequence: { type: Number, required: true },
});

// Sub-schema for Checklist items
export const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  checked: { type: Boolean, default: false },
  sequence: { type: Number, required: true },
  reference_asset_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TechPackAsset", // or TechPack depending on your model
  },
});

// Main Notes Schema
export const noteSchema = new mongoose.Schema(
  {
    techpack_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TechPack",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    type: {
      type: String,
      enum: ["general", "sequential", "time_logs", "checklist"],
      required: true,
    },
    name: { type: String, default: "New Note" },
    summary: { type: String },
    items: [
      {
        type: mongoose.Schema.Types.Mixed, // dynamic based on type
      },
    ],
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Main Note model
export const Note = mongoose.model("Note", noteSchema);

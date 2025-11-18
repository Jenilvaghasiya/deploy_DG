import mongoose from "mongoose";


// models/TechPack.js - ADD to existing schema

const bomItemSchema = new mongoose.Schema({
  item: { type: String },

//  item: { type: String, required: true },
  subItem: { type: String },
  ref: { type: String },
  material: { type: String },
  quantity: { type: Number, default: 0 },
  placement: { type: String },
  color: { 
    type: String, // Stores pantone code or color name
    colorName: { type: String }, // e.g., "Midnight Blue"
    freetoneAssetId: { type: mongoose.Schema.Types.ObjectId }, // Reference to freetone suggestion asset
  },
  size: { type: String },
  unit: { type: String },
  weight: { type: String },
  includeCost: { type: Boolean, default: false },
  cost: { type: Number, default: 0 },
  wastageAllowance: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  accreditedSupplier: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  // NEW: Hierarchy support
  parentItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
  level: { type: Number, default: 0 }, // 0 = main item, 1+ = sub-items
  order: { type: Number, default: 0 },
  isBlank: { type: Boolean, default: false }, // For validation tracking
}, { _id: true });

const bomSectionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Fabric", "Trims", "Main Body"
  type: { type: String, enum: ['single', 'multi'], required: true },
  parentSectionId: { type: mongoose.Schema.Types.ObjectId },
  items: [bomItemSchema],
  order: { type: Number, default: 0 },
}, { _id: true });

const bomSchema = new mongoose.Schema({
  structure: { type: String, enum: ['single', 'multi'], default: 'single' },
  viewType: { type: String, enum: ['table', 'notes'], default: 'table' },
  sections: [bomSectionSchema],
  flatItems: [bomItemSchema],
  grandTotal: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  inheritedWastageAllowance: { type: Number, default: 0 },
  inheritedIncludeCost: { type: Boolean, default: true },
  // NEW: Validation metadata
  requiredFields: [String], // e.g., ['item', 'quantity', 'material']
  validateOnSave: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });


const techPackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    task_id: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["queued", "completed", "failed"],
      default: "queued",
    },
    analysis: {
      type: Object, // full analysis JSON
    },

    tech_pack: {
      type: Object,
    },
    

    gallery_image_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GalleryImage",
      },
    ],
    generation_source: {
      type: String,
      enum: ["ai_generated", "manual"],
      default: "ai_generated",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    bom: bomSchema, 

    notes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
      },
    ],

    uploaded_files: [{
    file_url: { type: String, required: true },
    file_name: { type: String, required: true },
    file_type: { type: String, enum: ['image', 'pdf', 'other'], required: true },
    file_size: { type: Number }, // in bytes
    uploaded_at: { type: Date, default: Date.now },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }]

  },

  
  { timestamps: true }
);

export const TechPack = mongoose.model("TechPack", techPackSchema);
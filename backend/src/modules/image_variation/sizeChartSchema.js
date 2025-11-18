import mongoose from "mongoose";

const sizeChartSchema = new mongoose.Schema(
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
      default: "queued",
      enum: ["queued", "completed", "failed"],
    },
    name: {
      type: String,
      trim: true,
      required: false,
    },
    measurements: {
      type: Object, // Keep measurements as a plain JS object
      required: true,
    },
    grading_rules: {
      type : Object,
    },
    tolerance: {
      type : Object
    },
    size_conversion: {
      type: Object
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    results: {
      type: [String],
      default: [],
    },
    generation_source: {
      type: String,
      enum: ["user_created", "ai_generated", "ai_generated_edited","duplicated","duplicated_edited"],
      default: null,
    },
    fileHash: {
      type: [String],
      default: [],
    },
    // ✅ Add this new field to reference GalleryImage
    gallery_image_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GalleryImage",
      required: false, // or true if you always want it linked
      default: null,
    },
    gallery_image_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GalleryImage",
        required: false,
        default: [],
      }
    ],
    market: {
      type: String,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    unit: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Customize JSON output
sizeChartSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret._id && typeof ret._id.toString === "function") {
      ret.id = ret._id.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("SizeChart", sizeChartSchema);

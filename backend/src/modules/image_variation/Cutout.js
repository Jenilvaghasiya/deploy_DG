import mongoose from "mongoose";

const cutoutComponentSchema = new mongoose.Schema(
  {
    absolute_path: { type: String,},
    component: { type: String,  }, // e.g., front_panel, back_panel
    confidence: { type: Number,},
    description: { type: String },
    dimensions: { type: String },
    image: { type: String,  },
    path: { type: String},
  },
  { _id: false }
);

const cutoutsSchema = new mongoose.Schema(
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
    },
    message: {
      type: String,
    },
    components: {
      type: [cutoutComponentSchema],
      default: [],
    },
    // ✅ Make metadata flexible
    metadata: {
      type: Object,
      default: {},
    },
    // ✅ Reference to gallery image(s)
    gallery_image_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GalleryImage",
      default: null,
    },
    gallery_image_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GalleryImage",
        default: [],
      },
    ],
    generation_source: {
      type: String,
      enum: [
        "user_uploaded",
        "ai_generated",
        "ai_generated_edited",
        "duplicated",
        "duplicated_edited",
      ],
      default: null,
    },
    fileHash: {
      type: [String],
      default: [],
    },
    market: {
      type: String,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// ✅ Clean JSON output
cutoutsSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret._id && typeof ret._id.toString === "function") {
      ret.id = ret._id.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Cutout = mongoose.models.Cutout || mongoose.model("Cutout", cutoutsSchema);

export { Cutout };  
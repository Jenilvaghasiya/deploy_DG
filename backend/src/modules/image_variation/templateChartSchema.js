import mongoose from "mongoose";

const templateChartSchema = new mongoose.Schema(
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
    sizeChart_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    template_name: {
      type: String,
      required: true,
    },
    measurements: {
      type: Object,
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
    market: {
      type: String,
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
templateChartSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret._id && typeof ret._id.toString === "function") {
      ret.id = ret._id.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("templateChart", templateChartSchema);

import mongoose from "mongoose";

const colorAnalysisSchema = new mongoose.Schema(
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
        task_id: { type: String, required: true, unique: true },
        task_type: { type: String, default: "garment_color_analysis" },
        data: { type: Object, default: {} }, // Store the entire analysis object here
        success: { type: Boolean, default: true },
        gallery_image_ids: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "GalleryImage",
                default: [],
            },
        ],
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

// ✅ Clean JSON output
colorAnalysisSchema.set("toJSON", {
    transform: (doc, ret) => {
        if (ret._id && typeof ret._id.toString === "function") {
            ret.id = ret._id.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const ColorAnalysis = mongoose.model("ColorAnalysis", colorAnalysisSchema);

export { ColorAnalysis };

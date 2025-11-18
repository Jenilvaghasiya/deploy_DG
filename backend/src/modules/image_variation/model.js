// models/DressTask.js
import mongoose, { Schema } from "mongoose";

const aiTaskSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        task: {
            type: String,
            enum: [
                "image_variation",
                "sketch_to_image",
                "combine_image",
                "size_chart",
                "text_to_image",
                "color_variations",
                "pattern_cutout",
                "color_analysis",
                "tech_packs",
            ],
            required: true,
        },
        task_id: {
            type: String,
            required: true,
            unique: true,
        },
        project_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
        status: {
            type: String,
            default: "queued",
        }, // queued, completed, failed
        createdAt: {
            type: Date,
            default: Date.now,
        },
        result: [String], // URLs of generated images
        hasSeen: {
            type: Boolean,
            default: false,
        },
        in_session: {
            type: Boolean,
            default: true,
        },
        isFree: {
            type: Boolean,
            default: false,
        },
        name: {
            type: String,
            required: false,
        },
        fileHash:{
            type: [String],
            default: [],
        },
        confirmation:{
            type:String,
            enum: [
                "replace",
                "keepCopy"
            ],
            default:null
        },
         // ✅ Add this new field to reference GalleryImage
            gallery_image_ids: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: "GalleryImage",
              required: false, // or true if you always want it linked
              default: null,
            }],
        meta: { type: mongoose.Schema.Types.Mixed }, // 👈 store extra data (unit, market, etc.)
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

aiTaskSchema.set("toJSON", {
    transform: (doc, ret) => {
        if (ret._id && typeof ret._id.toString === "function") {
            ret.id = ret._id.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("AiTask", aiTaskSchema);

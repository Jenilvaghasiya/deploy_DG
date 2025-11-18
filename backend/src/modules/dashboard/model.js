import mongoose, { Schema } from "mongoose";

const usageLogSchema = new Schema(
    {
        module: {
            type: String,
            enum: [
                "ge_variation",
                "text_to_image",
                "combine_image",
                "size_chart",
                "sketch_to_image",
                "color_variations",
                "general", // ✅ For general app logs
                "moodboard",
                "project",
                "pattern_cutout",
                "color_analysis",
                "tech_packs",
                 "outline_generation", 

            ],
            required: false, // TODO: temporary false to avoid the error
        },
        type: {
            type: String,
            enum: [
                "credit_consumed",
                "output_produced",
                "general_log",
                "image_status_updated",
                "image_uploaded",
                "image_deleted",
                "image_downloaded",
                "moodboard_created",
                "moodboard_deleted",
                "moodboard_edited",
                "moodboard_downloaded",
                "project_created",
                "project_edited",
                "project_deleted",
                "project_downloaded",
                "project_linked",
                "image_edited",
                "message_broadcast",
                "user_account_info_updated",
                "user_password_updated",
                "user_email_updated",
                "outline_started",    
                 "outline_completed",  
            ],
            required: true,
        },
        creditsUsed: { type: Number, default: 0 },
        outputCount: { type: Number, default: 0 },
        message: { type: String }, // Optional: free-form log message
        metadata: { type: Schema.Types.Mixed }, // Flexible extra data
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        description: {
            type: String,
            required: false,
            default: "",
        },
        tenant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("UsageLog", usageLogSchema);

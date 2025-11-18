import mongoose, { Schema } from "mongoose";

const strapiUsageLogSchema = new Schema(
    {
        module: {
            type: String,
            enum: [
                "social_post",
                "general", // ✅ For general app logs
            ],
            required: false, // TODO: temporary false to avoid the error
        },
        type: {
            type: String,
            enum: [
                "credit_added",
                "post_approved",
                "post_rejected",
                "post_deleted",
                "review_approved",
                "review_rejected",
                "review_deleted",
                "spam_post_deleted",
                "review_report_deleted",
            ],
            required: true,
        },
        message: { type: String }, // Optional: free-form log message
        metadata: { type: Schema.Types.Mixed }, // Flexible extra data
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("StrapiUsageLog", strapiUsageLogSchema);

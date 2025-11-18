import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
    {
        tenant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: false,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            enum: ["credit_warning", "expiry_warning", "failure_warning", "delete_warning", "announcement","result_generated", "direct_message", "broadcast", "maintenance", "payment_failure"],
            required: true,
        },
        meta: { type: mongoose.Schema.Types.Mixed }, // 👈 store extra data (senderId, etc.)
        startDate: {
            type: Date,
            required: false,
        },
        endDate: {
            type: Date,
            required: false,
        },
        isSent: {  // flag to track if notification was sent
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

NotificationSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("Notification", NotificationSchema);
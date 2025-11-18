import mongoose, { Schema } from "mongoose";

const activityLogSchema = new Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        loginTime: {
            type: Date,
        },
        logoutTime: {
            type: Date,
        },
        request: {
            type: String,
        },
        requestEnd: {
            type: Date,
        },
        executionTime: {
            type: String,
        },
        service: {
            type: String,
        },
        contentGenerate: {
            type: Number,
        },
        contentUsed: {
            type: Number,
        },
        discarded: {
            type: Number,
        },
        creditConsumed: {
            type: Number,
        },
    },
    {
        timestamps: true,
    },
);

// Optional index if needed for unique constraint — you can customize or remove it
// activityLogSchema.index({ tenantId: 1, userId: 1, date: 1 });

activityLogSchema.set("toJSON", {
    transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("ActivityLog", activityLogSchema);

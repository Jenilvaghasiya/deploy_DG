import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null, // null for broadcast
        },
        tenant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["broadcast", "dm"],
            required: true,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
        is_read: { type: Boolean, default: false },
        is_edited: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

messageSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("Message", messageSchema);

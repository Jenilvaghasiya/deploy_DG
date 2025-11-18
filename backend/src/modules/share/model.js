// models/Share.js
import mongoose, { Schema } from "mongoose";

const shareSchema = new Schema(
    {
        resource_type: {
            type: String,
            required: true,
            enum: ["Project", "Moodboard", "SizeChart", "GalleryImage"],
            index: true,
        },
        resource_id: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        // Who owns the resource (for tracking)
        owner_tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        // Who is sharing
        shared_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Share with specific user
        shared_with_user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            sparse: true, // Allow null but maintain uniqueness when set
        },
        // OR share with role
        shared_with_role: {
            type: Schema.Types.ObjectId,
            ref: "Role",
            sparse: true,
        },
        // OR share with entire tenant
        shared_with_tenant: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            sparse: true,
        },
        permissions: {
            read: { type: Boolean, default: true },
            edit: { type: Boolean, default: false },
            share: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
        },
        expires_at: {
            type: Date,
            default: null, // Optional expiry
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        notes: String, // Optional sharing notes/message
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

// Compound indexes for efficient queries
shareSchema.index({ resource_type: 1, resource_id: 1 });
shareSchema.index({ shared_with_user: 1, is_active: 1 });
shareSchema.index({ shared_with_role: 1, is_active: 1 });
shareSchema.index({ shared_with_tenant: 1, is_active: 1 });
shareSchema.index({ expires_at: 1 }, { sparse: true });

shareSchema.index(
    {
        resource_type: 1,
        resource_id: 1,
        shared_with_user: 1,
        shared_with_role: 1,
        shared_with_tenant: 1,
    },
    { unique: true, sparse: true }
);

const Share = mongoose.model("Share", shareSchema);
export { Share };  

import mongoose, { Schema } from "mongoose";

const tenantRoleSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        permissions: [
            {
                type: Schema.Types.ObjectId,
                ref: "TenantPermission",
            },
        ],
        is_active: {
            type: Boolean,
            default: true,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
        created_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        updated_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

tenantRoleSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("TenantRole", tenantRoleSchema);

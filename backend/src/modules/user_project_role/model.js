import mongoose, { Schema } from "mongoose";

const userProjectRoleSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        project_id: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        role_ids: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "TenantRole",
                required: true,
            },
        ],
        is_default: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        lock_roles: {
            type: Boolean,
            default: false,
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

// Compound index to ensure a user can only have one role per project in a tenant
userProjectRoleSchema.index(
    { user_id: 1, project_id: 1, tenant_id: 1 },
    { unique: true },
);

userProjectRoleSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("UserProjectRole", userProjectRoleSchema);

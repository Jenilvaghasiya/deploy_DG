import mongoose, { Schema } from "mongoose";

const invitationSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        department_id: {
            type: Schema.Types.ObjectId,
            ref: "Department",
        },
        role_id: {
            type: Schema.Types.ObjectId,
            ref: "Role",
            required: true,
        },
        invite_token: {
            type: String,
            required: true,
            unique: true,
        },
        is_accepted: {
            type: Boolean,
            default: false,
        },
        is_declined: {
            type: Boolean,
            default: false,
        },
        expires_at: {
            type: Date,
            required: true,
        },
        accepted_at: Date,
        project_assignments: [
            {
                project_id: {
                    type: Schema.Types.ObjectId,
                    ref: "Project",
                    required: true,
                },
                role_ids: [
                    {
                        type: Schema.Types.ObjectId,
                        ref: "TenantRole",
                        required: true,
                    },
                ],
                disabled: {
                    type: Boolean,
                    default: true,
                },
                is_default: {
                    type: Boolean,
                    default: false,
                },
                lock_roles: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

invitationSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.invite_token;
        delete ret.__v;

        if (ret.role_id && typeof ret.role_id === "object") {
            ret.role = ret.role_id;
            delete ret.role_id;
        }
        if (ret.tenant_id && typeof ret.tenant_id === "object") {
            ret.tenant = ret.tenant_id;
            delete ret.tenant_id;
        }
        if (ret.department_id && typeof ret.department_id === "object") {
            ret.department = ret.department_id;
            delete ret.department_id;
        }

        ret.is_expired = false;
        if (ret.expires_at && new Date(ret.expires_at) < new Date()) {
            ret.is_expired = true;
        }

        return ret;
    },
});

export default mongoose.model("Invitation", invitationSchema);

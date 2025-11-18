import mongoose, { Schema } from "mongoose";

const tenantPermissionSchema = new Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        is_deleted: {
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

tenantPermissionSchema.index({ key: 1 }, { unique: true });

tenantPermissionSchema.set("toJSON", {
    transform: (doc, ret) => {
        if (ret._id) {
            ret.id = ret._id.toString();
            delete ret._id;
        }
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("TenantPermission", tenantPermissionSchema);

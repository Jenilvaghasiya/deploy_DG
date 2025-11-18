import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
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
        user_ids: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        parent_id: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
        size_charts: [
            {
                type: Schema.Types.ObjectId,
                ref: "SizeChart",
            },
        ],
        moodboards: [
            {
                type: Schema.Types.ObjectId,
                ref: "Moodboard",
            },
        ],

        // // ✅ Replace 'images' array with relation to GalleryImage model
        // images: [
        //     {
        //         type: Schema.Types.ObjectId,
        //         ref: "GalleryImage",
        //     },
        // ],

        is_active: {
            type: Boolean,
            default: true,
        },
        start_date: { type: Date },
        end_date: { type: Date },
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

projectSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;

        if (ret.tenant_id && typeof ret.tenant_id === "object") {
            ret.tenant = ret.tenant_id;
            delete ret.tenant_id;
        }

        if (ret.user_ids && Array.isArray(ret.user_ids)) {
            ret.users = ret.user_ids;
            delete ret.user_ids;
        }

        if (ret.parent_id && typeof ret.parent_id === "object") {
            ret.parent = ret.parent_id;
            delete ret.parent_id;
        }

        return ret;
    },
});

export default mongoose.model("Project", projectSchema);

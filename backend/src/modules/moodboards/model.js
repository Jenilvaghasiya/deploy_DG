import mongoose, { Schema } from "mongoose";

const moodboardSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        project_ids: [
            {
                type: Schema.Types.ObjectId,
                ref: "Project",
            },
        ],
        tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        comment: {
            type: String,
            default: null,
            trim: true,
        },
        notes: {
            type: String,
            default: null,
            trim: true,
        },
        images: [
            {
                url: {
                    type: String,
                    required: false,
                },
                name: {
                    type: String,
                    required: false,
                },
                description: {
                    type: String,
                    default: null,
                },
                source: {
                    type: String,
                    default: null,
                },
                tags: [{ type: String }],
            },
        ],
        gallery_images: [
            {
                galleryImage: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "GalleryImage",
                    required: true,
                },
                name: {
                    type: String,
                    required: false,
                },
                description: {
                    type: String,
                    default: null,
                },
                source: {
                    type: String,
                    default: null,
                },
                tags: [{ type: String }],
            },
        ],
        is_deleted: {type: Boolean, default: false},

        textData: [
            {
                text: {
                    type: String,
                    required: false,
                },
                source: {
                    type: String,
                    default: null,
                },
                tags: [{ type: String }],
            },
        ],
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

moodboardSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("Moodboard", moodboardSchema);

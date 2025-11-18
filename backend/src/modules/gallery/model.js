import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ["uploaded", "finalized", "saved", "generated"],
            default: "uploaded",
        },
        tenant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        project_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
        task_id:{
            type:String,
            default:null
        },
        task:{
            type: String,
            enum: [
                "image_variation",
                "sketch_to_image",
                "combine_image",
                "size_chart",
                "text_to_image",
                "color_variations"
            ],
            required: false,
        },
        fileHash:{
            type:String,
            default:null
        },
        feedback:{
            type:String,
            enum:["liked", "disliked", "none"],
            required:false,
            default:"none"
        },
        is_deleted:{
            type: Boolean,
            default: false,
        },
        gallery_image_ids: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "GalleryImage",
            required: false,
            default: null,
        }],
        // 👇 ADD THESE THREE FIELDS
        outline_image: {
            type: String,
            default: null,
        },
        outline_mode: {
            type: String,
            enum: ["base", "advanced", "professional"],
            default: null,
        },
        outline_task_id: {
            type: String,
            default: null,
        },
     outline_status: {
        type: String,
        enum: ['idle', 'queued', 'processing', 'completed', 'failed'],
        default: 'idle',
        description: "Current status of outline generation"
    },
    
    outline_error: {
        type: String,
        default: null,
        description: "Error message if outline generation failed"
    },
    
    outline_seen: {
        type: Boolean,
        default: false,
        description: "Whether user has seen the completed outline"
    }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

galleryImageSchema.set("toJSON", {
    transform: (doc, ret) => {
        if (ret._id && typeof ret._id.toString === "function") {
            ret.id = ret._id.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("GalleryImage", galleryImageSchema);
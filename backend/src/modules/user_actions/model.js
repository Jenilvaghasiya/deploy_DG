import mongoose, { Schema } from "mongoose";

const userActionSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["ai", "non-ai", "other"],
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Optional: adds createdAt and updatedAt
    },
);

userActionSchema.set("toJSON", {
    transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("UserAction", userActionSchema);

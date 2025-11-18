import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        loginTime: {
            type: Date,
            required: true,
        },
        logoutTime: {
            type: Date,
        },
        expiresAt: {
            type: Date
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        keepMeLoggedIn: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // Optional: adds createdAt and updatedAt
    },
);

sessionSchema.set("toJSON", {
    transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("Session", sessionSchema);

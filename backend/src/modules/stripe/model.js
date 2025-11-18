import mongoose, { Schema } from "mongoose";

const planSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        credits: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        stripeProductId: {
            type: String,
        },
        stripePriceId: {
            type: String,
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

planSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("Plan", planSchema);

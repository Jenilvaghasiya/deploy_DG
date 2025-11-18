import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        plan: { 
            type: Schema.Types.ObjectId, 
            ref: "Plan", 
            required: true 
        },
        stripeCustomerId: { 
            type: String, 
            required: true 
        },
        stripeSubscriptionId: { 
            type: String 
        },
        status: { 
            type: String, 
            default: "pending",  // active, canceled, incomplete, etc.
            // enum: [
            //     "pending",
            //     "active",
            //     "canceled",
            // ],
        },
        current_period_start: { 
            type: Date 
        },
        current_period_end: { 
            type: Date 
        },
        credits_granted: { type: Boolean, default: false },
cancel_at_period_end: { type: Boolean, default: false },
cancel_at: Date,
canceled_at: Date,
    },
    { timestamps: true },
);

subscriptionSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("Subscription", subscriptionSchema);

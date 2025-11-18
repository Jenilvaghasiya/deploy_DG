import mongoose, { Schema } from "mongoose";

const tenantSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },
        industry_type: {
            type: String,
        },
        subscription_type_id: {
            type: Schema.Types.ObjectId,
            ref: "SubscriptionType",
        },
        subscription_frequency: {
            type: String,
            enum: ["monthly", "yearly"],
            default: "monthly",
        },
        subscription_auto_renew: {
            type: Boolean,
            default: true
        },
        member_since: {
            type: Date,
            default: Date.now,
        },
        subscription_end_date: {
            type: Date,
        },
        is_active: {
            type: Boolean,
            default: true,
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
        tags:{
            type: [String],
            default: [],
        },
        stripeCustomerId: {
            type: String,
            default: null,
        },
        subscriptionId: {
            type: Schema.Types.ObjectId,
            ref: "Subscription",
            default: null,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

tenantSchema.pre("save", function (next) {
  if (Array.isArray(this.tags)) {
    this.tags = this.tags
      .map(tag => tag.trim())     // Trim each tag
      .filter(tag => tag.length); // Remove empty strings
  }
  next();
});


tenantSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.created_by;
        delete ret.updated_by;
        return ret;
    },
});

export default mongoose.model("Tenant", tenantSchema, "tenants");

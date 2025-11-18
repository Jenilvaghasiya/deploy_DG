import mongoose, { Schema } from "mongoose";

const tenantCreditSchema = new Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true, // one pool per tenant
    },
    credits: {
      type: Number,
      default: 50,
    },
    startCredits: {
      type: Number,
      default: 50,
    },
    creditHistory: [{
  credits_added: Number,
  reason: String,
  date: Date,
  balance_after: Number
}],
lastUpdated: Date,
lastUpdateReason: String,
  },
  { timestamps: true }
);

tenantCreditSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("TenantCredits", tenantCreditSchema);

import mongoose, { Schema } from "mongoose";

const paymentHistorySchema = new Schema(
  {
    subscription_id: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    stripeInvoiceId: {
      type: String,
      required: true,
      index: true,
    },
    stripePaymentId: {
      type: String, // Stripe payment intent ID
      required: true,
      index: true,
    },
    status: {
      type: String, // paid, failed, open, draft
      required: true,
    },
    amount_paid: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "inr",
    },
    is_retry: { type: Boolean, default: false },
    amount_due: { type: Number },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

paymentHistorySchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Payment_History", paymentHistorySchema);

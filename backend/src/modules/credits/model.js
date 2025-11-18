import mongoose, { Schema } from "mongoose";

const userCreditSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    // credits: {
    //   type: Number,
    //   default: 50,
    // },
    credits_used: {
      type: Number,
      default: 0,
    },
    sizeChartGenerated: {
      type: Number,
      default: 0,
    },
    sizeChartsSinceLastReview:{
      type:Number,
      default:0
    },
    creditUsedSinceLastReview:{
      type:Number,
      default:0
    },
    creditsConsumedPerModule: {
      ge_variation: { type: Number, default: 0 },
      text_to_image: { type: Number, default: 0 },
      combine_image: { type: Number, default: 0 },
      size_chart: { type: Number, default: 0 },
      sketch_to_image: { type: Number, default: 0 },
    },
    outputsPerModule: {
      ge_variation: { type: Number, default: 0 },
      text_to_image: { type: Number, default: 0 },
      combine_image: { type: Number, default: 0 },
      size_chart: { type: Number, default: 0 },
      sketch_to_image: { type: Number, default: 0 },
    },
    
  },
  {
    timestamps: true,
  }
);

// ✅ Use correct compound unique index
userCreditSchema.index({ user_id: 1, tenant_id: 1 }, { unique: true });

userCreditSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("UserCredits", userCreditSchema);

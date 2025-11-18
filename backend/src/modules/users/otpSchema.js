import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otp: { type: String, required: true },
    type: {
      type: String,
      enum: ["EMAIL_CHANGE", "PASSWORD_CHANGE", "TWO_FACTOR"],
      required: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Otp", otpSchema);

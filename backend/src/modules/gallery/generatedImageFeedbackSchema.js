import mongoose from "mongoose";

const generatedImageFeedbackSchema = new mongoose.Schema(
  {
    image_url: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["liked", "disliked", "none"],
      default: "none",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

generatedImageFeedbackSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret._id && typeof ret._id.toString === "function") {
      ret.id = ret._id.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("GeneratedImageFeedback", generatedImageFeedbackSchema);

import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
);

export const reportSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        'i_just_dont_like_it',
        'bullying_or_unwanted_contact',
        'suicide_self_injury_or_eating_disorders',
        'violence_hate_or_harmful_organizations',
        'nudity_or_sexual_content',
        'hate_speech_or_symbols',
        'sale_or_promotion_of_illegal_or_regulated_goods',
        'scams_or_fraud',
        'intellectual_property_violation',
        'false_information',
        'other',
      ],
      required: true,
    },
    text: {
      type: String,
      required: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
);

const socialPostSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        tenant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
       likes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      dislikes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      comments: [commentSchema],
      reports: [reportSchema],
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

export default mongoose.model("SocialPost", socialPostSchema);

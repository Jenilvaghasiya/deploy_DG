import mongoose, { Schema } from "mongoose";

const NsfwSettingsSchema = new Schema(
    {
        pornThreshold: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
            default: 0.10
        },
        hentaiThreshold: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
            default: 0.10
        },
        sexyThreshold: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
            default: 0.45
        },
        combinedThreshold: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
            default: 0.40
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

NsfwSettingsSchema.statics.getSingleton = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const NsfwSettings = mongoose.model('Nsfw_Settings', NsfwSettingsSchema);

export default  NsfwSettings;  

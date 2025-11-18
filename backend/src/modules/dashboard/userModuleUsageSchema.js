
import mongoose from 'mongoose';

const MODULE_TYPES = [
  "image_variation",
  "text_to_image",
  "combine_image",
  "size_chart",
  "sketch_to_image",
  "color_variations",
  "pattern_cutout",
  "color_analysis",
  "tech_packs"
];


const userModuleUsageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  module: {
    type: String,
    enum: MODULE_TYPES,
    required: true
  },
  socket_ids: {
    type: [String], // to track multiple connections
    default: []
  },
  total_time: {
    type: Number, // in milliseconds
    default: 0,
    min: 0
  },
  sessions: [{
    connect_time: {
      type: Date,
      required: true
    },
    disconnect_time: {
      type: Date,
      default: null
    },
 socket_id : {
      type: String,
      default: null
    },
    duration: {
      type: Number,
      default: 0
    }
  }],
  last_activity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to enforce one record per user, module, and date
userModuleUsageSchema.index(
  { user_id: 1, module: 1, date: 1 },
  { unique: true }
);

// Secondary index to optimize recent queries per user/module
userModuleUsageSchema.index(
  { user_id: 1, module: 1, date: -1 }
);

const UserModuleUsage = mongoose.model("UserModuleUsage", userModuleUsageSchema);
export { UserModuleUsage };

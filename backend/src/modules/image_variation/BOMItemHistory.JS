// models/BOMItemHistory.js - NEW FILE

import mongoose from "mongoose";

const bomItemHistorySchema = new mongoose.Schema(
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
    fieldType: {
      type: String,
      enum: ['item', 'subItem', 'material', 'unit'],
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    usageCount: {
      type: Number,
      default: 1,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for efficient querying
bomItemHistorySchema.index({ user_id: 1, tenant_id: 1, fieldType: 1, value: 1 }, { unique: true });
bomItemHistorySchema.index({ user_id: 1, fieldType: 1, usageCount: -1 });

export const BOMItemHistory = mongoose.model("BOMItemHistory", bomItemHistorySchema);
import mongoose from "mongoose";

// Define the TreeNode schema
const treeNodeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ['image', 'sizechart'], required: true },
  name: { type: String, required: true },
  parentId: { type: String, default: null },
  assetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  rootId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure only one root node per assetId
treeNodeSchema.index(
  { assetId: 1, parentId: 1 },
  {
    unique: true,
    partialFilterExpression: { parentId: null }
  }
);

// Create model from schema
export const TreeNode = mongoose.model("TreeNode", treeNodeSchema);

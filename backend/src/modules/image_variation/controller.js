import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { handleImageVariationFailure } from "./service.js";
import { sendResponse } from "../../utils/responseHandler.js";
import axios from "axios";
import FormData from "form-data";
import AiTask from "./model.js";
import Project from "../../modules/projects/model.js"
import sizeChartSchema from "./sizeChartSchema.js";
import GalleryImage from "../gallery/model.js";
import path from "path";
import fs from "fs";
import fspromise from "fs/promises";
import * as galleryService from "../gallery/service.js";
import sharp from "sharp";
import User from "../users/model.js";
import crypto from "crypto";
import UserCredits from '../credits/model.js'
import UsageLog from '../dashboard/model.js'
import { generateFileHash } from "../../utils/otherUtils.js";
import { sendFeedbackReceivedEmail } from "../../utils/mail.js";
import { sendNotification } from "../../utils/notificationUtils.js";
import { MODULE_NAME } from "../../utils/constant.js";
import mongoose from "mongoose";
import { TreeNode } from "../gallery/treemodel.js";
import templateChartSchema from "./templateChartSchema.js";
import { getImageStream } from "../../utils/getImageStream.js";
import { deductCredits } from "../../utils/creditUtils.js";
import ResourceAccessService from "../share/ResourceAccessService.js";
import { Cutout } from "./cutout.js";
import { ColorAnalysis } from "./ColorAnalysis.js";
import { TechPack } from "./TechPackSchema.js";
import { Note } from "./NoteSchema.js";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

const STRAPI_BASE_URL = process.env.STRAPI_URL;
const STRAPI_UPLOAD_URL = `${STRAPI_BASE_URL}/api/upload`;
const STRAPI_DG_POST_URL = `${STRAPI_BASE_URL}/api/dg-posts`;
const TASK_TYPE = {
  PATTERN_CUTOUT: 'pattern_cutout',
  COLOR_ANALYSIS: 'color_analysis',
  TECH_PACK: 'tech_packs'
}


// controllers/imageVariation.controller.js - ADD THESE FUNCTIONS

import { BOMItemHistory } from "./BOMItemHistory.js";
import {
  generateFileUrl,
  getFileCategory,
  deleteFileFromStorage,
  getFileMetadata
} from "./techPackFileMiddleware.js";

// Upload single file to tech pack
export const uploadTechPackFile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return sendResponse(res, {
        statusCode: 400,
        message: "No file uploaded",
      });
    }

    // Find tech pack
    const techPack = await TechPack.findOne({
      _id: id,
      user_id: req.user.id,
      is_deleted: false,
    });

    if (!techPack) {
      // Delete uploaded file since tech pack not found
      await deleteFileFromStorage(req.file.path);

      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack not found",
      });
    }

    // Generate file URL
    const fileUrl = generateFileUrl(req.file.path, process.env.BASE_URL);

    // Get file category
    const fileCategory = getFileCategory(req.file.mimetype);

    // Prepare file data
    const fileData = {
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_type: fileCategory,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      file_path: req.file.path, // Store path for deletion later
      uploaded_by: req.user.id,
      uploaded_at: new Date(),
      metadata: getFileMetadata(req.file),
    };

    // Initialize uploaded_files array if it doesn't exist
    if (!techPack.uploaded_files) {
      techPack.uploaded_files = [];
    }

    // Add file to tech pack
    techPack.uploaded_files.push(fileData);
    await techPack.save();

    // Log activity
    console.log(`[TechPack] File uploaded: ${req.file.originalname} to Tech Pack: ${id}`);

    sendResponse(res, {
      statusCode: 200,
      message: "File uploaded successfully",
      data: {
        file: {
          _id: techPack.uploaded_files[techPack.uploaded_files.length - 1]._id,
          file_url: fileData.file_url,
          file_name: fileData.file_name,
          file_type: fileData.file_type,
          file_size: fileData.file_size,
          uploaded_at: fileData.uploaded_at,
        },
        tech_pack_id: techPack._id,
      },
    });
  } catch (err) {
    console.error("[TechPack] Error uploading file:", err);

    // Clean up uploaded file if database save fails
    if (req.file && req.file.path) {
      await deleteFileFromStorage(req.file.path);
    }

    sendResponse(res, {
      statusCode: 500,
      message: err.message || "Failed to upload file",
    });
  }
});

// Upload multiple files to tech pack
export const uploadMultipleTechPackFiles = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return sendResponse(res, {
        statusCode: 400,
        message: "No files uploaded",
      });
    }

    // Find tech pack
    const techPack = await TechPack.findOne({
      _id: id,
      user_id: req.user.id,
      is_deleted: false,
    });

    if (!techPack) {
      // Delete uploaded files since tech pack not found
      for (const file of req.files) {
        await deleteFileFromStorage(file.path);
      }

      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack not found",
      });
    }

    // Initialize uploaded_files array if it doesn't exist
    if (!techPack.uploaded_files) {
      techPack.uploaded_files = [];
    }

    // Process each file
    const uploadedFiles = [];
    for (const file of req.files) {
      const fileUrl = generateFileUrl(file.path, process.env.BASE_URL);
      const fileCategory = getFileCategory(file.mimetype);

      const fileData = {
        file_url: fileUrl,
        file_name: file.originalname,
        file_type: fileCategory,
        file_size: file.size,
        mime_type: file.mimetype,
        file_path: file.path,
        uploaded_by: req.user.id,
        uploaded_at: new Date(),
        metadata: getFileMetadata(file),
      };

      techPack.uploaded_files.push(fileData);
      uploadedFiles.push(fileData);
    }

    await techPack.save();

    console.log(`[TechPack] ${req.files.length} files uploaded to Tech Pack: ${id}`);

    sendResponse(res, {
      statusCode: 200,
      message: `${req.files.length} files uploaded successfully`,
      data: {
        files: uploadedFiles.map(file => ({
          file_url: file.file_url,
          file_name: file.file_name,
          file_type: file.file_type,
          file_size: file.file_size,
          uploaded_at: file.uploaded_at,
        })),
        tech_pack_id: techPack._id,
        total_files: techPack.uploaded_files.length,
      },
    });
  } catch (err) {
    console.error("[TechPack] Error uploading multiple files:", err);

    // Clean up uploaded files if database save fails
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await deleteFileFromStorage(file.path);
      }
    }

    sendResponse(res, {
      statusCode: 500,
      message: err.message || "Failed to upload files",
    });
  }
});

// Delete file from tech pack
export const deleteTechPackFile = asyncHandler(async (req, res) => {
  try {
    const { id, fileId } = req.params;

    // Find tech pack
    const techPack = await TechPack.findOne({
      _id: id,
      user_id: req.user.id,
      is_deleted: false,
    });

    if (!techPack) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack not found",
      });
    }

    // Find file index
    const fileIndex = techPack.uploaded_files.findIndex(
      file => file._id.toString() === fileId
    );

    if (fileIndex === -1) {
      return sendResponse(res, {
        statusCode: 404,
        message: "File not found",
      });
    }

    // Get file data before deletion
    const fileToDelete = techPack.uploaded_files[fileIndex];

    // Delete from storage
    const deleted = await deleteFileFromStorage(
      fileToDelete.file_path || fileToDelete.file_url
    );

    if (!deleted) {
      console.warn(`[TechPack] File not found in storage: ${fileToDelete.file_url}`);
    }

    // Remove from database
    techPack.uploaded_files.splice(fileIndex, 1);
    await techPack.save();

    console.log(`[TechPack] File deleted: ${fileToDelete.file_name} from Tech Pack: ${id}`);

    sendResponse(res, {
      statusCode: 200,
      message: "File deleted successfully",
      data: {
        deleted_file: fileToDelete.file_name,
        remaining_files: techPack.uploaded_files.length,
      },
    });
  } catch (err) {
    console.error("[TechPack] Error deleting file:", err);
    sendResponse(res, {
      statusCode: 500,
      message: err.message || "Failed to delete file",
    });
  }
});

// Get all files of a tech pack
export const getTechPackFiles = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { file_type } = req.query; // Optional filter by file type

    const techPack = await TechPack.findOne({
      _id: id,
      user_id: req.user.id,
      is_deleted: false,
    }).select('uploaded_files');

    if (!techPack) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack not found",
      });
    }

    let files = techPack.uploaded_files || [];

    // Filter by file type if specified
    if (file_type) {
      files = files.filter(file => file.file_type === file_type);
    }

    // Group files by type
    const groupedFiles = files.reduce((acc, file) => {
      if (!acc[file.file_type]) {
        acc[file.file_type] = [];
      }
      acc[file.file_type].push({
        _id: file._id,
        file_url: file.file_url,
        file_name: file.file_name,
        file_size: file.file_size,
        uploaded_at: file.uploaded_at,
        uploaded_by: file.uploaded_by,
      });
      return acc;
    }, {});

    sendResponse(res, {
      statusCode: 200,
      message: "Files retrieved successfully",
      data: {
        total_files: files.length,
        files: files,
        grouped_files: groupedFiles,
      },
    });
  } catch (err) {
    console.error("[TechPack] Error getting files:", err);
    sendResponse(res, {
      statusCode: 500,
      message: err.message || "Failed to retrieve files",
    });
  }
});

// // Delete file
// export const deleteTechPackFile = asyncHandler(async (req, res) => {
//   try {
//     const { id, fileId } = req.params;

//     const techPack = await TechPack.findOne({
//       _id: id,
//       user_id: req.user.id,
//       is_deleted: false,
//     });

//     if (!techPack) {
//       return sendResponse(res, {
//         statusCode: 404,
//         message: "Tech Pack not found",
//       });
//     }

//     techPack.uploaded_files = techPack.uploaded_files.filter(
//       file => file._id.toString() !== fileId
//     );

//     await techPack.save();

//     sendResponse(res, {
//       statusCode: 200,
//       message: "File deleted successfully",
//     });
//   } catch (err) {
//     console.error("Error deleting file:", err);
//     sendResponse(res, {
//       statusCode: 500,
//       message: "Failed to delete file",
//     });
//   }
// });

/**
 * Validate BOM items for blank/incomplete fields
 * Returns array of items with blank fields
 */
const validateBOMItems = (items, requiredFields = ['item', 'quantity']) => {
  const blankItems = [];

  items.forEach((item, index) => {
    const blankFields = [];

    requiredFields.forEach(field => {
      const value = item[field];

      // Check if field is empty/null/undefined/0
      if (value === null || value === undefined || value === '' ||
        (field === 'quantity' && value === 0)) {
        blankFields.push(field);
        item.isBlank = true;
      }
    });

    if (blankFields.length > 0) {
      blankItems.push({
        index,
        id: item.id,
        blankFields,
        item: item.item || 'N/A'
      });
    }
  });

  return blankItems;
};

/**
 * Handle sub-item inheritance
 * Sub-items inherit wastageAllowance and includeCost from parent
 */
const applyItemInheritance = (items, inheritedWastageAllowance, inheritedIncludeCost) => {
  return items.map(item => {
    // If this is a sub-item and values not explicitly set, inherit from parent or global
    if (item.level > 0) {
      // If parentItemId exists, find parent and inherit
      if (item.parentItemId) {
        const parent = items.find(i => i._id?.toString() === item.parentItemId?.toString());
        if (parent) {
          if (item.wastageAllowance === undefined || item.wastageAllowance === null) {
            item.wastageAllowance = parent.wastageAllowance ?? inheritedWastageAllowance;
          }
          if (item.includeCost === undefined) {
            item.includeCost = parent.includeCost ?? inheritedIncludeCost;
          }
        }
      } else {
        // Use global inherited values
        if (item.wastageAllowance === undefined) item.wastageAllowance = inheritedWastageAllowance;
        if (item.includeCost === undefined) item.includeCost = inheritedIncludeCost;
      }
    }

    // Calculate total cost with inheritance applied
    item.totalCost = calculateItemTotalCost(item);
    return item;
  });
};

/**
 * Get all available BOM field values from history
 * Used to provide default suggestions
 */
const getAllBOMFieldSuggestions = async (userId, tenantId) => {
  try {
    const suggestions = {
      item: [],
      subItem: [],
      material: [],
      unit: [],
    };

    for (const fieldType of Object.keys(suggestions)) {
      const items = await BOMItemHistory.find({
        user_id: userId,
        tenant_id: tenantId,
        fieldType,
      })
        .sort({ usageCount: -1, lastUsed: -1 })
        .limit(50)
        .select('value')
        .lean();

      suggestions[fieldType] = items.map(i => i.value);
    }

    return suggestions;
  } catch (error) {
    console.error("Error fetching all BOM suggestions:", error);
    return { item: [], subItem: [], material: [], unit: [] };
  }
};

/**
 * Get user's freetone palettes for color selection
 */
const getUserFreetones = async (userId, tenantId) => {
  try {
    // Query TechPack collection for freetone suggestion assets
    // Adjust based on your actual schema structure
    const freetones = await TechPack.find({
      user_id: userId,
      tenant_id: tenantId,
      'tech_pack.type': 'pantone_suggestions', // Adjust as per your structure
      is_deleted: false,
    })
      .select('_id tech_pack')
      .limit(100)
      .lean();

    return freetones;
  } catch (error) {
    console.error("Error fetching freetone palettes:", error);
    return [];
  }
};

// Helper function to update item history for autocomplete
const updateBOMItemHistory = async (userId, tenantId, fieldType, value) => {
  try {
    await BOMItemHistory.findOneAndUpdate(
      { user_id: userId, tenant_id: tenantId, fieldType, value },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsed: new Date() }
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Error updating BOM item history:", error);
  }
};

// Helper function to calculate total cost
const calculateItemTotalCost = (item) => {
  if (!item.includeCost || !item.cost || !item.quantity) {
    return 0;
  }

  const wastage = item.wastageAllowance || 0;
  const costWithWastage = item.cost + (item.cost * (wastage / 100));
  return costWithWastage * item.quantity;
};

// Helper function to calculate grand total
const calculateGrandTotal = (bom) => {
  let total = 0;

  if (bom.structure === 'single' && bom.flatItems) {
    bom.flatItems.forEach(item => {
      if (item.includeCost) {
        total += calculateItemTotalCost(item);
      }
    });
  } else if (bom.structure === 'multi' && bom.sections) {
    const calculateSectionTotal = (section) => {
      section.items?.forEach(item => {
        if (item.includeCost) {
          total += calculateItemTotalCost(item);
        }
      });
    };

    const traverseSections = (sections) => {
      sections.forEach(section => {
        calculateSectionTotal(section);
        if (section.subsections) {
          traverseSections(section.subsections);
        }
      });
    };

    traverseSections(bom.sections);
  }

  return parseFloat(total.toFixed(2));
};

/**
 * Create BOM for a TechPack
 */
export const createBOM = asyncHandler(async (req, res) => {
  try {
    const { techPackId } = req.params;
    const {
      structure,
      viewType,
      sections,
      flatItems,
      inheritedWastageAllowance,
      inheritedIncludeCost,
      requiredFields = ['item', 'quantity']
    } = req.body;

    const techPack = await TechPack.findOne({
      _id: techPackId,
      user_id: req.user.id,
      is_deleted: false,
    });

    if (!techPack) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack not found",
      });
    }

    if (techPack.bom && (techPack.bom.sections?.length > 0 || techPack.bom?.flatItems?.length > 0)) {
      return sendResponse(res, {
        statusCode: 400,
        message: "BOM already exists. Use update endpoint instead.",
      });
    }

    // Validate items before saving
    // let blankItems = [];
    // if (structure === 'single' && flatItems && flatItems.length > 0) {
    //   blankItems = validateBOMItems(flatItems, requiredFields);

    //   // If there are blank items, return them for client-side warning
    //   if (blankItems.length > 0) {
    //     return sendResponse(res, {
    //       statusCode: 400,
    //       message: "BOM has blank/incomplete fields",
    //       data: { 
    //         blankItems,
    //         canSaveAnyway: true // Allow user to override
    //       },
    //     });
    //   }
    // }

    // Apply inheritance and calculate totals
    let processedFlatItems = flatItems || [];
    if (processedFlatItems.length > 0) {
      processedFlatItems = applyItemInheritance(
        processedFlatItems,
        inheritedWastageAllowance,
        inheritedIncludeCost
      );

      // Update history
      processedFlatItems.forEach(item => {
        if (item.item) updateBOMItemHistory(req.user.id, req.user.tenant_id, 'item', item.item);
        if (item.subItem) updateBOMItemHistory(req.user.id, req.user.tenant_id, 'subItem', item.subItem);
        if (item.material) updateBOMItemHistory(req.user.id, req.user.tenant_id, 'material', item.material);
        if (item.unit) updateBOMItemHistory(req.user.id, req.user.tenant_id, 'unit', item.unit);
      });
    }

    const bomData = {
      structure: structure || 'single',
      viewType: viewType || 'table',
      sections: sections || [],
      flatItems: processedFlatItems,
      inheritedWastageAllowance: inheritedWastageAllowance || 0,
      inheritedIncludeCost: inheritedIncludeCost !== undefined ? inheritedIncludeCost : true,
      requiredFields,
      validateOnSave: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    bomData.grandTotal = calculateGrandTotal(bomData);

    techPack.bom = bomData;
    await techPack.save();

    sendResponse(res, {
      statusCode: 201,
      message: "BOM created successfully",
      data: { bom: techPack.bom },
    });
  } catch (err) {
    console.error("Error creating BOM:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to create BOM",
    });
  }
});

/**
 * Update BOM for a TechPack
 */
export const updateBOM = asyncHandler(async (req, res) => {
  try {
    const { techPackId } = req.params;
    const {
      structure,
      viewType,
      sections,
      flatItems,
      inheritedWastageAllowance,
      inheritedIncludeCost,
      requiredFields = ['item', 'quantity'],
      forceIgnoreValidation = false // Flag to skip validation if user chooses to save anyway
    } = req.body;

    const techPack = await TechPack.findOne({
      _id: techPackId,
      user_id: req.user.id,
      is_deleted: false,
    });

    if (!techPack) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack not found",
      });
    }

    if (!techPack.bom) {
      techPack.bom = {};
    }

    // Validate items if not forced to skip
    // if (!forceIgnoreValidation && flatItems && flatItems.length > 0) {
    //   const blankItems = validateBOMItems(flatItems, requiredFields);

    //   if (blankItems.length > 0) {
    //     return sendResponse(res, {
    //       statusCode: 400,
    //       message: "BOM has blank/incomplete fields",
    //       data: { 
    //         blankItems,
    //         canSaveAnyway: true
    //       },
    //     });
    //   }
    // }

    // Apply updates
    if (structure !== undefined) techPack.bom.structure = structure;
    if (viewType !== undefined) techPack.bom.viewType = viewType;
    if (sections !== undefined) techPack.bom.sections = sections;

    if (flatItems !== undefined) {
      let processedItems = applyItemInheritance(
        flatItems,
        inheritedWastageAllowance || techPack.bom.inheritedWastageAllowance || 0,
        inheritedIncludeCost !== undefined ? inheritedIncludeCost : techPack.bom.inheritedIncludeCost
      );

      processedItems.forEach(item => {
        if (item.item) updateBOMItemHistory(req.user.id, req.user.tenant_id, 'item', item.item);
        if (item.subItem) updateBOMItemHistory(req.user.id, req.user.tenant_id, 'subItem', item.subItem);
        if (item.material) updateBOMItemHistory(req.user.id, req.user.tenant_id, 'material', item.material);
        if (item.unit) updateBOMItemHistory(req.user.id, req.user.tenant_id, 'unit', item.unit);
      });

      techPack.bom.flatItems = processedItems;
    }

    if (inheritedWastageAllowance !== undefined) techPack.bom.inheritedWastageAllowance = inheritedWastageAllowance;
    if (inheritedIncludeCost !== undefined) techPack.bom.inheritedIncludeCost = inheritedIncludeCost;

    techPack.bom.requiredFields = requiredFields;
    techPack.bom.grandTotal = calculateGrandTotal(techPack.bom);
    techPack.bom.updatedAt = new Date();

    await techPack.save();

    sendResponse(res, {
      statusCode: 200,
      message: "BOM updated successfully",
      data: { bom: techPack.bom },
    });
  } catch (err) {
    console.error("Error updating BOM:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to update BOM",
    });
  }
});

export const getBOMDefaultSuggestions = asyncHandler(async (req, res) => {
  try {
    const suggestions = await getAllBOMFieldSuggestions(req.user.id, req.user.tenant_id);

    sendResponse(res, {
      statusCode: 200,
      message: "Default suggestions fetched successfully",
      data: { suggestions },
    });
  } catch (err) {
    console.error("Error fetching default suggestions:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to fetch suggestions",
    });
  }
});

export const getUserFreetoneColors = asyncHandler(async (req, res) => {
  try {
    const freetones = await getUserFreetones(req.user.id, req.user.tenant_id);

    sendResponse(res, {
      statusCode: 200,
      message: "Freetone colors fetched successfully",
      data: { freetones },
    });
  } catch (err) {
    console.error("Error fetching freetone colors:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to fetch freetone colors",
    });
  }
});

/**
 * Get BOM for a TechPack
 */
export const getBOM = asyncHandler(async (req, res) => {
  try {
    const { techPackId } = req.params;

    const techPack = await TechPack.findOne({
      _id: techPackId,
      user_id: req.user.id,
      is_deleted: false,
    }).select('bom');

    if (!techPack) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack not found",
      });
    }

    if (!techPack.bom || (!techPack.bom.sections?.length && !techPack.bom.flatItems?.length)) {
      return sendResponse(res, {
        statusCode: 404,
        message: "BOM not found for this Tech Pack",
      });
    }

    sendResponse(res, {
      statusCode: 200,
      message: "BOM fetched successfully",
      data: { bom: techPack.bom },
    });
  } catch (err) {
    console.error("Error fetching BOM:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to fetch BOM",
    });
  }
});

/**
 * Delete BOM for a TechPack
 */
export const deleteBOM = asyncHandler(async (req, res) => {
  try {
    const { techPackId } = req.params;

    const techPack = await TechPack.findOne({
      _id: techPackId,
      user_id: req.user.id,
      is_deleted: false,
    });

    if (!techPack) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack not found",
      });
    }

    techPack.bom = undefined;
    await techPack.save();

    sendResponse(res, {
      statusCode: 200,
      message: "BOM deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting BOM:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to delete BOM",
    });
  }
});

/**
 * Get autocomplete suggestions for BOM fields
 */
export const getBOMAutocomplete = asyncHandler(async (req, res) => {
  try {
    const { fieldType, search } = req.query;

    if (!fieldType || !['item', 'subItem', 'material', 'unit'].includes(fieldType)) {
      return sendResponse(res, {
        statusCode: 400,
        message: "Invalid fieldType. Must be one of: item, subItem, material, unit",
      });
    }

    const query = {
      user_id: req.user.id,
      tenant_id: req.user.tenant_id,
      fieldType,
    };

    // Add search filter if provided
    if (search) {
      query.value = { $regex: search, $options: 'i' };
    }

    const suggestions = await BOMItemHistory.find(query)
      .sort({ usageCount: -1, lastUsed: -1 })
      .limit(20)
      .select('value usageCount lastUsed')
      .lean();

    sendResponse(res, {
      statusCode: 200,
      message: "Autocomplete suggestions fetched successfully",
      data: { suggestions: suggestions.map(s => s.value) },
    });
  } catch (err) {
    console.error("Error fetching autocomplete:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to fetch autocomplete suggestions",
    });
  }
});

/**
 * Create BOM Section (for Multi-level BOM)
 */
export const createBOMSection = asyncHandler(async (req, res) => {
  try {
    const { techPackId } = req.params;
    const { name, type, parentSectionId, items, order } = req.body;

    if (!name || !type) {
      return sendResponse(res, {
        statusCode: 400,
        message: "Section name and type are required",
      });
    }

    const techPack = await TechPack.findOne({
      _id: techPackId,
      user_id: req.user.id,
      is_deleted: false,
    });

    if (!techPack) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack not found",
      });
    }

    // Initialize BOM if doesn't exist
    if (!techPack.bom) {
      techPack.bom = {
        structure: 'multi',
        viewType: 'table',
        sections: [],
        flatItems: [],
      };
    }

    // Create new section
    const newSection = {
      _id: new mongoose.Types.ObjectId(),
      name,
      type,
      parentSectionId: parentSectionId || null,
      items: items || [],
      order: order || techPack.bom.sections.length,
    };

    // Calculate total costs for items
    newSection.items.forEach(item => {
      item.totalCost = calculateItemTotalCost(item);
    });

    techPack.bom.sections.push(newSection);
    techPack.bom.grandTotal = calculateGrandTotal(techPack.bom);
    techPack.bom.updatedAt = new Date();

    await techPack.save();

    sendResponse(res, {
      statusCode: 201,
      message: "BOM section created successfully",
      data: { section: newSection },
    });
  } catch (err) {
    console.error("Error creating BOM section:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to create BOM section",
    });
  }
});

/**
 * Update BOM Section
 */
export const updateBOMSection = asyncHandler(async (req, res) => {
  try {
    const { techPackId, sectionId } = req.params;
    const { name, type, items, order } = req.body;

    const techPack = await TechPack.findOne({
      _id: techPackId,
      user_id: req.user.id,
      is_deleted: false,
    });

    if (!techPack || !techPack.bom) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack or BOM not found",
      });
    }

    const section = techPack.bom.sections.id(sectionId);
    if (!section) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Section not found",
      });
    }

    // Update section fields
    if (name !== undefined) section.name = name;
    if (type !== undefined) section.type = type;
    if (items !== undefined) {
      items.forEach(item => {
        item.totalCost = calculateItemTotalCost(item);
      });
      section.items = items;
    }
    if (order !== undefined) section.order = order;

    techPack.bom.grandTotal = calculateGrandTotal(techPack.bom);
    techPack.bom.updatedAt = new Date();

    await techPack.save();

    sendResponse(res, {
      statusCode: 200,
      message: "BOM section updated successfully",
      data: { section },
    });
  } catch (err) {
    console.error("Error updating BOM section:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to update BOM section",
    });
  }
});

/**
 * Delete BOM Section
 */
export const deleteBOMSection = asyncHandler(async (req, res) => {
  try {
    const { techPackId, sectionId } = req.params;

    const techPack = await TechPack.findOne({
      _id: techPackId,
      user_id: req.user.id,
      is_deleted: false,
    });

    if (!techPack || !techPack.bom) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech Pack or BOM not found",
      });
    }

    // Find and remove section
    const sectionIndex = techPack.bom.sections.findIndex(
      s => s._id.toString() === sectionId
    );

    if (sectionIndex === -1) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Section not found",
      });
    }

    techPack.bom.sections.splice(sectionIndex, 1);
    techPack.bom.grandTotal = calculateGrandTotal(techPack.bom);
    techPack.bom.updatedAt = new Date();

    await techPack.save();

    sendResponse(res, {
      statusCode: 200,
      message: "BOM section deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting BOM section:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to delete BOM section",
    });
  }
});

export const createVariation = asyncHandler(async (req, res) => {
  try {
    const { use_case, engine, prompt, variant_count, galleryImageId, generatedImageUrl } = req.body;

    // ✅ Save to Gallery
    const uploadedImage = await GalleryImage.create({
      url: `${process.env.BASE_URL}/${req.file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
      name: req.file.originalname,
      status: "uploaded",
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
    });

    // ✅ Use common function to resolve image source
    const { stream, filename } = await getImageStream({
      galleryImageId,
      generatedImageUrl,
      file: req.file,
    });

    const formData = new FormData();
    formData.append("use_case", use_case || "dress_variations");
    formData.append("engine", "gpt_image_1");
    formData.append("variant_count", variant_count || 1);
    formData.append("image", stream, { filename });
    formData.append("prompt", prompt || "");

    const response = await axios.post(
      `${process.env.AI_URL}/generate/dress-variations/async`,
      formData,
      { headers: formData.getHeaders() },
    );
    const taskId = response.data.task_id;
    // const taskId = "123456";

    await AiTask.create({
      user_id: req.user.id,
      task: "image_variation",
      task_id: taskId,
      gallery_image_ids: [uploadedImage.id],
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Task queued successfully",
      data: { task_id: taskId },
    });
  } catch (err) {
    console.error("Error:", err);
    await handleImageVariationFailure(req.user.id, req.io);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to queue image generation",
    });
  }
});

export const createTechPacks = asyncHandler(async (req, res) => {
  try {
    const { prompt, galleryImageId, generatedImageUrl, projectImageUrl, projectImageId } = req.body;

    // ✅ Resolve image source (uploaded, generated, gallery, or project)
    let stream, filename, fileHash, galleryImage;

    // Handle project image URL
    if (projectImageUrl) {
      try {
        // Download image from URL server-side
        const response = await axios.get(projectImageUrl, {
          responseType: 'stream'
        });

        stream = response.data;
        filename = projectImageUrl.split('/').pop() || 'project-image.jpg';

        // Create gallery image record for project image
        galleryImage = await GalleryImage.create({
          url: projectImageUrl,
          name: filename,
          status: "uploaded",
          tenant_id: req.user.tenant_id,
          user_id: req.user.id,
          project_image_id: projectImageId || null,
        });

      } catch (error) {
        console.error("Error fetching project image:", error);
        return sendResponse(res, {
          statusCode: 400,
          message: "Failed to fetch project image from URL",
        });
      }
    } else {
      // Your existing code for other image sources
      const imageData = await getImageStream({
        galleryImageId,
        generatedImageUrl,
        file: req.file,
      });

      stream = imageData.stream;
      filename = imageData.filename;
      fileHash = imageData.fileHash;

      if (generatedImageUrl) {
        // ✅ Handle generated image case (your existing code)
        const encryptedId = generatedImageUrl.split("/").pop();
        const decryptedUrl = galleryService.decryptImagePath(encryptedId);

        const aiTask = await AiTask.findOne({
          result: decryptedUrl,
          user_id: req.user.id,
        });

        if (!aiTask) {
          return sendResponse(res, {
            statusCode: 404,
            message: "AI task not found for this generated image.",
          });
        }

        // Ensure aiTask.result is an array before filtering
        if (Array.isArray(aiTask.result)) {
          aiTask.result = aiTask.result.filter((url) => url !== decryptedUrl);
          await aiTask.save();
        }

        galleryImage = await GalleryImage.create({
          url: decryptedUrl,
          name: `Generated-${aiTask?.task_id}`,
          status: "finalized",
          tenant_id: req.user.tenant_id,
          user_id: req.user.id,
          fileHash,
        });

        await deductCredits({
          tenantId: req.user.tenant_id,
          userId: req.user.id,
          creditsToDeduct: 1,
        });
      } else if (req?.file) {
        // ✅ Handle uploaded file case
        const imageUrl = `${process.env.BASE_URL}/${req.file.path
          .replace(/^public[\\/]/, "")
          .replace(/\\/g, "/")}`;

        galleryImage = await GalleryImage.create({
          url: imageUrl,
          name: req.file.originalname,
          status: "uploaded",
          tenant_id: req.user.tenant_id,
          user_id: req.user.id,
        });
      } else if (galleryImageId) {
        // ✅ Handle case where user selects an existing gallery image
        const existingImage = await GalleryImage.findById(galleryImageId);

        if (!existingImage) {
          return sendResponse(res, {
            statusCode: 404,
            message: "Gallery image not found.",
          });
        }

        // Duplicate the gallery image entry as a new 'uploaded' record (preserves original)
        galleryImage = await GalleryImage.create({
          url: existingImage.url,
          name: existingImage.name || `Copied-${galleryImageId}`,
          status: "uploaded", // ✅ mark as uploaded for this new use
          tenant_id: req.user.tenant_id,
          user_id: req.user.id,
          fileHash: existingImage.fileHash || "",
          source_gallery_id: existingImage._id, // optional: track original
        });
      }

    }

    // ✅ Prepare FormData for AI service
    const formData = new FormData();
    formData.append("image", stream, { filename });
    formData.append("prompt", prompt || "");

    const response = await axios.post(
      `${process.env.AI_URL}/generate/tech-pack/async`,
      formData,
      { headers: formData.getHeaders() }
    );

    const taskId = response.data.task_id;

    await AiTask.create({
      user_id: req.user.id,
      task: "tech_packs",
      task_id: taskId,
      gallery_image_ids: galleryImageId ? [galleryImageId] : [galleryImage._id],
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Task queued successfully",
      data: { task_id: taskId },
    });
  } catch (err) {
    console.error("Error:", err);
    await handleImageVariationFailure(req.user.id, req.io);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to queue image generation",
    });
  }
});

export const createSketchToImage = asyncHandler(async (req, res) => {
  try {
    const { use_case, engine, prompt, variant_count, galleryImageId, generatedImageUrl } = req.body;

    // ✅ Save to Gallery
    const galleryImage = await GalleryImage.create({
      url: `${process.env.BASE_URL}/${req.file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
      name: req.file.originalname,
      status: "uploaded",
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
    });


    // ✅ Use common function to resolve image source
    const { stream, filename } = await getImageStream({
      galleryImageId,
      generatedImageUrl,
      file: req.file,
    });

    const formData = new FormData();
    formData.append("use_case", use_case || "sketch_to_image");
    formData.append("engine", "gpt_image_1");
    formData.append("variant_count", variant_count || 1);
    formData.append("image", stream, { filename });
    formData.append("prompt", prompt || "");
    const response = await axios.post(
      `${process.env.AI_URL}/generate/sketch-to-image/async`,
      formData,
      { headers: formData.getHeaders() },
    );

    const taskId = response.data.task_id;

    await AiTask.create({
      user_id: req.user.id,
      task: "sketch_to_image",
      task_id: taskId,
      gallery_image_ids: [galleryImage.id],
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Task queued successfully",
      data: { task_id: taskId },
    });
  } catch (err) {
    console.error("Error:", err);
    await handleImageVariationFailure(req.user.id, req.io);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to queue image generation",
    });
  }
});

export const createCombineImage = asyncHandler(async (req, res) => {
  try {
    const {
      use_case,
      engine,
      style_focus,
      color_scheme,
      output_type,
      custom_colors,
      prompt,
      variant_count,
      tolerance_chest,
      tolerance_waist,
      tolerance_hip,
      tolerance_length,
      tolerance_sleeve,
      tolerance_shoulder,
      baseGalleryImageId,
      baseGeneratedUrl,
      styleGalleryImageId,
      styleGeneratedUrl,
    } = req.body;

    const baseImageFile = req.files?.base_image?.[0];
    const styleImageFile = req.files?.style_image?.[0];

    // ✅ Save both to gallery
    const galleryImageIDs = [];
    for (const imageFile of [baseImageFile, styleImageFile]) {
      if (imageFile) {

        const galleryImage = await GalleryImage.create({
          url: `${process.env.BASE_URL}/${imageFile.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
          name: imageFile.originalname,
          status: "uploaded",
          tenant_id: req.user.tenant_id,
          user_id: req.user.id,
        });
        galleryImageIDs.push(galleryImage.id);
      }
    }

    // ✅ Resolve Base Image (file / galleryId / generatedUrl)
    const { stream: baseStream, filename: baseFilename } = await getImageStream({
      galleryImageId: baseGalleryImageId,
      generatedImageUrl: baseGeneratedUrl,
      file: baseImageFile,
    });

    // ✅ Resolve Style Image (file / galleryId / generatedUrl)
    const { stream: styleStream, filename: styleFilename } = await getImageStream({
      galleryImageId: styleGalleryImageId,
      generatedImageUrl: styleGeneratedUrl,
      file: styleImageFile,
    });

    const formData = new FormData();
    console.log(variant_count, "variant_count-combine")
    formData.append("use_case", use_case || "image_fusion");
    formData.append("engine", "gpt_image_1");
    // formData.append("base_image", fs.createReadStream(baseImageFile.path));
    // formData.append("style_image", fs.createReadStream(styleImageFile.path));
    formData.append("style_focus", style_focus);
    formData.append("color_scheme", color_scheme);
    formData.append("output_type", output_type);
    formData.append("custom_colors", custom_colors || "");
    formData.append("variant_count", variant_count || 1);
    formData.append("prompt", prompt || "");
    formData.append("use_case", use_case || "image_fusion");
    formData.append("base_image", baseStream, { filename: baseFilename });
    formData.append("style_image", styleStream, { filename: styleFilename });

    if (
      tolerance_chest ||
      tolerance_waist ||
      tolerance_hip ||
      tolerance_length ||
      tolerance_sleeve ||
      tolerance_shoulder
    ) {
      formData.append("tolerance_chest", tolerance_chest || "0.5");
      formData.append("tolerance_waist", tolerance_waist || "0.5");
      formData.append("tolerance_hip", tolerance_hip || "0.5");
      formData.append("tolerance_length", tolerance_length || "0.5");
      formData.append("tolerance_sleeve", tolerance_sleeve || "0.5");
      formData.append("tolerance_shoulder", tolerance_shoulder || "0.25");
    }

    const response = await axios.post(
      `${process.env.AI_URL}/generate/image-fusion/async`,
      formData,
      { headers: formData.getHeaders() },
    );

    const taskId = response.data.task_id;

    await AiTask.create({
      user_id: req.user.id,
      task: "combine_image",
      task_id: taskId,
      gallery_image_ids: galleryImageIDs,
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Task queued successfully",
      data: { task_id: taskId },
    });
  } catch (err) {
    console.error("Error:", err);
    await handleImageVariationFailure(req.user.id, req.io);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to queue image generation",
    });
  }
});

export const createPatternCutouts = asyncHandler(async (req, res) => {
  try {
    const {
      use_case,
      garment_type,
      extraction_mode,
      output_format,
      include_measurements,
      include_grainlines,
      include_seam_allowance,
      include_notches,
      desired_piece_count,
      notes,
      async: isAsync,
      engine,
      remove_background,
      extract_pattern,
      pattern_type,
      colors,
      galleryImageId,
      generatedImageUrl
    } = req.body;

    // ✅ Save uploaded image to Gallery
    const uploadedImage = await GalleryImage.create({
      url: `${process.env.BASE_URL}/${req.file.path
        .replace(/^public[\\/]/, "")
        .replace(/\\/g, "/")}`,
      name: req.file.originalname,
      status: "uploaded",
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
    });

    // ✅ Resolve file stream
    const { stream, filename } = await getImageStream({
      file: req.file,
      galleryImageId,
      generatedImageUrl
    });

    // ✅ Prepare formData for AI request
    const formData = new FormData();
    formData.append("use_case", use_case || "pattern_cutouts");
    formData.append("image", stream, { filename });
    formData.append("garment_type", garment_type);
    formData.append("extraction_mode", extraction_mode);
    formData.append("output_format", output_format);
    formData.append("include_measurements", include_measurements);
    formData.append("include_grainlines", include_grainlines);
    formData.append("include_seam_allowance", include_seam_allowance);
    formData.append("include_notches", include_notches);
    formData.append("desired_piece_count", desired_piece_count);
    formData.append("notes", notes || "");
    formData.append("async", isAsync || "true");
    formData.append("engine", engine || "auto");
    formData.append("remove_background", remove_background || "true");
    formData.append("extract_pattern", extract_pattern || "true");
    formData.append("pattern_type", pattern_type || "dress");
    formData.append("colors", colors || "pdf");

    // ✅ Call AI service
    const response = await axios.post(
      `${process.env.AI_URL}/generate/garment-cutout/async`,
      formData,
      { headers: formData.getHeaders() }
    );

    const taskId = response.data.task_id;

    // ✅ Save task to DB
    await AiTask.create({
      user_id: req.user.id,
      task: "pattern_cutout",
      task_id: taskId,
      gallery_image_ids: [uploadedImage.id],
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Pattern cutout task queued successfully",
      data: { task_id: taskId },
    });
  } catch (err) {
    console.error("Error:", err);
    await handleImageVariationFailure(req.user.id, req.io);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to queue pattern cutout task",
    });
  }
});

export const analyzeColorsAsync = asyncHandler(async (req, res) => {
  try {
    const {
      include_harmony = true,
      include_fashion_insights = true,
      save_palette = true,
      palette_name = "",
      galleryImageId,
    } = req.body;

    // ✅ Save uploaded image to Gallery
    const uploadedImage = await GalleryImage.create({
      url: `${process.env.BASE_URL}/${req.file.path
        .replace(/^public[\\/]/, "")
        .replace(/\\/g, "/")}`,
      name: req.file.originalname,
      status: "uploaded",
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
    });

    // ✅ Resolve file stream
    const { stream, filename } = await getImageStream({
      file: req.file,
      galleryImageId,
    });

    // ✅ Prepare formData for AI color analysis request
    const formData = new FormData();
    // 👇 The AI API expects "file", so we map it here
    formData.append("file", stream, { filename });
    formData.append("include_harmony", include_harmony);
    formData.append("include_fashion_insights", include_fashion_insights);
    formData.append("save_palette", save_palette);
    formData.append("palette_name", palette_name);
    const url = `${process.env.AI_URL}/api/colors/analyze/async`;
    // ✅ Call AI color analysis service
    const response = await axios.post(
      url,
      formData,
      { headers: formData.getHeaders() }
    );


    console.log(`${process.env.AI_URL}/api/colors/analyze/async`, '${process.env.AI_URL}/colors/analyze/async')


    const taskId = response.data.task_id;

    // ✅ Save AI task
    await AiTask.create({
      user_id: req.user.id,
      task: "color_analysis",
      task_id: taskId,
      gallery_image_ids: [uploadedImage.id],
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Color analysis task queued successfully",
      data: { task_id: taskId },
    });
  } catch (err) {
    console.error("Color Analysis Error:", err);
    await handleImageVariationFailure(req.user.id, req.io);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to queue color analysis task",
    });
  }
});


export const getColorAnalyses = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  // ✅ Extract pagination params
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // ✅ Optional filters
  const { success, task_type } = req.query;
  const query = { user_id };

  if (typeof success !== "undefined") {
    query.success = success === "true";
  }

  if (task_type) {
    query.task_type = task_type;
  }

  // ✅ Total count for pagination
  const totalColorAnalyses = await ColorAnalysis.countDocuments(query);

  // ✅ Fetch paginated analyses
  const analyses = await ColorAnalysis.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .populate("gallery_image_ids");

  // ✅ Pagination metadata
  const totalPages = Math.ceil(totalColorAnalyses / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // ✅ Standardized response
  sendResponse(res, {
    statusCode: 200,
    message: "Color analyses fetched successfully",
    data: {
      analyses,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalColorAnalyses,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    },
  });
});

export const analyzeColorsInstant = asyncHandler(async (req, res) => {
  try {
    const {
      include_harmony = true,
      include_fashion_insights = true,
      palette_name = "",
    } = req.body;

    if (!req.file) {
      return sendResponse(res, {
        statusCode: 400,
        message: "No image file uploaded",
      });
    }

    // ✅ Prepare file for AI API
    const formData = new FormData();
    formData.append("file", req.file.buffer, { filename: req.file.originalname });
    formData.append("include_harmony", include_harmony);
    formData.append("include_fashion_insights", include_fashion_insights);
    formData.append("save_palette", false); // explicitly false since we’re not saving
    formData.append("palette_name", palette_name);

    // ✅ Call AI service directly (synchronous endpoint)
    const url = `${process.env.AI_URL}/api/colors/analyze`;
    const response = await axios.post(url, formData, {
      headers: formData.getHeaders(),
    });

    // ✅ Return color analysis directly
    sendResponse(res, {
      statusCode: 200,
      message: "Color palette generated successfully",
      data: response.data,
    });
  } catch (err) {
    console.error("Instant Color Analysis Error:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to generate color palette",
    });
  }
});

export const deleteColorAnalysesDoc = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  // ✅ Find the color analysis document
  const analysis = await ColorAnalysis.findOne({ _id: id, user_id });

  if (!analysis) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Color analysis not found or you don't have permission to delete it",
    });
  }

  // ✅ Delete the document
  await ColorAnalysis.deleteOne({ _id: id });

  // ✅ Send success response
  sendResponse(res, {
    statusCode: 200,
    message: "Color analysis deleted successfully",
  });
});



export const textToImage = asyncHandler(async (req, res) => {
  try {
    const { use_case, engine, prompt, variant_count, advanced_prompt } =
      req.body;

    const formData = new FormData();
    formData.append("use_case", use_case || "text_to_sketch");
    formData.append("engine", "gpt_image_1");
    formData.append("variant_count", variant_count || 1);
    formData.append("prompt", prompt || "");
    formData.append("advanced_prompt", advanced_prompt || "");

    const response = await axios.post(
      `${process.env.AI_URL}/generate/text-to-sketch/async`,
      formData,
      { headers: formData.getHeaders() },
    );

    const taskId = response.data.task_id;

    await AiTask.create({
      user_id: req.user.id,
      task: "text_to_image",
      task_id: taskId,
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Task queued successfully",
      data: { task_id: taskId },
    });
  } catch (err) {
    console.error("Error:", err);
    await handleImageVariationFailure(req.user.id, req.io);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to queue image generation",
    });
  }
});

export const createColorVariation = asyncHandler(async (req, res) => {
  try {
    const { use_case, engine, variant_count, size, prompt, palette, custom_colors, texture, pattern, async, galleryImageId, generatedImageUrl } = req.body;

    // ✅ Save to Gallery
    const uploadedImage = await GalleryImage.create({
      url: `${process.env.BASE_URL}/${req.file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
      name: req.file.originalname,
      status: "uploaded",
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
    });

    // ✅ Use common function to resolve image source
    const { stream, filename } = await getImageStream({
      galleryImageId,
      generatedImageUrl,
      file: req.file,
    });

    const formData = new FormData();
    formData.append("use_case", use_case || "color_variations");
    formData.append("engine", engine || "gpt_image_1");
    formData.append("variant_count", variant_count || 1);
    formData.append("size", size || "1024x1024");
    formData.append("prompt", prompt || "");
    formData.append("palette", palette || "");
    formData.append("custom_colors", custom_colors || "");
    formData.append("texture", texture || "");
    formData.append("pattern", pattern || "");
    formData.append("async", async || "true");
    formData.append("image", stream, { filename });

    const response = await axios.post(
      `${process.env.AI_URL}/generate/create`,
      formData,
      { headers: formData.getHeaders() },
    );
    const taskId = response.data.task_id;
    // const taskId = "123456";

    await AiTask.create({
      user_id: req.user.id,
      task: "color_variations",
      task_id: taskId,
      gallery_image_ids: [uploadedImage.id],
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Task queued successfully",
      data: { task_id: taskId },
    });
  } catch (err) {
    console.error("Error:", err);
    await handleImageVariationFailure(req.user.id, req.io);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to queue image generation",
    });
  }
});

const incrementOutputsPerModule = async ({ userCredit, type, user_id, tenant_id }) => {
  switch (type) {
    case 'combine_image':
      await UsageLog.create({
        module: 'combine_image',
        type: 'output_produced',
        outputCount: 1,
        user_id,
        tenant_id,
      });
      break;

    case 'image_variation':
      await UsageLog.create({
        module: 'ge_variation',
        type: 'output_produced',
        outputCount: 1,
        user_id,
        tenant_id,
      });
      break;

    case 'text_to_image':
      await UsageLog.create({
        module: 'text_to_image',
        type: 'output_produced',
        outputCount: 1,
        user_id,
        tenant_id,
      });
      break;

    case 'size_chart':
      await UsageLog.create({
        module: 'size_chart',
        type: 'output_produced',
        outputCount: 1,
        user_id,
        tenant_id,
      });
      break;

    case 'sketch_to_image':
      await UsageLog.create({
        module: 'sketch_to_image',
        type: 'output_produced',
        outputCount: 1,
        user_id,
        tenant_id,
      });
      break;
    case TASK_TYPE.PATTERN_CUTOUT:
      await UsageLog.create({
        module: TASK_TYPE.PATTERN_CUTOUT,
        type: 'output_produced',
        outputCount: 1,
        user_id,
        tenant_id,
      });
      break;

    case 'tech_packs':
      await UsageLog.create({
        module: 'tech_packs',
        type: 'output_produced',
        outputCount: 1,
        user_id,
        tenant_id,
      });
      break;

    default:
      console.warn(`Unhandled task type: ${type}`);
      break;
  }
};


let isPollingRunning = false;
export const startTaskStatusPolling = () => {
  console.log("✅ Task polling started...");

  setInterval(async () => {
    // Check if previous polling is still running
    if (isPollingRunning) {
      console.log("⏳ Previous polling still running, skipping...");
      return;
    }

    // Set flag to indicate polling is running
    isPollingRunning = true;

    console.log("🔄 Checking queued dress tasks...");

    try {
      console.log("➡ Fetching pending tasks from DB...");
      const pendingTasks = await AiTask.find({ status: "queued" });
      console.log(`📦 Found ${pendingTasks.length} pending tasks.`);

      for (const task of pendingTasks) {
        const { task_id } = task;
        const sketchToImageArray = [];
        console.log(`🔍 Checking status for task_id: ${task_id}`);

        const statusUrl = `${process.env.AI_URL}/task/status/${task_id}`;
        const aiTaskType = task.task;
        console.log(`🌐 Sending GET request to ${statusUrl}`);

        const response = await axios.get(statusUrl);
        const status = response.data.status;
        let isTypeSizeChart = false;
        console.log(
          `📥 Received status: ${status} for task_id: ${task_id}`,
        );

        if (status === "completed") {
          console.log(`✅ Task ${task_id} marked as completed.`);

          // Declare all variables at the top of this scope
          const rawResult = response.data.result;
          const hasMeasurementData = rawResult?.data?.measurements;
          const toleranceData = rawResult?.tolerance;
          const gradingData = rawResult?.grading_rules;
          const internationalSizeData = rawResult?.size_conversion;
          let sizeSchemaId;
          let colorAnalysisDoc = null;

          let userCredit = await UserCredits.findOne({ user_id: task?.user_id })
          if (!userCredit) {
            console.log('task', task)
            const user = await User.findById(task.user_id)
            console.log(user, 'user')
            userCredit = new UserCredits({
              user_id: user._id,
              tenant_id: user.tenant_id
            });

            await userCredit.save();
          }

          const baseUrl = process.env.AI_URL;
          let resultPaths = [];

          console.log("🧪 Raw result:", rawResult);

          // Fix the condition structure
          if (aiTaskType === TASK_TYPE.PATTERN_CUTOUT) {
            resultPaths = rawResult?.components || [];
          } else if (aiTaskType === TASK_TYPE.TECH_PACK) {
            resultPaths = rawResult
          } else if (typeof rawResult === "string") {
            console.log("📄 Result is a string.");
            resultPaths = [`${baseUrl}/${rawResult}`];
          } else if (Array.isArray(rawResult)) {
            console.log("📚 Result is an array.");
            resultPaths = rawResult.map(
              (relPath) => `${baseUrl}/${relPath}`,
            );
          } else if (typeof rawResult === "object") {
            console.log("📦 Result is an object.");
            if (Array.isArray(rawResult.fusion_images)) {
              console.log("🖼️ fusion_images is an array.");
              resultPaths = rawResult.fusion_images.map(
                (relPath) => `${baseUrl}/${relPath}`,
              );
            } else if (typeof rawResult.fusion_image === "string") {
              console.log("🖼️ fusion_image is a string.");
              resultPaths = [
                `${baseUrl}/${rawResult.fusion_image}`,
              ];
            } else if (
              typeof rawResult?.annotated_image_path === "string"
            ) {
              isTypeSizeChart = true
              console.log("🖼️ annotated_image_path is a string.");
              resultPaths = [
                `${baseUrl}/${rawResult.annotated_image_path}`,
              ];
            } else {
              console.log(
                "⚠️ No matching result path structure found.",
              );
            }
          } else {
            console.log(rawResult, 'rawResult')
            console.log("❗ Unrecognized result format.");
          }

          console.log(toleranceData, "toleranceData");
          console.log(gradingData, "gradingData");
          console.log(internationalSizeData, "internationalSizeData");

          // 🔵 Save SizeChart entry if measurements exist
          const user = await User.findById(task.user_id)
          await incrementOutputsPerModule({ userCredit, type: task.task, user_id: user._id, tenant_id: user.tenant_id });

          if (hasMeasurementData) {
            try {
              const aiTask = await AiTask.findOne({ task_id })

              if (aiTask?.confirmation === 'replace') {
                const existingCharts = await sizeChartSchema.find({
                  user_id: task.user_id,
                  fileHash: { $in: aiTask?.fileHash || [] },
                  gallery_image_ids: { $in: aiTask?.gallery_image_ids || [] }
                });

                for (const chart of existingCharts) {
                  const hasOtherRefs =
                    (chart.fileHash.length > (aiTask?.fileHash?.length || 0)) ||
                    (chart.gallery_image_ids.length > (aiTask?.gallery_image_ids?.length || 0));

                  if (hasOtherRefs) {
                    // Just pull the references
                    await sizeChartSchema.updateOne(
                      { _id: chart._id },
                      {
                        $pull: {
                          fileHash: { $in: aiTask?.fileHash || [] },
                          gallery_image_ids: { $in: aiTask?.gallery_image_ids || [] }
                        }
                      }
                    );
                  } else {
                    // Last one → delete the whole chart
                    await sizeChartSchema.deleteOne({ _id: chart._id });
                    console.log(`Deleted last size chart for fileHash ${aiTask?.fileHash}`);
                  }
                }
              }

              let sizeChartName = "Untitled-SizeChart";
              if (aiTask?.gallery_image_ids?.length > 0) {
                const firstGalleryImage = await GalleryImage.findById(aiTask.gallery_image_ids[0]);
                if (firstGalleryImage) {
                  const baseName = firstGalleryImage.name?.replace(/\.[^/.]+$/, "") || "Untitled";
                  const existingCharts = await sizeChartSchema.find({
                    gallery_image_ids: aiTask.gallery_image_ids[0],
                  });
                  if (existingCharts.length === 0) {
                    sizeChartName = `${baseName}-SizeChart`;
                  } else {
                    sizeChartName = `${baseName}-SizeChart-${existingCharts.length + 1}`;
                  }
                }
              }

              const sizeChart = await sizeChartSchema.create({
                user_id: task.user_id,
                tenant_id: user.tenant_id,
                task_id: task_id,
                status: "completed",
                name: sizeChartName,
                measurements: rawResult?.data?.measurements,
                grading_rules: rawResult?.grading_rules,
                tolerance: rawResult?.tolerance,
                size_conversion: rawResult?.size_conversion,
                fileHash: aiTask?.fileHash || [],
                generation_source: "ai_generated",
                gallery_image_ids: aiTask?.gallery_image_ids || [],
                results: [],
                market: aiTask?.meta?.market,
                unit: aiTask?.meta?.unit
              });

              console.log('size Chart<>?<><><><', sizeChart, aiTask?.metadata?.galleryID)
              sizeSchemaId = sizeChart._id;

              // Update size chart counts in user consumption tracking
              await UserCredits.findOneAndUpdate(
                {
                  user_id: task.user_id,
                  tenant_id: user.tenant_id
                },
                {
                  $inc: {
                    sizeChartGenerated: 1,
                    sizeChartsSinceLastReview: 1
                  }
                },
                { upsert: true, setDefaultsOnInsert: true }
              );
              console.log(
                `💾 Saved size chart for task ${task_id}.`,
              );
            } catch (err) {
              console.error(
                `❌ Error saving size chart for ${task_id}: ${err.message}`,
              );
            }
          } else {
            console.log(`⚠️ No measurements found for ${task_id}.`);
          }

          // 🎨 Handle sketch_to_image tasks - create GalleryImage documents
          if (task.task === "sketch_to_image" && resultPaths.length > 0) {
            console.log(`🎨 Processing sketch_to_image task ${task_id}...`);

            try {
              // Get user data to access tenant_id
              const user = await User.findById(task.user_id);
              if (!user) {
                console.error(`❌ User not found for task ${task_id}`);
              } else {
                for (const [index, imagePath] of resultPaths.entries()) {
                  const imageName = `sketch_to_image_${task_id}_${index + 1}.jpg`;
                  const createdImage = await GalleryImage.create({
                    url: imagePath,
                    name: imageName,
                    description: `Generated from sketch to image task ${task_id}`,
                    status: "finalized",
                    tenant_id: user.tenant_id,
                    user_id: task.user_id,
                    task_id: task_id,
                    gallery_image_ids: task?.gallery_image_ids?.length > 0 ? task.gallery_image_ids : []
                  });

                  const creditsToDeduct = task?.gallery_image_ids?.length

                  await deductCredits({
                    tenantId: user.tenant_id,
                    userId: task.user_id,
                    creditsToDeduct
                  });

                  await UsageLog.create({
                    module: task.task === 'image_variation' ? 'ge_variation' : task.task,
                    type: 'credit_consumed',
                    creditsUsed: 1,
                    user_id: task.user_id,
                    tenant_id: user.tenant_id,
                  });

                  sketchToImageArray.push({
                    url: imagePath,
                    id: createdImage._id,
                  })
                  console.log(`🖼️ Created GalleryImage for ${imageName}`);
                }
                console.log(`✅ Created ${resultPaths.length} GalleryImage documents for sketch_to_image task ${task_id}`);
              }
            } catch (err) {
              console.error(`❌ Error creating GalleryImage documents for ${task_id}: ${err.message}`);
            }
          } else if (aiTaskType === TASK_TYPE.PATTERN_CUTOUT) {
            try {
              console.log(`✂️ Creating cutout entry for task ${task_id}...`);

              const user = await User.findById(task.user_id);
              if (!user) {
                console.error(`❌ User not found for cutout task ${task_id}`);
                return;
              }

              const aiTask = await AiTask.findOne({ task_id });

              const cutoutDoc = await Cutout.create({
                user_id: task.user_id,
                tenant_id: user.tenant_id,
                task_id: task_id,
                status: "completed",
                name: aiTask?.name || `Cutouts for ${task_id}`,
                message: rawResult?.message || null,
                components: rawResult?.components || [],
                metadata: rawResult?.metadata || {},
                gallery_image_ids: aiTask?.gallery_image_ids || [],
                fileHash: aiTask?.fileHash || [],
                generation_source: "ai_generated",
                market: aiTask?.meta?.market || null,
                is_deleted: false,
              });

              console.log(`💾 Saved cutout entry for task ${task_id}`, cutoutDoc._id);

            } catch (err) {
              console.error(`❌ Error saving cutout entry for ${task_id}: ${err.message}`);
            }
          } else if (aiTaskType === TASK_TYPE.COLOR_ANALYSIS) {
            try {
              console.log(`🎨 Creating color analysis entry for task ${task_id}...`);

              const user = await User.findById(task.user_id);
              if (!user) {
                console.error(`❌ User not found for color analysis task ${task_id}`);
                return;
              }

              const aiTask = await AiTask.findOne({ task_id });

              colorAnalysisDoc = await ColorAnalysis.create({
                user_id: task.user_id,
                tenant_id: user.tenant_id,
                task_id: task_id,
                task_type: "garment_color_analysis",
                data: rawResult || {},
                success: rawResult?.success ?? true,
                gallery_image_ids: aiTask?.gallery_image_ids || [],
              });

              console.log(`💾 Saved color analysis entry for task ${task_id}`, colorAnalysisDoc._id);

            } catch (err) {
              console.error(`❌ Error saving color analysis entry for ${task_id}: ${err.message}`);
            }
          } else if (aiTaskType === TASK_TYPE.TECH_PACK) {
            try {
              console.log(`📦 Creating TechPack entry for task ${task_id}...`);
              const user = await User.findById(task.user_id);
              if (!user) {
                console.error(`❌ User not found for TechPack task ${task_id}`);
                return;
              }

              const aiTask = await AiTask.findOne({ task_id });

              const techPackDoc = await TechPack.create({
                user_id: task.user_id,
                tenant_id: user.tenant_id,
                task_id: task_id,
                status: "completed",
                analysis: rawResult?.analysis || {},
                tech_pack: rawResult?.tech_pack || {},
                gallery_image_ids: aiTask?.gallery_image_ids || [],
                generation_source: "ai_generated",
                meta: aiTask?.meta || {},
              });

              console.log(`💾 Saved TechPack entry for task ${task_id}`, techPackDoc._id);

              io.to(task.user_id.toString()).emit("task_update", {
                task_id,
                status: "completed",
                result: rawResult,
                techPackId: techPackDoc._id,
                gallery_image_ids: aiTask?.gallery_image_ids || [],
                task: aiTask?.task || "tech_packs",
              });

              sendNotification(io, {
                user_id: user.id,
                type: "result_generated",
                message: `Tech Pack generated successfully for ${task_id}`,
              });
            } catch (err) {
              console.error(`❌ Error saving TechPack entry for ${task_id}: ${err.message}`);
            }
          }

          console.log("💾 Updating DB with completed task...");
          const aiTask = await AiTask.findOneAndUpdate(
            { task_id },
            {
              status: "completed",
              result: (isTypeSizeChart || task.task === "sketch_to_image" || aiTaskType === TASK_TYPE.PATTERN_CUTOUT || aiTaskType === TASK_TYPE.TECH_PACK)
                ? []
                : resultPaths,
            },
            {
              new: true, // return the updated document
            }
          );

          console.log(
            "📢 Emitting socket event for completed task...", aiTask
          );
          let encryptedResults = [];
          if (aiTaskType !== TASK_TYPE.PATTERN_CUTOUT && aiTaskType !== TASK_TYPE.COLOR_ANALYSIS && aiTaskType !== TASK_TYPE.TECH_PACK) {
            encryptedResults = resultPaths.map(galleryService.encryptImagePath);
          }
          const encryptedSketchToImageArray = sketchToImageArray.map(item => ({
            ...item,
            url: item.url
          }));

          io.to(task.user_id.toString()).emit("task_update", {
            task_id: task.task_id,
            status: "completed",
            result: isTypeSizeChart
              ? []
              : task.task === "sketch_to_image"
                ? encryptedSketchToImageArray
                : task.task === TASK_TYPE.PATTERN_CUTOUT || task.task === TASK_TYPE.TECH_PACK
                  ? rawResult || {}
                  : aiTaskType === TASK_TYPE.COLOR_ANALYSIS ?
                    colorAnalysisDoc
                    : encryptedResults,
            measurements: hasMeasurementData
              ? rawResult.data.measurements
              : null,
            grading_rules: gradingData
              ? rawResult.grading_rules
              : null,
            tolerance: toleranceData
              ? rawResult.tolerance
              : null,
            size_conversion: internationalSizeData
              ? rawResult.size_conversion
              : null,
            sizeChartId: sizeSchemaId,
            aiTaskId: aiTask._id,
            gallery_image_ids: aiTask?.gallery_image_ids?.length > 0 ? aiTask?.gallery_image_ids : [],
            market: aiTask?.meta?.market || null,
            unit: aiTask?.meta?.unit || null,
            task: aiTask?.task || null
          });
          sendNotification(io, { user_id: user.id, type: "result_generated", message: `Result generated for task ${MODULE_NAME[task.task] || task.task}` })
        } else if (status === "failed" || status === "error") {
          console.log(
            `❌ Task ${task_id} failed with status: ${status}`,
          );

          await AiTask.updateOne(
            { task_id: task.task_id },
            { status: "failed" },
          );

          console.log("📢 Emitting socket event for failed task...");
          io.to(task.user_id.toString()).emit("task_update", {
            task_id: task.task_id,
            status: "failed",
          });

          console.log("🚨 Handling image variation failure...");
          await handleImageVariationFailure(task.user_id, global.io);
        } else {
          // console.log(
          //     `⏳ Task ${task_id} is still in status: ${status}`,
          // );
        }
      }
    } catch (error) {
      console.log(error, 'error')
      console.error("❌ Error in task polling:", error.message);
    } finally {
      // Reset flag when polling completes (success or error)
      isPollingRunning = false;
    }
  }, 3000); // runs every 3 seconds
};



export const completedTasks = asyncHandler(async (req, res) => {
  const task_id = req.params.id;
  const task = await AiTask.findOne({ task_id });

  if (!task) {
    return sendResponse(res, {
      statusCode: 202,
      message: "Task is still being created",
    });
  }

  if (task.status === "failed") {
    return sendResponse(res, {
      statusCode: 400,
      message: "Image processing failed",
      data: { status: "failed" },
    });
  }

  if (task.status !== "completed") {
    return sendResponse(res, {
      statusCode: 202,
      message: "Task is not completed yet",
    });
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Task completed 121 successfully",
    data: task,
    status: "completed",
  });
});

export const fetchMeasurementPoint = asyncHandler(async (req, res) => {
  const { garment_type } = req.body;

  const url = `${process.env.AI_URL}/enhanced/measurement-points?garment_type=${encodeURIComponent(garment_type)}`;

  const response = await axios.get(url);

  sendResponse(res, {
    statusCode: 200,
    message: "Measurement point fetched successfully",
    data: response.data,
  });
});
export const fetchTaskStatus = asyncHandler(async (req, res) => {
  const { task_id } = req.body;
  const url = `${process.env.AI_URL}/task/status/${task_id}`;

  const response = await axios.get(url);

  sendResponse(res, {
    statusCode: 200,
    message: "Measurement point fetched successfully",
    data: response.data,
  });
});

export const generateSizeChartAndImage = asyncHandler(async (req, res) => {
  const {
    garment_type,
    image_url,
    task_id,
    image_status,
    market,
    unit,
    custom_size_range,
    include_grading,
    include_tolerance,
    include_conversion,
    confirmation,
    galleryImageId,
    generatedImageUrl,
    tolerance_chest,
    tolerance_waist,
    tolerance_hip,
    tolerance_length,
    tolerance_sleeve,
    tolerance_inseam,
  } = req.body;

  // Validate confirmation value if provided
  if (confirmation && confirmation !== "keepCopy" && confirmation !== "replace") {
    return sendResponse(res, {
      statusCode: 400,
      message: "Invalid confirmation value. It should be either 'keepCopy' or 'replace'.",
    });
  }

  // ✅ Use common function to resolve image source
  const { stream, filename, filePath } = await getImageStream({
    galleryImageId,
    generatedImageUrl,
    file: req.file,
  });

  // ✅ Compute MD5 hash of the uploaded file's binary data
  const fileHash = await generateFileHash(filePath);
  console.log("filehash101>>>>>>", fileHash)


  // // ✅ Check if an AiTask already exists with this hash
  // const existingTasks = await sizeChartSchema.find({ fileHash: fileHash });

  // ✅ Check if a SizeChart already exists with this hash and tenant
  let existingTasks = await sizeChartSchema.find({
    fileHash: fileHash,
    $or: [
      { tenant_id: req.user.tenant_id }, // new data with tenant_id
      { tenant_id: { $exists: false } }, // old data with no tenant_id
      { tenant_id: null } // explicitly null
    ]
  }).populate("user_id", "tenant_id");

  // ✅ Normalize: for old records, derive tenant_id from user
  existingTasks = existingTasks.filter(task => {
    if (task.tenant_id) {
      return task.tenant_id.toString() === req.user.tenant_id.toString();
    }
    // fallback for old data: check user's tenant_id
    if (task.user_id && task.user_id.tenant_id) {
      return task.user_id.tenant_id.toString() === req.user.tenant_id.toString();
    }
    return false;
  });

  if (existingTasks.length > 0 && !confirmation) {
    return sendResponse(res, {
      statusCode: 409,
      message: "This image has already been used for a size chart generation task.Please confirm if you want to replace or keep the copy?",
      data: existingTasks,
    });
  }
  console.log(image_status, 'image_statusimage_status');

  // ✅ Save to Gallery
  let galleryImage;
  if (image_status === "saved" || image_status === "finalized" || image_status === "uploaded") {
    galleryImage = await GalleryImage.findOne({
      _id: task_id,
      user_id: req.user.id,
    });
  } else if (generatedImageUrl) {
    const encryptedId = generatedImageUrl.split("/").pop();
    const decryptedUrl = galleryService.decryptImagePath(encryptedId);
    const aiTask = await AiTask.findOne({ result: decryptedUrl, user_id: req.user.id });

    if (!aiTask) {
      return sendResponse(res, {
        statusCode: 404,
        message: "AI task not found for this generated image.",
      });
    }
    aiTask.result = aiTask.result.filter((url) => url !== decryptedUrl);
    await aiTask.save();

    // ✅ Check if gallery image already exists for this url
    galleryImage = await GalleryImage.findOne({
      url: decryptedUrl,
      user_id: req.user.id,
    });

    if (galleryImage) {
      galleryImage.status = "finalized";
      await galleryImage.save();
      await deductCredits({
        tenantId: req.user.tenant_id,
        userId: req.user.tenant_id,
        creditsToDeduct: 1,
      });
    } else {
      galleryImage = await GalleryImage.create({
        url: decryptedUrl,
        name: `Generated-${aiTask?.task_id}`,
        status: "finalized",
        tenant_id: req.user.tenant_id,
        user_id: req.user.id,
        fileHash,
      });
      await deductCredits({
        tenantId: req.user.tenant_id,
        userId: req.user.tenant_id,
        creditsToDeduct: 1,
      });
    }
  } else {
    // ✅ Check if a gallery image already exists for this hash + tenant
    galleryImage = await GalleryImage.findOne({
      fileHash,
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
    });

    if (!galleryImage) {
      galleryImage = await GalleryImage.create({
        url: `${process.env.BASE_URL}/${req.file.path
          .replace(/^public[\\/]/, "")
          .replace(/\\/g, "/")}`,
        name: req.file.originalname,
        status: "uploaded",
        tenant_id: req.user.tenant_id,
        user_id: req.user.id,
        task_id: task_id,
        fileHash,
      });
    }
  }

  // ✅ Send image + data to AI service
  const formData = new FormData();
  formData.append("image", stream, { filename });
  formData.append("garment_type", garment_type);
  formData.append("market", market);
  formData.append("unit", unit);
  formData.append("custom_size_range", custom_size_range);
  formData.append("include_grading", include_grading);
  formData.append("include_tolerance", include_tolerance);
  formData.append("include_conversion", include_conversion);
  formData.append("tolerance_chest", tolerance_chest ?? "");
  formData.append("tolerance_waist", tolerance_waist ?? "");
  formData.append("tolerance_hip", tolerance_hip ?? "");
  formData.append("tolerance_length", tolerance_length ?? "");
  formData.append("tolerance_sleeve", tolerance_sleeve ?? "");
  formData.append("tolerance_inseam", tolerance_inseam ?? "");


  const response = await axios.post(
    `${process.env.AI_URL}/enhanced/size-chart/async`,
    formData,
    { headers: formData.getHeaders() }
  );

  const taskId = response.data.task_id;

  // ✅ Save the AI task along with the unique hash
  const aiTask = await AiTask.create({
    user_id: req.user.id,
    task: "size_chart",
    task_id: taskId,
    fileHash: [fileHash], // your schema defines it as an array, so store it like this
    confirmation,
    gallery_image_ids: [galleryImage._id],
    meta: {
      market,
      unit
    }
  });

  console.log('aiTAsk', aiTask)

  sendResponse(res, {
    statusCode: 200,
    message: "Size chart and image generated successfully",
    data: response.data,
  });
});
export const getSizeChart = asyncHandler(async (req, res) => {
  const { isSharedWithMe, isSharedWithOthers } = req.query;
  const user_id = req.user.id;
  const tenant_id = req.user.tenant_id;
  const user_roles = req.user.roles;

  let sizeCharts = [];

  if (isSharedWithMe === 'true') {
    // Get resources shared with this user
    sizeCharts = await ResourceAccessService.getAccessibleResources(
      "SizeChart",
      user_id,
      tenant_id,
      user_roles,
      { includeOwned: false, includeShared: true, permission: ["read"] }
    );
    console.log(sizeCharts, 'sizeChartssizeCharts');

  } else if (isSharedWithOthers === 'true') {
    // Get resources shared by this user
    sizeCharts = await ResourceAccessService.getResourcesSharedWithOthers(
      "SizeChart",
      user_id,
      { permission: ["read"] }
    );
  } else {
    // Fetch only the user's own size charts
    sizeCharts = await sizeChartSchema.find({ user_id }).sort({ created_at: -1 }).lean();
  }

  if (!sizeCharts || sizeCharts.length === 0) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Size chart not found",
    });
  }

  const sizeOrder = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', '2xl', '3xl', '4xl', '5xl'];

  const sortMeasurements = (measurements) => {
    const sortedMeasurements = {};
    Object.keys(measurements).forEach(measurementKey => {
      const measurementData = measurements[measurementKey];
      const sortedSizes = {};

      // Add sizes in defined order
      sizeOrder.forEach(size => {
        const actualKey = Object.keys(measurementData).find(
          key => key.toLowerCase() === size.toLowerCase()
        );
        if (actualKey) sortedSizes[actualKey] = measurementData[actualKey];
      });

      // Add remaining sizes
      Object.keys(measurementData).forEach(size => {
        if (!sortedSizes.hasOwnProperty(size)) sortedSizes[size] = measurementData[size];
      });

      sortedMeasurements[measurementKey] = sortedSizes;
    });
    return sortedMeasurements;
  };

  const sortedSizeCharts = sizeCharts.map(chart => {
    // Sort the measurements if they exist
    if (chart.measurements) {
      chart.measurements = sortMeasurements(chart.measurements);
    }

    // Make sure the chart ID is _id
    return {
      ...chart,
      id: chart._id, // fallback in case _id is missing
    };
  });

  sendResponse(res, {
    statusCode: 200,
    message: "Size chart fetched successfully",
    data: sortedSizeCharts,
  });
});

// export const updateSizeChart = asyncHandler(async (req, res) => {
//     const { measurements, sizeChartId } = req.body;

//     const updatedSizeChart = await sizeChartSchema.findByIdAndUpdate(
//         sizeChartId,
//         { measurements },
//         { new: true },
//     );

//     if (!updatedSizeChart) {
//         return sendResponse(res, {
//             statusCode: 404,
//             message: "Size chart not found",
//         });
//     }

//     sendResponse(res, {
//         statusCode: 200,
//         message: "Size chart updated successfully",
//         data: updatedSizeChart,
//     });
// });


export const updateSizeChart = asyncHandler(async (req, res) => {
  let { measurements, tolerance, grading_rules, size_conversion, sizeChartId, name } = req.body;
  const file = req.file;
  const user = req.user;

  const hasAccess = await ResourceAccessService.hasAccess(
    "SizeChart",
    sizeChartId,
    req.user.id,
    req.user.tenant_id,
    req.user.roles,
    ["edit"]
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to update this sizechart",
    });
  }

  // Parse measurements if it's a JSON string
  const parseJSON = (data) => {
    if (!data) return undefined;
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (err) {
        return undefined;
      }
    }
    return data;
  };

  measurements = parseJSON(measurements);
  tolerance = parseJSON(tolerance);
  grading_rules = parseJSON(grading_rules);
  size_conversion = parseJSON(size_conversion);

  const updateData = {};
  if (measurements) updateData.measurements = measurements;
  if (tolerance) updateData.tolerance = tolerance;
  if (grading_rules) updateData.grading_rules = grading_rules;
  if (size_conversion) updateData.size_conversion = size_conversion;
  if (name) updateData.name = name;

  // Fetch the original size chart to check generation_source
  const originalSizeChart = await sizeChartSchema.findById(sizeChartId);
  if (!originalSizeChart) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Size chart not found",
    });
  }

  // Handle generation_source logic
  if (originalSizeChart.generation_source === "ai_generated") {
    updateData.generation_source = "ai_generated_edited";
  }

  if (originalSizeChart.generation_source === "duplicated") {
    updateData.generation_source = "duplicated_edited";
  }


  // If a new image is uploaded
  if (file) {
    try {
      const hostUrl = process.env.BASE_URL;

      const metadata = await sharp(file.path).metadata();
      const { width, height } = metadata;

      const maxDimension = Math.max(width, height);
      const targetSize = 512;
      const scaleRatio = maxDimension > targetSize ? maxDimension / targetSize : 1;
      const resizedWidth = Math.round(width / scaleRatio);
      const resizedHeight = Math.round(height / scaleRatio);

      const ext = path.extname(file.originalname);
      const resizedFileName = `${path.basename(file.originalname, ext)}_resized${ext}`;
      const resizedFilePath = path.join("public/uploads/moodboards", resizedFileName);

      const resizedBuffer = await sharp(file.path)
        .resize(resizedWidth, resizedHeight, {
          fit: "fill",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      await fspromise.writeFile(resizedFilePath, resizedBuffer);

      const galleryImage = await GalleryImage.create({
        url: `${hostUrl}/uploads/moodboards/${resizedFileName}`,
        name: file.originalname,
        description: "Size chart image",
        status: "uploaded",
        tenant_id: user.tenant_id,
        user_id: user.id,
        project_id: null,
      });

      updateData.results = [galleryImage.url];

      // ✅ Fix deduplication of gallery_image_ids
      const existingIds = originalSizeChart.gallery_image_ids.map((id) => String(id));
      const uniqueIds = [...new Set([...existingIds, String(galleryImage._id)])];
      updateData.gallery_image_ids = uniqueIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      setTimeout(async () => {
        try {
          await fspromise.unlink(file.path);
        } catch (err) {
          console.warn("Failed to delete original image:", err.message);
        }
      }, 500);
    } catch (error) {
      console.error("Image processing error:", error);
      return sendResponse(res, {
        statusCode: 500,
        message: "Image processing failed",
      });
    }
  }

  const updatedSizeChart = await sizeChartSchema.findByIdAndUpdate(
    sizeChartId,
    updateData,
    { new: true }
  );

  return sendResponse(res, {
    statusCode: 200,
    message: "Size chart updated successfully",
    data: updatedSizeChart,
  });
});


export const getLatestUnseenTask = asyncHandler(async (req, res) => {
  const user_id = req?.user?.id;
  const task_type = req?.body?.task_type;

  if (!task_type) {
    return sendResponse(res, {
      statusCode: 400,
      message: "Task type is required",
    });
  }

  const latestTask = await AiTask.findOne({
    user_id,
    hasSeen: false,
    task: task_type,
  }).sort({ createdAt: -1 });

  let sizeChartData = null;
  let patternCutout = null;
  let colorAnalysis = null;
  let techPackData = null;
  if (task_type === "size_chart") {
    sizeChartData = await sizeChartSchema.findOne({
      user_id,
      // status: { $in: ["completed", "failed","queued"] },
      status: { $in: ["completed", "failed"] },
      task_id: latestTask?.task_id,
    });

    // // Override image result in latestTask if image found
    // if (sizeChartData?.results?.length) {
    //     latestTask.result = sizeChartData.results;
    // }
  } else if (task_type === 'pattern_cutout') {
    patternCutout = await Cutout.findOne({
      user_id,
      status: { $in: ["completed", "failed"] },
      task_id: latestTask?.task_id,
    }).populate("gallery_image_ids")
  } else if (task_type === 'color_analysis') {
    colorAnalysis = await ColorAnalysis.findOne({
      user_id,
      success: true,
      task_id: latestTask?.task_id,
    }).populate("gallery_image_ids")
  } else if (task_type === "tech_packs") {
    // Fetch TechPack document
    techPackData = await TechPack.findOne({
      user_id,
      status: { $in: ["completed", "failed"] },
      task_id: latestTask?.task_id,
    });

    // Optionally override result with tech pack data
    if (techPackData) {
      latestTask.result = {
        analysis: techPackData.analysis || {},
        tech_pack: techPackData.tech_pack || {}
      };
    }
  }

  if (task_type === "sketch_to_image" && latestTask) {
    const galleryImages = await GalleryImage.find({
      task_id: latestTask.task_id,
      user_id: user_id
    });
    latestTask.result = galleryImages.map(image => image.url);
  }

  if (!latestTask) {
    return sendResponse(res, {
      statusCode: 200,
      message: "No unseen tasks found",
    });
  }
  // Encrypt image URLs
  if (Array.isArray(latestTask.result) && task_type !== "sketch_to_image") {
    latestTask.result = latestTask.result.map((url) =>
      galleryService.encryptImagePath(url)
    );
  }

  let responseData = { latestTask };
  if (sizeChartData) {
    responseData.sizeChartData = sizeChartData;
  }
  if (patternCutout) {
    responseData.patternCutout = patternCutout;
  }
  if (colorAnalysis) {
    responseData.colorAnalysis = colorAnalysis;
  }
  if (techPackData) {
    responseData.techPackData = techPackData;
  }
  sendResponse(res, {
    statusCode: 200,
    message: "Latest unseen task fetched successfully",
    data: responseData,
  });
});


// controllers/imageVariationController.js

export const getCutouts = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  // ✅ Extract pagination parameters from query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // ✅ Build query
  const query = { user_id, is_deleted: false };

  // ✅ Get total count for pagination
  const totalCutouts = await Cutout.countDocuments(query);

  // ✅ Fetch paginated cutouts
  const cutouts = await Cutout.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .populate('gallery_image_ids');

  // ✅ Calculate pagination metadata
  const totalPages = Math.ceil(totalCutouts / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // if (!cutouts || cutouts.length === 0) {
  //   return sendResponse(res, {
  //     statusCode: 404,
  //     message: "No cutouts found",
  //     data: {
  //       cutouts: [],
  //       pagination: {
  //         currentPage: page,
  //         totalPages: 0,
  //         totalItems: 0,
  //         itemsPerPage: limit,
  //         hasNextPage: false,
  //         hasPrevPage: false,
  //       },
  //     },
  //   });
  // }

  sendResponse(res, {
    statusCode: 200,
    message: "Cutouts fetched successfully",
    data: {
      cutouts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCutouts,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    },
  });
});

// DELETE /cutouts/:id
export const deleteCutoutDoc = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  // ✅ Find the cutout belonging to the user
  const cutout = await Cutout.findOne({ _id: id, user_id });

  if (!cutout) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Cutout not found or you don't have permission to delete it",
    });
  }

  // ✅ Hard delete the document
  await Cutout.deleteOne({ _id: id });

  // ✅ Send standardized response
  sendResponse(res, {
    statusCode: 200,
    message: "Cutout deleted successfully",
  });
});


export const analyzeColors = asyncHandler(async (req, res) => {
  try {
    const { include_harmony, include_fashion_insights, save_palette, palette_name } = req.body;
    const file = req.file; // assuming file is uploaded via multer

    if (!file) {
      return sendResponse(res, {
        statusCode: 400,
        message: "No file uploaded",
      });
    }

    // ✅ Prepare multipart/form-data
    const formData = new FormData();
    formData.append("file", fs.createReadStream(file.path));
    formData.append("include_harmony", include_harmony || "true");
    formData.append("include_fashion_insights", include_fashion_insights || "true");
    formData.append("save_palette", save_palette || "true");
    formData.append("palette_name", palette_name || "test");

    // ✅ Send to the external API
    const response = await axios.post(
      "https://ai.design-genie.ai/api/colors/analyze/async",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://ai.design-genie.ai/color-analysis.html",
        },
      }
    );

    // ✅ Send back the result
    sendResponse(res, {
      statusCode: 200,
      message: "Color analysis request sent successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Color Analysis Error:", error.response?.data || error.message);

    sendResponse(res, {
      statusCode: error.response?.status || 500,
      message: "Failed to analyze colors",
      data: error.response?.data || {},
    });
  }
});

export const getTechpacks = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  // ✅ Extract pagination parameters from query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // ✅ Optional: allow filtering by status or generation_source
  const { status, generation_source } = req.query;

  // ✅ Build query
  const query = { user_id, is_deleted: false };
  if (status) query.status = status;
  if (generation_source) query.generation_source = generation_source;

  // ✅ Get total count
  const totalTechpacks = await TechPack.countDocuments(query);

  // ✅ Fetch paginated tech packs
  const techpacks = await TechPack.find(query)
    .sort({ createdAt: -1 }) // sort by creation date
    .skip(skip)
    .limit(limit)
    .lean()
    .populate("gallery_image_ids")
    .populate("notes"); // populate techpack-level notes

  // ✅ Calculate pagination metadata
  const totalPages = Math.ceil(totalTechpacks / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // ✅ Success response
  return sendResponse(res, {
    statusCode: 200,
    message: "Tech packs fetched successfully",
    data: {
      techpacks,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalTechpacks,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    },
  });
});

export const getTechpackById = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  // Validate ID format (assuming MongoDB ObjectId)
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return sendResponse(res, {
      statusCode: 400,
      message: "Invalid tech pack ID format",
    });
  }

  // Find the tech pack
  const techpack = await TechPack.findOne({
    _id: id,
    user_id,
    is_deleted: false,
  })
    .lean()
    .populate("gallery_image_ids")
    .populate("notes");

  // Check if tech pack exists
  if (!techpack) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Tech pack not found or you don't have permission to view it",
    });
  }

  // Success response
  return sendResponse(res, {
    statusCode: 200,
    message: "Tech pack fetched successfully",
    data: techpack,
  });
});


// Helper function to clean up uploaded files on error
const cleanupUploadedFiles = async (files) => {
  if (!files) return;

  try {
    // Clean up image files
    if (files.image) {
      for (const file of files.image) {
        await deleteFileFromStorage(file.path);
      }
    }

    // Clean up additional files
    if (files.files) {
      for (const file of files.files) {
        await deleteFileFromStorage(file.path);
      }
    }
  } catch (error) {
    console.error("Error cleaning up uploaded files:", error);
  }
};


export const createManualTechPack = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const tenant_id = req.user.tenant_id;

  try {
    // Parse the tech pack data from FormData
    const techPackData = JSON.parse(req.body.tech_pack_data);
    const { galleryImageId, generatedImageUrl, projectImageUrl, projectImageId } = req.body;

    const {
      task_id,
      status = "queued",
      generation_source = "manual",
      tech_pack,
      analysis = {},
      notes = []
    } = techPackData;

    // Validate required fields
    if (!task_id || !tech_pack) {
      // Clean up uploaded files if validation fails
      await cleanupUploadedFiles(req.files);

      return sendResponse(res, {
        statusCode: 400,
        message: "Task ID and tech pack data are required",
      });
    }

    // Check if task_id already exists
    const existingTechPack = await TechPack.findOne({ task_id });
    if (existingTechPack) {
      // Clean up uploaded files if tech pack already exists
      await cleanupUploadedFiles(req.files);

      return sendResponse(res, {
        statusCode: 400,
        message: "Tech pack with this task ID already exists",
      });
    }

    // Handle main image (existing image handling code)
    let galleryImage;
    let stream, filename, fileHash;

    // Check if there's an uploaded image file
    const imageFile = req.files?.image?.[0] || req.file;

    if (projectImageUrl) {
      try {
        const response = await axios.get(projectImageUrl, {
          responseType: 'stream'
        });

        stream = response.data;
        filename = projectImageUrl.split('/').pop() || 'project-image.jpg';

        galleryImage = await GalleryImage.create({
          url: projectImageUrl,
          name: filename,
          status: "uploaded",
          tenant_id: tenant_id,
          user_id: user_id,
          project_image_id: projectImageId || null,
        });

      } catch (error) {
        console.error("Error fetching project image:", error);
        await cleanupUploadedFiles(req.files);
        return sendResponse(res, {
          statusCode: 400,
          message: "Failed to fetch project image from URL",
        });
      }
    } else {
      // Use existing getImageStream utility with the image file
      const imageData = await getImageStream({
        galleryImageId,
        generatedImageUrl,
        file: imageFile,
      });

      stream = imageData.stream;
      filename = imageData.filename;
      fileHash = imageData.fileHash;

      if (generatedImageUrl) {
        // Handle generated image case (existing code)
        const encryptedId = generatedImageUrl.split("/").pop();
        const decryptedUrl = galleryService.decryptImagePath(encryptedId);

        const aiTask = await AiTask.findOne({
          result: decryptedUrl,
          user_id: user_id,
        });

        if (!aiTask) {
          await cleanupUploadedFiles(req.files);
          return sendResponse(res, {
            statusCode: 404,
            message: "AI task not found for this generated image.",
          });
        }

        if (Array.isArray(aiTask.result)) {
          aiTask.result = aiTask.result.filter((url) => url !== decryptedUrl);
          await aiTask.save();
        }

        galleryImage = await GalleryImage.create({
          url: decryptedUrl,
          name: `Generated-${aiTask?.task_id}`,
          status: "finalized",
          tenant_id: tenant_id,
          user_id: user_id,
          fileHash,
        });

      } else if (imageFile) {
        // Handle uploaded image file
        const imageUrl = `${process.env.BASE_URL}/${imageFile.path
          .replace(/^public[\\/]/, "")
          .replace(/\\/g, "/")}`;

        galleryImage = await GalleryImage.create({
          url: imageUrl,
          name: imageFile.originalname,
          status: "uploaded",
          tenant_id: tenant_id,
          user_id: user_id,
        });
      } else if (galleryImageId) {
        // Handle existing gallery image
        const existingImage = await GalleryImage.findById(galleryImageId);

        if (!existingImage) {
          await cleanupUploadedFiles(req.files);
          return sendResponse(res, {
            statusCode: 404,
            message: "Gallery image not found.",
          });
        }

        galleryImage = existingImage;
      }
    }

    // Transform the tech_pack data (existing transformation code)
    const transformedTechPack = {
      product_overview: {
        style_name: tech_pack.product_overview?.style_name || "",
        style_number: tech_pack.product_overview?.style_number || "",
        garment_type: tech_pack.product_overview?.garment_type || "",
        season: tech_pack.product_overview?.season || "",
        gender: tech_pack.product_overview?.gender || "",
        revision: tech_pack.product_overview?.revision || "1.0",
        description: tech_pack.product_overview?.description || "",
        date_created: new Date().toISOString().split('T')[0]
      },
      general_info: {
        market: tech_pack.general_info?.market || "",
        designer: tech_pack.general_info?.designer || "",
        season: tech_pack.general_info?.season || tech_pack.product_overview?.season || ""
      },
      suggested_fabrics_and_trims: {
        main_fabric: {
          composition: tech_pack.suggested_fabrics_and_trims?.main_fabric?.composition || "",
          weight: tech_pack.suggested_fabrics_and_trims?.main_fabric?.weight || "",
          characteristics: tech_pack.suggested_fabrics_and_trims?.main_fabric?.characteristics || "",
          supplier: tech_pack.suggested_fabrics_and_trims?.main_fabric?.supplier || ""
        },
        secondary_fabrics: [],
        trims: tech_pack.suggested_fabrics_and_trims?.trims?.map(trim =>
          typeof trim === 'string' ? { name: trim, description: trim } : trim
        ) || []
      },
      prints_and_embellishments: {
        print_techniques: tech_pack.prints_and_embellishments?.print_techniques || [],
        embellishments: tech_pack.prints_and_embellishments?.embellishments || [],
        placements: tech_pack.prints_and_embellishments?.placements || []
      },
      construction_notes: {
        seam_types: tech_pack.construction_notes?.seam_types || [],
        stitch_details: tech_pack.construction_notes?.stitch_details || [],
        special_techniques: tech_pack.construction_notes?.special_techniques || [],
        assembly_sequence: tech_pack.construction_notes?.assembly_sequence || []
      },
      packaging_instructions: {
        care_label_instructions: tech_pack.packaging_instructions?.care_label_instructions || [],
        polybag_packaging: {
          type: tech_pack.packaging_instructions?.polybag_packaging?.type || "",
          folding: tech_pack.packaging_instructions?.polybag_packaging?.folding || "",
          accessories: tech_pack.packaging_instructions?.polybag_packaging?.accessories || ""
        },
        master_packaging: {
          quantity: tech_pack.packaging_instructions?.master_packaging?.quantity || "",
          bundling: tech_pack.packaging_instructions?.master_packaging?.bundling || "",
          protection: tech_pack.packaging_instructions?.master_packaging?.protection || ""
        },
        carton_packing: {
          quantity: tech_pack.packaging_instructions?.carton_packing?.quantity || "",
          dimensions: tech_pack.packaging_instructions?.carton_packing?.dimensions || "",
          carton_marking: tech_pack.packaging_instructions?.carton_packing?.carton_marking || ""
        }
      },
      materials: {
        material_composition: tech_pack.materials?.material_composition || "",
        material_properties: [],
        primary_material: ""
      },
      measurements: {
        fit_type: tech_pack.measurements?.fit_type || "",
        measurement_points: tech_pack.measurements?.measurement_points || [],
        size_chart: []
      },
      colors: tech_pack.colors || {}
    };

    // Create default analysis structure
    const defaultAnalysis = {
      construction_analysis: {
        closures: [],
        finishing: [],
        pockets: [],
        seams: [],
        special_construction: [],
        stitching: []
      },
      description: tech_pack.product_overview?.description || "",
      fabric_analysis: {
        care_instructions: [],
        color: "",
        composition: tech_pack.suggested_fabrics_and_trims?.main_fabric?.composition || "",
        construction: "",
        weight: tech_pack.suggested_fabrics_and_trims?.main_fabric?.weight || ""
      },
      garment_type: tech_pack.product_overview?.garment_type || "",
      gender: tech_pack.product_overview?.gender || "",
      packaging_analysis: {
        special_requirements: []
      }
    };

    // Process uploaded files
    const uploadedFiles = [];
    if (req.files?.files && req.files.files.length > 0) {
      for (const file of req.files.files) {
        const fileUrl = generateFileUrl(file.path, process.env.BASE_URL);
        const fileCategory = getFileCategory(file.mimetype);

        const fileData = {
          file_url: fileUrl,
          file_name: file.originalname,
          file_type: fileCategory,
          file_size: file.size,
          mime_type: file.mimetype,
          file_path: file.path,
          uploaded_by: user_id,
          uploaded_at: new Date(),
          metadata: getFileMetadata(file),
        };

        uploadedFiles.push(fileData);

        console.log(`[TechPack] File prepared for upload: ${file.originalname}`);
      }
    }

    // Create new tech pack with gallery image reference and uploaded files
    const newTechPack = new TechPack({
      user_id,
      tenant_id,
      task_id,
      status,
      generation_source,
      tech_pack: transformedTechPack,
      analysis: analysis.description ? analysis : defaultAnalysis,
      gallery_image_ids: galleryImage ? [galleryImage._id] : [],
      uploaded_files: uploadedFiles, // Add uploaded files here
      is_deleted: false
    });

    // Save to database
    const savedTechPack = await newTechPack.save();

    // Create and save notes if they exist (existing notes code)
    if (notes && notes.length > 0) {
      const createdNotes = [];

      for (const noteData of notes) {
        try {
          let transformedItems = [];

          switch (noteData.type) {
            case 'general':
              transformedItems = noteData.items.map(item => ({
                text: item.text || '',
                sequence: item.sequence || 1
              }));
              break;

            case 'sequential':
              const transformSequentialItems = (items) => {
                return items.map(item => ({
                  text: item.text || '',
                  sequence: item.sequence || 1,
                  subNotes: item.subNotes ? transformSequentialItems(item.subNotes) : []
                }));
              };
              transformedItems = transformSequentialItems(noteData.items);
              break;

            case 'time_logs':
              transformedItems = noteData.items.map(item => ({
                datetime: new Date(item.datetime),
                text: item.text || '',
                sequence: item.sequence || 1
              }));
              break;

            case 'checklist':
              transformedItems = noteData.items.map(item => ({
                text: item.text || '',
                checked: item.checked || false,
                sequence: item.sequence || 1,
                reference_asset_id: item.reference_asset_id || null
              }));
              break;
          }

          const newNote = new Note({
            techpack_id: savedTechPack._id,
            user_id,
            project_id: null,
            type: noteData.type,
            name: noteData.name || getDefaultNoteName(noteData.type),
            summary: noteData.summary || null,
            items: transformedItems,
            is_deleted: false
          });

          const savedNote = await newNote.save();
          createdNotes.push(savedNote._id);

        } catch (noteError) {
          console.error(`Error creating note of type ${noteData.type}:`, noteError);
        }
      }

      if (createdNotes.length > 0) {
        savedTechPack.notes = createdNotes;
        await savedTechPack.save();
      }
    }

    // Populate gallery images and notes
    await savedTechPack.populate(['gallery_image_ids', 'notes']);

    return sendResponse(res, {
      statusCode: 201,
      message: "Tech pack created successfully",
      data: {
        ...savedTechPack.toObject(),
        uploaded_files_count: uploadedFiles.length
      },
    });

  } catch (error) {
    console.error("Error creating manual tech pack:", error);

    // Clean up uploaded files on error
    await cleanupUploadedFiles(req.files);

    return sendResponse(res, {
      statusCode: 500,
      message: "Failed to create tech pack",
      error: error.message
    });
  }
});

const getDefaultNoteName = (type) => {
  const defaultNames = {
    general: "General Notes",
    sequential: "Sequential Notes",
    time_logs: "Time Logs",
    checklist: "Checklist"
  };
  return defaultNames[type] || "New Note";
};

export const duplicateTechPack = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const tenant_id = req.user.tenant_id;
  const { id } = req.params;

  // Validate ID format
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return sendResponse(res, {
      statusCode: 400,
      message: "Invalid tech pack ID format",
    });
  }

  try {
    // Find the original tech pack
    const originalTechPack = await TechPack.findOne({
      _id: id,
      user_id,
      is_deleted: false,
    })
      .lean()
      .populate("gallery_image_ids")
      .populate("notes");

    // Check if tech pack exists
    if (!originalTechPack) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech pack not found or you don't have permission to duplicate it",
      });
    }

    // Generate new task_id for the duplicate
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newTaskId = `${originalTechPack.task_id}_copy_${timestamp}_${randomSuffix}`;

    // Update product overview with "Copy" appended to style name
    const duplicatedTechPack = {
      ...originalTechPack.tech_pack,
      product_overview: {
        ...originalTechPack.tech_pack.product_overview,
        style_name: `${originalTechPack.tech_pack.product_overview?.style_name || "Untitled"} - Copy`,
        date_created: new Date().toISOString().split('T')[0],
        revision: "1.0" // Reset revision for copy
      }
    };

    // Create the duplicated tech pack
    const newTechPack = new TechPack({
      user_id,
      tenant_id,
      task_id: newTaskId,
      status: originalTechPack.status,
      generation_source: "manual", // Mark duplicates as manual
      tech_pack: duplicatedTechPack,
      analysis: originalTechPack.analysis,
      gallery_image_ids: originalTechPack.gallery_image_ids?.map(img => img._id) || [],
      is_deleted: false,
      notes: [] // Will be populated after creating duplicate notes
    });

    // Save the duplicated tech pack
    const savedTechPack = await newTechPack.save();

    // Duplicate notes if they exist
    const duplicatedNoteIds = [];

    if (originalTechPack.notes && originalTechPack.notes.length > 0) {
      for (const originalNote of originalTechPack.notes) {
        try {
          // Create a deep copy of items based on note type
          let duplicatedItems = [];

          switch (originalNote.type) {
            case 'general':
              duplicatedItems = originalNote.items.map(item => ({
                text: item.text,
                sequence: item.sequence
              }));
              break;

            case 'sequential':
              // Recursive function to duplicate sequential items with subnotes
              const duplicateSequentialItems = (items) => {
                return items.map(item => ({
                  text: item.text,
                  sequence: item.sequence,
                  subNotes: item.subNotes ? duplicateSequentialItems(item.subNotes) : []
                }));
              };
              duplicatedItems = duplicateSequentialItems(originalNote.items);
              break;

            case 'time_logs':
              duplicatedItems = originalNote.items.map(item => ({
                datetime: new Date(item.datetime),
                text: item.text,
                sequence: item.sequence
              }));
              break;

            case 'checklist':
              duplicatedItems = originalNote.items.map(item => ({
                text: item.text,
                checked: false, // Reset checked status for duplicates
                sequence: item.sequence,
                reference_asset_id: item.reference_asset_id || null
              }));
              break;
          }

          // Create the duplicated note
          const duplicatedNote = new Note({
            techpack_id: savedTechPack._id,
            user_id,
            project_id: originalNote.project_id || null,
            type: originalNote.type,
            name: `${originalNote.name} - Copy`,
            summary: originalNote.summary || null,
            items: duplicatedItems,
            is_deleted: false
          });

          const savedNote = await duplicatedNote.save();
          duplicatedNoteIds.push(savedNote._id);

        } catch (noteError) {
          console.error(`Error duplicating note of type ${originalNote.type}:`, noteError);
          // Continue with other notes even if one fails
        }
      }

      // Update the tech pack with the duplicated note references
      if (duplicatedNoteIds.length > 0) {
        savedTechPack.notes = duplicatedNoteIds;
        await savedTechPack.save();
      }
    }

    // Populate the saved tech pack with gallery images and notes
    await savedTechPack.populate(['gallery_image_ids', 'notes']);

    return sendResponse(res, {
      statusCode: 201,
      message: "Tech pack duplicated successfully",
      data: savedTechPack,
    });

  } catch (error) {
    console.error("Error duplicating tech pack:", error);
    return sendResponse(res, {
      statusCode: 500,
      message: "Failed to duplicate tech pack",
      error: error.message
    });
  }
});

export const updateManualTechPack = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const tenant_id = req.user.tenant_id;
  const techPackId = req.params.id;

  try {
    // Direct access to body since it's JSON
    console.log('Request body:', req.body);

    const {
      task_id,
      status,
      generation_source,
      tech_pack,
      analysis,
      notes = []
    } = req.body;

    // Find existing tech pack
    const existingTechPack = await TechPack.findOne({
      _id: techPackId,
      user_id,
      tenant_id,
      is_deleted: false
    });

    if (!existingTechPack) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Tech pack not found",
      });
    }

    // Check if task_id is being changed and if it already exists
    if (task_id !== existingTechPack.task_id) {
      const duplicateTechPack = await TechPack.findOne({
        task_id,
        _id: { $ne: techPackId }
      });

      if (duplicateTechPack) {
        return sendResponse(res, {
          statusCode: 400,
          message: "Tech pack with this task ID already exists",
        });
      }
    }

    // Transform the tech_pack data
    const transformedTechPack = {
      product_overview: {
        style_name: tech_pack.product_overview?.style_name || "",
        style_number: tech_pack.product_overview?.style_number || "",
        garment_type: tech_pack.product_overview?.garment_type || "",
        season: tech_pack.product_overview?.season || "",
        gender: tech_pack.product_overview?.gender || "",
        revision: tech_pack.product_overview?.revision || existingTechPack.tech_pack.product_overview.revision,
        description: tech_pack.product_overview?.description || "",
        date_created: tech_pack.product_overview?.date_created || existingTechPack.tech_pack.product_overview.date_created
      },
      general_info: {
        market: tech_pack.general_info?.market || "",
        designer: tech_pack.general_info?.designer || "",
        season: tech_pack.general_info?.season || tech_pack.product_overview?.season || ""
      },
      suggested_fabrics_and_trims: {
        main_fabric: {
          composition: tech_pack.suggested_fabrics_and_trims?.main_fabric?.composition || "",
          weight: tech_pack.suggested_fabrics_and_trims?.main_fabric?.weight || "",
          characteristics: tech_pack.suggested_fabrics_and_trims?.main_fabric?.characteristics || "",
          supplier: tech_pack.suggested_fabrics_and_trims?.main_fabric?.supplier || ""
        },
        secondary_fabrics: tech_pack.suggested_fabrics_and_trims?.secondary_fabrics || [],
        trims: tech_pack.suggested_fabrics_and_trims?.trims?.map(trim =>
          typeof trim === 'string' ? { name: trim, description: trim } : trim
        ) || []
      },
      prints_and_embellishments: {
        print_techniques: tech_pack.prints_and_embellishments?.print_techniques || [],
        embellishments: tech_pack.prints_and_embellishments?.embellishments || [],
        placements: tech_pack.prints_and_embellishments?.placements || []
      },
      construction_notes: {
        seam_types: tech_pack.construction_notes?.seam_types || [],
        stitch_details: tech_pack.construction_notes?.stitch_details || [],
        special_techniques: tech_pack.construction_notes?.special_techniques || [],
        assembly_sequence: tech_pack.construction_notes?.assembly_sequence || []
      },
      packaging_instructions: {
        care_label_instructions: tech_pack.packaging_instructions?.care_label_instructions || [],
        polybag_packaging: {
          type: tech_pack.packaging_instructions?.polybag_packaging?.type || "",
          folding: tech_pack.packaging_instructions?.polybag_packaging?.folding || "",
          accessories: tech_pack.packaging_instructions?.polybag_packaging?.accessories || ""
        },
        master_packaging: {
          quantity: tech_pack.packaging_instructions?.master_packaging?.quantity || "",
          bundling: tech_pack.packaging_instructions?.master_packaging?.bundling || "",
          protection: tech_pack.packaging_instructions?.master_packaging?.protection || ""
        },
        carton_packing: {
          quantity: tech_pack.packaging_instructions?.carton_packing?.quantity || "",
          dimensions: tech_pack.packaging_instructions?.carton_packing?.dimensions || "",
          carton_marking: tech_pack.packaging_instructions?.carton_packing?.carton_marking || ""
        }
      },
      materials: {
        material_composition: tech_pack.materials?.material_composition || "",
        material_properties: tech_pack.materials?.material_properties || [],
        primary_material: tech_pack.materials?.primary_material || ""
      },
      measurements: {
        fit_type: tech_pack.measurements?.fit_type || "",
        measurement_points: tech_pack.measurements?.measurement_points || [],
        size_chart: tech_pack.measurements?.size_chart || []
      },
      colors: tech_pack.colors || {}
    };

    // Update tech pack fields
    existingTechPack.task_id = task_id || existingTechPack.task_id;
    existingTechPack.status = status || existingTechPack.status;
    existingTechPack.generation_source = generation_source || existingTechPack.generation_source;
    existingTechPack.tech_pack = transformedTechPack;
    existingTechPack.analysis = analysis || existingTechPack.analysis;

    // Handle notes update
    if (notes && notes.length > 0) {
      console.log('Processing notes:', JSON.stringify(notes, null, 2));

      // Delete existing notes
      await Note.deleteMany({ techpack_id: techPackId });

      const createdNotes = [];

      for (const noteData of notes) {
        try {
          console.log(`Processing note of type: ${noteData.type}`);

          // Transform items based on note type
          let transformedItems = [];

          switch (noteData.type) {
            case 'general':
              transformedItems = noteData.items.map((item, index) => ({
                text: item.text || '',
                sequence: item.sequence || index + 1
              }));
              break;

            case 'sequential':
              const transformSequentialItems = (items) => {
                return items.map((item, index) => ({
                  text: item.text || '',
                  sequence: item.sequence || index + 1,
                  subNotes: item.subNotes ? transformSequentialItems(item.subNotes) : []
                }));
              };
              transformedItems = transformSequentialItems(noteData.items);
              break;

            case 'time_logs':
              transformedItems = noteData.items.map((item, index) => ({
                datetime: new Date(item.datetime),
                text: item.text || '',
                sequence: item.sequence || index + 1
              }));
              break;

            case 'checklist':
              transformedItems = noteData.items.map((item, index) => ({
                text: item.text || '',
                checked: Boolean(item.checked),
                sequence: item.sequence || index + 1,
                reference_asset_id: item.reference_asset_id || null
              }));
              break;
          }

          console.log(`Transformed items for ${noteData.type}:`, transformedItems);

          // Create note document
          const newNote = new Note({
            techpack_id: existingTechPack._id,
            user_id,
            project_id: noteData.project_id || null,
            type: noteData.type,
            name: noteData.name || getDefaultNoteName(noteData.type),
            summary: noteData.summary || null,
            items: transformedItems,
            is_deleted: false
          });

          const savedNote = await newNote.save();
          createdNotes.push(savedNote._id);
          console.log(`Note saved successfully: ${savedNote._id}`);

        } catch (noteError) {
          console.error(`Error creating note of type ${noteData.type}:`, noteError);
        }
      }

      // Update tech pack with new note references
      existingTechPack.notes = createdNotes;
    } else {
      // If no notes provided, clear existing notes
      await Note.deleteMany({ techpack_id: techPackId });
      existingTechPack.notes = [];
    }

    // Save updated tech pack
    const updatedTechPack = await existingTechPack.save();

    // Populate gallery images and notes
    await updatedTechPack.populate(['gallery_image_ids', 'notes']);

    return sendResponse(res, {
      statusCode: 200,
      message: "Tech pack updated successfully",
      data: updatedTechPack,
    });

  } catch (error) {
    console.error("Error updating manual tech pack:", error);
    return sendResponse(res, {
      statusCode: 500,
      message: "Failed to update tech pack",
      error: error.message
    });
  }
});

export const markTasksAsSeen = asyncHandler(async (req, res) => {
  const { task_id } = req.body; // string or array

  if (!task_id || (Array.isArray(task_id) && task_id.length === 0)) {
    return sendResponse(res, {
      statusCode: 400,
      message: "No task IDs provided",
    });
  }

  const idsToUpdate = Array.isArray(task_id) ? task_id : [task_id];
  const firstTask = await AiTask.findOne({ task_id: idsToUpdate[0] });

  if (!firstTask) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Task not found",
    });
  }

  const { user_id, task } = firstTask;

  const result = await AiTask.updateMany(
    { user_id, task },
    { hasSeen: true }
  );

  return sendResponse(res, {
    statusCode: 200,
    message: `${result.modifiedCount} '${task}' task(s) marked as seen for this user`,
  });
});

export const submitReview = asyncHandler(async (req, res) => {
  try {
    const { improvement, liked_about_app, price_option } = req.body;
    const user = await User.findById(req.user.id)
      .populate("tenant_id")
      .exec();
    let credit = await UserCredits.findOne({ user_id: req.user.id });
    if (!credit) {
      credit = new UserCredits({
        tenant_id: req.user.tenant_id,
        user_id: req.user.id,
      });
      await credit.save();
    }
    console.log(user, 'user')

    const response = await axios.post(
      `${process.env.STRAPI_URL}/api/feedbacks`,
      {
        data: {
          improvement,
          liked_about_app,
          price_option,
          user_email: user.email,
          user_signup_date: new Date(user.created_at).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          feedback_date: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          credits_used_till_now: credit.credits_used || 0,
          size_charts_created_till_now: credit.sizeChartGenerated || 0,
          tenant: user.tenant_id?.name || "N/A",
          user_name: user.full_name,
        }


      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` // from logged-in user
        }
      }

    );
    console.log(response.status, "stasta")
    if (response.status === 201) {
      credit.creditUsedSinceLastReview = 0;
      credit.sizeChartsSinceLastReview = 0;
      await credit.save()

      try {
        await sendFeedbackReceivedEmail(user, {
          user_email: user.email,
          feedback_date: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      } catch (error) {
        console.error("Failed to send feedback email:", error.message);
      }


      return sendResponse(res, {
        statusCode: 200,
        message: `feedback added for this user`,
      });



    } else {
      return sendResponse(res, {
        statusCode: 500,
        message: `Something went wrong`,
      });
    }
  } catch (error) {
    console.log(error)

    return sendResponse(res, {
      statusCode: 500,
      message: error.response?.data?.error?.message || "Internal Server Error",
    });
  }

});


export const copySizeChartToGalleryImages = asyncHandler(async (req, res) => {
  const { size_chart_id, gallery_image_ids } = req.body;
  const user_id = req.user.id;

  // 1. Validate request payload
  if (!size_chart_id || !Array.isArray(gallery_image_ids) || gallery_image_ids.length === 0) {
    return sendResponse(res, {
      statusCode: 400,
      message: "Size chart ID and at least one gallery image ID are required.",
    });
  }

  // 2. Fetch and validate original size chart
  const originalSizeChart = await sizeChartSchema.findOne({ _id: size_chart_id, user_id });
  if (!originalSizeChart) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Original size chart not found.",
    });
  }

  // 3. Validate gallery images in one DB query
  const validGalleryImages = await GalleryImage.find({
    _id: { $in: gallery_image_ids },
    user_id,
  }).select("_id");

  const validGalleryImageIds = validGalleryImages.map(img => img._id.toString());

  const missingImageIds = gallery_image_ids.filter(
    id => !validGalleryImageIds.includes(id)
  );

  if (missingImageIds.length > 0) {
    return sendResponse(res, {
      statusCode: 404,
      message: `Some gallery images not found: ${missingImageIds.join(", ")}`,
    });
  }

  // 4. Prepare cloned size charts
  const clonedSizeChartsData = validGalleryImageIds.map((galleryImageId) => ({
    user_id,
    tenant_id: originalSizeChart.tenant_id,
    task_id: new mongoose.Types.ObjectId().toString(),
    status: originalSizeChart.status,
    measurements: originalSizeChart.measurements,
    results: originalSizeChart.results,
    // gallery_image_id: galleryImageId,
    gallery_image_ids: [galleryImageId],
    generation_source: "duplicated",
  }));

  // 5. Insert all cloned size charts at once (faster than saving individually)
  const clonedSizeCharts = await sizeChartSchema.insertMany(clonedSizeChartsData);

  return sendResponse(res, {
    statusCode: 201,
    message: "Size chart duplicated and linked to gallery images successfully.",
    data: clonedSizeCharts,
  });
});


// Abort Task
export const abortTask = asyncHandler(async (req, res) => {
  try {
    const { taskId } = req.params;

    // Delete AiTask from DB
    const deleted = await AiTask.findOneAndDelete({
      task_id: taskId,
      user_id: req.user.id,
    });

    if (!deleted) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Task not found or already completed",
      });
    }

    sendResponse(res, {
      statusCode: 200,
      message: "Task aborted successfully",
    });
  } catch (err) {
    console.error("Abort error:", err);
    sendResponse(res, {
      statusCode: 500,
      message: "Failed to abort task",
    });
  }
});


// sizechart as template
export const saveAsTemplate = asyncHandler(async (req, res) => {
  const { sizeChartId, template_name } = req.body;
  const user = req.user;

  // Fetch the size chart
  const sizeChart = await sizeChartSchema.findOne({
    _id: sizeChartId,
    user_id: user.id,
  });

  if (!sizeChart) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Size chart not found",
    });
  }

  // Helper: wipe values but keep keys
  const wipeValues = (table, isNested = true) => {
    if (!table || typeof table !== "object") return {};
    const result = {};

    for (const [rowKey, row] of Object.entries(table)) {
      if (isNested && typeof row === "object" && !Array.isArray(row)) {
        // For nested objects like measurements
        result[rowKey] = {};
        for (const colKey of Object.keys(row)) {
          result[rowKey][colKey] = ""; // clear value
        }
      } else {
        // For flat objects like grading_rules and tolerance
        result[rowKey] = ""; // clear value but keep key
      }
    }
    return result;
  };


  // Wipe all tables
  const emptyMeasurements = wipeValues(sizeChart.measurements);
  const emptyGradingRules = wipeValues(sizeChart.grading_rules);
  const emptyTolerance = wipeValues(sizeChart.tolerance);
  const emptySizeConversion = wipeValues(sizeChart.size_conversion);

  // Create template
  const template = await templateChartSchema.create({
    user_id: user.id,
    tenant_id: user.tenant_id,
    sizeChart_id: sizeChart._id,
    measurements: emptyMeasurements,
    grading_rules: emptyGradingRules,
    tolerance: emptyTolerance,
    size_conversion: emptySizeConversion,
    market: sizeChart.market,
    unit: sizeChart.unit,
    template_name,
  });

  sendResponse(res, {
    statusCode: 201,
    message: "Size chart saved as template successfully",
    data: template,
  });
});


//Get templates
export const getTemplates = asyncHandler(async (req, res) => {
  const templates = await templateChartSchema.find({ tenant_id: req.user.tenant_id }).sort({ created_at: -1 });
  sendResponse(res, {
    statusCode: 200,
    message: "Templates fetched successfully",
    data: templates,
  });
});

export const createSizeChartManually = asyncHandler(async (req, res) => {
  let { measurements, grading_rules, tolerance, size_conversion, name, unit, market, generation_source } = req.body;
  const file = req.file;
  const user = req.user;

  // Parse possible JSON strings
  const parseIfString = (val) => {
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch { return {}; }
    }
    return val || {};
  };

  measurements = parseIfString(measurements);
  grading_rules = parseIfString(grading_rules);
  tolerance = parseIfString(tolerance);
  size_conversion = parseIfString(size_conversion);

  // ✅ Require at least one table
  if (
    Object.keys(measurements).length === 0 &&
    Object.keys(grading_rules).length === 0 &&
    Object.keys(tolerance).length === 0 &&
    Object.keys(size_conversion).length === 0
  ) {
    return sendResponse(res, {
      statusCode: 400,
      message: "At least one table (measurements, grading_rules, tolerance, size_conversion) is required",
    });
  }

  // Generate unique task_id
  const taskId = new mongoose.Types.ObjectId().toString();

  const createData = {
    user_id: user.id,
    tenant_id: user.tenant_id,
    task_id: taskId,
    status: "completed",
    name: name || "Untitled Size Chart",
    measurements,
    grading_rules,
    tolerance,
    size_conversion,
    unit,
    market,
    generation_source: "user_created",
  };

  // If user uploaded an image
  if (file) {
    try {
      const hostUrl = process.env.BASE_URL;

      const metadata = await sharp(file.path).metadata();
      const { width, height } = metadata;

      const maxDimension = Math.max(width, height);
      const targetSize = 512;
      const scaleRatio =
        maxDimension > targetSize ? maxDimension / targetSize : 1;
      const resizedWidth = Math.round(width / scaleRatio);
      const resizedHeight = Math.round(height / scaleRatio);

      const ext = path.extname(file.originalname);
      const resizedFileName = `${path.basename(
        file.originalname,
        ext
      )}_resized${ext}`;
      const resizedFilePath = path.join("public/uploads/moodboards", resizedFileName);

      const resizedBuffer = await sharp(file.path)
        .resize(resizedWidth, resizedHeight, {
          fit: "fill",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      await fspromise.writeFile(resizedFilePath, resizedBuffer);

      const galleryImage = await GalleryImage.create({
        url: `${hostUrl}/uploads/moodboards/${resizedFileName}`,
        name: file.originalname,
        description: "Size chart image",
        status: "uploaded",
        tenant_id: user.tenant_id,
        user_id: user.id,
        project_id: null,
      });

      // createData.gallery_image_id = galleryImage._id;
      createData.gallery_image_ids = [galleryImage._id];

      setTimeout(async () => {
        try {
          await fspromise.unlink(file.path);
        } catch (err) {
          console.warn("Failed to delete original image:", err.message);
        }
      }, 500);
    } catch (error) {
      console.error("Image processing error:", error);
      return sendResponse(res, {
        statusCode: 500,
        message: "Image processing failed",
      });
    }
  }

  const newSizeChart = await sizeChartSchema.create(createData);

  return sendResponse(res, {
    statusCode: 201,
    message: "Size chart created successfully",
    data: newSizeChart,
  });
});

// Delete template
export const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const template = await templateChartSchema.findOneAndDelete({ _id: id, tenant_id: req.user.tenant_id });

  if (!template) {
    return sendResponse(res, { statusCode: 404, message: "Template not found" });
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Template deleted successfully",
  });
});


export const linkImagesToSizeChart = asyncHandler(async (req, res) => {
  const { size_chart_id, gallery_image_ids } = req.body;
  const tenant_id = req.user.tenant_id;
  const user_id = req.user.id;
  // Validate input
  if (!size_chart_id || !gallery_image_ids?.length) {
    return sendResponse(res, {
      statusCode: 400,
      message: "Size chart ID and image objects are required",
    });
  }

  // Verify size chart exists and belongs to tenant
  const sizeChart = await sizeChartSchema.findOne({
    _id: size_chart_id,
    tenant_id,
    user_id
  });

  if (!sizeChart) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Size chart not found",
    });
  }

  // Extract image IDs (always strings for consistency)
  const imageIds = gallery_image_ids.map((img) => String(img.id));

  // Verify all images exist and belong to tenant
  let validImages = await GalleryImage.find({
    _id: { $in: imageIds },
    tenant_id,
    user_id
  });

  if (validImages.length !== imageIds.length) {
    return sendResponse(res, {
      statusCode: 404,
      message: "One or more images not found",
    });
  }

  // 🔑 Ensure all valid images have a fileHash
  for (const img of validImages) {
    const hash = await generateFileHash(img.url);
    if (!img.fileHash) {
      try {
        // Local path extraction (depends how you store uploads)
        const filePath = path.join(
          process.cwd(),
          "public",
          img.url.replace(`${process.env.BASE_URL}/`, "")
        );

        const hash = await generateFileHash(img.url);
        img.fileHash = hash;
        await img.save();
      } catch (err) {
        console.warn(`Failed to generate fileHash for image ${img._id}:`, err.message);
      }
    }
  }

  // Normalize existing IDs from DB
  const existingIds = sizeChart.gallery_image_ids.map((id) => String(id));

  // Deduplicate
  const uniqueIds = [...new Set([...existingIds, ...imageIds])];

  // Store back as ObjectIds
  sizeChart.gallery_image_ids = uniqueIds.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // Deduplicate file hashes
  const existingHashes = sizeChart.fileHash.map(String);
  const newHashes = validImages.map((img) => img.fileHash).filter(Boolean);
  sizeChart.fileHash = [...new Set([...existingHashes, ...newHashes])];

  await sizeChart.save();

  return sendResponse(res, {
    statusCode: 200,
    message: "Images linked to size chart successfully",
    data: sizeChart,
  });
});

export const uploadImageToStrapi = asyncHandler(async (req, res) => {
  const file = req.file;
  const {
    title,
    comment,
    isDeleted,
  } = req.body;

  if (!file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  try {
    // STEP 1: Upload image to Strapi
    const formData = new FormData();
    formData.append("files", fs.createReadStream(file.path), file.originalname);

    const uploadResponse = await axios.post(STRAPI_UPLOAD_URL, formData, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
    });

    // Delete local image file
    await fs.promises.unlink(file.path);

    const uploadedImage = uploadResponse?.data?.[0];
    if (!uploadedImage?.url) {
      return res.status(500).json({ message: "Image uploaded but no valid URL returned." });
    }

    const imageUrl = uploadedImage.url.startsWith("http")
      ? uploadedImage.url
      : `${STRAPI_BASE_URL}${uploadedImage.url}`;

    // STEP 2: Construct and send dg-post
    const parseJSON = (value) => {
      try {
        return value ? JSON.parse(value) : [];
      } catch {
        return [];
      }
    };

    const user = await User.findById(req.user.id);
    const dgPostData = {
      title,
      comment,
      postStatus: 'pending',
      externalUserId: req.user.id,
      nicknameSnapshot: user.full_name,
      isDeleted: isDeleted === "true" || isDeleted === true,
      image: uploadedImage.url, // Store just the relative path
    };

    const postResponse = await axios.post(
      STRAPI_DG_POST_URL,
      { data: dgPostData },
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Final Response
    res.status(200).json({
      message: "Image and DG post uploaded successfully.",
      image: uploadedImage,
      post: postResponse.data,
    });
  } catch (error) {
    console.error("Upload failed:", error?.response?.data || error.message);
    res.status(500).json({
      message: "Failed to upload image and post to Strapi.",
      error: error?.message,
    });
  }
});

export const getAllDGPosts = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(
      `${STRAPI_DG_POST_URL}?filters[postStatus][$eq]=approved&populate=*`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      },
    );

    res.status(200).json({
      message: "DG posts fetched successfully.",
      data: response?.data?.data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch DG posts:",
      error?.response?.data || error.message,
    );
    res.status(500).json({
      message: "Failed to fetch DG posts from Strapi.",
      error: error?.message,
    });
  }
});

export const getMyPosts = asyncHandler(async (req, res) => {
  try {

    const response = await axios.get(
      `${STRAPI_DG_POST_URL}?filters[externalUserId][$eq]=${req.user.id}&populate=*`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      }
    );

    res.status(200).json({
      message: "DG posts fetched successfully.",
      data: response?.data?.data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch DG posts:",
      error?.response?.data || error.message,
    );
    res.status(500).json({
      message: "Failed to fetch DG posts from Strapi.",
      error: error?.message,
    });
  }
});


export const deleteDGPost = asyncHandler(async (req, res) => {

  const postId = req.params.id;
  console.log(postId, 'postId')
  if (!postId) {
    return res.status(400).json({
      message: "Post ID is required.",
    });
  }

  try {
    // Fetch the post to validate ownership
    const fetchResponse = await axios.get(`${STRAPI_DG_POST_URL}/${postId}`, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    });
    // 
    const post = fetchResponse?.data?.data;

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const externalUserId = post?.externalUserId;
    if (externalUserId !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to delete this post.",
      });
    }

    // Authorized – proceed with deletion
    const deleteResponse = await axios.delete(`${STRAPI_DG_POST_URL}/${postId}`, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    });

    res.status(200).json({
      message: "DG post deleted successfully.",
      data: deleteResponse?.data,
    });

  } catch (error) {
    console.error("Failed to delete DG post:", error?.response?.data || error.message);

    res.status(500).json({
      message: "Failed to delete DG post from Strapi.",
      error: error?.message,
    });
  }
});

export const deleteTechPack = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // tech pack id or task_id

    const techPack = await TechPack.findOne({
      _id: id,
    });

    if (!techPack) {
      return res.status(404).json({ message: "Tech pack not found" });
    }

    await TechPack.findByIdAndDelete(id);
    return sendResponse(res, {
      statusCode: 200,
      message: "Tech pack deleted successfully",
    });
  } catch (error) {
    console.error(error)
    return sendResponse(res, {
      statusCode: 400,
      message: "Failed to delete tech pack",
    });
  }
});
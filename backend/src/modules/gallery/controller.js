import * as galleryService from "./service.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { deductCredit } from "../credits/service.js";
import GalleryImages from "./model.js";
import UserCredits from "../credits/model.js";
import TenantCredits from "../credits/tenantCreditSchema.js";
import archiver from "archiver";
import fs from "fs";
import Project from "../../modules/projects/model.js";
import path from "path";
import AiTask from "../image_variation/model.js";
import sharp from "sharp";
import { promises as fspromise } from "fs";
import mongoose from "mongoose";
import SizeChart from "../image_variation/sizeChartSchema.js";
import UsageLog from '../dashboard/model.js'
import GalleryImage from '../gallery/model.js'
import generatedImageFeedbackSchema from "./generatedImageFeedbackSchema.js";
import sizeChartSchema from "../image_variation/sizeChartSchema.js";
import { createCanvas } from 'canvas'; // npm install canvas
import { checkEnoughCredits, deductCredits } from "../../utils/creditUtils.js";
import { fileURLToPath } from "url";
import ResourceAccessService from "../share/ResourceAccessService.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createOutline = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const { outline_mode } = req.body;

  if (!outline_mode) {
    throw new ApiError(400, "Outline mode is required");
  }

  if (!req.user || !req.user.tenant_id) {
    throw new ApiError(401, "User not authenticated");
  }
  

  // Find the gallery image
  const galleryImage = await GalleryImages.findOne({
    _id: imageId,
    tenant_id: req.user.tenant_id
  });

  if (!galleryImage) {
    throw new ApiError(404, "Gallery image not found");
  }

  // Check if already processing
  if (galleryImage.outline_task_id && galleryImage.outline_status === 'processing') {
    return sendResponse(res, {
      statusCode: 200,
      message: "Outline generation already in progress",
      data: {
        status: 'processing',
        outline_mode: galleryImage.outline_mode
      }
    });
  }

  await checkEnoughCredits({ 
    tenantId: req.user.tenant_id, 
    creditsToDeduct: 1 
  });

  try {
      // Download the image from URL
      const imageUrl = galleryImage.url;
      console.log('Fetching image from URL:', imageUrl);
      
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        console.error('Image fetch failed:', imageResponse.status, imageResponse.statusText);
        throw new ApiError(400, "Failed to fetch image from URL");
      }

      console.log('Converting image to buffer...');
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      console.log('Buffer size:', imageBuffer.length);
      
      // Create form data for AI service
      console.log('Creating form data...');
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', blob, galleryImage.name || 'garment.jpg');
      formData.append('outline_mode', outline_mode);

      console.log('Calling AI service...');
      // Call AI service
      const aiResponse = await fetch('https://ai.design-genie.ai/garment-outline/async', {
        method: 'POST',
        body: formData
      });

      console.log('AI service response status:', aiResponse.status);
      
      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI service error response:', errorText);
        throw new ApiError(500, `AI service error: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      console.log('AI service response data:', aiData);

      if (!aiData.task_id) {
        throw new ApiError(500, "No task ID received from AI service");
      }

      // Update gallery image with task info
      galleryImage.outline_task_id = aiData.task_id;
      galleryImage.outline_mode = outline_mode;
      galleryImage.outline_status = 'queued';
      await galleryImage.save();

      // Log usage
      await UsageLog.create({
        module: "outline_generation",
        type: "outline_started",
        user_id: req.user.id,
        tenant_id: req.user.tenant_id,
        message: "Outline generation started",
        metadata: {
          gallery_image_id: imageId,
          outline_mode,
          task_id: aiData.task_id
        }
      });

      // Start background polling (don't await)
      pollOutlineStatus(aiData.task_id, imageId, req.user.tenant_id, req.io);

      sendResponse(res, {
        statusCode: 200,
        message: "Outline generation started successfully",
        data: {
          task_id: aiData.task_id,
          status: 'queued',
          outline_mode
        }
      });

    } catch (error) {
      console.error('Error in createOutline:', error);
      console.error('Error stack:', error.stack);
      
      // Update status to failed
      galleryImage.outline_status = 'failed';
      galleryImage.outline_error = error.message;
      await galleryImage.save();
      
      throw error;
    }
});

/**
 * Get outline status for gallery image
 * GET /gallery/:imageId/outline-status
 */
export const getOutlineStatus = asyncHandler(async (req, res) => {
  const { imageId } = req.params;

  if (!req.user || !req.user.tenant_id) {
    throw new ApiError(401, "User not authenticated");
  }

  const galleryImage = await GalleryImages.findOne({
    _id: imageId,
    tenant_id: req.user.tenant_id
  });

  if (!galleryImage) {
    throw new ApiError(404, "Gallery image not found");
  }

  sendResponse(res, {
    statusCode: 200,
    data: {
      status: galleryImage.outline_status || 'idle',
      outline_image: galleryImage.outline_image || null,
      outline_mode: galleryImage.outline_mode || null,
      outline_task_id: galleryImage.outline_task_id || null
    }
  });
});

/**
 * Background function to poll outline generation status
 */
async function pollOutlineStatus(taskId, imageId, tenantId, io) {
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5 seconds * 60)

  const pollInterval = setInterval(async () => {
    try {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        
        // Update status to timeout
        await GalleryImages.findOneAndUpdate(
          { _id: imageId, tenant_id: tenantId },
          { 
            outline_status: 'failed',
            outline_error: 'Task timeout after 5 minutes'
          }
        );

        // Emit socket event
        if (io) {
          io.to(`tenant_${tenantId}`).emit('outline_generation_failed', {
            gallery_image_id: imageId,
            error: 'Task timeout'
          });
        }

        return;
      }

      // Check task status from AI service
      const statusResponse = await fetch(`https://ai.design-genie.ai/task/status/${taskId}`);
      
      if (!statusResponse.ok) {
        console.error('Failed to check task status:', await statusResponse.text());
        return;
      }

      const statusData = await statusResponse.json();

      // Update gallery image status
      const galleryImage = await GalleryImages.findOne({
        _id: imageId,
        tenant_id: tenantId
      });

      if (!galleryImage) {
        clearInterval(pollInterval);
        return;
      }

      if (statusData.status === 'completed') {
        clearInterval(pollInterval);

        // Extract outline URL
        const cleanOutlinePath = statusData.result?.result?.clean_outline_path;
        
        if (cleanOutlinePath) {
          const filename = cleanOutlinePath.split('/').pop();
          const fullOutlineUrl = `https://ai.design-genie.ai/outputs/${filename}`;

          // Update gallery image
          galleryImage.outline_image = fullOutlineUrl;
          galleryImage.outline_status = 'completed';
          await galleryImage.save();

            // Log usage
          await UsageLog.create({
          module: "outline_generation",
          type: "outline_completed",
          user_id: galleryImage.user_id,
          tenant_id: tenantId,
          message: "Outline generation completed",
          metadata: {
            gallery_image_id: imageId,
            outline_mode: galleryImage.outline_mode,
            task_id: taskId,
            outline_url: fullOutlineUrl
          }
        });

          // Emit socket event
          if (io) {
            io.to(`tenant_${tenantId}`).emit('outline_generation_completed', {
              gallery_image_id: imageId,
              outline_image: fullOutlineUrl,
              outline_mode: galleryImage.outline_mode
            });
          }

            await deductCredits({
            tenantId: tenantId,
            userId: galleryImage.user_id,
            creditsToDeduct: 1,
          });
        } else {
          throw new Error('No outline path in result');
        }

      } else if (statusData.status === 'failed' || statusData.status === 'error') {
        clearInterval(pollInterval);

        // Update status to failed
        galleryImage.outline_status = 'failed';
        galleryImage.outline_error = statusData.error || 'Unknown error';
        await galleryImage.save();

        // Emit socket event
        if (io) {
          io.to(`tenant_${tenantId}`).emit('outline_generation_failed', {
            gallery_image_id: imageId,
            error: statusData.error
          });
        }

      } else if (statusData.status === 'processing') {
        // Update status to processing
        galleryImage.outline_status = 'processing';
        await galleryImage.save();
      }

    } catch (error) {
      console.error('Error polling outline status:', error);
      
      // On error, mark as failed after 3 consecutive errors
      if (attempts % 3 === 0) {
        try {
          await GalleryImages.findOneAndUpdate(
            { _id: imageId, tenant_id: tenantId },
            { 
              outline_status: 'failed',
              outline_error: error.message
            }
          );
        } catch (updateError) {
          console.error('Failed to update error status:', updateError);
        }
      }
    }
  }, 5000); // Poll every 5 seconds
}

/**
 * Get latest unseen outline tasks (for "While You Were Away" feature)
 * POST /gallery/outline/latest-unseen
 */
export const getLatestUnseenOutlineTasks = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.tenant_id) {
    throw new ApiError(401, "User not authenticated");
  }

  const { last_checked } = req.body;
  
  const query = {
    tenant_id: req.user.tenant_id,
    user_id: req.user.id,
    outline_status: 'completed',
    outline_seen: { $ne: true }
  };

  if (last_checked) {
    query.updated_at = { $gte: new Date(last_checked) };
  }

  const unseenOutlines = await GalleryImages.find(query)
    .sort({ updated_at: -1 })
    .limit(10)
    .select('_id name url outline_image outline_mode outline_status updated_at');

  sendResponse(res, {
    statusCode: 200,
    data: unseenOutlines
  });
});

/**
 * Mark outline tasks as seen
 * POST /gallery/outline/mark-seen
 */
export const markOutlineTasksAsSeen = asyncHandler(async (req, res) => {
  const { image_ids } = req.body;

  if (!Array.isArray(image_ids) || image_ids.length === 0) {
    throw new ApiError(400, "image_ids array is required");
  }

  if (!req.user || !req.user.tenant_id) {
    throw new ApiError(401, "User not authenticated");
  }

  const result = await GalleryImages.updateMany(
    {
      _id: { $in: image_ids },
      tenant_id: req.user.tenant_id,
      user_id: req.user.id
    },
    {
      outline_seen: true
    }
  );

  sendResponse(res, {
    statusCode: 200,
    message: `${result.modifiedCount} outline tasks marked as seen`,
    data: {
      modified_count: result.modifiedCount
    }
  });
});


export const updateGalleryImageMetadata = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const { outline_image, outline_mode, outline_task_id } = req.body;
  
  // Debug logs
  console.log('=== Update Gallery Image Metadata ===');
  console.log('ImageId:', imageId);
  console.log('User:', req.user?.id);
  console.log('Tenant:', req.user?.tenant_id);
  console.log('Body:', { outline_image, outline_mode, outline_task_id });
  
  if (!req.user || !req.user.tenant_id) {
    throw new ApiError(401, "User not authenticated");
  }

  const galleryImage = await GalleryImages.findOne({
    _id: imageId,
    tenant_id: req.user.tenant_id
  });

  if (!galleryImage) {
    console.log('Gallery image not found for:', { imageId, tenant_id: req.user.tenant_id });
    throw new ApiError(404, "Gallery image not found");
  }

  console.log('Found gallery image:', galleryImage._id);

  // Update outline fields
  if (outline_image !== undefined) {
    galleryImage.outline_image = outline_image;
    console.log('Updated outline_image:', outline_image);
  }
  if (outline_mode !== undefined) {
    galleryImage.outline_mode = outline_mode;
    console.log('Updated outline_mode:', outline_mode);
  }
  if (outline_task_id !== undefined) {
    galleryImage.outline_task_id = outline_task_id;
    console.log('Updated outline_task_id:', outline_task_id);
  }

  await galleryImage.save();
  console.log('Gallery image saved successfully');

  sendResponse(res, {
    statusCode: 200,
    data: galleryImage,
    message: "Gallery image updated successfully"
  });
});


export const getGenerated = asyncHandler(async (req, res) => {
  const sorting = req.query.sorting;
  const user_id = req.user.id;
  const tenant_id = req.user.tenant_id;
  
  let sortOption = {};
  switch (sorting) {    
    case "created-date-asc":
      sortOption = { created_at: -1 };
      break;
    case "created-date-desc":
      sortOption = { created_at: 1 };
      break;
    case "updated-date-asc":
      sortOption = { updated_at: 1 };
      break;
    case "updated-date-desc":
      sortOption = { updated_at: -1 };
      break;
    default:
      sortOption = { created_at: 1 };
  }
  
  // Fetch generated images from AiTask
  const generatedImages = await AiTask.find({
    user_id,
    status: "completed",
    in_session: true,
    task: { $ne: "size_chart" },
  }).sort(sortOption);

  // Encrypt the generated image URLs
  for (const image of generatedImages) {
    if (Array.isArray(image.result)) {
      image.result = image.result.map((url) => galleryService.encryptImagePath(url));
    }
  }

  // NEW: Fetch ALL gallery images that have outline images (regardless of status)
  const galleryImagesWithOutlines = await GalleryImages.find({
    tenant_id,
    outline_image: { $exists: true, $ne: null } // Only images with outlines
  })
    .sort(sortOption)
    .select('_id name url outline_image outline_mode created_at updated_at status user_id');

  // Combine both datasets
  const responseData = {
    generatedImages,
    galleryImagesWithOutlines
  };

  sendResponse(res, { data: responseData });
});

export const createGalleryImage = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one image is required");
  }

  const hostUrl = process.env.BASE_URL;
  const processedImages = [];

  // Process each uploaded image
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];

    try {
      // Get image metadata to determine dimensions
      const metadata = await sharp(file.path).metadata();
      const { width, height } = metadata;

      // Determine the higher dimension and calculate scale down ratio
      const maxDimension = Math.max(width, height);
      const targetSize = 512;

      let resizedWidth, resizedHeight;

      if (maxDimension > targetSize) {
        // Calculate scale down ratio
        const scaleRatio = maxDimension / targetSize;

        // Calculate new dimensions maintaining aspect ratio
        resizedWidth = Math.round(width / scaleRatio);
        resizedHeight = Math.round(height / scaleRatio);
      } else {
        // Image is already smaller than target, keep original size
        resizedWidth = width;
        resizedHeight = height;
      }

      // Create resized image filename
      const fileExtension = path.extname(file.originalname);
      const fileNameWithoutExt = path.basename(
        file.originalname,
        fileExtension,
      );
      const resizedFileName = `${fileNameWithoutExt}_resized${fileExtension}`;
      const resizedFilePath = path.join(
        path.dirname(file.path),
        resizedFileName,
      );

      // Resize and save the image
      await sharp(file.path)
        .resize(resizedWidth, resizedHeight, {
          fit: "fill", // Maintain exact dimensions
          withoutEnlargement: true, // Don't enlarge if image is smaller
        })
        .jpeg({ quality: 85 }) // You can adjust quality as needed
        .toFile(resizedFilePath);

      // Create image object with resized file path
      const imageData = {
        url: `${hostUrl}/${resizedFilePath.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
        name: file.originalname,
        description: Array.isArray(req.body.descriptions)
          ? req.body.descriptions[i] || null
          : req.body.description || null,
        status: "uploaded",
        tenant_id: req.user.tenant_id,
        user_id: req.user.id,
        originalDimensions: { width, height },
        resizedDimensions: {
          width: resizedWidth,
          height: resizedHeight,
        },
        scaleRatio:
          maxDimension > targetSize ? maxDimension / targetSize : 1,
        originalFilePath: file.path, // Store original file path for cleanup
        resizedFilePath: resizedFilePath, // Store resized file path
      };



      processedImages.push(imageData);
    } catch (error) {
      console.error(
        `Error processing image ${file.originalname}:`,
        error,
      );
      throw new ApiError(
        500,
        `Failed to process image: ${file.originalname}`,
      );
    }
  }

  // Create gallery images in database
  const galleryImages = await Promise.all(
    processedImages.map((image) =>
      galleryService.createGalleryImage(image),
    ),
  );

  // Clean up original files after successful database save
  await Promise.all(
    processedImages.map(async (image) => {
      // Delete original uploaded file
      if (image.originalFilePath) {
        try {
          await fspromise.unlink(image.originalFilePath);
          console.log(
            `Deleted original file: ${image.originalFilePath}`,
          );
        } catch (unlinkError) {
          console.warn(
            `Warning: Could not delete original file ${image.originalFilePath}:`,
            unlinkError.message,
          );
        }
      }
    }),
  );

  // Remove cleanup paths from response data
  const cleanedGalleryImages = galleryImages.map((image) => {
    const { originalFilePath, resizedFilePath, ...cleanImage } = image;
    return cleanImage;
  });

  await UsageLog.create({
    module: "general",
    type: "image_uploaded",
    user_id: req.user.id,
    tenant_id: req.user.tenant_id,
    metadata: {
      name: processedImages.map(img => img.name).join(", "),
    },
  });


  sendResponse(res, {
    statusCode: 201,
    data: cleanedGalleryImages,
    message: "Gallery images created and resized",
  });
});


export const getGalleryImages = asyncHandler(async (req, res) => {
  let query = { 
    tenant_id: req.user.tenant_id, 
    isSharedWithMe : req.query.isSharedWithMe, 
    isSharedWithOthers : req.query.isSharedWithOthers,
    type : req.query.type
  };
  
  if(req.query.status) {
    query.status = req.query.status;
  }
  if(req.query.sorting) {
    query.sorting = req.query.sorting;
  }  
  if (req.query.type === "ProjectFilter") {
    query.project_id = null;
  }
  const enrichedGalleryImages = await galleryService.getGalleryImages(query, req.user);

  sendResponse(res, { data: enrichedGalleryImages });
});



export const getGalleryImagesByIds = asyncHandler(async (req, res) => {
  const { gallery_image_ids, isSharedWithMe } = req.query;

  // Validate that gallery_image_ids is provided
  if (!gallery_image_ids) {
    return sendResponse(res, {
      data: [],
      message: "gallery_image_ids parameter is required"
    });
  }

  // Parse the gallery_image_ids (assuming it's sent as comma-separated string)
  let imageIds = [];
  if (typeof gallery_image_ids === 'string') {
    imageIds = gallery_image_ids.split(',').map(id => id.trim());
  } else if (Array.isArray(gallery_image_ids)) {
    imageIds = gallery_image_ids;
  }

  // Add tenant_id to query for security
  const query = {
    _id: { $in: imageIds },
    isSharedWithMe : isSharedWithMe ? "true" : "false",
    tenant_id: req.user.tenant_id
  };

  const galleryImages = await galleryService.getGalleryImages(query, req.user);

  sendResponse(res, { data: galleryImages });
});

// In your gallery controller
export const getGalleryImageById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const galleryImage = await galleryService.getGalleryImageById(id, req.user.tenant_id);
  
  if (!galleryImage) {
    return res.status(404).json({ message: "Gallery image not found" });
  }
  
  sendResponse(res, { data: galleryImage });
});

export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const galleryImage = await galleryService.deleteGalleryImage(
    req.params.imageId,
    req.user.tenant_id,
    req.io,
    req.user.id
  );
  sendResponse(res, { data: galleryImage });
});

export const downloadGallery = asyncHandler(async (req, res) => {
  const { status, imgID } = req.query;
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

   // convert CSV string to array
  const imgIDsArray = imgID ? imgID.split(",") : [];
  const galleryImages = await galleryService.getGalleryImagesForDownload(
    req.user.tenant_id,
    req.user.id,
    status,
    imgIDsArray
  );

  if (status === "saved") {
    for (const img of galleryImages) {
      if (img.url) {
        const encryptedPath = galleryService.encryptImagePath(img.url);
        img.url = `${BASE_URL}/api/v1/genie-image/${encryptedPath}`;
        console.log(`${BASE_URL}/api/v1/genie-image/${encryptedPath}`)
      }
    }
  }

  const creditsToDeduct = galleryImages.filter(img => img.status === 'finalized').length;
  // const userCredit = await UserCredits.findOne({ user_id: req.user.id })

  // if (!userCredit) {
  //   throw new ApiError(400, "User Credits Not Found!")
  // }

  // if (userCredit.credits < creditsToDeduct) {
  //   return sendResponse(res, {
  //     statusCode: 403,
  //     message: "Not enough credits to download these images",
  //     data: [],
  //   });
  // }

  await checkEnoughCredits({ tenantId: req.user.tenant_id, creditsToDeduct });

  console.log(galleryImages, "galleryImages");

  if (!galleryImages || galleryImages.length === 0) {
    throw new ApiError(400, "No images available to download");
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const zipName = `gallery-${Date.now()}.zip`;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename=${zipName}`);

  archive.pipe(res);


  // Keep track of used filenames to ensure uniqueness
  const usedFileNames = new Set();

  for (const image of galleryImages) {
    let fileName = image.name || `image-${image._id}`;

    // Ensure the filename has an extension
    const extension = getFileExtension(image.url);
    if (!fileName.includes('.')) {
      fileName = `${fileName}.${extension}`;
    }

    // Make filename unique by adding counter if needed
    fileName = makeFileNameUnique(fileName, usedFileNames);
    usedFileNames.add(fileName);

    try {
      // Check if the URL is from the local server
      if (image.url.startsWith(BASE_URL) && status !== 'saved') {
        // Local file - use file system
        const relativePath = image.url.replace(BASE_URL, '');
        const filePath = path.join("public", relativePath);

        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: fileName });
        } else {
          console.warn(`Local file not found: ${filePath}`);
        }
      } else {
        // External URL - download and add to archive
        try {
          const response = await fetch(image.url);
          if (response.ok) {
            // Convert the response to arrayBuffer, then to Buffer
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            archive.append(buffer, { name: fileName });
          } else {
            console.warn(`Failed to download external image: ${image.url}, Status: ${response.status}`);
          }
        } catch (downloadError) {
          console.error(`Error downloading external image ${image.url}:`, downloadError);
        }
      }
    } catch (error) {
      console.error(`Error processing image ${image.url}:`, error);
    }
  }

    await deductCredits({
      tenantId: req.user.tenant_id,
      userId: req.user.id,
      creditsToDeduct
    });

  // await userCredit.save();
  await archive.finalize();
});

export const downloadSelectedGenerated = asyncHandler(async (req, res) => {
  const { imageIds = [] } = req.body; // array of selected image IDs
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw new ApiError(400, "No images selected for download");
  }
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  // 1. Fetch selected generated images for the user
  const galleryImages = await galleryService.getGeneratedImagesByIds(
    req.user.id,
    imageIds
  );

  if (!galleryImages || galleryImages.length === 0) {
    throw new ApiError(400, "No images found for the selected IDs");
  }

  // Helper: safe file extension
  const getFileExtension = (url) => {
    if (!url || typeof url !== "string") return "png"; // default
    const cleanUrl = url.split("?")[0]; // strip query params
    const parts = cleanUrl.split(".");
    return parts.length > 1 ? parts.pop() : "png";
  };

  // Helper: ensure unique file names in ZIP
  const makeFileNameUnique = (fileName, used) => {
    let baseName = fileName;
    let ext = "";
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex !== -1) {
      baseName = fileName.substring(0, dotIndex);
      ext = fileName.substring(dotIndex);
    }
    let uniqueName = fileName;
    let counter = 1;
    while (used.has(uniqueName)) {
      uniqueName = `${baseName}(${counter})${ext}`;
      counter++;
    }
    return uniqueName;
  };

  // 2. Build URLs
  for (const img of galleryImages) {
    let imageUrl = img.url || (Array.isArray(img.result) ? img.result[0] : null);
    if (!imageUrl) continue;
    const encryptedPath = galleryService.encryptImagePath(imageUrl);
    img.url = `${BASE_URL}/api/v1/genie-image/${encryptedPath}`;
  }

  // 3. Prepare ZIP stream
  const archive = archiver("zip", { zlib: { level: 9 } });
  const zipName = `selected-gallery-${Date.now()}.zip`;
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
  archive.pipe(res);

  const usedFileNames = new Set();

  // 4. Download & append each image to archive
  for (const image of galleryImages) {
    if (!image.url) continue;

    let fileName = image.name || `image-${image._id}`;
    const extension = getFileExtension(image.url);
    if (!fileName.includes(".")) fileName = `${fileName}.${extension}`;
    fileName = makeFileNameUnique(fileName, usedFileNames);
    usedFileNames.add(fileName);

    try {
      const response = await fetch(image.url);
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      archive.append(buffer, { name: fileName });
    } catch (err) {
      console.error(`Error fetching image ${image.url}:`, err);
    }
  }

  // 5. Finalize ZIP
  await archive.finalize();
  archive.on("end", () => {
    console.log("All images appended, download complete.");
  });
   archive.on("error", (err) => {
    console.error("Archive error:", err);
    res.status(500).end();
  });
});

export const creditDeductOnEdit = asyncHandler(async (req, res) => {
  try {
    const { status, imgID, url } = req.query;
    if (!url) throw new ApiError(400, "Missing url");

    const encryptedId = url.split("/").pop();
    const decryptedUrl = galleryService.decryptImagePath(encryptedId); 

    const tenant_id = req.user.tenant_id;
    const user_id = req.user.id;

    let galleryImage;

    if (status === "saved") {
      galleryImage = await GalleryImage.findOne({ tenant_id, user_id: user_id, _id: imgID, status });
      if (!galleryImage) throw new ApiError(400, "No saved image found");
    }

    if (status === "generated") {
      const aiTask = await AiTask.findOne({ user_id, _id: imgID, status: "completed" });
      if (!aiTask || !aiTask.result?.length) throw new ApiError(400, "No AI images found");

      // Find the specific URL that matches decryptedUrl
      const matchedUrl = aiTask.result.find(r => r === decryptedUrl);
      if (!matchedUrl) throw new ApiError(400, "Image not found in AI task results");

      galleryImage = {
        id: aiTask._id,
        name: aiTask.task || "AI Image",
        status: "completed",
        // url: url,
      };
    }

    // Count finalized images
    const creditsToDeduct = galleryImage.status === "saved" || galleryImage.status === "completed" ? 1 : 0;

    // const userCredit = await UserCredits.findOne({ user_id });
    // if (!userCredit) {
    //   return sendResponse(res, {
    //     statusCode: 400,
    //     message: "User Credits Not Found!",
    //   });
    // }

    // if (userCredit.credits < creditsToDeduct) {
    //   return sendResponse(res, {
    //     statusCode: 403,
    //     message: "Not enough credits to edit these images",
    //     data: [],
    //   });
    // }

    // // Deduct credits (uncomment when ready)
    // userCredit.credits -= creditsToDeduct;
    // userCredit.creditUsedSinceLastReview += creditsToDeduct;
    // await userCredit.save();

    const updatedCredits = await deductCredits({
      tenantId: req.user.tenant_id,
      userId: req.user.id,
      creditsToDeduct
    });


    const galleryImagesWithOriginal = {
      id: galleryImage.id,
      name: galleryImage.name,
      status: galleryImage.status,
      // url: galleryImage.url,
    };

    return sendResponse(res, {
      statusCode: 200,
      message: "Credits deducted successfully",
      data: {
        creditsDeducted: creditsToDeduct,
        remainingCredits: updatedCredits.credits,
        images: galleryImagesWithOriginal,
      },
    });
  } catch (error) {
    console.error("Error in creditDeductOnEdit:", error);
    return sendResponse(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Internal Server Error",
      data: [],
    });
  }
});


// Helper function to get file extension from URL
function getFileExtension(url) {
  try {
    const pathname = new URL(url).pathname;
    const extension = path.extname(pathname);
    return extension ? extension.slice(1) : 'jpg'; // Remove the dot and default to jpg
  } catch (error) {
    // If URL parsing fails, try to get extension from the string directly
    const parts = url.split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    // Return jpg if no extension found or if extension is invalid
    return ext && ext.length <= 4 && /^[a-zA-Z0-9]+$/.test(ext) ? ext : 'jpg';
  }
}

// Helper function to make filename unique
function makeFileNameUnique(fileName, usedFileNames) {
  if (!usedFileNames.has(fileName)) {
    return fileName;
  }

  // Split filename and extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '.jpg';

  let counter = 1;
  let uniqueFileName;

  do {
    uniqueFileName = `${nameWithoutExt}_${counter}${extension}`;
    counter++;
  } while (usedFileNames.has(uniqueFileName));

  return uniqueFileName;
}


export const downloadGalleryImage = asyncHandler(async (req, res) => {
  try {
    const { status } = req.query;
    const galleryImage = await galleryService.getGalleryImageByQuery(
      req.params.imageId,
      req.user.tenant_id,
      status
    );
    const userId = req.user.id;

    // Strip host and get path
    const imageUrl = new URL(galleryImage.url);
    const decodedPath = decodeURIComponent(imageUrl.pathname);
    const relativePath = decodedPath.replace(/^\/+/, "");
    const filePath = path.join("public", relativePath);
    const fileName =
      galleryImage.name ||
      `image-${galleryImage._id}.${galleryImage.url.split(".").pop()}`;

    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, "Image file not found");
    }

    // // ✅ Deduct credit before sending file
    // await deductCredit(userId, req.io);

    res.setHeader("Content-Type", "image/*");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`,
    );

    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error("Error downloading gallery image:", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Failed to download image" });
    }
  }
});

export const proxyImage = asyncHandler(async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send("Missing url");
  const BASE_URL = process.env.ALLOWED_ORIGINS;
  if (!BASE_URL) throw new Error("BASE_URL is not defined");
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");

    const contentType = response.headers.get("content-type") || "image/png";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", BASE_URL); // 👈 enable CORS

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Failed to proxy image");
  }
})

export const replaceGalleryImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "An image is required");
  }
  const hostUrl = process.env.BASE_URL;

    const newImageData = {
        url: `${hostUrl}/${req.file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
        name: req.file.originalname,
    };

  const galleryImage = await galleryService.replaceGalleryImage(
    req.params.imageId,
    newImageData,
    req.user.id,
    req.user.tenant_id,
  );

  sendResponse(res, {
    statusCode: 200,
    data: galleryImage,
    message: "Gallery image replaced",
  });
});

export const updateGalleryImageStatus = asyncHandler(async (req, res) => {
  const { status, feedback } = req.body;

  if (!status && !feedback) {
    throw new ApiError(400, "Status or Feedback is required");
  }

  if (status && !["uploaded", "finalized", "saved", "generated"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  if (feedback && !["liked", "disliked", "none"].includes(feedback)) {
    throw new ApiError(400, "Invalid feedback value");
  }

  const galleryImage = await galleryService.updateGalleryImageStatus(
    req.params.imageId,
    status,
    req.user.tenant_id,
    req.user.id,
    feedback
  );

  sendResponse(res, {
    statusCode: 200,
    data: galleryImage,
    message: "Gallery image status updated",
  });
});

export const saveEditedImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Edited image file is required");
  }
  const hostUrl = process.env.BASE_URL;

  const newImage = {
    url: `${hostUrl}/${req.file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
    name: req.file.originalname,
    description: req.body.description || null,
    status: "uploaded",
    tenant_id: req.user.tenant_id,
    user_id: req.user.id,
  };

  const savedImage = await galleryService.createGalleryImage(newImage);

  sendResponse(res, {
    statusCode: 201,
    data: savedImage,
    message: "Edited image saved to gallery",
  });
});

export const addCredits = async (req, res) => {
  try {
    const { credits } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenant_id;

    if (!credits || credits <= 0) {
      throw new Error("Amount must be a positive number");
    }

    let tenantCredit = await TenantCredits.findOne({ tenant_id: tenantId });

    if (!tenantCredit) {
      tenantCredit = new TenantCredits({
        tenant_id: tenantId,
        credits,
        startCredits: credits,
      });
    } else {
      tenantCredit.credits += credits;
    }

    await tenantCredit.save();

    return res.status(200).json({
      message: `Added ${credits} credits`,
      user_id: userId,
      tenant_id: tenantId,
      totalCredits: tenantCredit.credits,
    });
  } catch (error) {
    console.error("Error adding credits:", error);
    throw new ApiError(500, "Failed to add credits");
  }
};

export const setGeneratedImginGallery = asyncHandler(async (req, res) => {
  // try {
  console.log("Handler called");

  const userId = req.user.id;
  // const creditSchema = await UserCredits.findOne({ user_id: userId })

  console.log("User ID:", userId);

  const { imageId } = req.params;
  console.log("Image ID from params:", imageId);

  const { status, imageUrls } = req.body;

  // if (status === 'finalized' && (!creditSchema || creditSchema.credits <= 0)) {
  //   console.log('throwing error')
  //   throw new ApiError(403, "Not enough credits.");
  // }

  if (status === 'finalized') {
    await checkEnoughCredits({ tenantId: req.user.tenant_id, creditsToDeduct: 1 });
  }


  console.log("Status from body:", status);
  console.log("Image URLs from body:", imageUrls);

  if (!status) {
    console.error("Status missing in request");
    throw new ApiError(400, "Status is required");
  }

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    console.error("Invalid imageUrls array");
    throw new ApiError(400, "imageUrls must be a non-empty array");
  }

  // Find the image in AiTask
  console.log("Finding AiTask image...");
  const image = await AiTask.findOne({ _id: imageId, user_id: userId });

  if (!image) {
    console.error("Image not found or doesn't belong to user");
    throw new ApiError(
      404,
      "Image not found or does not belong to the user",
    );
  }

  console.log("AiTask image found:", image);

  if (!image.result || image.result.length === 0) {
    console.error("No result images in AiTask");
    throw new ApiError(400, "No images found in task result");
  }

  // Decrypt each encrypted image path and filter only the ones that exist in result
  const validImageUrlMap = imageUrls.reduce((acc, encryptedUrl) => {
    try {
      const decryptedUrl = galleryService.decryptImagePath(encryptedUrl);
      if (image.result.includes(decryptedUrl)) {
        acc.push({
          original: decryptedUrl,
          encrypted: encryptedUrl,
        });
      }
    } catch (err) {
      console.warn(`Failed to decrypt: ${encryptedUrl}`);
    }
    return acc;
  }, []);

  if (validImageUrlMap.length === 0) {
    console.error("None of the provided URLs are in result");
    throw new ApiError(
      400,
      "None of the provided image URLs were found in the task",
    );
  }

  const validImageUrlFeedbacks = await generatedImageFeedbackSchema.find({
    image_url: { $in: validImageUrlMap.map(({ original }) => original) },
    user_id: userId,
  })

  // Step 2: Create lookup map for fast access
  const feedbackMap = {};
  validImageUrlFeedbacks.forEach((fb) => {
    feedbackMap[fb.image_url] = fb.status;
  });

  // Prepare gallery image documents
  const galleryImageDocs = validImageUrlMap.map(({ original }) => ({
    user_id: image.user_id,
    tenant_id: req.user.tenant_id,
    url: original,
    prompt: image.prompt || "",
    name: `Generated Image - ${image.task_id}`,
    createdAt: image.createdAt,
    status,
    task: image.task,
    task_id: image.task_id,
    gallery_image_ids: image?.gallery_image_ids?.length > 0 ? image.gallery_image_ids : [],
    feedback: feedbackMap[original] || "none", // Default to "none" if not found
  }));

  console.log("Inserting documents into GalleryImages...");
  console.log(galleryImageDocs, 'galleryImageDocs')
  const insertedImages = await GalleryImages.insertMany(galleryImageDocs);
  console.log("Inserted images:", insertedImages.length);

  // Remove moved images from result
  const updatedResult = image.result.filter(
    (url) => !validImageUrlMap.some(({ original }) => original === url)
  );

  if (updatedResult.length === 0) {
    console.log("All images moved to gallery. Deleting AiTask...");
    await AiTask.deleteOne({ _id: imageId });
  } else {
    console.log("Some images remain in AiTask. Updating result...");
    image.result = updatedResult;
    await image.save();
  }

  if (status === 'finalized') {
    // creditSchema.credits -= 1
    // creditSchema.creditUsedSinceLastReview += 1
    // await creditSchema.save();

    await deductCredits({
      tenantId: req.user.tenant_id,
      userId: req.user.id,
      creditsToDeduct: 1,
      // module: image.task === 'image_variation' ? 'ge_variation' : image.task,
    });

    await UsageLog.create({
      module: image.task === 'image_variation' ? 'ge_variation' : image.task,
      type: 'credit_consumed',
      creditsUsed: 1,
      user_id: req.user.id,
      tenant_id: req.user.tenant_id,
    });
  }


  await UsageLog.create({
    module: "general",
    type: 'image_status_updated',
    status: status,
    user_id: req.user.id,
    tenant_id: req.user.tenant_id,
    metadata: {
      from: "generated",
      to: status,
      name: insertedImages.map((img) => img.name).join(','), // ✅ Add image name for context
    }
  });


  console.log("Sending response...");
  sendResponse(res, {
    statusCode: 200,
    data: insertedImages,
    message: `${insertedImages.length} image(s) moved to gallery successfully`,
  });
  // } catch (error) {
  console.error("Error adding credits:", error);
  throw new ApiError(500, "Internal Server Error");
  // }
});

export const updateGeneratedFeedback = asyncHandler(async (req, res) => {
  const { image_url: encryptedUrl, status } = req.body;
  const user_id = req.user.id;

  if (!encryptedUrl || !status) {
    throw new ApiError(400, "Image URL and status are required");
  }

  const validStatuses = ["liked", "disliked", "none"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Status must be one of ${validStatuses.join(", ")}`,
    );
  }

  // Decrypt the image URL
  let decryptedUrl;
  try {
    const encryptedId = encryptedUrl.split("/").pop();
    decryptedUrl = galleryService.decryptImagePath(encryptedId);
  } catch (err) {
    console.error("Failed to decrypt image URL:", err.message);
    throw new ApiError(400, "Invalid image URL");
  }

  const feedback = await galleryService.updateGeneratedFeedback({
    image_url: decryptedUrl,
    status,
    user_id,
  });

    // if (status === "liked") {
    //     const alreadyInGallery = await GalleryImages.findOne({
    //         url: decryptedUrl,
    //         user_id: user_id,
    //     });

    //     if (!alreadyInGallery) {
    //         const aiTask = await AiTask.findOne({
    //             result: decryptedUrl,
    //             user_id: user_id,
    //         });

    //         if (!aiTask) {
    //             console.warn(`Image ${decryptedUrl} not found in any AiTask for user ${user_id}`);
    //             throw new ApiError(404, "Image not found in user's tasks");
    //         }

    //         const galleryImage = new GalleryImages({
    //             url: decryptedUrl,
    //             name: `Generated Image - ${aiTask.task_id}`,
    //             status: "saved",
    //             tenant_id: req.user.tenant_id,
    //             user_id: user_id,
    //         });

    //         await galleryImage.save();

    //         // Remove image from AiTask result
    //         aiTask.result = aiTask.result.filter((url) => url !== decryptedUrl);

    //         // Delete or update AiTask
    //         if (aiTask.result.length === 0) {
    //             await AiTask.deleteOne({ _id: aiTask._id });
    //         } else {
    //             await aiTask.save();
    //         }
    //     }
    // }

  sendResponse(res, {
    statusCode: 200,
    data: feedback,
    message: "Generated image feedback updated successfully",
  });
});

export const getGeneratedFeedback = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const galleryImageFeedback = await galleryService.getGeneratedImageFeedback(
    { user_id: user_id },
  );

  sendResponse(res, {
    statusCode: 200,
    data: galleryImageFeedback,
    message: "Generated image feedback fetched successfully",
  });
});

export const deleteGeneratedImage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { imageId } = req.params;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    throw new ApiError(400, "imageUrl is required in request body");
  }

  // Extract encrypted ID from URL
  let decryptedUrl;
  try {
    decryptedUrl = galleryService.decryptImagePath(imageUrl);
  } catch (err) {
    console.error("Failed to decrypt imageUrl:", err.message);
    throw new ApiError(400, "Invalid image URL");
  }

  // Find the task by ID and verify user
  const task = await AiTask.findOne({ _id: imageId, user_id: userId });
  if (!task) {
    throw new ApiError(
      404,
      "Task not found or does not belong to the user",
    );
  }

  // Check if decryptedUrl exists in result
  if (!task.result.includes(decryptedUrl)) {
    throw new ApiError(400, "Image URL not found in task result");
  }

  // Remove the image URL from the result array
  task.result = task.result.filter((url) => url !== decryptedUrl);

  // Delete task if no images left, otherwise save updated task
  if (task.result.length === 0) {
    await AiTask.deleteOne({ _id: imageId });
  } else {
    await task.save();
  }

  await UsageLog.create({
    module: "general",
    type: 'image_deleted',
    status: "generated",
    user_id: req.user.id,
    tenant_id: req.user.tenant_id,
    metadata: {
      status: "generated"
    }
  });


  sendResponse(res, {
    statusCode: 200,
    message: "Image deleted successfully",
  });
});


export const linkToProject = asyncHandler(async (req, res) => {
  const { project_id } = req.body;
  const { imageId } = req.params;

  // Validate IDs
  if (!project_id || !imageId) {
    throw new ApiError(400, "Invalid project_id or image_id");
  }

  
const hasAccess = await ResourceAccessService.hasAccess(
    "GalleryImage",
    imageId,
    req.user.id,
    req.user.tenant_id,
    req.user.roles,
    ["edit"]
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to link this image to the project",
    });
  }
  // Ensure project exists
  const project = await Project.findOne({
    _id: project_id,
    // tenant_id: req.user.tenant_id,
    is_deleted: false,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Find image
  const image = await GalleryImages.findOne({
    _id: imageId,
    // tenant_id: req.user.tenant_id,
  });

  if (!image) {
    throw new ApiError(404, "Gallery image not found");
  }

  // Check if already linked
  if (image.project_id?.toString() === project_id) {
    throw new ApiError(400, "Image already linked to this project");
  }

  // Update image to link it to the project
  const oldProjectId = image.project_id; // store old project for logs if needed
  image.project_id = project._id;
  image.updated_by = req.user.id;
  await image.save();

  await UsageLog.create({
    module: "project",
    type: "project_linked",
    user_id: req.user.id,
    tenant_id: req.user.tenant_id,
    metadata: {
      imageName: image.name,
      projectName: project.name,
    },
  });

  res.status(200).json({
    message: "Image successfully linked to project",
    data: {
      project_id,
      image_id: imageId,
    },
  });
});


export const linkGeneratedImageToProject = asyncHandler(async (req, res) => {
  const { imageId } = req.params; // AiTask ID
  const { project_id, imageUrlEncrypted } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenant_id;

  if (!project_id || !imageUrlEncrypted) {
    throw new ApiError(400, "project_id and imageUrlEncrypted are required");
  }

  // Decrypt image URL
  let decryptedUrl;
  try {
    decryptedUrl = galleryService.decryptImagePath(imageUrlEncrypted);
  } catch (err) {
    throw new ApiError(400, "Invalid or corrupted image URL");
  }

  // Validate project
  const project = await Project.findOne({
    _id: project_id,
    user_ids : userId,
    tenant_id: tenantId,
    is_deleted: false,
  });

  if (!project) throw new ApiError(404, "Project not found");

  // Find AiTask
  const task = await AiTask.findOne({ _id: imageId, user_id: userId });
  if (!task || !task.result?.includes(decryptedUrl)) {
    throw new ApiError(404, "Image not found in AI task or access denied");
  }

  // Check if already in gallery
  const alreadyExists = await GalleryImages.findOne({
    url: decryptedUrl,
    tenant_id: tenantId,
  });

  if (alreadyExists) {
    throw new ApiError(400, "This image is already saved in gallery");
  }

  // Create gallery image with status "saved" and link to project
  const galleryImage = await GalleryImages.create({
    url: decryptedUrl,
    name: `Generated - ${task.task_id}`,
    description: task.prompt || "Generated image",
    status: "saved",
    tenant_id: tenantId,
    user_id: userId,
    project_id: project._id,
  });

  // Remove image from AiTask result array
  task.result = task.result.filter((url) => url !== decryptedUrl);
  if (task.result.length === 0) {
    await AiTask.deleteOne({ _id: task._id });
  } else {
    await task.save();
  }

  await UsageLog.create({
    module: "project",
    type: "project_linked",
    user_id: req.user.id,
    tenant_id: req.user.tenant_id,
    metadata: {
      imageName: galleryImage.name,
      projectName: project.name,
    },
  });

  return res.status(200).json({
    message: "Image linked to project and moved to gallery",
    data: galleryImage,
  });
});

export const unlinkSizeChartFromProject = asyncHandler(async (req, res) => {
  const { sizeChartId } = req.params;
  const { project_id } = req.body;

  const userId = req.user.id;
  const tenantId = req.user.tenant_id;

  if (!project_id) {
    throw new ApiError(400, "project_id is required");
  }

  // ✅ Validate size chart ID format
  if (!mongoose.Types.ObjectId.isValid(sizeChartId)) {
    throw new ApiError(400, "Invalid sizeChartId");
  }

  // ✅ Validate project ID format
  if (!mongoose.Types.ObjectId.isValid(project_id)) {
    throw new ApiError(400, "Invalid project_id");
  }

  // ✅ Find the SizeChart by ID and user
  const sizeChart = await SizeChart.findOne({
    _id: sizeChartId,
    user_id: userId
  });

  if (!sizeChart) {
    throw new ApiError(404, "Size chart not found or access denied");
  }

  // ✅ Find the Project by ID, tenant, not deleted
  const project = await Project.findOne({
    _id: project_id,
    user_ids : userId,
    tenant_id: tenantId,
    is_deleted: false,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // ✅ Check if size chart is linked to this project
  const isLinked = project.size_charts.includes(sizeChart._id);
  if (!isLinked) {
    throw new ApiError(400, "Size chart is not linked to this project");
  }

  // ✅ Remove size chart from the project
  project.size_charts = project.size_charts.filter(
    chartId => !chartId.equals(sizeChart._id)
  );
  await project.save();

  return res.status(200).json({
    message: "Size chart unlinked from project successfully",
    data: {
      project_id: project._id,
      size_chart_id: sizeChart._id,
    },
  });
});

export const linkSizeChartToProject = asyncHandler(async (req, res) => {
  const { sizeChartId } = req.params;
  const { project_id } = req.body;

  const userId = req.user.id;
  const tenantId = req.user.tenant_id;

  if (!project_id) {
    throw new ApiError(400, "project_id is required");
  }

  // ✅ Validate size chart ID format
  if (!mongoose.Types.ObjectId.isValid(sizeChartId)) {
    throw new ApiError(400, "Invalid sizeChartId");
  }

  // ✅ Validate project ID format
  if (!mongoose.Types.ObjectId.isValid(project_id)) {
    throw new ApiError(400, "Invalid project_id");
  }

  // ✅ Find the SizeChart by ID and user
  const sizeChart = await SizeChart.findOne({
    _id: sizeChartId,
    user_id: userId
  });

  if (!sizeChart) {
    throw new ApiError(404, "Size chart not found or access denied");
  }

  // ✅ Find the Project by ID, tenant, not deleted
  const project = await Project.findOne({
    _id: project_id,
    user_ids : userId,
    tenant_id: tenantId,
    is_deleted: false,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // ✅ Check if size chart is already linked to this project
  const alreadyLinked = project.size_charts.includes(sizeChart._id);
  if (alreadyLinked) {
    throw new ApiError(400, "Size chart already linked to this project");
  }

  // ✅ Remove size chart from any previous project (ensure single project linking)
  await Project.updateMany(
    {
      tenant_id: tenantId,
      is_deleted: false,
      size_charts: sizeChart._id
    },
    {
      $pull: { size_charts: sizeChart._id }
    }
  );

  // ✅ Add size chart ID to the new project
  project.size_charts.push(sizeChart._id);

  if (sizeChart.gallery_image_id) {
    const galleryImage = await GalleryImage.findOneAndUpdate(
      {
        _id: sizeChart.gallery_image_id,
        user_id: userId,
      },
      {
        project_id: project._id,
      },
      {
        new: true, // Return the updated document
      }
    );

  }

  await project.save();

  return res.status(200).json({
    message: "Size chart linked to project successfully",
    data: {
      project_id: project._id,
      size_chart_id: sizeChart._id,
    },
  });
});

export const getLinkedProjectToSizeChart = asyncHandler(async (req, res) => {
  const { sizeChartId } = req.params;
  const userId = req.user.id;
  const tenantId = req.user.tenant_id;

  // ✅ Validate size chart ID format
  if (!mongoose.Types.ObjectId.isValid(sizeChartId)) {
    throw new ApiError(400, "Invalid sizeChartId");
  }

  // ✅ Find one project linked with this size chart
  const project = await Project.findOne({
    tenant_id: tenantId,
    user_ids : userId,
    is_deleted: false,
    size_charts: sizeChartId,
  }).select("_id name description size_charts"); // select fields you want

  if (!project) {
    throw new ApiError(404, "No project linked with this size chart");
  }

  return res.status(200).json({
    message: "Linked project fetched successfully",
    data: project,
  });
});

const LOGO_PATH = path.join("public/dg-icon.png");

// Function to create text watermark as SVG with dimensions
const createTextSvg = (text, fontSize = 24, color = 'brown', opacity = 0.4) => {
  console.log("Creating text SVG watermark");
  console.log("Input Text:", text);
  console.log("Font Size:", fontSize);
  console.log("Color:", color);
  console.log("Opacity:", opacity);

  const width = Math.round(text.length * fontSize * 0.6);
  const height = Math.round(fontSize * 1.5);

  console.log("Calculated SVG dimensions - Width:", width, "Height:", height);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <text 
        x="0" 
        y="${height * 0.8}" 
        font-family="Arial" 
        font-size="${fontSize}" 
        fill="${color}" 
        fill-opacity="${opacity}"
      >
        ${text}
      </text>
    </svg>
  `;

  const buffer = Buffer.from(svg);

  console.log("SVG buffer created. Length:", buffer.length);

  return { buffer, width, height };
};

const createTextImageBuffer = (text, fontSize = 24, color = 'brown', opacity = 0.6) => {
  const canvas = createCanvas(1, 1);
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px Arial`;

  const textWidth = context.measureText(text).width;
  const textHeight = fontSize * 1.5;

  const textCanvas = createCanvas(textWidth, textHeight);
  const textCtx = textCanvas.getContext('2d');

  textCtx.font = `${fontSize}px Arial`;
  textCtx.fillStyle = color;
  textCtx.globalAlpha = opacity;
  textCtx.fillText(text, 0, fontSize);

  const buffer = textCanvas.toBuffer('image/png');
  return {
    buffer,
    width: Math.round(textWidth),
    height: Math.round(textHeight),
  };
};

export const getWaterMarkedImage = asyncHandler(async (req, res) => {
  console.log("Watermarking process started");

  const image_id = req.params.id;
  console.log("Image ID:", image_id);

  const decryptedPath = galleryService.decryptImagePath(image_id);
  console.log("Decrypted Image Path:", decryptedPath);

  // Fetch image from URL
  const imageResponse = await fetch(decryptedPath);
  if (!imageResponse.ok) {
    console.error("Image fetch failed:", imageResponse.statusText);
    throw new ApiError(404, "Image not found");
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  console.log("Fetched image buffer length:", imageBuffer.length);

  if (process.env.SHOW_WATERMARK !== 'true') {
    console.log("SHOW_WATERMARK is not enabled, returning original image.");
    res.set('Content-Type', 'image/jpeg');
    return res.send(imageBuffer);
  }

  console.log("Watermarking enabled");

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  console.log("Image metadata:", metadata);

  // Prepare logos
  const [topLeftLogo, smallLogo] = await Promise.all([
    sharp(LOGO_PATH)
      .resize(Math.min(200, Math.round(metadata.width * 0.1)))
      .toBuffer(),

    sharp(LOGO_PATH)
      .resize(24, 24)
      .toBuffer(),
  ]);

  console.log("Logos prepared: topLeftLogo size =", topLeftLogo.length, ", smallLogo size =", smallLogo.length);

  // Generate text watermark for bottom-right
  const { buffer: textWatermark, width: textW, height: textH } = createTextImageBuffer(
    "Created using DesignGenie",
    Math.max(24, metadata.height * 0.03),
    'brown',
    0.6
  );

  console.log("Text watermark generated. Width:", textW, ", Height:", textH);

  const composites = [];

  // 1. Top-left logo
  composites.push({
    input: topLeftLogo,
    top: 20,
    left: 20,
  });

  // 2. Bottom-right text watermark
  composites.push({
    input: textWatermark,
    left: metadata.width - textW - 10,
    top: metadata.height - textH - 10,
  });

  // 3. Logo grid (10x10 small logos)
  const gridSize = 10;
  const stepX = Math.floor(metadata.width / gridSize);
  const stepY = Math.floor(metadata.height / gridSize);
  console.log(`Creating grid of ${gridSize}x${gridSize} logos. StepX: ${stepX}, StepY: ${stepY}`);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      composites.push({
        input: smallLogo,
        left: i * stepX,
        top: j * stepY,
      });
    }
  }

  console.log("Total composite items:", composites.length);

  const watermarkedImage = await sharp(imageBuffer)
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();

  console.log("Watermarked image created. Size:", watermarkedImage.length);

  res.set('Content-Type', 'image/jpeg');
  res.send(watermarkedImage);

  console.log("Image sent successfully");
});

export const renameImageName = asyncHandler(async (req, res) => {
    try {
    const imageId = req.params.imageId;
    const userId = req.user.id; // from your auth middleware
    const { newName } = req.body;

    if (!newName || newName.trim() === "") {
      return res.status(400).json({ error: "New name is required" });
    }

    // Find the image by id and user to ensure ownership
    const image = await GalleryImage.findOne({ _id: imageId, user_id: userId });

    if (!image) {
      return res.status(404).json({ error: "Image not found or access denied" });
    }

    // Update the name
    image.name = newName.trim();
    await image.save();

    return res.json({ message: "Image renamed successfully", image });
  } catch (error) {
    console.error("Rename image error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});




  // uploadImage: [
  //   upload.single("image"),
  //   asyncHandler(async (req, res) => {
  //     const data = await galleryService.createImage(req);
  //     res.json(data);
  //   }),
  // ],

  // Get all images
export const getImages = asyncHandler(async (req, res) => {
    const data = await galleryService.getImages();
    res.json(data);
  })

  // Create size chart
export const  createSizeChart = asyncHandler(async (req, res) => {
    const data = await galleryService.createSizeChart(req.body);
    res.json(data);
  })

  // Get size charts
export const getSizeCharts = asyncHandler(async (req, res) => {
    const data = await galleryService.getSizeCharts();
    res.json(data);
  })

  // Link asset to tree
  export const linkAsset = asyncHandler(async (req, res) => {
    const data = await galleryService.linkAsset(req.body);
    res.json(data);
  })

  // Get full tree
  export const getTree = asyncHandler(async (req, res) => {
    const data = await galleryService.getTree(req.params.id);    
    res.json(data);
  })

  export const getTreeView = asyncHandler(async (req, res) => {    
    const data = await galleryService.TreeView(req.params.assetId);
    res.json(data);
  })

  // Get all root trees
  export const getAllTrees = asyncHandler(async (req, res) => {
    const assetId = req.params.assetId
    const data = await galleryService.getAllTrees(assetId);
    res.json(data);
  })
export const getProjectImages = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId
  const data = await galleryService.getProjectImages(projectId);
  res.json(data);
})


export const scaleToHD = asyncHandler(async (req, res) => {
  try {
    const { imageName } = req.body;
    if (!imageName) return res.status(400).json({ error: "Image name is required" });

    const imagePath = path.resolve(__dirname, "../../../public/uploads/moodboards", imageName);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Image file not found" });
    }

    // Convert image to base64
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

    const hdBase64 = await galleryService.imageScaleToHDBase64(imageBase64 );

    return sendResponse(res, { data: { hdImage: hdBase64 }, message: "Image scaled to HD" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to scale image" });
  }
});
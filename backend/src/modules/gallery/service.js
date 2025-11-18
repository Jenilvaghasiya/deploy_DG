import GalleryImage from "./model.js";
import { ApiError } from "../../utils/ApiError.js";
import User from "../users/model.js";
import dayjs from "dayjs";
import fs from "fs/promises";
import sharp from "sharp";
import Project from "../projects/model.js";
import { sendMail, sendUserMail } from "../../services/mailServices.js";
import { savedImageExpiryEmail } from "../../services/mailTemplates.js";
import { sendNotification, sendNotificationToTenantUsers, sendSubscriptionRenewalReminder } from "../../utils/notificationUtils.js";
import cron from "node-cron";
import generatedImageFeedbackSchema from "./generatedImageFeedbackSchema.js";
import crypto from 'crypto';
import UserCredits from "../credits/model.js";
import UsageLog from "../dashboard/model.js";
import AiTask from '../../modules/image_variation/model.js'
import sizeChartSchema from "../image_variation/sizeChartSchema.js";
import mongoose from "mongoose";
import path from "path";
import SizeChart from "../image_variation/sizeChartSchema.js";
import { TreeNode } from "./treemodel.js";
import { sortMeasurements } from "../../utils/sortSizeChart.js";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// import Upscaler from '../../../node_modules/upscaler/dist/node/upscalerjs/src/node/index.js'
import { spawn } from "child_process";
import { deductCredits } from "../../utils/creditUtils.js";
import stripe from "../../config/stripe.js";
import ResourceAccessService from "../share/ResourceAccessService.js";


export const createGalleryImage = async (data) => {
  const galleryImage = await GalleryImage.create(data);

  await UsageLog.create({
    module: "general",
    type: "image_edited",
    user_id: data.user_id,
    tenant_id: data.tenant_id,
    metadata: {
      name: data.name,
    },
  });

  return galleryImage.populate("user_id");
};

export const replaceGalleryImage = async (imageId, newImageData, userId, tenantId) => {
  const galleryImage = await GalleryImage.findOne({
    _id: imageId,
    user_id: userId,
    tenant_id: tenantId,
  });

  if (!galleryImage) {
    throw new ApiError(404, "Gallery image not found");
  }

  const oldImageUrl = `public/${galleryImage.url}`;
  galleryImage.url = newImageData.url;
  galleryImage.name = newImageData.name;

  await galleryImage.save();

  try {
    if (fs.existsSync(oldImageUrl)) {
      fs.unlinkSync(oldImageUrl);
    }
  } catch (error) {
    console.error(`Failed to delete old file ${oldImageUrl}:`, error);
  }

  return galleryImage.populate("user_id");
};

export const updateGalleryImageStatus = async (imageId, status, tenantId, userId, feedback) => {
  // const creditSchema = await UserCredits.findOne({ user_id: userId })

  const galleryImage = await GalleryImage.findOne({
    _id: imageId,
    user_id: userId,
    tenant_id: tenantId,
  });

  if (!galleryImage) {
    throw new ApiError(404, "Gallery image not found");
  }


  if (status === 'finalized') {
    // if (!creditSchema || creditSchema.credits <= 0) {
    //   throw new ApiError(403, "Not enough credits.");
    // }
    // creditSchema.credits -= 1
    // creditSchema.creditUsedSinceLastReview += 1
    // await creditSchema.save();

    await deductCredits({
      tenantId,
      userId,
      creditsToDeduct: 1,
    });

    await UsageLog.create({
      module: galleryImage.task === 'image_variation' ? 'ge_variation' : galleryImage.task,
      type: 'credit_consumed',
      creditsUsed: 1,
      user_id: userId,
      tenant_id: tenantId,
    });
  }

  await UsageLog.create({
    module: galleryImage.task === 'image_variation' ? 'ge_variation' : galleryImage.task,
    type: 'image_status_updated',
    status: status,
    user_id: userId,
    tenant_id: tenantId,
    module: "general",
    metadata: {
      from: galleryImage.status,
      to: status,
      name: galleryImage.name, // ✅ Add image name for context
      imageId: galleryImage._id,    // ✅ Include ID if helpful for traceability
    }
  });

  if (status) {
    galleryImage.status = status;
  }

  if (feedback) {
    galleryImage.feedback = feedback;
  }

  await galleryImage.save();

  return galleryImage.populate("user_id");
};

export const getGalleryImages = async (query, user) => {
  const { type, sorting, status, isSharedWithMe, isSharedWithOthers, ...filters } = query;
  
  let galleryImages = [];

  // 1. Shared-with-me
  if (isSharedWithMe === "true") {
    const sharedResources = await ResourceAccessService.getAccessibleResources(
      "GalleryImage",
      user.id,
      user.tenant_id,
      user.roles,
      {
        includeOwned: false,
        includeShared: true,
      }
    );
    galleryImages = sharedResources // convert to model-like object if needed
    
  }
  // 2. Shared-with-others
  else if (isSharedWithOthers === "true") {
    const sharedByMeResources = await ResourceAccessService.getResourcesSharedWithOthers(
      "GalleryImage",
      user.id
    );
    galleryImages = sharedByMeResources;
  }
  // 3. Normal owned gallery images
  else {    
    filters.user_id = user.id
    if (type === "ProjectFilter") {
      filters.project_id = null;
    }
    if (status) {
      filters.status = status;
    }

    let sortOption = {};
    switch (sorting) {
      case "name-asc":
        sortOption = { name: 1 };
        break;
      case "name-desc":
        sortOption = { name: -1 };
        break;
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

    galleryImages = await GalleryImage.find(filters)
      .populate("user_id")
      .populate("project_id", "name")
      .sort(sortOption)
      .lean()

    galleryImages = galleryImages.map(img => ({
      ...img,
      permissions: {
        delete: true,
        edit: true,
        read: true,
        share: true,
      },
    }));
  }

  // Enrich gallery images (watermark + size charts)
  for (const img of galleryImages) {
    if (img.status === "saved" && img.url) {
      img.url = encryptImagePath(img.url);
    }
  }

  const imageIds = galleryImages.map((img) => img._id);
  const sizeCharts = await sizeChartSchema.find({
    gallery_image_ids: { $in: imageIds }
  }).lean();

  const sizeChartMap = new Map();
  for (const chart of sizeCharts) {
    for (const imgId of chart.gallery_image_ids) {
      const key = imgId.toString();
      if (!sizeChartMap.has(key)) {
        sizeChartMap.set(key, []);
      }
      const chartObj = chart;
      if (chartObj.measurements) {
        chartObj.measurements = sortMeasurements(chartObj.measurements);
      }
      sizeChartMap.get(key).push(chartObj);
    }
  }

  const enrichedGalleryImages = galleryImages.map((img) => {
    const chart = sizeChartMap.get(img._id.toString()) || [];
    return {
      ...img,
      _id: null,
      id: img._id,
      sizeChart: chart,
    };
  });

  return enrichedGalleryImages;
};


export const getGalleryImageById = async (imageId, tenantId) => {
  const galleryImage = await GalleryImage.findOne({
    _id: imageId,
    tenant_id: tenantId,
  }).populate("user_id");

  if (!galleryImage) {
    throw new ApiError(404, "Gallery image not found");
  }
  return galleryImage;
};

export const deleteGalleryImage = async (imageId, tenantId, io, userId) => {
  const galleryImage = await GalleryImage.findOne({
    _id: imageId,
    user_id: userId,
    tenant_id: tenantId,
  });

  if (!galleryImage) {
    throw new ApiError(404, "Gallery image not found");
  }

  if (["finalized", "generated"].includes(galleryImage.status)) {
    throw new ApiError(
      400,
      `Cannot delete image with status "${galleryImage.status}"`,
    );
  }
  // Step 1: Remove imageId from all associated projects
  await Project.updateMany(
    { images: imageId },
    { $pull: { images: imageId } }
  );

  const imageUrl = `public/${galleryImage.url}`;
  await galleryImage.deleteOne();
const urlObj = new URL(galleryImage.url);
const pathname = urlObj.pathname;
const imagePath = path.join(process.cwd(), 'public', pathname);


  (async () => {
    try {
      await fs.promises.unlink(imagePath);
    } catch (error) {
      console.error(`Failed to delete file ${imageUrl}:`, error);
    }
  })();

  await UsageLog.create({
    module: "general",
    type: "image_deleted",
    user_id: userId,
    tenant_id: tenantId,
    metadata: {
      name: galleryImage.name,
      status: galleryImage.status
    },
  });

  // //  Send tenant-wide notification
  // await sendNotificationToTenantUsers(io || global.io, {
  //   tenant_id: tenantId,
  //   message: `An image titled "${galleryImage.name || "Untitled"}" was deleted from the gallery.`,
  //   type: "delete_warning",
  // });

  return galleryImage;
};

export const getGalleryImagesForDownload = async (tenantId, userId, status, imgID) => {
  const query = {
    tenant_id: tenantId,
    user_id: userId,
  };
  if (status) {
    query.status = status;
  }
  if (imgID && imgID.length > 0) {
    query._id = {
      $in: imgID.map(id => new mongoose.Types.ObjectId(id.trim()))
    };
  }
  const galleryImages = await GalleryImage.find(query).populate("user_id");
  return galleryImages;
};


export const startExpiryAndSubscriptionJob = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      const now = dayjs();

      /** ------------------------
       * IMAGE EXPIRY LOGIC
       * ----------------------- */
      const warningThreshold = now.subtract(27, "day").toDate();
      const deleteThreshold = now.subtract(30, "day").toDate();

      // Step 1: Send warning email + notification at day 27
      const expiringImages = await GalleryImage.find({
        status: "saved",
        created_at: { $lte: warningThreshold, $gt: deleteThreshold },
      }).populate("user_id", "tenant_id");

      const groupedByTenant = expiringImages.reduce((acc, img) => {
        const tenantId = img.user_id?.tenant_id?.toString();
        if (!tenantId) return acc;
        if (!acc[tenantId]) acc[tenantId] = [];
        acc[tenantId].push(img);
        return acc;
      }, {});

      for (const [tenantId, images] of Object.entries(groupedByTenant)) {
        const imageNames = images.map((img) => img.name);
        const users = await User.find({ tenant_id: tenantId });

        // Send email
        for (const user of users) {
          if (!user.email) continue;
          const { subject, html } = savedImageExpiryEmail(user.full_name || "User", imageNames);

          await sendUserMail({ userId: user._id, to: user.email, subject, html });
        }

        // Send notification
        await sendNotificationToTenantUsers(global.io, {
          tenant_id: tenantId,
          type: "expiry_warning",
          message: `${images.length} saved images in your tenant will expire in 3 days.`,
        });
      }

      // Step 2: Delete expired images
      const expiredImages = await GalleryImage.find({
        status: "saved",
        created_at: { $lte: deleteThreshold },
      }).populate("user_id", "tenant_id");

      const tenantsToNotify = {};
      await Promise.all(
        expiredImages.map(async (img) => {
          const tenantId = img.user_id?.tenant_id?.toString();
          if (!tenantId) return;

          tenantsToNotify[tenantId] = (tenantsToNotify[tenantId] || 0) + 1;
          await GalleryImage.deleteOne({ _id: img._id });
        })
      );

      for (const [tenantId, count] of Object.entries(tenantsToNotify)) {
        await sendNotificationToTenantUsers(global.io, {
          tenant_id: tenantId,
          type: "delete_warning",
          message: `${count} saved images in your tenant have been permanently deleted.`,
        });
      }

      /** ------------------------
       * SUBSCRIPTION RENEWAL LOGIC
       * ----------------------- */
      try {
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });

        for (const sub of subscriptions.data) {
          const user = await User.findById(sub.metadata.userId);
          if (!user || !user.email) continue;

          await sendSubscriptionRenewalReminder(sub, user);
        }

        console.log(`[${new Date().toISOString()}] Subscription reminder job completed`);
      } catch (err) {
        console.error("Error sending subscription reminders:", err);
      }

      console.log(`[${new Date().toISOString()}] Expiry job completed.`);
    } catch (err) {
      console.error("Error running expiry and subscription job:", err);
    }
  });
};


export const updateGeneratedFeedback = async ({ image_url, status, user_id }) => {
  const existingFeedback = await generatedImageFeedbackSchema.findOne({ image_url, user_id });

  if (existingFeedback) {
    existingFeedback.status = status;
    await existingFeedback.save();
    return existingFeedback;
  }

  const newFeedback = await generatedImageFeedbackSchema.create({
    image_url,
    status,
    user_id,
  });

  return newFeedback;
};

// export const getGeneratedImageFeedback = async (query) => {
//   const feedbackList = await generatedImageFeedbackSchema.find(query);

//   const encryptedFeedback = feedbackList.map((item) => {
//     return {
//       ...item._doc,
//       image_url: encryptImagePath(item.image_url),
//     };
//   });

//   return encryptedFeedback;
// };

export const getGeneratedImageFeedback = async ({ user_id }) => {
  // Step 1: Fetch all relevant AiTasks
  const generatedImages = await AiTask.find({
    user_id,
    status: "completed",
    in_session: true,
    task: { $ne: "size_chart" },
  });

  // Step 2: Extract all image URLs from result arrays
  const allImageUrls = generatedImages.flatMap(task => task.result);

  // Step 3: Fetch feedbacks for these URLs
  const feedbackList = await generatedImageFeedbackSchema.find({
    image_url: { $in: allImageUrls },
    user_id,
  });

  // Create a Set of URLs that have feedback, for deduplication or extra logic
  const feedbackUrlSet = new Set(feedbackList.map(f => f.image_url));


  const response = [];

  for (const task of generatedImages) {
    for (const url of task.result) {
      const feedback = feedbackList.find(f => f.image_url === url);

      if (feedback) {
        response.push({
          _id: feedback._id,
          image_url: encryptImagePath(feedback.image_url),
          status: feedback.status,
          user_id: feedback.user_id,
          created_at: feedback.created_at,
          updated_at: feedback.updated_at,
          __v: feedback.__v,
        });
      }
    }
  }


  return response;
};



export const encryptImagePath = (imagePath) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.IMAGE_KEY), process.env.IMAGE_IV);
  let encrypted = cipher.update(imagePath, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decryptImagePath = (encryptedPath) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.IMAGE_KEY),
    process.env.IMAGE_IV
  );

  let decrypted = decipher.update(encryptedPath, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const getGeneratedImagesByIds = async (userId, imageIds = []) => {
  if (!Array.isArray(imageIds) || imageIds.length === 0) return [];
  // Group by taskId and store indices
  const taskMap = {}; // { taskId: [0, 1] }
  for (const id of imageIds) {
    const [taskId, indexStr] = id.split("-");
    if (!mongoose.Types.ObjectId.isValid(taskId)) continue;
    const index = parseInt(indexStr, 10);
    if (!taskMap[taskId]) taskMap[taskId] = [];
    taskMap[taskId].push(index);
  }

  const taskIds = Object.keys(taskMap).map(id => new mongoose.Types.ObjectId(id));
  // Only fetch completed AI tasks containing generated images
  const tasks = await AiTask.find({
    _id: { $in: taskIds },
    user_id: userId,
    status: "completed",
    result: { $exists: true, $ne: [] },
  }).lean();

  // Flatten results so each image has a reference back to task
  const images = tasks.flatMap(task =>
    task.result.map(url => ({
      _id: task._id.toString(),
      name: task.name || `generated-${task._id}`,
      url,
    }))
  );

  return images;
};

export async function buildTree(rootId, parentId = null) {
  const nodes = await TreeNode.find({ rootId, parentId }).sort({ createdAt: 1 });
  const result = [];
  
  for (const node of nodes) {
    console.log(node, 'xxxxxxx');
    const children = await buildTree(rootId, node.id);
    
    result.push({
      id: node.id,
      assetId : node.assetId,
      type: node.type,
      name: node.name,
      children,
    });
  }
  return result;
}

  // Create/upload image
  export async function createImage(req) {
    if (!req.file) throw new Error("No image file provided");

    const galleryImage = new GalleryImage({
      name: req.body.name || req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
    });

    await galleryImage.save();

    return {
      id: galleryImage._id,
      name: galleryImage.name,
      filename: galleryImage.filename,
      path: `/uploads/${galleryImage.filename}`,
    };
  }

  // Fetch all images
 export async function getImages() {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    return images.map((img) => ({
      id: img._id,
      name: img.name,
      filename: img.filename,
      path: `/uploads/${img.filename}`,
    }));
  }
  // Create size chart
  export async function createSizeChart({ name, description, gallery_image_id }) {
    const sizeChart = new SizeChart({
      name,
      description,
      gallery_image_id: gallery_image_id || null,
    });
    await sizeChart.save();
    return {
      id: sizeChart._id,
      name: sizeChart.name,
      description: sizeChart.description,
      gallery_image_id: sizeChart.gallery_image_id,
    };
  }

  // Get size charts
  export async function getSizeCharts() {
    const sizeCharts = await SizeChart.find().sort({ createdAt: -1 });
    return sizeCharts.map((sc) => ({
      id: sc._id,
      name: sc.name || sc._id,
      description: sc.description,
      // gallery_image_id: sc.gallery_image_id,
      gallery_image_ids: sc.gallery_image_ids,
    }));
  }

  // Link asset to tree
export async function linkAsset({ assetId, assetType, assetName, parentId, rootId }) {
  if (assetType === "image") {
    const image = await GalleryImage.findById(assetId);
    if (!image) throw new Error("Image not found");
  } else if (assetType === "sizechart") {
    const sizeChart = await SizeChart.findById(assetId);
    if (!sizeChart) throw new Error("Size chart not found");
  }

  // ✅ If it's a root node (parentId null) and already exists, return existing
  if (!parentId) {
    const existingRoot = await TreeNode.findOne({
      assetId,
      parentId: null,
    });

    if (existingRoot) {
      return {
        id: existingRoot.id,
        type: existingRoot.type,
        name: existingRoot.name,
        parentId: existingRoot.parentId,
        rootId: existingRoot.rootId,
      };
    }
  }

  // Otherwise create new node
  const nodeId = `${assetType}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  const treeNode = new TreeNode({
    id: nodeId,
    type: assetType,
    name: assetName,
    parentId,
    assetId,
    rootId: rootId || nodeId,
  });

  await treeNode.save();

  return {
    id: treeNode.id,
    type: treeNode.type,
    name: treeNode.name,
    parentId: treeNode.parentId,
    rootId: treeNode.rootId,
  };
}


  // Get tree by rootId
  export async function getTree(rootId) {
    const rootNode = await TreeNode.findOne({ id: rootId, parentId: null });
    if (!rootNode) throw new Error("Root node not found");
console.log(rootNode, 'qqqqqqqqqqq');


    const children = await buildTree(rootId, rootId);

    return {
      id: rootNode.id,
      type: rootNode.type,
      assetId : rootNode.assetId,
      name: rootNode.name,
      children,
    };
  }

export async function TreeView(assetId) {
  const rootNodes = await TreeNode.find({
    assetId: assetId,
    // parentId: null,   // only roots
  }).sort({ createdAt: -1 });

  if (!rootNodes.length) return null;

  return rootNodes.map(node => ({
    id: node.id,
    type: node.type,
    name: node.name,
    parentId: node.parentId,
    rootId: node.rootId,
  }));
}


  // Get all root trees
  export async function getAllTrees(assetId) {
    if(!assetId){
      throw new ApiError(400, "Asset id is required");
    }
    const rootNodes = await TreeNode.find({ parentId: null, assetId }).sort({
      createdAt: -1,
    });
    return rootNodes.map((node) => ({
      id: node.id,
      type: node.type,
      name: node.name,
      rootId: node.rootId,
    }));
  }
  
export async function getProjectImages(projectId) {
  // Find all images linked to the project
  const images = await GalleryImage.find({ project_id: projectId });

  // Wrap each image in a tree-node-like structure
  return images.map(img => ({
    id: img._id.toString(),
    type: "image",
    name: img.name,
    url: img.url,
    projectId: projectId,
    children: [] // images are leaf nodes
  }));
}
//LOCAL
export const imageScaleToHDBase64 = async (inputBase64) => {
  return new Promise((resolve, reject) => {
    if (!inputBase64) return reject(new Error("Input base64 image is required"));

    const isDev = process.env.NODE_ENV === "development";

    let pythonExe = "python";
    let scriptPath = path.resolve(
      __dirname,
      isDev
        ? "../../image_enhancer/imageEnhancerLocal.py"
        : "../../image_enhancer/imageEnhancer.py"
    );

    const pythonProcess = spawn(
      pythonExe,
      [scriptPath],
      isDev
        ? {}
        : {
            cwd: path.dirname(scriptPath),
            env: {
              ...process.env,
              PATH: "/mnt/data/realesrgan_env2/bin:" + (process.env.PATH || ""),
              PYTHONPATH: "/mnt/data/realesrgan_env2/lib/python3.11/site-packages",
              LD_LIBRARY_PATH:
                "/usr/lib/x86_64-linux-gnu:/usr/local/cuda/lib64:" +
                (process.env.LD_LIBRARY_PATH || ""),
            },
            stdio: ["pipe", "pipe", "pipe"], // stdin enabled
          }
    );

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (chunk) => (stdoutData += chunk.toString()));
    pythonProcess.stderr.on("data", (chunk) => (stderrData += chunk.toString()));

    const timeout = setTimeout(() => {
      pythonProcess.kill("SIGKILL");
      reject(new Error("Python script timed out"));
    }, 10 * 60 * 1000);

    pythonProcess.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        return reject(new Error("Python script failed with code " + code + "\n" + stderrData));
      }

      try {
        const result = JSON.parse(stdoutData);
        if (result.success) resolve(result.data);
        else reject(new Error(result.error));
      } catch (err) {
        reject(new Error("Failed to parse Python output: " + err.message));
      }
    });

    // Send base64 via stdin
    pythonProcess.stdin.write(inputBase64);
    pythonProcess.stdin.end();
  });
};


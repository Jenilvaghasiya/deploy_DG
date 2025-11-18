import * as projectService from "./service.js";
import * as galleryService from "../../modules/gallery/service.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import Project from "../../modules/projects/model.js"
import PDFDocument from "pdfkit";
import fs from "fs";
import Moodboard from "./model.js";
import path from "path";
import JSZip from 'jszip';
import archiver from "archiver";
import axios from "axios";
import GalleryImage from "../gallery/model.js"; // adjust import
import UserCredits from "../credits/model.js";
import AiTask from "../image_variation/model.js";
import UsageLog from '../dashboard/model.js'
import SizeChart from "../image_variation/sizeChartSchema.js"; // adjust import
import { exportMoodboardToArchive } from "../moodboards/controller.js";
import * as XLSX from "xlsx";
import puppeteer from 'puppeteer';
import { generatePDFContent } from '../moodboards/controller.js';
import sharp from "sharp";
import { deductCredits } from "../../utils/creditUtils.js";
import ResourceAccessService from "../share/ResourceAccessService.js";
import mongoose from "mongoose";
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/snap/bin/chromium";
import User from "../users/model.js";

export const createProject = asyncHandler(async (req, res) => {
  if (req.body.parent_id === "null" || req.body.parent_id === "") {
    req.body.parent_id = null;
  }
  const descriptions = req.body.descriptions || [];

  let moodboardIds = [];
  if (req.body.moodboard_ids) {
    try {
      moodboardIds =
        typeof req.body.moodboard_ids === "string"
          ? JSON.parse(req.body.moodboard_ids)
          : req.body.moodboard_ids;
    } catch (e) {
      throw new ApiError(400, "Invalid format for moodboard_ids.");
    }
  }

  // Create project first
  const projectData = {
    ...req.body,
    tenant_id: req.user.tenant_id,
    created_by: req.user.id,
    user_ids: [req.user.id],
    moodboards: moodboardIds,
  };

  const project = await Project.create(projectData);
  
  // Handle uploaded files
  if (req.files && req.files.length > 0) {
    await Promise.all(
      req.files.map((file, index) => {
        const description = Array.isArray(descriptions)
          ? descriptions[index] || null
          : descriptions || null;

        const url = `${process.env.BASE_URL}/${file.path
          .replace(/^public[\\/]/, "")
          .replace(/\\/g, "/")}`;

        return GalleryImage.create({
          url,
          name: file.originalname,
          description,
          tenant_id: req.user.tenant_id,
          user_id: req.user.id,
          project_id: project._id,
        });
      })
    );
  }

  // ✅ Declare here so available everywhere
  let parsedIds = [];
  let normalGalleryImages = [];
  let generatedImages = [];

  if (req.body.image_ids) {
    try {
      parsedIds =
        typeof req.body.image_ids === "string"
          ? JSON.parse(req.body.image_ids)
          : req.body.image_ids;
        } catch (e) {
          throw new ApiError(400, "Invalid format for image_ids.");
    }
  }
  
  if (parsedIds.length > 0) {
    for (const img of parsedIds) {
      if (img.task_id && img.url) {
        // Generated image
        generatedImages.push(img);
      } else if (img.id && img.status) {
        // Already saved/uploaded
        normalGalleryImages.push(img);
      }
    }
    
    // Handle normal gallery images
    if (normalGalleryImages.length > 0) {
      const savedImageIds = normalGalleryImages.map((i) => i.id);

      const savedImages = await GalleryImage.find({
        _id: { $in: savedImageIds },
        tenant_id: req.user.tenant_id,
        user_id : req.user.id,
      });
      
      const savedCount = savedImages.filter(
        (img) => img.status === "saved"
      ).length;
      
      if (savedCount > 0) {
        // const userCredit = await UserCredits.findOne({ user_id: req.user.id });
        // if (!userCredit) throw new ApiError(400, "User Credits Not Found!");

        // if (userCredit.credits < savedCount) {
        //   return sendResponse(res, {
        //     statusCode: 403,
        //     message: "Not enough credits to add saved images",
        //     data: [],
        //   });
        // }
        
        // userCredit.credits -= savedCount;
        // userCredit.creditUsedSinceLastReview += savedCount;
        // await userCredit.save();

        await deductCredits({
          tenantId: req.user.tenant_id,
          userId: req.user.id,
          creditsToDeduct: savedCount,
        });
      }
      
      // Attach to project
      await GalleryImage.updateMany(
        { _id: { $in: savedImageIds }, tenant_id: req.user.tenant_id },
        { $set: { project_id: project._id } }
      );
    }
  }
  
  // ✅ Handle generated images (accessible now)
  if (generatedImages.length > 0) {
    let validImages = [];    
    for (const img of generatedImages) {
    const encryptedId = img.url.split("/").pop();
    const decryptedUrl = galleryService.decryptImagePath(encryptedId); 

      const aiTask = await AiTask.findOne({
        _id: img.task_id,
        result: { $in: [decryptedUrl] }
      });
      
      if (aiTask) {
        validImages.push({ ...img, decryptedUrl });
      }
    }
    
    if (validImages.length === 0) {
      return sendResponse(res, {
        statusCode: 400,
        message: "No valid generated images found in AiTask",
        data: [],
      });
    }
    
    const creditsToDeduct = validImages.length;
    
    // const userCredit = await UserCredits.findOne({ user_id: req.user.id });
    // if (!userCredit) throw new ApiError(400, "User Credits Not Found!");
    
    // if (userCredit.credits < creditsToDeduct) {
    //   return sendResponse(res, {
    //     statusCode: 403,
    //     message: "Not enough credits to add generated images",
    //     data: [],
    //   });
    // }

    // // Deduct credits now
    // userCredit.credits -= creditsToDeduct;
    // userCredit.creditUsedSinceLastReview += creditsToDeduct;
    // await userCredit.save();

    await deductCredits({
      tenantId: req.user.tenant_id,
      userId: req.user.id,
      creditsToDeduct: creditsToDeduct,
    });
    
    await Promise.all(
      validImages.map(async (img) => {        
        const result = await AiTask.updateOne(
        { _id: img.task_id, user_id: req.user.id },
        { $pull: { result: img.decryptedUrl } }
      );      
        let existingImage = await GalleryImage.findOne({
          _id: img.task_id,
          url: img.url,
          tenant_id: req.user.tenant_id,
          user_id: req.user.id,
        });
        
        if (existingImage) {
          existingImage.project_id = project._id;
          existingImage.status = "saved";
          await existingImage.save();
        } else {
          await GalleryImage.create({
            url: img.url,
            name: `Generated-${Date.now()}`,
            tenant_id: req.user.tenant_id,
            user_id: req.user.id,
            project_id: project._id,
            status: "finalized",
            task_id: img.task_id,
          });
        }
      })
    );
  }

  // ✅ Usage log
  await UsageLog.create({
    module: "project",
    type: "project_created",
    user_id: req.user.id,
    tenant_id: req.user.tenant_id,
    metadata: {
      name: project.name,
    },
  });
  
  sendResponse(res, {
    statusCode: 201,
    data: project,
    message: "Project created successfully",
  });
});

// export const getProjects = asyncHandler(async (req, res) => {
//   const projects = await projectService.getProjects(
//     req.query,
//     req.user.tenant_id,
//   );
//   sendResponse(res, { data: projects });
// });

// export const getProjectById = asyncHandler(async (req, res) => {
//   const project = await projectService.getProjectById(
//     req.params.id,
//     req.user.tenant_id,
//   );
//   sendResponse(res, { data: project });
// });


export const getProjects = asyncHandler(async (req, res) => {
  const { tenant_id, id: userId, is_super_admin, is_admin } = req.user;

  let filter = {
    tenant_id,
    is_deleted: false,
    is_active: true,
  };

   // Access hierarchy filter
  if (is_super_admin) {
    // Super admin → can see all projects in the tenant
  } else if (is_admin) {
    // Admin → can see own + users they created
    const userIds = await User.find({ invited_by: userId }).distinct("_id");
    filter.user_ids = { $in: [userId, ...userIds] };
  } else {
    // Regular user → only own projects
    filter.user_ids = userId;
  }
  // Fetch projects
  const projects = await projectService.getProjects(
    req.query,
    req.user
  );

  const enriched = await Promise.all(
    projects.map(async (project) => {
      // Fetch images for this project
      const images = await GalleryImage.find({ project_id: project._id });

      // Encrypt URLs if saved
      for (const image of images) {
        if (image.status === "saved") {
          image.url = galleryService.encryptImagePath(image.url);
        }
      }

      // Collect all image IDs for size chart lookup
      const imageIds = images.map(img => img._id);

      // Fetch size charts for all these images
      const sizeCharts = await SizeChart.find({
        // gallery_image_id: { $in: imageIds }
        gallery_image_ids: { $in: imageIds }
      });

      return {
        ...project.toJSON(),
        images,        // keep images clean
        size_charts: sizeCharts, // project-level size charts
      };
    })
  );

  sendResponse(res, { data: enriched });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(
    req.params.id,
    req.user.tenant_id,
    req.user.id
  );

  // Fetch images for the main project
  const images = await GalleryImage.find({ project_id: project._id });
  for (const image of images) {
    if (image.status === "saved") {
      image.url = galleryService.encryptImagePath(image.url);
    }
  }

  // Collect all image IDs for size chart lookup
  const imageIds = images.map(img => img._id);

  // Fetch size charts linked to these images
  const sizeCharts = await SizeChart.find({
    // gallery_image_id: { $in: imageIds }
    gallery_image_ids: { $in: imageIds }
  });

  // Fetch subprojects (only IDs)
  const subProjects = await Project.find({ parent_id: project._id, is_deleted: false }).select('_id');

  sendResponse(res, {
    data: {
      ...project.toJSON(),
      images,
      size_charts: sizeCharts, 
      sub_projects: subProjects.map(sub => sub._id), // send only IDs
    },
  });
});

export const getSharedProjects = asyncHandler(async (req, res) => {
  const { type, page, limit, permission } = req.query;
  const userId = req.user.id;
  const tenantId = req.user.tenant_id;
  const userRoles = req.user.roles;

  if (!type) {
    return res.status(400).json({ message: "type is required" });
  }

  const options = {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    permission: permission ? [].concat(permission) : ["read"],
  };

  // Step 1: fetch all accessible projects
  let projects = [];
  if (type === "shareWithMe") {
    projects = await ResourceAccessService.getAccessibleResources(
      "Project",
      userId,
      tenantId,
      userRoles,
      { page: 1, limit: 2000, permission: ["read"], includeOwned: false, includeShared: true },
      ["user_ids", "parent_id", "moodboards"]
    );
  } else if (type === "shareWithOthers") {
    projects = await ResourceAccessService.getResourcesSharedWithOthers(
      "Project",
      userId,
      options
    );
  } else {
    return res.status(400).json({ message: "Invalid type. Must be shareWithMe or shareWithOthers" });
  }

  // Map projects by ID for parent lookup
  const projectMap = new Map();
  projects.forEach(p => projectMap.set(p._id.toString(), p));

  // Enrich projects
  const enriched = await Promise.all(
    projects.map(async (project) => {
      const proj = project.toJSON ? project.toJSON() : project;
      const { _id, parent_id } = proj;

      // Fetch images
      const images = await GalleryImage.find({ project_id: _id }).lean();

      // Encrypt URLs if status is saved
      images.forEach(img => {
        if (img.status === "saved") {
          img.url = galleryService.encryptImagePath(img.url);
        }
      });

      const imageIds = images.map(img => img._id);

      // Fetch size charts linked to project/user
      const size_charts = await SizeChart.find({
        $or: [
          { gallery_image_ids: { $in: imageIds } },
          { user_id: proj.created_by, task_id: { $exists: true } }
        ]
      }).lean();

      // Fetch users details
      const users = await User.find({ _id: { $in: proj.users || [proj.created_by] } }).lean();

      // Attach parent project if sub-project
      let parent = null;
      if (parent_id) {
        const parentProject =
          projectMap.get(parent_id.toString()) ||
          (await mongoose.model("Project").findById(parent_id).lean());
        if (parentProject) {
          const parentUsers = await User.find({
            _id: { $in: parentProject.users || [parentProject.created_by] },
          }).lean();
          parent = {
            ...parentProject,
            id: parentProject._id.toString(),
            moodboards: parentProject.moodboards || [],
            users: parentUsers,
          };
        }
      }

      return {
        ...proj,
        _id: null,
        id: _id.toString(),
        images,
        size_charts,
        moodboards: proj.moodboards || [],
        users,
        parent
      };
    })
  );

  sendResponse(res, { data: enriched });
});

const PROJECT_POPULATE_FIELDS = [
  "moodboards",
];

export const getSharedProjectById = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const userId = req.user.id;
  const tenantId = req.user.tenant_id;
  const userRoles = req.user.roles || [];

  // ✅ Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  // ✅ Fetch project via ResourceAccessService
  const project = await ResourceAccessService.getAccessibleResourceById(
    "Project",
    projectId,
    userId,
    tenantId,
    userRoles,
    "read",
    PROJECT_POPULATE_FIELDS
  );

  if (!project) {
    return res.status(403).json({ message: "Access denied or project not found" });
  }
  // Fetch images for the main project
  const images = await GalleryImage.find({ project_id: project.id });
  for (const image of images) {
    if (image.status === "saved") {
      image.url = galleryService.encryptImagePath(image.url);
    }
  }

  // Collect all image IDs for size chart lookup
  const imageIds = images.map(img => img._id);

  // Fetch size charts linked to these images
  const sizeCharts = await SizeChart.find({
    // gallery_image_id: { $in: imageIds }
    gallery_image_ids: { $in: imageIds }
  });

  // Fetch subprojects (only IDs)
  const subProjects = await Project.find({ parent_id: project.id, is_deleted: false }).select('_id');
console.log(subProjects , 'eeeeeeeeeeeeee');

  sendResponse(res, {
    data: {
      ...project,
      images,
      size_charts: sizeCharts, 
      sub_projects: subProjects.map(sub => sub._id), // send only IDs
    },
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    start_date,
    end_date,
    parent_id,
    existing_images,
    removed_image_ids,
    new_gallery_image_ids,
    moodboard_ids,
    // size_charts,
  } = req.body;

  const files = req.files || [];

  // ✅ Normalize inputs (convert strings → arrays/objects)
  const parseArray = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return input.split(",").map((id) => id.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const existingImages = parseArray(existing_images);
  const removedImageIds = parseArray(removed_image_ids);
  const newGalleryImageIds = parseArray(new_gallery_image_ids);
  const moodboards = parseArray(moodboard_ids);


const hasAccess = await ResourceAccessService.hasAccess(
    "Project",
    req.params.id,
    req.user.id,
    req.user.tenant_id,
    req.user.roles,
    ["edit"]
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to update this project",
    });
  }
  
  // ✅ Call service function
  const project = await projectService.updateProject(
    req.params.id,
    {
      name,
      description,
      start_date,
      end_date,
      parent_id,
      existingImages,
      removedImageIds,
      newGalleryImageIds,
      moodboards,
      // size_charts,
      updated_by: req.user.id,
    },
    req.user.id,
    req.user.tenant_id,
    files
  );
  await UsageLog.create({
      module: "project",
      type: 'project_edited',
      user_id: req.user.id,
      tenant_id:req.user.tenant_id,
      metadata:{
      name:project.name
      }
    });
  return sendResponse(res, {
    data: project,
    message: "Project updated successfully",
  });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await projectService.deleteProject(
    req.params.id,
    req.user.tenant_id,
    req.user.id,
    req.io
  );
  await UsageLog.create({
    module: "project",
    type: 'project_deleted',
    user_id: req.user.id,
    tenant_id:req.user.tenant_id,
    metadata:{
      name:project.name
    }
  });
  sendResponse(res, { data: project });
});

export const addUser = asyncHandler(async (req, res) => {
  const project = await projectService.addUser(
    req.params.id,
    req.body.user_id,
    req.user.tenant_id,
  );
  sendResponse(res, { data: project });
});

export const removeUser = asyncHandler(async (req, res) => {
  const project = await projectService.removeUser(
    req.params.id,
    req.body.user_id,
    req.user.tenant_id,
  );
  sendResponse(res, { data: project });
});

export const downloadProjectImagesAsPDF = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  const images = await GalleryImage.find({ project_id: projectId }).lean();
  const project = await Project.findById(projectId);

  if (!images || images.length === 0) {
    throw new ApiError(400, "No images available to download");
  }

  const doc = new PDFDocument({ autoFirstPage: false });
  const pdfName = `project-images-${projectId}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${pdfName}`);
  doc.pipe(res);

  let hasValidImages = false;

  for (const image of images) {
    try {
      let imgBuffer = null;

      // Determine if image URL is local or remote
      if (image.url.startsWith("http")) {
        // Remote URL
        const response = await axios.get(image.url, { responseType: "arraybuffer" });
        imgBuffer = Buffer.from(response.data, "binary");
      } else {
        // Local path
        const relativePath = image.url.replace(/^\/+/, ""); // Remove leading slash
        const filePath = path.join(__dirname, "..", "public", relativePath);
        if (fs.existsSync(filePath)) {
          imgBuffer = fs.readFileSync(filePath);
        } else {
          console.warn("Image not found:", filePath);
        }
      }

      if (imgBuffer) {
        hasValidImages = true;

        doc.addPage({ size: "A4", margin: 50 });

        const img = doc.openImage(imgBuffer);
        let width = img.width;
        let height = img.height;

        const maxWidth = doc.page.width - 100;
        const maxHeight = doc.page.height - 150;

        // Scale image to fit within page
        if (width > maxWidth) {
          const scale = maxWidth / width;
          width *= scale;
          height *= scale;
        }
        if (height > maxHeight) {
          const scale = maxHeight / height;
          width *= scale;
          height *= scale;
        }

        const x = (doc.page.width - width) / 2;
        let y = 50;

        doc.image(imgBuffer, x, y, { width, height });

        y += height + 20;

        if (image.description) {
          doc.fontSize(12).text(image.description, 50, y, {
            width: doc.page.width - 100,
            align: "left",
          });
          y += doc.heightOfString(image.description, { width: doc.page.width - 100 }) + 10;
        }

        doc.fontSize(10).text(`Image: ${image.name}`, 50, y, {
          width: doc.page.width - 100,
          align: "left",
        });
      }
    } catch (error) {
      console.error("Error processing image:", image.url, error);
    }
  }

  if (!hasValidImages) {
    doc.addPage();
    doc.fontSize(14).text("No valid images available.", 50, 50);
  }

  doc.end();
});

const getFullUrl = (img) => {
  const BASE_URL = process.env.BASE_URL;
  if (!img?.url) return "";

  // Encrypt only if status is "saved"
  if (img.status === "saved") {
    const encryptedPath = galleryService.encryptImagePath(img.url);
    return `${BASE_URL}/api/v1/genie-image/${encryptedPath}`;
  }

  // Return original URL if not "saved"
  return img.url.startsWith("http") ? img.url : `${BASE_URL}/${img.url.replace(/^\/+/, "")}`;
};
const getFileNameWithExt = (img) => {
  // Prefer `img.name` if it has extension
  if (img.name && img.name.includes(".")) return img.name;

  // fallback: extract extension from URL
  const parts = img.url.split("/");
  const lastPart = parts[parts.length - 1];
  return lastPart.includes(".") ? lastPart : lastPart + ".png"; // default to png if no ext
};


// export const downloadProjectZip = async (req, res) => {
//   try {
//     const { projectId } = req.params;
//     const includeSub = req.query.includeSub === "true";

//     const projects = [await Project.findById(projectId)];
//     if (!projects[0]) return res.status(404).json({ error: "Project not found" });

//     if (includeSub) {
//       const subProjects = await Project.find({ parent_id: projectId });
//       projects.push(...subProjects);
//     }

//     res.setHeader("Content-Type", "application/zip");
//     res.setHeader("Content-Disposition", `attachment; filename=${projects[0].name}_images.zip`);

//     const archive = archiver("zip", { zlib: { level: 9 } });
//     archive.pipe(res);

//     for (const proj of projects) {
//       const images = await GalleryImage.find({ project_id: proj._id });

//       for (const img of images) {
//         try {
//           const fullUrl = getFullUrl(img.url);

//           const response = await axios.get(fullUrl, {
//             responseType: "arraybuffer",
//             headers: {
//               Authorization: req.headers.authorization,
//             },
//           });

//           const buffer = Buffer.from(response.data, "binary");

//           // Save inside folder with project name
//           archive.append(buffer, { name: `${proj.name}/${img.name}` });
//         } catch (err) {
//           console.warn(`Failed to add image ${img.url}: ${err.message}`);
//         }
//       }
//     }
//       await UsageLog.create({
//         module: "project",
//         type: 'project_downloaded',
//         user_id: req.user.id,
//         tenant_id:req.user.tenant_id,
//         metadata:{
//         name:projects[0].name,
//         type:'zip'
//       }
//     });

//     archive.finalize();
//   } catch (err) {
//     console.error("ZIP creation error:", err);
//     res.status(500).json({ error: "Failed to create ZIP" });
//   }
// };

function getFileName(img) {
  // Use the original name if available, else derive from _id
  const baseName = img.name || `image-${img._id}`;
  
  // Always pick extension from URL
  const ext = path.extname(img.url);

  return baseName + ext;
}


export const downloadProjectZip = async (req, res) => {
  try {
    const {
      includeProjects = [],
      includeImages = true,
      includeDescription = true,
      includeMoodboards = true,
      includeSizeCharts = true,
    } = req.body;

    const projects = await Project.find({ _id: { $in: includeProjects } })
      .populate({
        path: 'moodboards',
        populate: {
          path: 'gallery_images.galleryImage', // Populate nested reference
          model: 'GalleryImage'
        }
      })
      // .populate("size_charts");

    if (!projects.length) {
      return res.status(404).json({ error: "No projects found" });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const zipName = `project-${projects[0].name.replace(/[^a-zA-Z0-9]/g, "-")}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${zipName}`);
    archive.pipe(res);

    for (const proj of projects) {
      let metadata = `Project: ${proj.name}\nCreated At: ${proj.created_at}\n`;

      if (includeDescription) {
        metadata += `Description: ${proj.description || "N/A"}\n`;
      }

      // === Project Images
      let images = [];
      if (includeImages) {
        images = await GalleryImage.find({ project_id: proj._id });
        metadata += `\nImages Count: ${images.length}\n`;

        for (const img of images) {
          try {            
            const fullUrl = getFullUrl(img);
            
            const response = await axios.get(fullUrl, {
              responseType: "arraybuffer",
              headers: { Authorization: req.headers.authorization },
            });

            const buffer = Buffer.from(response.data, "binary");
            const fileName =  getFileName(img);

            archive.append(buffer, { name: `${proj.name}/images/${fileName}` });
          } catch (err) {
            // metadata += `\nFailed to add image ${img.url}\n`;
            console.log(`Failed to add image ${img.url}`, err)
          }
        }
      }

      // === Moodboards
      if (includeMoodboards && proj.moodboards?.length) {
        metadata += `\nMoodboards: ${proj.moodboards.length}\n`;

        for (const mb of proj.moodboards) {
          await exportMoodboardToArchive(archive, mb, {
            includeImages: mb.gallery_images.map((g) => String(g._id)), // include all
            includeTextData: mb.textData.map((t) => String(t._id)), // include all
            baseFolder: `${proj.name}/moodboards`,
          });
        }
      }

      // === Size Charts
       let sizeCharts = [];
      if (Array.isArray(includeSizeCharts) && includeSizeCharts.length > 0) {
        // Only include explicitly selected size charts
        sizeCharts = await SizeChart.find({ _id: { $in: includeSizeCharts } });
      }

      if (sizeCharts.length) {
        metadata += `\nSize Charts: ${sizeCharts.length}\n`;

        for (const [i, sc] of sizeCharts.entries()) {
          try {
            const meas = sc.measurements || {};
            const allSizes = new Set();

            for (const m of Object.values(meas)) {
              Object.keys(m).forEach((size) => allSizes.add(size));
            }
            const sizes = Array.from(allSizes);

            const worksheetData = [];
            worksheetData.push(["Measurement", ...sizes]);

            for (const [measurementName, values] of Object.entries(meas)) {
              const row = [measurementName];
              for (const size of sizes) {
                row.push(values[size] ?? "");
              }
              worksheetData.push(row);
            }

            const ws = XLSX.utils.aoa_to_sheet(worksheetData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `SizeChart-${i + 1}`);

            const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

            archive.append(buffer, {
              name: `${proj.name}/size_charts/sizechart-${i + 1}.xlsx`,
            });

            metadata += ` - SizeChart ${i + 1}: saved as Excel\n`;
          } catch (err) {
            console.log(`Failed to export size chart ${i + 1}`, err);
          }
        }
      }

      archive.append(metadata, { name: `${proj.name}/project.txt` });
    }

    await archive.finalize();

    await UsageLog.create({
        module: "project",
        type: 'project_downloaded',
        user_id: req.user.id,
        tenant_id:req.user.tenant_id,
        metadata:{
        name:projects[0].name,
        type:'zip'
      }
    });
  } catch (err) {
    console.error("ZIP creation error:", err);
    res.status(500).json({ error: "Failed to create ZIP" });
  }
};

export const getImageStatusCount = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;

  const images = await GalleryImage.find({ project_id: projectId }).select("status");

  if (!images.length) {
    return res.status(404).json({ message: "No images found for this project." });
  }

  const statusCount = images.reduce((acc, image) => {
    const status = image.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  sendResponse(res, {
    data: statusCount,
    message: "Image status count retrieved successfully",
  });
});

export const getSubProjects = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

    // Fetch all projects whose parent_id is the selected project
    const subprojects = await Project.find({
      parent_id: projectId,
      is_deleted: false,
      is_active: true,
    })
      .select("name _id") // only return necessary fields
      .lean();

    // Transform _id to id for frontend
    const result = subprojects.map((sub) => ({
      id: sub._id.toString(),
      name: sub.name,
    }));

    res.json({ success: true, data: result });
});

export const downloadZIP = async (req, res) => {
  try {
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items selected for download" });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const zipName = `selection-${Date.now()}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${zipName}`);
    archive.pipe(res);

    const projectCache = {};

const processProject = async (projItem, parentPath = "") => {
  const { project, images = [], size_charts = [], moodboards = [], sub_projects = [] } = projItem;

const proj = await Project.findById(project.id)
  .populate({
    path: "moodboards",
    populate: { path: "gallery_images.galleryImage", model: "GalleryImage" },
  })
.populate({
    path: "size_charts",          // populate size_charts field
    model: "SizeChart",           // specify the model
  });
      if (!proj) return;

  projectCache[proj._id] = proj;
  const baseFolder = parentPath ? `${parentPath}/Project (${proj.name})` : `Project (${proj.name})`;

  // === PROJECT METADATA ===
  const metadata = `Project: ${proj.name}\nCreated At: ${proj.created_at}\nDescription: ${
    proj.description || "N/A"
  }\n`;
  archive.append(metadata, { name: `${baseFolder}/project.txt` });

  console.log(images, '6666666');
  // === IMAGES === (unchanged)
  for (const imgId of images) {
    const img = await GalleryImage.findById(imgId);
    
    if (!img) continue;
    try {
      const response = await axios.get(getFullUrl(img), {
        responseType: "arraybuffer",
        headers: { Authorization: req.headers.authorization },
      });
      archive.append(Buffer.from(response.data, "binary"), {
        name: `${baseFolder}/Images/${getFileNameWithExt(img)}`,
      });
    } catch (err) {
      console.log(`Failed to add image ${img.url}`, err);
    }
  }

  // === SIZE CHARTS === (unchanged)
  for (const scId of size_charts) {
  const sc = await SizeChart.findById(scId);
  if (!sc) continue;
console.log(sc, '***************');

  try {
    const meas = sc.measurements || {};
    const allSizes = new Set();

    // Collect all size names
    for (const m of Object.values(meas)) {
      Object.keys(m).forEach((size) => allSizes.add(size));
    }
    const sizes = Array.from(allSizes);

    // Prepare worksheet data
    const worksheetData = [["Measurement", ...sizes]];
    for (const [measurementName, values] of Object.entries(meas)) {
      const row = [measurementName];
for (const size of sizes) row.push(values[size] ?? "");
      worksheetData.push(row);
    }

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sc.name || "SizeChart");

    // Write workbook to buffer and append to archive
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
      archive.append(buffer, {
      name: `${baseFolder}/SizeCharts/${"sizechart-" + sc._id}.xlsx`
    });
  } catch (err) {
    console.log(`Failed to export size chart ${sc._id}`, err);
  }
}


  // === MOODBOARDS (use helper) ===
  for (const mbId of moodboards) {
     const mb = proj.moodboards.find((m) => String(m._id) === String(mbId));
  if (!mb) continue;

    await exportMoodboardToArchive(archive, mb, {
      includeImages: mb.gallery_images?.map((g) => String(g._id)) || [],
      includeTextData: mb.textData?.map((t) => String(t._id)) || [],
      includeNotes: true,
      includeComment: true,
      includeProjects: true,
      baseFolder: `${baseFolder}/MoodBoards`,
    });
  }

  // === SUB PROJECTS ===
  for (const sub of sub_projects) {
    await processProject(sub, baseFolder);
  }
};

    // start processing
    for (const item of items) {
      await processProject(item);
    }

    await archive.finalize();

    await UsageLog.create({
      module: "project",
      type: "project_downloaded",
      user_id: req.user.id,
      tenant_id: req.user.tenant_id,
      metadata: { itemsCount: items.length, type: "zip" },
    });
  } catch (err) {
    console.error("ZIP creation error:", err);
    res.status(500).json({ error: "Failed to create ZIP" });
  }
};

// Helper: inline image as base64
async function imageToBase64(urlOrPath, maxWidth = 800) {
  try {
    let buffer;
    if (urlOrPath.startsWith("http")) {
      const res = await axios.get(urlOrPath, { responseType: "arraybuffer" });
      buffer = Buffer.from(res.data);
    } else {
      const relativePath = urlOrPath.replace(/^\/+/, "");
      const filePath = path.join(process.cwd(), "public", relativePath);
      buffer = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
    }
    if (!buffer) return "";

    // resize + compress
    const resized = await sharp(buffer).resize({ width: maxWidth }).jpeg({ quality: 70 }).toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch (err) {
    console.error("Optimized image fetch error:", urlOrPath, err);
    return "";
  }
}


// Recursively fetch a project and its children (each node includes populated moodboards)
async function fetchProjectTree(projectId) {
  const project = await Project.findById(projectId)
    .populate({
      path: "moodboards",
      populate: { path: "gallery_images.galleryImage", model: "GalleryImage" },
    })
    .lean();

  if (!project) return null;

  // Find direct children (only ids) then recursively fetch full objects
  const childDocs = await Project.find({ parent_id: project._id, is_deleted: false }).select("_id").lean();

  project.children = [];
  for (const cd of childDocs) {
    const childFull = await fetchProjectTree(cd._id);
    if (childFull) project.children.push(childFull);
  }

  return project;
}

// Render the hierarchy tree as HTML (arrows indicate depth)
function renderHierarchyHtml(node, depth = 0) {
  // indent and arrow repeated according to depth
  const arrow = depth > 0 ? "→ ".repeat(depth) : "";
  let html = `<div class="hierarchy-line" style="margin-bottom:6px;margin-left:${depth * 10}px;">
    <span style="font-family: monospace;">${arrow}</span><strong>${node.name || "Untitled Project"}</strong>
  </div>`;

  if (node.children && node.children.length) {
    for (const child of node.children) {
      html += renderHierarchyHtml(child, depth + 1);
    }
  }
  return html;
}

// Flatten tree into ordered list for generating project pages; attach _depth and _path (array of names)
function flattenProjectTree(root) {
  const flat = [];
  function walk(node, ancestors = []) {
    const path = [...ancestors, (node.name || "Untitled Project")];
    flat.push({
      project: node,
      _depth: ancestors.length,
      _path: path, // array of names (for breadcrumb)
    });
    if (node.children && node.children.length) {
      for (const c of node.children) walk(c, path);
    }
  }
  walk(root, []);
  return flat;
}

export const downloadProjectAsPDF = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  // Fetch full project tree (recursive)
  const rootProject = await fetchProjectTree(projectId);
  if (!rootProject) throw new ApiError(404, "Project not found");

  // Flatten the tree into an ordered array (pre-order traversal)
  const flatProjects = flattenProjectTree(rootProject); // each item: { project, _depth, _path }


  let html = `
  <html>
  <head>
    <style>
      @page { 
        size: A4; 
        margin: 20mm 15mm 20mm 15mm; 
      }
      body { 
        font-family: Arial, sans-serif; 
        margin: 0; 
        padding: 0; 
        color: #333; 
        line-height: 1.4;
      }
      
      /* Page break controls */
      .page { 
        page-break-after: always; 
        padding: 20px; 
        box-sizing: border-box; 
        min-height: calc(100vh - 40mm);
      }
      .page:last-child { 
        page-break-after: avoid; 
      }
      
      .section { 
        margin-bottom: 30px; 
        page-break-inside: avoid;
      }
      
      .force-new-page {
        page-break-before: always;
        padding-top: 20px;
      }
      
      /* Headings */
      h1, h2, h3 { 
        color: #2c3e50; 
        margin-top: 0;
        page-break-after: avoid;
      }
      
      h1 { 
        font-size: 24px; 
        margin-bottom: 20px;
        text-align: center;
        border-bottom: 2px solid #2c3e50;
        padding-bottom: 10px;
      }
      
      h2 { 
        font-size: 18px; 
        margin-bottom: 15px;
        margin-top: 25px;
        color: #34495e;
        page-break-before: avoid;
      }
      
      h3 { 
        font-size: 14px; 
        margin-bottom: 10px;
        color: #5a6c7d;
      }
      
      /* Project info section */
      .project-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 25px;
        page-break-inside: avoid;
      }
      
      /* Image grid improvements */
      .image-grid { 
        display: flex; 
        flex-wrap: wrap; 
        gap: 15px; 
        margin-bottom: 30px;
      }
      
      .image-card {
        flex: 1 1 calc(33.333% - 15px);
        min-width: 200px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 12px;
        background: #fafafa;
        page-break-inside: avoid;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .image-card img { 
        max-width: 100%; 
        max-height: 180px; 
        object-fit: contain; 
        border-radius: 4px;
        display: block;
        margin: 0 auto 10px;
      }
      
      .image-card .image-info {
        font-size: 11px;
        color: #666;
        margin-top: 8px;
      }
      
      /* Size chart styling */
      .size-chart-container {
        page-break-before: always;
        margin-top: 40px;
        padding: 20px 0;
      }
      
      .size-chart-header {
        background: #e3f2fd;
        padding: 10px 15px;
        border-radius: 5px;
        margin-bottom: 15px;
        border-left: 4px solid #2196f3;
      }
      
      table { 
        border-collapse: collapse; 
        width: 100%; 
        margin: 15px 0; 
        page-break-inside: avoid;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      th, td { 
        border: 1px solid #ddd; 
        padding: 8px 6px; 
        font-size: 11px; 
        text-align: center;
        vertical-align: middle;
      }
      
      th { 
        background: #f5f5f5; 
        font-weight: bold;
        color: #2c3e50;
      }
      
      tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      
      /* Moodboard specific styling */
      .moodboard-container {
        page-break-before: always;
        padding: 20px 0;
      }
      
      .moodboard-header {
        background: #fff3e0;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
        border-left: 4px solid #ff9800;
      }

      .hierarchy-line { font-size: 13px; color: #333; }
      
      /* Responsive adjustments */
      @media print {
        .image-card {
          flex: 1 1 calc(50% - 15px);
        }
        
        .force-new-page {
          page-break-before: always !important;
        }
      }
    </style>
  </head>
  <body>
  `;

    // Add Project Hierarchy at top
  html += `
    <div style="padding:10px 0;">
      <h2 style="font-size:18px;margin-bottom:8px;color:#2c3e50;">Project Hierarchy</h2>
      <div class="hierarchy-container" style="background:#fbfbfb;padding:12px;border-radius:6px;border:1px solid #eee;">
        ${renderHierarchyHtml(rootProject)}
      </div>
    </div>
    <div style="height:12px;"></div>
  `;

  // Iterate flattened projects and render their pages
  for (let i = 0; i < flatProjects.length; i++) {
    const projEntry = flatProjects[i];
    const project = projEntry.project;
    const depth = projEntry._depth;
    const breadcrumb = projEntry._path.join(" → ");

    if (i > 0) html += `<div class="force-new-page">`; else html += `<div class="page">`;

    html += `
      <h1>Project: ${project.name || "Untitled Project"}</h1>
      <div class="project-info">
        <p><strong>Hierarchy:</strong> ${breadcrumb}</p>
        <p><strong>Description:</strong> ${project.description || "N/A"}</p>
        <p><strong>Created:</strong> ${new Date(project.created_at).toLocaleString()}</p>
        <p><strong>Updated:</strong> ${new Date(project.updated_at).toLocaleString()}</p>
      </div>
    `;

    // ===== Images Section =====
    const images = await GalleryImage.find({ project_id: project._id }).lean();
    if (images.length) {
      html += `
        <div class="section">
          <h2>Project Images</h2>
          <div class="image-grid">
      `;

      for (const img of images) {
        const base64 = await imageToBase64(img.url);
        html += `
          <div class="image-card">
            <div style="text-align:center;">
              ${base64 ? `<img src="${base64}" alt="${img.name || 'Project Image'}"/>` : "<p>[Missing image]</p>"}
            </div>
            ${img.name ? `<h4 style="margin: 8px 0 4px; font-size: 12px; color: #2c3e50;">${img.name}</h4>` : ""}
            ${img.description ? `<div class="image-info"><strong>Description:</strong> ${img.description}</div>` : ""}
            <div class="image-info">
              <div>Created: ${new Date(img.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        `;
      }

      html += `</div></div>`;

      // ===== Size Charts Section (Separate from Images) =====
      const imageIds = images.map(img => img._id);
      const sizeCharts = await SizeChart.find({ gallery_image_ids: { $in: imageIds } }).lean();

      if (sizeCharts.length) {
        html += `<div class="size-chart-container"><h2>Size Charts</h2>`;

        for (const sc of sizeCharts) {
          const associatedImages = images.filter(img =>
            sc.gallery_image_ids.some(id => String(id) === String(img._id))
          );

          html += `
            <div class="size-chart-header">
              <h3 style="margin: 0; color: #1976d2;">${sc.name || "Untitled Size Chart"}</h3>
              ${associatedImages.length ?
                `<p style="margin: 5px 0 0; font-size: 11px; color: #666;">
                  Associated with: ${associatedImages.map(img => img.name || 'Unnamed').join(', ')}
                </p>` : ''
              }
            </div>
          `;

          // Measurements
          if (sc.measurements && Object.keys(sc.measurements).length) {
            html += `<h4>Measurements</h4>`;
            const sizes = new Set();
            Object.values(sc.measurements).forEach(row =>
              Object.keys(row).forEach(s => sizes.add(s))
            );
            const sizeArr = Array.from(sizes);
            html += `<table><thead><tr><th>Measurement</th>${sizeArr.map(s => `<th>${s}</th>`).join("")}</tr></thead><tbody>`;

            for (const [m, vals] of Object.entries(sc.measurements)) {
              html += `<tr><td style="background: #f0f0f0; font-weight: bold;">${m}</td>${sizeArr.map(s => `<td>${vals[s] || "-"}</td>`).join("")}</tr>`;
            }
            html += `</tbody></table>`;
          }

          // Other sections
          const sections = [{ key: 'grading_rules', title: 'Grading Rules' }, { key: 'tolerance', title: 'Tolerance' }, { key: 'size_conversion', title: 'Size Conversion' }];

          sections.forEach(({ key, title }) => {
            if (sc[key] && Object.keys(sc[key]).length) {
              html += `<h4>${title}</h4>`;
              
              if (key === 'size_conversion') {
                // Special handling for size conversion table
                const sizes = Object.keys(sc.size_conversion);
                const regions = new Set();
                
                // Get all unique regions
                sizes.forEach(size => {
                  Object.keys(sc.size_conversion[size]).forEach(region => {
                    regions.add(region);
                  });
                });

                html += `<table><thead><tr><th>Size</th>`;
                Array.from(regions).forEach(region => {
                  html += `<th>${region}</th>`;
                });
                html += `</tr></thead><tbody>`;

                sizes.forEach(size => {
                  html += `<tr><td style="background: #f0f0f0; font-weight: bold;">${size}</td>`;
                  Array.from(regions).forEach(region => {
                    const value = sc.size_conversion[size][region] || '-';
                    html += `<td>${value}</td>`;
                  });
                  html += `</tr>`;
                });
                html += `</tbody></table>`;
              } else {
                // Original code for other tables
                html += `<table><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>`;
                for (const [k, v] of Object.entries(sc[key])) {
                  html += `<tr><td style="background: #f0f0f0; font-weight: bold;">${k}</td><td>${v}</td></tr>`;
                }
                html += `</tbody></table>`;
              }
            }
          });
        }

        html += `</div>`; // close size-chart-container
      }
    }

    // ===== Moodboards Section =====
    if (project.moodboards?.length) {
      html += `<div class="moodboard-container"><h2>Moodboards</h2>`;
      for (let mbIndex = 0; mbIndex < project.moodboards.length; mbIndex++) {
        const mb = project.moodboards[mbIndex];
        const selectedImages = mb.gallery_images.map((g) => g);

        if (mbIndex > 0) html += `<div style="page-break-before: always;">`;

        html += `
          <div class="moodboard-header">
            <h3 style="margin: 0; color: #f57c00;">Moodboard: ${mb.name}</h3>
            <p style="margin: 5px 0 0; font-size: 11px; color: #666;">
              Created: ${new Date(mb.created_at).toLocaleDateString()}
            </p>
          </div>
        `;

        const mbHTML = generatePDFContent(mb, selectedImages, {
          includeTextData: true,
          includeNotes: true,
          includeComment: true,
          includeProjects: false,
        });

        html += `<div class="section">${mbHTML}</div>`;

        if (mbIndex > 0) html += `</div>`;
      }
      html += `</div>`;
    }

    html += `</div>`; // close page
  } // end for each project

  html += `</body></html>`;

  // Render to PDF via puppeteer (same as before)
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  await page.setContent(html, {
    waitUntil: "networkidle0",
    timeout: 60000
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });

  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=project-${projectId}.pdf`);
  res.send(pdfBuffer);
});
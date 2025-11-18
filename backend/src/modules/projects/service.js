import Project from "./model.js";
import * as galleryService from "../gallery/service.js";
import { ApiError } from "../../utils/ApiError.js";
import fs from "fs";
import GalleryImage from "../gallery/model.js"; // adjust import
import { sendNotificationToTenantUsers } from "../../utils/notificationUtils.js";
import SizeChart from "../image_variation/sizeChartSchema.js"; // adjust import
import Moodboard from "../moodboards/model.js"
import UserCredits from "../credits/model.js";
import AiTask from "../image_variation/model.js";
import { deductCredits } from "../../utils/creditUtils.js";
import User from "../users/model.js";

export const createProject = async (data) => {
    return await Project.create(data);
};

export const getProjects = async (query, user) => {
  const { parent_id, search, startDate, endDate } = query;
  const { id: user_id, tenant_id, is_super_admin, is_admin } = user;

  const filter = {
    tenant_id,
    is_deleted: false,
    is_active: true,
  };

  // 🧠 Role-based filtering
  if (is_super_admin) {
    // Super Admin → see all projects for the tenant
  } else if (is_admin) {
    const userIds = await User.find({ created_by: user_id }).distinct("_id");
    filter.user_ids = { $in: [user_id, ...userIds] };
  } else {
    filter.user_ids = user_id;
  }

  // 📅 Date range filtering
  if (startDate || endDate) {
    filter.created_at = {};
    if (startDate) {
      filter.created_at.$gte = new Date(startDate);
    }
    if (endDate) {
      // include full day for endDate (till 23:59:59)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.created_at.$lte = end;
    }
  }

  // 🔍 Search (includes descendants)
  if (search) {
    const rootProjects = await Project.find({
      tenant_id,
      is_deleted: false,
      is_active: true,
      name: { $regex: search, $options: "i" },
    }).select("_id");

    const rootIds = rootProjects.map((p) => p._id);

    const allProjectIds = new Set(rootIds);
    const queue = [...rootIds];

    while (queue.length) {
      const currentId = queue.shift();
      const children = await Project.find({
        parent_id: currentId,
        tenant_id,
        is_deleted: false,
        is_active: true,
      }).select("_id");

      for (const child of children) {
        if (!allProjectIds.has(child._id.toString())) {
          allProjectIds.add(child._id.toString());
          queue.push(child._id);
        }
      }
    }

    filter._id = { $in: Array.from(allProjectIds) };
  } else {
    // 🧩 Normal parent filtering
    if (parent_id === "null") {
      filter.parent_id = null;
    } else if (parent_id) {
      filter.parent_id = parent_id;
    }
  }

  // 🚀 Fetch projects
  return await Project.find(filter)
    .populate("user_ids")
    .populate("parent_id")
    .populate("moodboards", "name");
};


export const getProjectById = async (id, tenantId, userId) => {
    const project = await Project.findOne({
        _id: id,
        user_ids : userId,
        tenant_id: tenantId,
        is_deleted: false,
    })
        .populate("user_ids")
        .populate("parent_id")
        // .populate("size_charts") 
        .populate("moodboards", "name"); // populate only `name` field
        // .populate("images");


    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return project;
};

export const updateProject = async (
  id,
  data,
  user_id,
  tenant_id,
  files = []
) => {
  const {
    name,
    description,
    start_date,
    end_date,
    parent_id,
    existingImages = [],
    removedImageIds = [],
    newGalleryImageIds = [],
    updated_by,
    moodboards = [], // NEW: moodboards array
  } = data;

  const project = await Project.findOne({
    _id: id,
    is_deleted: false,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // ✅ Basic field updates
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (start_date) project.start_date = start_date;
  if (end_date) project.end_date = end_date;
  if (parent_id === "null" || parent_id === "") {
    project.parent_id = null;
  } else if (parent_id) {
    project.parent_id = parent_id;
  }
  if(moodboards)project.moodboards = moodboards;
  if (updated_by) project.updated_by = updated_by;
  // if (data.size_charts) {
  // let sizeCharts = data.size_charts;

  // if (typeof sizeCharts === "string") {
  //   try {
  //     // Try parsing as JSON array first
  //     sizeCharts = JSON.parse(sizeCharts);
  //   } catch (err) {
  //     // Fallback: comma-separated string
  //     sizeCharts = sizeCharts.split(",").map((id) => id.trim());
  //   }
  // }

  // project.size_charts = sizeCharts;
// }


  // const sizeChartsToConnect = await SizeChart.find({
  //   gallery_image_id: { $in: newGalleryImageIds  },
  //   user_id
  // })

  // console.log("Size Charts:", sizeChartsToConnect, newGalleryImageIds);

  // if (sizeChartsToConnect.length > 0) {
  //   const newChartIds = sizeChartsToConnect.map((chart) => chart._id.toString());

  //   // Merge existing and new, avoid duplicates
  //   const existingChartIds = project.size_charts?.map(id => id.toString()) || [];
  //   const mergedChartIds = Array.from(new Set([...existingChartIds, ...newChartIds]));

  //   project.size_charts = mergedChartIds;
  // }


  await project.save();

  // ✅ 1. Remove images
  if (removedImageIds.length > 0) {
    await GalleryImage.updateMany(
      { _id: { $in: removedImageIds }, project_id: project._id },
      { $set: { project_id: null } }
    );
  }

  // ✅ 2. Handle new gallery images (AI + normal)
  if (newGalleryImageIds.length > 0) {
    const allIds = [];
    const allUrls = [];

    for (const img of newGalleryImageIds) {
      if (typeof img === "string") {
        allIds.push(img);
      } else if (typeof img === "object") {
        if (img.id) allIds.push(img.id);
        if (img.url) allUrls.push(img.url);
      }
    }

    // --- Normal gallery ---
    const galleryImages = await GalleryImage.find({
      _id: { $in: allIds },
      tenant_id,
      user_id
    });

    const normalIds = galleryImages.map((g) => g._id.toString());

    if (normalIds.length > 0) {
      const savedImages = await GalleryImage.find({
        _id: { $in: normalIds },
        tenant_id,
        user_id,
        status: "saved",
      });

      if (savedImages.length > 0) {
        const creditsToDeduct = savedImages.length;

        // const userCredit = await UserCredits.findOne({ user_id });
        // if (!userCredit) throw new ApiError(400, "User Credits Not Found!");
        // if (userCredit.credits < creditsToDeduct) {
        //   throw new ApiError(403, "Not enough credits to add saved images.");
        // }

        // userCredit.credits -= creditsToDeduct;
        // userCredit.creditUsedSinceLastReview += creditsToDeduct;
        // await userCredit.save();

        await deductCredits({
          tenantId: tenant_id,
          userId: user_id,
          creditsToDeduct: creditsToDeduct,
        })
      }

      await GalleryImage.updateMany(
        { _id: { $in: normalIds }, tenant_id },
        { $set: { project_id: project._id } }
      );
    }

    // --- AI-generated ---
if (allUrls.length > 0) {
  const decryptedUrls = allUrls.map((url) => {
    const encryptedId = url.split("/").pop();
    return galleryService.decryptImagePath(encryptedId);
  });

  const aiTasks = await AiTask.find({
    user_id,
    result: { $in: decryptedUrls },
  });

  const aiGenerated = [];
  for (const ai of aiTasks) {
    for (const url of ai.result) {
      if (decryptedUrls.includes(url)) {
        aiGenerated.push({ task_id: ai.task_id, url });
      }
    }
  }

  if (aiGenerated.length > 0) {
    const creditsToDeduct = aiGenerated.length;
    // const userCredit = await UserCredits.findOne({ user_id });
    // if (!userCredit) throw new ApiError(400, "User Credits Not Found!");
    // if (userCredit.credits < creditsToDeduct) {
    //   throw new ApiError(403, "Not enough credits to add selected images.");
    // }

    // userCredit.credits -= creditsToDeduct;
    // userCredit.creditUsedSinceLastReview += creditsToDeduct;
    // await userCredit.save();

    await deductCredits({
      tenantId: tenant_id,
      userId: user_id,
      creditsToDeduct: creditsToDeduct,
    });

    const timestamp = Date.now();
    await Promise.all(
      aiGenerated.map(async (img) => {        
        await AiTask.updateOne(
          { task_id: img.task_id, user_id },
          { $pull: { result: img.url } }
        );

        const existing = await GalleryImage.findOne({
          task_id: img.task_id,
          url: img.url,
          user_id,
          tenant_id,
        });

        if (existing) {
          existing.project_id = project._id;
          await existing.save();
        } else {
          const galleryImage = await GalleryImage.create({
            url: img.url,
            name: `Generated Image-${timestamp}`,
            description: "",
            tenant_id,
            user_id,
            project_id: project._id,
            status: "finalized",
            task_id: img.task_id,
          });
        }
      })
    );
  }
}

  }

  // ✅ 3. Update descriptions
  for (const img of existingImages) {
    if (img.id && img.description !== undefined) {
      await GalleryImage.findByIdAndUpdate(img.id, {
        description: img.description,
      });
    }
  }

  // ✅ 4. Handle new file uploads
  for (const file of files) {
    await GalleryImage.create({
      user_id,
      tenant_id,
      project_id: project._id,
      url: `${process.env.BASE_URL}/${file.path.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`,
      name: file.originalname,
      status: "uploaded",
      created_by: updated_by,
    });
  }

  // ✅ 5. Return updated project
  return await Project.findById(project._id)
    .populate("user_ids")
    .populate("parent_id")
    .populate("moodboards", "name");
};

export const deleteProject = async (id, tenantId, userId, io) => {
    const softDeleteRecursive = async (projectId) => {
        // Soft delete the current project
        await Project.updateOne(
            { _id: projectId, tenant_id: tenantId, is_deleted: false },
            { is_deleted: true },
        );

        // Find direct children
        const children = await Project.find({
            parent_id: projectId,
            user_ids: userId,
            tenant_id: tenantId,
            is_deleted: false,
        });

        // Recursively delete each child
        for (const child of children) {
            await softDeleteRecursive(child._id);
        }
    };

    const rootProject = await Project.findOne({
        _id: id,
        user_ids: userId,
        tenant_id: tenantId,
        is_deleted: false,
    });

    if (!rootProject) throw new ApiError(404, "Project not found");

    await softDeleteRecursive(rootProject._id);

    //  Send tenant-wide notification
    await sendNotificationToTenantUsers(io || global.io, {
        tenant_id: tenantId,
        message: `An Project titled "${rootProject.name || "Untitled"}" was deleted.`,
        type: "delete_warning",
    });

    return rootProject;
};

export const addUser = async (projectId, userId, tenantId) => {
    const project = await Project.findOneAndUpdate(
        { _id: projectId, tenant_id: tenantId, is_deleted: false },
        { $addToSet: { user_ids: userId } },
        { new: true },
    );

    if (!project) throw new ApiError(404, "Project not found");

    return project;
};

export const removeUser = async (projectId, userId, tenantId) => {
    const project = await Project.findOneAndUpdate(
        { _id: projectId, tenant_id: tenantId, user_ids : userId, is_deleted: false },
        { $pull: { user_ids: userId } },
        { new: true },
    );

    if (!project) throw new ApiError(404, "Project not found");

    return project;
};

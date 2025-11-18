import { ApiError } from "../../utils/ApiError.js";
import Moodboard from "./model.js";
import Tenant from '../tenants/model.js'
import fs from "fs";
import  UsageLog  from "../dashboard/model.js";
import fetch from 'node-fetch';
import axios from 'axios';
import GalleryImage from '../gallery/model.js'
import ResourceAccessService from "../share/ResourceAccessService.js";

export const createMoodboard = async (data) => {
    const results = await Moodboard.create(data);

    await UsageLog.create({
        module: "moodboard",
        type: "moodboard_created",
        user_id: data.user_id,
        tenant_id: data.tenant_id,
        metadata: {
            name: results.name,
        },
    });

    return results;
};
  let moodboards = [];


export const getMoodboards = async (query) => {
  const {
    user_id,
    project_id,
    populate,
    search,
    tenant_id,
    sort,
    userRoles = [],
    isSharedWithMe = false,
    isSharedWithOthers = false,
  } = query;

  let moodboards = [];

  // 🔹 CASE 1: Moodboards shared *with me*
  if (isSharedWithMe) {
    const includeOwned = !isSharedWithMe || isSharedWithMe === "false";
    const includeShared = true;

    const accessibleResources = await ResourceAccessService.getAccessibleResources(
      "Moodboard",
      user_id,
      tenant_id,
      userRoles,
      {
        page: 1,
        limit: 2000,
        permission: ["read"],
        includeOwned,
        includeShared,
      }
    );

    const moodboardIds = accessibleResources?.map(item => item._id) || [];

    let queryBuilder = Moodboard.find({ _id: { $in: moodboardIds } });

    if (populate) {
      queryBuilder = queryBuilder
        .populate("user_id")
        .populate("project_ids")
        .populate({
          path: "gallery_images.galleryImage",
          select: "name description source tags url",
        });
    }

    if (sort) {
      const sortMap = {
        NEWEST_FIRST: { created_at: -1 },
        OLDEST_FIRST: { created_at: 1 },
        "A-Z": { name: 1 },
        "Z-A": { name: -1 },
      };
      queryBuilder = queryBuilder.sort(sortMap[sort] || {});
    }

    // Execute query
    const fetchedMoodboards = await queryBuilder;

    // Merge accessible resource info
    moodboards = fetchedMoodboards.map((board) => {
      const accessInfo = accessibleResources.find(r => r._id.toString() === board._id.toString());
      return {
        ...board.toObject(),
        accessType: accessInfo?.accessType || "owner",
        permissions: accessInfo?.permissions || board.permissions || {},
        sharedBy: accessInfo?.sharedBy || null,
        shareId: accessInfo?.shareId || null,
      };
    });

    return moodboards;
  }

  // 🔹 CASE 2: Moodboards I shared *with others*
  if (isSharedWithOthers) {
    const sharedResources = await ResourceAccessService.getResourcesSharedWithOthers(
      "Moodboard",
      user_id,
      { page: 1, limit: 2000, permission: ["read"] }
    );

    const moodboardIds = sharedResources?.map(item => item._id) || [];

    let queryBuilder = Moodboard.find({ _id: { $in: moodboardIds } });

    if (populate) {
      queryBuilder = queryBuilder
        .populate("user_id")
        .populate("project_ids")
        .populate({
          path: "gallery_images.galleryImage",
          select: "name description source tags url",
        });
    }

    if (sort) {
      const sortMap = {
        NEWEST_FIRST: { created_at: -1 },
        OLDEST_FIRST: { created_at: 1 },
        "A-Z": { name: 1 },
        "Z-A": { name: -1 },
      };
      queryBuilder = queryBuilder.sort(sortMap[sort] || {});
    }

    const fetchedMoodboards = await queryBuilder;

    moodboards = fetchedMoodboards.map((board) => {
      const accessInfo = sharedResources.find(r => r._id.toString() === board._id.toString());
      return {
        ...board.toObject(),
        accessType: accessInfo?.accessType || "owner",
        permissions: accessInfo?.permissions || board.permissions || {},
        sharedBy: accessInfo?.sharedBy || null,
        shareId: accessInfo?.shareId || null,
      };
    });

    return moodboards;
  }

  // 🔹 CASE 3: Default (owned moodboards)
  const filter = { tenant_id };
  if (user_id) filter.user_id = user_id;
  if (project_id) filter.project_ids = project_id;
  if (search) filter.name = { $regex: search, $options: "i" };

  let queryBuilder = Moodboard.find(filter);

  if (populate) {
    queryBuilder = queryBuilder
      .populate("user_id")
      .populate("project_ids")
      .populate({
        path: "gallery_images.galleryImage",
        select: "name description source tags url",
      });
  }

  if (sort) {
    const sortMap = {
      NEWEST_FIRST: { created_at: -1 },
      OLDEST_FIRST: { created_at: 1 },
      "A-Z": { name: 1 },
      "Z-A": { name: -1 },
    };
    queryBuilder = queryBuilder.sort(sortMap[sort] || {});
  }

  const fetchedMoodboards = await queryBuilder;

  moodboards = fetchedMoodboards.map((board) => ({
    ...board.toObject(),
    accessType: "owner",
    permissions: board.permissions || {},
    sharedBy: null,
    shareId: null,
  }));

  return moodboards;
};


export const getMoodboardById = async (id, userId, tenantId, userRoles) => {

const moodboard = await ResourceAccessService.getAccessibleResourceById(
    "Moodboard",
    id,
    userId,
    tenantId,
    userRoles,
    "read",
    ["gallery_images.galleryImage"]
  );

  if (!moodboard) {
    throw new ApiError(403, "Access denied");
  }

    return moodboard;
};

export const updateMoodboard = async (id, data, tenantId, user, userRoles) => {
    const {
        name,
        project_ids,
        comment,
        notes,
        existingImages,
        removedImageIds,
        newGalleryImages,
        textData
    } = data;

const hasAccess = await ResourceAccessService.hasAccess(
    "Moodboard",
    id,
    user.id,
    tenantId,
    userRoles,
    ["edit"]
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to update this project",
    });
  }

    const moodboard = await Moodboard.findOne({
        _id: id,
    });

    if (!moodboard) {
        throw new ApiError(404, "Moodboard not found");
    }

    // Update basic fields
    if (name) moodboard.name = name;
    if (project_ids) moodboard.project_ids = project_ids;
    if (comment !== undefined) moodboard.comment = comment;
    if (notes !== undefined) moodboard.notes = notes;

    
    // Update textData with source and tags
    if (textData) {
        moodboard.textData = textData.map(item => ({
            text: item.text || "",
            source: item.source || null,
            tags: item.tags || []
        }));
    }

    // Handle existing images updates
    if (existingImages && existingImages.length > 0) {
        for (const { _id, description, source, tags } of existingImages) {
            // Find the gallery image in moodboard.gallery_images
            const galleryImageEntry = moodboard.gallery_images.find(
                (item) => item._id.toString() === _id
            );
            
            if (galleryImageEntry) {
                // Update the moodboard's gallery_images entry
                galleryImageEntry.description = description || null;
                galleryImageEntry.source = source || null;
                galleryImageEntry.tags = tags ? 
                    (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) 
                    : [];

                // Also update the actual GalleryImage document
                await GalleryImage.findByIdAndUpdate(
                    galleryImageEntry.galleryImage,
                    {
                        description: description || null,
                        source: source || null,
                        tags: galleryImageEntry.tags
                    }
                );
            }
        }
    }

    // Remove images
    if (removedImageIds && removedImageIds.length > 0) {
        for (const imageId of removedImageIds) {
            const galleryImageIndex = moodboard.gallery_images.findIndex(
                (item) => item._id.toString() === imageId
            );
            

            if (galleryImageIndex !== -1) {
                const galleryImageEntry = moodboard.gallery_images[galleryImageIndex];
                
                // Get the GalleryImage document to access the file path
                // Commented this due to requirement of not deleting the gallery image after we delete the moodboard
                // const galleryImage = await GalleryImage.findById(galleryImageEntry.galleryImage);
                
                // if (galleryImage) {
                //     // Extract file path from URL and delete the physical file
                //     const urlPath = galleryImage.url.replace(process.env.BASE_URL + '/', '');
                //     const imageUrl = `public/${urlPath}`;
                    
                //     try {
                //         fs.unlinkSync(imageUrl);
                //     } catch (error) {
                //         console.error(`Failed to delete file ${imageUrl}:`, error);
                //     }
                    
                //     // Delete the GalleryImage document
                //     await GalleryImage.findByIdAndDelete(galleryImageEntry.galleryImage);
                // }
                
                // Remove from moodboard's gallery_images array
                moodboard.gallery_images.splice(galleryImageIndex, 1);
            }
        }
    }

    // Add new gallery images
    if (newGalleryImages && newGalleryImages.length > 0) {
        moodboard.gallery_images.push(...newGalleryImages);
    }

    await moodboard.save();

    await UsageLog.create({
        module: "moodboard",
        type: 'moodboard_edited',
        user_id: user.id,
        tenant_id: user.tenant_id,
        metadata: {
            name: moodboard.name,
        },
    });

    return moodboard.populate(["user_id", "project_ids"]);
};

export const deleteMoodboard = async (id, tenantId,user) => {
    const moodboard = await Moodboard.findOne({
        _id: id,
        tenant_id: tenantId,
    });

    if (!moodboard) {
        throw new ApiError(404, "Moodboard not found");
    }

    moodboard.images.forEach((image) => {
        const imageUrl = `public/${image.url}`;
        try {
            fs.unlinkSync(imageUrl);
        } catch (error) {
            console.error(`Failed to delete file ${imageUrl}:`, error);
        }
    });

    await moodboard.deleteOne();
    // hereeeeeeeeeeeeeeeeeeeeeeeee
      await UsageLog.create({
        module: "moodboard",
        type: 'moodboard_deleted',
        user_id: user.id,
        tenant_id:user.tenant_id,
        metadata: {
            name: moodboard.name,
        },
    });

    return moodboard;
};

export const addImage = async (moodboardId, images, tenantId) => {
    const moodboard = await Moodboard.findOne({
        _id: moodboardId,
        tenant_id: tenantId,
    });

    if (!moodboard) {
        throw new ApiError(404, "Moodboard not found");
    }

    moodboard.images.push(...images);
    await moodboard.save();
    return moodboard;
};

export const removeImage = async (moodboardId, imageId, tenantId) => {
    const moodboard = await Moodboard.findOne({
        _id: moodboardId,
        tenant_id: tenantId,
    });

    if (!moodboard) {
        throw new ApiError(404, "Moodboard not found");
    }

    const imageIndex = moodboard.images.findIndex(
        (image) => image._id.toString() === imageId,
    );

    if (imageIndex === -1) {
        throw new ApiError(404, "Image not found in moodboard");
    }

    const imageUrl = `public/${moodboard.images[imageIndex].url}`;
    moodboard.images.splice(imageIndex, 1);
    await moodboard.save();

    try {
        fs.unlinkSync(imageUrl);
    } catch (error) {
        console.error(`Failed to delete file ${imageUrl}:`, error);
    }

    return moodboard.populate(["user_id", "project_ids"]);
};

export const addText = async (moodboardId, texts, tenantId) => {
    const moodboard = await Moodboard.findOne({
        _id: moodboardId,
        tenant_id: tenantId,
    });

    if (!moodboard) {
        throw new ApiError(404, "Moodboard not found");
    }

    moodboard.textData.push(...texts); 
    await moodboard.save();

    return moodboard;
};


export const removeText = async (moodboardId, textId, tenantId) => {
    const moodboard = await Moodboard.findOne({
        _id: moodboardId,
        tenant_id: tenantId,
    });

    if (!moodboard) {
        throw new ApiError(404, "Moodboard not found");
    }

    const textIndex = moodboard.textData.findIndex(
        (text) => text._id.toString() === textId
    );

    if (textIndex === -1) {
        throw new ApiError(404, "Text not found in moodboard");
    }

    moodboard.textData.splice(textIndex, 1); // Remove text
    await moodboard.save();

    return moodboard.populate(["user_id", "project_ids"]);
};

export const fetchImageFromUrl = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 second timeout
    });

    const contentType = response.headers['content-type'];
    
    if (!contentType || !contentType.startsWith('image/')) {
      throw new ApiError(400, 'Response is not an image');
    }

    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0] || 'image.jpg';

    return {
      buffer: response.data,
      contentType,
      filename,
      originalUrl: url
    };
  } catch (error) {
    console.error("Error fetching image:", url, error.message);
    if (error.code === 'ECONNABORTED') {
      throw new ApiError(408, 'Request timeout');
    }
    throw new ApiError(500, error.message);
  }
};


export const getTenantTags = async (tenantId, search) => {
  if (!tenantId) {
    throw new ApiError(400, "Tenant ID is required");
  }

  const tenant = await Tenant.findById(tenantId).lean();

  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  const tags = Array.isArray(tenant.tags) ? tenant.tags : [];
  console.log('search',search)
  const matchingTags = tags.filter((tag) =>
    tag.toLowerCase().includes(search)
  );

  return matchingTags;
};


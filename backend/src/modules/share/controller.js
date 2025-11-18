import { Share } from "./model.js";
import ResourceAccessService from "./ResourceAccessService.js";
import mongoose from 'mongoose';

export const shareResource = async (req, res) => {
  try {
    const {
      resourceType,
      resourceId,
      sharedWithUserId,
      sharedWithRoleId,
      sharedWithTenantId,
      permissions,
      expiresAt,
      notes
    } = req.body;

    const allowedResourceTypes = ["Project", "Moodboard", "SizeChart", "GalleryImage"];
    if (!allowedResourceTypes.includes(resourceType)) {
      return res.status(400).json({ error: "Invalid resource type" });
    }

    const share = await ResourceAccessService.shareResource({
      resourceType,
      resourceId,
      sharedBy: req.user.id,
      sharedWithUser: sharedWithUserId,
      sharedWithRole: sharedWithRoleId,
      sharedWithTenant: sharedWithTenantId,
      permissions,
      expiresAt,
      notes
    });

    res.json({ success: true, share });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSharesForResource = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;

    const shares = await Share.find({
      resource_type: resourceType,
      resource_id: resourceId,
      is_active: true
    })
      .populate("shared_with_user", "name email")
      .populate("shared_with_role", "name")
      .populate("shared_with_tenant", "name")
      .populate("shared_by", "name email");

    res.json({ shares });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateSharePermissions = async (req, res) => {
  try {
    const { permission } = req.body;
    let permissionObject ;
    if(permission === "editor"){
      permissionObject = {read :true,edit:true,share: false,delete:false }
    }else{
      permissionObject = { read :true, edit:false, share: false,delete:false }
    }

    const share = await ResourceAccessService.updateSharePermissions(
      req.params.shareId,
      permissionObject,
      req.user.id
    );

    res.json({ success: true, share });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const revokeShare = async (req, res) => {
  try {
    await ResourceAccessService.revokeShare(
      req.params.shareId,
      req.user.id
    );

    res.json({ success: true, message: "Share revoked successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSharedWithMe = async (req, res) => {
  try {
    const { resourceType } = req.query;
    const types = resourceType ? [resourceType] : ["Project", "Moodboard", "SizeChart", "GalleryImage"];

    const allShared = [];

    for (const type of types) {
      const resources = await ResourceAccessService.getAccessibleResources(
        type,
        req.user.id,
        req.user.tenant_id,
        req.user.roles,
        {
          includeOwned: false,
          includeShared: true,
          page: req.query.page,
          limit: req.query.limit
        }
      );

      allShared.push(...resources.map(r => ({ ...r, resourceType: type })));
    }

    res.json({ sharedResources: allShared });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get all users with whom a resource has been shared
 * GET /api/shares/:resourceType/:resourceId/users
 */
export const getSharedUsers = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { includeExpired, includeInactive } = req.query;

    const allowedResourceTypes = ["Project", "Moodboard", "SizeChart", "GalleryImage"];
    if (!allowedResourceTypes.includes(resourceType)) {
      return res.status(400).json({ error: "Invalid resource type" });
    }

    // Validate resourceId format
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    // Verify user has access to this resource (at least read permission)
    const access = await ResourceAccessService.hasAccess(
      resourceType,
      resourceId,
      req.user.id,
      req.user.tenant_id,
      req.user.roles,
      ["read"]
    );

    if (!access) {
      return res.status(403).json({ 
        error: "You don't have permission to view this resource" 
      });
    }

    // Only owner or users with share permission can view shared users list
    const canViewShares = access.accessType === "owner" || 
                          (access.permissions && access.permissions.share);

    // if (!canViewShares) {
    //   return res.status(403).json({ 
    //     error: "You don't have permission to view share details for this resource" 
    //   });
    // }

    // Get shared users
    const sharedUsers = await ResourceAccessService.getSharedUsers(
      resourceType,
      resourceId,
      {
        includeExpired: includeExpired === 'true',
        includeInactive: includeInactive === 'true'
      }
    );

    res.json({ 
      success: true, 
      resourceType,
      resourceId,
      count: sharedUsers.length,
      sharedUsers 
    });

  } catch (error) {
    console.error("Error fetching shared users:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all entities (users, roles, tenants) with whom a resource has been shared
 * GET /api/shares/:resourceType/:resourceId/all
 */
export const getAllSharedEntities = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { includeExpired, includeInactive } = req.query;

    const allowedResourceTypes = ["Project", "Moodboard", "SizeChart", "GalleryImage"];
    if (!allowedResourceTypes.includes(resourceType)) {
      return res.status(400).json({ error: "Invalid resource type" });
    }

    // Validate resourceId format
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    // Verify user has access to this resource
    const access = await ResourceAccessService.hasAccess(
      resourceType,
      resourceId,
      req.user.id,
      req.user.tenant_id,
      req.user.roles,
      ["read"]
    );

    if (!access) {
      return res.status(403).json({ 
        error: "You don't have permission to view this resource" 
      });
    }

    // Only owner or users with share permission can view shared entities list
    const canViewShares = access.accessType === "owner" || 
                          (access.permissions && access.permissions.share);

    // if (!canViewShares) {
    //   return res.status(403).json({ 
    //     error: "You don't have permission to view share details for this resource" 
    //   });
    // }

    // Get all shared entities
    const entities = await ResourceAccessService.getAllSharedEntities(
      resourceType,
      resourceId,
      {
        includeExpired: includeExpired === 'true',
        includeInactive: includeInactive === 'true'
      }
    );

    res.json({ 
      success: true, 
      resourceType,
      resourceId,
      totalShares: entities.users.length + entities.roles.length + entities.tenants.length,
      entities 
    });

  } catch (error) {
    console.error("Error fetching shared entities:", error);
    res.status(500).json({ error: error.message });
  }
};


import mongoose from "mongoose";
import { Share } from "./model.js";

class ResourceAccessService {
    /**
     * Check if user has access to a resource
     */
static async hasAccess(
    resourceType,
    resourceId,
    userId,
    tenantId,
    userRoles = [],
    permissions = ["edit"], // optional, can still pass specific permissions
) {
    const Model = mongoose.model(resourceType);

    // 1️⃣ Check if the resource belongs to the user's tenant (owner access)
    const ownedResource = await Model.findOne({
        _id: resourceId,
        tenant_id: tenantId,
    });
    if (ownedResource) {
        return true; // owner has full access
    }

    // 2️⃣ Check if the resource is shared with the user
    const now = new Date();

    // Build query dynamically based on requested permissions
    const permissionQuery = permissions.map(p => ({ [`permissions.${p}`]: true }));

    const shareQuery = {
        resource_type: resourceType,
        resource_id: resourceId,
        is_active: true,
        $or: [{ expires_at: null }, { expires_at: { $gt: now } }],
        $and: [
            {
                $or: [
                    { shared_with_user: userId },
                    { shared_with_tenant: tenantId },
                    { shared_with_role: { $in: userRoles } },
                ],
            },
            { $or: permissionQuery }, // match any requested permission dynamically
        ],
    };

    const share = await Share.findOne(shareQuery);

    if (share) {
        return true; // user has at least one of the permissions
    }

    return false; // no access
}

    /**
     * Get all resources accessible to a user (owned + shared)
     */
    static async getAccessibleResources(
    resourceType,
    userId,
    tenantId,
    userRoles = [],
    options = {},
    populateFields = [] // <-- added populateFields
) {
    const {
        page = 1,
        limit = 20,
        permission = ["read"],
        includeOwned = true,
        includeShared = true,
    } = options;

    const Model = mongoose.model(resourceType);
    const results = [];

    // 1. Get owned resources (tenant resources)
    if (includeOwned) {
        let ownedQueryBuilder = Model.find({
            tenant_id: tenantId,
            is_deleted: false,
        }).limit(limit).skip((page - 1) * limit)
        .setOptions({ strictPopulate: false })
        ;

        // Apply dynamic populate
        populateFields.forEach((field) => {
            ownedQueryBuilder = ownedQueryBuilder.populate(field);
        });

        const owned = await ownedQueryBuilder.lean();

        results.push(
            ...owned.map((r) => ({
                ...r,
                accessType: "owner",
                permissions: {
                    read: true,
                    edit: true,
                    share: true,
                    delete: true,
                },
            }))
        );
    }

    // 2. Get shared resources
    if (includeShared) {
        const now = new Date();
        const shareQuery = {
            resource_type: resourceType,
            is_active: true,
            $or: [{ expires_at: null }, { expires_at: { $gt: now } }],
            $and: [
                {
                    $or: [
                        { shared_with_user: userId },
                        { shared_with_tenant: tenantId },
                        { shared_with_role: { $in: userRoles } },
                    ],
                },
                { [`permissions.${permission}`]: true },
            ],
        };

        const shares = await Share.find(shareQuery)
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

        const resourceIds = shares.map((s) => s.resource_id);
        let sharedQueryBuilder = Model.find({
            _id: { $in: resourceIds },
            is_deleted: false,
        }).setOptions({ strictPopulate: false });

        // Apply dynamic populate
        populateFields.forEach((field) => {
            sharedQueryBuilder = sharedQueryBuilder.populate(field);
        });

        const sharedResources = await sharedQueryBuilder.lean();

        const shareMap = new Map(shares.map((s) => [s.resource_id.toString(), s]));

        sharedResources.forEach((resource) => {
            const share = shareMap.get(resource._id.toString());
            results.push({
                ...resource,
                accessType: "shared",
                permissions: share.permissions,
                sharedBy: share.shared_by,
                shareId: share._id,
            });
        });
    }

    return results;
}

static async getResourcesSharedWithOthers(
    resourceType,
    userId,
    options = {},
    populateFields = [] // <-- added populateFields
) {
    const {
        page = 1,
        limit = 20,
        permission = ["read"],
    } = options;

    const results = [];

    const shareQuery = {
        resource_type: resourceType,
        shared_by: userId,
        is_active: true,
        $or: [{ expires_at: null }, { expires_at: { $gt: new Date() } }],
        $or: [
            { shared_with_user: { $exists: true, $ne: null } },
            { shared_with_tenant: { $exists: true, $ne: null } },
            { shared_with_role: { $exists: true, $ne: null } },
        ],
    };

    if (permission?.length) {
        shareQuery.$and = permission.map((perm) => ({ [`permissions.${perm}`]: true }));
    }

    const shares = await Share.find(shareQuery)
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

    if (!shares.length) return [];

    const Model = mongoose.model(resourceType);
    const resourceIds = shares.map((s) => s.resource_id);

    let resourcesQuery = Model.find({ _id: { $in: resourceIds }, is_deleted: false });

    // Apply dynamic populate
    populateFields.forEach((field) => {
        resourcesQuery = resourcesQuery.populate(field);
    });

    const resources = await resourcesQuery.lean();

    const shareMap = new Map(shares.map((s) => [s.resource_id.toString(), s]));

    resources.forEach((resource) => {
        const share = shareMap.get(resource._id.toString());
        results.push({
            ...resource,
            accessType: "sharedByMe",
            permissions: share.permissions,
            sharedWith: {
                user: share.shared_with_user,
                role: share.shared_with_role,
                tenant: share.shared_with_tenant,
            },
            shareId: share._id,
        });
    });

    return results;
}

    /**
     * Get one resource accessible to a user (owned + shared)
     */
    static async getAccessibleResourceById(
        resourceType,
        resourceId,
        userId,
        tenantId,
        userRoles = [],
        permission = "read",
        populateFields = [] // <-- array of fields to populate
        ) {
        const Model = mongoose.model(resourceType);

        // 1️⃣ Check if owned
        let query = Model.findOne({
            _id: resourceId,
            tenant_id: tenantId,
            is_deleted: false,
        })

        // Apply dynamic populate
        populateFields.forEach((field) => {
            query = query.populate(field);
        });

        const ownedResource = await query.lean();

        if (ownedResource) {
            return {
            ...ownedResource,
            accessType: "owner",
            permissions: {
                read: true,
                edit: true,
                share: true,
                delete: true,
            },
            id: ownedResource._id,
            _id: undefined,
            };
        }

        // 2️⃣ Check if shared
        const now = new Date();
        const share = await Share.findOne({
            resource_type: resourceType,
            resource_id: resourceId,
            is_active: true,
            $or: [{ expires_at: null }, { expires_at: { $gt: now } }],
            $and: [
            {
                $or: [
                { shared_with_user: userId },
                { shared_with_tenant: tenantId },
                { shared_with_role: { $in: userRoles } },
                ],
            },
            { [`permissions.${permission}`]: true },
            ],
        }).lean();

        if (!share) return null;

        let sharedQuery = Model.findOne({
            _id: resourceId,
            is_deleted: false,
        }).setOptions({ strictPopulate: false });

        populateFields.forEach((field) => {
            sharedQuery = sharedQuery.populate(field);
        });

        const sharedResource = await sharedQuery.lean();
        if (!sharedResource) return null;

        return {
            ...sharedResource,
            accessType: "shared",
            permissions: share.permissions,
            sharedBy: share.shared_by,
            shareId: share._id,
            id: sharedResource._id,
            _id: undefined,
        };
        }

    /**
     * Share a resource with user/role/tenant
     */
    static async shareResource(data) {
        const {
            resourceType,
            resourceId,
            sharedBy,
            sharedWithUser,
            sharedWithRole,
            sharedWithTenant,
            permissions = { read: true },
            expiresAt,
            notes,
        } = data;

        // Validate resource exists and user has share permission
        const Model = mongoose.model(resourceType);
        const resource = await Model.findById(resourceId);

        if (!resource) {
            throw new Error("Resource not found");
        }

        // Check if sharer has permission to share
        // (You'd implement this based on your permission system)

        const shareData = {
            resource_type: resourceType,
            resource_id: resourceId,
            owner_tenant_id: resource.tenant_id,
            shared_by: sharedBy,
            permissions,
            is_active: true,
            notes,
        };

        if (sharedWithUser) shareData.shared_with_user = sharedWithUser;
        if (sharedWithRole) shareData.shared_with_role = sharedWithRole;
        if (sharedWithTenant) shareData.shared_with_tenant = sharedWithTenant;
        if (expiresAt) shareData.expires_at = expiresAt;

        const share = await Share.findOneAndUpdate(
            {
                resource_type: resourceType,
                resource_id: resourceId,
                shared_with_user: sharedWithUser || undefined,
                shared_with_role: sharedWithRole || undefined,
                shared_with_tenant: sharedWithTenant || undefined,
            },
            shareData,
            { upsert: true, new: true },
        );

        return share;
    }

    /**
     * Revoke share access
     */
    static async revokeShare(shareId, userId) {
        const share = await Share.findById(shareId);

        if (!share) {
            throw new Error("Share not found");
        }

        // Check if user can revoke (owner or original sharer)
        // Implementation depends on your permission system

        share.is_active = false;
        await share.save();

        return share;
    }

    /**
     * Update share permissions
     */
    static async updateSharePermissions(shareId, permissions, userId) {
        const share = await Share.findById(shareId);

        if (!share) {
            throw new Error("Share not found");
        }

        share.permissions = { ...share.permissions, ...permissions };
        await share.save();

        return share;
    }

    /**
     * Get all users with whom a resource has been shared
     * @param {string} resourceType - Type of resource (Project, Moodboard, etc.)
     * @param {string} resourceId - ID of the resource
     * @param {Object} options - Optional filters
     * @returns {Array} Array of user objects with share details
     */
    static async getSharedUsers(resourceType, resourceId, options = {}) {
        const { includeExpired = false, includeInactive = false } = options;

        const now = new Date();

        // Build query for active shares
        const shareQuery = {
            resource_type: resourceType,
            resource_id: resourceId,
            shared_with_user: { $exists: true, $ne: null }, // Only user-level shares
        };

        // Filter by active status
        if (!includeInactive) {
            shareQuery.is_active = true;
        }

        // Filter by expiry
        if (!includeExpired) {
            shareQuery.$or = [
                { expires_at: null },
                { expires_at: { $gt: now } },
            ];
        }

        // Find all shares and populate user details
        const shares = await Share.find(shareQuery)
            .populate({
                path: "shared_with_user",
                select: "full_name nick_name email user_phone is_active role_id tenant_id department_id",
                populate: [
                    { path: "role_id", select: "name permissions" },
                    { path: "tenant_id", select: "name" },
                    { path: "department_id", select: "name" },
                ],
            })
            .populate("shared_by", "full_name email")
            .lean();

        // Transform the result to include share details with user info
        const sharedUsers = shares
            .filter((share) => share.shared_with_user) // Ensure user exists
            .map((share) => ({
                user: share.shared_with_user,
                shareDetails: {
                    shareId: share._id,
                    permissions: share.permissions,
                    sharedBy: share.shared_by,
                    sharedAt: share.created_at,
                    expiresAt: share.expires_at,
                    isActive: share.is_active,
                    notes: share.notes,
                },
            }));

        return sharedUsers;
    }

    /**
     * Get all entities (users, roles, tenants) with whom a resource has been shared
     * @param {string} resourceType - Type of resource
     * @param {string} resourceId - ID of the resource
     * @param {Object} options - Optional filters
     * @returns {Object} Object containing users, roles, and tenants arrays
     */
    static async getAllSharedEntities(resourceType, resourceId, options = {}) {
        const { includeExpired = false, includeInactive = false } = options;

        const now = new Date();

        // Build base query
        const shareQuery = {
            resource_type: resourceType,
            resource_id: resourceId,
        };

        // Filter by active status
        if (!includeInactive) {
            shareQuery.is_active = true;
        }

        // Filter by expiry
        if (!includeExpired) {
            shareQuery.$or = [
                { expires_at: null },
                { expires_at: { $gt: now } },
            ];
        }

        // Find all shares with populated references
        const shares = await Share.find(shareQuery)
            .populate(
                "shared_with_user",
                "full_name nick_name email user_phone is_active",
            )
            .populate("shared_with_role", "name description permissions")
            .populate("shared_with_tenant", "name")
            .populate("shared_by", "full_name email")
            .lean();

        // Separate shares by type
        const result = {
            users: [],
            roles: [],
            tenants: [],
        };

        shares.forEach((share) => {
            const shareInfo = {
                shareId: share._id,
                permissions: share.permissions,
                sharedBy: share.shared_by,
                sharedAt: share.created_at,
                expiresAt: share.expires_at,
                isActive: share.is_active,
                notes: share.notes,
            };

            if (share.shared_with_user) {
                result.users.push({
                    user: share.shared_with_user,
                    shareDetails: shareInfo,
                });
            }

            if (share.shared_with_role) {
                result.roles.push({
                    role: share.shared_with_role,
                    shareDetails: shareInfo,
                });
            }

            if (share.shared_with_tenant) {
                result.tenants.push({
                    tenant: share.shared_with_tenant,
                    shareDetails: shareInfo,
                });
            }
        });

        return result;
    }
}

export default ResourceAccessService;

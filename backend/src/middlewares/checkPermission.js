// checkPermission.js

import { asyncHandler } from "./asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import User from "../modules/users/model.js";
import { PERMISSIONS } from "../utils/permission.js";
import Role from "../modules/roles/model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to check if user has a specific permission
 * @param {string[]} requiredPermissions - List of permission keys required to access route
 */
export const checkPermission = (...requiredPermissions) =>
  asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: 400,
        message: "User ID not found in request",
      });
    }

    const user = await User.findById(userId).populate({
      path: "role_id",
      populate: {
        path: "permissions",
      },
    });

    if (!user) {
      return sendResponse(res, {
        statusCode: 404,
        message: "User not found",
      });
    }

    const userPermissions = user?.role_id?.permissions?.map((p) => p.key) || [];

    // Attach all user data + permissions under req.user
    req.user = {
      ...req.user, // retain existing info like id
      permissions: userPermissions,
      is_admin: userPermissions.includes(PERMISSIONS.TENANT_ADMIN_SUPER),
      is_sub_admin: userPermissions.includes(PERMISSIONS.TENANT_ADMIN_ADMIN),
    };

    const hasPermission =
      requiredPermissions.length === 0 ||
      requiredPermissions.some((key) => userPermissions.includes(key));

    if (!hasPermission) {
      return sendResponse(res, {
        statusCode: 403,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  });

export const requireTenantAdmin = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).populate('role_id');
    if (!user) {
      return sendResponse(res, {
        statusCode: 404,
        message: "User not found",
      });
    }

    // Get role with permissions
    const role = await Role.findById(user.role_id).populate('permissions');
    if (!role) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Role not found",
      });
    }

    // Check if role has tenant admin permission
    const hasAdminPermission = role.permissions.some(
      permission => permission.key === "tenant:admin:super"
    );

    if (!hasAdminPermission) {
      return sendResponse(res, {
        statusCode: 403,
        message: "Access denied. Tenant admin permission required.",
      });
    }

    // req.user.role = role; // Attach role to request for later use
    next();
  } catch (error) {
    throw new ApiError(403, "Access denied. Tenant admin permission required.");
  }
});

import * as tenantPermissionService from "./service.js"; // Adjust path as needed
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { ApiError } from "../../utils/ApiError.js";

// Get all tenant permissions
export const getAllPermissions = asyncHandler(async (req, res) => {
    const permissions = await tenantPermissionService.getAllPermissions();
    sendResponse(res, { data: permissions });
});

// Create a new tenant permission
export const createPermission = asyncHandler(async (req, res) => {
    const permission = await tenantPermissionService.createPermission(req.body);
    sendResponse(res, {
        message: "Permission created successfully",
        data: permission,
        statusCode: 201,
    });
});

// Update an existing tenant permission
export const updatePermission = asyncHandler(async (req, res) => {
    const permission = await tenantPermissionService.updatePermission(req.params.id, req.body);
    sendResponse(res, {
        message: "Permission updated successfully",
        data: permission,
    });
});

// Delete a tenant permission (soft delete)
export const deletePermission = asyncHandler(async (req, res) => {
    await tenantPermissionService.deletePermission(req.params.id);
    sendResponse(res, { message: "Permission deleted successfully" });
});

// Get a single permission by ID (optional utility route)
export const getPermissionById = asyncHandler(async (req, res) => {
    const permission = await tenantPermissionService.getPermissionById(req.params.id);
    if (!permission) throw new ApiError(404, "Permission not found");
    sendResponse(res, { data: permission });
});

import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";
import * as permissionService from "./service.js";

export const createPermission = asyncHandler(async (req, res) => {
    const permission = await permissionService.createPermission(req.body);
    sendResponse(res, {
        statusCode: 201,
        message: "Permission created successfully",
        data: permission,
    });
});

export const getAllPermissions = asyncHandler(async (_req, res) => {
    const permissions = await permissionService.getAllPermissions();
    sendResponse(res, {
        statusCode: 200,
        message: "Permissions fetched successfully",
        data: permissions,
    });
});

export const getPermissionById = asyncHandler(async (req, res) => {
    const permission = await permissionService.getPermissionById(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        message: "Permission fetched successfully",
        data: permission,
    });
});

export const updatePermission = asyncHandler(async (req, res) => {
    const permission = await permissionService.updatePermission(
        req.params.id,
        req.body,
    );
    sendResponse(res, {
        statusCode: 200,
        message: "Permission updated successfully",
        data: permission,
    });
});

export const deletePermission = asyncHandler(async (req, res) => {
    await permissionService.deletePermission(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        message: "Permission deleted successfully",
    });
});

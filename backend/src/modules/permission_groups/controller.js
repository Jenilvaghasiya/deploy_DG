import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";
import * as permissionGroupService from "./service.js";

export const createPermissionGroup = asyncHandler(async (req, res) => {
    const group = await permissionGroupService.createPermissionGroup(req.body);
    sendResponse(res, {
        statusCode: 201,
        message: "Permission group created successfully",
        data: group,
    });
});

export const getAllPermissionGroups = asyncHandler(async (_req, res) => {
    const groups = await permissionGroupService.getAllPermissionGroups();
    sendResponse(res, {
        statusCode: 200,
        message: "Permission groups fetched successfully",
        data: groups,
    });
});

export const getPermissionGroupById = asyncHandler(async (req, res) => {
    const group = await permissionGroupService.getPermissionGroupById(
        req.params.id,
    );
    sendResponse(res, {
        statusCode: 200,
        message: "Permission group fetched successfully",
        data: group,
    });
});

export const updatePermissionGroup = asyncHandler(async (req, res) => {
    const group = await permissionGroupService.updatePermissionGroup(
        req.params.id,
        req.body,
    );
    sendResponse(res, {
        statusCode: 200,
        message: "Permission group updated successfully",
        data: group,
    });
});

export const deletePermissionGroup = asyncHandler(async (req, res) => {
    await permissionGroupService.deletePermissionGroup(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        message: "Permission group deleted successfully",
    });
});

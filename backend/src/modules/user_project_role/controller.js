import * as userProjectRoleService from "./service.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const createUserProjectRole = asyncHandler(async (req, res) => {
    const userProjectRole = await userProjectRoleService.createUserProjectRole(
        req.body,
        req.user.tenant_id,
    );
    sendResponse(res, {
        message: "User assigned to project",
        data: userProjectRole,
        statusCode: 201,
    });
});

export const updateUserProjectRole = asyncHandler(async (req, res) => {
    const userProjectRole = await userProjectRoleService.updateUserProjectRole(
        req.body,
        req.user.tenant_id,
    );
    sendResponse(res, {
        message: "User project roles updated",
        data: userProjectRole,
        statusCode: 200,
    });
});

export const getUserProjectRoles = asyncHandler(async (req, res) => {
    const { userId, projectId } = req.query;
    const userProjectRoles = await userProjectRoleService.getUserProjectRoles(
        req.user.tenant_id,
        userId,
        projectId,
    );
    sendResponse(res, { data: userProjectRoles });
});

export const deleteUserProjectRole = asyncHandler(async (req, res) => {
    await userProjectRoleService.deleteUserProjectRole(req.params.id);
    sendResponse(res, { message: "User project role deleted" });
});

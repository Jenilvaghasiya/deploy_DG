import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";
import * as rbacService from "./service.js";

export const assignPermissions = asyncHandler(async (req, res) => {
    const { role_id, permission_ids } = req.body;

    const role = await rbacService.assignPermissionsToRole(
        role_id,
        permission_ids,
    );

    return sendResponse(res, {
        statusCode: 200,
        message: "Permissions assigned to role successfully",
        data: role,
    });
});

export const getPermissionsOfRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    const groupedPermissions = await rbacService.getRolePermissions(roleId);

    return sendResponse(res, {
        statusCode: 200,
        message: "Permissions fetched successfully",
        data: groupedPermissions,
    });
});

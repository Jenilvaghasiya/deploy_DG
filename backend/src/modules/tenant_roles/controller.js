import * as tenantRoleService from "./service.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const getTenantRoles = asyncHandler(async (req, res) => {
    const tenantRoles = await tenantRoleService.getRolesByTenantId(
        req.user.tenant_id,
    );
    sendResponse(res, { data: tenantRoles });
});

export const getTenantPermissions = asyncHandler(async (req, res) => {
    const permissions = await tenantRoleService.getAllTenantPermissions();
    sendResponse(res, { data: permissions });
});

export const createRole = asyncHandler(async (req, res) => {
    const role = await tenantRoleService.createTenantRole(
        req.body,
        req.user.tenant_id,
    );
    sendResponse(res, {
        message: "Tenant Role created",
        data: role,
        statusCode: 201,
    });
});

export const updateRole = asyncHandler(async (req, res) => {
    const role = await tenantRoleService.updateTenantRole(
        req.params.id,
        req.body,
        req.user.tenant_id,
    );
    sendResponse(res, { message: "Tenant Role updated", data: role });
});

export const deleteRole = asyncHandler(async (req, res) => {
    await tenantRoleService.deleteTenantRole(req.params.id, req.user.tenant_id);
    sendResponse(res, { message: "Tenant Role deleted" });
});

export const copyRole = asyncHandler(async (req, res) => {
    const role = await tenantRoleService.copyTenantRole(
        req.params.id,
        req.user.tenant_id,
    );
    sendResponse(res, {
        message: "Tenant Role copied",
        data: role,
        statusCode: 201,
    });
});

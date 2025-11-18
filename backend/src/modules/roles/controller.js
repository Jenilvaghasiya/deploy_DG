import * as roleService from "./service.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const getAllRoles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const tenantId = req.user.tenant_id;

  const roles = await roleService.getRoles(userId, tenantId);
  sendResponse(res, { data: roles });
});

export const getRoleById = asyncHandler(async (req, res) => {
    const role = await roleService.getRoleById(req.params.id);
    sendResponse(res, { data: role });
});

export const createRole = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = await roleService.createRole(req.body, userId);
    sendResponse(res, { message: "Role created", data: role, statusCode: 201 });
});

export const updateRole = asyncHandler(async (req, res) => {
    const userId = req.user.id;    
    const role = await roleService.updateRole(req.params.id, req.body,userId);
    sendResponse(res, { message: "Role updated", data: role });
});

export const deleteRole = asyncHandler(async (req, res) => {
    await roleService.deleteRole(req.params.id);
    sendResponse(res, { message: "Role deleted" });
});

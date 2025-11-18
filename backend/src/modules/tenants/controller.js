import * as tenantService from "./service.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const getAllTenants = asyncHandler(async (req, res) => {
    const { search } = req.query;
    const tenants = await tenantService.getAllTenants(search);
    sendResponse(res, { data: tenants });
});

export const getTenantById = asyncHandler(async (req, res) => {
    const tenant = await tenantService.getTenantById(req.params.id);
    sendResponse(res, { data: tenant });
});

export const createTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantService.createTenant(req.body, req.user.id);
    sendResponse(res, {
        message: "Tenant created",
        data: tenant,
        statusCode: 201,
    });
});

export const updateTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantService.updateTenant(
        req.params.id,
        req.body,
        req.user.id,
    );
    sendResponse(res, {
        message: "Tenant updated",
        data: tenant,
    });
});

export const deleteTenant = asyncHandler(async (req, res) => {
    await tenantService.deleteTenant(req.params.id);
    sendResponse(res, { message: "Tenant deleted" });
});

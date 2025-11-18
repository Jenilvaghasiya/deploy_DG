import * as departmentService from "./service.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const getAll = asyncHandler(async (req, res) => {
    const departments = await departmentService.getDepartments(
        req.user.tenant_id,
    );
    sendResponse(res, { data: departments });
});

export const create = asyncHandler(async (req, res) => {
    const department = await departmentService.createDepartment({
        name: req.body.name,
        tenant_id: req.user.tenant_id,
    });
    sendResponse(res, { data: department, message: "Department created" });
});

export const remove = asyncHandler(async (req, res) => {
    await departmentService.deleteDepartment(req.params.id, req.user.tenant_id);
    sendResponse(res, { message: "Department deleted" });
});

import Department from "./model.js";
import { ApiError } from "../../utils/ApiError.js";

export const getDepartments = async (tenant_id) => {
    return await Department.find({ tenant_id, is_deleted: false });
};

export const createDepartment = async ({ name, tenant_id }) => {
    if (!name) throw new ApiError(400, "Department name is required");

    const existing = await Department.findOne({
        name,
        tenant_id,
        is_deleted: false,
    });
    if (existing) return existing;

    return await Department.create({ name, tenant_id });
};

export const deleteDepartment = async (id, tenant_id) => {
    const department = await Department.findOne({ _id: id, tenant_id });
    if (!department) throw new ApiError(404, "Department not found");

    department.is_deleted = true;
    await department.save();
    return department;
};

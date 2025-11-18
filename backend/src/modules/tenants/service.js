import Tenant from "./model.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAllTenants = (search) => {
    const query = {
        is_deleted: false,
        is_active: true,
    };
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }
    return Tenant.find(query);
};

export const getTenantById = async (id) => {
    const tenant = await Tenant.findOne({
        _id: id,
        is_deleted: false,
        is_active: true,
    });
    if (!tenant) throw new ApiError(404, "Tenant not found");
    return tenant;
};

export const createTenant = async (data, createdById) => {
    return Tenant.create({
        ...data,
        created_by: createdById,
    });
};

export const updateTenant = async (id, updates, updatedById) => {
    const tenant = await Tenant.findOneAndUpdate(
        {
            _id: id,
            is_deleted: false,
            is_active: true,
        },
        {
            ...updates,
            updated_by: updatedById,
        },
        {
            new: true,
            runValidators: true,
        },
    );
    if (!tenant) throw new ApiError(404, "Tenant not found");
    return tenant;
};

export const deleteTenant = async (id) => {
    const tenant = await Tenant.findOneAndUpdate(
        {
            _id: id,
            is_deleted: false,
        },
        { is_deleted: true },
        { new: true },
    );
    if (!tenant) throw new ApiError(404, "Tenant not found or already deleted");
    return tenant;
};

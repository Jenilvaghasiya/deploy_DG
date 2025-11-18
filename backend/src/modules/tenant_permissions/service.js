import TenantPermission from "./model.js"; // Adjust path as needed
import { ApiError } from "../../utils/ApiError.js";

// Get all permissions (excluding soft-deleted ones)
export const getAllPermissions = async () => {
    return await TenantPermission.find({ is_deleted: false }).sort({ created_at: -1 });
};

// Get a single permission by ID
export const getPermissionById = async (id) => {
    return await TenantPermission.findOne({ _id: id, is_deleted: false });
};

// Create a new permission
export const createPermission = async (data) => {
    const { key } = data;

    const exists = await TenantPermission.findOne({ key, is_deleted: false });
    if (exists) {
        throw new ApiError(400, "Permission with this key already exists");
    }

    const permission = new TenantPermission(data);
    return await permission.save();
};

// Update an existing permission
export const updatePermission = async (id, data) => {
    const permission = await TenantPermission.findOneAndUpdate(
        { _id: id, is_deleted: false },
        { $set: data },
        { new: true }
    );

    if (!permission) {
        throw new ApiError(404, "Permission not found");
    }

    return permission;
};

// Soft delete a permission
export const deletePermission = async (id) => {
    const permission = await TenantPermission.findOneAndUpdate(
        { _id: id, is_deleted: false },
        { is_deleted: true },
        { new: true }
    );

    if (!permission) {
        throw new ApiError(404, "Permission not found");
    }
};

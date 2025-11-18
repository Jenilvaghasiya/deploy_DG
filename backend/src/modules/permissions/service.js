import Permission from "./model.js";
import { ApiError } from "../../utils/ApiError.js";

export const createPermission = async (data) => {
    const exists = await Permission.findOne({ key: data.key });
    if (exists) throw new ApiError(409, "Permission key already exists");
    return await Permission.create(data);
};

export const getAllPermissions = async () => {
    return await Permission.find({
        is_deleted: false,
        is_active: true,
    }).populate("permission_group_id");
};

export const getPermissionById = async (id) => {
    const permission = await Permission.findOne({
        _id: id,
        is_deleted: false,
        is_active: true,
    }).populate("permission_group_id");

    if (!permission) throw new ApiError(404, "Permission not found");
    return permission;
};

export const updatePermission = async (id, updates) => {
    if (updates.key) {
        const exists = await Permission.findOne({
            key: updates.key,
            _id: { $ne: id },
        });
        if (exists) throw new ApiError(409, "Permission key already exists");
    }

    const permission = await Permission.findOneAndUpdate(
        { _id: id, is_deleted: false, is_active: true },
        updates,
        { new: true },
    );
    if (!permission) throw new ApiError(404, "Permission not found");
    return permission;
};

export const deletePermission = async (id) => {
    const permission = await Permission.findOneAndUpdate(
        { _id: id, is_deleted: false },
        { is_deleted: true },
        { new: true },
    );
    if (!permission)
        throw new ApiError(404, "Permission not found or already deleted");
    return permission;
};

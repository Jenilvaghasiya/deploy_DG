import PermissionGroup from "./model.js";
import Permission from "../permissions/model.js";
import { ApiError } from "../../utils/ApiError.js";

export const createPermissionGroup = async (data) => {
    const exists = await PermissionGroup.findOne({ name: data.name });
    if (exists) throw new ApiError(409, "Permission group name already exists");
    return await PermissionGroup.create(data);
};

export const getAllPermissionGroups = async () => {
    const groups = await PermissionGroup.aggregate([
        { $match: { is_deleted: false, is_active: true } },
        {
            $lookup: {
                from: "permissions",
                localField: "_id",
                foreignField: "permission_group_id",
                as: "permissions",
            },
        },
    ]);

    if (!groups.length) throw new ApiError(404, "No permission groups found");
    return groups;
};

export const getPermissionGroupById = async (id) => {
    const group = await PermissionGroup.findOne({
        _id: id,
        is_deleted: false,
        is_active: true,
    });

    if (!group) throw new ApiError(404, "Permission group not found");

    const permissions = await Permission.find({
        permission_group_id: id,
        is_deleted: false,
        is_active: true,
    });

    return { ...group.toJSON(), permissions };
};

export const updatePermissionGroup = async (id, updates) => {
    if (updates.name) {
        const exists = await PermissionGroup.findOne({
            name: updates.name,
            _id: { $ne: id },
        });
        if (exists)
            throw new ApiError(409, "Permission group name already exists");
    }

    const permissionGroup = await PermissionGroup.findOneAndUpdate(
        { _id: id, is_deleted: false },
        updates,
        { new: true },
    );

    if (!permissionGroup) throw new ApiError(404, "Permission group not found");
    return permissionGroup;
};

export const deletePermissionGroup = async (id) => {
    const permissionGroup = await PermissionGroup.findOneAndUpdate(
        { _id: id, is_deleted: false },
        { is_deleted: true },
        { new: true },
    );
    if (!permissionGroup) throw new ApiError(404, "Permission group not found");
    return permissionGroup;
};

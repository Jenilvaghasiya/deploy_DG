import Role from "../roles/model.js";
import Permission from "../permissions/model.js";
import PermissionGroup from "../permission_groups/model.js";
import { ApiError } from "../../utils/ApiError.js";

export const assignPermissionsToRole = async (roleId, permissionIds) => {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        throw new ApiError(400, "Permission list is empty or invalid");
    }

    const role = await Role.findById(roleId);
    if (!role) throw new ApiError(404, "Role not found");

    role.permissions = permissionIds;
    await role.save();

    return role;
};

export const getRolePermissions = async (roleId) => {
    const role = await Role.findById(roleId).lean();
    if (!role) throw new ApiError(404, "Role not found");

    const allPermissions = await Permission.find({
        is_active: true,
        is_deleted: false,
    }).lean();

    const assignedIds = new Set(role.permissions.map((id) => id.toString()));

    const grouped = {};

    for (const perm of allPermissions) {
        const groupId = perm.permission_group_id?.toString() || "ungrouped";

        if (!grouped[groupId]) {
            grouped[groupId] = {
                group_id: groupId,
                group_name: null,
                permissions: [],
            };
        }

        grouped[groupId].permissions.push({
            id: perm._id,
            key: perm.key,
            description: perm.description,
            assigned: assignedIds.has(perm._id.toString()), // ✅ flag
        });
    }

    const groupIds = Object.keys(grouped).filter((id) => id !== "ungrouped");
    const groups = await PermissionGroup.find({ _id: { $in: groupIds } });

    groups.forEach((group) => {
        if (grouped[group.id]) {
            grouped[group.id].group_name = group.name;
        }
    });

    return Object.values(grouped);
};

import TenantRole from "./model.js";
import TenantPermission from "../tenant_permissions/model.js";
import { ApiError } from "../../utils/ApiError.js";

export const createTenantRole = async (data, tenant_id) => {
    const { name, permissions, description } = data;

    if (!name || !tenant_id || !permissions || permissions.length === 0) {
        throw new ApiError(
            400,
            "Name, tenant_id, and at least one permission are required",
        );
    }

    const exists = await TenantRole.findOne({
        name,
        tenant_id,
        is_deleted: false,
    });
    if (exists) throw new ApiError(409, "Role name already exists");

    const validPermissions = await TenantPermission.find({
        _id: { $in: permissions },
        is_active: true,
        is_deleted: false,
    });
    if (validPermissions.length !== permissions.length) {
        throw new ApiError(400, "Invalid or inactive permission IDs");
    }

    const role = await TenantRole.create({
        name,
        description,
        tenant_id,
        permissions,
    });

    return role.populate("permissions");
};

export const getRolesByTenantId = async (tenantId) => {
    return await TenantRole.find({
        tenant_id: tenantId,
        is_deleted: false,
    }).populate("permissions");
};

export const updateTenantRole = async (id, updates, tenant_id) => {
    const { name, permissions, description } = updates;

    const role = await TenantRole.findOne({
        _id: id,
        tenant_id,
        is_deleted: false,
    });
    if (!role) throw new ApiError(404, "Role not found");

    if (name && name !== role.name) {
        const exists = await TenantRole.findOne({
            name,
            tenant_id,
            _id: { $ne: id },
            is_deleted: false,
        });
        if (exists) throw new ApiError(409, "Role name already exists");
    }

    if (permissions) {
        const validPermissions = await TenantPermission.find({
            _id: { $in: permissions },
            is_active: true,
            is_deleted: false,
        });
        if (validPermissions.length !== permissions.length) {
            throw new ApiError(400, "Invalid or inactive permission IDs");
        }
    }

    const updatedRole = await TenantRole.findOneAndUpdate(
        { _id: id, tenant_id, is_deleted: false },
        {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(permissions && { permissions }),
        },
        { new: true, runValidators: true },
    ).populate("permissions");

    if (!updatedRole) throw new ApiError(404, "Role not found");
    return updatedRole;
};

export const deleteTenantRole = async (id, tenant_id) => {
    const role = await TenantRole.findOneAndUpdate(
        { _id: id, tenant_id, is_deleted: false },
        { is_deleted: true },
        { new: true },
    );
    if (!role) throw new ApiError(404, "Role not found");
    return role;
};

export const copyTenantRole = async (id, tenant_id) => {
    const originalRole = await TenantRole.findOne({
        _id: id,
        tenant_id,
        is_deleted: false,
    }).populate("permissions");

    if (!originalRole) throw new ApiError(404, "Role not found");

    // Generate unique name for copy
    let copyName = `${originalRole.name} (Copy)`;
    let counter = 1;

    while (
        await TenantRole.findOne({
            name: copyName,
            tenant_id,
            is_deleted: false,
        })
    ) {
        copyName = `${originalRole.name} (Copy ${counter})`;
        counter++;
    }

    const copiedRole = await TenantRole.create({
        name: copyName,
        description: originalRole.description,
        tenant_id,
        permissions: originalRole.permissions.map((p) => p._id),
    });

    return copiedRole.populate("permissions");
};

export const getAllTenantPermissions = async () => {
    return await TenantPermission.find({ is_active: true, is_deleted: false });
};

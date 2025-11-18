import Role from "./model.js";
import User from "../users/model.js";
import Permission from "../permissions/model.js";
import { ApiError } from "../../utils/ApiError.js";

export const getRoles = async (currentUserId, tenantId) => {
  // fetch all roles
  const roles = await Role.find({
    $or: [
      { is_predefined: true },
      { tenant_id: tenantId, is_predefined: false },
    ],
    is_deleted: false,
    is_active: true,
  })
    .populate("permissions")
    .lean();

  // get current user
  const currentUser = await User.findById(currentUserId)
    .populate({
      path: "role_id",
      populate: { path: "permissions" },
    });

  const currentUserPermissions = currentUser?.role_id?.permissions?.map(p => p.key) || [];
  const isSuperAdmin = currentUserPermissions.includes("tenant:admin:super");
console.log(isSuperAdmin);

  return roles
    .filter(role => {
      const permissionKeys = role.permissions?.map(p => p.key) || [];

      // always hide super admin role
      if (permissionKeys.includes("tenant:admin:super")) return false;

      // hide Admin role if current user is NOT super admin
      if (permissionKeys.includes("tenant:admin:admin") && !isSuperAdmin) return false;

      return true; // other roles are visible
    })
    .map(role => {
      const isOwner = role.created_by?.toString() === currentUserId.toString();
      return {
        ...role,
        id: role._id.toString(),
        _id: undefined,
        __v: undefined,
        can_edit: role.is_predefined ? false : isOwner,
        can_delete: role.is_predefined ? false : isOwner,
      };
    });
};


export const getRoleById = async (id) => {
    const role = await Role.findOne({
        _id: id,
        is_deleted: false,
        is_active: true,
    }).populate("permissions");
    if (!role) throw new ApiError(404, "Role not found");
    return role;
};

export const createRole = async (data, userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // Remove unsafe fields
    if ("is_predefined" in data) delete data.is_predefined;
    if ("tenant_id" in data) delete data.tenant_id;
    if ("created_by" in data) delete data.created_by;

    // Check for duplicate role name
    const exists = await Role.findOne({
      name: data.name.trim(),
      tenant_id: user.tenant_id,
      is_deleted: false,
    }).populate("permissions");

    if (exists) {
      throw new ApiError(
        409,
        `Role name "${data.name}" already exists in your tenant.`
      );
    }

    // Filter out forbidden permissions
    if (data.permissions?.length) {
        const forbidden = await Permission.find({
            _id: { $in: data.permissions },
            key: "tenant:admin:super",
        });

      if (forbidden.length > 0) {
        throw new ApiError(
          403,
          "You are not allowed to assign 'tenant:admin:super' permission"
        );
      }
    }

    // Create role
    const role = await Role.create({
      ...data,
      tenant_id: user.tenant_id,
      created_by: user._id, // use _id, not id
    });

    return role;
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      throw new ApiError(409, `Role with ${field} "${value}" already exists`);
    }

    // If the error is a Mongoose validation error, throw friendly ApiError
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message).join(", ");
      throw new ApiError(400, `Role validation failed: ${messages}`);
    }

    // Otherwise rethrow existing ApiError or unknown error
    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(500, err.message || "Internal Server Error");
  }
};


export const updateRole = async (id, updates, userId) => {    
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    const role = await Role.findById(id);
    if (!role || role.is_deleted || !role.is_active) throw new ApiError(404, "Role not found");

    if (role.is_predefined) throw new ApiError(403, "Predefined roles cannot be updated");

    const creator = await User.findById(role.created_by);
    if (!creator) throw new ApiError(404, "Role creator not found");

    if (creator.tenant_id.toString() !== user.tenant_id.toString()) {
        throw new ApiError(403, "You can only update roles created by your tenant members");
    }

    if (updates.name) {
        const exists = await Role.findOne({
            name: updates.name,
            tenant_id: user.tenant_id,
            _id: { $ne: id },
        }).populate("permissions");
        if (exists) throw new ApiError(409, "Role name already exists");
    }

    if (updates.permissions?.length) {
        const forbidden = await Permission.find({
            _id: { $in: updates.permissions },
            key: "tenant:admin:super",
        });

        if (forbidden.length > 0) {
            throw new ApiError(403, "You are not allowed to assign 'tenant:admin:super' permission");
        }
    }

    delete updates.is_predefined;
    delete updates.tenant_id;
    delete updates.created_by;

    const updatedRole = await Role.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    }).populate("permissions");

    return updatedRole;
};


export const deleteRole = async (id) => {
    const role = await Role.findById(id);
    if (!role) throw new ApiError(404, "Role not found");

    if (role.is_predefined) throw new ApiError(403, "Predefined roles cannot be deleted");

    const roleInUse = await User.findOne({ role_id: id });
    if (roleInUse) throw new ApiError(409, "Role is in use");

    await Role.findByIdAndDelete(id);

    return { message: "Role permanently deleted" };
};



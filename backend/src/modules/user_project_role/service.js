import UserProjectRole from "./model.js";
import User from "../users/model.js";
import Project from "../projects/model.js";
import TenantRole from "../tenant_roles/model.js";
import { ApiError } from "../../utils/ApiError.js";

export const updateUserProjectRole = async (data, tenant_id) => {
    const { user_id, projects } = data;

    if (!tenant_id || !user_id) {
        throw new ApiError(400, "Tenant ID and user ID are required");
    }

    const user = await User.findOne({
        _id: user_id,
        tenant_id,
        is_deleted: false,
    });
    if (!user) throw new ApiError(404, "User not found");

    // If no projects, delete all UserProjectRole entries for the user in this tenant
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
        await UserProjectRole.deleteMany({
            tenant_id,
            user_id,
            is_deleted: false,
        });
        return [];
    }

    const projectIds = projects.map((p) => p.project_id);
    const roleIds = projects.flatMap((p) => p.role_ids);

    const [validProjects, validRoles] = await Promise.all([
        Project.find({
            _id: { $in: projectIds },
            tenant_id,
            is_deleted: false,
        }),
        TenantRole.find({
            _id: { $in: roleIds },
            tenant_id,
            is_deleted: false,
        }),
    ]);

    if (validProjects.length !== projectIds.length) {
        throw new ApiError(404, "One or more projects not found");
    }
    if (validRoles.length !== new Set(roleIds).size) {
        throw new ApiError(404, "One or more roles not found");
    }

    const userProjectRoles = [];
    const processedProjectIds = new Set();

    for (const proj of projects) {
        const { project_id, role_ids, disabled, is_default, lock_roles } = proj;
        if (role_ids.length === 0) continue;

        const userProjectRole = await UserProjectRole.findOneAndUpdate(
            {
                tenant_id,
                user_id,
                project_id,
                is_deleted: false,
            },
            {
                role_ids,
                disabled: typeof disabled === "boolean" ? disabled : false,
                is_default:
                    typeof is_default === "boolean" ? is_default : false,
                lock_roles:
                    typeof lock_roles === "boolean" ? lock_roles : false,
                updated_at: new Date(),
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            },
        );

        userProjectRoles.push(userProjectRole);
        processedProjectIds.add(project_id);

        if (lock_roles) {
            const otherProjects = await Project.find({
                tenant_id,
                _id: { $ne: project_id },
                is_deleted: false,
            });
            for (const otherProj of otherProjects) {
                if (processedProjectIds.has(otherProj._id.toString())) continue;

                const otherUserProjectRole =
                    await UserProjectRole.findOneAndUpdate(
                        {
                            tenant_id,
                            user_id,
                            project_id: otherProj._id,
                            is_deleted: false,
                        },
                        {
                            role_ids,
                            disabled:
                                typeof disabled === "boolean"
                                    ? disabled
                                    : false,
                            is_default:
                                typeof is_default === "boolean"
                                    ? is_default
                                    : false,
                            lock_roles:
                                typeof lock_roles === "boolean"
                                    ? lock_roles
                                    : false,
                            updated_at: new Date(),
                        },
                        {
                            upsert: true,
                            new: true,
                            setDefaultsOnInsert: true,
                        },
                    );

                userProjectRoles.push(otherUserProjectRole);
                processedProjectIds.add(otherProj._id.toString());
            }
        }
    }

    // Delete UserProjectRole entries for projects not included
    await UserProjectRole.deleteMany({
        tenant_id,
        user_id,
        project_id: { $nin: projectIds },
        is_deleted: false,
    });

    return Promise.all(
        userProjectRoles.map((upr) =>
            upr.populate({
                path: "role_ids",
                populate: { path: "permissions" },
            }),
        ),
    );
};

export const createUserProjectRole = async (data, tenant_id) => {
    const { user_id, projects } = data;

    if (
        !tenant_id ||
        !user_id ||
        !projects ||
        !Array.isArray(projects) ||
        projects.length === 0
    ) {
        throw new ApiError(
            400,
            "Tenant ID, user ID, and at least one project assignment are required",
        );
    }

    const user = await User.findOne({
        _id: user_id,
        tenant_id,
        is_deleted: false,
    });
    if (!user) throw new ApiError(404, "User not found");

    const projectIds = projects.map((p) => p.project_id);
    const roleIds = projects.flatMap((p) => p.role_ids);

    const [validProjects, validRoles] = await Promise.all([
        Project.find({
            _id: { $in: projectIds },
            tenant_id,
            is_deleted: false,
        }),
        TenantRole.find({
            _id: { $in: roleIds },
            tenant_id,
            is_deleted: false,
        }),
    ]);

    if (validProjects.length !== projectIds.length) {
        throw new ApiError(404, "One or more projects not found");
    }
    if (validRoles.length !== new Set(roleIds).size) {
        throw new ApiError(404, "One or more roles not found");
    }

    const userProjectRoles = [];
    for (const proj of projects) {
        const { project_id, role_ids, disabled, is_default, lock_roles } = proj;
        if (role_ids.length === 0) continue;

        // Check for existing record
        const existingRecord = await UserProjectRole.findOne({
            tenant_id,
            user_id,
            project_id,
            is_deleted: false,
        });

        if (existingRecord) {
            throw new ApiError(
                409,
                `User already assigned to project ${project_id} in tenant ${tenant_id}`,
            );
        }

        const userProjectRole = new UserProjectRole({
            tenant_id,
            user_id,
            project_id,
            role_ids,
            disabled: typeof disabled === "boolean" ? disabled : false,
            is_default: typeof is_default === "boolean" ? is_default : false,
            lock_roles: typeof lock_roles === "boolean" ? lock_roles : false,
        });

        userProjectRoles.push(await userProjectRole.save());

        if (lock_roles) {
            const otherProjects = await Project.find({
                tenant_id,
                _id: { $ne: project_id },
                is_deleted: false,
            });
            for (const otherProj of otherProjects) {
                const existingOtherRecord = await UserProjectRole.findOne({
                    tenant_id,
                    user_id,
                    project_id: otherProj._id,
                    is_deleted: false,
                });

                if (existingOtherRecord) continue;

                const otherUserProjectRole = new UserProjectRole({
                    tenant_id,
                    user_id,
                    project_id: otherProj._id,
                    role_ids,
                    disabled: typeof disabled === "boolean" ? disabled : false,
                    is_default:
                        typeof is_default === "boolean" ? is_default : false,
                    lock_roles:
                        typeof lock_roles === "boolean" ? lock_roles : false,
                });

                userProjectRoles.push(await otherUserProjectRole.save());
            }
        }
    }

    return Promise.all(
        userProjectRoles.map((upr) =>
            upr.populate({
                path: "role_ids",
                populate: { path: "permissions" },
            }),
        ),
    );
};

export const getUserProjectRoles = async (tenatnId, userId, projectId) => {
    const query = { is_deleted: false };
    if (userId) query.user_id = userId;
    if (projectId) query.project_id = projectId;
    if (tenatnId) query.tenant_id = tenatnId;

    return await UserProjectRole.find(query).populate({
        path: "role_ids",
        populate: { path: "permissions" },
    });
};

export const deleteUserProjectRole = async (id) => {
    const userProjectRole = await UserProjectRole.findOneAndUpdate(
        { _id: id, is_deleted: false },
        { is_deleted: true, updated_at: new Date() },
        { new: true },
    );
    if (!userProjectRole)
        throw new ApiError(404, "User project role not found");
    return userProjectRole;
};

import bcrypt from "bcrypt";
import Tenant from "../src/modules/tenants/model.js";
import Role from "../src/modules/roles/model.js";
import User from "../src/modules/users/model.js";
import Project from "../src/modules/projects/model.js";
import PermissionGroup from "../src/modules/permission_groups/model.js";
import Permission from "../src/modules/permissions/model.js";

export const seedDatabase = async () => {
    const tenant = await Tenant.create({ name: "Test Tenant" });

    const role = await Role.create({
        name: "admin",
        description: "Administrator",
    });

    const user = await User.create({
        full_name: "tester",
        email: "tester@example.com",
        password_hash: await bcrypt.hash("password123", 10),
        role_id: role._id,
        tenant_id: tenant._id,
        is_verified: true,
    });

    const project = await Project.create({
        name: "Seeded Project",
        description: "Test project for seed",
        tenant_id: tenant._id,
        user_ids: [user._id],
        created_by: user._id,
    });

    const permissionGroup = await PermissionGroup.create({
        name: "Project Management",
        description: "All project related permissions",
    });

    const permissions = await Permission.insertMany([
        {
            key: "project:view",
            description: "View existing projects",
            permission_group_id: permissionGroup._id,
        },
        {
            key: "project:create",
            description: "Create new project",
            permission_group_id: permissionGroup._id,
        },
        {
            key: "project:update",
            description: "Update existing project",
            permission_group_id: permissionGroup._id,
        },
        {
            key: "project:delete",
            description: "Delete project",
            permission_group_id: permissionGroup._id,
        },
    ]);

    return {
        testTenant: tenant,
        testRole: role,
        testUser: user,
        testProject: project,
        testPermissionGroup: permissionGroup,
        testPermissions: permissions,
    };
};

export const clearDatabase = async () => {
    await Promise.all([
        Permission.deleteMany({}),
        PermissionGroup.deleteMany({}),
        Project.deleteMany({}),
        User.deleteMany({}),
        Role.deleteMany({}),
        Tenant.deleteMany({}),
    ]);
};

import Permission from "../modules/permissions/model.js";
import PermissionGroup from "../modules/permission_groups/model.js";

export const seedPermissions = async () => {
    const permissionGroups = await PermissionGroup.find({});

    if (permissionGroups.length === 0) {
        console.warn("⚠️ No permission groups found. Please seed permission groups first.");
        return;
    }

    const getGroupId = (groupName) => {
        const group = permissionGroups.find(g => g.name === groupName);
        return group ? group._id : null;
    };

    const permissionsToSeed = [
        // General Permissions
        {
            key: "dashboard:view",
            description: "View dashboard analytics",
            groupName: "General",
        },
        {
            key: "settings:manage",
            description: "Manage application settings",
            groupName: "General",
        },
        {
            key: "profile:edit",
            description: "Edit own user profile",
            groupName: "General",
        },

        // User Management Permissions
        {
            key: "user:create",
            description: "Create new users",
            groupName: "User Management",
        },
        {
            key: "user:view",
            description: "View user details",
            groupName: "User Management",
        },
        {
            key: "user:update",
            description: "Update user details",
            groupName: "User Management",
        },
        {
            key: "user:delete",
            description: "Delete users",
            groupName: "User Management",
        },
        {
            key: "role:assign",
            description: "Assign roles to users",
            groupName: "User Management",
        },

        // Project Management Permissions
        {
            key: "project:create",
            description: "Create new projects",
            groupName: "Project Management",
        },
        {
            key: "project:view",
            description: "View project details",
            groupName: "Project Management",
        },
        {
            key: "project:update",
            description: "Update project details",
            groupName: "Project Management",
        },
        {
            key: "project:delete",
            description: "Delete projects",
            groupName: "Project Management",
        },
        {
            key: "project:collaborator:add",
            description: "Add collaborators to projects",
            groupName: "Project Management",
        },

        // Content Creation Permissions
        {
            key: "content:create",
            description: "Create new content (e.g., images, moodboards)",
            groupName: "Content Creation",
        },
        {
            key: "content:edit",
            description: "Edit existing content",
            groupName: "Content Creation",
        },
        {
            key: "content:delete",
            description: "Delete content",
            groupName: "Content Creation",
        },
        {
            key: "gallery:upload",
            description: "Upload images to gallery",
            groupName: "Content Creation",
        },
        {
            key: "ai:generate",
            description: "Generate content using AI tools",
            groupName: "Content Creation",
        },

        // Reporting Permissions
        {
            key: "report:view:users",
            description: "View user activity reports",
            groupName: "Reporting",
        },
        {
            key: "report:view:projects",
            description: "View project performance reports",
            groupName: "Reporting",
        },
        {
            key: "report:view:credits",
            description: "View credit consumption reports",
            groupName: "Reporting",
        },
    ];

    for (const permData of permissionsToSeed) {
        const existingPermission = await Permission.findOne({ key: permData.key });
        if (!existingPermission) {
            const permission_group_id = getGroupId(permData.groupName);
            if (permission_group_id) {
                await Permission.create({
                    key: permData.key,
                    description: permData.description,
                    permission_group_id: permission_group_id,
                });
                console.log(`✅ Permission seeded: ${permData.key}`);
            } else {
                console.warn(`⚠️ Skipping permission '${permData.key}': Permission Group '${permData.groupName}' not found.`);
            }
        } else {
            console.log(`⏭️ Permission '${permData.key}' already exists, skipping`);
        }
    }
};
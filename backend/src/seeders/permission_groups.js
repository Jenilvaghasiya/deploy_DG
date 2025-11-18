import PermissionGroup from "../modules/permission_groups/model.js";

export const seedPermissionGroups = async () => {
    const permissionGroupsToSeed = [
        {
            name: "General",
            description: "General application permissions",
        },
        {
            name: "User Management",
            description: "Permissions related to managing users",
        },
        {
            name: "Project Management",
            description: "Permissions related to managing projects",
        },
        {
            name: "Content Creation",
            description: "Permissions for creating and managing content",
        },
        {
            name: "Reporting",
            description: "Permissions for viewing reports and analytics",
        },
    ];

    for (const groupData of permissionGroupsToSeed) {
        const existingGroup = await PermissionGroup.findOne({ name: groupData.name });
        if (!existingGroup) {
            await PermissionGroup.create(groupData);
            console.log(`✅ Permission group seeded: ${groupData.name}`);
        } else {
            console.log(`⏭️ Permission group '${groupData.name}' already exists, skipping`);
        }
    }

    return await PermissionGroup.find({});
};
import Role from "../modules/roles/model.js";
import Permission from "../modules/permissions/model.js";

export const seedRoles = async () => {
    const permissions = await Permission.find({}); // Fetch all permissions

    const rolesToSeed = [
        {
            name: "Super Admin",
            description: "Has full control over the system.",
            permissions: permissions.map(p => p._id), // Assign all permissions
        },
        {
            name: "Admin",
            description: "Manages users, projects, and settings within a tenant.",
            permissions: permissions.filter(p => p.key.includes('manage')).map(p => p._id), // Example: assign 'manage' permissions
        },
        {
            name: "Editor",
            description: "Can create and edit content.",
            permissions: permissions.filter(p => p.key.includes('edit') || p.key.includes('create')).map(p => p._id),
        },
        {
            name: "Viewer",
            description: "Can view content and reports.",
            permissions: permissions.filter(p => p.key.includes('view') || p.key.includes('read')).map(p => p._id),
        },
        {
            name: "Guest",
            description: "Limited access for external collaborators.",
            permissions: [],
        },
    ];

    for (const roleData of rolesToSeed) {
        const existingRole = await Role.findOne({ name: roleData.name });
        if (!existingRole) {
            await Role.create(roleData);
            console.log(`✅ Role '${roleData.name}' seeded`);
        } else {
            console.log(`⏭️ Role '${roleData.name}' already exists, skipping`);
        }
    }
};
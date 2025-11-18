import Project from "../modules/projects/model.js";
import User from "../modules/users/model.js";
import Tenant from "../modules/tenants/model.js";

export const seedProjects = async () => {
    const users = await User.find({});
    const tenants = await Tenant.find({});

    if (users.length === 0) {
        console.warn("⚠️ No users found. Please seed users first.");
        return;
    }
    if (tenants.length === 0) {
        console.warn("⚠️ No tenants found. Please seed tenants first.");
        return;
    }

    const projectsToSeed = [
        {
            name: "Website Redesign",
            description: "Complete overhaul of the company website.",
            tenantName: "DesignGenie Inc.",
            creatorEmail: "alice.smith@example.com",
            users: ["alice.smith@example.com", "diana.prince@example.com"],
            is_active: true,
        },
        {
            name: "Mobile App Development",
            description: "Developing a new mobile application for iOS and Android.",
            tenantName: "CreativeHub LLC",
            creatorEmail: "bob.johnson@example.com",
            users: ["bob.johnson@example.com"],
            is_active: true,
        },
        {
            name: "Marketing Campaign Q3",
            description: "Planning and executing the Q3 marketing initiatives.",
            tenantName: "CreativeHub LLC",
            creatorEmail: "bob.johnson@example.com",
            users: ["bob.johnson@example.com", "eve.adams@example.com"],
            is_active: true,
        },
        {
            name: "Internal Tool Automation",
            description: "Automating internal processes to improve efficiency.",
            tenantName: "Innovate Solutions",
            creatorEmail: "charlie.brown@example.com",
            users: ["charlie.brown@example.com"],
            is_active: false,
        },
        {
            name: "Brand Identity Refresh",
            description: "Updating brand guidelines and visual assets.",
            tenantName: "Artisan Studios",
            creatorEmail: "eve.adams@example.com",
            users: ["eve.adams@example.com"],
            is_active: true,
        },
    ];

    for (const projectData of projectsToSeed) {
        const tenant = tenants.find(t => t.name === projectData.tenantName);
        const createdBy = users.find(u => u.email === projectData.creatorEmail);
        const userIds = projectData.users.map(email => {
            const user = users.find(u => u.email === email);
            return user ? user._id : null;
        }).filter(id => id !== null);

        if (!tenant) {
            console.warn(`⚠️ Skipping project '${projectData.name}': Tenant '${projectData.tenantName}' not found.`);
            continue;
        }
        if (!createdBy) {
            console.warn(`⚠️ Skipping project '${projectData.name}': Creator user '${projectData.creatorEmail}' not found.`);
            continue;
        }
        if (userIds.length === 0 && projectData.users.length > 0) {
            console.warn(`⚠️ Skipping project '${projectData.name}': Some assigned users not found.`);
            continue;
        }

        const existingProject = await Project.findOne({ name: projectData.name, tenant_id: tenant._id });
        if (!existingProject) {
            await Project.create({
                name: projectData.name,
                description: projectData.description,
                tenant_id: tenant._id,
                user_ids: userIds,
                is_active: projectData.is_active,
                created_by: createdBy._id,
            });
            console.log(`✅ Project '${projectData.name}' seeded`);
        } else {
            console.log(`⏭️ Project '${projectData.name}' already exists, skipping`);
        }
    }
};
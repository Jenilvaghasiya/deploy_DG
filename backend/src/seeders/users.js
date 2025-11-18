import User from "../modules/users/model.js";
import bcrypt from "bcrypt";
import Role from "../modules/roles/model.js";
import Tenant from "../modules/tenants/model.js";

export const seedUsers = async () => {
    const roles = await Role.find({});
    const tenants = await Tenant.find({});

    if (roles.length === 0) {
        console.warn("⚠️ No roles found. Please seed roles first.");
        return;
    }
    if (tenants.length === 0) {
        console.warn("⚠️ No tenants found. Please seed tenants first.");
        return;
    }

    const usersToSeed = [
        {
            full_name: "Alice Smith",
            email: "alice.smith@example.com",
            password: "password123",
            roleName: "Admin", // Assign by name for flexibility
            tenantName: "DesignGenie Inc.",
            is_verified: true,
        },
        {
            full_name: "Bob Johnson",
            email: "bob.johnson@example.com",
            password: "password123",
            roleName: "Editor",
            tenantName: "CreativeHub LLC",
            is_verified: true,
        },
        {
            full_name: "Charlie Brown",
            email: "charlie.brown@example.com",
            password: "password123",
            roleName: "Viewer",
            tenantName: "Innovate Solutions",
            is_verified: true,
        },
        {
            full_name: "Diana Prince",
            email: "diana.prince@example.com",
            password: "password123",
            roleName: "Super Admin",
            tenantName: "DesignGenie Inc.",
            is_verified: true,
        },
        {
            full_name: "Eve Adams",
            email: "eve.adams@example.com",
            password: "password123",
            roleName: "Guest",
            tenantName: "Artisan Studios",
            is_verified: false,
        },
    ];

    for (const userData of usersToSeed) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
            const password_hash = await bcrypt.hash(userData.password, 10);
            const role = roles.find(r => r.name === userData.roleName);
            const tenant = tenants.find(t => t.name === userData.tenantName);

            if (role && tenant) {
                await User.create({
                    full_name: userData.full_name,
                    email: userData.email,
                    password_hash,
                    role_id: role._id,
                    tenant_id: tenant._id,
                    is_verified: userData.is_verified,
                });
                console.log(`✅ User '${userData.full_name}' seeded`);
            } else {
                console.warn(`⚠️ Skipping user '${userData.full_name}': Role or Tenant not found.`);
            }
        } else {
            console.log(`⏭️ User '${userData.full_name}' already exists, skipping`);
        }
    }
};
import Tenant from "../modules/tenants/model.js";

export const seedTenants = async () => {
    const tenantsToSeed = [
        {
            name: "DesignGenie Inc.",
            industry_type: "Software",
            subscription_frequency: "yearly",
        },
        {
            name: "CreativeHub LLC",
            industry_type: "Marketing",
            subscription_frequency: "monthly",
        },
        {
            name: "Innovate Solutions",
            industry_type: "Consulting",
            subscription_frequency: "yearly",
        },
        {
            name: "Artisan Studios",
            industry_type: "Design",
            subscription_frequency: "monthly",
        },
        {
            name: "Global Corp",
            industry_type: "Finance",
            subscription_frequency: "yearly",
        },
    ];

    for (const tenantData of tenantsToSeed) {
        const existingTenant = await Tenant.findOne({ name: tenantData.name });
        if (!existingTenant) {
            await Tenant.create(tenantData);
            console.log(`✅ Tenant '${tenantData.name}' seeded`);
        } else {
            console.log(`⏭️ Tenant '${tenantData.name}' already exists, skipping`);
        }
    }
};
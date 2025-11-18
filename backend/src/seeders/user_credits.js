import UserCredits from "../modules/credits/model.js";
import User from "../modules/users/model.js";
import Tenant from "../modules/tenants/model.js";

export const seedUserCredits = async () => {
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

    const userCreditsToSeed = [
        {
            userEmail: "alice.smith@example.com",
            tenantName: "DesignGenie Inc.",
            credits: 500,
        },
        {
            userEmail: "bob.johnson@example.com",
            tenantName: "CreativeHub LLC",
            credits: 250,
        },
        {
            userEmail: "charlie.brown@example.com",
            tenantName: "Innovate Solutions",
            credits: 100,
        },
        {
            userEmail: "diana.prince@example.com",
            tenantName: "DesignGenie Inc.",
            credits: 750,
        },
        {
            userEmail: "eve.adams@example.com",
            tenantName: "Artisan Studios",
            credits: 300,
        },
    ];

    for (const creditData of userCreditsToSeed) {
        const user = users.find((u) => u.email === creditData.userEmail);
        const tenant = tenants.find((t) => t.name === creditData.tenantName);

        if (!user) {
            console.warn(
                `⚠️ Skipping user credits for user '${creditData.userEmail}': User not found.`,
            );
            continue;
        }
        if (!tenant) {
            console.warn(
                `⚠️ Skipping user credits for tenant '${creditData.tenantName}': Tenant not found.`,
            );
            continue;
        }

        try {
            // Add a unique name for each user-tenant combination
            const creditName = `${user.email}_credits`;

            // First check for existing record with null name
            const existingNullNameRecord = await UserCredits.findOne({
                user_id: user._id,
                tenant_id: tenant._id,
                name: null,
            });

            if (existingNullNameRecord) {
                // Update the existing record with null name
                existingNullNameRecord.name = creditName;
                existingNullNameRecord.credits = creditData.credits;
                await existingNullNameRecord.save();
                console.log(
                    `✅ Updated existing null-name user credits for user: ${creditData.userEmail} in tenant: ${creditData.tenantName}`,
                );
            } else {
                // Regular upsert operation for records with proper names
                await UserCredits.findOneAndUpdate(
                    { user_id: user._id, tenant_id: tenant._id },
                    {
                        credits: creditData.credits,
                        name: creditName,
                    },
                    { upsert: true, new: true },
                );
                console.log(
                    `✅ User credits upserted for user: ${creditData.userEmail} in tenant: ${creditData.tenantName}`,
                );
            }
        } catch (error) {
            // Log error but continue with other records
            console.warn(
                `⚠️ Error upserting credits for ${creditData.userEmail} in ${creditData.tenantName}: ${error.message}`,
            );
        }
    }
};

import UserAction from '../modules/user_actions/model.js';
import User from '../modules/users/model.js';

export const seedUserActions = async () => {
    const users = await User.find({});

    if (users.length === 0) {
        console.warn("⚠️ No users found. Please seed users first.");
        return;
    }

    const userActionsToSeed = [
        {
            userEmail: "alice.smith@example.com",
            action: "Generated image for project Website Redesign",
            type: "ai",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
            userEmail: "bob.johnson@example.com",
            action: "Updated project Mobile App Development",
            type: "non-ai",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
            userEmail: "alice.smith@example.com",
            action: "Viewed dashboard analytics",
            type: "non-ai",
            timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000), // 12 hours ago
        },
        {
            userEmail: "charlie.brown@example.com",
            action: "Created new moodboard",
            type: "other",
            timestamp: new Date(Date.now() - 0.1 * 24 * 60 * 60 * 1000), // ~2 hours ago
        },
        {
            userEmail: "diana.prince@example.com",
            action: "Invited new user to tenant",
            type: "non-ai",
            timestamp: new Date(), // now
        },
    ];

    for (const actionData of userActionsToSeed) {
        const user = users.find(u => u.email === actionData.userEmail);

        if (user) {
            // Simple deduplication: check if an action with the same user, action, and type exists within a small time frame
            const existingAction = await UserAction.findOne({
                userId: user._id,
                action: actionData.action,
                type: actionData.type,
                timestamp: { $gte: new Date(actionData.timestamp.getTime() - 1000), $lte: new Date(actionData.timestamp.getTime() + 1000) }
            });

            if (!existingAction) {
                await UserAction.create({
                    userId: user._id,
                    action: actionData.action,
                    type: actionData.type,
                    timestamp: actionData.timestamp,
                });
                console.log(`✅ User action '${actionData.action}' seeded for user: ${actionData.userEmail}`);
            } else {
                console.log(`⏭️ User action '${actionData.action}' for user '${actionData.userEmail}' already exists, skipping`);
            }
        } else {
            console.warn(`⚠️ Skipping user action for user '${actionData.userEmail}': User not found.`);
        }
    }
};
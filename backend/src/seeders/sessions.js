import Session from '../modules/sessions/model.js';
import User from '../modules/users/model.js';

export const seedSessions = async () => {
    const users = await User.find({});

    if (users.length === 0) {
        console.warn("⚠️ No users found. Please seed users first.");
        return;
    }

    const sessionsToSeed = [
        {
            userEmail: "alice.smith@example.com",
            loginTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            logoutTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        },
        {
            userEmail: "bob.johnson@example.com",
            loginTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            logoutTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 1 hour later
        },
        {
            userEmail: "alice.smith@example.com",
            loginTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            logoutTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
        },
        {
            userEmail: "charlie.brown@example.com",
            loginTime: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000), // 12 hours ago
            logoutTime: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000 + 0.5 * 60 * 60 * 1000), // 30 mins later
        },
        {
            userEmail: "diana.prince@example.com",
            loginTime: new Date(), // now
            logoutTime: null, // still logged in
        },
    ];

    for (const sessionData of sessionsToSeed) {
        const user = users.find(u => u.email === sessionData.userEmail);

        if (user) {
            // Check for existing session to avoid duplicates (simple check, can be improved)
            const existingSession = await Session.findOne({
                userId: user._id,
                loginTime: sessionData.loginTime,
            });

            if (!existingSession) {
                await Session.create({
                    userId: user._id,
                    loginTime: sessionData.loginTime,
                    logoutTime: sessionData.logoutTime,
                });
                console.log(`✅ Session seeded for user: ${sessionData.userEmail}`);
            } else {
                console.log(`⏭️ Session for user '${sessionData.userEmail}' at ${sessionData.loginTime} already exists, skipping`);
            }
        } else {
            console.warn(`⚠️ Skipping session for user '${sessionData.userEmail}': User not found.`);
        }
    }
};
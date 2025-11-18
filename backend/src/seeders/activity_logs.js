import ActivityLog from '../modules/activity_logs/model.js';
import User from '../modules/users/model.js';
import Tenant from '../modules/tenants/model.js';

export const seedActivityLogs = async () => {
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

    const activityLogsToSeed = [
        {
            tenantName: "DesignGenie Inc.",
            userEmail: "alice.smith@example.com",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            loginTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9 AM
            logoutTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // 5 PM
            request: "GET /dashboard",
            requestEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 1000), // 1 sec later
            executionTime: "100ms",
            service: "DashboardService",
            contentGenerate: 0,
            contentUsed: 0,
            discarded: 0,
            creditConsumed: 0,
        },
        {
            tenantName: "CreativeHub LLC",
            userEmail: "bob.johnson@example.com",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            loginTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10 AM
            logoutTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // 6 PM
            request: "POST /image_variation",
            requestEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000 + 5000), // 5 sec later
            executionTime: "5000ms",
            service: "ImageGenerationService",
            contentGenerate: 5,
            contentUsed: 5,
            discarded: 0,
            creditConsumed: 10,
        },
        {
            tenantName: "DesignGenie Inc.",
            userEmail: "alice.smith@example.com",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            loginTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 AM
            logoutTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // 4 PM
            request: "GET /projects",
            requestEnd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 200), // 0.2 sec later
            executionTime: "200ms",
            service: "ProjectService",
            contentGenerate: 0,
            contentUsed: 0,
            discarded: 0,
            creditConsumed: 0,
        },
        {
            tenantName: "Innovate Solutions",
            userEmail: "charlie.brown@example.com",
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            loginTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 11 AM
            logoutTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), // 7 PM
            request: "POST /moodboards",
            requestEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 1500), // 1.5 sec later
            executionTime: "1500ms",
            service: "MoodboardService",
            contentGenerate: 0,
            contentUsed: 0,
            discarded: 0,
            creditConsumed: 2,
        },
        {
            tenantName: "Artisan Studios",
            userEmail: "eve.adams@example.com",
            date: new Date(), // Today
            loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            logoutTime: null, // Still logged in
            request: "GET /gallery",
            requestEnd: new Date(Date.now() - 2 * 60 * 60 * 1000 + 500), // 0.5 sec later
            executionTime: "500ms",
            service: "GalleryService",
            contentGenerate: 0,
            contentUsed: 0,
            discarded: 0,
            creditConsumed: 0,
        },
    ];

    for (const logData of activityLogsToSeed) {
        const user = users.find(u => u.email === logData.userEmail);
        const tenant = tenants.find(t => t.name === logData.tenantName);

        if (!user) {
            console.warn(`⚠️ Skipping activity log for user '${logData.userEmail}': User not found.`);
            continue;
        }
        if (!tenant) {
            console.warn(`⚠️ Skipping activity log for tenant '${logData.tenantName}': Tenant not found.`);
            continue;
        }

        // Simple deduplication: check for existing log with same user, tenant, date (day), and request
        const existingLog = await ActivityLog.findOne({
            tenantId: tenant._id,
            userId: user._id,
            date: { $gte: new Date(logData.date.getFullYear(), logData.date.getMonth(), logData.date.getDate()), $lt: new Date(logData.date.getFullYear(), logData.date.getMonth(), logData.date.getDate() + 1) },
            request: logData.request,
        });

        if (!existingLog) {
            await ActivityLog.create({
                tenantId: tenant._id,
                userId: user._id,
                date: logData.date,
                loginTime: logData.loginTime,
                logoutTime: logData.logoutTime,
                request: logData.request,
                requestEnd: logData.requestEnd,
                executionTime: logData.executionTime,
                service: logData.service,
                contentGenerate: logData.contentGenerate,
                contentUsed: logData.contentUsed,
                discarded: logData.discarded,
                creditConsumed: logData.creditConsumed,
            });
            console.log(`✅ Activity log seeded for user: ${logData.userEmail}, request: ${logData.request}`);
        } else {
            console.log(`⏭️ Activity log for user '${logData.userEmail}', request '${logData.request}' on ${logData.date.toDateString()} already exists, skipping`);
        }
    }
};
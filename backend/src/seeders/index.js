import { seedTenants } from "./tenants.js";
import { seedUsers } from "./users.js";
import { seedRoles } from "./roles.js";
import { seedPermissions } from "./permissions.js";
import { seedPermissionGroups } from "./permission_groups.js";
import { seedProjects } from "./projects.js";
import { seedSessions } from "./sessions.js";
import { seedUserActions } from "./user_actions.js";
import { seedActivityLogs } from "./activity_logs.js";
import { seedAiTasks } from "./ai_tasks.js";
import { seedUserCredits } from "./user_credits.js";

export const seedAll = async () => {
    await seedTenants();
    await seedRoles();
    await seedUsers();
    await seedPermissionGroups();
    await seedPermissions();
    await seedProjects();
    await seedSessions();
    await seedUserActions();
    await seedActivityLogs();
    await seedAiTasks();
    await seedUserCredits();
};

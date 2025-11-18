import { Router } from "express";
import userRoutes from "../../modules/users/routes.js";
import roleRoutes from "../../modules/roles/routes.js";
import tenantRoutes from "../../modules/tenants/routes.js";
import projectRoutes from "../../modules/projects/routes.js";
import permissionGroupRoutes from "../../modules/permission_groups/routes.js";
import permissionRoutes from "../../modules/permissions/routes.js";
import rbacRoutes from "../../modules/rbac/routes.js";
import messageRoutes from "../../modules/messages/routes.js";
import notificationRoutes from "../../modules/notifications/routes.js";
import departmentRoutes from "../../modules/departments/routes.js";
import tenantPermissionRoutes from "../../modules/tenant_permissions/routes.js";
import tenantRoleRoutes from "../../modules/tenant_roles/routes.js";
import userProjectRoleRoutes from "../../modules/user_project_role/routes.js";
import moodboardRoutes from "../../modules/moodboards/routes.js";
import galleryRoutes from "../../modules/gallery/routes.js";
import imageVariationRoutes from "../../modules/image_variation/routes.js";
import dashboardRoutes from "../../modules/dashboard/route.js";
import socialPostRoutes from "../../modules/dg_social/routes.js";
import userPreferenceRouter from "../../modules/user_preference/routes.js";
import tourRouter from "../../modules/app_tour/routes.js"
import shareRoutes from "../../modules/share/route.js"
import NSFWRoutes from "../../modules/nsfw_setting/routes.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = Router();

router.use(verifyToken);

router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/tenants", tenantRoutes);
router.use("/projects", projectRoutes);
router.use("/permission-groups", permissionGroupRoutes);
router.use("/permissions", permissionRoutes);
router.use("/rbac", rbacRoutes);
router.use("/messages", messageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/departments", departmentRoutes);
router.use("/tenant-roles", tenantRoleRoutes);
router.use("/tenant-permission", tenantPermissionRoutes);
router.use("/user-project-roles", userProjectRoleRoutes);
router.use("/moodboards", moodboardRoutes);
router.use("/gallery", galleryRoutes);
router.use("/image-variation", imageVariationRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/social", socialPostRoutes);
router.use("/user-preference", userPreferenceRouter);
router.use("/tour", tourRouter)
router.use("/shares",shareRoutes)
router.use("/nsfw-settings", NSFWRoutes);
export default router;

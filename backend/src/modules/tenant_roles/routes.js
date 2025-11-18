import { Router } from "express";
import * as tenantRoleController from "./controller.js";

const router = Router();

router.get("/", tenantRoleController.getTenantRoles);
router.get("/permissions", tenantRoleController.getTenantPermissions);
router.post("/", tenantRoleController.createRole);
router.post("/:id/copy", tenantRoleController.copyRole);
router.put("/:id", tenantRoleController.updateRole);
router.delete("/:id", tenantRoleController.deleteRole);

export default router;

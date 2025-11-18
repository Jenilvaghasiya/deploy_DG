import { Router } from "express";
import * as tenantPermissionController from "./controller.js"; 

const router = Router();

router.get("/", tenantPermissionController.getAllPermissions);
router.get("/:id", tenantPermissionController.getPermissionById);
router.post("/", tenantPermissionController.createPermission);
router.put("/:id", tenantPermissionController.updatePermission);
router.delete("/:id", tenantPermissionController.deletePermission);

export default router;

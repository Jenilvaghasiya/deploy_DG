import { Router } from "express";
import * as roleController from "./controller.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = Router();

router.get("/", checkPermission(PERMISSIONS.ADMINISTRATION_ROLE_READ),roleController.getAllRoles);
router.get("/:id", checkPermission(PERMISSIONS.ADMINISTRATION_ROLE_READ),roleController.getRoleById);
router.post("/", verifyToken, checkPermission(PERMISSIONS.ADMINISTRATION_ROLE_CREATE),roleController.createRole);
router.put("/:id", verifyToken, checkPermission(PERMISSIONS.ADMINISTRATION_ROLE_UPDATE),roleController.updateRole);
router.delete("/:id", checkPermission(PERMISSIONS.ADMINISTRATION_ROLE_DELETE),roleController.deleteRole);

export default router;

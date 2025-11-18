import { Router } from "express";
import * as invitationController from "./controller.js";
import { resolveDepartment } from "../../middlewares/resolveDepartment.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = Router();

router.get("/:token", invitationController.getInviteDetails);
// TODO:check what is this related to
router.get("/tenants/:tenantId", invitationController.getTenantInvitations);
router.get(
    "/tenants/:tenantId/pending",
    verifyToken,
    checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_READ),
    invitationController.getPendingTenantInvitations,
);
router.post("/", resolveDepartment,verifyToken ,checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_CREATE), invitationController.sendInvite);
router.post("/:token/accept", invitationController.acceptInvite);
router.post("/:token/decline", invitationController.declineInvite);
router.post("/:id/resend", verifyToken,checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_CREATE), invitationController.resendInvite);
router.delete("/:id/delete", verifyToken, invitationController.deleteInvitation);
export default router;

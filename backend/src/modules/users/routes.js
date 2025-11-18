import { Router } from "express";
import * as userController from "./controller.js";
import { resolveDepartment } from "../../middlewares/resolveDepartment.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";

const router = Router();

router.get("/",checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_READ), userController.getAllUsers);
router.get("/revoked-users",checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_READ), userController.getAllRevokedUsers);
router.post("/revoked-users/transfer-data",checkPermission(PERMISSIONS.ADMINISTRATION_ROLE_UPDATE),userController.moveRevokedUserData)
router.get("/search-user",userController.searchUser)
router.get("/tenant", checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_READ,PERMISSIONS.WORKSPACE_DIRECT_MESSAGES_VIEW), userController.getTenantUsers);
router.get("/me", userController.getProfile);
router.get("/:id", checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_READ), userController.getUserById);
router.put("/:id", resolveDepartment, checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_UPDATE), userController.updateUser);
router.delete("/:id", checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_DELETE), userController.deleteUser);
router.put("/profile/update", checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_UPDATE), userController.updateProfile);
router.put("/profile/update/password", resolveDepartment, checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_UPDATE), userController.updatePassword);
router.put("/profile/update/email", resolveDepartment, checkPermission(PERMISSIONS.ADMINISTRATION_USER_MANAGEMENT_CREATE), userController.updateEmail);
router.post('/twoFactor/send-otp', userController.sendTwoFactorOTP);
router.post('/update/phone-number', userController.updateUserPhone);
export default router;

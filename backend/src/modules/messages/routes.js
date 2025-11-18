import express from "express";
import * as messageController from "./controller.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/broadcast", messageController.getBroadcastMessages);
router.post("/broadcast",checkPermission(PERMISSIONS.WORKSPACE_BROADCAST_MESSAGES_CREATE), messageController.sendBroadcastMessage);
router.get("/dm/:user_id",checkPermission(PERMISSIONS.WORKSPACE_DIRECT_MESSAGES_VIEW), messageController.getDmMessages);
router.post("/dm",checkPermission(PERMISSIONS.WORKSPACE_DIRECT_MESSAGES_CREATE), messageController.createDmMessage);
router.get("/get/recipient/:id", verifyToken, messageController.getRecipientById);
router.post("/bulk", messageController.sendBulkDirectMessages);
router.get('/unread-counts', messageController.getUnreadCounts);
router.get('/total-unread', messageController.totalUnreadMessages);
router.post('/mark-read/:senderId', messageController.markAsRead);


export default router;

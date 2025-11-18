// src/modules/notifications/routes.js
import express from "express";
import * as notificationController from "./controller.js";

const router = express.Router();

router.get("/get/:user_id", notificationController.getNotifications);
router.put("/mark-as-read/:notificationID", notificationController.markAsRead);
router.patch("/:notificationId/unread", notificationController.markAsUnreadNotification);
router.post("/create-announcement", notificationController.createAnnouncementNotification);
router.get("/get-announcement", notificationController.getAnnouncementNotificationsForAdmin);
router.delete("/delete-announcement/:id", notificationController.deleteAnnouncementNotification);

export default router;

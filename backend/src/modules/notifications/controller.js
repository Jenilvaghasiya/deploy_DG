import * as notificationService from "./service.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { isAdmin } from "../../utils/otherUtils.js";
import { sendAnnouncementNotification } from "../../utils/notificationUtils.js";
import { ApiError } from "../../utils/ApiError.js";
import Notification from "./model.js";
import User from "../users/model.js";
import { announcementEmail } from "../../services/mailTemplates.js";
import { sendMail, sendUserMail } from "../../services/mailServices.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { skip = 0, limit = 10 } = req.query;

  const notifications = await notificationService.getNotifications(
    user_id,
    parseInt(skip),
    parseInt(limit)
  );

  sendResponse(res, { data: notifications });
});


export const markAsRead = asyncHandler(async (req, res) => {
    const notificationID = req.params.notificationID;
    await notificationService.markAsRead(
        req.user.id,
        notificationID
    );
    sendResponse(res, { message: "Notifications marked as read" });
});


export const createAnnouncementNotification = asyncHandler(async (req, res) => {
    const user_id = req.user.id;

    // Check if user is admin
    const isUserAdmin = await isAdmin(user_id);
    if (!isUserAdmin) {
        throw new ApiError(403, "Only admin users can create announcement notifications");
    }

    const { message } = req.body;

    const notification = await sendAnnouncementNotification(req.io || global.io, {
        // user_id,
        message,
    });

    sendResponse(res, { data: notification });

    //  Send emails in background
    setImmediate(async () => {
        try {
            const users = await User.find({
                _id: { $ne: user_id },
                email: { $exists: true, $ne: "" },
            });

            const { subject, html } = announcementEmail(message);

            const results = await Promise.allSettled(
                users.map((user) =>
                    sendUserMail({
                        userId: user._id,
                        to: user.email,
                        subject,
                        html,
                    })
                )
            );

            results.forEach((result, index) => {
                if (result.status === "rejected") {
                    console.error(`❌ Email failed to ${users[index].email}:`, result.reason);
                }
            });
        } catch (err) {
            console.error("❌ Error during background email sending:", err);
        }
    });
});


export const getAnnouncementNotificationsForAdmin = asyncHandler(async (req, res) => {
    const user_id = req.user.id;

    // Check if user is admin
    const isUserAdmin = await isAdmin(user_id);
    if (!isUserAdmin) {
        throw new ApiError(403, "Only admin users can access announcement notifications");
    }

    const announcementNotifications = await notificationService.getAnnoncementNotifications();
    sendResponse(res, { data: announcementNotifications });
});


export const deleteAnnouncementNotification = asyncHandler(async (req, res) => {
    const user_id = req.user.id;

    // Check if user is admin
    const isUserAdmin = await isAdmin(user_id);
    if (!isUserAdmin) {
        throw new ApiError(403, "Only admin users can access announcement notifications");
    }

    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);
    sendResponse(res, { data: notification });
});


export const markAsUnreadNotification = asyncHandler(async (req, res) => {
      try {
    const { notificationId } = req.params;
    
    // Update the notification in the database
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: false },
      { new: true } // Return the updated document
    );

    if (!updatedNotification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    sendResponse(res, {
        statusCode: 200,
        status : "success",
        data : updatedNotification,
        message: "Permission deleted successfully",
        });
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    sendResponse(res, {
        statusCode: 500,
        status : "failed",
        message: "Failed to mark notification as unread",
    });
  }
});
import * as messageService from "./service.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import Notification from "../notifications/model.js"
import Message from "./model.js";
import User from "../users/model.js"

import { sendBroadcastNotification, sendNotification } from "../../utils/notificationUtils.js";
import mongoose from "mongoose";
export const getBroadcastMessages = asyncHandler(async (req, res) => {
    const messages = await messageService.getBroadcastMessages(
        req.user.tenant_id,
    );
    sendResponse(res, { data: messages });
});

export const sendBroadcastMessage = asyncHandler(async (req, res) => {
    const message = await messageService.sendBroadcastMessage(
        req.user,
        req.body.content,
    );

    req.io.to(req.user.tenant_id.toString()).emit("receive-broadcast", message);

    await sendBroadcastNotification(req.io || global.io, {
        user_id: new mongoose.Types.ObjectId(req.user.id),
        tenant_id: new mongoose.Types.ObjectId(req.user.tenant_id),
        message: `${req.body.content}`,
        type: "broadcast",
    });

    sendResponse(res, { data: message, message: "Broadcast sent" });
});

export const getDmMessages = asyncHandler(async (req, res) => {
    const targetUserId = req.params.user_id;
    const messages = await messageService.getDirectMessages(
        req.user.id,
        targetUserId,
    );
    sendResponse(res, { data: messages });
});

export const createDmMessage = asyncHandler(async (req, res) => {
    const { recipient_id, content } = req.body;
    const message = await messageService.sendDirectMessage(
        req.user,
        recipient_id,
        content,
    );

    req.io.to(message.recipient_id.toString()).emit("receive-dm", message);
    req.io.to(req.user.id.toString()).emit("receive-dm", message);
     await sendNotification(req.io || global.io, {
          user_id: new mongoose.Types.ObjectId(recipient_id),
          type: "direct_message",
          message: `${content}`,
          meta: { senderId: req.user.id }
        });

    sendResponse(res, { data: message, message: "Message sent" });
});
 
export const sendBulkDirectMessages = async (req, res) => {
  try {
    const { recipient_ids, content } = req.body;
    const io = req.app.get("io") || req.io || global.io;

    const result = await messageService.sendBulkDirectMessages(io, req.user, recipient_ids, content);

    return sendResponse(res, {
      statusCode: 201,
      message: "Bulk messages sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in sendBulkDirectMessages:", error);
    return sendResponse(res, {
      statusCode: 400,
      status: "error",
      message: error.message || "Failed to send bulk messages",
    });
  }
};


export const getRecipientById = asyncHandler(async (req, res) => {
    console.log(req.params.id);
    
    const user = await messageService.getUserById(req.params.id);
    sendResponse(res, { data: user });
});

export const getUnreadCounts = async (req, res) => {
try {
        const userId = req.user.id;
        const tenantId = req.user.tenant_id;

        const unreadCounts = await messageService.getUnreadCounts(userId, tenantId);

        res.json({
            success: true,
            data: unreadCounts,
        });
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch unread counts",
        });
    }
};


export const totalUnreadMessages = async (req, res) => {
   try {
        const userId = req.user.id;
        const tenantId = req.user.tenant_id;

        const totalUnread = await messageService.getTotalUnreadCount(userId, tenantId);

        res.json({
            success: true,
            data: { total: totalUnread },
        });
    } catch (error) {
        console.error("Error fetching total unread count:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch total unread count",
        });
    }
}

export const markAsRead = async (req, res) => {
  try {
        const userId = req.user.id;
        const tenantId = req.user.tenant_id;
        const { senderId } = req.params;

        const result = await messageService.markMessagesAsRead(userId, senderId, tenantId);

        res.json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
            },
        });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark messages as read",
        });
    }
}
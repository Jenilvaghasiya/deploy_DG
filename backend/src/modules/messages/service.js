import Message from "./model.js";
import User from "../users/model.js";
import { ApiError } from "../../utils/ApiError.js";
import UsageLog from '../dashboard/model.js'
import mongoose from "mongoose";
import { sendNotification } from "../../utils/notificationUtils.js";

export const getBroadcastMessages = async (tenant_id) => {
    return await Message.find({
        type: "broadcast",
        tenant_id,
        is_deleted: false,
    })
        .sort({ created_at: 1 })
        .populate("sender_id", "full_name email");
};

export const sendBroadcastMessage = async (user, content) => {
    if (!content?.trim()) {
        throw new ApiError(400, "Message content is required");
    }

    const message = await Message.create({
        sender_id: user.id,
        tenant_id: user.tenant_id,
        content,
        type: "broadcast",
    });

    await UsageLog.create({
        module: "general",
        type: "message_broadcast",
        user_id: user.id,
        tenant_id:user.tenant_id,
        metadata: {
                message: content,
        },
    });

    return await message.populate("sender_id", "full_name email");
};

export const getDirectMessages = async (userId, targetUserId) => {
    return await Message.find({
        type: "dm",
        $or: [
            { sender_id: userId, recipient_id: targetUserId },
            { sender_id: targetUserId, recipient_id: userId },
        ],
        is_deleted: false,
    })
        .sort({ created_at: 1 })
        .populate("sender_id", "full_name email");
};

export const sendDirectMessage = async (sender, recipient_id, content) => {
    if (!recipient_id || !content?.trim()) {
        throw new ApiError(400, "Recipient and content are required");
    }

    const message = await Message.create({
        sender_id: sender.id,
        recipient_id,
        tenant_id: sender.tenant_id,
        content,
        type: "dm",
    });

    return await message.populate("sender_id", "full_name email");
};

export const getUserById = async (id) => {    
    const user = await User.findOne({ _id: id, is_deleted: false }).populate(
        "role_id",
    );
    console.log(user);
    
    if (!user) throw new ApiError(404, "User not found");
    return user;
};

export const sendBulkDirectMessages = async (io, sender, recipient_ids, content) => {
  const sender_id = sender.id;
  const tenant_id = sender.tenant_id;

  // ✅ Validate input
  if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
    throw new Error("recipient_ids must be a non-empty array");
  }

  if (!content || content.trim() === "") {
    throw new Error("Message content is required");
  }

  // ✅ Filter valid unique recipient IDs (exclude self)
  const uniqueRecipientIds = [...new Set(recipient_ids)]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .filter((id) => id !== sender_id);

  if (uniqueRecipientIds.length === 0) {
    throw new Error("No valid recipients provided");
  }

  // ✅ Prepare message documents
  const messageDocuments = uniqueRecipientIds.map((recipient_id) => ({
    sender_id,
    recipient_id,
    tenant_id,
    content: content.trim(),
    type: "dm",
    is_deleted: false,
    is_edited: false,
  }));

  // ✅ Bulk insert messages
  const messages = await Message.insertMany(messageDocuments);

  // ✅ Populate sender & recipient info
  const populatedMessages = await Message.find({
    _id: { $in: messages.map((m) => m._id) },
  })
    .populate("sender_id", "full_name email avatar")
    .populate("recipient_id", "full_name email avatar")
    .lean();

  // ✅ Emit & notify
  if (io) {
    await Promise.all(
      populatedMessages.map(async (message) => {
        io.to(`user-${message.recipient_id._id}`).emit("receive-dm", {
          ...message,
          id: message._id.toString(),
          sender_id: message.sender_id,
          recipient_id: message.recipient_id._id.toString(),
        });

        // 🔔 Send notification
        await sendNotification(io, {
          user_id: new mongoose.Types.ObjectId(message.recipient_id._id),
          type: "direct_message",
          message: `${content}`,
          meta: { senderId: sender_id },
        });
      })
    );

    // ✅ Notify sender about completion
    io.to(`user-${sender_id}`).emit("bulk-messages-sent", {
      recipient_ids: uniqueRecipientIds,
      message_count: populatedMessages.length,
    });
  }

  return {
    messages_sent: populatedMessages.length,
    recipients: uniqueRecipientIds,
    messages: populatedMessages.map((msg) => ({
      id: msg._id.toString(),
      content: msg.content,
      recipient: {
        id: msg.recipient_id._id.toString(),
        full_name: msg.recipient_id.full_name,
        email: msg.recipient_id.email,
      },
      created_at: msg.created_at,
    })),
  };
};

export const getUnreadCounts = async (userId, tenantId) => {
    try {
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    recipient_id: new mongoose.Types.ObjectId(userId),
                    tenant_id: new mongoose.Types.ObjectId(tenantId),
                    type: "dm",
                    is_read: false,
                    is_deleted: false,
                },
            },
            {
                $group: {
                    _id: "$sender_id",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Convert to object with sender_id as key
        const countsMap = {};
        unreadCounts.forEach((item) => {
            countsMap[item._id.toString()] = item.count;
        });

        return countsMap;
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        throw error;
    }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (userId, senderId, tenantId) => {
    try {
        const result = await Message.updateMany(
            {
                recipient_id: new mongoose.Types.ObjectId(userId),
                sender_id: new mongoose.Types.ObjectId(senderId),
                tenant_id: new mongoose.Types.ObjectId(tenantId),
                type: "dm",
                is_read: false,
                is_deleted: false,
            },
            {
                $set: {
                    is_read: true,
                    read_at: new Date(),
                },
            }
        );

        return result;
    } catch (error) {
        console.error("Error marking messages as read:", error);
        throw error;
    }
};

/**
 * Get total unread count for a user
 */
export const getTotalUnreadCount = async (userId, tenantId) => {
    try {
        const count = await Message.countDocuments({
            recipient_id: new mongoose.Types.ObjectId(userId),
            tenant_id: new mongoose.Types.ObjectId(tenantId),
            type: "dm",
            is_read: false,
            is_deleted: false,
        });

        return count;
    } catch (error) {
        console.error("Error fetching total unread count:", error);
        throw error;
    }
};
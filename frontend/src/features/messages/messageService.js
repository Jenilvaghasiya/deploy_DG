import api from "../../api/axios";

export const fetchBroadcastMessages = async () => {
	const res = await api.get("/messages/broadcast");
	return res.data.data;
};

export const sendBroadcastMessage = async (content) => {
	const res = await api.post("/messages/broadcast", { content });
	return res.data;
};

export const fetchDirectMessages = async (userId) => {
	const res = await api.get(`/messages/dm/${userId}`);
	return res.data.data;
};

export const sendDirectMessage = async ({ recipient_id, content }) => {
	const res = await api.post("/messages/dm", { recipient_id, content });
	return res.data;
};

export const sendBulkDirectMessages = async (recipientIds, content) => {
    try {
        const response = await api.post("/messages/bulk", {
            recipient_ids: recipientIds,
            content
        });
        return response.data;
    } catch (error) {
        console.error("Error sending bulk messages:", error);
        throw error;
    }
};

// Optional: Get bulk message status
export const getBulkMessageStatus = async (messageIds) => {
    try {
        const response = await api.post("/messages/bulk/status", {
            message_ids: messageIds
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching bulk message status:", error);
        throw error;
    }
};

export const getUnreadCounts = async () => {
    try {
        const response = await api.get("/messages/unread-counts");
        return response.data.data;
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        throw error;
    }
};

/**
 * Get total unread message count
 */
export const getTotalUnreadCount = async () => {
    try {
        const response = await api.get("/messages/total-unread");
        return response.data.data.total;
    } catch (error) {
        console.error("Error fetching total unread count:", error);
        throw error;
    }
};

/**
 * Mark messages from a specific sender as read
 */
export const markMessagesAsRead = async (senderId) => {
    try {
        const response = await api.post(`/messages/mark-read/${senderId}`);
        return response.data.data;
    } catch (error) {
        console.error("Error marking messages as read:", error);
        throw error;
    }
};
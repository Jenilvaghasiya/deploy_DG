import api from "../../api/axios";

export const getAllNotifications = async (userId, skip = 0, limit = 10) => {
  const res = await api.get(`/notifications/get/${userId}`, {
    params: { skip, limit },
  });
  return res.data;
};


export const markAsReadNotification = async (notificationID) => {
	let res;
	if (notificationID) {
		res = await api.put(`/notifications/mark-as-read/${notificationID}`);
	} else {
		res = await api.put(`/notifications/mark-as-read/all`);
	}
	return res.data;
};

export const createAnnouncementNotification = async (announcement) => {
	const res = await api.post(`/notifications/create-announcement`, announcement);
	return res.data;
};

export const getAnnouncementNotifications = async () => {
	const res = await api.get(`/notifications/get-announcement`);
	return res.data;
};

export const deleteAnnouncementNotification = async (id) => {
	const res = await api.delete(`/notifications/delete-announcement/${id}`);
	return res.data;
};

export const markAsUnreadNotification = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/unread`,
      { isRead: false }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking notification as unread:", error);
    throw error;
  }
};
import Notification from "./model.js"
import { ApiError } from "../../utils/ApiError.js";
import User from "../users/model.js"

export const getNotifications = async (user_id, skip = 0, limit = 10) => {
  const now = new Date();
  const notifications = await Notification.find({
    $or: [
      { user_id },
      {
        type: { $in: ["announcement", "maintenance"] },
        isSent: true, // Only show sent notifications
        startDate: { $lte: now }, // And startDate has passed
        $or: [
          { endDate: { $exists: false } },        // no end date → always visible
          { endDate: { $gte: now } },             // not expired
        ],
      },
    ],
  })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user_id", "full_name email")
    .lean(); // 👈 so we can safely mutate results

  for (let notif of notifications) {
    if (notif.meta?.senderId) {
      const sender = await User.findById(notif.meta.senderId).select("full_name email").lean();
      notif.meta.sender = sender || null;
    }
  }

  return notifications;
};


export const markAsRead = async (userID,notificationID) => {  
  let query ;
  if(notificationID !== 'all'){
    query = { _id: notificationID, user_id: userID };
  }else{
    query = { user_id: userID };
  }


    const notifications = await Notification.updateMany(
       query,
        { $set: { isRead: true } },
        {new :true}
    );    
    return notifications;
};

export const getAnnoncementNotifications = async () => {
    const notifications = await Notification.find({ type: "announcement" })
        .sort({ created_at: -1 })
        .populate("user_id", "full_name email");
    return notifications;
};
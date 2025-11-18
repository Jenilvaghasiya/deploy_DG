import { sendNotification } from "../../utils/notificationUtils.js";
import User from "../../modules/users/model.js";
import { sendMail, sendUserMail } from "../../services/mailServices.js";
import { errorAlertEmail } from "../../services/mailTemplates.js";
import AiTask from "./model.js";
import { sendResponse } from "../../utils/responseHandler.js";

// Reusable failure handler
export const handleImageVariationFailure = async (userId, io = null) => {
  try {
    // Send real-time notification
    await sendNotification(io || global.io, {
      user_id: userId,
      type: "failure_warning",
      message: "Image processing failed. Please try again later.",
    });

    // Send email notification
    const user = await User.findById(userId);
    if (user?.email) {
      const { subject, html } = errorAlertEmail(user.full_name || "User");
      await sendUserMail({
        userId,
        to: user.email,
        subject,
        html,
      });
    }
  } catch (error) {
    console.error("Failure notification error:", error);
  }
};

// Original service (if needed elsewhere)
export const imageVariationService = async (userId, io = null) => {
  try {
    throw new Error("Simulated failure in image variation");
  } catch (error) {
    await handleImageVariationFailure(userId, io);
  }
};

export const preventDuplicateTask = (taskType) => {
  return async (req, res, next) => {
    console.log("preventDuplicateTask middleware triggered", req.user.id, taskType);
    try {
      const existingTask = await AiTask.findOne({
        user_id: req.user.id,
        task: taskType,
        status: "queued",
      });

      if (existingTask) {
        return sendResponse(res, {
          statusCode: 429,
          message: `You already have a queued "${taskType}" task. Please wait until it completes.`,
        });
      }

      next();
    } catch (err) {
      console.error("Error in preventDuplicateTask middleware:", err);
      return sendResponse(res, {
        statusCode: 500,
        message: "Internal server error",
      });
    }
  };
};
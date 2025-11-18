import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import {UserPreferences}  from "./model.js";
import User from "../users/model.js";
import { decryptImagePath } from "../gallery/service.js";

export const addOrUpdateUserPreference = asyncHandler(async(req, res) => {
    try {
    const userId = req.user.id;
    let existing = await UserPreferences.findOne({ userId: userId });
    if (existing) {
         Object.assign(existing, req.body);
        await existing.save();
        sendResponse(res, {data : existing});
    }else {
        const newPrefs = new UserPreferences({
        userId,
        ...req.body,
      });
      await newPrefs.save();
      sendResponse(res, {data : newPrefs});
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const getUserPreferences = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Find preferences for this user
  let preferences = await UserPreferences.findOne({ userId });

// Convert to plain object so we can add dynamic fields
if (preferences) {
  preferences = preferences.toObject();
} else {
  preferences = {
    keepMeLoggedIn: false,
    analyticsConsent: false,
    marketingConsent: false,
    functionalConsent: false,
    autoRenewal: false,
    sessionTimeoutLength: 30,
    allowUserDataForModelTuning: false,
    emailNotifications: true,
    howItWorksPopup: true,
  };
}

// Now safely add userPhone
const user = await User.findById(userId).select("user_phone");
preferences.userPhone = user?.user_phone ? decryptImagePath(user.user_phone) : null;

    sendResponse(res,{
      statusCode: 200,
      status: "status",
      data: preferences,
      message : "User preference retrieved successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get user preferences" });
  }
});
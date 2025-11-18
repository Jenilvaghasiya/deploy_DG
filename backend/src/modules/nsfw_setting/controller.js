import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import NsfwSettings from "./model.js";

export const getNSFWSettings = async (req, res) => {
  try {
    const settings = await NsfwSettings.getSingleton();

    return sendResponse(res, {
      statusCode: 200,
      status: "success",
      message: "NSFW settings fetched successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching NSFW settings:", error);

    return sendResponse(res, {
      statusCode: 500,
      status: "error",
      message: "Failed to fetch NSFW settings",
      data: { error: error.message },
    });
  }
};


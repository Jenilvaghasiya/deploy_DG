import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";
import UserTour from "../app_tour/model.js"
export const howItWorksTourStatus = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const tours = await UserTour.findOne({ userId: userId });
    sendResponse(res, {
      statusCode: 200,
      success: "success",
      data: tours
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch tour status' });
  }
});

export const updateTourStatus = asyncHandler(async (req, res) => {
  try {
    const { tourKey } = req.body;
    const userId = req.user?.id;

    await UserTour.findOneAndUpdate(
      { userId: userId },          // query
      { [tourKey]: true },          // update
      { upsert: true, new: true }   // options
    );
    sendResponse(res, {
      statusCode: 200,
      success: "success",
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update tour status' });
  }
});
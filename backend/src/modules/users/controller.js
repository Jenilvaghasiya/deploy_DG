import * as userService from "./service.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import OTP  from "./otpSchema.js"; // adjust path
import { encryptImagePath } from "../gallery/service.js";
import User from "../users/model.js";
import Gallery from "../gallery/model.js"
import mongoose from "mongoose";
import Moodboard from '../moodboards/model.js'
import SizeChart from '../image_variation/sizeChartSchema.js'
import Project from '../projects/model.js'
import { sendUserMail } from "../../services/mailServices.js";
import { profileDeletionEmail } from "../../services/mailTemplates.js";



export const getAllUsers = asyncHandler(async (req, res) => {
    const { search } = req.query;
    const users = await userService.getAllUsers(search, req.user.tenant_id);
    sendResponse(res, { data: users });
});

export const getAllRevokedUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAllRevokedUsers(req.user.tenant_id);
    sendResponse(res, { data: users });
});

export const moveRevokedUserData = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const tenant_id = req.user.tenant_id;
  const payload = req.body;

  console.log(payload, 'payload');
  const { revokedUserId, destinationUserId } = payload;
  if (!revokedUserId || !destinationUserId) {
    return res.status(400).json({ message: "Both revokedUserId and destinationUserId are required" });
  }

  // start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate destination user
    const destUser = await User.findOne({ _id: destinationUserId, tenant_id, is_deleted: false }).session(session);
    if (!destUser) {
      throw new Error("Destination user not found or already deleted");
    }

    // 2. Validate revoked user
    const revokedUser = await User.findOne({ _id: revokedUserId, tenant_id }).session(session);
    if (!revokedUser) {
      throw new Error("Revoked user not found");
    }

    // 3. Reassign all GalleryImages from revoked user → destination user
    const galleryUpdateResult = await Gallery.updateMany(
      { user_id: revokedUserId, tenant_id },
      { $set: { user_id: destinationUserId } },
      { session }
    );

    // 4. Reassign all Moodboards from revoked user → destination user
    const moodboardUpdateResult = await Moodboard.updateMany(
      { user_id: revokedUserId, tenant_id },
      { $set: { user_id: destinationUserId } },
      { session }
    );

    // 5. Reassign all SizeCharts from revoked user → destination user
    const sizeChartUpdateResult = await SizeChart.updateMany(
      { user_id: revokedUserId, tenant_id },
      { $set: { user_id: destinationUserId } },
      { session }
    );

    // 6. Update Projects - remove revoked user from user_ids array and add destination user if not already present
    const projectsWithRevokedUser = await Project.find(
      { user_ids: revokedUserId, tenant_id },
      { _id: 1 },
      { session }
    );

    let projectsUpdated = 0;
    for (const project of projectsWithRevokedUser) {
      await Project.updateOne(
        { _id: project._id },
        {
          $pull: { user_ids: revokedUserId },
          $addToSet: { user_ids: destinationUserId }
        },
        { session }
      );
      projectsUpdated++;
    }

    // 7. Update created_by and updated_by fields in Projects
    const projectCreatedByResult = await Project.updateMany(
      { created_by: revokedUserId, tenant_id },
      { $set: { created_by: destinationUserId } },
      { session }
    );

    const projectUpdatedByResult = await Project.updateMany(
      { updated_by: revokedUserId, tenant_id },
      { $set: { updated_by: destinationUserId } },
      { session }
    );

    // 8. Mark Flag in User data_transfered as true
    revokedUser.data_transfered = true;
    await revokedUser.save({ session });

    // 9. Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "User data successfully moved",
      results: {
        galleryImages: galleryUpdateResult.modifiedCount,
        moodboards: moodboardUpdateResult.modifiedCount,
        sizeCharts: sizeChartUpdateResult.modifiedCount,
        projectsUserIds: projectsUpdated,
        projectsCreatedBy: projectCreatedByResult.modifiedCount,
        projectsUpdatedBy: projectUpdatedByResult.modifiedCount
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: error.message || "Failed to move user data" });
  }
});

export const searchUser = asyncHandler(async (req, res) => {
    const { search } = req.query;

    if (!search || !search.trim()) {
        return sendResponse(res, { data: [] });
    }
    
    const users = await userService.searchUser(search, req.user.id, req.user.tenant_id);
    sendResponse(res, { data: users });
});

export const getTenantUsers = asyncHandler(async (req, res) => {
    const users = await userService.getTenantUsers(req.user.tenant_id);
    sendResponse(res, { data: users });
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    sendResponse(res, { data: user });
});

export const createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    sendResponse(res, {
        message: "User created",
        statusCode: 201,
        data: user,
    });
});

export const updateUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    sendResponse(res, { message: "User updated", data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { reason } = req.body; // 👈 change from req.data to req.body (payload from client)
  const userId = req.params.id;

  // delete user first
  const user = await userService.deleteUser(userId, req.user.id, req.user.tenant_id);



  if (user) {
    const { subject, html } = profileDeletionEmail(reason);
    await sendUserMail({
      userId,
      to: user.email,
      subject,
      html,
    });
  }

  sendResponse(res, { message: "User deleted" });
});

export const getProfile = asyncHandler(async (req, res) => {
    const userData = await userService.getProfile(req.user.id);
    sendResponse(res, { data: userData });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const { full_name, nick_name } = req.body;
    const userId = req.user.id;

    const updatedUser = await userService.updateProfile(userId, full_name, nick_name);
    sendResponse(res, { message: "Profile updated", data: updatedUser });
});

export const updatePassword = asyncHandler(async (req, res) => {
    try {
        const { otp, current_password, new_password } = req.body;
        const userId = req.user.id;

        await userService.updatePassword(userId, otp, current_password, new_password);
        sendResponse(res, { message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
});

export const updateEmail = asyncHandler(async (req, res) => {
    try {
        const { newEmail, otp } = req.body;
        const userId = req.user.id;
        const updatedUser = await userService.updateEmail(userId, newEmail, otp);
        sendResponse(res, { message: "Email updated successfully", data: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
});

export const sendTwoFactorOTP = asyncHandler(async (req, res) => {
    try {
    const { phoneNumber } = req.body;    
    const userId = req.user?.id;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration (e.g., 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to DB
    await OTP.create({ userId, otp, expiresAt, type: "TWO_FACTOR" });

    // For now, log OTP to console (replace with Twilio SMS in production)
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    
    sendResponse(res, {
      statusCode : 200, 
      success: "success",
      message: "OTP request logged to console (Twilio not configured)"
    });
    
  } catch (error) {
    console.error("Error in send-phone-otp:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process OTP request"
    });
  }
});

export const updateUserPhone = asyncHandler(async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const userId = req.user?.id;

        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone number and OTP are required",
            });
        }

        // Find OTP
        const otpRecord = await OTP.findOne({ userId, otp, type: "TWO_FACTOR" });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP or phone number",
            });
        }

        // Check expiration
        if (otpRecord.expiresAt < new Date()) {
            // Delete expired OTP
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }

        // ✅ OTP is valid → delete it immediately
        await OTP.deleteOne({ _id: otpRecord._id });
        const encryptedPhone = encryptImagePath(phoneNumber);

        // Update user's phone number and set as verified
        await User.findByIdAndUpdate(userId, {
            user_phone: encryptedPhone,
            phoneVerified: true
        });

        sendResponse(res, {
            statusCode: 200, 
            success: "success",
            message: "Phone number verified and updated successfully"
        });
    } catch (error) {
        console.error("Error in verification otp:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify OTP and update phone"
        });
    }
});

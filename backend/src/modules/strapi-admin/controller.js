// controllers/userStrapiController.js
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";
import * as userStrapiService from "./service.js";
import SocialPost from "../dg_social/model.js";
import { postApprovalEmail, postDeletionEmail, postRejectionEmail } from "../../services/mailTemplates.js";
import { sendMail, sendUserMail } from "../../services/mailServices.js";
import Review from "../dg_social/reviewSchema.js";
import StrapiUsageLog from "./starpiUsageLogSchema.js";
import mongoose from "mongoose";
import Plan from "../stripe/model.js";
import stripe from "../../config/stripe.js";
import { ApiError } from "../../utils/ApiError.js";
import Subscription from "../stripe/subscriptionSchema.js";
import { sendAnnouncementNotification, sendPlatformNotification } from "../../utils/notificationUtils.js";
import Notification from "../notifications/model.js";
import User from "../users/model.js";
import { announcementEmail } from "../../services/mailTemplates.js";
import cron from 'node-cron';
import crypto from "crypto";
import userCreditSchema from "../credits/model.js";
import Gallery from "../gallery/model.js";
import {ColorAnalysis} from "../image_variation/ColorAnalysis.js";
import {Cutout} from "../image_variation/Cutout.js";
import AITask from "../image_variation/model.js";
import sizeChartSchema from "../image_variation/sizeChartSchema.js";
import {TechPack} from "../image_variation/TechPackSchema.js";
import templateChartSchema from "../image_variation/templateChartSchema.js";
import moodboardSchema from "../moodboards/model.js";
import NotificationSchema from "../notifications/model.js";
import subscriptionSchema from "../stripe/subscriptionSchema.js";
import userProjectRoleSchema from "../user_project_role/model.js";
import projectSchema from "../projects/model.js";
import {UserModuleUsage} from "../dashboard/userModuleUsageSchema.js";
import {UserTime} from "../dashboard/userTimeSchema.js";
import socialPostSchema from "../dg_social/model.js";
import reviewSchema from "../dg_social/reviewSchema.js"
import AppReview from "../dg_social/appReviewSchema.js";
import NsfwSettings from "../nsfw_setting/model.js";
// export const getAllUsersWithCredits = asyncHandler(async (req, res) => {
//   const { search, page = 1, limit = 10 } = req.query;
//   const result = await userStrapiService.getUsersWithCredits({ search, page, limit });
//   sendResponse(res, { data: result });
// });

// export const addCreditsToUser = asyncHandler(async (req, res) => {
//   try {
//     const { userId, credits } = req.body;

//     if (!userId || typeof credits !== "number") {
//       return res.status(400).json({ message: "user_id and numeric creditsToAdd required" });
//     }

//     const updatedCredit = await userStrapiService.addCredits(userId, credits);
//     // lOG THE CREDIT ADDITION
//     await StrapiUsageLog.create({
//       module: "general",
//       type: "credit_added",
//       metadata: { userId, creditsAdded: credits, name: updatedCredit?.user_id?.full_name || "N/A" },
//     });
//     sendResponse(res, { data: updatedCredit });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error adding credits", error });
//   }
// });


export const getAllTenantsWithCredits = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const result = await userStrapiService.getTenantsWithCredits({ search, page, limit });
  sendResponse(res, { data: result });
});

export const addCreditsToTenant = asyncHandler(async (req, res) => {
  try {
    const { tenantId, credits } = req.body;

    if (!tenantId || typeof credits !== "number") {
      return res.status(400).json({ message: "tenantId and numeric creditsToAdd required" });
    }

    const updatedCredit = await userStrapiService.addCredits(tenantId, credits);
    // lOG THE CREDIT ADDITION
    await StrapiUsageLog.create({
      module: "general",
      type: "credit_added",
      metadata: { tenantId, creditsAdded: credits, name: updatedCredit?.tenant_id?.name || "N/A" },
    });
    sendResponse(res, { data: updatedCredit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding credits", error });
  }
});

export const getAllTenants = asyncHandler(async (req, res) => {
    const { search, page = 1, limit = 10, startDate, endDate } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;

    const tenants = await userStrapiService.getAllTenants(search, pageNum, pageSize, startDate, endDate);

    const total = await userStrapiService.countTenants(search, startDate, endDate);

    sendResponse(res, { 
        data: tenants,
        meta: {
            total,
            page: pageNum,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
        }
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.params.id;
    const { deleteOption } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (deleteOption === "user_and_data") {
      // Delete user and all associated data
      await session.withTransaction(async () => {
        await Promise.all([
          userCreditSchema.deleteMany({ user_id: userId }).session(session),
          Gallery.deleteMany({ user_id: userId }).session(session),
          ColorAnalysis.deleteMany({ user_id: userId }).session(session),
          Cutout.deleteMany({ user_id: userId }).session(session),
          AITask.deleteMany({ user_id: userId }).session(session),
          sizeChartSchema.deleteMany({ user_id: userId }).session(session),
          TechPack.deleteMany({ user_id: userId }).session(session),
          templateChartSchema.deleteMany({ user_id: userId }).session(session),
          moodboardSchema.deleteMany({ user_id: userId }).session(session),
          NotificationSchema.deleteMany({ user_id: userId }).session(session),
          subscriptionSchema.deleteMany({ user_id: userId }).session(session),
          userProjectRoleSchema.deleteMany({ user_id: userId }).session(session),
          projectSchema.updateMany(
            { user_ids: userId }, 
            { $pull: { user_ids: userId } }, 
            { session }
          ),
          socialPostSchema.deleteMany({ user_id: userId }).session(session),
          UserModuleUsage.deleteMany({ user_id: userId }).session(session),
          UserTime.deleteMany({ user_id: userId }).session(session),
          reviewSchema.deleteMany({ user_id: userId }).session(session),
        ]);
        await User.findByIdAndDelete(userId, { session });
      });
      
      return res.json({ 
        message: "User and all associated data deleted successfully" 
      });
    } else {
      // Delete user only (preserve data)
      await User.findByIdAndDelete(userId);
      
      return res.json({ 
        message: "User deleted successfully (data preserved)" 
      });
    }
  } catch (err) {
    console.error("❌ Delete User Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    session.endSession();
  }
});


export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10, startDate, endDate } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;

  const users = await userStrapiService.getAllUsers(search, pageNum, pageSize, startDate, endDate);
  const total = await userStrapiService.countUsers(search, startDate, endDate);

  sendResponse(res, { 
    data: users,
    meta: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  });
});

export const getApprovedPosts = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";
    const { startDate, endDate } = req.query;

    // Match stage (base filter)
    const matchStage = { status: "approved" };

    if (startDate && endDate) {
      matchStage.created_at = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      matchStage.created_at = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchStage.created_at = { $lte: new Date(endDate) };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ];

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        pipeline.push({
          $match: { "user._id": new mongoose.Types.ObjectId(search) },
        });
      } else {
        pipeline.push({
          $match: {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { "user.nick_name": { $regex: search, $options: "i" } },
              // { "user.full_name": { $regex: search, $options: "i" } },
            ],
          },
        });
      }
    }

    // Count total
    const totalResult = await SocialPost.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);
    const total = totalResult[0]?.total || 0;

    // Apply pagination + sorting
    pipeline.push({ $sort: { created_at: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Shape final response
    pipeline.push({
      $project: {
        _id: 1,
        url: 1,
        title: 1,
        description: 1,
        status: 1,
        tenant_id: 1,
        likes: 1,
        dislikes: 1,
        comments: 1,
        reports: 1,
        created_at: 1,
        updated_at: 1,
        user_id: {
          id: "$user._id",
          full_name: "$user.full_name",
          nick_name: "$user.nick_name",
        },
      },
    });

    const posts = await SocialPost.aggregate(pipeline);

    return sendResponse(res, {
      statusCode: 200,
      message: "Posts fetched successfully",
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching posts", error });
  }
});

export const getPendingPosts = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";
    const { startDate, endDate } = req.query;

    // Match stage (base filter)
    const matchStage = { status: "pending" };

    if (startDate && endDate) {
      matchStage.created_at = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      matchStage.created_at = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchStage.created_at = { $lte: new Date(endDate) };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ];

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        pipeline.push({
          $match: { "user._id": new mongoose.Types.ObjectId(search) },
        });
      } else {
        pipeline.push({
          $match: {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { "user.nick_name": { $regex: search, $options: "i" } },
              // { "user.full_name": { $regex: search, $options: "i" } },
            ],
          },
        });
      }
    }

    // Count total
    const totalResult = await SocialPost.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);
    const total = totalResult[0]?.total || 0;

    // Apply pagination + sorting
    pipeline.push({ $sort: { created_at: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Shape final response
    pipeline.push({
      $project: {
        _id: 1,
        url: 1,
        title: 1,
        description: 1,
        status: 1,
        tenant_id: 1,
        likes: 1,
        dislikes: 1,
        comments: 1,
        reports: 1,
        created_at: 1,
        updated_at: 1,
        user_id: {
          id: "$user._id",
          full_name: "$user.full_name",
          nick_name: "$user.nick_name",
        },
      },
    });

    const posts = await SocialPost.aggregate(pipeline);

    return sendResponse(res, {
      statusCode: 200,
      message: "Posts fetched successfully",
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching posts", error });
  }
});

export const approvePost = asyncHandler(async (req, res) => {
  try {
    const { id, userId } = req.params;
    const post = await SocialPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.status = "approved";
    await post.save();
    // Log the approval action
    await StrapiUsageLog.create({
      module: "social_post",
      type: "post_approved",
      metadata: { postId: id, name: post.title || "" },
    });
    const user = await userStrapiService.getUserById(userId);
    const { subject, html } = postApprovalEmail();
      await sendUserMail({
        userId,
        to: user.email,
        subject,
        html,
      });
    return sendResponse(res, { statusCode: 200, message: "Post approved successfully", data: post });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error approving post", error });
  }
});

export const rejectPost = asyncHandler(async (req, res) => {
  try {
    const { id, userId } = req.params;
    const post = await SocialPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.status = "rejected";
    await post.save();
    // Log the rejection action
    await StrapiUsageLog.create({
      module: "social_post",
      type: "post_rejected",
      metadata: { postId: id, name: post.title || "" },
    });
    const user = await userStrapiService.getUserById(userId);
    const { subject, html } = postRejectionEmail();
      await sendUserMail({
        userId,
        to: user.email,
        subject,
        html,
      });
    return sendResponse(res, { statusCode: 200, message: "Post rejected successfully", data: post });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error rejecting post", error });
  }
});

export const deletePost = asyncHandler(async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Use findByIdAndDelete
    const deletedPost = await SocialPost.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Log the deletion action
    await StrapiUsageLog.create({
      module: "social_post",
      type: "post_deleted",
      metadata: { postId: id, name: deletedPost.title || "" },
    });

    const user = await userStrapiService.getUserById(userId);
    const { subject, html } = postDeletionEmail();
      await sendUserMail({
        userId: user._id,
        to: user.email,
        subject,
        html,
      });
    return sendResponse(res, { statusCode: 200, message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting post", error });
  }
});

export const deletePostReport = asyncHandler(async (req, res) => {
  try {
    const { postId, reportId } = req.params;
    const post = await SocialPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.reports = post.reports.filter(
      (report) => report._id.toString() !== reportId
    );
    await post.save();
    // Log the report deletion action
    await StrapiUsageLog.create({
      module: "social_post",
      type: "spam_post_deleted",
      metadata: { postId, reportId, name: post.title || "" },
    });

    return sendResponse(res, { statusCode: 200, message: "Report deleted successfully", data: post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting report", error });
  }
});

export const getApprovedReviews = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";
    const { startDate, endDate } = req.query;

    // Base match
    const matchStage = { status: "approved" };

    if (startDate && endDate) {
      matchStage.created_at = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      matchStage.created_at = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchStage.created_at = { $lte: new Date(endDate) };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "socialposts",
          localField: "post_id",
          foreignField: "_id",
          as: "post",
        },
      },
      { $unwind: "$post" },
    ];

    // Search filter
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        pipeline.push({
          $match: { "user._id": new mongoose.Types.ObjectId(search) },
        });
      } else {
        pipeline.push({
          $match: {
            $or: [
              { comment: { $regex: search, $options: "i" } },
              { "user.nick_name": { $regex: search, $options: "i" } },
              { "post.title": { $regex: search, $options: "i" } },
            ],
          },
        });
      }
    }

    // Count total
    const totalResult = await Review.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);
    const total = totalResult[0]?.total || 0;

    // Sorting + Pagination
    pipeline.push({ $sort: { created_at: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Shape response
    pipeline.push({
      $project: {
        _id: 1,
        rating: 1,
        comment: 1,
        status: 1,
        tenant_id: 1,
        useful: 1,
        not_useful: 1,
        created_at: 1,
        updated_at: 1,
        user_id: {
          id: "$user._id",
          full_name: "$user.full_name",
          nick_name: "$user.nick_name",
        },
        post_id: {
          id: "$post._id",
          title: "$post.title",
        },
        reports: {
          $map: {
            input: "$reports",
            as: "r",
            in: {
              user_id: "$$r.user_id",
              type: "$$r.type",
              text: "$$r.text",
              created_at: "$$r.created_at",
            },
          },
        },
      },
    });

    const reviews = await Review.aggregate(pipeline);

    return sendResponse(res, {
      statusCode: 200,
      message: "Reviews fetched successfully",
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reviews", error });
  }
});

export const getPendingReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;   // default: 1
  const limit = parseInt(req.query.limit) || 10; // default: 10
  const skip = (page - 1) * limit;

  // count total docs
  const total = await Review.countDocuments({ status: "pending" });

  // fetch paginated data with user nickname + post title
  const reviews = await Review.find({ status: "pending" })
    .populate("user_id", "nick_name")
    .populate("post_id", "title")
    .populate("reports.user_id", "nick_name")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return sendResponse(res, {
    data: reviews,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const approveReview = asyncHandler(async (req, res) => {
  try{
    const { id } = req.params;
    const review = await Review.findById(id).populate("post_id");
    if (!review) return res.status(404).json({ message: "Review not found" });
    review.status = "approved";
    await review.save();
    // Log the approval action
    await StrapiUsageLog.create({
      module: "social_post",
      type: "review_approved",
      metadata: { reviewId: id , name: review?.post_id?.title || "" },
    });

    return sendResponse(res, { statusCode: 200, message: "Post approved successfully", data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error approving review", error });
  }
});

export const rejectReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id).populate("post_id");
    if (!review) return res.status(404).json({ message: "Review not found" });
    review.status = "rejected";
    await review.save();
    // Log the rejection action
    await StrapiUsageLog.create({
      module: "social_post",
      type: "review_rejected",
      metadata: { reviewId: id, name: review?.post_id?.title || "" },
    });
    return sendResponse(res, { statusCode: 200, message: "Post rejected successfully", data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error rejecting review", error });
  }
});

export const deleteReviewReport = asyncHandler(async (req, res) => {
  try {
    const { reviewId, reportId } = req.params;
    console.log("reviewId, reportId", reviewId, reportId);
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    review.reports = review.reports.filter(
      (report) => report._id.toString() !== reportId
    );
    await review.save();
    // Log the report deletion action
    await StrapiUsageLog.create({
      module: "social_post",
      type: "review_report_deleted",
      metadata: { reviewId, reportId },
    });

    return sendResponse(res, { statusCode: 200, message: "Report deleted successfully", data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting report", error });
  }
});

export const getActivityLogs = asyncHandler(async (req, res) => {
    const { search, page = 1, limit = 10, startDate, endDate } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;

    const activities = await userStrapiService.getAllActivity(search, pageNum, pageSize, startDate, endDate);

    const total = await userStrapiService.countActivity(search, startDate, endDate);

    sendResponse(res, {
        data: activities,
        meta: {
            total,
            page: pageNum,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
        }
    });
});

/**
 * Create a new subscription plan
 */
export const createPlan = asyncHandler(async (req, res) => {
  try {
    const { name, description, price, credits } = req.body;
    console.log(req.body, ' ooooooooooooooo');

    // 1. Create product in Stripe
    const product = await stripe.products.create({
      name,
      description,
    });

    // 2. Create recurring price in Stripe
    const stripePrice = await stripe.prices.create({
      unit_amount: price * 100, // cents
      currency: "inr",
      recurring: { interval: "month" },
      product: product.id,
    });

    // 3. Save in MongoDB
    const plan = await Plan.create({
      name,
      description,
      credits,
      price,
      stripeProductId: product.id,
      stripePriceId: stripePrice.id,
    });

    sendResponse(res, {
      statusCode: 201,
      data: plan,
      message: "Plan created successfully",
    });
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Failed to create plan");
  }
});

/**
 * Get all plans
 */
export const getPlans = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";

    const query = {
      is_deleted: false,
    };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const plans = await Plan.find(query)
      .skip(skip)
      .limit(limit);

    const total = await Plan.countDocuments(query);
    
    sendResponse(res, {
      statusCode: 200,
      data: plans,
      message: "Plan fetched successfully",
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total    / limit),
      },
    });
  } catch (err) {
    console.error("err:",err);
    throw new ApiError(500, "Failed to fetch plans");
  }
});

/**
 * Get plan by ID
 */
export const getPlanById = asyncHandler(async (req, res) => {
  try{
    const { id } = req.params;
    const plan = await Plan.findById(id);
  
    if (!plan || plan.is_deleted) throw new ApiError(404, "Plan not found");
  
    sendResponse(res, {
      statusCode: 200,
      data: plan,
      message: "Plan fetched successfully",
    });
  } catch (err) {
    console.error("err:", err);
    throw new ApiError(500, "Failed to fetch plan");
  }
});


/**
 * Update plan (name, description, price, credits)
 */
export const updatePlan = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, credits } = req.body;

    const plan = await Plan.findById(id);
    if (!plan) throw new ApiError(404, "Plan not found!");
    const activeSubscriptions = await Subscription.find({
      plan: id,
      status: { $in: ["active", "incomplete"] },
    });
    if (activeSubscriptions.length > 0) {
      return res.status(400).json({
        error: "Cannot update plan with active or incomplete subscriptions",
      });
    }
    // Update Stripe product
    await stripe.products.update(plan.stripeProductId, {
      name,
      description,
    });

    let newPriceId = plan.stripePriceId;
    if (price && price !== plan.price) {
      // Stripe doesn’t allow updating price amount → create new price
      const newPrice = await stripe.prices.create({
        unit_amount: price * 100,
        currency: "inr",
        recurring: { interval: "month" },
        product: plan.stripeProductId,
      });
      newPriceId = newPrice.id;
    }

    // Update MongoDB
    plan.name = name ?? plan.name;
    plan.description = description ?? plan.description;
    plan.credits = credits ?? plan.credits;
    plan.price = price ?? plan.price;
    plan.stripePriceId = newPriceId;

    await plan.save();

    sendResponse(res, {
      statusCode: 200,
      data: plan,
      message: "Plan updated successfully",
    });
  } catch (err) {
    console.error("err:",err);
    throw new ApiError(500, "Failed to update plan");
  }
});

/**
 * Delete plan
 */
export const deletePlan = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
     const activeSubscriptions = await Subscription.find({
      plan: id,
      status: { $in: ["active", "incomplete"] },
    });
    if (activeSubscriptions.length > 0) {
      return res.status(400).json({
        error: "Cannot delete plan with active or incomplete subscriptions",
      });
    }
    // Stripe: deactivate product (can't fully delete if it has subscriptions)
    await stripe.products.update(plan.stripeProductId, { active: false });

    // Soft delete
    plan.is_deleted = true;
    plan.is_active = false;
    await plan.save();

    // Hard delete
    // await Plan.findByIdAndDelete(id);

    sendResponse(res, {
      statusCode: 200,
      message: "Plan deleted successfully",
    });
  } catch (err) {
    console.error("err:",err);
    throw new ApiError(500, "Failed to delete plan");
  }
});


export const createPlatformNotification = asyncHandler(async (req, res) => {
  const { message, startDate, endDate, type } = req.body;

  if (!["announcement", "maintenance"].includes(type)) {
    return res.status(400).json({ message: "Invalid notification type" });
  }

  // Validate startDate and endDate
  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Start date and end date are required" });
  }

  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({ message: "Start date must be before end date" });
  }

  const notificationStartDate = new Date(startDate);
  const now = new Date();
  const isImmediate = notificationStartDate <= now;

  // ADD THIS CHECK - Validate future dates only
  if (notificationStartDate <= now) {
    return res.status(400).json({ message: "Start date must be in the future" });
  }
  
  if (new Date(endDate) <= now) {
    return res.status(400).json({ message: "End date must be in the future" });
  }

  // Create notification but don't send immediately
  const notification = await Notification.create({
    message,
    type,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    isSent: false, // Always false for scheduled notifications
    isRead: true
  });

  // // If start time has arrived, send immediately
  // if (isImmediate) {
  //   // Broadcast notification
  //   if (global.io) {
  //     global.io.emit("notifications", JSON.stringify(notification.toObject()));
  //   }

  //   // Send emails for announcements
  //   if (type === "announcement") {
  //     await sendAnnouncementEmails(notification);
  //   }

  //   // Mark as sent (already set during creation, but update if needed)
  //   notification.isSent = true;
  //   await notification.save();
  // }

  sendResponse(res, { 
    message: "Notification scheduled successfully", 
    data: notification 
  });
});

// Function to send notifications that have reached their start date
export const sendScheduledNotifications = async () => {
  console.log('✅ Notification scheduler running...............');
  try {
    const now = new Date();
    
    // Find notifications where startDate has arrived but haven't been sent yet
    const pendingNotifications = await Notification.find({
      startDate: { $lte: now },
      endDate: { $gte: now }, // Also ensure endDate hasn't passed
      isSent: false
    }).populate('user_id', 'full_name email');

    for (const notification of pendingNotifications) {
      try {
        // Broadcast notification via socket
        if (global.io) {
          global.io.emit("notifications", JSON.stringify(notification.toObject()));
        }

        // If it's an announcement, send emails
        if (notification.type === "announcement") {
          await sendAnnouncementEmails(notification);
        }

        // Mark as sent
        notification.isSent = true;
        await notification.save();

        console.log(`✅ Sent scheduled notification: ${notification._id}`);
      } catch (error) {
        console.error(`❌ Error sending notification ${notification._id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in notification scheduler:', error);
  }
};


// Helper function to send announcement emails
const sendAnnouncementEmails = async (notification) => {
  try {
    const users = await User.find({
      // _id: { $ne: user_id },
      email: { $exists: true, $ne: "" },
    });

    const { subject, html } = announcementEmail(notification.message);

    const results = await Promise.allSettled(
      users.map((user) =>{
        return sendUserMail({
          userId: user._id,
          to: user.email,
          subject,
          html,
        })
      })
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ Email failed to ${users[index].email}:`, result?.reason);
      }
    });

    console.log(`✅ Sent ${users.length} announcement emails`);
  } catch (error) {
    console.error('❌ Error sending announcement emails:', error);
  }
};


export const startNotificationScheduler = () => {
  cron.schedule('* * * * *', sendScheduledNotifications); // Run every minute
  console.log('✅ Notification scheduler started');
};

export const getPlatformNotifications = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10, type, startDate, endDate } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;

  const announcementNotifications = await userStrapiService.getPlatformNotifications({
    search,
    page: pageNum,
    limit: pageSize,
    type,
    startDate,
    endDate,
  });

  const total = await userStrapiService.countPlatformNotifications(
    search,
    type,
    startDate,
    endDate
  );

  sendResponse(res, {
    data: announcementNotifications,
    meta: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});


export const deletePlatformNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findByIdAndDelete(id);
  sendResponse(res, { data: notification });
});


export const updateReviewStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid approval status. Must be pending, approved, or rejected'
        });
    }

    // Find and update the review
    const updatedReview = await AppReview.findByIdAndUpdate(
        id,
        { approvalStatus },
        { new: true, runValidators: true }
    ).populate('userId', 'name nick_name email');

    if (!updatedReview) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    sendResponse(res, {
        data: updatedReview,
        message: `Review status updated to ${approvalStatus}`
    });
});

export const getAppReviews = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt' } = req.query;
    
    // Get average rating
    const ratingStats = await AppReview.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      },
      {
        $project: {
          averageRating: { $round: ['$averageRating', 1] },
          totalRatings: 1,
          ratingDistribution: {
            $arrayToObject: {
              $map: {
                input: [1, 2, 3, 4, 5],
                as: 'star',
                in: {
                  k: { $toString: '$$star' },
                  v: {
                    $size: {
                      $filter: {
                        input: '$ratingDistribution',
                        cond: { $eq: ['$$this', '$$star'] }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    const reviews = await AppReview.find()
      .populate('userId', 'full_name email avatar nick_name')
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await AppReview.countDocuments();

    res.status(200).json({
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalReviews: count,
      stats: ratingStats[0] || {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      }
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
});

export const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find the review first to ensure it exists
    const review = await AppReview.findById(id);

    if (!review) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    // Delete the review
    await AppReview.findByIdAndDelete(id);

    // You might also want to update any related statistics or cached data here
    // For example, if you're caching user statistics, update them after deletion

    sendResponse(res, {
        data: { id },
        message: 'Review deleted successfully'
    });
});



export const updateSettings = asyncHandler(async (req, res) => {
  try {
    const {
      pornThreshold,
      hentaiThreshold,
      sexyThreshold,
      combinedThreshold,
    } = req.body;

    // Try to find the one existing NSFW settings document
    let settings = await NsfwSettings.findOne();

    // If not found, create a new settings document
    if (!settings) {
      const newSettings = new NsfwSettings({
        pornThreshold,
        hentaiThreshold,
        sexyThreshold,
        combinedThreshold,
      });

      const saved = await newSettings.save();

      return res.status(201).json({
        success: true,
        message: "NSFW settings created successfully",
        data: saved,
      });
    }

    // Update only provided fields
    const updates = {};
    if (pornThreshold !== undefined) updates.pornThreshold = pornThreshold;
    if (hentaiThreshold !== undefined) updates.hentaiThreshold = hentaiThreshold;
    if (sexyThreshold !== undefined) updates.sexyThreshold = sexyThreshold;
    if (combinedThreshold !== undefined) updates.combinedThreshold = combinedThreshold;

    // Apply updates to existing document
    Object.assign(settings, updates);
    const updatedSettings = await settings.save();

    return res.json({
      success: true,
      message: "NSFW settings updated successfully",
      data: {
        id: updatedSettings._id,
        pornThreshold: updatedSettings.pornThreshold,
        hentaiThreshold: updatedSettings.hentaiThreshold,
        sexyThreshold: updatedSettings.sexyThreshold,
        combinedThreshold: updatedSettings.combinedThreshold,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update or create NSFW settings",
      message: error.message,
    });
  }
});



export const getNsfwSettings = asyncHandler(async (req, res) => {
  try {
    // Read pagination params
    const page = parseInt(req.query.page, 10) || 1; // default 1
    const limit = parseInt(req.query.limit, 10) || 10; // default 10
    const skip = (page - 1) * limit;

    // Fetch total count for pagination metadata
    const totalCount = await NsfwSettings.countDocuments();

    // Fetch paginated results
    const allSettings = await NsfwSettings.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Return response
    return res.json({
      success: true,
      data: allSettings,
      pagination: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit
      },
      count: allSettings.length,
      source: 'strapi-request',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NSFW settings for Strapi',
      message: error.message
    });
  }
});
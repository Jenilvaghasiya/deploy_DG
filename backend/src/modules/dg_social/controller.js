import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import SocialPost from "./model.js";
import path from "path";
import fs from "fs";
import SocialPostReview from "./reviewSchema.js";
import AppReview from "./appReviewSchema.js"
import mongoose from "mongoose";
const hostUrl = process.env.BASE_URL;

export const createPost = asyncHandler(async (req, res, next) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user.id;
    const { title, description } = req.body;
    const fileUrl = req.file ? `${hostUrl}/uploads/social/${req.file.filename}` : null;
    const post = await SocialPost.create({
        url :fileUrl,
      title,
      status : "pending",
      description,
      tenant_id,
      user_id,
    });

    return sendResponse(res, 201, "Post created successfully", post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating post", error });
  }
});

export const getAllPosts = asyncHandler(async (req, res) => {
  try {
    const user = req.user || {};
    const { filter } = req.query;

    let query= {};

    if (filter === "pending" && user.id) {
      query.status = "pending";
      query.user_id = user.id;
    } else {
      query.status = "approved"; // default public access
    }

    const posts = await SocialPost.find(query)
      .populate("user_id", "nick_name");

    return sendResponse(res, {
      statusCode: 200,
      message: "Posts fetched successfully",
      data: posts,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
});

export const updatePost = asyncHandler(async (req, res) => {
  try {    
    const { id } = req.params;
    const tenant_id = req.user.tenant_id;
    const user_id = req.user.id;
    const { title, description } = req.body;
    const uploadDir = path.join(process.cwd(), "../public/uploads/social"); // adjust path according to your project

    const post = await SocialPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.status === "approved") {
      return res.status(400).json({ message: "Approved posts cannot be updated" });
    }
    // ownership check
    if (post.user_id.toString() !== user_id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }

    // Default: keep old url
    let fileUrl = post.url;

    if (req.file) {
      // delete old file if exists
      if (post.url) {
        const oldFile = path.join(
          uploadDir,
          path.basename(post.url) // extract filename from URL
        );
        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
        }
      }

      // set new file URL
      fileUrl = `${process.env.BASE_URL}/uploads/social/${req.file.filename}`;
    }

    // update
    post.title = title ?? post.title;
    post.description = description ?? post.description;
    post.tenant_id = tenant_id;
    post.user_id = user_id;
    post.url = fileUrl;

    await post.save();

    return sendResponse(res, 200, "Post updated successfully", post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating post", error });
  }
});

export const deletePost = asyncHandler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const post = await SocialPost.findByIdAndDelete(id);
      return sendResponse(res, 200, "Post deleted successfully", post);
    } catch (error) {
      res.status(500).json({ message: "Error deleting post", error 
      });
    }
});

export const likePost = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  const post = await SocialPost.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  // Remove from dislikes if exists
  post.dislikes = post.dislikes.filter(
    (id) => id.toString() !== userId.toString()
  );

  // Toggle like
  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    post.likes.push(userId);
  }

  await post.save();
  return sendResponse(res, {
    statusCode: 200,
    message: "Like updated successfully",
    data: post,
  });
});

export const dislikePost = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  const post = await SocialPost.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  // Remove from likes if exists
  post.likes = post.likes.filter(
    (id) => id.toString() !== userId.toString()
  );

  // Toggle dislike
  if (post.dislikes.includes(userId)) {
    post.dislikes = post.dislikes.filter(
      (id) => id.toString() !== userId.toString()
    );
  } else {
    post.dislikes.push(userId);
  }

  await post.save();
  return sendResponse(res, {
    statusCode: 200,
    message: "Dislike updated successfully",
    data: post,
  });
});

export const addComment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId, text } = req.body;

  const post = await SocialPost.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const newComment = { user_id: userId, text };
  post.comments.push(newComment);

  await post.save();
  return sendResponse(res, {
    statusCode: 201,
    message: "Comment added successfully",
    data: post,
  });
});

export const updateComment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId, commentId } = req.params;
  const { text } = req.body;

  const post = await SocialPost.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  // Only comment owner can update
  if (comment.user_id.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Not authorized to update this comment" });
  }

  comment.text = text || comment.text;
  await post.save();

  return sendResponse(res, {
    statusCode: 200,
    message: "Comment updated successfully",
    data: post,
  });
});

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await SocialPost.findById(postId)
    .populate("comments.user_id", "nick_name");

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  return sendResponse(res, {
    statusCode: 200,
    message: "Comments fetched successfully",
    data: post.comments,
  });
});

export const getUserComments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params; // make sure you pass postId as a route param

  const post = await SocialPost.findById(postId)
    .populate("comments.user_id", "nick_name");

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  // Filter comments for current user
  const userComments = post.comments.filter(
    (comment) => comment.user_id && comment.user_id._id.toString() === userId
  );

  return sendResponse(res, {
    statusCode: 200,
    message: "User comments fetched successfully",
    data: userComments,
  });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId, commentId } = req.params;

  const post = await SocialPost.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const comment = post.comments.find(c => c._id.toString() === commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  // Allow owner of comment or post owner to delete
  if (comment.user_id.toString() !== userId.toString() && post.user_id.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Not authorized to delete this comment" });
  }

  // Remove comment
  post.comments = post.comments.filter(c => c._id.toString() !== commentId);
  await post.save();

  return sendResponse(res, {
    statusCode: 200,
    message: "Comment deleted successfully",
    data: post,
  });
});

export const reportPost = async (req, res) => {
  try {
    const { postId, type, text } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!type) {
      return res.status(400).json({ message: "Report type is required." });
    }

    const post = await SocialPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Check if user already reported this post
    const existingReport = post.reports.find(
      (report) => report.user_id.toString() === userId
    );

    if (existingReport) {
      // Update existing report
      existingReport.type = type;
      existingReport.text = text || null;
      existingReport.created_at = new Date();
    } else {
      // Add new report
      post.reports.push({
        user_id: userId,
        type,
        text: text || null,
        created_at: new Date(),
      });
    }

    await post.save();

    res.status(200).json({
      message: "Report submitted successfully.",
    });
  } catch (err) {
    console.error("Error reporting post:", err);
    res.status(500).json({ message: "Failed to report post." });
  }
};



export const createReview = asyncHandler(async (req, res, next) => {
   try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user.id;
    const { reviewId, postId, rating, comment } = req.body;

    // Check if a review by this user already exists for this post
    let review = await SocialPostReview.findOne({
        _id: reviewId,
        post_id: postId,
        user_id,
        tenant_id,
    });

    if (review) {
      if (review.status === "approved") {
        return sendResponse(res, {
          statusCode: 400,
          message: "Approved reviews cannot be updated",
        });
      }      
      review.rating = rating;
      review.comment = comment;
      review.status = "pending"; // or keep previous status if you want
      await review.save();

      return sendResponse(res, {
        statusCode: 200,
        message: "Review updated successfully",
        data: review,
      });
    } else {
      // Create new review
      review = await SocialPostReview.create({
        post_id: postId,
        rating,
        comment : comment? comment : "",
        status: "pending",
        tenant_id,
        user_id,
      });

      return sendResponse(res, {
        statusCode: 201,
        message: "Review submitted successfully",
        data: review,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating/updating review", error });
  }
});

export const getPostReviewsForUser = asyncHandler(async (req, res) => {
  try {
    const user_id = req.user.id;
    const { postId } = req.params;
    const review = await SocialPostReview.findOne({
      post_id: postId,
      user_id,
    });
    return sendResponse(res, {
      statusCode: 200,
      message: "Review fetched successfully",
      data: review,
    });
  }catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching review", error });
  }
});

export const getPostReviewsByPostId = asyncHandler(async (req, res) => {
  try {
    const { postId } = req.params;
    const review = await SocialPostReview.findOne({
      status: "approved",
      post_id: postId,
    });
    return sendResponse(res, {
      statusCode: 200,
      message: "Review fetched successfully",
      data: review,
    });
  }catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching review", error });
  }
});

export const getReviews = asyncHandler(async (req, res) => {
  try {
    const { post_id, filter } = req.query;
    const userId = req.user?.id; // current logged-in user

    let query = {};
    if (post_id) query.post_id = post_id;
    if (filter === "pending") query.status = "pending";
    else if (filter === "approved") query.status = "approved";

    const reviews = await SocialPostReview.find(query)
      .populate("user_id", "nick_name")
      .populate("post_id", "title");

    const formattedReviews = reviews.map((review) => {
      let userMark = null;

      // 👇 check if logged-in user already marked
      if (userId) {
        if (review.useful?.some((id) => id.toString() === userId.toString())) {
          userMark = "useful";
        } else if (
          review.not_useful?.some((id) => id.toString() === userId.toString())
        ) {
          userMark = "not_useful";
        }
      }

      return {
        ...review.toObject(),
        usefulCount: review.useful?.length || 0,
        notUsefulCount: review.not_useful?.length || 0,
        userMark, // 👈 tell frontend what this user already did
      };
    });

    return sendResponse(res, {
      statusCode: 200,
      message: "Reviews fetched successfully",
      data: formattedReviews,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews", error });
  }
});

export const updateReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { rating, comment } = req.body;

    const review = await SocialPostReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user_id.toString() !== user_id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this review" });
    }

    if (review.status !== "pending") {
      return res.status(400).json({ message: "Only pending reviews can be updated" });
    }

    review.rating = rating ?? review.rating;
    review.comment = comment ?? review.comment;

    await review.save();

    return sendResponse(res, 200, "Review updated successfully", review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating review", error });
  }
});

export const deleteReview = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const review = await SocialPostReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user_id.toString() !== user_id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await SocialPostReview.findByIdAndDelete(id);
    return sendResponse(res, 200, "Review deleted successfully");
  } catch (error) {
    res.status(500).json({ message: "Error deleting review", error });
  }
});

export const markReviewUseful = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { reviewId } = req.params;

  const review = await SocialPostReview.findById(reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Remove from not_useful if exists
  review.not_useful = review.not_useful.filter(
    (id) => id.toString() !== userId.toString()
  );

  // Toggle useful
  if (review.useful.includes(userId)) {
    review.useful = review.useful.filter((id) => id.toString() !== userId.toString());
  } else {
    review.useful.push(userId);
  }

  await review.save();
  return sendResponse(res, {
    statusCode: 200,
    message: "Useful status updated successfully",
    data: review,
  });
});

export const markReviewNotUseful = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { reviewId } = req.params;

  const review = await SocialPostReview.findById(reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Remove from useful if exists
  review.useful = review.useful.filter(
    (id) => id.toString() !== userId.toString()
  );

  // Toggle not_useful
  if (review.not_useful.includes(userId)) {
    review.not_useful = review.not_useful.filter(
      (id) => id.toString() !== userId.toString()
    );
  } else {
    review.not_useful.push(userId);
  }

  await review.save();
  return sendResponse(res, {
    statusCode: 200,
    message: "Not useful status updated successfully",
    data: review,
  });
});

export const reportReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId, type, text } = req.body;
    const userId = req.user.id;

    if (!type) {
      return res.status(400).json({ message: "Report type is required." });
    }

    const review = await SocialPostReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    const existingReport = review.reports.find(
      (report) => report.user_id.toString() === userId
    );

    if (existingReport) {
      existingReport.type = type;
      existingReport.text = text || null;
      existingReport.created_at = new Date();
    } else {
      review.reports.push({
        user_id: userId,
        type,
        text: text || null,
        created_at: new Date(),
      });
    }

    await review.save();

    res.status(200).json({
      message: "Review reported successfully.",
    });
  } catch (err) {
    console.error("Error reporting review:", err);
    res.status(500).json({ message: "Failed to report review." });
  }
});

export const getMyReviewedPosts = async (req, res) => {
  try {
    const userId = req.user.id; // depending on your auth setup

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Fetch all reviews made by this user
    const userReviews = await SocialPostReview.find({ user_id: userId })
      .populate({
        path: "post_id",
        model: "SocialPost",
        populate: {
          path: "user_id",
          model: "User",
          select: "nick_name email",
        },
      })
      .populate("user_id", "nick_name email") // reviewer info
      .lean();

    // Filter out reviews where post no longer exists
    const filteredReviews = userReviews.filter((r) => r.post_id !== null);

    // Map each review to its post with only this user's review(s)
    const postsWithUserReviews = filteredReviews.map((r) => ({
      ...r.post_id,
      reviews: [r], // only the current user's review for this post
    }));

    return sendResponse(res, {
      statusCode: 200,
      data: postsWithUserReviews,
      message: "User's reviewed posts retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching reviewed posts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getMyGalleryPosts = async (req, res) => {
  try {
    const userId = req.user.id; // assuming you have auth middleware setting req.user

    // Fetch all posts by this user
    const posts = await SocialPost.find({ user_id: userId })
      .populate("user_id", "name email")        // user details
      .populate("likes", "name")               // users who liked
      .populate("dislikes", "name")            // users who disliked
      .populate("comments.user_id", "name")    // commenter info
      .populate("reports.user_id", "name")     // report info
      .lean();

    // Fetch reviews for user's posts
    const postIds = posts.map((p) => p._id);
    const reviews = await SocialPostReview.find({ post_id: { $in: postIds } })
      .populate("user_id", "name")             // reviewer info
      .populate("useful", "name")              // users who marked useful
      .populate("not_useful", "name")          // users who marked not useful
      .populate("reports.user_id", "name")
      .lean();

    // Attach reviews to each post
    const postsWithReviews = posts.map((post) => ({
      ...post,
      reviews: reviews.filter((r) => String(r.post_id) === String(post._id)),
    }));

    return sendResponse(res, {
      statusCode: 200,
      data: postsWithReviews,
      message: "My gallery posts retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching gallery posts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller function
export const createAppReview = asyncHandler(async (req, res) => {
  try {
    const { title, description, rating } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Review title is required." });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Review description is required." });
    }

    if (!rating) {
      return res.status(400).json({ message: "Rating is required." });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ message: "Rating must be a whole number between 1 and 5." });
    }

    // Check if user has submitted a review in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentReview = await AppReview.findOne({ 
      userId,
      createdAt: { $gte: oneWeekAgo }
    });
    
    if (recentReview) {
      const nextReviewDate = new Date(recentReview.createdAt);
      nextReviewDate.setDate(nextReviewDate.getDate() + 7);
      
      const daysRemaining = Math.ceil((nextReviewDate - new Date()) / (1000 * 60 * 60 * 24));
      
      return res.status(400).json({ 
        message: `You can submit a new review in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`,
        nextReviewDate: nextReviewDate.toISOString()
      });
    }

    // Create new review
    const newReview = new AppReview({
      title: title.trim(),
      description: description.trim(),
      rating,
      userId,
      helpfulUsers: [], // Initialize empty array
      helpfulCount: 0,
      reportCount: 0,
      approvalStatus: 'pending'
    });

    await newReview.save();

    // Populate user info before sending response
    const populatedReview = await AppReview.findById(newReview._id)
      .populate('userId', 'full_name email nick_name');

    res.status(201).json({
      message: "Review submitted successfully.",
      review: populatedReview
    });

  } catch (err) {
    console.error("Error creating app review:", err);
    res.status(500).json({ message: "Failed to create review." });
  }
});

// Controller
export const toggleHelpful = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Validate reviewId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID." });
    }

    // Find the review
    const review = await AppReview.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    // Check if user is trying to mark their own review as helpful
    // if (review.userId.toString() === userId) {
    //   return res.status(400).json({ message: "You cannot mark your own review as helpful." });
    // }

    // Check if user has already marked this review as helpful
    const hasMarkedHelpful = review.helpfulUsers.includes(userId);

    let updateQuery;
    let message;

    if (hasMarkedHelpful) {
      // Remove user from helpfulUsers array
      updateQuery = {
        $pull: { helpfulUsers: userId },
        $inc: { helpfulCount: -1 }
      };
      message = "Removed helpful vote from review.";
    } else {
      // Add user to helpfulUsers array
      updateQuery = {
        $addToSet: { helpfulUsers: userId },
        $inc: { helpfulCount: 1 }
      };
      message = "Marked review as helpful.";
    }

    // Update the review
    const updatedReview = await AppReview.findByIdAndUpdate(
      reviewId,
      updateQuery,
      { new: true, runValidators: true }
    ).populate('userId', 'full_name email nick_name');

    res.status(200).json({
      message,
      review: {
        ...updatedReview.toObject(),
        isHelpfulByCurrentUser: !hasMarkedHelpful
      }
    });

  } catch (err) {
    console.error("Error toggling helpful status:", err);
    res.status(500).json({ message: "Failed to update helpful status." });
  }
});

// Get all approved reviews
export const getAppReviews = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt' } = req.query;
    
    // Get average rating
    const ratingStats = await AppReview.aggregate([
      { $match: { approvalStatus: 'approved' } },
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

    const reviews = await AppReview.find({ approvalStatus: 'approved' })
      .populate('userId', 'full_name email avatar nick_name')
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await AppReview.countDocuments({ approvalStatus: 'approved' });

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

// Mark review as helpful
export const markReviewHelpful = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.body;
    const userId = req.user.id;

    const review = await AppReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    // You might want to track which users found it helpful to prevent multiple votes
    review.helpfulCount += 1;
    await review.save();

    res.status(200).json({
      message: "Review marked as helpful.",
      helpfulCount: review.helpfulCount
    });
  } catch (err) {
    console.error("Error marking review as helpful:", err);
    res.status(500).json({ message: "Failed to mark review as helpful." });
  }
});

// Report a review
export const reportAppReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId, reason } = req.body;
    
    const review = await AppReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    review.reportCount += 1;
    
    // Auto-reject if report count exceeds threshold
    if (review.reportCount >= 5) {
      review.approvalStatus = 'rejected';
    }
    
    await review.save();

    res.status(200).json({
      message: "Review reported successfully."
    });
  } catch (err) {
    console.error("Error reporting review:", err);
    res.status(500).json({ message: "Failed to report review." });
  }
});
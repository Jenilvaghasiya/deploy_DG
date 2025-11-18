import { Router } from "express";
import * as postController from "./controller.js";
import postUpload from "./middleware.js";
import {verifyToken} from "../../middlewares/auth.js"
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";

const router = Router();

router.post("/post/create", checkPermission(PERMISSIONS.POST_CREATE), postUpload.single("image"), postController.createPost);
router.get("/post/get", postController.getAllPosts);
router.put("/post/update/:id", checkPermission(PERMISSIONS.POST_CREATE), postUpload.single("image"), verifyToken, postController.updatePost);
router.delete("/post/delete/:id", checkPermission(PERMISSIONS.SOCIAL_VIEW), verifyToken, postController.deletePost);

router.get("/post/like/:postId", checkPermission(PERMISSIONS.POST_FEEDBACK_ADD), verifyToken, postController.likePost);
router.get("/post/unlike/:postId", checkPermission(PERMISSIONS.POST_FEEDBACK_ADD), verifyToken, postController.dislikePost);
router.post("/post/comment/add", checkPermission(PERMISSIONS.POST_COMMENT_ADD), verifyToken, postController.addComment);
router.put("/post/comment/update/:postId/:commentId", checkPermission(PERMISSIONS.POST_COMMENT_ADD), verifyToken, postController.updateComment)
router.get("/post/comment/get/:postId", checkPermission(PERMISSIONS.POST_COMMENT_VIEW), verifyToken, postController.getComments);
router.delete("/post/comment/delete/:postId/:commentId", checkPermission(PERMISSIONS.SOCIAL_VIEW), verifyToken, postController.deleteComment);
router.post("/post/report", checkPermission(PERMISSIONS.POST_REPORT_ADD), verifyToken, postController.reportPost);

router.post("/post/review/create", checkPermission(PERMISSIONS.POST_REVIEW_ADD), verifyToken, postController.createReview);
router.get("/post/review/user/:postId", checkPermission(PERMISSIONS.POST_REVIEW_VIEW), verifyToken, postController.getPostReviewsForUser);
router.get("/post/review/get", postController.getReviews);
router.put("/post/review/update/:id", checkPermission(PERMISSIONS.POST_REVIEW_ADD), verifyToken, postController.updateReview);
router.delete("/post/review/delete/:id", checkPermission(PERMISSIONS.SOCIAL_VIEW), verifyToken, postController.deleteReview);
router.get("/post/review/mark-useful/:reviewId", checkPermission(PERMISSIONS.SOCIAL_VIEW), verifyToken, postController.markReviewUseful);
router.get("/post/review/mark-not-useful/:reviewId", checkPermission(PERMISSIONS.SOCIAL_VIEW), verifyToken, postController.markReviewNotUseful);
router.post("/post/review/report", checkPermission(PERMISSIONS.SOCIAL_VIEW), verifyToken, postController.reportReview);
router.post("/app-review/create", verifyToken, postController.createAppReview);
router.post("/app-review/:reviewId/helpful", verifyToken, postController.toggleHelpful);

router.get('/post/myReviewed/get', verifyToken, postController.getMyReviewedPosts);
router.get('/post/myGallery/get', verifyToken, postController.getMyGalleryPosts);

export default router;
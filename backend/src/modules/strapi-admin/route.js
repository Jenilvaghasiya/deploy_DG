// routes/userRouter.js
import express from "express";


import { 
    addCreditsToTenant, 
    getAllTenantsWithCredits, 
    getAllTenants, 
    getAllUsers, 
    deleteUser, 
    getPendingPosts, 
    getApprovedPosts, 
    approvePost, 
    rejectPost, 
    deletePost, 
    deletePostReport, 
    getPendingReviews, 
    approveReview, 
    rejectReview, 
    deleteReviewReport, 
    getActivityLogs, 
    getApprovedReviews, 
    getPlans, 
    createPlan, 
    updatePlan, 
    getPlanById, 
    deletePlan, 
    createPlatformNotification, 
    getPlatformNotifications, 
    deletePlatformNotification, 
    updateReviewStatus, 
    getAppReviews, 
    deleteReview,
    // addNSFWSettings, 
    updateSettings,
    getNsfwSettings
} from "./controller.js";
import { nodeStrapiAuth } from "../../middlewares/nodeStrapiAuth.js";

const router = express.Router();

router.use(nodeStrapiAuth); // secure all routes below

// router.get("/users", getAllUsersWithCredits); // GET users with search and pagination
// router.post("/users/add-credits", addCreditsToUser); // POST to add credits to a user
router.get("/tenants", getAllTenantsWithCredits); // GET tenant with search and pagination
router.post("/tenants/add-credits", addCreditsToTenant); // POST to add credits to a tenant
router.get("/tenant-users", getAllTenants); // GET users for the tenant
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get('/social-posts', getPendingPosts);
router.get('/social-posts/approved', getApprovedPosts);
router.get('/social-posts/approve/:userId/:id', approvePost);
router.get('/social-posts/reject/:id', rejectPost);
router.delete('/social-posts/delete/:id', deletePost);
router.delete('/social-posts/report/delete/:postId/:reportId', deletePostReport);
router.get('/reviews/approved', getApprovedReviews);
router.get("/reviews/pending", getPendingReviews);
router.get("/reviews/approve/:id", approveReview);
router.get("/reviews/reject/:id", rejectReview);
router.delete('/social-posts/review/report/delete/:reviewId/:reportId', deleteReviewReport);
router.get("/activity-logs", getActivityLogs);
router.patch("/app-review/:id/status", updateReviewStatus);
router.get("/app-review/get", getAppReviews);
router.delete("/app-review/:id", deleteReview);

// stripe operations
router.get("/stripe/plans", getPlans);
router.post("/stripe/plan", createPlan);
router.put("/stripe/plan/:id", updatePlan);
router.get("/stripe/plan/:id", getPlanById);
router.delete("/stripe/plan/:id", deletePlan);


// announcements
router.post("/create-announcement", createPlatformNotification);
router.get("/get-announcement",getPlatformNotifications);
router.delete("/delete-announcement/:id", deletePlatformNotification);

router.put('/nsfw/update', updateSettings);
router.get('/nsfw', getNsfwSettings);

export default router;
 
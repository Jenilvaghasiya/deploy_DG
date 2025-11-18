import { Router } from "express";
import authRoutes from "../../modules/auth/routes.js";
import onboardingRoutes from "../../modules/onboarding/routes.js";
import invitationRoutes from "../../modules/invitations/routes.js";
import { getWaterMarkedImage } from "../../modules/gallery/controller.js";
import strapiAdmin from '../../modules/strapi-admin/route.js'
import subscriptionRoutes from "../../modules/stripe/routes.js"
import { getAllPosts, getReviews, getPostReviewsByPostId, getAppReviews } from "../../modules/dg_social/controller.js"; // ✅ make sure this import path is correct

const router = Router();
router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/invitations", invitationRoutes);
router.get("/genie-image/:id", getWaterMarkedImage);
router.use("/strapi-admin",strapiAdmin)
router.use("/subscription", subscriptionRoutes)
router.get("/social/posts", getAllPosts);
router.get("/social/posts/reviews", getReviews);
router.get("/app-review/get", getAppReviews);
router.get("/social/posts/reviews/get/:postId", getPostReviewsByPostId);
export default router;

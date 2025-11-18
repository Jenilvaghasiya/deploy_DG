import { Router } from "express";
import * as onboardController from "./controller.js";

const router = Router();

// router.post("/", onboardController.onboardTenant);
router.post("/", onboardController.onboardTenantNew);
router.post("/google", onboardController.onboardTenantWithGoogle);
router.post("/send-otp", onboardController.sendTempUserVerificationOtp);
router.post("/verify-otp", onboardController.verifyTempUserOtp);
router.post("/subscription/checkout", onboardController.createSubscriptionCheckout);
router.post("/subscription/free", onboardController.handleFreePlan);
router.get("/status/:tempUserId", onboardController.checkOnboardingStatus);
router.post('/google/check', onboardController.checkGoogleUserExists);
export default router;

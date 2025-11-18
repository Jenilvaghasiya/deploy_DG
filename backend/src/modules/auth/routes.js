import { Router } from "express";
import * as authController from "./controller.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post('/google-login', authController.googleLogin)
router.post("/send-otp", authController.sendVerificationOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/logout", verifyToken, authController.logout);
router.get("/credits", verifyToken, authController.getCredits);

export default router;

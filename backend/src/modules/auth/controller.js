import { asyncHandler } from "../../middlewares/asyncHandler.js";
import * as authService from "./service.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const register = asyncHandler(async (req, res) => {
    const user = await authService.registerUser(req.body);
    sendResponse(res, {
        message: "User registered successfully",
        data: user,
        statusCode: 201,
    });
});

export const login = asyncHandler(async (req, res) => {
    const ip =
        req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
        req.socket.remoteAddress;
    const token = await authService.loginUser(
        req.body.email,
        req.body.password,
        ip,
        req.body.otp
    );
    sendResponse(res, {
        message: "Login successful",
        data: { token },
    });
});

export const sendVerificationOtp = asyncHandler(async (req, res) => {
    await authService.sendVerificationOtp(req.body.email);
    sendResponse(res, { message: "OTP sent to your email" });
});

export const verifyOtp = asyncHandler(async (req, res) => {
    await authService.verifyUserOtp(req.body.email, req.body.otp);
    sendResponse(res, { message: "Email verified successfully" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
    await authService.sendResetOtp(req.body.email);
    sendResponse(res, { message: "OTP sent for password reset" });
});

export const resetPassword = asyncHandler(async (req, res) => {
    await authService.resetPasswordWithOtp(
        req.body.email,
        req.body.otp,
        req.body.newPassword,
    );
    sendResponse(res, { message: "Password reset successful" });
});

export const logout = asyncHandler(async (req, res) => {
    await authService.logoutUser(req.user.sessionId);
    sendResponse(res, { message: "Logout successful" });
});

export const getCredits = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant_id;

    // Get user-specific credit usage data
    const userCredits = await authService.getCredits(req.user.id, tenantId);

    // Get tenant total credits
    const tenantCredits = await authService.getTenantCredits(tenantId);

    // Merge user usage + tenant total credits
    const creditsResponse = {
        ...userCredits.toJSON(),
        credits: tenantCredits ? tenantCredits.credits : 0,
    };
    
    sendResponse(res, { data: { credits: creditsResponse } });
});

export const googleLogin = asyncHandler(async (req, res) => {
    try {
        
        const { googleToken } = req.body;
        const ip =
        req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
        req.socket.remoteAddress;
        const token = await authService.googleLogin(googleToken, ip)
    sendResponse(res, {
        statusCode: 200,
        status: "success",
        data: { token },
        message : "Login successful"
    });
} catch (error) {
    console.error('error in google login', error);
    return sendResponse(res, {
      statusCode: 500,
      status: "error",
      data : error.message,
      message: "Something went wrong during Google login",
    });
}
});

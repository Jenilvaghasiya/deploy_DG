import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";
import * as onboardingService from "./service.js";
import { OAuth2Client } from 'google-auth-library';
import User from "../users/model.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const onboardTenant = asyncHandler(async (req, res) => {
    const { tenant, admin_user } = req.body;
    const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress;
    const data = await onboardingService.registerTenantAndAdmin(
        tenant,
        admin_user,
        ipAddress
    );

    return sendResponse(res, {
        statusCode: 201,
        message: "Tenant and admin onboarded successfully",
        data,
    });
});


// new onbaording
export const onboardTenantNew = asyncHandler(async (req, res) => {
    const { tenant, admin_user } = req.body;
    const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress;
    const data = await onboardingService.registerTenantAndAdminNew(
        tenant,
        admin_user,
        ipAddress
    );

    return sendResponse(res, {
        statusCode: 201,
        message: "Registration initiated. Please verify your email to continue.",
        data,
    });
});

export const onboardTenantWithGoogle = asyncHandler(async (req, res) => {
    const { tenant, googleToken } = req.body;
    
    if (!googleToken) {
        throw new ApiError(400, "Google token is required");
    }

    if (!tenant) {
        throw new ApiError(400, "Tenant information is required");
    }

    // Verify Google token
    let googlePayload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        googlePayload = ticket.getPayload();
    } catch (error) {
        console.error("Google token verification failed:", error);
        throw new ApiError(401, "Invalid Google token");
    }

    const { sub: google_Id, email, name, email_verified } = googlePayload;

    // Ensure email is verified by Google
    if (!email_verified) {
        throw new ApiError(400, "Google email is not verified");
    }

    const googleUserData = {
        email,
        full_name: name,
        google_Id,
    };

    const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() 
        || req.socket.remoteAddress;

    const data = await onboardingService.registerTenantAndAdminWithGoogle(
        tenant,
        googleUserData,
        ipAddress
    );

    return sendResponse(res, {
        statusCode: 201,
        message: data.message || "Google sign-up successful. Continue to select a plan.",
        data,
    });
});

// send OTP for onboarding
export const sendTempUserVerificationOtp = asyncHandler(async (req, res) => {
    await onboardingService.sendTempUserVerificationOtp(req.body.email);
    sendResponse(res, { message: "OTP sent to your email" });
});


// verify onbaording OTP
export const verifyTempUserOtp = asyncHandler(async (req, res) => {
    const data = await onboardingService.verifyTempUserOtp(req.body.email, req.body.otp);
    sendResponse(res, {statusCode: 200, message: "Email verified successfully", data });
});


// obording subscription checkout
export const createSubscriptionCheckout = asyncHandler(async (req, res) => {
    const { tempUserId, planId } = req.body;
    
    const data = await onboardingService.createCheckoutSessionForOnboarding(
        tempUserId, 
        planId
    );

    return sendResponse(res, {
        statusCode: 200,
        message: "Checkout session created",
        data,
    });
});


// free plan
export const handleFreePlan = asyncHandler(async (req, res) => {
    const { tempUserId } = req.body;
    
    const data = await onboardingService.completeWithFreePlan(tempUserId);

    return sendResponse(res, {
        statusCode: 200,
        message: "Onboarding completed with free plan",
        data,
    });
});


// onboarding stage status
export const checkOnboardingStatus = asyncHandler(async (req, res) => {
    const { tempUserId } = req.params;
    
    const data = await onboardingService.getOnboardingStatus(tempUserId);

    return sendResponse(res, {
        statusCode: 200,
        message: "Onboarding status retrieved",
        data,
    });
});

// For Google OAuth check
export const checkGoogleUserExists = asyncHandler(async (req, res) => {
    try {
        const { googleToken, email  } = req.body;

        if (!googleToken && !email) {
            return res.status(400).json({
                success: false,
                message: 'Google token or email is required'
            });
        }
        let userEmail = email;

       if (googleToken) {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: googleToken,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                
                const payload = ticket.getPayload();
                userEmail = payload.email;
            } catch (tokenError) {
                console.error('Error verifying Google token:', tokenError);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Google token'
                });
            }
        }

        // Check if user exists
         const existingUser = await User.findOne({ 
            email: userEmail 
        });
         const userExists = !!(existingUser);

        return res.status(200).json({
            success: true,
            userExists: userExists,
            message: userExists  ? 'User already exists' : 'User does not exist',
            email: userEmail
        });

    } catch (error) {
        console.error('Error checking Google user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify Google token'
        });
    }
});
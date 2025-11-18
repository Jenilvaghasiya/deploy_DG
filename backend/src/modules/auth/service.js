import User from "../users/model.js";
import bcrypt from "bcrypt";
import { generateOtp, isOtpExpired } from "../../utils/otp.js";
import { sendOtpEmail, sendResetPasswordOtpEmail } from "../../utils/mail.js";
import { suspiciousLoginEmail } from "../../services/mailTemplates.js";
import { sendMail, sendUserMail } from "../../services/mailServices.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateToken } from "../../utils/token.js";
import AiTask from "../../modules/image_variation/model.js";
import { createSession, updateSessionLogoutTime } from "../sessions/service.js";
import UserCredits from '../credits/model.js'
import TenantCredits from "../credits/tenantCreditSchema.js"
import { getPasswordValidationMessage } from "../../utils/otherUtils.js";
import Role from '../roles/model.js'
import Tenant from '../tenants/model.js'
import { UserPreferences } from "../user_preference/model.js";
import OTP  from "../users/otpSchema.js"; // adjust path
import { OAuth2Client } from "google-auth-library";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registerUser = async (data) => {
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
        if (
            data.tenant_id &&
            existingUser.tenant_id?.toString() === data.tenant_id.toString()
        ) {
            throw new ApiError(409, "User already exists in this tenant");
        } else {
            throw new ApiError(
                403,
                "This email is already associated with another tenant",
            );
        }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    try {
        await sendOtpEmail(data.email, otp);
    } catch (err) {
        console.error("Failed to send OTP email:", err);
        throw new ApiError(500, "Failed to send verification email");
    }

    const user = await User.create({
        ...data,
        password_hash: hashedPassword,
        otp_code: otp,
        otp_expires_at: otpExpiry,
        last_otp_sent_at: new Date(),
    });

    return user;
};

export const loginUser = async (email, password, clientIp, otp = null) => {
    const user = await User.findOne({ email }).select("+password_hash");
    
    if (!user) {
        await User.updateOne({ email }, { $inc: { login_attempt: 1 } }).catch(() => {});
        throw new ApiError(401, "No user found with this email.");
    }
      if (user.is_active === false) {
        throw new ApiError(405, "Your account is inactive. Please contact the administrator.");
    }

    user.login_attempt = (user.login_attempt || 0) + 1;

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
        await user.save();
        throw new ApiError(401, "Incorrect password. Please try again.");
    }

    if (!user.is_verified) {
        const otp = generateOtp();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await user.updateOne({
            otp_code: otp,
            otp_expires_at: expiry,
            last_otp_sent_at: new Date(),
        });

        await sendOtpEmail(user.email, otp);
        await user.save();
        throw new ApiError(
            403,
            "Your account is not verified. A new OTP has been sent to your email."
        );
    }
    const userPreferences = await UserPreferences.findOne({ userId: user._id });

    if (userPreferences?.allow2FA && user.user_phone && user.phoneVerified) {
        if (!otp) {
        // Generate phone OTP
        const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        
        // Store OTP in database
        await OTP.create({
            userId: user._id,
            otp: phoneOtp,
            type: "TWO_FACTOR",
            expiresAt,
        });
        
        // TODO: Send SMS via Twilio when available
        console.log("=== 2FA Login OTP ===");
        console.log("Phone Number:", user.user_phone);
        console.log("OTP Code:", phoneOtp);
        console.log("User:", user.email);
        console.log("Expires at:", expiresAt);
        console.log("====================");
        
        throw new ApiError(
            406,
            "2FA verification required. OTP has been sent to your registered phone number.",
            { 
                requires2FA: true,
                phoneNumber: user.user_phone.slice(0, -4) + "****" // Masked phone number
            }
        );
        }else{
            const otpDoc = await OTP.findOne({
                userId: user._id,
                otp: otp,
                type: "TWO_FACTOR",
                expiresAt: { $gt: new Date() },
            });

            if (!otpDoc) {
                throw new ApiError(401, "Invalid or expired OTP.");
            }

            // Delete OTP after verification
            await OTP.deleteOne({ _id: otpDoc._id });
        }
    }

    // Update last login
    user.last_login = new Date();
    if (user?.login_ips.length > 0) {
        if (!user.login_ips.some((entry) => entry.ip === clientIp)) {
            // Send suspicious login email
            try {
                const { subject, html } = suspiciousLoginEmail(
                    user.full_name,
                    clientIp,
                );

                await sendUserMail({
                    userId: user._id,
                    to: user.email,
                    subject,
                    html,
                });
            } catch (error) {
                console.error("Failed to send suspicious login email:", error);
            }
        }
    }
        // Add the new IP to known IPs
        if (!user?.login_ips.some((entry) => entry.ip === clientIp)) {
            user.login_ips.push({
                ip: clientIp,
                // is_whitelisted: true,
            });
        }
    user.login_count = (user.login_count || 0) + 1;
    await user.save();

 if (process.env.NODE_ENV !== "development") {
    await AiTask.updateMany(
        { user_id: user._id },
        { $set: { in_session: false } },
    );
}

    const session = await createSession(user._id);

    // let credits = await UserCredits.findOne({ user_id: user._id });
    // if(!credits){
    //     credits = await UserCredits.create({
    //                     user_id: user._id,
    //                     tenant_id: user.tenant_id,
    //                 });
    // }

    const token = generateToken({
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        tenant_id: user.tenant_id,
        sessionId: session._id,
    },{ keepMeLoggedIn: userPreferences?.keepMeLoggedIn });

    return token;
};

export const sendVerificationOtp = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await user.updateOne({
        otp_code: otp,
        otp_expires_at: expiry,
        last_otp_sent_at: new Date(),
    });

    await sendOtpEmail(email, otp);
};

export const verifyUserOtp = async (email, otp) => {
    const user = await User.findOne({ email });
    if (!user || user.otp_code !== otp || isOtpExpired(user.otp_expires_at)) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    const tenant = await Tenant.findOne({ _id: user.tenant_id });

    if(!tenant){
        throw new ApiError(400, "Tenant not found");
    }
    
    if(tenant && tenant.is_active === false){

        const adminRole = await Role.findOne({ name: "admin+user" });
        if (!adminRole) throw new ApiError(500, "Role not found");

        user.role_id = adminRole._id;
        tenant.is_active = true;

        await tenant.save();
        await user.save();
    }


    await user.updateOne({
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
    });

};

export const sendResetOtp = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await user.updateOne({
        otp_code: otp,
        otp_expires_at: expiry,
        last_otp_sent_at: new Date(),
    });

    await sendResetPasswordOtpEmail(email, otp);
};

export const resetPasswordWithOtp = async (email, otp, newPassword) => {
    const validationMessage = getPasswordValidationMessage(newPassword);

    if (validationMessage) {
    throw new ApiError(422, validationMessage);
    }
    const user = await User.findOne({ email }).select("+password_hash");
    if (!user || user.otp_code !== otp || isOtpExpired(user.otp_expires_at)) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await user.updateOne({
        password_hash: hash,
        otp_code: null,
        otp_expires_at: null,
    });
};

export const logoutUser = async (sessionId) => {
    await updateSessionLogoutTime(sessionId);
};

export const getCredits = async (userId, tenantId) => {
    let userCredits = await UserCredits.findOne({ user_id: userId, tenant_id: tenantId });
    if (!userCredits) {
        // If user credits record doesn't exist, create a default one
        userCredits = await UserCredits.create({ user_id: userId, tenant_id: tenantId });
    }
    return userCredits;
};

export const getTenantCredits = async (tenantId) => {
    return await TenantCredits.findOne({ tenant_id: tenantId });
}

export const googleLogin = async (googleToken, clientIp) => {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Find user
    const user = await User.findOne({ email: payload.email });
    if (!user) throw new ApiError(401, "User not found. Please sign up first.");
    
    if (user.is_active === false) {
        throw new ApiError(405, "Your account is inactive. Please contact the administrator.");
    }
    const preferences = await UserPreferences.findOne({ userId: user._id });
    if (!preferences || !preferences.googleLoginEnabled)
      throw new ApiError(403, "Google login is not enabled for this account.");

    // Link Google ID if not set
    if (!user.google_Id) {
      user.google_Id = payload.sub;
      await user.save();
    }

    // Handle unverified accounts
    if (!user.is_verified) {
      const otp = generateOtp();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      await user.updateOne({
        otp_code: otp,
        otp_expires_at: expiry,
        last_otp_sent_at: new Date(),
      });

      await sendOtpEmail(user.email, otp);

      throw new ApiError(
        403,
        "Your account is not verified. A new OTP has been sent to your email."
      );
    }

    // Track login IPs
    if (!user.login_ips.some((entry) => entry.ip === clientIp)) {
      try {
        const { subject, html } = suspiciousLoginEmail(user.full_name, clientIp);
        await sendUserMail({ userId: user._id , to: user.email, subject, html });
      } catch (err) {
        console.error("Failed to send suspicious login email:", err);
      }
      user.login_ips.push({ ip: clientIp });
    }

    user.last_login = new Date();
    user.login_count = (user.login_count || 0) + 1;
    await user.save();

    const session = await createSession(user._id);

    const token = generateToken({
      id: user.id,
      email: payload.email,
      role_id: user.role_id,
      tenant_id: user.tenant_id,
      sessionId: session._id,
    });
    return token;
};
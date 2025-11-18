import Tenant from "../tenants/model.js";
import Role from "../roles/model.js";
import User from "../users/model.js";
import Permission from "../permissions/model.js";
import { ApiError } from "../../utils/ApiError.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { generateOtp, isOtpExpired } from "../../utils/otp.js";
import { sendOtpEmail, sendUserRegister } from "../../utils/mail.js";
import { getPasswordValidationMessage } from "../../utils/otherUtils.js";
import TempUser from "../users/tempUserSchema.js";
import mongoose from "mongoose";
import Plan from "../stripe/model.js";
import stripe from "../../config/stripe.js";
import TenantCredits from "../credits/tenantCreditSchema.js";
import { UserPreferences } from "../user_preference/model.js";

export const registerTenantAndAdmin = async (tenantPayload, userPayload, ipAddress) => {
    const validationMessage = getPasswordValidationMessage(userPayload.password);
 
     if (validationMessage) {
        throw new ApiError(422, validationMessage);
     }
 

    const existingUser = await User.findOne({ email: userPayload.email });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const ipConflictUser = await User.findOne({
        sign_up_ip: ipAddress
    });
 
    // if (ipConflictUser) {
    // throw new ApiError(403, "Registration not allowed from this IP address");
    // }
 
 

    if (!userPayload.full_name || userPayload.full_name.length < 3) {
        throw new ApiError(422, "Full Name is too short");
    }

    tenantPayload.name = tenantPayload.name.toLowerCase();
    let tenant = await Tenant.findOne({ name: tenantPayload.name });

    const password_hash = await bcrypt.hash(userPayload.password, 10);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    try {
        await sendOtpEmail(userPayload.email, otp);
        console.log("OTP sent successfully",otp);
    } catch (err) {
        console.error("Failed to send OTP email:", err);
        throw new ApiError(500, "Failed to send verification email");
    }

    if(!tenant){
        tenant = await Tenant.create({...tenantPayload,is_active: false});
    }

    const roleName = "user";
    let role = await Role.findOne({ name: roleName });
    // if (!role) {
    //     role = await Role.create({
    //         name: roleName,
    //         description: "Admin role with all permissions",
    //     });
    // }

    // const permissions = await Permission.find({
    //     is_active: true,
    //     is_deleted: false,
    // });
    // role.permissions = permissions.map((p) => p._id);
    // await role.save();

    const user = await User.create({
        ...userPayload,
        password_hash,
        tenant_id: tenant._id,
        role_id: role._id,
        otp_code: otp,
        otp_expires_at: otpExpiry,
        last_otp_sent_at: new Date(),
        sign_up_ip: ipAddress,
    }); 
    await UserPreferences.create({ userId: user._id });
    if(user){
            
        try {
            await sendUserRegister(user);

        } catch (err) {
            console.error("Failed to send OTP email:", err);        
        }   
            
        }
    

    return { tenant, role, user };
};

export const registerTenantAndAdminNew = async (tenantPayload, userPayload, ipAddress) => {
  const validationMessage = getPasswordValidationMessage(userPayload.password);
  if (validationMessage) {
    throw new ApiError(422, validationMessage);
  }

  // permanent user exists?
  const existingUser = await User.findOne({ email: userPayload.email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // existing temp by email?
  const existingTempUser = await TempUser.findOne({ email: userPayload.email });

  if (existingTempUser) {
    // If email is already verified -> user can continue to subscription step
    if (existingTempUser.is_verified) {
      return {
        resume: true,
        tempUser: {
          id: existingTempUser._id,
          email: existingTempUser.email,
          tenant: existingTempUser.tenant,
          is_verified: existingTempUser.is_verified,
          onboarding_stage: existingTempUser.onboarding_stage,
        },
        message: "Email already verified. Continue onboarding to select a plan.",
        next_stage: "subscription_selection",
        next_stage_url: `/onboarding/subscriptions?temp_id=${existingTempUser._id}`,
      };
    }

    // not verified yet -> resend OTP and allow resume of verification
    try {
      const otp = generateOtp();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      // update fields (keep latest submitted info)
      existingTempUser.full_name = userPayload.full_name || existingTempUser.full_name;
      existingTempUser.tenant = {
        ...existingTempUser.tenant,
        ...tenantPayload,
        name: tenantPayload.name ? tenantPayload.name.toLowerCase() : existingTempUser.tenant?.name,
      };

      // if user re-submitted a password, re-hash and update
      if (userPayload.password) {
        existingTempUser.password_hash = await bcrypt.hash(userPayload.password, 10);
      }

      existingTempUser.otp_code = otp;
      existingTempUser.otp_expires_at = otpExpiry;
      existingTempUser.last_otp_sent_at = new Date();
      existingTempUser.onboarding_stage = existingTempUser.onboarding_stage || "registered";

      await existingTempUser.save();

      await sendOtpEmail(existingTempUser.email, otp);

      return {
        resume: true,
        tempUser: {
          id: existingTempUser._id,
          email: existingTempUser.email,
          tenant: existingTempUser.tenant,
          is_verified: existingTempUser.is_verified,
          onboarding_stage: existingTempUser.onboarding_stage,
        },
        message: "Verification email resent. Please check your inbox.",
        next_stage: "verify_email",
        next_stage_url: `/verify-otp?email=${existingTempUser.email}`,
      };
    } catch (err) {
      console.error("Failed to resend OTP:", err);
      throw new ApiError(500, "Failed to send verification email");
    }
  }

  // Check permanent tenant (case-insensitive)
  const existingTenant = await Tenant.findOne({ name: tenantPayload.name.toLowerCase() });
  if (existingTenant) {
    throw new ApiError(409, "Tenant with this name already exists");
  }

  // Check temp tenant (someone else started tenant registration)
  const existingTempTenant = await TempUser.findOne({ "tenant.name": tenantPayload.name.toLowerCase() });
  if (existingTempTenant) {
    // If that temp tenant is verified -> go to subscription selection
    if (existingTempTenant.is_verified) {
      return {
        resume: true,
        tempUser: {
          id: existingTempTenant._id,
          email: existingTempTenant.email,
          tenant: existingTempTenant.tenant,
          is_verified: existingTempTenant.is_verified,
          onboarding_stage: existingTempTenant.onboarding_stage,
        },
        message: "Tenant registration already in progress and verified. Continue onboarding.",
        next_stage: "subscription_selection",
        next_stage_url: `/onboarding/subscriptions?temp_id=${existingTempTenant._id}`,
      };
    }

    // else tenant in-progress but not verified -> respond with verify step for that temp user
    return {
      resume: true,
      tempUser: {
        id: existingTempTenant._id,
        email: existingTempTenant.email,
        tenant: existingTempTenant.tenant,
        is_verified: existingTempTenant.is_verified,
        onboarding_stage: existingTempTenant.onboarding_stage,
      },
      message: "Tenant registration already in progress. Please verify the email used for that registration.",
      next_stage: "verify_email",
      next_stage_url: `/verify-otp?email=${existingTempTenant.email}`,
    };
  }

  // final validations
  if (!userPayload.full_name || userPayload.full_name.length < 3) {
    throw new ApiError(422, "Full Name is too short");
  }

  // create new temp user & send OTP
  const password_hash = await bcrypt.hash(userPayload.password, 10);
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await sendOtpEmail(userPayload.email, otp);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    throw new ApiError(500, "Failed to send verification email");
  }

  const tempUser = await TempUser.create({
    full_name: userPayload.full_name,
    email: userPayload.email,
    password_hash,
    tenant: {
      ...tenantPayload,
      name: tenantPayload.name.toLowerCase(),
    },
    otp_code: otp,
    otp_expires_at: otpExpiry,
    last_otp_sent_at: new Date(),
    sign_up_ip: ipAddress,
    onboarding_stage: "registered",
  });

  return {
    tempUser: {
      id: tempUser._id,
      email: tempUser.email,
      tenant: tempUser.tenant,
      is_verified: tempUser.is_verified,
      onboarding_stage: tempUser.onboarding_stage,
    },
    message: "Registration initiated. Please verify your email to continue.",
    next_stage: "verify_email",
    next_stage_url: `/verify-otp?email=${tempUser.email}`,
  };
};

export const registerTenantAndAdminWithGoogle = async (tenantPayload, googleUserData, ipAddress) => {
  const { email, full_name, google_Id } = googleUserData;

  // Check if permanent user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Check existing temp user by email
  const existingTempUser = await TempUser.findOne({ email });

  if (existingTempUser) {
    // If email is already verified -> user can continue to subscription step
    if (existingTempUser.is_verified) {
      return {
        resume: true,
        tempUser: {
          id: existingTempUser._id,
          email: existingTempUser.email,
          tenant: existingTempUser.tenant,
          is_verified: existingTempUser.is_verified,
          onboarding_stage: existingTempUser.onboarding_stage,
        },
        message: "Email already verified. Continue onboarding to select a plan.",
        next_stage: "subscription_selection",
        next_stage_url: `/onboarding/subscriptions?temp_id=${existingTempUser._id}`,
      };
    }

    // Update existing temp user with Google data and mark as verified
    existingTempUser.full_name = full_name || existingTempUser.full_name;
    existingTempUser.tenant = {
      ...existingTempUser.tenant,
      ...tenantPayload,
      name: tenantPayload.name ? tenantPayload.name.toLowerCase() : existingTempUser.tenant?.name,
    };
    existingTempUser.google_Id = google_Id;
    existingTempUser.auth_provider = 'google';
    existingTempUser.is_verified = true; // Google emails are pre-verified
    existingTempUser.onboarding_stage = 'verified';
    
    await existingTempUser.save();

    return {
      resume: true,
      tempUser: {
        id: existingTempUser._id,
        email: existingTempUser.email,
        tenant: existingTempUser.tenant,
        is_verified: existingTempUser.is_verified,
        onboarding_stage: existingTempUser.onboarding_stage,
      },
      message: "Google sign-up successful. Continue to select a plan.",
      next_stage: "subscription_selection",
      next_stage_url: `/onboarding/subscriptions?temp_id=${existingTempUser._id}`,
    };
  }

  // Check permanent tenant (case-insensitive)
  const existingTenant = await Tenant.findOne({ name: tenantPayload.name.toLowerCase() });
  if (existingTenant) {
    throw new ApiError(409, "Tenant with this name already exists");
  }

  // Check temp tenant (someone else started tenant registration)
  const existingTempTenant = await TempUser.findOne({ 
    "tenant.name": tenantPayload.name.toLowerCase() 
  });
  
  if (existingTempTenant) {
    // If that temp tenant is verified -> go to subscription selection
    if (existingTempTenant.is_verified) {
      return {
        resume: true,
        tempUser: {
          id: existingTempTenant._id,
          email: existingTempTenant.email,
          tenant: existingTempTenant.tenant,
          is_verified: existingTempTenant.is_verified,
          onboarding_stage: existingTempTenant.onboarding_stage,
        },
        message: "Tenant registration already in progress and verified. Continue onboarding.",
        next_stage: "subscription_selection",
        next_stage_url: `/onboarding/subscriptions?temp_id=${existingTempTenant._id}`,
      };
    }

    throw new ApiError(409, "This company name is already being registered by another user. Please choose a different name or contact support.");
  }

  // Validation
  if (!full_name || full_name.length < 3) {
    throw new ApiError(422, "Full Name is too short");
  }
  const randomPassword = crypto.randomBytes(8).toString("hex");
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  // Create new temp user with Google data (no password needed, email pre-verified)
  const tempUser = await TempUser.create({
    full_name,
    email,
    google_Id,
    auth_provider: 'google',
    password_hash: hashedPassword, // No password for Google users
    tenant: {
      ...tenantPayload,
      name: tenantPayload.name.toLowerCase(),
    },
    is_verified: true, // Google emails are pre-verified
    sign_up_ip: ipAddress,
    onboarding_stage: 'verified',
  });

  return {
    tempUser: {
      id: tempUser._id,
      email: tempUser.email,
      tenant: tempUser.tenant,
      is_verified: tempUser.is_verified,
      onboarding_stage: tempUser.onboarding_stage,
    },
    message: "Google sign-up successful. Continue to select a plan.",
    next_stage: "subscription_selection",
    next_stage_url: `/onboarding/subscriptions?temp_id=${tempUser._id}`,
  };
};

export const verifyTempUserOtp = async (email, otp) => {
    // First check temporary users
    const tempUser = await TempUser.findOne({ email });

    if(!tempUser){
        throw new ApiError(404, "User not found");
    }
    
    // Verify OTP for temporary user
    if (!tempUser.otp_code || tempUser.otp_code !== otp || isOtpExpired(tempUser.otp_expires_at)) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    // Mark temp user as verified
    await TempUser.findByIdAndUpdate(tempUser._id, {
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
        onboarding_stage: "verified",
    });

    return {
        verified: true,
        tempUserId: tempUser._id,
        requiresSubscription: true,
        message: "Email verified successfully. Please complete your subscription."
    };
};


export const sendTempUserVerificationOtp = async (email) => {
    const tempUser = await TempUser.findOne({ email });

    if(!tempUser){
        throw new ApiError(404, "User not found");
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await tempUser.updateOne({
        otp_code: otp,
        otp_expires_at: expiry,
        last_otp_sent_at: new Date(),
    });

    await sendOtpEmail(email, otp);
};

export const completeOnboarding = async (tempUserId, subscriptionData = null) => {
    const tempUser = await TempUser.findById(tempUserId);
    
    if (!tempUser) {
        throw new ApiError(404, "Temporary user not found");
    }

    if (tempUser.is_verified !== true) {
        throw new ApiError(400, "User email must be verified first");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create permanent tenant
        const tenantData = {
            name: tempUser.tenant.name,
            industry_type: tempUser.tenant.industry_type,
            subscription_frequency: tempUser.tenant.subscription_frequency,
            account_type: tempUser.tenant.account_type || 'company',
            is_active: true,
        };
        
        if (subscriptionData?.stripeCustomerId) {
            tenantData.stripeCustomerId = subscriptionData.stripeCustomerId;
        }
        
        const [tenant] = await Tenant.create([tenantData], { session });

        // Find admin role
        const role = await Role.findOne({ name: "admin+user" }).session(session);
        
        if (!role) {
            throw new ApiError(500, "Admin role not found");
        }

        // Create permanent user with Google fields if applicable
        const userData = {
            full_name: tempUser.full_name,
            email: tempUser.email,
            password_hash: tempUser.password_hash,
            role_id: role._id,
            tenant_id: tenant._id,
            is_verified: true,
            sign_up_ip: tempUser.sign_up_ip,
            auth_provider: tempUser.auth_provider || 'local',
        };

        // Add Google-specific fields if Google user
        if (tempUser.auth_provider === 'google') {
            userData.google_Id = tempUser.google_Id;
        }

        const [user] = await User.create([userData], { session });

        // // Create tenant credits
        // const credits = subscriptionData?.plan?.credits || 50;

        let initCredits = 0;

        if (subscriptionData?.isFreePlan) {
            initCredits = subscriptionData.plan.credits || 50;
        }

        await TenantCredits.create([{
            tenant_id: tenant._id,
            credits: initCredits,
            startCredits: initCredits
        }], { session });

        // Create default user preferences
        await UserPreferences.create([{
            userId: user._id,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // // Delete temp user
        await TempUser.findByIdAndDelete(tempUserId);

        // Send welcome email
        try {
            await sendUserRegister(user);
        } catch (err) {
            console.error("Failed to send welcome email:", err);
        }

        return {
            user: user,
            tenant: tenant,
            credits: initCredits,
            isFreePlan: subscriptionData?.isFreePlan || false,
            auth_provider: user.auth_provider
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};


export const createCheckoutSessionForOnboarding = async (tempUserId, planId) => {
    const tempUser = await TempUser.findById(tempUserId);
    
    if (!tempUser || !tempUser.is_verified === true) {
        throw new ApiError(400, "User must be verified before subscription");
    }

    const plan = await Plan.findById(planId);
    if (!plan) throw new ApiError(404, "Plan not found");

    // Create Stripe customer
    const customer = await stripe.customers.create({
        email: tempUser.email,
        name: tempUser.tenant.name,
        metadata: { 
            tempUserId: tempUser._id.toString(),
            tenantName: tempUser.tenant.name 
        },
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customer.id,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: `${process.env.CLIENT_BASE_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}&temp_id=${tempUser._id}`,
        cancel_url: `${process.env.CLIENT_BASE_URL}/subscriptions/cancel?session_id={CHECKOUT_SESSION_ID}&temp_id=${tempUser._id}`,
        locale: "auto",
        metadata: {
            tempUserId: tempUser._id.toString(),
            planId: planId.toString()
        }
    });

    // Update temp user with checkout session info
    await TempUser.findByIdAndUpdate(tempUserId, {
        stripe_checkout_session_id: session.id,
        selected_plan_id: planId,
        onboarding_stage: "subscription_selected"
    });

    return { 
        url: session.url,
        sessionId: session.id 
    };
};


export const completeWithFreePlan = async (tempUserId) => {
    const tempUser = await TempUser.findById(tempUserId);
    
    if (!tempUser) {
        throw new ApiError(404, "Temporary user not found");
    }
    
    if (!tempUser.is_verified) {
        throw new ApiError(400, "User email must be verified first");
    }
    
    // Complete onboarding with default free credits
    return await completeOnboarding(tempUserId, {
        plan: { 
            name: 'Free Plan', 
            credits: 50 // Default free credits
        },
        isFreePlan: true
    });
};

export const getOnboardingStatus = async (tempUserId) => {
    const tempUser = await TempUser.findById(tempUserId);
    
    if (!tempUser) {
        throw new ApiError(404, "Temporary user not found");
    }

    return {
        onboarding_stage: tempUser.onboarding_stage,
        is_verified: tempUser.is_verified,
        email: tempUser.email,
        tenant_name: tempUser.tenant?.name,
        created_at: tempUser.created_at
    };
};
import UserCredits from "../modules/credits/model.js";
import TenantCredits from "../modules/credits/tenantCreditSchema.js";
import { ApiError } from "./ApiError.js";
import Tenant from '../modules/tenants/model.js'
import { lowCreditEmail } from "../services/mailTemplates.js";
import { sendNotification } from "./notificationUtils.js";
import { sendMail } from "../services/mailServices.js";

/**
 * Check if tenant has enough credits
 */
export const checkEnoughCredits = async ({ tenantId, creditsToDeduct = 1 }) => {
  if (!tenantId) throw new Error("tenantId is required");

  const tenantCredit = await TenantCredits.findOne({ tenant_id: tenantId });
  if (!tenantCredit || tenantCredit.credits < creditsToDeduct) {
    throw new ApiError(403, "Not enough credits.");
  }

  return tenantCredit;
};

/**
 * Deduct credits from tenant pool & track user usage
 */
export const deductCredits = async ({ 
  tenantId, 
  userId, 
  creditsToDeduct = 1, 
  module = null,
  io = null
}) => {
  if (!tenantId) throw new Error("tenantId is required");
  if (!userId) throw new Error("userId is required");

  // 1. Deduct from tenant credits
  let tenantCredit = await TenantCredits.findOne({ tenant_id: tenantId });
  if (!tenantCredit) {
    throw new ApiError(404, "Credits record not found for tenant");
  }

  if (tenantCredit.credits < creditsToDeduct) { 
    throw new Error("Not enough credits available"); 
  }

  const previousCredits = tenantCredit.credits;
  tenantCredit.credits -= creditsToDeduct;
  await tenantCredit.save();

  // 2. Send low-credit email/notification if threshold crossed
  const threshold = Math.floor(tenantCredit.startCredits * 0.1);
  if (previousCredits > threshold && tenantCredit.credits <= threshold) {
    const tenant = await Tenant.findById(tenantId);
    if (tenant?.email) {
      console.log(`Sending low credit email to ${tenant.email}`);
      const { subject, html } = lowCreditEmail(tenantCredit.credits, tenant.name); // modify email template for tenant

      await sendMail({
        to: tenant.email,
        subject,
        html,
      });
    }

    // Send notification
    await sendNotification(io || global.io, {
      tenant_id: tenantId,
      type: "credit_warning",
      message: `Your tenant credits are low (${tenantCredit.credits} remaining). Please recharge.`,
    });
  }

  // 3. Update user consumption tracking
  const updateData = {
    $inc: {
      credits_used: creditsToDeduct,
      creditUsedSinceLastReview: creditsToDeduct
    }
  };

  if (module) {
    if (!updateData.$set) updateData.$set = {};
    if (!updateData.$setOnInsert) updateData.$setOnInsert = {};
    
    updateData.$inc[`creditsConsumedPerModule.${module}`] = creditsToDeduct;
    // updateData.$inc[`outputsPerModule.${module}`] = 1;
    
    // Set defaults if inserting new document
    updateData.$setOnInsert[`creditsConsumedPerModule.${module}`] = 0;
    // updateData.$setOnInsert[`outputsPerModule.${module}`] = 0;
  }

  // Update or create user credit consumption record
  const userCredit = await UserCredits.findOneAndUpdate(
    { user_id: userId, tenant_id: tenantId },
    updateData,
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true 
    }
  );

  return { tenantCredit, userCredit };
};

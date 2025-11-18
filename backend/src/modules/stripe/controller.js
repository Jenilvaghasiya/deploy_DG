
import { sendResponse } from "../../utils/responseHandler.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import Project from "../../modules/projects/model.js"
import PaymentHistory from "./paymentHistorySchema.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import UserCredits from "../credits/model.js";
import Plan from "./model.js";
import stripe from "../../config/stripe.js";
import Subscription from "./subscriptionSchema.js";
import User from "../users/model.js";
import Tenant from "../tenants/model.js";
import TenantCredits from "../credits/tenantCreditSchema.js";

/**
 * Get all plans
 */
export const getPlans = asyncHandler(async (req, res) => {
  try {
    const plans = await Plan.find({ is_deleted: false });
    sendResponse(res, {
      statusCode: 200,
      data: plans,
      message: "Plan fetched successfully",
    });
  } catch (err) {
    console.error("err:",err);
    throw new ApiError(500, "Failed to fetch plans");
  }
});

/**
 * Get plan by ID
 */
export const getPlanById = asyncHandler(async (req, res) => {
  try{
    const { id } = req.params;
    const plan = await Plan.findById(id);
  
    if (!plan || plan.is_deleted) throw new ApiError(404, "Plan not found");
  
    sendResponse(res, {
      statusCode: 200,
      data: plan,
      message: "Plan fetched successfully",
    });
  } catch (err) {
    console.error("err:", err);
    throw new ApiError(500, "Failed to fetch plan");
  }
});

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenant_id;

  const plan = await Plan.findById(planId);
  if (!plan || plan.is_deleted) throw new ApiError(404, "Plan not found");

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new ApiError(404, "Tenant not found");

  // Ensure user has a Stripe customer
  let customerId = tenant.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: tenant.name,
      metadata: { tenantId: tenant._id.toString(), mail: req.user.email },
    });
    customerId = customer.id;
    tenant.stripeCustomerId = customerId;
    await tenant.save();
  }

  // Check if user already has active or pending subscription
  const existingSub = await Subscription.findOne({
    tenant_id: tenantId,
    status: { $in: ["active", "trialing"] },
  });

  if (existingSub) {
    return sendResponse(res, {
      statusCode: 400,
      message: "Tenant already has an active subscription.",
    });
  }

  // Clean up stale pending subs
  await Subscription.deleteMany({ tenant_id: tenantId, status: "pending" });

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${process.env.CLIENT_BASE_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_BASE_URL}/subscriptions/cancel?session_id={CHECKOUT_SESSION_ID}`,
    locale: "auto",
  });

  // Save pending subscription with sessionId
  const dbSub = await Subscription.create({
    user_id: userId,
    tenant_id: tenantId,
    plan: planId,
    stripeCustomerId: customerId,
    status: "pending",
  });

  sendResponse(res, {
    statusCode: 200,
    data: { url: session.url },
    message: "Checkout session created",
  });
});

export const changePlan = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenant_id;

  const plan = await Plan.findById(planId);
  if (!plan || plan.is_deleted) throw new ApiError(404, "Plan not found");

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new ApiError(404, "Tenant not found");

  // Ensure Stripe customer exists
  let customerId = tenant.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: tenant.name,
      metadata: { tenantId: tenant._id.toString(), email: req.user.email },
    });
    customerId = customer.id;
    tenant.stripeCustomerId = customerId;
    await tenant.save();
  }

  // Get existing subscription
  const sub = tenant.subscriptionId
  ? await Subscription.findById(tenant.subscriptionId).populate("plan")
  : null;

  // No subscription yet → create new checkout session
  if (!sub) {
    await Subscription.deleteMany({ tenant_id: tenantId, status: "pending" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_BASE_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_BASE_URL}/subscriptions/cancel?session_id={CHECKOUT_SESSION_ID}`,
      locale: "auto",
    });

    const newSub = await Subscription.create({
      user_id: userId,
      tenant_id: tenantId,
      plan: planId,
      stripeCustomerId: customerId,
      status: "pending",
      checkoutSessionId: session.id,
    });

    tenant.subscriptionId = newSub._id;
    await tenant.save();

    return sendResponse(res, {
      statusCode: 200,
      data: { url: session.url },
      message: "Checkout session created",
    });
  }

  // Subscription exists → get Stripe subscription
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);

  if (["active", "trialing"].includes(stripeSub.status)) {
    // Active subscription → safe to swap plan
    const isDowngrade = sub && plan.price < sub.plan.price;

    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [
        {
          id: stripeSub.items.data[0].id,
          price: plan.stripePriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    sub.plan = planId;
    
    // Only add credits for upgrades, not downgrades
    if (!isDowngrade) {
      // Calculate credit difference for upgrades
      const creditDifference = plan.credits - (sub.plan?.credits || 0);
      
      if (creditDifference > 0) {
        await TenantCredits.findOneAndUpdate(
          { tenant_id: tenantId },
          { $inc: { credits: creditDifference } }, // Add only the difference
          { upsert: true, new: true }
        );
      }
    }
    
    sub.status = updated.status;
    sub.current_period_start = new Date(updated.current_period_start * 1000);
    sub.current_period_end = new Date(updated.current_period_end * 1000);
    await sub.save();

    return sendResponse(res, { statusCode: 200, message: "Plan changed successfully" });
  }

  // Failed / incomplete subscription → expire old checkout session if exists
  if (sub.checkoutSessionId) {
    try {
      await stripe.checkout.sessions.expire(sub.checkoutSessionId);
    } catch (err) {
      console.warn("Failed to expire old checkout session:", err.message);
    }
  }

  // Create new checkout session for retry
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${process.env.CLIENT_BASE_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_BASE_URL}/subscriptions/cancel?session_id={CHECKOUT_SESSION_ID}`,
    locale: "auto",
  });

  sub.status = "pending";
  sub.plan = planId;
  sub.checkoutSessionId = session.id;
  await sub.save();

  return sendResponse(res, {
    statusCode: 200,
    data: { url: session.url },
    message: "Checkout session created for retry / plan change",
  });
});



export const cancelPlan = asyncHandler(async (req, res) => {
  console.log("canacel plan>>>>>>")
  const tenantId = req.user.tenant_id;
  const tenant = await Tenant.findById(tenantId);

  if (!tenant.subscriptionId) {
    return sendResponse(res, {
      statusCode: 200,
      message: "Already on free plan",
    });
  }

  const subscription = await Subscription.findById(tenant.subscriptionId);
  if (!subscription) throw new ApiError(404, "Subscription not found");

  // Cancel at period end in Stripe
  const canceledSub = await stripe.subscriptions.update(
    subscription.stripeSubscriptionId,
    { cancel_at_period_end: true }
  );

  // Update DB
  subscription.status = canceledSub.status;
  subscription.current_period_end = new Date(
    canceledSub.current_period_end * 1000
  );
  await subscription.save();

  sendResponse(res, {
    statusCode: 200,
    data: subscription,
    message: "Subscription cancellation scheduled at period end",
  });
});

export const checkSession =  asyncHandler(async(req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: "session_id is required" });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({ valid: false, message: "Session not found" });
    }

    // Optionally, you can also check payment status
    const isPaid = session.payment_status === "paid";

    sendResponse(res, { 
      statusCode : 200,
      status : "success",
      data : {
      valid: true,
      session_id: session.id,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      isPaid,}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, error: err.message });
  }
});

export const getCurrentSubscription = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant_id;
  
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new ApiError(404, "Tenant not found");

  let subscriptionData = null;
  let planData = null;

  if (tenant.subscriptionId) {
    // Return subscription if active or past_due
    const subscription = await Subscription.findOne({ 
      _id: tenant.subscriptionId, 
      status: { $in: ["active", "trialing"] } 
    }).populate("plan");

    if (subscription) {
      subscriptionData = subscription;
      planData = subscription.plan;
    }
  }

  // Get tenant credits
  const credits = await TenantCredits.findOne({ tenant_id: tenantId });

  sendResponse(res, {
    statusCode: 200,
    data: {
      subscription: subscriptionData,
      plan: planData,
      credits: credits?.credits || 0,
      tenant: {
        name: tenant.name,
        stripeCustomerId: tenant.stripeCustomerId,
        subscription_auto_renew: tenant.subscription_auto_renew,
      }
    }
  });
});


export const getPaymentHistory = asyncHandler(async (req, res) => {
  try {
    const {
      status,
      stripeInvoiceId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    // Build query object
    const query = {};
    const tenant_id = req.user?.tenant_id;
    if (tenant_id) query.tenant_id = tenant_id;
    if (status) query.status = status;
    if (stripeInvoiceId) query.stripeInvoiceId = stripeInvoiceId;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with population
    const paymentHistory = await PaymentHistory
      .find(query)
      .populate('subscription_id', 'plan_name status') // adjust fields as needed
      .populate('tenant_id', 'name email') // adjust fields as needed
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
        const formattedPayments = await Promise.all(
      paymentHistory.map(async (p) => {
        let hosted_invoice_url = null;

        if (p.stripeInvoiceId) {
          try {
            const invoice = await stripe.invoices.retrieve(p.stripeInvoiceId);
            hosted_invoice_url = invoice.hosted_invoice_url || null;
          } catch (err) {
            console.error(`Failed to fetch Stripe invoice ${p.stripeInvoiceId}:`, err);
          }
        }

        return {
          ...p,
          amount_paid: p.amount_paid ? (p.amount_paid / 100).toFixed(2) : "0.00",
          hosted_invoice_url,
        };
      })
    );
    // Get total count for pagination
    const totalCount = await PaymentHistory.countDocuments(query);

    sendResponse(res, {
      data: formattedPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});


export const toggleAutoRenew = asyncHandler(async (req, res) => {
  const tenant_Id = req.user.tenant_Id;
  const { subscriptionId, enable } = req.body;

  try {
    // Fetch subscription
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      tenant_Id: tenant_Id,
    });

    if (!subscription) {
      return sendResponse(res, {
        statusCode: 404,
        status: "error",
        message: "Subscription not found",
      });
    }

    // Update subscription auto-renew
    subscription.autoRenew = enable;
    await subscription.save();

    // Update Stripe subscription
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: !enable, // true if user disabled auto-renew
    });

    // Update tenant table subscription_auto_renew
    await Tenant.findByIdAndUpdate(subscription.tenant_id, {
      subscription_auto_renew: enable,
    });

    return sendResponse(res, {
      message: `Your Auto-Renewal is successfully ${enable ? "enabled" : "disabled"}`,
      data: { autoRenew: enable },
    });
  } catch (err) {
    console.error("Failed to toggle auto-renew:", err);
    return sendResponse(res, {
      statusCode: 500,
      status: "error",
      message: "Failed to toggle auto-renew",
    });
  }
});


export const retryPayment = asyncHandler(async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const dbSub = await Subscription.findById(subscriptionId);
    if (!dbSub) return res.status(404).json({ message: "Subscription not found" });

    // Create Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: dbSub.stripeCustomerId, // Stripe customer ID
      return_url: `${process.env.CLIENT_BASE_URL}/subscription`, // Redirect back after payment update
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create billing portal session", error: err.message });
  }
});
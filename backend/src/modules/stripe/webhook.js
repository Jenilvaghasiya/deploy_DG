import stripe from "../../config/stripe.js";
import Subscription from "./subscriptionSchema.js";
import PaymentHistory from "./paymentHistorySchema.js";
import Plan from "./model.js";
import User from "../users/model.js";
import Tenant from "../tenants/model.js";
import TenantCredits from "../credits/tenantCreditSchema.js";
import * as onboardingService from "../onboarding/service.js";
import mongoose from "mongoose";
import { notifyPaymentFailed, notifyPaymentSuccess } from "../../utils/notificationUtils.js";

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Processing checkout.session.completed");
        const session = event.data.object;
        
        // Handle onboarding flow
        if (session.metadata?.tempUserId) {
          const tempUserId = session.metadata.tempUserId;
          const planId = session.metadata.planId;
          
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
          const plan = await Plan.findById(planId);
          
          // Complete onboarding first (this creates the tenant)
          const result = await onboardingService.completeOnboarding(tempUserId, {
            stripeCustomerId: stripeSubscription.customer,
            plan: plan,
          });
          
          const tenant = await Tenant.findById(result.tenant._id);
          const autoRenew = tenant.subscription_auto_renew ?? true;
          
          if (!autoRenew && !stripeSubscription.cancel_at_period_end) {
            await stripe.subscriptions.update(stripeSubscription.id, {
              cancel_at_period_end: true,
            });
          }
          
          // Create the subscription with the tenant_id
          const dbSubscription = await Subscription.create({
            stripeSubscriptionId: stripeSubscription.id,
            stripeCustomerId: stripeSubscription.customer,
            plan: planId,
            status: stripeSubscription.status,
            current_period_start: new Date(stripeSubscription.current_period_start * 1000),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000),
            tenant_id: result.tenant._id,
            user_id: result.user._id,
            credits_granted: false // Track if credits were granted
          });
          
          // Attach subscription to tenant
          await Tenant.findByIdAndUpdate(
            result.tenant._id,
            { 
              subscriptionId: dbSubscription._id,
              stripeCustomerId: stripeSubscription.customer
            }
          );
          
          // Credits will be granted in invoice.paid event
          console.log(`Subscription ${stripeSubscription.id} created with status ${stripeSubscription.status}`);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        console.log("Processing customer.subscription.created/updated");
        const subscription = event.data.object;
        
        // Find subscription
        let dbSub = await Subscription.findOne({
          $or: [
            { stripeSubscriptionId: subscription.id },
            { stripeCustomerId: subscription.customer, status: "pending" }
          ]
        });

        if (dbSub) {
          const previousStatus = dbSub.status;
          
          // Update subscription details
          dbSub.stripeSubscriptionId = subscription.id;
          dbSub.status = subscription.status;
          dbSub.current_period_start = new Date(subscription.current_period_start * 1000);
          dbSub.current_period_end = new Date(subscription.current_period_end * 1000);
          
          // Handle cancellation
          if (subscription.cancel_at_period_end) {
            dbSub.cancel_at_period_end = true;
            dbSub.cancel_at = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null;
          } else {
            dbSub.cancel_at_period_end = false;
            dbSub.cancel_at = null;
          }
          
          await dbSub.save();

          // Update tenant with subscription ID if not already set
          const tenant = await Tenant.findById(dbSub.tenant_id);
          if (tenant && !tenant.subscriptionId) {
            tenant.subscriptionId = dbSub._id;
            await tenant.save();
          }

          // Handle trial to active transition
          if (previousStatus === "trialing" && subscription.status === "active" && !dbSub.credits_granted) {
            const plan = await Plan.findById(dbSub.plan);
            if (plan) {
              await grantCredits(dbSub.tenant_id, plan.credits, "trial_converted");
              dbSub.credits_granted = true;
              await dbSub.save();
            }
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const session = await mongoose.startSession();

        try {
          await session.withTransaction(async () => {
            // Log for debugging
            console.log("Looking for subscription:", {
              stripeSubscriptionId: invoice.subscription,
              stripeCustomerId: invoice.customer
            });

            // Find subscription - first try by subscription ID
            let dbSub = await Subscription.findOne(
              { stripeSubscriptionId: invoice.subscription },
              null,
              { session }
            );

            // If not found, try by customer ID (without status restriction)
            if (!dbSub && invoice.customer) {
              dbSub = await Subscription.findOne(
                { stripeCustomerId: invoice.customer },
                null,
                { session }
              ).sort({ createdAt: -1 });

              // If found without stripeSubscriptionId, update it
              if (dbSub && !dbSub.stripeSubscriptionId && invoice.subscription) {
                console.log("Updating subscription with missing stripeSubscriptionId");
                dbSub.stripeSubscriptionId = invoice.subscription;
                await dbSub.save({ session });
              }
            }

            // If still not found, check if this is a new subscription that needs to be created
            if (!dbSub && invoice.subscription) {
              console.log("Subscription not found, fetching from Stripe and creating/updating");
              
              // Fetch subscription details from Stripe
              const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
              
              // Try to find tenant by customer ID OR by user email from Stripe customer
              let tenant = await Tenant.findOne({ 
                stripeCustomerId: invoice.customer 
              }, null, { session });

              // If no tenant found, try to find by email
              if (!tenant) {
                console.log("No tenant found by customer ID, trying to find by email");
                
                // Get customer from Stripe
                const stripeCustomer = await stripe.customers.retrieve(invoice.customer);
                
                if (stripeCustomer.email) {
                  // Find user by email
                  const user = await User.findOne({ email: stripeCustomer.email }, null, { session });
                  
                  if (user && user.tenant_id) {
                    tenant = await Tenant.findById(user.tenant_id, null, { session });
                    
                    // Update tenant with Stripe customer ID
                    if (tenant && !tenant.stripeCustomerId) {
                      tenant.stripeCustomerId = invoice.customer;
                      await tenant.save({ session });
                    }
                  }
                }
              }

              if (tenant) {
                // Check if tenant has a subscription reference
                if (tenant.subscriptionId) {
                  dbSub = await Subscription.findById(tenant.subscriptionId, null, { session });
                  
                  // Update the subscription with Stripe IDs if missing
                  if (dbSub && !dbSub.stripeSubscriptionId) {
                    dbSub.stripeSubscriptionId = invoice.subscription;
                    dbSub.stripeCustomerId = invoice.customer;
                    await dbSub.save({ session });
                  }
                }
                
                // If still no subscription, create one
                if (!dbSub) {
                  console.log("Creating new subscription from invoice.paid webhook");
                  
                  // Get plan from Stripe subscription
                  const stripePriceId = stripeSubscription.items.data[0]?.price.id;
                  const plan = await Plan.findOne({ stripePriceId: stripePriceId });
                  
                  if (!plan) {
                    console.error("Plan not found for price:", stripePriceId);
                    return;
                  }

                  // Get user from tenant
                  const user = await User.findOne({ tenant_id: tenant._id }, null, { session });

                  // Create the subscription
                  dbSub = await Subscription.create([{
                    stripeSubscriptionId: invoice.subscription,
                    stripeCustomerId: invoice.customer,
                    plan: plan._id,
                    status: stripeSubscription.status,
                    current_period_start: new Date(stripeSubscription.current_period_start * 1000),
                    current_period_end: new Date(stripeSubscription.current_period_end * 1000),
                    tenant_id: tenant._id,
                    user_id: user?._id,
                    credits_granted: false
                  }], { session });

                  dbSub = dbSub[0]; // Create returns an array when using session

                  // Update tenant with subscription ID
                  tenant.subscriptionId = dbSub._id;
                  await tenant.save({ session });
                }
              } else {
                console.error("No tenant found for customer:", invoice.customer);
                return;
              }
            }

            if (!dbSub) {
              console.warn("Still no subscription found after all attempts for invoice:", {
                invoiceId: invoice.id,
                subscriptionId: invoice.subscription,
                customerId: invoice.customer
              });
              return;
            }

            // Update subscription status
            const previousStatus = dbSub.status;
            
            // Always update to active on successful payment
            if (dbSub.status !== "active" && dbSub.status !== "trialing") {
              dbSub.status = "active";
              await dbSub.save({ session });
            }

            // Check payment history to determine if credits should be granted
            const successfulPayments = await PaymentHistory.countDocuments({
              subscription_id: dbSub._id,
              status: "paid"
            });

            const failedPayments = await PaymentHistory.countDocuments({
              subscription_id: dbSub._id,
              status: "failed",
              stripeInvoiceId: invoice.id // Same invoice that now succeeded
            });

            // Check if this is a retry after failure
            const isRetryAfterFailure = failedPayments > 0;
            const isFirstSuccessfulPayment = successfulPayments === 0;

            // Record payment history
            await PaymentHistory.create(
              [{
                subscription_id: dbSub._id,
                tenant_id: dbSub.tenant_id,
                stripeInvoiceId: invoice.id,
                stripePaymentId: invoice.payment_intent || "",
                status: "paid",
                amount_paid: invoice.amount_paid,
                currency: invoice.currency,
                paidAt: new Date(),
                invoice_pdf: invoice.invoice_pdf,
                hosted_invoice_url: invoice.hosted_invoice_url,
                is_retry: isRetryAfterFailure
              }],
              { session }
            );

            // Grant credits based on payment type
            const plan = await Plan.findById(dbSub.plan).session(session);
            if (plan) {
              let shouldGrantCredits = false;
              let creditReason = "";

              // Determine if we should grant credits
              if (isFirstSuccessfulPayment && !dbSub.credits_granted) {
                // First ever successful payment
                shouldGrantCredits = true;
                creditReason = "new_subscription";
              } else if (isRetryAfterFailure && previousStatus === "past_due") {
                // Payment retry after failure - check if credits were already granted for this period
                const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
                const creditsGrantedThisPeriod = await TenantCredits.findOne({
                  tenant_id: dbSub.tenant_id,
                  'creditHistory': {
                    $elemMatch: {
                      date: { $gte: currentPeriodStart },
                      reason: { $in: ['new_subscription', 'renewal', 'retry_after_failure'] }
                    }
                  }
                });

                if (!creditsGrantedThisPeriod) {
                  shouldGrantCredits = true;
                  creditReason = "retry_after_failure";
                }
              } else if (!isFirstSuccessfulPayment && invoice.billing_reason === 'subscription_cycle') {
                // Regular renewal
                shouldGrantCredits = true;
                creditReason = "renewal";
              } else if (invoice.billing_reason === 'subscription_update' && invoice.amount_paid > 0) {
                // Plan upgrade - check if we need to grant additional credits
                const previousPlan = await getPreviousPlanFromInvoice(invoice);
                if (previousPlan && plan.credits > previousPlan.credits) {
                  const creditDifference = plan.credits - previousPlan.credits;
                  await grantCredits(dbSub.tenant_id, creditDifference, "upgrade", session);
                }
              }

              // Grant credits if needed
              if (shouldGrantCredits) {
                await grantCredits(dbSub.tenant_id, plan.credits, creditReason, session);
                
                // Update credits_granted flag
                if (creditReason === "new_subscription" || creditReason === "retry_after_failure") {
                  dbSub.credits_granted = true;
                  await dbSub.save({ session });
                }
              }

              console.log(`Payment processed - Credits granted: ${shouldGrantCredits}, Reason: ${creditReason}`);
            }

            // Notify success
            if (global.io) {
              await notifyPaymentSuccess(global.io, dbSub, invoice);
            }
          });
        } catch (err) {
          console.error("Transaction failed for invoice.paid:", err);
          throw err; // Re-throw to ensure Stripe retries the webhook
        } finally {
          session.endSession();
        }
        break;
      }

     case "invoice.payment_failed": {
      const invoice = event.data.object;
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          let dbSub = await Subscription.findOne(
            { stripeSubscriptionId: invoice.subscription },
            null,
            { session }
          );

          // Remove the status restriction when searching by customer ID
          if (!dbSub && invoice.customer) {
            dbSub = await Subscription.findOne(
              { stripeCustomerId: invoice.customer },
              null,
              { session }
            ).sort({ createdAt: -1 });
          }

          if (!dbSub) {
            console.warn("No subscription found for failed invoice:", invoice.id);
            return;
          }

          // Update subscription status to past_due
          const previousStatus = dbSub.status;
          if (dbSub.status === "active" || dbSub.status === "trialing") {
            dbSub.status = "past_due";
            await dbSub.save({ session });
          }

          // Record payment history (important for tracking retries)
          await PaymentHistory.create(
            [{
              subscription_id: dbSub._id,
              tenant_id: dbSub.tenant_id,
              stripeInvoiceId: invoice.id,
              stripePaymentId: invoice.payment_intent || "",
              status: "failed",
              amount_paid: 0,
              amount_due: invoice.amount_due,
              currency: invoice.currency,
              failedAt: new Date(),
              failure_reason: invoice.last_payment_error?.message || "Payment failed",
            }],
            { session }
          );

          // Notify user
          if (global.io) {
            await notifyPaymentFailed(global.io, dbSub, invoice, {
              firstTime: previousStatus === "pending" || previousStatus === "trialing",
            });
          }
        });
      } catch (err) {
        console.error("Transaction failed for invoice.payment_failed:", err);
      } finally {
        session.endSession();
      }
      break;
    }

      case "customer.subscription.deleted": {
        console.log("Processing customer.subscription.deleted");
        const subscription = event.data.object;
        const canceledSub = await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          { 
            status: "canceled",
            canceled_at: new Date()
          }
        );
        
        if (canceledSub) {
          // Remove subscription from tenant but keep history
          await Tenant.findByIdAndUpdate(
            canceledSub.tenant_id,
            { $unset: { subscriptionId: 1 } }
          );
          
          // Optional: Set credits to 0 or free tier amount
          const freeTierCredits = 0; // Or set a default free tier amount
          await TenantCredits.findOneAndUpdate(
            { tenant_id: canceledSub.tenant_id },
            { $set: { credits: freeTierCredits } }
          );
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        console.log("Processing trial_will_end");
        // Send reminder notification 3 days before trial ends
        const subscription = event.data.object;
        const dbSub = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
        
        if (dbSub && global.io) {
          // Notify user about trial ending soon
          // await notifyTrialEnding(global.io, dbSub, subscription);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(200).json({ received: true, error: error.message });
  }
};

// Helper function to grant credits
async function grantCredits(tenantId, credits, reason, session = null) {
  try {
    const options = session ? { session } : {};
    
    const existingCredits = await TenantCredits.findOne(
      { tenant_id: tenantId },
      null,
      options
    );
    
    const newCredits = existingCredits ? existingCredits.credits + credits : credits;
    
    const updatedCredits = await TenantCredits.findOneAndUpdate(
      { tenant_id: tenantId },
      { 
        $set: { 
          credits: newCredits,
          lastUpdated: new Date(),
          lastUpdateReason: reason
        },
        $push: {
          creditHistory: {
            credits_added: credits,
            reason: reason,
            date: new Date(),
            balance_after: newCredits
          }
        }
      },
      { upsert: true, new: true, ...options }
    );
    
    console.log(`Granted ${credits} credits to tenant ${tenantId}. New balance: ${newCredits}. Reason: ${reason}`);
    return updatedCredits;
  } catch (error) {
    console.error("Error granting credits:", error);
    throw error;
  }
}

// Helper function to get previous plan from invoice
async function getPreviousPlanFromInvoice(invoice) {
  try {
    // Look for the previous plan in invoice line items
    if (invoice.lines && invoice.lines.data) {
      for (const line of invoice.lines.data) {
        if (line.proration && line.price) {
          const plan = await Plan.findOne({ stripePriceId: line.price.id });
          if (plan) return plan;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting previous plan:", error);
    return null;
  }
}
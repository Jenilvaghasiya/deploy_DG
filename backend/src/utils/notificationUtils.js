import Notification from "../modules/notifications/model.js";
import User from "../modules/users/model.js";
import { sendMail } from "../services/mailServices.js";
import Tenant from "../modules/tenants/model.js";
import Plan from "../modules/stripe/model.js";

export const sendNotification = async (io, {
    user_id,
    //   tenant_id,
    message,
    type,
    meta = null
}) => {
    try {
        const notification = await Notification.create({
            type,
            user_id,
            tenant_id: null,
            message,
            isRead: false,
             meta 

        });

        if (io) {
            io.to(user_id?.toString()).emit(
                "notifications",
                JSON.stringify(notification.toObject())
            );
        }

        return notification;
    } catch (error) {
        console.error("🔴 Notification error:", error);
        return null;
    }
};

export const sendAnnouncementNotification = async (io, {
    message
}) => {
    try {
        const notification = await Notification.create({
            type: "announcement",
            user_id: null,
            tenant_id: null,
            message,
            isRead: true
        });

        if (io) {
            // Broadcast to all connected clients
            io.emit("notifications", JSON.stringify(notification.toObject()));
        }

        return notification;
    } catch (error) {
        console.error("🔴 Announcement Notification error:", error);
        return null;
    }
};

export const sendPlatformNotification = async (io, {
    message,
    type = "announcement",
    endDate = null
}) => {
  try {
    const notification = await Notification.create({
      type,
      user_id: null,
      tenant_id: null,
      message,
      isRead: true, // default read
      endDate,
    });

    if (io) {
    // Broadcast to all connected users
      io.emit("notifications", JSON.stringify(notification.toObject()));
    }

    return notification;
  } catch (error) {
    console.error("🔴 Announcement Notification error:", error);
    return null;
  }
};

export const sendNotificationToTenantUsers = async (io, { tenant_id, message, type }) => {
    try {
        // Get all users under the tenant
        const users = await User.find({ tenant_id }, { _id: 1 });

        // Collect notification documents to create
        const notifications = await Promise.all(
            users.map(user =>
                Notification.create({
                    type,
                    tenant_id,
                    user_id: user._id,
                    message,
                    isRead: false,
                })
            )
        );

        // Send notification to each user
        if (io) {
            users.forEach((user, index) => {
                io.to(user._id.toString()).emit(
                    "notifications",
                    JSON.stringify(notifications[index].toObject())
                );
            });
        }

        return notifications;
    } catch (error) {
        console.error("🔴 sendNotificationToTenantUsers error:", error);
        return [];
    }
};

export const sendBroadcastNotification = async (io, { user_id, tenant_id, message, type }) => {
    try {
        // Get all users under the tenant except tenant (sender)
        const users = await User.find({ tenant_id, _id: { $ne: user_id } }, { _id: 1 });

        // Collect notification documents to create
        const notifications = await Promise.all(
            users.map(user =>
                Notification.create({
                    type,
                    tenant_id,
                    user_id: user._id,
                    message,
                    isRead: false,
                })
            )
        );

        if (!users.length) return [];
        
        // Send notification to each user
        if (io) {
            users.forEach((user, index) => {
                io.to(user._id.toString()).emit(
                    "notifications",
                    JSON.stringify(notifications[index].toObject())
                );
            });
        }

        return notifications;
    } catch (error) {
        console.error("🔴 Send Broadcast Notification To TenantUsers Error:", error);
        return [];
    }
};

export const sendSubscriptionRenewalReminder = async (subscription, user) => {
  const start = subscription.current_period_start * 1000; // Stripe timestamp to ms
  const end = subscription.current_period_end * 1000;

  const totalPeriod = end - start;
  const reminderTime = start + totalPeriod * 0.9;
  const now = Date.now();

  // Only send if we're past the 90% mark but before expiration
  if (now >= reminderTime && now < end) {
    const nextRenewal = dayjs(end).format("MMMM D, YYYY");

    const subject = "Your subscription is about to renew";
    const html = `
      <p>Hi ${user.name || "User"},</p>
      <p>You have reached 90% of your current subscription period.</p>
      <p>Your subscription will renew on <b>${nextRenewal}</b>.</p>
      `;
    //   <p><a href="https://yourapp.com/subscription">Manage your subscription</a></p>

    await sendMail({ to: user.email, subject, html });
    return true; // reminder sent
  }

  return false; // not yet 90%
};

export const notifyPaymentFailed = async (io, subscription, invoice, { firstTime = false } = {}) => {
  const user = await User.findById(subscription.user_id);
  if (!user || !user.email) return;

  const subject = firstTime
    ? "Payment Failed - Please Complete Your First Subscription"
    : "Payment Failed - Upgrade/Renewal Issue";

  const html = firstTime
    ? `<p>Hi ${user.full_name || "User"},</p>
       <p>Your first subscription payment failed. Please update your payment method to activate your plan.</p>`
    : `<p>Hi ${user.full_name || "User"},</p>
       <p>Your subscription upgrade/renewal payment failed. Please update your payment method to continue enjoying your plan.</p>`;

  await sendMail({ to: user.email, subject, html });

  await sendNotification(io, {
    user_id: user._id,
    message: firstTime
      ? "First subscription payment failed. Please complete your payment."
      : "Subscription upgrade/renewal payment failed. Update your payment method.",
    type: "payment_failure",
    meta: { subscriptionId: subscription._id, invoiceId: invoice.id },
  });
};

export const formatCurrency = (amount, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(amount / 100); // if amount is in cents
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${currency} ${amount}`;
  }
};


export const notifyPaymentSuccess = async (io, subscription, invoice) => {
  try {
    const users = await User.find({ tenant_id: subscription.tenant_id });
    const plan = await Plan.findById(subscription.plan);

    const formattedAmount = formatCurrency(invoice.amount_paid, invoice.currency);

    // Prepare notification and email content
    const notificationData = {
      type: "payment_success",
      title: "Payment Successful",
      message: `Your payment of ${formattedAmount} for ${plan?.name || 'subscription'} has been processed successfully.`,
      data: {
        subscriptionId: subscription._id,
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        planName: plan?.name,
        invoiceUrl: invoice.hosted_invoice_url,
        paidAt: new Date(),
      },
      timestamp: new Date(),
    };

    // Send real-time notifications via Socket.IO
    if (io) {
      users.forEach(user => {
        io.to(`user_${user._id}`).emit("notification", notificationData);
      });
      io.to(`tenant_${subscription.tenant_id}`).emit("payment_success", notificationData);
    }

    // Send email notifications using sendMail like notifyPaymentFailed
    const emailPromises = users.map(async user => {
      if (!user?.email) return;

      const subject = "Payment Successful - Subscription Activated";
      const html = `<p>Hi ${user.full_name || "User"},</p>
        <p>Your payment of <strong>${formattedAmount}</strong> for the ${plan?.name || 'subscription'} plan has been successfully processed.</p>
        <p>You can view your invoice <a href="${invoice.hosted_invoice_url}" target="_blank">here</a>.</p>
        <p>Thank you for your continued support!</p>`;

      await sendMail({ to: user.email, subject, html });
    });

    await Promise.all(emailPromises);

    console.log(`Payment success notification sent for subscription ${subscription._id}`);
    return true;
  } catch (error) {
    console.error("Error sending payment success notification:", error);
    return false;
  }
};

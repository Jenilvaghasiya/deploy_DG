// Manadetory Emails

import nodemailer from "nodemailer";
import { config } from "../config/config.js";

// Create reusable transporter (SMTP or third-party)
const transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
        user: config.mail.user,
        pass: config.mail.pass,
    },
});

/**
 * Send OTP Email
 */
export const sendOtpEmail = async (email, otp) => {
    const info = await transporter.sendMail({
        from: `"Design Genie" <${config.mail.user}>`,
        to: email,
        subject: "Your One-Time Password (OTP)",
        html: `
      <div style="font-family: sans-serif; padding: 10px;">
        <h2>🔐 Email Verification </h2>
        <p>Your OTP is:</p>
        <h1 style="background: #f0f0f0; display: inline-block; padding: 10px 20px; border-radius: 6px;">
          ${otp}
        </h1>
        <p>This code will expire in 10 minutes.</p>
        <p>Thanks,<br/>Design Genie Team</p>
      </div>
    `,
    });

    console.log(`OTP email sent to ${email}: ${info.messageId}`);
};

/**
 * Send Reset Password OTP Email
 */
export const sendResetPasswordOtpEmail = async (email, otp) => {
    const info = await transporter.sendMail({
        from: `"Design Genie" <${config.mail.user}>`,
        to: email,
        subject: "Your One-Time Password (OTP) for Reset Password",
        html: `
      <div style="font-family: sans-serif; padding: 10px;">
        <h2>Password Reset OTP</h2>
        <p>Your OTP is:</p>
        <h1 style="background: #f0f0f0; display: inline-block; padding: 10px 20px; border-radius: 6px;">
          ${otp}
        </h1>
        <p>>Please enter this code and new password on the password reset page.</p>
        <p>This code will expire in 10 minutes.</p>
        <p>Thanks,<br/>Design Genie Team</p>
      </div>
    `,
    });

    console.log(`OTP email sent to ${email}: ${info.messageId}`);
};

/**
 * Send Invite Email with acceptance link
 */
export const sendInviteEmail = async (to, token) => {
  const inviteLink = `${config.clientBaseUrl}/invite/${token}`;

  const info = await transporter.sendMail({
    from: `"Design Genie" <${config.mail.user}>`,
    to,
    subject: "You’ve been invited to join Design Genie",
    html: `
      <p>Hello,</p>
      <p>You’ve been invited to join a workspace on <strong>Design Genie</strong>.</p>
      <p>
        <a href="${inviteLink}" 
           style="
             display: inline-block;
             padding: 10px 20px;
             background-color: #4f46e5;
             color: white;
             text-decoration: none;
             border-radius: 6px;
             font-weight: bold;
             font-family: Arial, sans-serif;
           ">
          Accept Invitation
        </a>
      </p>
      <p>If you didn’t expect this email, you can ignore it.</p><br/>
      <p>Thank you,<br/>The <strong>Design Genie</strong> Team</p>
    `,
  });

  console.log(`Invitation email sent to ${to}: ${info.messageId}`);
};



/**
 * Send Feedback Notification to Support
 */
export const sendFeedbackReceivedEmail = async (user, feedbackData) => {
    const { user_email, feedback_date } = feedbackData;

    const htmlContent = `
      <div style="font-family: sans-serif; padding: 12px;">
        <h2>📝 New Feedback Submission</h2>
        <p>There is a new feedback submission by <strong>${user_email}</strong>, submitted at <strong>${feedback_date}</strong>.</p>
        <p>To view the full feedback, please login to <a href="${process.env.STRAPI_URL}" target="_blank">${process.env.STRAPI_URL}</a>.</p>

        <p style="margin-top: 30px;">Thanks,<br/>Design Genie Feedback Bot</p>
      </div>
    `;

    const info = await transporter.sendMail({
        from: `"Design Genie" <${config.mail.user}>`,
        to: process.env.SUPPORT_NOTIFICATION_EMAIL,
        subject: "📩 New Feedback Submitted",
        html: htmlContent,
    });

    console.log(`Feedback notification sent to support: ${info.messageId}`);
};

/*Seng User Register Notification to support */

export const sendUserRegister = async (user) => {
  const { full_name, email, created_at } = user;  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e5e5e5; border-radius: 8px; background: #ffffff;">
      <h2 style="color: #333;">📢 New User Registration</h2>
      
      <p style="font-size: 15px; color: #444; line-height: 1.6;">
        A new user has just registered on <strong>Design Genie</strong>.
      </p>

      <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Name</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${full_name || "N/A"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Email</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${email}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Registered At</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${created_at ? new Date(created_at).toLocaleString() : "N/A"}</td>
        </tr>
      </table>

      <p style="margin-top: 20px; font-size: 15px; color: #555;">
        To manage users, please visit 
        <a href="${process.env.STRAPI_URL}/admin" target="_blank" style="color: #007bff; text-decoration: none;">Admin Dashboard</a>.
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #777;">
        Regards,<br/>Design Genie Notification Bot
      </p>
    </div>
  `;
   const info = await transporter.sendMail({
        from: `"Design Genie" <${config.mail.user}>`,
        to: process.env.SUPPORT_NOTIFICATION_EMAIL,
        subject: "📢 New User Registered",
        html: htmlContent,
    });
  console.log(`User regitser notification sent to ${info.messageId}`);
  return htmlContent;
};


// utils/mailer.js
import nodemailer from "nodemailer";
import { config } from "../config/config.js";
import { UserPreferences } from "../modules/user_preference/model.js";

const transporter = nodemailer.createTransport({
	host: config.mail.host,
	port: config.mail.port,
	secure: config.mail.secure,
	auth: {
		user: config.mail.user,
		pass: config.mail.pass,
	},
});

export const sendMail = async ({ to, subject, html }) => {
  try {
    return await transporter.sendMail({
      from: `"Design Genie" <${config.mail.user}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`❌ Error in sendMail to ${to}:`, err.message);
    return null; // ✅ swallow error, app keeps running
  }
};

/**
 * Sends an email only if the user has email notifications enabled
 */
export const sendUserMail = async ({ userId, to, subject, html }) => {
  try {
    const prefs = await UserPreferences.findOne({ userId });

    // If user disabled email notifications, skip sending
    if (prefs && prefs.emailNotifications === false) {
      console.log(`📭 Email notifications disabled for user ${userId}, skipping mail.`);
      return null;
    }

    // Send mail as usual
    return await sendMail({ to, subject, html });
  } catch (err) {
    console.error("❌ Error in sendUserMail:", err);
    return null; // ✅ Don't throw, just return
  }
};

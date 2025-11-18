// services/creditService.js
import mongoose from "mongoose";
import UserCredit from "./model.js"; // adjust path as needed
import { ApiError } from "../../utils/ApiError.js";
import { lowCreditEmail } from "../../services/mailTemplates.js"
import { sendMail } from "../../services/mailServices.js";
import { config } from "../../config/config.js";
import User from "../users/model.js"; // assuming you have this
import nodemailer from "nodemailer";
import Notification from "../notifications/model.js";
import { sendNotification } from "../../utils/notificationUtils.js";

export const deductCredit = async (userId, io = null) => {
    const userCredit = await UserCredit.findOne({ user_id: userId });

    if (!userCredit || userCredit.credits <= 0) {
        throw new ApiError(403, "Not enough credits.");
    }

    const previousCredits = userCredit.credits;
    userCredit.credits -= 1;
    await userCredit.save();

    const threshold = Math.floor(config.startupCredits * 0.1);

    // Send email if dropping from above threshold to exactly threshold
    if (previousCredits > threshold && userCredit.credits <= threshold) {
        const user = await User.findById(userId);
        if (user?.email) {
            console.log(`Sending low credit email to ${user.email}`);
            const { subject, html } = lowCreditEmail(userCredit.credits);

            await sendMail({
                to: user.email,
                subject,
                html,
            });
        }

        // Send notification
        await sendNotification(io || global.io, {
            user_id: userId,
            type: "credit_warning",
            message: `Your image generation credits are low (${userCredit.credits} remaining). Please recharge.`,
        });
    }
};



export const savedImageExpiryEmail = (userName, imageList) => {
	const subject = "Your saved for later images are about to expire";

	const html = `
		<p>Hi <strong>${userName}</strong>,</p>

		<p>This is a friendly reminder that the following saved images in your Design Genie account will <strong>expire in 3 days</strong>:</p>

		<ul>
			${imageList.map((name) => `<li>${name}</li>`).join("")}
		</ul>

		<p>To prevent automatic deletion, please take action by downloading or finalizing them.</p>

		<p style="color: #888;">Saved for later images are automatically deleted after 30 days.</p>

		<p>Thank you,<br/>The <strong>Design Genie</strong> Team</p>
	`;

	return { subject, html };
};

export const lowCreditEmail = (remainingCredits, tenantName = "Tenant") => {
  const subject = "⚠️ Your tenant credits are running low";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #d9534f;">Hello ${tenantName},</h2>
      <p>
        We wanted to let you know that your tenant credits are getting low. 
        You currently have <strong>${remainingCredits} credits</strong> remaining.
      </p>
      <p>
        To ensure uninterrupted service, please recharge your credits at your earliest convenience.
      </p>
      <p>Thanks,<br/>Design Genie Team</p>
    </div>
  `;

  return { subject, html };
};


export const errorAlertEmail = (userName) => {
	const subject = "Alert: Process Failed";

	const html = `
		 <p>Hello <strong>${userName}</strong>,</p>
    	<p>We encountered an error while attempting to complete your recent action in <strong>Process</strong>.</p>
		<p>Please review the details of your process and try again. If the issue persists, feel free to contact our support team for assistance.</p>
      	<br>
      	<p>Thanks,<br/>Design Genie Team</p>
	`;

	return { subject, html };
};

export const suspiciousLoginEmail = (userName, clientIp) => {
	const subject = "Suspicious Login Activity Detected";

	const html = `
		 <p>Hello <strong>${userName}</strong>,</p>
    	<p>We detected a login to your account from an unrecognized device:</p>
		<p><strong>IP Address:</strong> ${clientIp}</p>
		<p>If this was you, you can ignore this message. If not, please secure your account.</p>
      	<br>
      	<p>Thanks,<br/>Design Genie Team</p>
	`;

	return { subject, html };
};

export const announcementEmail = (message) => {
	const subject = "📢 New Announcement from Admin";
		const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">New Announcement</h2>
                <p style="font-size: 16px;">${message}</p>
                <p style="margin-top: 30px; font-size: 14px; color: #555;">Please do not reply to this email. This was sent automatically.</p>
				<br>
      			<p>Thanks,<br/>Design Genie Team</p>
            </div>
	`;
	return { subject, html };
};

export const postApprovalEmail = () => {
	const subject = "Your Post Has Been Approved!";
	const html = `
			<div style="font-family: Arial, sans-serif; padding: 20px;">
				<h2 style="color: #333;">Post Approved</h2>
				<p style="font-size: 16px;">Congratulations! Your post has been reviewed and approved. It's now live on our platform.</p>
				<p style="margin-top: 30px; font-size: 14px; color: #555;">Please do not reply to this email. This was sent automatically.</p>
				<br>
	  			<p>Thanks,<br/>Design Genie Team</p>
			</div>
	`;
	return { subject, html };
}
export const postRejectionEmail = () => {
  const subject = "Your Post Has Been Rejected";
  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #dc2626;">Post Rejected</h2>
        <p style="font-size: 16px;">We’re sorry to inform you that your post did not meet our community guidelines and has been rejected.</p>
        <p style="font-size: 16px;">If you believe this was a mistake or would like to make changes, you can edit and resubmit your post for review.</p>
        <p style="margin-top: 30px; font-size: 14px; color: #555;">Please do not reply to this email. This was sent automatically.</p>
        <br>
        <p>Thanks,<br/>Design Genie Team</p>
      </div>
  `;
  return { subject, html };
};

export const postDeletionEmail = () => {
  const subject = "Your Post Has Been Deleted";
  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #ef4444;">Post Deleted</h2>
        <p style="font-size: 16px;">We wanted to let you know that your post has been removed from our platform.</p>
        <p style="font-size: 16px;">This could be due to a violation of our community guidelines or other reasons outlined in our policies.</p>
        <p style="margin-top: 30px; font-size: 14px; color: #555;">Please do not reply to this email. This was sent automatically.</p>
        <br>
        <p>Thanks,<br/>Design Genie Team</p>
      </div>
  `;
  return { subject, html };
};

export const emailChangeTemplate = (code) => {
  const subject = "Confirm Your Email Change";
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5;">
      <h2 style="color: #ef4444;">Email Change Request</h2>
      <p style="font-size: 16px;">
        We received a request to change your email address. Please use the OTP below to confirm the change:
      </p>
      <p style="font-size: 20px; font-weight: bold; color: #111;">${code}</p>
      <p style="font-size: 16px;">This OTP will expire in 10 minutes.</p>
      <p style="margin-top: 30px; font-size: 14px; color: #555;">
        If you did not request this change, please ignore this email.
      </p>
      <br>
      <p>Thanks,<br/>Design Genie Team</p>
    </div>
  `;
  return { subject, html };
};

export const passwordChangeTemplate = (code) => {
  const subject = "Confirm Your Password Change";
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5;">
      <h2 style="color: #ef4444;">Password Change Request</h2>
      <p style="font-size: 16px;">
        We received a request to change your account password. Please use the OTP below to confirm the change:
      </p>
      <p style="font-size: 20px; font-weight: bold; color: #111;">${code}</p>
      <p style="font-size: 16px;">This OTP will expire in 10 minutes.</p>
      <p style="margin-top: 30px; font-size: 14px; color: #555;">
        If you did not request this change, please contact support immediately.
      </p>
      <br>
      <p>Thanks,<br/>Design Genie Team</p>
    </div>
  `;
  return { subject, html };
};

export const accountStatusEmail = (userName, isActive) => {
  const subject = isActive
    ? "Your Account Has Been Activated"
    : "Your Account Has Been Deactivated";

  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: ${isActive ? "#22c55e" : "#ef4444"};">
          Account ${isActive ? "Activated" : "Deactivated"}
        </h2>
        <p style="font-size: 16px;">
          Hello ${userName},
        </p>
        <p style="font-size: 16px;">
          Your account has been ${isActive ? "activated. You can now login." : "deactivated. You will not be able to login until reactivated."}
        </p>
        <p style="margin-top: 30px; font-size: 14px; color: #555;">
          Please do not reply to this email. This was sent automatically.
        </p>
        <br>
        <p>Thanks,<br/>Design Genie Team</p>
      </div>
  `;
  return { subject, html };
};

export const profileDeletionEmail = (reason) => {
  const subject = "Your Profile Has Been Deleted";
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #dc2626;">Profile Deleted</h2>
      <p style="font-size: 16px;">
        We’re sorry to inform you that your profile has been deleted from our platform.
      </p>
      <p style="font-size: 16px;">
        <strong>Reason:</strong> ${reason || "No specific reason provided."}
      </p>
      <p style="margin-top: 30px; font-size: 14px; color: #555;">
        If you believe this was a mistake, please contact our support team.
      </p>
      <br>
      <p>Thanks,<br/>Design Genie Team</p>
    </div>
  `;
  return { subject, html };
};


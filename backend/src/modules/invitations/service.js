import bcrypt from "bcrypt";
import crypto from "crypto";
import Invitation from "./model.js";
import User from "../users/model.js";
import Role from "../roles/model.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateOtp } from "../../utils/otp.js";
import { sendOtpEmail, sendInviteEmail } from "../../utils/mail.js";
import { createUserProjectRole } from "../user_project_role/service.js";
import { getPasswordValidationMessage } from "../../utils/otherUtils.js";

const isPasswordStrong = (password) => {
    return (
        password.length >= 10 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
};

export const createInvitation = async ({
    email,
    tenant_id,
    role_id,
    department_id,
    project_assignments,
    created_by
}) => {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        if (existingUser.tenant_id?.toString() === tenant_id.toString()) {
            throw new ApiError(409, "User already exists in this tenant");
        } else {
            throw new ApiError(
                403,
                "This email is already associated with another tenant"
            );
        }
    }

    const existing = await Invitation.findOne({
        email,
        tenant_id,
        is_accepted: false,
        is_declined: false,
    });
    if (existing) throw new ApiError(409, "Invitation already sent");

    // ✅ Admin permission check
    if (role_id) {
        const role = await Role.findById(role_id).populate("permissions");

        if (!role || role.is_deleted || !role.is_active) {
            throw new ApiError(400, "Invalid role");
        }

        const hasAdminPermission = role.permissions.some(
            (permission) => permission.key === "tenant:admin:super"
        );

        if (hasAdminPermission) {
            throw new ApiError(
                403,
                "You are not allowed to assign a role with 'tenant:admin:super' permission"
            );
        }
    }

    const invite_token = crypto.randomBytes(20).toString("hex");
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs

    try {
        await sendInviteEmail(email, invite_token);
    } catch (err) {
        console.error("Failed to send invitation email:", err);
        throw new ApiError(500, "Failed to send invitation email");
    }

    const invitation = await Invitation.create({
        email,
        tenant_id,
        role_id,
        department_id,
        invite_token,
        expires_at,
        project_assignments,
        created_by
    });

    return invitation;
};


export const getInvitationByToken = async (token) => {
    const invitation = await Invitation.findOne({ invite_token: token });
    if (!invitation) {
        throw new ApiError(410, "Invitation not found");
    }

    if (invitation.is_accepted || invitation.is_declined) {
        throw new ApiError(410, "Invitation has already been processed");
    }

    if (invitation.expires_at < new Date()) {
        throw new ApiError(410, "Invitation expired");
    }

    return invitation;
};

export const resendInvitation = async (invitationId, userId) => {
    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
        throw new ApiError(404, "Invitation not found");
    }

    if (invitation.is_accepted) {
        throw new ApiError(400, "Invitation already accepted");
    }

    if (invitation.is_declined) {
        throw new ApiError(400, "Invitation already declined");
    }

    const invite_token = crypto.randomBytes(20).toString("hex");
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs

    invitation.created_by = userId
    invitation.invite_token = invite_token;
    invitation.expires_at = expires_at;
    await invitation.save();
    
    try {
        await sendInviteEmail(invitation.email, invite_token);
    } catch (err) {
        console.error("Failed to send invitation email:", err);
        throw new ApiError(500, "Failed to resend invitation email");
    }
    return invitation;
};

export const acceptInvitation = async (token, { full_name, password }) => {
    const invitation = await getInvitationByToken(token);

    const existingUser = await User.findOne({ email: invitation.email });

    if (existingUser) {
        if (
            existingUser.tenant_id?.toString() ===
            invitation.tenant_id.toString()
        ) {
            throw new ApiError(409, "User already exists in this tenant");
        } else {
            throw new ApiError(
                403,
                "This email is already associated with another tenant",
            );
        }
    }

    if (!full_name || full_name.length < 3) {
        throw new ApiError(422, "Full Name must be at least 3 characters");
    }

   const validationMessage = getPasswordValidationMessage(password);

    if (validationMessage) {
    throw new ApiError(422, validationMessage);
    }

    const hash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    try {
        await sendOtpEmail(invitation.email, otp);
    } catch (err) {
        console.error("Failed to send OTP email:", err);
        throw new ApiError(500, "Failed to send OTP email");
    }

    const user = await User.create({
        full_name,
        email: invitation.email,
        password_hash: hash,
        role_id: invitation.role_id,
        tenant_id: invitation.tenant_id,
        department_id: invitation.department_id,
        otp_code: otp,
        otp_expires_at: expiry,
        last_otp_sent_at: new Date(),
        invited_by: invitation.created_by
    });

    if (invitation.project_assignments?.length > 0) {
        await createUserProjectRole(
            {
                user_id: user._id,
                projects: invitation.project_assignments,
            },
            invitation.tenant_id,
        );
    }

    invitation.is_accepted = true;
    invitation.accepted_at = new Date();
    await invitation.save();

    return user;
};

export const declineInvitation = async (token) => {
    const invitation = await getInvitationByToken(token);
    invitation.is_declined = true;
    await invitation.save();
    return { message: "Invitation declined" };
};

export const getTenantInvitations = async (tenantId) => {
    const invitations = await Invitation.find({
        tenant_id: tenantId,
    }).populate("role_id department_id");

    return invitations;
};

export const getPendingTenantInvitations = async (tenantId) => {
    const invitations = await Invitation.find({
        tenant_id: tenantId,
        is_accepted: false,
        is_declined: false,
    }).populate("role_id department_id");

    return invitations;
};

export const deleteInvitationService = async (invitationId) => {
  // Check if invitation exists
  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Delete the invitation
  await Invitation.findByIdAndDelete(invitationId);
  return true;
};
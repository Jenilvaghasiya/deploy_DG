import User from "./model.js";
import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";
import UserCredits from '../../modules/credits/model.js'
import Role from "../roles/model.js";
import { PERMISSIONS } from "../../utils/permission.js";
import { sendMail } from "../../services/mailServices.js";
import OTP from "./otpSchema.js";
import bcrypt from "bcrypt";
import { accountStatusEmail, emailChangeTemplate, passwordChangeTemplate } from "../../services/mailTemplates.js";
import UsageLog from '../dashboard/model.js'
import TenantCredits from "../credits/tenantCreditSchema.js";
import { UserPreferences } from "../user_preference/model.js";

export const getAllUsers = async (search, tenant_id) => {
    const query = { is_deleted: false, tenant_id };
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }
    return User.find(query).populate("role_id");
};

export const getAllRevokedUsers = async (tenant_id) => {
    return User.find({
        is_deleted: true,
        tenant_id
    }).populate("role_id").populate("tenant_id").populate("department_id");
};

export const searchUser = async (search, user_id, tenant_id) => {
    if (!search || !search.trim()) return [];

    const query = {
        is_deleted: false,
        tenant_id,
        _id: { $ne: user_id },
        $or: [
            { full_name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ]
    };

    return User.find(query, { full_name: 1, email: 1 })
        .lean();
};


export const getTenantUsers = async (tenantId) => {
    return User.find({
        is_deleted: false,
        // is_active: true,
        tenant_id: tenantId,
    })
        .populate("role_id")
        .populate("tenant_id")
        .populate("department_id");
};

export const getUserById = async (id) => {
    const user = await User.findOne({ _id: id, is_deleted: false }).populate(
        "role_id",
    );
    if (!user) throw new ApiError(404, "User not found");
    return user;
};

export const createUser = async (data) => {
    const exists = await User.findOne({ email: data.email });
    if (exists) throw new ApiError(409, "Email already in use");

    // Check if role has admin-level permission
    if (data.role_id) {
        const role = await Role.findById(data.role_id).populate("permissions");

        if (!role || role.is_deleted || !role.is_active) {
            throw new ApiError(400, "Invalid role");
        }

        const hasAdminPermission = role.permissions.some(
            (permission) => permission.key === PERMISSIONS.TENANT_ADMIN_SUPER
        );

        if (hasAdminPermission) {
            throw new ApiError(403, "You are not allowed to assign a role with 'tenant:admin:super' permission");
        }
    }

    return User.create(data);
};


export const updateUser = async (id, updates) => {
    if (updates.role_id) {
        const role = await Role.findById(updates.role_id).populate("permissions");

        if (!role || role.is_deleted || !role.is_active) {
            throw new ApiError(400, "Invalid role");
        }

        const hasAdminPermission = role.permissions.some(
            (permission) => permission.key === PERMISSIONS.TENANT_ADMIN_SUPER
        );

        if (hasAdminPermission) {
            throw new ApiError(403, "You are not allowed to assign a role with 'tenant:admin:super' permission");
        }
    }
    const existingUser = await User.findOne({ _id: id, is_deleted: false });
    if (!existingUser) throw new ApiError(404, "User not found");
    const oldIsActive = existingUser.is_active;
    const user = await User.findOneAndUpdate(
        { _id: id, is_deleted: false },
        updates,
        {
            new: true,
            runValidators: true,
        },
    );

     if (updates.hasOwnProperty("is_active") && oldIsActive !== updates.is_active) {
        try {
            const { subject, html } = accountStatusEmail(user.full_name, updates.is_active);
            await sendMail({
                to: user.email,
                subject,
                html,
            });
        } catch (err) {
            console.error("Failed to send account status email:", err);
        }
    }

    return user;
};


export const deleteUser = async (id,user_id,tenant_id) => {
    const user = await User.findOne({ _id: id, is_deleted: false });
    if (!user) throw new ApiError(404, "User not found");

    // Format today's date as mm-dd-yy
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);

    const revokedName = `${user.full_name}_Revoked_${mm}-${dd}-${yy}`;

    // find a predefined empty role
    let revokedRole = await Role.findOne({
        is_predefined: true,
        permissions: { $size: 0 },
    });

    // if it doesn't exist, create it
    if (!revokedRole) {
        revokedRole = await Role.create({
            name: "RevokedRole",
            description: "Role with no permissions, assigned to deleted users",
            is_predefined: true,
            permissions: [],
            is_active: false,
            created_by: user_id,
            tenant_id:tenant_id

        });
    }

    // update user
    user.is_deleted = true;
    user.full_name = revokedName;
    user.role_id = revokedRole._id;
    user.is_active = false;

    await user.save();

    return user;
};



export const getProfile = async (userId) => {
    const user = await User.findOne({
        _id: userId,
        is_deleted: false,
    })
        .populate({
            path: "role_id",
            populate: {
                path: "permissions",
                select: "key",
            },
        })
        .populate("tenant_id");

    if (!user) throw new ApiError(404, "User not found");

    // Fetch user-specific credits (usage info)
    let userCredits = await UserCredits.findOne({ user_id: userId });
    let userPreferences = await UserPreferences.findOne({userId:user._id})

    if (!userCredits) {
        // Create default userCredits if not exist
        userCredits = await UserCredits.create({ user_id: userId, tenant_id: user?.tenant_id?._id });
    }

    // Fetch tenant total credits
    const tenantCredits = await TenantCredits.findOne({ tenant_id: user?.tenant_id?._id });

    // Merge tenant credits into userCredits
    const fullCredits = {
        ...userCredits.toJSON(),
        credits: tenantCredits ? tenantCredits.credits : 0,
        startCredits: tenantCredits ? tenantCredits.startCredits : 50,
    };

        return { user, userCredits: fullCredits,sessionTimeoutLength: userPreferences?.sessionTimeoutLength  };
};

export const updateProfile = async (userId, full_name, nick_name) => {
    
    const user = await User.findOneAndUpdate(
        { _id: userId, is_deleted: false },
        { $set: { full_name, nick_name } }, // update both if provided
        {
            new: true,
            runValidators: true,
        }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Log profile update
    await UsageLog.create({
        module: "general",
        type: "user_account_info_updated",
        user_id: userId,
        tenant_id: user.tenant_id,
        metadata: { full_name, nick_name },
        description: `Profile updated for user ${user.email}`,
    });

    return user;
};

export const updatePassword = async (userId, otp, current_password, new_password) => {
  if (!current_password || !new_password) {
    throw new Error("current password and new password are required");
  }

  const user = await User.findOne({ _id: userId, is_deleted: false }).select("+password_hash");
  if (!user) throw new Error("User not found");

  const hashedPassword = user.password_hash;

  const isMatch = await bcrypt.compare(current_password, hashedPassword);
  if (!isMatch) throw new Error("Current password is incorrect");

  if (!otp) {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { userId, type: "PASSWORD_CHANGE" },
      { otp: code, expiresAt },
      { upsert: true, new: true }
    );
    const { subject, html } = passwordChangeTemplate(code);

    await sendMail({ to: user.email, subject, html });

    return { otpSent: true };
  }

  const record = await OTP.findOne({ userId, otp, type: "PASSWORD_CHANGE" });
  if (!record) throw new Error("Invalid OTP");
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    throw new Error("OTP expired");
  }

  const hashed = await bcrypt.hash(new_password, 10);
  await User.findByIdAndUpdate(userId, { password_hash: hashed });
  await record.deleteOne();

  // Log password update
  await UsageLog.create({
    module: "general",
    type: "user_password_updated",
    user_id: userId,
    tenant_id: user.tenant_id,
    description: `Password updated for user ${user.email}`,
  });

  return { success: true };
};


export const updateEmail = async (userId, newEmail, otp) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (!otp) {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { userId, type: "EMAIL_CHANGE" },
      { otp: code, expiresAt },
      { upsert: true, new: true }
    );
    const { subject, html } = emailChangeTemplate(code);

    await sendMail({
      to: newEmail,
      subject,
      html,
    });

    return { otpSent: true };
  }

  const record = await OTP.findOne({ userId, otp, type: "EMAIL_CHANGE" });
  if (!record) throw new Error("Invalid OTP");
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    throw new Error("OTP expired");
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { email: newEmail }, { new: true });
  await record.deleteOne();

  // Log email update
  await UsageLog.create({
    module: "general",
    type: "user_email_updated",
    user_id: userId,
    tenant_id: updatedUser.tenant_id,
    metadata: { oldEmail: user.email, newEmail },
    description: `Email updated from ${user.email} to ${newEmail}`,
  });

  return { success: true, user: updatedUser };
};

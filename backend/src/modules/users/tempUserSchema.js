import mongoose, { Schema } from "mongoose";

// Define embedded tenant schema
const tempTenantSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
            lowercase: true,
        },
        industry_type: {
            type: String,
        },
        subscription_frequency: {
            type: String,
            enum: ["monthly", "yearly"],
            default: "monthly",
        },
        account_type: { type: String, enum: ['individual', 'company'], default: 'company' }
    },
    { _id: false } // don’t create a separate _id for embedded tenant
);

const tempUserSchema = new Schema(
    {
        full_name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password_hash: {
            type: String,
            required: true,
            // select: false,
        },
        otp_code: {
            type: String,
        },
        otp_expires_at: {
            type: Date,
        },
        last_otp_sent_at: {
            type: Date,
        },
        is_verified: {
            type: Boolean,
            default: false,
        },
        sign_up_ip: {
            type: String,
        },
        expires_at: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        tenant: tempTenantSchema, // embedded tenant object
        auth_provider: { 
            type: String, 
            enum: ['local', 'google'], 
            default: 'local' 
        },
        google_Id: { type: String, sparse: true, unique: true },
        onboarding_stage: {
            type: String,
            enum: ["registered", "verified", "subscription_selected", "completed"],
            default: "registered",
        },
        selected_plan_id: {
            type: Schema.Types.ObjectId,
            ref: "Plan",
        },
        stripe_checkout_session_id: {
            type: String,
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

tempUserSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("TempUser", tempUserSchema);

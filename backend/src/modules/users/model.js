import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        full_name: {
            type: String,
            required: true,
            trim: true,
        },
        nick_name: {
            type: String,
            required: false,
        },
        user_phone : {
            type: String,
            required : false
        },
        phoneVerified : {
            type : Boolean,
            default : false
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(
                        v,
                    );
                },
                message: (props) => `${props.value} is not a valid email!`,
            },
        },
        password_hash: {
            type: String,
            required: true,
            select: false,
        },
        google_Id: {
            type: String,
            required: false
        },
        role_id: {
            type: Schema.Types.ObjectId,
            ref: "Role",
            required: true,
        },
        tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
        },
         auth_provider: { 
            type: String, 
            enum: ['local', 'google'], 
            default: 'local' 
        },
        department_id: {
            type: Schema.Types.ObjectId,
            ref: "Department",
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        is_verified: {
            type: Boolean,
            default: false,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
        last_login: {
            type: Date,
        },
        login_ips: [
            {
                ip: String,
                is_whitelisted: {
                    type: Boolean,
                    default: true,
                },
            },
        ],
        login_attempt : {
            type: Number,
            default: 0   
        },
        login_count : {
            type: Number,
            default: 0
        },
        otp_code: {
            type: String,
        },
        sign_up_ip: {   
            type: String,
        },
        otp_expires_at: {
            type: Date,
        },
        last_otp_sent_at: {
            type: Date,
        },
        data_transfered:{
            type: Boolean,
            default: false
        },
        invited_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

userSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password_hash;
        delete ret.otp_code;
        delete ret.otp_expires_at;
        delete ret.last_otp_sent_at;

        if (ret.role_id && typeof ret.role_id === "object") {
            ret.role = ret.role_id;
            delete ret.role_id;
        }
        if (ret.tenant_id && typeof ret.tenant_id === "object") {
            ret.tenant = ret.tenant_id;
            delete ret.tenant_id;
        }
        if (ret.department_id && typeof ret.department_id === "object") {
            ret.department = ret.department_id;
            delete ret.department_id;
        }

        return ret;
    },
});

export default mongoose.model("User", userSchema);

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// MongoDB Schema for tracking user platform time
const userTimeSchema = new mongoose.Schema({
   user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
        index: true
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant", // Reference to the Tenant model
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        // Store only the date part (YYYY-MM-DD) for efficient querying
        index: true
    },
    total_time: {
        type: Number,
        default: 0, // Total time in milliseconds for the day
        min: 0
    },
    sessions: [{
        connect_time: {
            type: Date,
            required: true
        },
        disconnect_time: {
            type: Date,
            default: null // null means still connected
        },
        duration: {
            type: Number,
            default: 0 // Duration in milliseconds
        }
    }],
    is_currently_online: {
        type: Boolean,
        default: false
    },
    last_activity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
userTimeSchema.index({ user_id: 1, date: 1 }, { unique: true });

// Index for querying user's daily usage
userTimeSchema.index({ user_id: 1, date: -1 });

const UserTime = mongoose.model('UserTime', userTimeSchema);
export { UserTime };
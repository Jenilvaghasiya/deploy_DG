import mongoose from "mongoose";

export const UserPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  keepMeLoggedIn: { type: Boolean, default: false },
  analyticsConsent: { type: Boolean, default: false },
  marketingConsent: { type: Boolean, default: false },
  functionalConsent: { type: Boolean, default: false },
  allowUserDataTuning: { type: Boolean, default: false },
  tuningConsentRevokedAt: { type: Date },
  deleteTuningData: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  howItWorksPopup: { type: Boolean, default: false },
  deleteUserDataForTuning: { type: Boolean, default: false},
  sessionTimeoutLength: { type: Number, default: 30 }, // minutes
  usagePurpose: { type: String, default: "", required : false },
  allow2FA: {type:  Boolean, default: false},
  googleLoginEnabled: {type : Boolean, default: true}
}, { timestamps: true });

export const UserPreferences = mongoose.model("User_Preferences", UserPreferencesSchema);

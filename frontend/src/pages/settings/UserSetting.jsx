import { useEffect, useState } from "react";
import api from "@/api/axios";
import { Button } from "../../components/ui/button";
import { Input } from "@/components/ui/input";
import {toast} from "react-hot-toast";
import { FaEyeSlash } from "react-icons/fa";
import { FaEye } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import { FaCoins } from "react-icons/fa"; // FontAwesome coin icon
import SubscriptionDetails from "../subscriptions/SubscriptionDetails";
import { hasPermission } from "@/lib/utils";
import { PERMISSIONS } from "@/utils/permission";
import { PostReviewDisplay } from "./PostViewSetting";
const TABS = {
  PROFILE: "profile",
  SETTINGS: "settings",
  AUTHENTICATION: "authentication",
  SUBSCRIPTION: "subscription",
  USAGE_INFORMATION: "usage_information"
};

export default function UserSetting() {
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);
  const [user, setUser] = useState(null);
  const [userCredits, setUserCredits] = useState(null)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewPosts, setReviewPosts] = useState([]);
  const [galleryPosts, setGalleryPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState("");
  const [viewReviewedPosts, setReviewedPosts] = useState(false);
  const [viewGalleryPosts, setViewGalleryPosts] = useState(false);
console.log(userCredits, 'userCreditsuserCredits');

  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);
  const userHasAdminPermission = hasPermission(
    permissionKeys,
    PERMISSIONS.TENANT_ADMIN_SUPER
  );
  
  // Separate editing states for each section
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isEditingAuthentication, setIsEditingAuthentication] = useState(false);
  const [isEditingUsageInfo, setIsEditingUsageInfo] = useState(false);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  
  // Separate loading states for each section
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingAuthentication, setSavingAuthentication] = useState(false);
  const [savingUsageInfo, setSavingUsageInfo] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [profileData, setProfileData] = useState({
    full_name: "",
    nick_name: ""
  });
  
  const [emailData, setEmailData] = useState({
    email: "",
    password: "" // Current password for email verification
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  
  const isEmailChanged = user?.email !== emailData.email;
  const isPasswordReadyForOtp = passwordData.current_password && passwordData.new_password;
  
  const [settingsData, setSettingsData] = useState({
    keepMeLoggedIn: false,
    analyticsConsent: false,
    marketingConsent: false,
    functionalConsent: false,
    autoRenewal: false,
    sessionTimeoutLength: 30,
    allowUserDataTuning: false,
    emailNotifications: false,
    howItWorksPopup: false,
    deleteUserDataForTuning: false,
    usagePurpose : "",
    userPhone: "",
    allow2FA: false,
    googleLoginEnabled: false,
    verificationCode: "",
    phoneVerified: false
  });
  
  // Temporary edit states for each tab
  const [editSettings, setEditSettings] = useState({});
  const [editAuthentication, setEditAuthentication] = useState({});
  const [editUsageInfo, setEditUsageInfo] = useState({});
  const [editSubscription, setEditSubscription] = useState({});

    // Fetch user profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
        try {
            const res = await api.get("/users/me");            
            const userData = res.data.data.user;
            const userCreditsData = res.data.data.userCredits
            setUser(userData);
            setUserCredits(userCreditsData)
            setProfileData({
            full_name: userData.full_name || "",
            nick_name: userData.nick_name || ""
            });
            setEmailData({
            email: userData.email || "",
            password: ""
            });
        } catch (err) {
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
        interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
    }, [otpSent, timer]);

    useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await api.get("/user-preference");        
        if (res.status === 200) {
          setSettingsData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch preferences", err);
        toast.error("Failed to load user preferences");
      }
    };
    fetchPreferences();
    }, []);

    useEffect(() => {
    const fetchReviewPosts = async () => {
      try {
        setLoading(true);
        const res = await api.get("/social/post/myReviewed/get"); // ✅ call your endpoint
        
        setReviewPosts(res.data.data || []); // assuming API returns an array
      } catch (err) {
        setError("Failed to load review posts");
      } finally {
        setLoading(false);
      }
    };

    fetchReviewPosts();
  }, []);

  
    useEffect(() => {
    const fetchGalleryPosts = async () => {
      try {
        setLoading(true);
        const res = await api.get("/social/post/myGallery/get"); // ✅ call your endpoint
        console.log(res, 'resresresresres');
        
        setGalleryPosts(res.data.data || []); // assuming API returns an array
      } catch (err) {
        setError("Failed to load gallery posts");
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryPosts();
  }, []);

  // Profile update handlers
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError("");
    try {
      const res = await api.put("/users/profile/update", profileData);
      setUser({ ...user, ...profileData });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      setError("Failed to save profile changes");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSettingChange = (field, value, tabName = 'settings') => {
    switch(tabName) {
      case 'settings':
        setEditSettings((prev) => ({ ...prev, [field]: value }));
        break;
      case 'authentication':
        setEditAuthentication((prev) => ({ ...prev, [field]: value }));
        break;
      case 'usageInfo':
        setEditUsageInfo((prev) => ({ ...prev, [field]: value }));
        break;
      case 'subscription':
        setEditSubscription((prev) => ({ ...prev, [field]: value }));
        break;
      default:
        setSettingsData((prev) => ({ ...prev, [field]: value }));
    }
  };
    // Email update handlers
    const handleEmailChange = (e) => {
        setEmailData({ ...emailData, [e.target.name]: e.target.value });
    };

    const handleSaveEmail = async () => {
    setSavingEmail(true);
    setError("");

    try {
        if (!otpSent) {
        // Step 1: Request backend to send OTP (using same endpoint)
        await api.put("/users/profile/update/email", { newEmail: emailData.email });

        setOtpSent(true);
        setTimer(600); // 10 minutes countdown
        toast.success("OTP sent to your email!");
        } else {
        // Step 2: Verify OTP & update email (same endpoint)
        await api.put("/users/profile/update/email", { newEmail: emailData.email, otp });

        setUser({ ...user, email: emailData.email });
        setIsEditingEmail(false);
        setOtp("");
        setOtpSent(false);
        setTimer(0);
        toast.success("Email updated successfully!");
        }
    } catch (err) {
        setError(err.response?.data?.message || "Failed to update email");
    } finally {
        setSavingEmail(false);
    }
    };

    const handleResendOtp = async () => {
    try {
        // Just call the same endpoint again to resend OTP
        await api.put("/users/profile/update/email", { email: emailData.email });
        setTimer(600); // reset timer
        toast.success("OTP resent to your email!");
    } catch (err) {
        setError(err.response?.data?.message || "Failed to resend OTP");
    }
    };
    const handlePasswordChange = (e) => { 
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value }); 
    };
    const toggleShowPassword = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
    };
    // Password handler uses the single endpoint you already have
  const handleSavePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("New passwords don't match");
      return;
    }

    setSavingPassword(true);
    setError("");

    try {
      if (!otpSent) {
        // Step 1: Request OTP
        await api.put("/users/profile/update/password", {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        });

        setOtpSent(true);
        setTimer(600); // 10 minutes countdown
        toast.success("OTP sent to your email!");
      } else {
        // Step 2: Verify OTP & update password
        await api.put("/users/profile/update/password", {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
          otp,
        });

        setIsEditingPassword(false);
        setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
        setOtp("");
        setOtpSent(false);
        setTimer(0);
        toast.success("Password updated successfully!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResendPasswordOtp = async () => {
    try {
      await api.put("/users/profile/update/password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setTimer(600);
      toast.success("OTP resent to your email!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  // Preferences handlers
  const handleEditPreferences = () => {
    setEditSettings({
      keepMeLoggedIn: settingsData.keepMeLoggedIn,
      analyticsConsent: settingsData.analyticsConsent,
      marketingConsent: settingsData.marketingConsent,
      functionalConsent: settingsData.functionalConsent,
      sessionTimeoutLength: settingsData.sessionTimeoutLength,
      allowUserDataTuning: settingsData.allowUserDataTuning,
      emailNotifications: settingsData.emailNotifications,
      howItWorksPopup: settingsData.howItWorksPopup,
      deleteUserDataForTuning: settingsData.deleteUserDataForTuning,
      googleLoginEnabled: settingsData.googleLoginEnabled
    });
    setIsEditingPreferences(true);
  };

  const handleCancelPreferences = () => {
    setEditSettings({});
    setIsEditingPreferences(false);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.post("/user-preference", editSettings); 
      toast.success(res.data.message || "Preferences saved successfully!");
      
      setSettingsData((prev) => ({
        ...prev,
        ...editSettings
      }));

      setIsEditingPreferences(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save preferences");
    } finally {
      setSavingSettings(false);
    }
  };

  // Authentication handlers
  const handleEditAuthentication = () => {
    setEditAuthentication({
      allow2FA: settingsData.allow2FA,
      userPhone: settingsData.userPhone,
      phoneVerified: settingsData.phoneVerified,
      verificationCode: ""
    });
    setIsEditingAuthentication(true);
  };

  const handleCancelAuthentication = () => {
    setEditAuthentication({});
    setIsEditingAuthentication(false);
    setOtpSent(false);
    setTimer(0);
  };

  const handleSendPhoneOTP = async () => {
    if (!editAuthentication.userPhone) {
      toast.error("Please enter a phone number first!");
      return;
    }

    try {
      const response = await api.post("/users/twoFactor/send-otp", {
        phoneNumber: editAuthentication.userPhone,
      });

      if (response.status === 200) {
        setOtpSent(true);
        setTimer(60);
        toast.success("OTP sent on your phone number!");
      } else {
        toast.error(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP - check console");
    }
  };

  const handleSaveAuthenticationSettings = async () => {
    setSavingAuthentication(true);
    
    try {
      const isPhoneChanged = settingsData.userPhone !== editAuthentication.userPhone;
      
      if (isPhoneChanged && editAuthentication.allow2FA && otpSent && editAuthentication.verificationCode) {
        const verifyResponse = await api.post("/users/update/phone-number", {
          phoneNumber: editAuthentication.userPhone,
          otp: editAuthentication.verificationCode
        });
        
        if (verifyResponse.status !== 200) {
          toast.error("Invalid verification code");
          setSavingAuthentication(false);
          return;
        }
        handleSettingChange("phoneVerified", true, 'authentication');
      }
      
      const response = await api.post("/user-preference", {
        allow2FA: editAuthentication.allow2FA,
        userPhone: editAuthentication.userPhone,
        phoneVerified: editAuthentication.phoneVerified
      });
      
      if (response.status === 200) {
        setSettingsData((prev) => ({
          ...prev,
          ...editAuthentication
        }));
        setIsEditingAuthentication(false);
        setOtpSent(false);
        setTimer(0);
        toast.success("Authentication settings saved successfully!");
      }
      
    } catch (error) {
      console.error("Error saving authentication settings:", error);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingAuthentication(false);
    }
  };

  // Usage Information handlers
  const handleEditUsageInfo = () => {
    setEditUsageInfo({
      usagePurpose: settingsData.usagePurpose || ""
    });
    setIsEditingUsageInfo(true);
  };

  const handleCancelUsageInfo = () => {
    setEditUsageInfo({});
    setIsEditingUsageInfo(false);
  };

  const handleSaveUsageInfo = async () => {
    setSavingUsageInfo(true);
    try {
      const res = await api.post("/user-preference", editUsageInfo);
      toast.success("Usage information saved successfully!");
      
      setSettingsData((prev) => ({
        ...prev,
        ...editUsageInfo
      }));

      setIsEditingUsageInfo(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save usage information");
    } finally {
            setSavingUsageInfo(false);
    }
  };

  // Subscription handlers
  const handleEditSubscription = () => {
    setEditSubscription({
      autoRenewal: settingsData.autoRenewal
    });
    setIsEditingSubscription(true);
  };

  const handleCancelSubscription = () => {
    setEditSubscription({});
    setIsEditingSubscription(false);
  };

  const handleSaveSubscription = async () => {
    setSavingSubscription(true);
    try {
      const res = await api.post("/user-preference", editSubscription);
      toast.success("Subscription settings saved successfully!");
      
      setSettingsData((prev) => ({
        ...prev,
        ...editSubscription
      }));

      setIsEditingSubscription(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save subscription settings");
    } finally {
      setSavingSubscription(false);
    }
  };
  
  if (viewReviewedPosts) {
    return (
      <PostReviewDisplay
        posts={reviewPosts}
        onBack={() => setReviewedPosts(false)}
      />
    );
  }

  if (viewGalleryPosts) {
    return (
      <PostReviewDisplay
        posts={galleryPosts}
        onBack={() => setViewGalleryPosts(false)}
      />
    );
  }

  const isPhoneChanged = settingsData?.userPhone !== editAuthentication?.userPhone;

  
  return (
    <div className="space-y-6 p-4 md:p-6 grow flex flex-col gap-2 text-white">
      <h2 className="text-2xl m-0 font-semibold">User Settings</h2>

      {/* Tabs */}
      <div className="flex border-b border-zinc-700 md:mb-4">
        <button
          className={`px-1.5 md:px-4 py-2 text-lg font-medium cursor-pointer ${
            activeTab === TABS.PROFILE
              ? "border-b-2 border-pink-400 text-pink-400"
              : "text-white hover:text-pink-400"
          }`}
          onClick={() => setActiveTab(TABS.PROFILE)}
        >
          Profile
        </button>
        <button
          className={`px-1.5 md:px-4 py-2 text-lg font-medium cursor-pointer ${
            activeTab === TABS.SETTINGS
              ? "border-b-2 border-pink-400 text-pink-400"
              : "text-white hover:text-pink-400"
          }`}
          onClick={() => setActiveTab(TABS.SETTINGS)}
        >
          Preferences
        </button>
        <button
          className={`px-1.5 md:px-4 py-2 text-lg font-medium cursor-pointer ${
            activeTab === TABS.AUTHENTICATION
              ? "border-b-2 border-pink-400 text-pink-400"
              : "text-white hover:text-pink-400"
          }`}
          onClick={() => setActiveTab(TABS.AUTHENTICATION)}
        >
          Authentication
        </button>
        <button
          className={`px-1.5 md:px-4 py-2 text-lg font-medium cursor-pointer ${
            activeTab === TABS.USAGE_INFORMATION
              ? "border-b-2 border-pink-400 text-pink-400"
              : "text-white hover:text-pink-400"
          }`}
          onClick={() => setActiveTab(TABS.USAGE_INFORMATION)}
        >
          Usage Information
        </button>
        {
          userHasAdminPermission && (
          <button
            className={`px-1.5 md:px-4 py-2 text-lg font-medium cursor-pointer ${
              activeTab === TABS.SUBSCRIPTION
                ? "border-b-2 border-pink-400 text-pink-400"
                : "text-white hover:text-pink-400"
            }`}
            onClick={() => setActiveTab(TABS.SUBSCRIPTION)}
          >
            Subscription
          </button>
          )
        }
      </div>

      {/* Content */}
      {activeTab === TABS.PROFILE && (
        <div className="w-full space-y-6">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {error && <p className="text-red-400 mb-4">{error}</p>}

              {/* Profile Information Section */}
              <div className="bg-zinc-950/30 border border-solid border-zinc-700 backdrop-blur-2xl p-6 rounded-lg shadow-white shadow-3xl">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-lg font-medium">Email:</label>
                    <p className="text-zinc-300">{user?.email || "Not set"}</p>
                  </div>
                  <div>
                    <label className="block mb-2 text-lg font-medium">Full Name:</label>
                    {isEditingProfile ? (
                      <Input
                        type="text"
                        name="full_name"
                        value={profileData.full_name}
                        onChange={handleProfileChange}
                        className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                      />
                    ) : (
                      <p className="text-zinc-300">{user?.full_name || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-lg font-medium">Nick Name:</label>
                    {isEditingProfile ? (
                      <Input
                        type="text"
                        name="nick_name"
                        value={profileData.nick_name}
                        onChange={handleProfileChange}
                        className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                      />
                    ) : (
                      <p className="text-zinc-300">{user?.nick_name || "Not set"}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {isEditingProfile ? (
                      <>
                        <Button
                          variant={'dg_btn'}
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          className=" text-white font-semibold py-2 px-4"
                        >
                          {savingProfile ? "Saving..." : "Save Profile"}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileData({
                              full_name: user?.full_name || "",
                              nick_name: user?.nick_name || ""
                            });
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant={'dg_btn'}
                        onClick={() => setIsEditingProfile(true)}
                        className="text-white font-semibold py-2 px-4"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Section */}
              <div className="flex flex-wrap gap-6">
                <div className=" w-full lg:w-5/12 grow bg-zinc-950/30 border border-solid border-zinc-700 backdrop-blur-2xl p-6 rounded-lg shadow-white shadow-3xl">
                  <h3 className="text-lg font-semibold mb-4 text-pink-400">Email</h3>
                  
                  <div className="space-y-4">
                    <div>
                      {isEditingEmail ? (
                        <Input
                          type="email"
                          name="email"
                          value={emailData.email}
                          onChange={handleEmailChange}
                          className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                        />
                      ) : (
                        <p className="text-zinc-300">{user?.email}</p>
                      )}
                    </div>

                    {isEditingEmail && (
                      <>
                        {otpSent && (
                          <div className="mt-4">
                            <label className="block mb-2 text-lg font-medium">Enter OTP:</label>
                            <Input
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="Enter OTP"
                              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                            />

                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-lg text-gray-400">
                                Time left: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
                              </p>
                              <Button
                                variant={'dg_btn'}
                                onClick={handleResendOtp}
                                disabled={timer > 0}
                                className=" text-white font-semibold py-1 px-3"
                              >
                                Resend OTP
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex gap-2 pt-2">
                      {isEditingEmail ? (
                        <>
                          <Button
                            variant={'dg_btn'}
                            onClick={handleSaveEmail}
                            disabled={
                              savingEmail || !isEmailChanged || (otpSent && !otp)
                            }
                            className=" text-white font-semibold py-2 px-4"
                          >
                            {savingEmail ? (otpSent ? "Verifying..." : "Sending OTP...") : otpSent ? "Verify & Update Email" : "Send OTP"}
                          </Button>

                          <Button
                            onClick={() => {
                              setIsEditingEmail(false);
                              setEmailData({
                                email: user?.email || "",
                                password: ""
                              });
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant={'dg_btn'}
                          onClick={() => setIsEditingEmail(true)}
                          className=" text-white font-semibold py-2 px-4"
                        >
                          Change Email
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="w-full lg:w-5/12 grow bg-zinc-950/30 border border-solid border-zinc-700 backdrop-blur-2xl p-6 rounded-lg shadow-white shadow-3xl">
                  <h3 className="text-lg font-semibold mb-4 text-pink-400">Password</h3>
                  
                  <div className="space-y-4">
                    {isEditingPassword ? (
                      <>
                        {["current_password", "new_password", "confirm_password"].map((field, idx) => (
                          <div key={idx}>
                            <label className="block mb-2 text-lg font-medium">
                              {field === "current_password"
                                ? "Current Password"
                                : field === "new_password"
                                ? "New Password"
                                : "Confirm New Password"}
                            </label>
                            <div className="relative">
                              <Input
                                type={showPassword[field] ? "text" : "password"}
                                name={field}
                                value={passwordData[field]}
                                onChange={handlePasswordChange}
                                placeholder={`Enter your ${field.replace("_", " ")}`}
                                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                                onClick={() => toggleShowPassword(field)}
                              >
                                {showPassword[field] ? <FaEye size={18} /> : <FaEyeSlash size={18} />}
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* OTP Input */}
                        {otpSent && (
                          <div className="mt-4">
                            <label className="block mb-2 text-lg font-medium">Enter OTP:</label>
                            <Input
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="Enter OTP"
                              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                            />

                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-lg text-gray-400">
                                Time left: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
                              </p>
                              <Button
                                variant={'dg_btn'}
                                onClick={handleResendPasswordOtp}
                                disabled={timer > 0}
                                className=" text-white font-semibold py-1 px-3"
                              >
                                Resend OTP
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant={'dg_btn'}
                            onClick={handleSavePassword}
                            disabled={
                              savingPassword ||
                              !passwordData.current_password ||
                              !passwordData.new_password ||
                              !passwordData.confirm_password ||
                              (otpSent && !otp)
                            }
                            className=" text-white font-semibold py-2 px-4"
                          >
                            {savingPassword
                              ? otpSent
                                ? "Verifying..."
                                : "Sending OTP..."
                              : otpSent
                              ? "Verify & Update Password"
                              : "Send OTP"}
                          </Button>
                          <Button
                            onClick={() => {
                              setIsEditingPassword(false);
                              setPasswordData({
                                current_password: "",
                                new_password: "",
                                confirm_password: "",
                              });
                              setOtp("");
                              setOtpSent(false);
                              setTimer(0);
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-zinc-300 mb-4">********</p>
                        <Button
                          variant={'dg_btn'}
                          onClick={() => setIsEditingPassword(true)}
                          className=" text-white font-semibold py-2 px-4"
                        >
                          Change Password
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {activeTab === TABS.SETTINGS && (
        <div className="bg-zinc-950/30 border border-solid border-zinc-700 backdrop-blur-2xl p-6 rounded-lg shadow-white shadow-3xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-pink-400">User Preferences</h3>
            {!isEditingPreferences && (
              <Button
                variant="dg_btn"
                onClick={handleEditPreferences}
                className="text-white font-semibold py-1 px-3"
              >
                Edit
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Google Login */}
            <div className="flex justify-between items-center">
              <span>Google Login Enabled</span>
              <Switch
                checked={isEditingPreferences ? editSettings.googleLoginEnabled : settingsData.googleLoginEnabled}
                onCheckedChange={(val) => isEditingPreferences && handleSettingChange("googleLoginEnabled", val, 'settings')}
                disabled={!isEditingPreferences}
              />
            </div>
            {/* <div className="flex justify-between items-center">
              <span>Keep Me Logged In from this device</span>
              <Switch
                checked={isEditingPreferences ? editSettings.keepMeLoggedIn : settingsData.keepMeLoggedIn}
                onCheckedChange={(val) => isEditingPreferences && handleSettingChange("keepMeLoggedIn", val, 'settings')}
                disabled={!isEditingPreferences}
              />
            </div> */}

            <div className="flex justify-between items-center">
              <span>Analytics Consent</span>
              <Switch
                checked={isEditingPreferences ? editSettings.analyticsConsent : settingsData.analyticsConsent}
                onCheckedChange={(val) => isEditingPreferences && handleSettingChange("analyticsConsent", val, 'settings')}
                disabled={!isEditingPreferences}
              />
            </div>

            <div className="flex justify-between items-center">
              <span>Marketing Consent</span>
              <Switch
                checked={isEditingPreferences ? editSettings.marketingConsent : settingsData.marketingConsent}
                onCheckedChange={(val) => isEditingPreferences && handleSettingChange("marketingConsent", val, 'settings')}
                disabled={!isEditingPreferences}
              />
            </div>

            <div className="flex justify-between items-center">
              <span>Functional Consent</span>
              <Switch
                checked={isEditingPreferences ? editSettings.functionalConsent : settingsData.functionalConsent}
                onCheckedChange={(val) => isEditingPreferences && handleSettingChange("functionalConsent", val, 'settings')}
                disabled={!isEditingPreferences}
              />
            </div>

            <div className="flex justify-between items-center">
              <span>Session Timeout (minutes)</span>
              <Input
                type="number"
                min={5}
                max={300}
                value={isEditingPreferences ? editSettings.sessionTimeoutLength : settingsData.sessionTimeoutLength}
                onChange={(e) => isEditingPreferences && handleSettingChange("sessionTimeoutLength", parseInt(e.target.value) || 0, 'settings')}
                className="w-24 text-center bg-zinc-800 border border-zinc-700"
                disabled={!isEditingPreferences}
              />
            </div>

            <div className="flex justify-between items-center">
              <span>Allow User Data for Model Tuning</span>
              <Switch
                checked={isEditingPreferences ? editSettings.allowUserDataTuning : settingsData.allowUserDataTuning}
                onCheckedChange={(val) => isEditingPreferences && handleSettingChange("allowUserDataTuning", val, 'settings')}
                disabled={!isEditingPreferences}
              />
            </div>

            <div className="flex justify-between items-center">
              <span>Email Notifications</span>
              <Switch
                checked={isEditingPreferences ? editSettings.emailNotifications : settingsData.emailNotifications}
                onCheckedChange={(val) => isEditingPreferences && handleSettingChange("emailNotifications", val, 'settings')}
                disabled={!isEditingPreferences}
              />
            </div>

            {/* <div className="flex justify-between items-center">
              <span>Show "How it Works" Pop-up</span>
              <Switch
                checked={isEditingPreferences ? editSettings.howItWorksPopup : settingsData.howItWorksPopup}
                onCheckedChange={(val) => isEditingPreferences && handleSettingChange("howItWorksPopup", val, 'settings')}
                disabled={!isEditingPreferences}
              />
            </div> */}
            <div className="flex justify-between items-center">
              <span>Delete All User Data stored for Model Tuning</span>
              <Switch
                checked={isEditingPreferences ? editSettings.deleteUserDataForTuning : settingsData.deleteUserDataForTuning}
                onCheckedChange={(val) => isEditingPreferences && handleSettingChange("deleteUserDataForTuning", val, 'settings')}
                disabled={!isEditingPreferences}
              />
            </div>
          </div>

          {isEditingPreferences && (
            <div className="flex gap-2 pt-4">
              <Button
                variant="dg_btn"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="text-white font-semibold py-2 px-4"
              >
                {savingSettings ? "Saving..." : "Save Preferences"}
              </Button>
              <Button
                onClick={handleCancelPreferences}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === TABS.AUTHENTICATION && (
        <div className="bg-zinc-950/30 border border-solid border-zinc-700 backdrop-blur-2xl p-6 rounded-lg shadow-white shadow-3xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-pink-400">Authentication Settings</h3>
            {!isEditingAuthentication && (
              <Button
                variant="dg_btn"
                onClick={handleEditAuthentication}
                className="text-white font-semibold py-1 px-3"
              >
                Edit
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span>Allow 2-Factor Authentication via Phone</span>
              <Switch
                checked={isEditingAuthentication ? editAuthentication.allow2FA : settingsData.allow2FA}
                onCheckedChange={(val) => isEditingAuthentication && handleSettingChange("allow2FA", val, 'authentication')}
                disabled={!isEditingAuthentication}
              />
            </div>

            {(isEditingAuthentication ? editAuthentication.allow2FA : settingsData.allow2FA) && (
              <>
                <div>
                  <label className="block mb-2 text-lg font-medium">Phone Number:</label>
                  {isEditingAuthentication ? (
                    <Input
                      type="tel"
                      name="userPhone"
                      value={editAuthentication.userPhone || ""}
                      onChange={(e) => handleSettingChange("userPhone", e.target.value, 'authentication')}
                      className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-zinc-300">{settingsData.userPhone || "Not set"}</p>
                      {settingsData.phoneVerified && (
                        <span className="text-green-400 text-lg">✓ Verified</span>
                      )}
                    </div>
                  )}
                </div>

                {editAuthentication.userPhone && isEditingAuthentication && otpSent && (
                  <div>
                    <label className="block mb-2 text-lg font-medium">Verification Code:</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        name="verificationCode"
                        value={editAuthentication.verificationCode || ""}
                        onChange={(e) => handleSettingChange("verificationCode", e.target.value, 'authentication')}
                        className="flex-1 p-2 rounded bg-zinc-800 border border-zinc-700"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                      />
                      <Button
                        variant="dg_btn"
                        onClick={handleSendPhoneOTP}
                        disabled={!editAuthentication.userPhone || timer > 0}
                        className="py-2 px-4 border border-zinc-700"
                      >
                        {timer > 0 ? `Resend (${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")})` : "Resend"}
                      </Button>
                    </div>
                    <p className="text-lg text-yellow-400 mt-2">
                      Enter the code sent to your phone and click Save
                    </p>
                  </div>
                )}
                
                {editAuthentication.userPhone && isEditingAuthentication && !otpSent && isPhoneChanged && (
                  <div>
                    <Button
                      variant="dg_btn"
                      onClick={handleSendPhoneOTP}
                      disabled={!editAuthentication.userPhone || timer > 0}
                      className="text-white font-semibold py-2 px-4"
                    >
                      {timer > 0 ? `Resend OTP (${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")})` : "Send Verification Code"}
                    </Button>
                    <p className="text-lg text-yellow-400 mt-2">
                      Verification required for new phone number
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {isEditingAuthentication && (
            <div className="flex gap-2 pt-4">
              <Button
                variant="dg_btn"
                onClick={handleSaveAuthenticationSettings}
                disabled={
                  savingAuthentication || 
                  (isPhoneChanged && editAuthentication.allow2FA && otpSent && !editAuthentication.verificationCode) ||
                  (isPhoneChanged && editAuthentication.allow2FA && !otpSent && editAuthentication.userPhone)
                }
                className="text-white font-semibold py-2 px-4"
              >
                                {savingAuthentication ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleCancelAuthentication}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === TABS.USAGE_INFORMATION && (
        <div className="bg-zinc-950/30 border border-solid border-zinc-700 backdrop-blur-2xl p-6 rounded-lg shadow-white shadow-3xl space-y-6">
          <div className="flex justify-between items-center mb-0">
            <h3 className="text-lg font-semibold text-pink-400 mb-4">Usage Information</h3>
            {!isEditingUsageInfo && (
              <Button
                variant="dg_btn"
                onClick={handleEditUsageInfo}
                className="text-white font-semibold py-1 px-3"
              >
                Edit
              </Button>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-lg font-medium mb-2">What are you using DesignGenie for:</label>
              {isEditingUsageInfo ? (
                <textarea
                  name="usagePurpose"
                  value={editUsageInfo.usagePurpose || ""}
                  onChange={(e) => handleSettingChange("usagePurpose", e.target.value, 'usageInfo')}
                  className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                  rows={4}
                  placeholder="Describe what you are using DesignGenie for"
                />
              ) : (
                <p className="text-zinc-300 whitespace-pre-wrap">{settingsData.usagePurpose || "Not set"}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="block text-lg font-medium">Start Credits:</label>
                <FaCoins className="text-yellow-500" />
              <p>{userCredits?.startCredits || 0}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="block text-lg font-medium">Used Credits:</label>
               <FaCoins className="text-yellow-500" />
              <p>{userCredits?.credits_used || 0}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-lg font-medium">My Review Posts:</label>

              {reviewPosts?.length > 0 ? (
                <Button
                  variant={"dg_btn"}
                  onClick={() => setReviewedPosts(true)}
                  className="px-4 py-2"
                >
                  View All
                </Button>
              ) : (
                <span className="text-zinc-400">No review posts available</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-lg font-medium">My Gallery Posts:</label>
              {galleryPosts?.length > 0 ? (
                <Button
                variant={"dg_btn"}
                  onClick={() => setViewGalleryPosts(true)}
                  className="px-4 py-2"
                >
                  View All
                </Button>
              ) : (
                <span className="text-zinc-400">No gallery posts available</span>
              )}
            </div>

            {/* <div>
              <label className="block text-lg font-medium mb-2">My How it Works Comments:</label>
              {settingsData.howItWorksComments && settingsData.howItWorksComments.length > 0 ? (
                <ul className="list-disc pl-5 text-zinc-300">
                  {settingsData.howItWorksComments.map((link, idx) => (
                    <li key={idx}>
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-300">No comments</p>
              )}
            </div> */}
          </div>

          {isEditingUsageInfo && (
            <div className="flex gap-2 pt-4">
              <Button
                variant="dg_btn"
                onClick={handleSaveUsageInfo}
                disabled={savingUsageInfo}
                className="text-white font-semibold py-2 px-4"
              >
                {savingUsageInfo ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleCancelUsageInfo}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === TABS.SUBSCRIPTION && (
        // <div className="bg-zinc-950/30 border border-solid border-zinc-700 backdrop-blur-2xl p-6 rounded-lg shadow-white shadow-3xl space-y-6">
        //   <div className="flex justify-between items-center">
        //     <h3 className="text-lg font-semibold text-pink-400">Subscription Details</h3>
        //     {!isEditingSubscription && (
        //       <Button
        //         variant="dg_btn"
        //         onClick={handleEditSubscription}
        //         className="text-white font-semibold py-1 px-3"
        //       >
        //         Edit
        //       </Button>
        //     )}
        //   </div>

        //   <div className="space-y-4">
        //     <div className="flex items-center gap-2">
        //       <span className="text-lg font-medium">Plan Type:</span>
        //       <p className="text-zinc-300">{user?.planType || "Free"}</p>
        //     </div>

        //     <div className="flex items-center gap-2">
        //       <span className="text-lg font-medium">Plan End Date:</span>
        //       <p className="text-zinc-300">{user?.planEnd ? new Date(user.planEnd).toLocaleDateString() : "-"}</p>
        //     </div>

        //     <div className="flex items-center gap-2">
        //       <span className="text-lg font-medium">Billing Status:</span>
        //       <p className="text-zinc-300">{user?.billingStatus || "N/A"}</p>
        //     </div>

        //     <div className="flex justify-between items-center">
        //       <span className="text-lg font-medium">Auto Renewal:</span>
        //       <Switch
        //         checked={isEditingSubscription ? editSubscription.autoRenewal : settingsData.autoRenewal}
        //         onCheckedChange={(val) => isEditingSubscription && handleSettingChange("autoRenewal", val, 'subscription')}
        //         disabled={!isEditingSubscription}
        //       />
        //     </div>

        //     <div className="flex items-center gap-2">
        //       <span className="text-lg font-medium">Last Renewal Date:</span>
        //       <p className="text-zinc-300">
        //         {user?.lastRenewalDate 
        //           ? new Date(user.lastRenewalDate).toLocaleDateString() 
        //           : "-"}
        //       </p>
        //     </div>

        //     <div className="flex items-center gap-2">
        //       <span className="text-lg font-medium">Next Renewal Date:</span>
        //       <p className="text-zinc-300">
        //         {user?.nextRenewalDate 
        //           ? new Date(user.nextRenewalDate).toLocaleDateString() 
        //           : "-"}
        //       </p>
        //     </div>

        //     <div className="flex items-center gap-2">
        //       <span className="text-lg font-medium">Credits Remaining:</span>
        //       <div className="flex items-center gap-1">
        //         <FaCoins className="text-yellow-500" />
        //         <p className="text-yellow-500">{userCredits?.credits ?? 0}</p>
        //       </div>
        //     </div>
        //   </div>

        //   {isEditingSubscription && (
        //     <div className="flex gap-2 pt-4">
        //       <Button
        //         variant="dg_btn"
        //         onClick={handleSaveSubscription}
        //         disabled={savingSubscription}
        //         className="text-white font-semibold py-2 px-4"
        //       >
        //         {savingSubscription ? "Saving..." : "Save"}
        //       </Button>
        //       <Button
        //         onClick={handleCancelSubscription}
        //         className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4"
        //       >
        //         Cancel
        //       </Button>
        //     </div>
        //   )}

        //   {/* Add upgrade/manage subscription button */}
        //   {!isEditingSubscription && (
        //     <div className="pt-4 border-t border-zinc-700">
        //       <Button
        //         variant="dg_btn"
        //         onClick={() => navigate("/pricing")}
        //         className="text-white font-semibold py-2 px-4"
        //       >
        //         Upgrade Plan
        //       </Button>
        //     </div>
        //   )}
        // </div>

        <SubscriptionDetails user={user} />
      )}
    </div>
  );
}
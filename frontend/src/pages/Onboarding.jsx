import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InputField from "../components/InputField.jsx";
import Button from "../components/Button.jsx";
import { onboardTenant } from "../features/onboarding/onboardingService.js";
import { useApiRequest } from "../hooks/useApiRequest.js";
import { toast } from "react-hot-toast";
import logo from "../assets/images/dg-logo.png";
import { GoOrganization } from "react-icons/go";
import { FaIndustry, FaMinus } from "react-icons/fa";
import { MdPerson, MdCheck } from "react-icons/md";
import { EmailIcon, PasswordIcon } from "../utils/icons.jsx";
import PasswordField from "@/components/Common/PasswordField.jsx";
import PrivacyAndDataPolicy from "./terms_and_conditions/PrivacyAndDataPolicy";
import PrivacyPolicyNotification from "./terms_and_conditions/PrivacyPolicyNotification";
import TermsAndConditions from "./terms_and_conditions/TermsAndConditions.jsx";
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from "@/api/axios";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Onboarding() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	
	// Get view from query parameter, default to "onboarding" if not present
	const getInitialView = () => {
		const view = searchParams.get('view');
		const validViews = ['privacy-notification', 'privacy-policy', 'terms-and-conditions', 'google-details'];
		return validViews.includes(view) ? view : 'onboarding';
	};

	const [currentView, setCurrentView] = useState(getInitialView());
	const [isPasswordStrong, setIsPasswordStrong] = useState(false);
	const [form, setForm] = useState({
		account_type: "company", // new field
		tenant_name: "",
		industry_type: "",
		subscription_frequency: "monthly",
		full_name: "",
		email: "",
		password: "",
		confirm_password: "",
	});
	const [globalAI, setGlobalAI] = useState(false);
	const [personalizedAI, setPersonalizedAI] = useState(false);
	const [check1, setCheck1] = useState(false);
	const [check2, setCheck2] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	
	// Google-specific state
	const [googleCredential, setGoogleCredential] = useState(null);
	const [googleUserData, setGoogleUserData] = useState(null);
	const [googleDetailsForm, setGoogleDetailsForm] = useState({
		account_type: "company",
		tenant_name: "",
		industry_type: "",
	});
	
	const { sendRequest, loading, error, fieldErrors } = useApiRequest();

	useEffect(() => {
		setCurrentView(getInitialView());
	}, [searchParams]);

	// Update URL when view changes
	const handleViewChange = (newView) => {
		if (newView === 'onboarding') {
			// Remove the view param when going back to onboarding
			searchParams.delete('view');
			setSearchParams(searchParams);
		} else {
			// Set the view param for other views
			setSearchParams({ ...Object.fromEntries(searchParams), view: newView });
		}
		setCurrentView(newView);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
	};

	const handleGoogleDetailsChange = (e) => {
		const { name, value } = e.target;
		setGoogleDetailsForm(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		console.log("%c[SIGNUP] 🔹 Form submission started", "color: #4CAF50; font-weight: bold;");
		console.log("[SIGNUP] Current form data:", JSON.parse(JSON.stringify(form)));

		// VALIDATION
		console.log("[VALIDATION] Checking required fields...");
		if (
			!form.email ||
			!form.password ||
			!form.confirm_password ||
			!form.full_name ||
			(form.account_type === "company" && !form.tenant_name)
		) {
			console.warn("[VALIDATION] ❌ Missing required fields");
			toast.error("All required fields must be filled.");
			return;
		}

	console.log("[VALIDATION] Checking password strength...");
	if (!isPasswordStrong) {
		console.warn("[VALIDATION] ❌ Weak password entered.");
		toast.error("Password must follow the mentioned criteria.");
		return;
	}

	console.log("[VALIDATION] Checking password match...");
	if (form.password !== form.confirm_password) {
		console.warn("[VALIDATION] ❌ Passwords do not match.");
		toast.error("Passwords do not match.");
		return;
	}

		// PAYLOAD
		const payload = {
			tenant: {
				name: form.account_type === "company" ? form.tenant_name : form.email,
				industry_type: form.industry_type,
				subscription_frequency: form.subscription_frequency,
				account_type: form.account_type,
			},
			admin_user: {
				full_name: form.full_name,
				email: form.email,
				password: form.password,
			},
		};

	console.log("%c[PAYLOAD] ✅ Payload ready to send:", "color: #2196F3; font-weight: bold;", payload);

	// ===== API REQUEST =====
	console.log("[API] Sending payload to onboardTenant service...");
	const result = await sendRequest(onboardTenant, payload);

	if (!result) {
		console.error("[API] ❌ No response or request failed.");
		toast.error("Failed to sign up.");
		return;
	}

	console.log("%c[BACKEND RESPONSE] ✅ Response received:", "color: #9C27B0; font-weight: bold;", result);

	const { tempUser, message, resume, next_stage, next_stage_url } = result;

	// ===== UX / MESSAGES =====
	if (resume && next_stage === "verify_email") {
		console.log("[UX] 📨 User resuming at verify_email stage.");
		toast.success(message || "Registration in progress. Verification email resent.");
	} else if (resume && next_stage === "subscription_selection") {
		console.log("[UX] 💳 User resuming at subscription_selection stage.");
		toast.success(message || "Registration found. Continue to select a plan.");
	} else {
		console.log("[UX] 🆕 Fresh registration detected.");
		toast.success(message || "Signed up! Please verify your email.");
	}

	// ===== GTM EVENT =====
	console.log("[GTM] 🔄 Pushing signup_success event to dataLayer.");
	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push({ event: "signup_success" });

	// ===== NAVIGATION DECISION =====
	console.log("[NAVIGATION] Determining next stage...");
	const safeNextStage = next_stage || (tempUser?.is_verified ? "subscription_selection" : "verify_email");

	console.log("[NAVIGATION] Computed safeNextStage:", safeNextStage);
	console.log("[NAVIGATION] tempUser info:", tempUser);

	if (safeNextStage === "verify_email") {
		const verifyUrl = next_stage_url || `/verify-otp?email=${tempUser.email}`;
		console.log(`[NAVIGATION] 📧 Redirecting to Verify Email page: ${verifyUrl}`);
		navigate(verifyUrl);
	} else {
		const subscriptionUrl = next_stage_url || `/onboarding/subscriptions?temp_id=${tempUser.id}`;
		console.log(`[NAVIGATION] 💼 Redirecting to Subscription page: ${subscriptionUrl}`);
		navigate(subscriptionUrl);
	}

		console.log("%c[SIGNUP] ✅ Flow completed successfully", "color: #00C853; font-weight: bold;");
	};

	// Step 1: Handle Google OAuth response
	const handleGoogleSignup = async (credentialResponse) => {
    console.log("%c[GOOGLE SIGNUP] 🔹 Step 1: OAuth completed", "color: #4285F4; font-weight: bold;");
    
    setGoogleLoading(true);
    
    try {
        // Decode Google credential to get user info
        const decoded = jwtDecode(credentialResponse.credential);
        console.log("[GOOGLE] Decoded user:", { email: decoded.email, name: decoded.name });

        // Check if user already exists
        console.log("[GOOGLE] Checking if user exists...");
        
        try {
            // Send the Google token to check if user exists
            const checkResponse = await api.post('/onboarding/google/check', {
                googleToken: credentialResponse.credential,
                email: decoded.email
            });

            // If we get here and user exists, the backend should return appropriate response
            if (checkResponse.data?.userExists) {
                console.log("[GOOGLE] User already exists!");
                toast.error('An account with this email already exists. Please login with Google instead.');
                
                return; // Stop here, don't show the profile form
            }
            
            // If user doesn't exist, continue with the flow
            console.log("[GOOGLE] User does not exist, proceeding to profile completion...");
            
        } catch (checkError) {            
            // For other errors, you might want to handle them differently
            if (checkError.response?.status !== 404) {
                console.error('[GOOGLE] Error checking user:', checkError);
                toast.error('Failed to verify account. Please try again.');
                setGoogleLoading(false);
                return;
            }
            
            // 404 means user doesn't exist, which is what we want for signup
            console.log("[GOOGLE] User does not exist (404), continuing...");
        }

        // Store credential and user data only if user doesn't exist
        setGoogleCredential(credentialResponse.credential);
        setGoogleUserData({
            email: decoded.email,
            full_name: decoded.name,
            google_Id: decoded.sub,
        });

        // Navigate to Google details collection page
        handleViewChange('google-details');
        
    } catch (error) {
        console.error('[GOOGLE SIGNUP] ❌ Error:', error);
        toast.error('Failed to process Google sign-in. Please try again.');
    } finally {
        setGoogleLoading(false);
    }
};

	// Step 2: Submit Google signup with collected details
	const handleGoogleDetailsSubmit = async (e) => {
    e.preventDefault();
    console.log("%c[GOOGLE SIGNUP] 🔹 Step 2: Submitting details", "color: #4285F4; font-weight: bold;");
    
    setGoogleLoading(true);
    
    try {
        // Validate required fields
        if (googleDetailsForm.account_type === "company" && !googleDetailsForm.tenant_name) {
            toast.error("Please enter a company name");
            setGoogleLoading(false);
            return;
        }

        // Prepare payload
        const payload = {
            tenant: {
                name: googleDetailsForm.account_type === "company" 
                    ? googleDetailsForm.tenant_name 
                    : googleUserData.email,
                industry_type: googleDetailsForm.industry_type || "",
                subscription_frequency: "monthly",
                account_type: googleDetailsForm.account_type,
            },
            googleToken: googleCredential,
        };

        console.log("[GOOGLE] Sending payload to backend:", payload);

        // Send to backend
        const response = await api.post('/onboarding/google', payload);

        if (response.status !== 201) {
            throw new Error('Google signup failed');
        }

        const { data } = response.data;
        console.log("%c[GOOGLE RESPONSE] ✅ Success:", "color: #34A853; font-weight: bold;", data);

        const { tempUser, message, next_stage, next_stage_url } = data;

        toast.success(message || "Google sign-up successful!");

        // GTM EVENT
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "signup_success", method: "google" });

        // Navigate to subscription selection (Google users skip email verification)
        const subscriptionUrl = next_stage_url || `/onboarding/subscriptions?temp_id=${tempUser.id}`;
        console.log(`[NAVIGATION] 💼 Redirecting to: ${subscriptionUrl}`);
        navigate(subscriptionUrl);

    } catch (error) {
        console.error('[GOOGLE SIGNUP] ❌ Error:', error);
        
        // Check if the error is due to existing user
        if (error.response?.status === 409 || error.response?.data?.message?.toLowerCase().includes('already exists')) {
            toast.error('An account with this email already exists. Please login instead.');
            
            // Reset Google state
            setGoogleCredential(null);
            setGoogleUserData(null);
            setGoogleDetailsForm({
                account_type: "company",
                tenant_name: "",
                industry_type: "",
            });
            
            // Navigate back to main form or to login
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            toast.error(error.response?.data?.message || 'Google sign-up failed. Please try again.');
        }
    } finally {
        setGoogleLoading(false);
    }
};

	const handleGoogleError = () => {
		console.error('[GOOGLE SIGNUP] ❌ Google authentication failed');
		toast.error('Google sign-up failed. Please try again.');
	};

const getCheckboxIcon = () => {
		if (personalizedAI && globalAI && check1 && check2) {
			return <MdCheck className="text-white" size={16} />;
		} else if (!personalizedAI && !globalAI && !check1 && !check2) {
			return null;
		} else {
			return <FaMinus className="text-white" size={12} />;
		}
	};

	const isMainCheckboxChecked = personalizedAI || globalAI || check1 || check2;
	const agreedToTerms = personalizedAI || globalAI || check1 || check2;

	const handleMainCheckboxChange = (checked) => {
		setPersonalizedAI(checked);
		setGlobalAI(checked);
		setCheck1(checked);
		setCheck2(checked);
	};

	// Handle navigation back to onboarding
	const handleNavigateBack = () => {
		// Reset Google state when going back
		setGoogleCredential(null);
		setGoogleUserData(null);
		setGoogleDetailsForm({
			account_type: "company",
			tenant_name: "",
			industry_type: "",
		});
		handleViewChange('onboarding');
	};

	if (currentView === "privacy-notification") {
		return (
			<PrivacyPolicyNotification
				check1={check1}
				setCheck1={setCheck1}
				check2={check2}
				setCheck2={setCheck2}
				isFooterLink={false}
				onNavigateBack={handleNavigateBack}
			/>
		);
	}

	if (currentView === "privacy-policy") {
		return (
			<PrivacyAndDataPolicy
				globalAI={globalAI}
				setGlobalAI={setGlobalAI}
				personalizedAI={personalizedAI}
				setPersonalizedAI={setPersonalizedAI}
				isFooterLink={false}
				onNavigateBack={handleNavigateBack}
			/>
		);
	}

	if (currentView === "terms-and-conditions") {
		return (
			<TermsAndConditions
				onNavigateBack={handleNavigateBack}
			/>
		);
	}

	// Google Details Collection View
	if (currentView === "google-details") {
		return (
			<div className="min-h-screen flex flex-wrap text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-72 before:-right-1/5 dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-1/5 dg-footer p-4">
				<div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-10 relative">
					<img src={logo} alt="" className="absolute opacity-20 w-full lg:w-2/3 h-auto blur-xs" />
					<img src={logo} alt="Design Genie Logo" className="w-48 xl:w-1/3 h-auto relative z-10" />
				</div>

				<div className="w-full sm:w-lg mx-auto xl:mx-0 xl:w-1/2 flex items-start lg:items-center lg:justify-center">
					<div className="relative z-10 rdg-testimonial-card p-4 md:px-6 2xl:p-8 2xl:py-9 border-2 border-solid border-white rounded-2xl border-shadow-blur w-full lg:max-w-md max-w-full">
						<h2 className="text-2xl 2xl:text-3xl font-bold mb-2 text-center">Complete Your Profile</h2>
						<p className="text-center text-gray-400 text-sm mb-4">
							Welcome, {googleUserData?.full_name}! Please provide a few more details.
						</p>
						
						<form onSubmit={handleGoogleDetailsSubmit} className="space-y-3.5 2xl:space-y-4">
							{/* Account Type */}
							<div className="py-1">
								<p className="text-sm mb-2 text-gray-400">Account Type</p>
								<div className="flex items-center gap-4">
									<label className="inline-flex items-center gap-2">
										<input
											type="radio"
											name="account_type"
											value="individual"
											checked={googleDetailsForm.account_type === "individual"}
											onChange={handleGoogleDetailsChange}
											disabled={googleLoading}
											className="text-purple-500 focus:ring-purple-500"
										/>
										<span className="text-sm">Individual</span>
									</label>
									<label className="inline-flex items-center gap-2">
										<input
											type="radio"
											name="account_type"
											value="company"
											checked={googleDetailsForm.account_type === "company"}
											onChange={handleGoogleDetailsChange}
											disabled={googleLoading}
											className="text-purple-500 focus:ring-purple-500"
										/>
										<span className="text-sm">Company</span>
									</label>
								</div>
							</div>

							{/* Company Name - only if company account */}
							{googleDetailsForm.account_type === "company" && (
								<InputField
									icon={<GoOrganization />}
									placeholder="Company Name"
									name="tenant_name"
									value={googleDetailsForm.tenant_name}
									onChange={handleGoogleDetailsChange}
									required
									disabled={googleLoading}
								/>
							)}

							{/* Industry Type */}
							<InputField
								icon={<FaIndustry />}
								placeholder="Industry Type (Optional)"
								name="industry_type"
								value={googleDetailsForm.industry_type}
								onChange={handleGoogleDetailsChange}
								disabled={googleLoading}
							/>

							{/* Email (Read-only, from Google) */}
							<InputField
								icon={EmailIcon}
								placeholder="Email"
								value={googleUserData?.email || ""}
								disabled={true}
								// className=""
							/>

							<div className="pt-2 flex gap-3">
								<Button 
									type="button"
									onClick={handleNavigateBack}
									disabled={googleLoading}
									className="border-2 border-solid border-gray-400 !bg-transparent flex-1 text-white text-center text-base 2xl:text-lg font-medium lg:py-2 lg:p-3 transition-all duration-200 ease-linear h-10 2xl:min-h-12 flex hover:!bg-gray-700 justify-center rounded-3xl"
								>
									Back
								</Button>
								<Button 
									type="submit" 
									loading={googleLoading}
									disabled={googleLoading}
									className="border-2 border-solid border-gray-400 !bg-transparent flex-1 text-white text-center text-base 2xl:text-lg font-medium lg:py-2 lg:p-3 transition-all duration-200 ease-linear h-10 2xl:min-h-12 flex hover:!bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit justify-center rounded-3xl"
								>
									Continue
								</Button>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}

	// Main Onboarding Form
	return (
		<div className="min-h-screen flex flex-wrap text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-72 before:-right-1/5 dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-1/5 dg-footer p-4">
			<div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-10 relative">
				<img src={logo} alt="" className="absolute opacity-20 w-full lg:w-2/3 h-auto blur-xs" />
				<img src={logo} alt="Design Genie Logo" className="w-48 xl:w-1/3 h-auto relative z-10" />
			</div>

			<div className="w-full sm:w-lg mx-auto xl:mx-0 xl:w-1/2 flex items-start lg:items-center lg:justify-center">
				<div className="relative z-10 rdg-testimonial-card p-4 md:px-6 2xl:p-8 2xl:py-9 border-2 border-solid border-white rounded-2xl border-shadow-blur w-full lg:max-w-md max-w-full">
					<h2 className="text-2xl 2xl:text-3xl font-bold mb-2.5 2xl:mb-6 text-center">Sign Up</h2>
					<form onSubmit={handleSubmit} className="space-y-3.5 2xl:space-y-4">
						{/* Radio for Individual / Company */}
						<div className="py-1">
							<p className="text-sm mb-2 text-gray-400">Account Type</p>
							<div className="flex items-center gap-4">
								<label className="inline-flex items-center gap-2">
									<input
										type="radio"
										name="account_type"
										value="individual"
										checked={form.account_type === "individual"}
										onChange={handleChange}
										disabled={loading || googleLoading}
										className="text-purple-500 focus:ring-purple-500"
									/>
									<span className="text-sm">Individual</span>
								</label>
								<label className="inline-flex items-center gap-2">
									<input
										type="radio"
										name="account_type"
										value="company"
										checked={form.account_type === "company"}
										onChange={handleChange}
										disabled={loading || googleLoading}
										className="text-purple-500 focus:ring-purple-500"
									/>
									<span className="text-sm">Company</span>
								</label>
							</div>
						</div>

						{/* Company Name (Tenant Name) */}
						{form.account_type === "company" && (
							<InputField
								icon={<GoOrganization />}
								placeholder="Company Name"
								name="tenant_name"
								value={form.tenant_name}
								onChange={handleChange}
								required
								disabled={loading || googleLoading}
								error={fieldErrors?.tenant_name}
							/>
						)}

						<InputField
							icon={<FaIndustry />}
							placeholder="Industry Type"
							name="industry_type"
							value={form.industry_type}
							onChange={handleChange}
							disabled={loading || googleLoading}
							error={fieldErrors?.industry_type}
						/>

						{/* Subscription frequency */}
						{/* <div className="py-1">
							<p className="text-sm mb-2 text-gray-400">Subscription Frequency</p>
							<div className="flex items-center gap-4">
								<label className="inline-flex items-center gap-2">
									<input
										type="radio"
										name="subscription_frequency"
										value="monthly"
										checked={form.subscription_frequency === "monthly"}
										onChange={handleChange}
										disabled={loading}
										className="text-purple-500 focus:ring-purple-500"
									/>
									<span className="text-sm">Monthly</span>
								</label>
								<label className="inline-flex items-center gap-2">
									<input
										type="radio"
										name="subscription_frequency"
										value="yearly"
										checked={form.subscription_frequency === "yearly"}
										onChange={handleChange}
										disabled={loading}
										className="text-purple-500 focus:ring-purple-500"
									/>
									<span className="text-sm">Yearly</span>
								</label>
							</div>
						</div> */}

						<InputField
							icon={<MdPerson />}
							placeholder="Admin Full Name"
							name="full_name"
							value={form.full_name}
							onChange={handleChange}
							required
							disabled={loading || googleLoading}
							error={fieldErrors?.full_name}
						/>
						<InputField
							icon={EmailIcon}
							placeholder="Admin Email"
							name="email"
							type="email"
							value={form.email}
							onChange={handleChange}
							required
							disabled={loading || googleLoading}
							error={fieldErrors?.email}
						/>
						<PasswordField
							icon={PasswordIcon}
							placeholder="Password"
							name="password"
							type="password"
							value={form.password}
							onChange={handleChange}
							required={true}
							disabled={loading || googleLoading}
							error={fieldErrors?.password}
							setIsPasswordStrong={setIsPasswordStrong}
						/>
						<InputField
							icon={PasswordIcon}
							placeholder="Confirm Password"
							name="confirm_password"
							type="password"
							value={form.confirm_password}
							onChange={handleChange}
							required
							disabled={loading || googleLoading}
							error={fieldErrors?.confirm_password}
						/>
						<div className="flex items-start gap-3 mt-4 pt-2">
							<div className="relative mt-0.5">
								<input
									type="checkbox"
									id="agree-terms"
									checked={isMainCheckboxChecked}
									onChange={(e) => handleMainCheckboxChange(e.target.checked)}
									className="w-5 h-5 text-purple-500 focus:ring-purple-500 rounded cursor-pointer appearance-none border-2 border-gray-400 bg-white/5 checked:bg-purple-600 checked:border-purple-600"
								/>
								{isMainCheckboxChecked && (
									<div className="absolute top-0 left-0 w-5 h-5 flex items-center justify-center pointer-events-none">
										{getCheckboxIcon()}
									</div>
								)}
							</div>
							<label htmlFor="agree-terms" className="text-xs text-gray-400 leading-relaxed">
								I agree to the{" "}
								<span
									onClick={() => handleViewChange("terms-and-conditions")}
									className="text-purple-400 hover:underline cursor-pointer">
									Terms and Conditions
								</span>
								{", "}
								<span
									onClick={() => handleViewChange("privacy-policy")}
									className="text-purple-400 hover:underline cursor-pointer"
								>
									Privacy and Data Collection
								</span>
								{" and "}
								<span
									onClick={() => handleViewChange("privacy-notification")}
									className="text-purple-400 hover:underline cursor-pointer"
								>
									Privacy Policy Notification
								</span>
							</label>
						</div>
						{error && <p className="text-red-400 text-sm">{error}</p>}

						<div className="pt-2">
							<Button 
								type="submit" 
								loading={loading} 
								disabled={!agreedToTerms || loading || googleLoading}
								className={`mx-auto border-2 border-solid border-gray-400 !bg-transparent w-full text-white text-center text-base 2xl:text-lg font-medium lg:py-2 lg:p-3 transition-all duration-200 ease-linear h-10 2xl:min-h-12 flex hover:!bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit justify-center rounded-3xl ${!agreedToTerms ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								Sign Up
							</Button>
						</div>

						{/* Divider */}
						<div className="relative flex items-center py-2">
							<div className="flex-grow border-t border-gray-600"></div>
							<span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
							<div className="flex-grow border-t border-gray-600"></div>
						</div>
							<div className={`w-full ${!agreedToTerms ? 'opacity-50 pointer-events-none' : ''}`}>
								<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
									<div className="flex justify-center">
										{googleLoading ? (
											<div className="w-full h-10 flex items-center justify-center">
												<span className="text-gray-400">Checking account...</span>
											</div>
										) : (
											<GoogleLogin
												onSuccess={handleGoogleSignup}
												onError={handleGoogleError}
												useOneTap={false}
												text="signup_with"
												width="100%"
												disabled={!agreedToTerms || loading || googleLoading}
											/>
										)}
									</div>
								</GoogleOAuthProvider>
								{!agreedToTerms && (
									<p className="text-xs text-white text-center mt-2">
										Please agree to terms and conditions to continue
									</p>
								)}
							</div>

						<p className="text-center text-gray-400 mt-2">
							Already have an account?{" "}
							<span onClick={() => navigate("/login")} className="text-purple-400 hover:underline cursor-pointer">Login</span>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}

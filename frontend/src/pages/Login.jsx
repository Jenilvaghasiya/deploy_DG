import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { fetchUserProfile, fetchUserProfileWithToken, login } from "../features/auth/authService";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-hot-toast";
import logo from "../assets/images/dg-logo.png";
import { MdOutlineShield } from "react-icons/md";
import { EmailIcon, PasswordIcon } from "../utils/icons";
import { connectSocket } from "@/hooks/useSocket";
import { FaGoogle } from "react-icons/fa";
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from "@/api/axios";
import axios from "axios";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function LoginPage() {
	const navigate = useNavigate();
	const setAuth = useAuthStore((state) => state.setAuth);
	const setCredits = useAuthStore((state) => state.setCredits);

	const [form, setForm] = useState({ email: "", password: "" });
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [show2FA, setShow2FA] = useState(false);
	const [otpCode, setOtpCode] = useState("");
	const [maskedPhone, setMaskedPhone] = useState("");
	const [verifying2FA, setVerifying2FA] = useState(false);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
		// Clear errors when user starts typing
		if (errors[e.target.name]) {
			setErrors({ ...errors, [e.target.name]: "" });
		}
	};

	const validate = () => {
		const newErrors = {};

		if (!form.email) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(form.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!form.password) {
			newErrors.password = "Password is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validate()) return;

		setLoading(true);

		try {
			// Get the login token
			const { token } = await login(form);
			
			// Fetch user profile with the token (don't set auth state yet)
			const { user, userCredits,sessionTimeoutLength } = await fetchUserProfileWithToken(token); // Pass token if needed
			// Only set auth state once with complete data
			setAuth(token, user,sessionTimeoutLength);
			setCredits(userCredits);
			
			// Connect socket after everything is set
			connectSocket(user);
			
			toast.success("Login successful!");
			navigate("/user-projects");

		} catch (err) {
			// Clear any partial auth state on error
			setAuth(null, null);
			
			if (err.code === 403 && err.email) {
				toast("Verify your email first!", { icon: "⚠️" });
				navigate(`/verify-otp?email=${err.email}`);
			}else if (err.code === 406) {
				// 2FA required
				setShow2FA(true);
				setMaskedPhone(err.data?.phoneNumber || "");
				toast("Please enter the verification code sent to your phone", { icon: "📱" });
			}else {
				console.log("Login error:", err);
				toast.error(err.message || "Login failed");
				
				// Set field-specific errors if available
				if (err.errors) {
					setErrors(err.errors);
				}
			}
		} finally {
			setLoading(false);
		}
	};

const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    try {
        // Decode the credential to get user info
        const decoded = jwtDecode(credentialResponse.credential);
        
        // Send the Google token to your backend
         const response = await api.post('/auth/google-login',{  
				googleToken: credentialResponse.credential,
			 },
      	);

        if (response.status !== 200) {
            throw new Error('Google login failed');
        }

        const token = response.data.data.token;
        
        // Use your existing auth flow
        const { user, userCredits } = await fetchUserProfileWithToken(token);
        
        // Set auth state
        setAuth(token, user);
        setCredits(userCredits);
        
        // Connect socket
        connectSocket(user);
        
        toast.success("Login successful!");
        navigate("/user-projects");
        
    } catch (error) {
        console.error('Google login error:', error);
        toast.error(error.response.data.data || 'Google login failed. Please try again.');
    } finally {
        setLoading(false);
    }
};

const handleGoogleError = () => {
    alert('Google login failed. Please try again.');
};
	
	const handle2FAVerification = async (e) => {
		e.preventDefault();
		
		if (!otpCode || otpCode.length !== 6) {
			toast.error("Please enter a valid 6-digit code");
			return;
		}

		setVerifying2FA(true);

		try {
			const { token } = await login({
				email: form.email,
				password: form.password,
				otp: otpCode, // <-- add OTP here
			});

			const { user, userCredits } = await fetchUserProfileWithToken(token);
			// Set auth state
			setAuth(token, user);
			setCredits(userCredits);

			// Connect socket
			connectSocket(user);

			toast.success("Login successful!");
			navigate("/user-projects");
		} catch (error) {
			console.error("2FA verification error:", error);
			toast.error(error.response?.data?.message || "Invalid verification code");
			setOtpCode("");
		} finally {
			setVerifying2FA(false);
		}
	};

	const handleResend2FA = async () => {
		setLoading(true);
		try {
			// Retry login to resend OTP
			await login(form);
		} catch (err) {
			if (err.code === 406) {
				toast.success("New verification code sent!");
			}
		} finally {
			setLoading(false);
		}
	};

	// OLD CODE BACKUP
	// 	const handleSubmit = async (e) => {
	// 	e.preventDefault();

	// 	if (!validate()) return;

	// 	setLoading(true);

	// 	try {
	// 		const { token } = await login(form);
	// 		let userData = null;

	// 		setAuth(token, null); // temporarily set token
	// 		const { user, userCredits } = await fetchUserProfile();
	// 		console.log(user, userCredits, "<<<<<<<<<<<<");

	// 		userData = user;
	// 		setAuth(token, userData); // now set token + user data
	// 		connectSocket(userData);
	// 		toast.success("Login successful!");
	// 		navigate("/user-projects");
	// 		setCredits(userCredits);

	// 	} catch (err) {
	// 		if (err.code === 403 && err.email) {
	// 			toast("Verify your email first!", { icon: "⚠️" });
	// 			navigate(`/verify-otp?email=${err.email}`);
	// 		} else {
	// 			console.log(err)
	// 			toast.error(err.message || "Login failed");
	// 			// Set field-specific errors if available
	// 			if (err.errors) {
	// 				setErrors(err.errors);
	// 			}
	// 		}
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };

		if (show2FA) {
		return (
			<div className="min-h-screen flex flex-wrap text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-72 before:-right-1/5 dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-1/5 dg-footer px-4">
				<div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-10 relative">
					<img src={logo} alt="" className="absolute opacity-20 w-full lg:w-2/3 h-auto blur-xs" />
					<img src={logo} alt="Design Genie Logo" className="w-48 xl:w-1/3 h-auto relative z-10" />
				</div>
				<div className="w-full sm:w-lg mx-auto xl:mx-0 xl:w-1/2 flex items-start lg:items-center lg:justify-center">
					<div className="relative z-10 rdg-testimonial-card p-5 xl:p-8 xl:py-9 border-2 border-solid border-white rounded-2xl border-shadow-blur w-full lg:max-w-96 max-w-full">
						<MdOutlineShield className="w-12 h-auto mx-auto mb-4 text-[#D684B8]" />
						<h1 className="text-2xl lg:text-4xl font-bold mb-4 text-center">2FA Verification</h1>
						<p className="text-center text-gray-300 mb-6">
							Enter the code sent to {maskedPhone}
						</p>
						<form onSubmit={handle2FAVerification} className="space-y-4">
							<InputField 
								type="text" 
								name="otp" 
								placeholder="Enter 6-digit code" 
								value={otpCode} 
								onChange={(e) => {
									const value = e.target.value.replace(/\D/g, '');
									if (value.length <= 6) {
										setOtpCode(value);
									}
								}}
								maxLength={6}
								className="text-center text-lg tracking-widest w-full bg-black/30 outline-0 py-2.5 rounded-xl"
								required 
							/>
							<div className="pt-2">
								<Button 
									type="submit" 
									loading={verifying2FA} 
									variant="primary" 
									className="mx-auto border-2 border-solid border-gray-400 !bg-transparent w-full text-white text-center text-lg font-medium lg:py-2 lg:p-3 transition-all duration-200 ease-linear lg:min-h-12 flex hover:!bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit justify-center rounded-3xl"
								>
									{verifying2FA ? "Verifying..." : "Verify"}
								</Button>
							</div>
							<div className="flex justify-between items-center">
								<button
									type="button"
									onClick={() => {
										setShow2FA(false);
										setOtpCode("");
									}}
									className="text-gray-400 hover:text-white transition-colors"
								>
									← Back to login
								</button>
								<button
									type="button"
									onClick={handleResend2FA}
									disabled={loading}
									className="text-purple-400 hover:text-purple-300 transition-colors"
								>
									Resend code
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}


	return (
		<div className="min-h-screen flex flex-wrap text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-72 before:-right-1/5 dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-1/5 dg-footer px-4">
			<div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-10 relative">
				<img src={logo} alt="" className="absolute opacity-20 w-full lg:w-2/3 h-auto blur-xs" />
				<img src={logo} alt="Design Genie Logo" className="w-48 xl:w-1/3 h-auto relative z-10" />
			</div>
			<div className="w-full sm:w-lg mx-auto xl:mx-0 xl:w-1/2 flex items-start lg:items-center lg:justify-center">
				<div className="relative z-10 rdg-testimonial-card p-5 xl:p-8 xl:py-9 border-2 border-solid border-white rounded-2xl border-shadow-blur w-full lg:max-w-96 max-w-full">
					<MdOutlineShield className="w-12 h-auto mx-auto mb-4 text-[#D684B8]" />
					<h1 className="text-2xl lg:text-4xl font-bold mb-4 lg:mb-8 text-center">Log In</h1>
					<form onSubmit={handleSubmit} className="space-y-4">
						<InputField type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} icon={EmailIcon} error={errors.email} required />
						<InputField type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} icon={PasswordIcon} error={errors.password} required />
						<div className="pt-2">
							<Button type="submit" loading={loading} variant="primary" className=" mx-auto border-2 border-solid border-gray-400 !bg-transparent w-full text-white text-center text-lg font-medium lg:py-2 lg:p-3 transition-all duration-200 ease-linear lg:min-h-12 flex hover:!bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit justify-center rounded-3xl">Log In</Button>
						</div>
						<div>
							<Button type="button" variant="primary" onClick={() => navigate("/onboarding")} className="mx-auto border-2 border-solid border-gray-400 !bg-transparent w-full text-white text-center text-lg font-medium lg:py-2 px-3 transition-all duration-200 ease-linear lg:min-h-12 flex hover:!bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit justify-center rounded-3xl">Sign Up</Button>
						</div>
						<div className="w-full max-w-60 mx-auto">
							<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
								<GoogleLogin
									onSuccess={handleGoogleLogin}
									onError={handleGoogleError}
									render={(renderProps) => (
									<button
										type="button"
										onClick={renderProps.onClick}
										disabled={renderProps.disabled || loading}
										className="mx-auto border-2 border-solid border-gray-400 bg-transparent w-full text-white text-center text-lg font-medium lg:py-2 px-3 transition-all duration-200 ease-linear lg:min-h-12 flex items-center justify-center gap-2 hover:bg-gradient-to-b hover:from-[#9C25E6] hover:to-[#BE2696] rounded-3xl"
									>
										<FaGoogle className="text-xl" />
										<span>Login with Google</span>
									</button>
									)}
								/>
							</GoogleOAuthProvider>
						</div>
						<p className="text-center text-gray-200 mt-2">
							<span onClick={() => navigate("/forgot-password")} className="cursor-pointer hover:text-purple-400 transition-colors duration-200">Forgot Password?</span>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}

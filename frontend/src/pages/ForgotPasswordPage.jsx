import { useState } from "react";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import { sendForgotPasswordOtp } from "../features/auth/authService";
import { toast } from "react-hot-toast";
import logo from "../assets/images/dg-logo.png";
import { EmailIcon } from "../utils/icons";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			await sendForgotPasswordOtp(email);
			toast.success("OTP sent to your email");
			navigate(`/reset-password?email=${encodeURIComponent(email)}`);
		} catch (err) {
			setError(err.message || "Failed to send OTP");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-wrap text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-40 before:-right-40 before:z-[-1] dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left dg-footer px-4">
			<div className="w-full lg:w-1/2 hidden lg:flex items-center justify-center p-4 lg:p-10 relative">
				<img src={logo} alt="glow" className="absolute opacity-20 w-full md:w-2/3 h-auto blur-xs" />
				<img src={logo} alt="Design Genie" className="w-48 xl:w-1/3 h-auto relative z-10" />
			</div>

			<div className="w-full lg:w-1/2 flex items-center justify-center">
				<div className="relative z-10 rounded-[180px] sm:rounded-full bg-[#C26AAC14] shadow-[0_0_20px_1px_rgba(255,255,255,0.16)] w-full py-16 md:size-[500px] flex flex-col items-center justify-center">
					<img src={logo} alt="Design Genie" className="w-48 xl:w-1/3 h-auto relative z-10 mb-6 block lg:hidden" />
					<h1 className="text-2xl lg:text-4xl font-bold mb-4 lg:mb-8 text-center">Forgot Password</h1>
					<form onSubmit={handleSubmit} className="space-y-4 w-full px-6 md:px-16">
						<InputField placeholder={"Email"} type="email" name="email" value={email} icon={EmailIcon} onChange={(e) => setEmail(e.target.value)} required />
						{error && (
							<p className="text-red-400 text-sm">{error}</p>
						)}
						<Button type="submit" loading={loading} className="cursor-pointer h-10 lg:h-12 text-sm lg:text-base">Send OTP</Button>
						<p className="text-center text-gray-400 mt-2">
							<span onClick={() => navigate("/login")} className="cursor-pointer hover:text-purple-400 transition-colors duration-200">Login</span>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}

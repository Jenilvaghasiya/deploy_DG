import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { resetPasswordWithOtp } from "../features/auth/authService";
import { toast } from "react-hot-toast";
import logo from "../assets/images/dg-logo.png";
import PasswordField from "@/components/Common/PasswordField";
import { PasswordIcon } from "@/utils/icons";

export default function ResetPasswordPage() {
	const navigate = useNavigate();
	const query = new URLSearchParams(useLocation().search);
	const [isPasswordStrong,setIsPasswordStrong] = useState(false);
	const [email, setEmail] = useState(query.get("email") || "");
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!email || !otp || !newPassword) {
			setError("All fields are required.");
			return;
		}

		if (!isPasswordStrong) {
				setError("Password must follow the mentioned criteria.");
				return;
			
		}

		setLoading(true);
		try {
			await resetPasswordWithOtp(email, otp, newPassword);
			toast.success("Password reset successful");
			navigate("/login");
		} catch (err) {
			setError(err.message || "Failed to reset password");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-wrap text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-40 before:-right-40 dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left dg-footer before:z-[-1] px-4">
			<div className="w-full lg:w-1/2 hidden lg:flex items-center justify-center p-4 lg:p-10 relative">
				<img src={logo} alt="glow" className="absolute opacity-20 w-full md:w-2/3 h-auto blur-xs" />
				<img src={logo} alt="Design Genie" className="w-48 xl:w-1/3 h-auto relative z-10" />
			</div>

			<div className="w-full lg:w-1/2 flex items-center justify-center">
				<div className="relative z-10 rounded-[180px] sm:rounded-full bg-[#C26AAC14] shadow-[0_0_20px_1px_rgba(255,255,255,0.16)] w-full py-16 md:size-[500px] flex flex-col items-center justify-center">
					<img src={logo} alt="Design Genie" className="w-48 xl:w-1/3 h-auto relative z-10 mb-6 block lg:hidden" />
					
					<h2 className="text-3xl font-bold mb-6 text-center">Reset Password</h2>
					<form onSubmit={handleSubmit} className="space-y-4 w-full px-6 md:px-16">
						<InputField placeholder={"Email"} label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
						<InputField placeholder={"OTP"} label="OTP" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
						<PasswordField placeholder={"New Password"} label="New Password" type="password" value={newPassword} icon={PasswordIcon} onChange={(e) => setNewPassword(e.target.value)} required={true} setIsPasswordStrong={setIsPasswordStrong} />
						{error && (
							<p className="text-red-400 text-sm">{error}</p>
						)}
						<Button type="submit" loading={loading} className="cursor-pointer h-10 lg:h-12 text-sm lg:text-base">Reset Password</Button>
					</form>
					<p className="text-center text-sm text-gray-400 mt-4">
						Back to{" "}
						<span onClick={() => navigate("/login")} className="text-purple-400 hover:underline cursor-pointer">Login</span>
					</p>
				</div>
			</div>
		</div>
	);
}

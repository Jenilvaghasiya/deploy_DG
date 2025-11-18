import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { verifyOtp, resendOtp, resendTempUserOtp, verifyTempUserOtp } from "../features/auth/authService";
import { toast } from "react-hot-toast";

export default function VerifyOtp() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const email = searchParams.get("email");
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);
	const [countdown, setCountdown] = useState(60);

	useEffect(() => {
		if (!email) navigate("/login");
	}, [email, navigate]);

	useEffect(() => {
		let timer;
		if (countdown > 0) {
			timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
		}
		return () => clearTimeout(timer);
	}, [countdown]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res= await verifyTempUserOtp({ email, otp });
			toast.success("OTP Verified! Please Login to Continue.");
			navigate(`/onboarding/subscriptions?temp_id=${res.data.data.tempUserId}`);
		} catch (err) {
			toast.error(err.message || "Invalid or expired OTP");
		} finally {
			setLoading(false);
		}
	};

	const handleResend = async () => {
		setResending(true);
		try {
			await resendTempUserOtp({ email });
			toast.success("OTP resent successfully!");
			setCountdown(60);
		} catch (err) {
			toast.error(err.message || "Failed to resend OTP");
		} finally {
			setResending(false);
		}
	};

	return (
		<div className="min-h-screen flex justify-center items-center text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-72 before:-right-1/5 dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-1/5 dg-footer px-4">
			<div className="w-full max-w-md space-y-3 lg:space-y-6 z-2">
				<h2 className="text-2xl font-bold text-center">Verify Your Email</h2>
				<p className="text-sm text-center text-gray-400">
					An OTP has been sent to{" "}
					<span className="font-semibold text-white">{email}</span>
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<InputField
						label="Enter OTP"
						value={otp}
						onChange={(e) => setOtp(e.target.value)}
						required
						inputstyle={'border-purple-400 border-solid border-1 bg-white/10'}
					/>

					<Button type="submit" className="h-10 lg:h-12 text-sm lg:text-base" loading={loading}>
						Verify OTP
					</Button>

					<div className="text-sm text-center text-gray-400">
						{countdown > 0 ? (
							<p>
								Resend available in{" "}
								<span className="font-semibold">
									{countdown}s
								</span>
							</p>
						) : (
							<button
								type="button"
								onClick={handleResend}
								disabled={resending}
								className="text-purple-400 underline"
							>
								{resending ? "Sending..." : "Resend OTP"}
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}

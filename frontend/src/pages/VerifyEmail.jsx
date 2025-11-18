import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { verifyOtp, resendOtp } from "../features/auth/authService";
import toast from "react-hot-toast";

export default function VerifyEmail() {
	const location = useLocation();
	const navigate = useNavigate();
	const email = location.state?.email || "";

	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);
	const [countdown, setCountdown] = useState(60);

	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (!email) navigate("/login");
	}, [email, navigate]);

	useEffect(() => {
		let timer;
		if (countdown > 0) {
			timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
		}
		return () => clearTimeout(timer);
	}, [countdown]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setMessage("");

		try {
			await verifyOtp({ email, otp });
			navigate("/login");
			toast.success("Verification successful! Redirecting to login...");
		} catch (err) {
			setError(err.message || "Invalid or expired OTP");
		} finally {
			setLoading(false);
		}
	};

	const handleResend = async () => {
		setResending(true);
		setError("");
		setMessage("");
		try {
			await resendOtp(email);
			setMessage("OTP resent to your email.");
			setCountdown(60);
		} catch (err) {
			setError(err.message || "Failed to resend OTP.");
		} finally {
			setResending(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-wrap items-center justify-center text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-40 before:-right-40 dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left dg-footer before:z-[-1] px-4">
			<div className="max-w-md w-full relative z-20">
				<h2 className="text-2xl font-bold">Verify Your Email</h2>
				<p className="text-sm text-gray-400 mb-2">We sent an OTP to <strong>{email}</strong></p>
				<form onSubmit={handleSubmit} className="space-y-4">
					<InputField label="Enter OTP" name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={loading} />
					{error && <p className="text-red-400 text-sm">{error}</p>}
					{message && (
						<p className="text-green-400 text-sm">{message}</p>
					)}
					<Button type="submit" loading={loading} className="mb-2 h-10 lg:h-12 text-sm lg:text-base cursor-pointer text-white">Verify</Button>
				</form>

				{countdown > 0 ? (
					<p className="text-sm text-center text-gray-200">Resend available in <strong>{countdown}s</strong></p>
				) : (
					<button onClick={handleResend} disabled={resending} className="text-sm text-indigo-400 mx-auto block max-w-fit mt-6 hover:underline">
						{resending ? "Sending..." : "Resend OTP"}
					</button>
				)}
			</div>
		</div>
	);
}

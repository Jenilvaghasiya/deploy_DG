import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import {
	acceptInvitation,
	fetchInviteDetails,
} from "../features/invitations/inviteService";
import PasswordField from "@/components/Common/PasswordField";
import { PasswordIcon } from "@/utils/icons";

export default function AcceptInvite() {
	const { token } = useParams();
	const navigate = useNavigate();

	const [invite, setInvite] = useState(null);
	const [form, setForm] = useState({ full_name: "", password: "" });
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [isPasswordStrong,setIsPasswordStrong] = useState(false);


	useEffect(() => {
		const loadInvite = async () => {
			try {
				const data = await fetchInviteDetails(token);
				setInvite(data);
			} catch (err) {
				console.error(err);
				setError("Invitation not found or expired.");
			}
		};
		loadInvite();
	}, [token]);

	const handleChange = (e) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!form.full_name || !form.password) {
			setError("Please fill in all fields.");
			return;
		}

		if (form.full_name.length < 3) {
			setError("Full Name must be at least 3 characters long.");
			return;
		}

		if (!isPasswordStrong) {
			setError(
				"Password must follow the mentioned criteria."
			);
			return;
		}

		setLoading(true);
		try {
			await acceptInvitation(token, form);
			navigate("/verify-email", { state: { email: invite.email } });
		} catch (err) {
			setError(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	if (error && !invite) {
		return (
			<div className="min-h-screen flex flex-wrap text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-40 before:-right-40 before:z-[-1] dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left dg-footer px-4">
				<p className="text-lg">{error}</p>
			</div>
		);
	}

	if (!invite) {
		return (
			<div className="min-h-screen flex flex-wrap text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-40 before:-right-40 before:z-[-1] dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left dg-footer px-4">
				<p>Loading invitation...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-wrap items-center justify-center text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-40 before:-right-40 before:z-[-1] dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left dg-footer px-4">
			<div className="w-full max-w-md space-y-6 relative z-10">
				<h2 className="text-2xl font-semibold">You're invited to Design Genie</h2>
				<p className="text-sm text-gray-400">Accepting invite for <strong className="text-white">{invite.email}</strong></p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<InputField
						placeholder={'Enter Full Name'}
						name="full_name"
						value={form.full_name}
						onChange={handleChange}
						disabled={loading}
						inputstyle={'border-purple-400 border-solid border-1 bg-white/10'}
					/>

					<PasswordField
						name="password"
						type="password"
						value={form.password}
						onChange={handleChange}
						disabled={loading}
						setIsPasswordStrong={setIsPasswordStrong}
						icon={PasswordIcon}
						inputstyle={'border-purple-400 border-solid border-1 bg-white/10'}
					/>

					{error && <p className="text-sm text-red-500">{error}</p>}

					<Button type="submit" loading={loading}>
						Accept Invitation
					</Button>
				</form>
			</div>
		</div>
	);
}

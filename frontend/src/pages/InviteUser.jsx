import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { inviteUser } from "../features/invitations/inviteService";
import { fetchRoles } from "../features/roles/roleService";

export default function InviteUser() {
	const { user } = useAuthStore();
	const token = useAuthStore((state) => state.token);
	const [form, setForm] = useState({
		email: "",
		role_id: "",
	});
	const [roles, setRoles] = useState([]);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetchRoles()
			.then(setRoles)
			.catch(() => setError("Failed to load roles"));
	}, []);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		try {
			await inviteUser({ ...form, tenant_id: user.tenant.id }, token);
			setSuccess("Invitation sent successfully!");
			setForm({ email: "", role_id: "" });
		} catch (err) {
			setError(err.message || "Failed to invite user");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-xl mx-auto mt-10 p-6 rounded-2xl shadow border border-gray-800 bg-[#1e1e1e] space-y-6">
			<h1 className="text-lg font-semibold text-white">
				Invite New User
			</h1>

			<form onSubmit={handleSubmit} className="space-y-4">
				<InputField
					label="User Email"
					name="email"
					type="email"
					value={form.email}
					onChange={handleChange}
				/>

				<div>
					<label className="block mb-1 text-sm text-white">
						Select Role
					</label>
					<select
						name="role_id"
						value={form.role_id}
						onChange={handleChange}
						className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-white text-sm"
					>
						<option value="">-- Choose Role --</option>
						{roles.map((role) => (
							<option key={role.id} value={role.id}>
								{role.name}
							</option>
						))}
					</select>
				</div>

				{error && <p className="text-red-400 text-sm">{error}</p>}
				{success && <p className="text-green-400 text-sm">{success}</p>}

				<div className="flex justify-end">
					<Button type="submit" loading={loading}>
						Send Invite
					</Button>
				</div>
			</form>
		</div>
	);
}

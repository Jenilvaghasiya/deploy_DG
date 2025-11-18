// src/pages/users/EditUserInline.jsx
import { useState, useEffect } from "react";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import SmartInput from "../../components/SmartInput";
import { fetchRoles } from "../../features/roles/roleService";
import { fetchDepartments } from "../../features/departments/departmentService";
import { updateUser } from "../../features/users/userService";

export default function EditUserInline({ user, onSuccess }) {
	const [form, setForm] = useState({
		email: user.email || "",
		role_id: user.role?.id || "",
		department: user.department?.name || "",
	});

	const [roles, setRoles] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [departments, setDepartments] = useState([]);

	useEffect(() => {
		fetchRoles()
			.then(setRoles)
			.catch(() => setError("Failed to load roles"));

		fetchDepartments()
			.then((data) => {
				const formattedDepartments = data.map((dept) => ({
					label: dept.name,
					value: dept.id,
				}));
				setDepartments(formattedDepartments);
			})
			.catch(() => setError("Failed to load departments"));
	}, []);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSmartInputChange = (val) => {
		setForm({ ...form, department: val });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");
		try {
			await updateUser(user.id, form);
			setSuccess("User updated successfully!");
			onSuccess?.();
		} catch (err) {
			setError(err.message || "Failed to update user");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="border border-gray-800 rounded-2xl p-6 space-y-5">
			<h2 className="text-lg font-semibold text-white">Edit User</h2>
			<form onSubmit={handleSubmit} className="space-y-4">
				<InputField
					label="User Email"
					type="email"
					name="email"
					value={form.email}
					disabled
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

				<SmartInput
					label="Department"
					value={form.department}
					options={departments}
					onChange={handleSmartInputChange}
					placeholder="Search or type department..."
				/>

				{error && <p className="text-red-400 text-sm">{error}</p>}
				{success && <p className="text-green-400 text-sm">{success}</p>}

				<div>
					<Button type="submit" loading={loading}>
						Update User
					</Button>
				</div>
			</form>
		</div>
	);
}

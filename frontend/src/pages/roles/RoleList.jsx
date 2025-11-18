import { useEffect, useState } from "react";
import {
	fetchRoles,
	createRole,
	deleteRole,
} from "../../features/roles/roleService";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Table from "../../components/Table";
import { Link } from "react-router-dom";
import { MdDelete, MdKey } from "react-icons/md";

export default function RoleList() {
	const [roles, setRoles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [form, setForm] = useState({ name: "", description: "" });
	const [formError, setFormError] = useState("");
	const [formLoading, setFormLoading] = useState(false);

	useEffect(() => {
		loadRoles();
	}, []);

	const loadRoles = async () => {
		setLoading(true);
		try {
			const data = await fetchRoles();
			setRoles(data);
		} catch (err) {
			setError("Failed to fetch roles");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setFormError("");
		setFormLoading(true);
		try {
			const newRole = await createRole(form);
			setRoles((prev) => [...prev, newRole]);
			setForm({ name: "", description: "" });
			setFormOpen(false);
		} catch (err) {
			setFormError(err.message || "Failed to create role");
		} finally {
			setFormLoading(false);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this role?")) return;
		try {
			await deleteRole(id);
			setRoles((prev) => prev.filter((r) => r.id !== id));
		} catch {
			alert("Failed to delete role");
		}
	};

	const columns = [
		{ header: "Name", render: (role) => role.name },
		{ header: "Description", render: (role) => role.description || "-" },
		{
			header: "Actions",
			render: (role) => (
				<div className="flex gap-2 text-xs">
					<Link
						to={`/roles/${role.id}/permissions`}
						className="bg-transparent border border-pink-400 text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white"
					>
						<span className="text-sm">
							<MdKey />
						</span>{" "}
						Permissions
					</Link>
					<button
						onClick={() => handleDelete(role.id)}
						className="bg-transparent border border-pink-400 text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white"
					>
						<span className="text-sm">
							<MdDelete />
						</span>{" "}
						Delete
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex justify-end items-center">
				{/* <h1 className="text-2xl font-bold">Role Management</h1> */}
				<button
					onClick={() => setFormOpen((prev) => !prev)}
					className={`border border-pink-400 text-pink-400 px-4 py-2 rounded-full hover:bg-pink-600 hover:text-white transition`}
				>
					{formOpen ? "- View List" : "+ New Role"}
				</button>
			</div>

			{formOpen && (
				<div className="p-6 rounded-2xl shadow border border-gray-800 bg-[#1e1e1e] w-full space-y-4">
					<div className="max-w-lg">
						<h2 className="text-lg font-semibold text-white mb-3">
							Create Role
						</h2>
						<form onSubmit={handleSubmit} className="space-y-4">
							<InputField
								label="Role Name"
								name="name"
								value={form.name}
								onChange={handleChange}
							/>
							<InputField
								label="Description"
								name="description"
								value={form.description}
								onChange={handleChange}
							/>
							{formError && (
								<p className="text-red-400 text-sm">
									{formError}
								</p>
							)}
							<div className="flex justify-end">
								<Button
									type="submit"
									loading={formLoading}
									size="small"
									fullWidth={false}
								>
									Save
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{error && <p className="text-red-400">{error}</p>}
			{loading && <p>Loading...</p>}

			{!formOpen && roles.length > 0 && (
				<Table columns={columns} data={roles} />
			)}

			{!formOpen && roles.length === 0 && !loading && (
				<p className="text-center text-sm text-gray-500">
					No roles found.
				</p>
			)}
		</div>
	);
}

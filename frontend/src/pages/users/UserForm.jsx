import { useEffect, useState } from "react";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import SmartInput from "../../components/SmartInput";
import { Switch } from "@/components/ui/switch";
import { fetchDepartments } from "../../features/departments/departmentService";
import { inviteUser } from "../../features/invitations/inviteService";
import { updateUser } from "../../features/users/userService";
import { useAuthStore } from "../../store/authStore";
import { fetchProjects } from "../../features/projects/projectService";
import api from "../../api/axios";
import { fetchRoles } from "../../features/roles/roleService";
// import Select from "@/components/Select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserForm({
	mode = "invite",
	user = {},
	onSuccess,
	onCancel,
}) {
	const { user: authUser } = useAuthStore();
	const token = useAuthStore((state) => state.token);
	const isCurrentUser = useAuthStore((state) => state.user);
	const [form, setForm] = useState({
		email: user.email || "",
		full_name: user.full_name || "",
		role_id: user.role?.id || user.role_id || "",
		department: user.department
			? { label: user.department.name, value: user.department.id }
			: null,
		is_active: user.is_active ?? true,
	});

	const [roles, setRoles] = useState([]);
	const [tenantRoles, setTenantRoles] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const isSuperAdmin = isCurrentUser?.role?.name === "admin+user";	
	const isAdmin = isCurrentUser?.role?.name.toLowerCase() === "admin";

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [
					rolesRes,
					tenantRolesRes,
					departmentsRes,
					projectsRes,
					userProjectRolesRes,
				] = await Promise.all([
					fetchRoles(),
					api
						.get("/tenant-roles", {
							headers: {
								Authorization: `Bearer ${localStorage.getItem(
									"token"
								)}`,
							},
						})
						.then((res) => res.data.data),
					fetchDepartments(),
					fetchProjects(),
					api.get("/user-project-roles", {
						params: { userId: user.id },
					}),
				]);

				// Filter out superadmin from roles
				const filteredRoles = rolesRes.filter(
					(role) => role.name.toLowerCase() !== "superadmin"
				);

				setRoles(filteredRoles);
				setTenantRoles(tenantRolesRes);
				setDepartments(
					departmentsRes.map((d) => ({ label: d.name, value: d.id }))
				);

				// Initialize projects with role assignments
				const userProjectRoles = userProjectRolesRes.data.data.filter(
					(upr) => user.id && upr.user_id === user.id // user_id is a string
				);

				setProjects(
					projectsRes.map((proj) => {
						const upr = userProjectRoles.find(
							(u) => u.project_id === proj.id // project_id is a string
						);

						const projectRoleIds = upr?.role_ids
							? upr.role_ids.map((r) => r.id)
							: [];

						console.log(
							"UPR disabled value:",
							upr ? upr.disabled : "none"
						);

						return {
							id: proj.id,
							name: proj.name,
							disabled: upr ? upr.disabled : false,
							isDefault: upr ? upr.is_default : false,
							lock_roles: upr ? upr.lock_roles : false,
							roles: tenantRolesRes.map((role) => ({
								id: role.id,
								name: role.name,
								enabled: projectRoleIds.includes(role.id),
							})),
						};
					})
				);
			} catch (err) {
				console.error(err);
				setError("Failed to load data");
			}
		};
		fetchData();
	}, [user.id]);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSwitch = (checked) => {
		setForm((prev) => ({ ...prev, is_active: checked }));
	};
	const toggleRole = (projectId, roleId) => {
		setProjects((prev) =>
			prev.map((project) =>
				project.id === projectId
					? {
							...project,
							roles: project.roles.map((role) =>
								role.id === roleId
									? { ...role, enabled: !role.enabled }
									: role
							),
					  }
					: project
			)
		);
	};

	const toggleLockRoles = (projectId) => {
		setProjects((prev) => {
			const lockedProject = prev.find((p) => p.id === projectId);
			const lockRoles = !lockedProject.lock_roles;
			if (lockRoles) {
				return prev.map((project) => ({
					...project,
					roles: lockedProject.roles.map((r) => ({ ...r })),
					disabled: lockedProject.disabled,
					lock_roles: true,
				}));
			}
			return prev.map((project) =>
				project.id === projectId
					? { ...project, lock_roles: false }
					: project
			);
		});
	};

	const toggleDisabled = (projectId) => {
		setProjects((prev) =>
			prev.map((project) =>
				project.id === projectId
					? { ...project, disabled: !project.disabled }
					: project
			)
		);
	};

	const toggleDefault = (projectId) => {
		setProjects((prev) =>
			prev.map((project) =>
				project.id === projectId
					? { ...project, isDefault: !project.isDefault }
					: { ...project, isDefault: project.id === projectId }
			)
		);
	};

	// UserForm.jsx
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			// Tenant-level user data
			const userData = {
				email: form.email,
				full_name: form.full_name,
				role_id: form.role_id,
				department: form.department, // Keep as object with label/value
				tenant_id: authUser.tenant.id,
				is_active: form.is_active,
				project_assignments: projects
					.map((project) => ({
						project_id: project.id,
						role_ids: project.roles
							.filter((r) => r.enabled)
							.map((r) => r.id),
						disabled: project.disabled,
						is_default: project.isDefault,
						lock_roles: project.lock_roles,
					}))
					.filter((proj) => proj.role_ids.length > 0),
			};

			let userId = user.id;
			if (mode === "invite") {
				const inviteRes = await inviteUser(userData, token);
				userId = inviteRes.userId; // This will be set after acceptance
			} else {
				await updateUser(userId, {
					email: userData.email,
					full_name: userData.full_name,
					role_id: userData.role_id,
					department_id: userData.department?.value,
					is_active : userData.is_active
				});

				// Update project assignments
				if (userData.project_assignments.length > 0) {
					await api.put("/user-project-roles", {
						user_id: userId,
						tenant_id: authUser.tenant.id,
						projects: userData.project_assignments,
					});
				}
			}

			setSuccess(
				mode === "invite" ? "Invitation sent!" : "User updated!"
			);
			onSuccess?.();
		} catch (err) {
			setError(err.message || "Failed to submit");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="border-shadow-blur border border-white/35 h-20 grow rounded-2xl p-6 space-y-5 overflow-auto custom-scroll">
			<h2 className="text-lg font-semibold text-white mb-6">{mode === "invite" ? "Invite User" : "Edit User"}</h2>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="grid md:grid-cols-2 gap-6">
					<InputField
						label="Email"
						type="email"
						name="email"
						value={form.email}
						onChange={handleChange}
						disabled={mode === "edit"}
					/>
					{mode === "edit" && (
						<InputField
							label="Full Name"
							name="full_name"
							value={form.full_name}
							onChange={handleChange}
						/>
					)}
						{/* ✅ Switch for active/inactive */}
						{!isCurrentUser && mode !== "invite" && (
							<div className="flex items-center space-x-3 mt-4">
								<Switch
									checked={form.is_active}
									onCheckedChange={handleSwitch}
								/>
								<span className="text-white text-sm">
									{form.is_active ? "Active" : "Inactive"}
								</span>
							</div>
						)}
					<div className="mt-4">
						<label className="block mb-1 text-sm text-white">Select Role</label>
						{/* <select
							name="role_id"
							value={form.role_id}
							onChange={handleChange}
							className="w-full p-2 py-3 rounded-full bg-gray-800 border border-gray-800 text-white text-sm"
						>
							<option value="">-- Choose Role --</option>
							{roles.map((role) => (
								<option key={role.id} value={role.id}>
									{role.name}
								</option>
							))}
						</select> */}
						<Select
							value={form.role_id?.toString() || ""}
							onValueChange={(value) =>
								handleChange({ target: { name: "role_id", value } })
							}
							>
							<SelectTrigger 
								className="w-full py-3 px-4 !h-auto rounded-full bg-white/15 border border-white/35 text-white text-sm"
								 disabled={roles.find(r => r.id === form.role_id)?.name.toLowerCase() === "admin+user"}
								>
								<SelectValue placeholder="-- Choose Role --" />
							</SelectTrigger>
							<SelectContent className="bg-gray-800 text-white border border-gray-700">
								{roles.map((role) => (
								<SelectItem 
									key={role.id} 
									value={role.id.toString()}
									disabled={
										role.name.toLowerCase() === "admin+user" ||
										(role.name.toLowerCase() === "admin" && !isSuperAdmin)
									}
								>
									{role.name}
								</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="mt-4">
						<SmartInput
							label="Department"
							value={form.department}
							onChange={(val) =>
								setForm({ ...form, department: val })
							}
							options={departments}
							placeholder="Search or type department..."
						/>
					</div>
				</div>

				{/* Project Role Assignment Section */}
				{/* <div className="w-full">
					<h3 className="text-white text-lg mb-4">
						Project Role Assignments
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{projects.map((project) => (
							<div
								key={project.id}
								className="bg-black p-6 rounded-xl space-y-4"
							>

								<div className="flex justify-between mb-8">

									<div className="flex items-center">
										<div
											className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
												project.disabled
													? "bg-purple-600"
													: "bg-gray-600"
											}`}
											onClick={() =>
												toggleDisabled(project.id)
											}
										>
											<div
												className={`absolute w-5 h-5 bg-white rounded-full top-0.5 shadow-sm transform transition-transform duration-200 ${
													project.disabled
														? "translate-x-6"
														: "translate-x-0.5"
												}`}
											/>
										</div>
										<span className="ml-3 text-white">
											Disabled
										</span>
									</div>
									<div className="flex items-center">
										<div
											className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
												project.isDefault
													? "bg-purple-600"
													: "bg-gray-600"
											} ${
												project.disabled
													? "cursor-not-allowed opacity-50"
													: "cursor-pointer"
											}`}
											onClick={() => {
												if (!project.disabled)
													toggleDefault(project.id);
											}}
										>
											<div
												className={`absolute w-5 h-5 bg-white rounded-full top-0.5 shadow-sm transform transition-transform duration-200 ${
													project.isDefault
														? "translate-x-6"
														: "translate-x-0.5"
												}`}
											/>
										</div>
										<span className="ml-3 text-white">
											Set Default
										</span>
									</div>
								</div>

								<div
									className={`bg-[#161616] rounded-xl p-6 ${
										project.disabled
											? "pointer-events-none opacity-50"
											: ""
									}`}
								>
									<div className="flex justify-center items-center mb-4">
										<div
											className="w-5 h-5 border border-purple-600 rounded flex items-center justify-center cursor-pointer"
											onClick={() =>
												toggleLockRoles(project.id)
											}
										>
											{project.lock_roles && (
												<svg
													className="w-3 h-3 text-purple-600"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="3"
														d="M5 13l4 4L19 7"
													/>
												</svg>
											)}
										</div>
										<span className="ml-2 text-white text-sm">
											Lock Roles
										</span>
									</div>

									<div className="space-y-4">
										{project.roles.map((role) => (
											<div
												key={role.id}
												className="flex items-center"
											>
												<div
													className="w-5 h-5 border border-purple-600 rounded flex items-center justify-center cursor-pointer"
													onClick={() =>
														toggleRole(
															project.id,
															role.id
														)
													}
												>
													{role.enabled && (
														<svg
															className="w-3 h-3 text-purple-600"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="3"
																d="M5 13l4 4L19 7"
															/>
														</svg>
													)}
												</div>
												<span className="ml-3 text-white text-lg">
													{role.name}
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				</div> */}

				{error && <p className="text-red-400 text-sm">{error}</p>}
				{success && <p className="text-green-400 text-sm">{success}</p>}

				<div className="flex justify-center">
					<Button type="submit" className="mt-4 2xl:px-6 text-base" loading={loading} fullWidth={false}>
						{mode === "invite" ? "Send Invite" : "Save"}
					</Button>
				</div>
			</form>
		</div>
	);
}

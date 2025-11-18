import { useEffect, useState } from "react";
import {
	getRolePermissions,
	assignPermissionsToRole,
	fetchRoles,
} from "../../features/roles/roleService";
import Button from "../../components/Button";

export default function PermissionEditor({ role, onClose }) {
	const [groups, setGroups] = useState([]);
	const [selected, setSelected] = useState(new Set());
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [roleName, setRoleName] = useState("");

	useEffect(() => {
		loadPermissions();
	}, []);

	const loadPermissions = async () => {
		try {
			const allRoles = await fetchRoles();
			const matched = allRoles.find((r) => r.id === role.id);
			setRoleName(matched?.name || "Role");

			const data = await getRolePermissions(role.id);
			setGroups(data);

			const selectedSet = new Set();
			data.forEach((group) => {
				group.permissions.forEach((perm) => {
					if (perm.assigned) selectedSet.add(perm.id);
				});
			});
			setSelected(selectedSet);
		} catch {
			setError("Failed to load permissions");
		} finally {
			setLoading(false);
		}
	};

	const togglePermission = (id) => {
		setSelected((prev) => {
			const updated = new Set(prev);
			updated.has(id) ? updated.delete(id) : updated.add(id);
			return updated;
		});
	};

	const toggleGroupAll = (permissions) => {
		const allSelected = permissions.every((p) => selected.has(p.id));
		const updated = new Set(selected);
		permissions.forEach((p) =>
			allSelected ? updated.delete(p.id) : updated.add(p.id),
		);
		setSelected(updated);
	};

	const handleSave = async () => {
		setSaving(true);
		setError("");
		setSuccess("");
		try {
			await assignPermissionsToRole(role.id, Array.from(selected));
			setSuccess("Permissions updated successfully!");
			setTimeout(() => onClose?.(), 1500);
		} catch {
			setError("Failed to save permissions");
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <p className="text-gray-400">Loading...</p>;

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold text-white">
					Permissions for{" "}
					<span className="text-purple-400">{roleName}</span>
				</h2>
				{success && <p className="text-green-400 text-sm">{success}</p>}
			</div>

			{error && <p className="text-red-500 text-sm">{error}</p>}

			{/* Grouped Permissions */}
			<div className="space-y-6">
				{groups.map((group) => (
					<div
						key={group.group_id}
						className="bg-[#1e1e1e] border border-gray-800 rounded-2xl p-5"
					>
						<div className="flex justify-between items-center mb-3">
							<h3 className="text-md font-semibold text-white">
								{group.group_name || "Ungrouped"}
							</h3>
							<button
								onClick={() => toggleGroupAll(group.permissions)}
								className="text-xs text-purple-400 underline"
							>
								Toggle Group
							</button>
						</div>

						<div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
							{group.permissions.map((perm) => (
								<label
									key={perm.id}
									className="flex items-center gap-2 text-sm text-white"
								>
									<input
										type="checkbox"
										checked={selected.has(perm.id)}
										onChange={() =>
											togglePermission(perm.id)
										}
									/>
									<span>{perm.key}</span>
								</label>
							))}
						</div>
					</div>
				))}
			</div>

			{/* Footer Actions */}
			<div className="flex justify-end pt-6 border-t border-gray-800">
				<Button onClick={handleSave} loading={saving} size="small" fullWidth={false}>
					Save Permissions
				</Button>
			</div>
		</div>
	);
}

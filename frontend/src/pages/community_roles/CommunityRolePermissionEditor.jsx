import { useEffect, useState } from "react";
import Button from "../../components/Button";

const staticPermissionGroups = [
	{
		group_id: "project",
		group_name: "Project",
		permissions: [
			{ id: "0", key: "project.create", assigned: true },
			{ id: "1", key: "project.view", assigned: true },
			{ id: "2", key: "project.edit", assigned: false },
			{ id: "3", key: "project.delete", assigned: false },
		],
	},
	{
		group_id: "message",
		group_name: "Messages",
		permissions: [
			{ id: "4", key: "message.send", assigned: true },
			{ id: "5", key: "message.delete", assigned: false },
		],
	},
];

export default function CommunityRolePermissionEditor({ role, onClose }) {
	const [groups, setGroups] = useState([]);
	const [selected, setSelected] = useState(new Set());
	const [saving, setSaving] = useState(false);
	const [success, setSuccess] = useState("");

	useEffect(() => {
		setGroups(staticPermissionGroups);
		const assigned = new Set();
		staticPermissionGroups.forEach((g) =>
			g.permissions.forEach((p) => {
				if (p.assigned) assigned.add(p.id);
			})
		);
		setSelected(assigned);
	}, []);

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
			allSelected ? updated.delete(p.id) : updated.add(p.id)
		);
		setSelected(updated);
	};

	const handleSave = () => {
		setSaving(true);
		setTimeout(() => {
			setSaving(false);
			setSuccess("Permissions saved (demo only)");
			setTimeout(() => setSuccess(""), 2000);
		}, 1000);
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold text-white">
					Permissions for{" "}
					<span className="text-purple-400">{role.name}</span>
				</h2>
				{success && <p className="text-green-400 text-sm">{success}</p>}
			</div>

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
								onClick={() =>
									toggleGroupAll(group.permissions)
								}
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

			<div className="flex justify-end pt-6 border-t border-gray-800">
				<Button
					onClick={handleSave}
					loading={saving}
					size="small"
					fullWidth={false}
				>
					Save Permissions
				</Button>
			</div>
		</div>
	);
}

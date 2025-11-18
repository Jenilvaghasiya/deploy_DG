import { useEffect, useState } from "react";
import { getTenantUsers } from "../../features/users/userService";
import {
	addUserToProject,
	removeUserFromProject,
} from "../../features/projects/projectService";
import Button from "../../components/Button";

export default function UserAssignment({ project, onRefresh }) {
	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		getTenantUsers()
			.then(setUsers)
			.catch(() => setError("Failed to load users"));
	}, []);

	const handleAdd = async () => {
		if (!selectedUser) return;
		try {
			await addUserToProject(project.id, selectedUser);
			onRefresh();
			setSelectedUser("");
		} catch (err) {
			setError(err.message);
		}
	};

	const handleRemove = async (userId) => {
		try {
			await removeUserFromProject(project.id, userId);
			await onRefresh();
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div className="space-y-6">
			<div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl p-6 shadow space-y-5">
				<h3 className="text-lg font-semibold text-white">
					Assigned Users
				</h3>

				<ul className="divide-y divide-gray-800 overflow-hidden rounded-md text-sm bg-gray-900 border border-gray-800">
					{project.user_ids?.length === 0 ? (
						<li className="text-gray-300 text-sm px-4 py-3 flex items-center gap-2">
							<span>🚫 No users assigned yet.</span>
						</li>
					) : (
						project.user_ids?.map((user) => (
							<li
								key={user.id}
								className="flex justify-between items-center px-4 py-3"
							>
								<span>{user.email}</span>
								<button
									onClick={() => handleRemove(user.id)}
									className="text-red-400 text-xs hover:underline"
								>
									Remove
								</button>
							</li>
						))
					)}
				</ul>

				<div className="flex flex-col sm:flex-row gap-3 items-center">
					<select
						value={selectedUser}
						onChange={(e) => setSelectedUser(e.target.value)}
						className="flex-1 bg-gray-800 bg-opacity-50 rounded-full py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
					>
						<option value="">-- Select a user --</option>
						{users.map((user) => (
							<option key={user.id} value={user.id}>
								{user.email}
							</option>
						))}
					</select>

					<Button type="button" onClick={handleAdd} size="small" fullWidth={false}>
						Add
					</Button>
				</div>

				{error && <p className="text-red-400 text-sm">{error}</p>}
			</div>
		</div>
	);
}

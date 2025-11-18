import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { getTenantUsers, deleteUser } from "../../features/users/userService";
import InviteUserInline from "./InviteUserInline";
import Table from "../../components/Table"; // assuming you placed it there
import { MdDelete, MdEdit, MdNote } from "react-icons/md";
import EditUserInline from "./EditUserInline";

export default function UserList() {
	const { token } = useAuthStore();
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showInvite, setShowInvite] = useState(false);
	const [editingUser, setEditingUser] = useState(null);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		setLoading(true);
		setError("");
		try {
			const data = await getTenantUsers(token);
			setUsers(data);
		} catch (err) {
			setError(err.message || "Failed to load users");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this user?")) return;
		try {
			await deleteUser(id, token);
			setUsers((prev) => prev.filter((u) => u.id !== id));
		} catch (err) {
			console.error(err);
			alert("Error deleting user");
		}
	};

	const columns = [
		{
			header: "User",
			render: (user) => (
				<div>
					<div className="font-semibold">{user.full_name}</div>
					<div className="text-xs text-gray-300">{user.email}</div>
				</div>
			),
		},
		{
			header: "Role",
			render: (user) => user.role?.name || "-",
		},
		{
			header: "Status",
			render: (user) => (
				<span
					className={`px-2 py-1 rounded-full text-xs ${
						user.is_active ? "bg-green-500" : "bg-red-500"
					}`}
				>
					{user.is_active ? "Active" : "Inactive"}
				</span>
			),
		},
		{
			header: "Actions",
			render: (user) => (
				<div className="flex gap-2 text-xs">
					<button className="bg-transparent border border-pink-400 text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white">
						<span className="text-sm">
							<MdNote className="text-lg" />
						</span>{" "}
						Log
					</button>
					<button
						onClick={() => setEditingUser(user)}
						className="bg-transparent border border-pink-400 text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white"
					>
						<span className="text-sm">
							<MdEdit />
						</span>{" "}
						Edit
					</button>
					<button
						onClick={() => handleDelete(user.id)}
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
				{/* <h1 className="text-2xl font-bold">User Management</h1> */}
				<button
					className={`border border-pink-400 text-pink-400 px-4 py-2 rounded-lg hover:bg-pink-600 hover:text-white transition`}
					onClick={() => {
						setShowInvite((prev) => !prev);
						setEditingUser(null);
					}}
				>
					{showInvite || editingUser ? "Cancel" : "+ Invite User"}
				</button>
			</div>

			{showInvite && (
				<div className="flex justify-center">
					<div className="w-full max-w-xl">
						<InviteUserInline onSuccess={fetchUsers} />
					</div>
				</div>
			)}

			{editingUser && (
				<div className="flex justify-center">
					<div className="w-full max-w-xl">
						<EditUserInline
							user={editingUser}
							onSuccess={fetchUsers}
						/>
					</div>
				</div>
			)}

			{error && <p className="text-red-500">{error}</p>}
			{loading && <p>Loading...</p>}

			{!loading && <Table columns={columns} data={users} />}
		</div>
	);
}

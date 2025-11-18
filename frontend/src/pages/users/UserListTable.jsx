import Table from "../../components/Table";
import { MdDelete, MdEdit, MdNote } from "react-icons/md";
import Loader from "../../components/Common/Loader";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import ConfirmDeleteUserDialog from "@/components/ConfirmDeleteUserDialog";
import ViewUserLogsDialog from "@/components/ViewUserLogsDialog"; // Add this import
import { useState } from "react"; // Add this import

export default function UserListTable({
	users,
	loading,
	error,
	onEdit,
	onDelete,
	hasDeleteUserPermission,
	hasEditUserPermission,
	deletingUserId,
	currentUserId,
}) {
	// Add state for logs dialog
	const [logsDialogOpen, setLogsDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);

	// Handler for opening logs dialog
	const handleViewLogs = (user) => {
		setSelectedUser(user);
		setLogsDialogOpen(true);
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
			header: "Department",
			render: (user) => user.department?.name || "-",
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
			render: (user) => {
				const isCurrentUser = user.id === currentUserId;
				const isAdminUser = user.role?.name?.toLowerCase() === "admin+user";

				const canEdit = hasEditUserPermission && !isAdminUser;
				const canDelete = hasDeleteUserPermission && !isCurrentUser && !isAdminUser;

				return (
					<div className="flex gap-2 text-xs">
						{/* Log button - now clickable */}
						<button 
							onClick={() => handleViewLogs(user)}
							className="border cursor-pointer border-pink-400 text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white"
						>
							<MdNote className="text-lg" /> Log
						</button>

						{/* Edit button: always visible, disabled if not allowed */}
						<button
							disabled={!canEdit}
							onClick={() => onEdit(user)}
							className={`border px-3 py-1 rounded-full flex items-center gap-1 ${
								canEdit
									? "border-pink-400 text-pink-400 hover:bg-pink-500 hover:text-white cursor-pointer"
									: "border-gray-500 text-gray-500 cursor-not-allowed"
							}`}
						>
							<MdEdit className="text-lg" /> Edit
						</button>

						{/* Delete button: always visible, disabled if not allowed */}
						<ConfirmDeleteUserDialog
							onDelete={({reason}) => onDelete(user.id,reason)}
							title="Delete User"
							message="Are you sure you want to delete this user?"
							userFullname={user.full_name}
							userEmail={user.email}
						>
							<button
								disabled={!canDelete}
								className={`border px-3 py-1 rounded-full flex items-center gap-1 ${
									canDelete
										? "border-pink-400 text-pink-400 hover:bg-pink-500 hover:text-white cursor-pointer"
										: "border-gray-500 text-gray-500 cursor-not-allowed"
								}`}
							>
								<MdDelete className="text-lg" />{" "}
								{deletingUserId === user.id ? "Deleting..." : "Delete"}
							</button>
						</ConfirmDeleteUserDialog>
					</div>
				);
			},
		},
	];

	if (error) return <p className="text-red-500">{error}</p>;
	if (loading) return <Loader />;

	return (
		<>
			<Table columns={columns} data={users} />
			
			{/* Add the ViewUserLogsDialog component */}
			<ViewUserLogsDialog
				open={logsDialogOpen}
				setOpen={setLogsDialogOpen}
				userId={selectedUser?.id}
				userName={selectedUser?.full_name}
			/>
		</>
	);
}
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { getTenantUsers, deleteUser } from "../../features/users/userService";
import { getPendingTenantInvitations } from "../../features/invitations/inviteService";
import UserListTable from "./UserListTable";
import InvitationListTable from "./InvitationListTable";
import UserForm from "./UserForm";
import Button from "../../components/Button";
import { hasPermission } from "../../lib/utils";
import UserListTableNew from "./RevokedUserTable";

const TABS = {
	USERS: "users",
	INVITES: "invites",
	REVOKED: "revoked",
};

export default function UserManagement() {
	const { token, user } = useAuthStore();
	const [users, setUsers] = useState([]);
	const [invitations, setInvitations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [mode, setMode] = useState("list");
	const [showInvites, setShowInvites] = useState(false);
	const [editingUser, setEditingUser] = useState(null);
	const [activeTab, setActiveTab] = useState(TABS.USERS);
	const [deletingUserId, setDeletingUserId] = useState(null);

    const permissions = user?.role?.permissions || [];
	const permissionKeys = permissions.map(p => p.key);
	const hasCreateUserPermission = hasPermission(permissionKeys, "administration:user-management:create");
	const hasEditUserPermission = hasPermission(permissionKeys, "administration:user-management:update")
	const hasDeleteUserPermission = hasPermission(permissionKeys, "administration:user-management:delete");
	
	

	useEffect(() => {
		loadUsers();
	}, []);

	const loadUsers = async () => {
		setLoading(true);
		try {
			const tenantId = user?.tenant?.id;

			const userData = await getTenantUsers(token);
			const inviteData = await getPendingTenantInvitations(
				token,
				tenantId
			);
			setUsers(userData);
			setInvitations(inviteData);
		} catch (err) {
			setError(err.message || "Failed to load data");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id,reason) => {
		setDeletingUserId(id);
		try {
			const data = {reason}
			await deleteUser(id,data);
			await loadUsers();
		} catch {
			alert("Error deleting user");
		} finally {
			setDeletingUserId(null);
		}
	};

	const resetMode = () => {
		setEditingUser(null);
		setMode("list");
	};

	return (
		<div className="space-y-6 p-4 md:p-6 h-20 grow flex flex-col gap-2">
			<div className="flex justify-between items-center">
				<div className="flex border-b border-zinc-700 md:mb-4">
					<button className={`px-1.5 md:px-4 py-2 text-sm font-medium ${activeTab === TABS.USERS ? "border-b-2 border-pink-400 text-pink-400" : "text-white hover:text-pink-400 cursor-pointer"}`} onClick={() => {setActiveTab(TABS.USERS);setShowInvites(false);setMode("list");}}>Users</button>
					<button className={`px-1.5 md:px-4 py-2 text-sm font-medium ${activeTab === TABS.INVITES ? "border-b-2 border-pink-400 text-pink-400" : "text-white hover:text-pink-400 cursor-pointer"}`} onClick={() => { setActiveTab(TABS.INVITES); setShowInvites(true); setMode("list");}}>Pending Invites</button>
					<button className={`px-1.5 md:px-4 py-2 text-sm font-medium ${activeTab === TABS.REVOKED ? "border-b-2 border-pink-400 text-pink-400" : "text-white hover:text-pink-400 cursor-pointer"}`} onClick={() => { setActiveTab(TABS.REVOKED); setMode("list");}}>Revoked Users</button>
				</div>
				{hasCreateUserPermission && <Button className={"cursor-pointer"} onClick={() => mode === "list" ? setMode("invite") : resetMode() } size="small" fullWidth={false} disabled={!hasCreateUserPermission}>
					{mode === "list" ? "+ Add User" : "- View List"}
				</Button>}
			</div>
			{mode === "invite" && (
				<UserForm mode="invite" onSuccess={loadUsers} onCancel={resetMode} />
			)}
			{mode === "edit" && editingUser && (
				<UserForm mode="edit" user={editingUser} onSuccess={loadUsers} onCancel={resetMode} />
			)}
			{mode === "list" &&
				(activeTab === TABS.INVITES ? (
					<InvitationListTable data={invitations} loading={loading} error={error} onInvitationResent={loadUsers} />
				) : activeTab === TABS.REVOKED ? (
					<UserListTableNew/>
				) : (
					<UserListTable users={users} loading={loading} error={error} onEdit={(user) => {setEditingUser(user); setMode("edit");}} onDelete={handleDelete} hasEditUserPermission={hasEditUserPermission} hasDeleteUserPermission={hasDeleteUserPermission}
					deletingUserId={deletingUserId} currentUserId={user.id}
					/>
				))}
		</div>
	);
}

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  getRevokedTenantUsers,
  deleteUser,
  getTenantUsers,
  transferRevokedUserData,
} from "../../features/users/userService";
import Loader from "../../components/Common/Loader";
import Table from "../../components/Table";
import { MdDelete, MdEdit, MdNote } from "react-icons/md";
import { hasPermission } from "../../lib/utils";
import DataTransferModal from "@/components/Move User Data/TransferDataModal";

export default function RevokedUserTable() {
  const { token, user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // for target dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState(null);

  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);
  const hasEditUserPermission = hasPermission(
    permissionKeys,
    "administration:user-management:update"
  );
  const hasDeleteUserPermission = hasPermission(
    permissionKeys,
    "administration:user-management:delete"
  );

  useEffect(() => {
    loadRevokedUsers();
    loadAllUsers();
  }, []);

  const loadRevokedUsers = async () => {
    setLoading(true);
    try {
      const userData = await getRevokedTenantUsers(token);
      setUsers(userData);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const data = await getTenantUsers(token); // all active users for dropdown
      setAllUsers(data);
    } catch {
      console.error("Failed to load all users");
    }
  };

  const handleDelete = async (id) => {
    setDeletingUserId(id);
    try {
      await deleteUser(id, token);
      await loadRevokedUsers();
    } catch {
      alert("Error deleting user");
    } finally {
      setDeletingUserId(null);
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
      header: "Department",
      render: (user) => user.department?.name || "-",
    },
    {
      header: "Actions",
      render: (rowUser) => {
        const isCurrentUser = rowUser.id === user.id;
        const isAdminUser = rowUser.role?.name?.toLowerCase() === "admin+user";
        const canEdit = hasEditUserPermission && !isAdminUser;
        const canDelete =
          hasDeleteUserPermission && !isCurrentUser && !isAdminUser;
        const dataMigrated = rowUser?.data_transfered;

        return (
          <div className="flex gap-2 text-xs">
            {/* Transfer data button */}
            <DataTransferModal
              sourceUser={rowUser}
              targetUsers={allUsers.filter((u) => u.id !== rowUser.id)} // exclude the source user
              dataMigrated={dataMigrated}
              loadRevokedUsers={loadRevokedUsers}
            />
          </div>
        );
      },
    },
  ];

  if (error) return <p className="text-red-500">{error}</p>;
  if (loading) return <Loader />;

  return <Table columns={columns} data={users} />;
}

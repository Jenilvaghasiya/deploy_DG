import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { getTenantUsers } from "../../features/users/userService";
import { getUnreadCounts } from "../../features/messages/messageService";
import { cn } from "@/lib/utils";
import { Send, X, Users, CheckSquare, Square } from "lucide-react";

export default function ConversationList({ 
  activeId, 
  onSelect, 
  selectedIds, 
  onToggleSelect, 
  isSelectionMode, 
  onToggleSelectionMode,
  refreshUnreadTrigger // Optional prop to trigger unread count refresh
}) {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getTenantUsers();
        const filtered = data.filter((u) => u.id !== user.id);
        setUsers(filtered);
      } catch (err) {
        setError("Failed to load users");
      }
    };
    fetchUsers();
  }, [user?.id]);

  // Fetch unread counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const counts = await getUnreadCounts();
        setUnreadCounts(counts);
      } catch (err) {
        console.error("Failed to load unread counts:", err);
      }
    };
    fetchUnreadCounts();
  }, [user?.id, refreshUnreadTrigger]);

  // Poll for unread counts every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const counts = await getUnreadCounts();
        setUnreadCounts(counts);
      } catch (err) {
        console.error("Failed to refresh unread counts:", err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      // Deselect all
      filteredUsers.forEach((u) => onToggleSelect(u.id, false));
    } else {
      // Select all
      filteredUsers.forEach((u) => onToggleSelect(u.id, true));
    }
  };

  // Calculate total unread count
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <div className="p-4 border-b border-gray-700 bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Messages</h2>
            {totalUnread > 0 && !isSelectionMode && (
              <span className="bg-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={onToggleSelectionMode}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              isSelectionMode
                ? "bg-pink-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            title={isSelectionMode ? "Exit" : "Select multiple users"}
          >
            <Users className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 text-sm text-white rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-700"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSelectionMode && filteredUsers.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="mt-2 text-sm cursor-pointer text-pink-500 hover:text-pink-400 flex items-center gap-1"
          >
            {selectedIds.length === filteredUsers.length ? (
              <>
                <CheckSquare size={18} />
                Deselect All
              </>
            ) : (
              <>
                <Square size={18} />
                Select All ({filteredUsers.length})
              </>
            )}
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 p-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Team Members {isSelectionMode && `(${selectedIds.length} selected)`}
        </h3>
        <div className="flex flex-col gap-2">
          {filteredUsers.map((u) => {
            const isActive = activeId === u.id;
            const isSelected = selectedIds.includes(u.id);
            const unreadCount = unreadCounts[u.id] || 0;

            return (
              <div
                key={u.id}
                onClick={() => {
                  if (isSelectionMode) {
                    onToggleSelect(u.id, !isSelected);
                  } else {
                    onSelect(u);
                  }
                }}
                className={`rounded-xl cursor-pointer px-3 py-2.5 flex items-center gap-3 group transition-all ${
                  isActive && !isSelectionMode
                    ? "bg-pink-600/20 border-l-4 border-pink-500"
                    : isSelected
                    ? "bg-pink-600/10 border border-pink-500/50"
                    : "bg-gray-800/50 hover:bg-gray-800 border border-transparent"
                }`}
              >
                {isSelectionMode && (
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-pink-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                )}
                <div
                  className={`w-9 h-9 rounded-full bg-pink-600 flex items-center justify-center font-semibold flex-shrink-0 text-sm relative ${
                    isActive || isSelected ? "text-white" : "text-zinc-300"
                  }`}
                >
                  {u.full_name?.slice(0, 2).toUpperCase()}
                  {unreadCount > 0 && !isSelectionMode && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-900">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden flex-1">
                  <span
                    className={`text-sm truncate transition-colors ${
                      isActive || isSelected
                        ? "text-white font-semibold"
                        : "text-gray-200 font-medium group-hover:text-white"
                    }`}
                  >
                    {u.full_name}
                  </span>
                  <span
                    className={`text-xs truncate transition-colors ${
                      isActive || isSelected
                        ? "text-gray-300"
                        : "text-gray-400 group-hover:text-gray-300"
                    }`}
                  >
                    {u.email}
                  </span>
                </div>
                {unreadCount > 0 && !isSelectionMode && (
                  <div className="flex-shrink-0">
                    <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {filteredUsers.length === 0 && (
            <p className="text-xs text-gray-500 px-3 py-2 text-center">
              {searchTerm ? "No matching users found" : "No team members available"}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
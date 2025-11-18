import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ConversationList from "./ConversationList";
import ConversationView from "./ConversationView";
import { hasPermission } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import ApiTour from "@/components/Tour/ApiTour";
import { directMessagesTourSteps } from "@/components/Tour/TourSteps";
import { Send, X } from "lucide-react";
import { getTenantUsers } from "../../features/users/userService";
import { sendBulkDirectMessages } from "@/features/messages/messageService";
import { markMessagesAsRead } from "@/features/messages/messageService";
import { BulkMessageComposer } from "./BulkMessageComposer";
import { Button } from "@/components/ui/button";

export default function DirectMessages() {
  const { user } = useAuthStore();
  const [activeUserId, setActiveUserId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkComposer, setShowBulkComposer] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [refreshUnread, setRefreshUnread] = useState(0);
  
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);
  const hasCreateUserPermission = hasPermission(
    permissionKeys,
    "workspace:direct-messages:create"
  );

  // Fetch users dynamically
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getTenantUsers();
        const filtered = data.filter((u) => u.id !== user.id);
        setUsers(filtered);
      } catch (err) {
        console.error(err);
        setError("Failed to load users");
      }
    };
    fetchUsers();
  }, [user?.id]);

  const handleSelectUser = async (selectedUser) => {
    setActiveUserId(selectedUser.id);
    
    // Mark messages from this user as read
    try {
      await markMessagesAsRead(selectedUser.id);
      // Trigger unread count refresh
      setRefreshUnread(prev => prev + 1);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const handleToggleSelect = (userId, selected) => {
    setSelectedUserIds((prev) =>
      selected ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      // Exit selection mode
      setSelectedUserIds([]);
      setShowBulkComposer(false);
    }
  };

  const handleOpenBulkComposer = () => {
    if (selectedUserIds.length > 0) setShowBulkComposer(true);
  };

  const handleSendBulkMessage = async (message) => {
    try {
      const result = await sendBulkDirectMessages(selectedUserIds, message);
      
      if (result.success) {
        console.log("Bulk messages sent successfully:", result.data);
        setShowBulkComposer(false);
        setIsSelectionMode(false);
        setSelectedUserIds([]);
        
        // Show success notification
        alert(`Message sent to ${result.data.messages_sent} users!`);
        
        // Refresh unread counts
        setRefreshUnread(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to send bulk messages:", error);
      alert("Failed to send messages. Please try again.");
    }
  };

  const handleBackFromBulkComposer = () => {
    setShowBulkComposer(false);
    // Keep selection mode active so user can adjust selections
    setIsSelectionMode(true);
  };

  const handleCancelBulk = () => setShowBulkComposer(false);

  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
  
  // Find the active user for ConversationView
  const activeUser = users.find((u) => u.id === activeUserId);

  return (
    <div className="h-96 grow flex rounded-lg overflow-hidden border border-gray-800">
      <div className="w-80 border-r border-gray-700 flex-shrink-0 flex flex-col">
        <ConversationList
          activeId={activeUserId}
          onSelect={handleSelectUser}
          selectedIds={selectedUserIds}
          onToggleSelect={handleToggleSelect}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={handleToggleSelectionMode}
          refreshUnreadTrigger={refreshUnread}
        />

        {isSelectionMode && selectedUserIds.length > 0 && !showBulkComposer && (
          <div className="p-4 border-t border-gray-700 bg-zinc-900 flex justify-center">
            <Button
              variant={"dg_btn"}
              onClick={handleOpenBulkComposer}
              className="w-full py-2.5 rounded-lg font-medium flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Compose Message ({selectedUserIds.length})
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {showBulkComposer ? (
          <BulkMessageComposer
            selectedUsers={selectedUsers}
            onSend={handleSendBulkMessage}
            onCancel={handleCancelBulk}
            onBack={handleBackFromBulkComposer}
          />
        ) : activeUser && !isSelectionMode ? (
          <ConversationView 
            user={activeUser} 
            hasCreateUserPermission={hasCreateUserPermission}
            onMessageSent={() => setRefreshUnread(prev => prev + 1)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {isSelectionMode
                  ? "Select Users to Send Message"
                  : "No conversation selected"}
              </h3>
              <p className="text-sm text-gray-400">
                {isSelectionMode
                  ? `${selectedUserIds.length} user${selectedUserIds.length !== 1 ? "s" : ""} selected`
                  : "Choose a team member from the list to start messaging"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
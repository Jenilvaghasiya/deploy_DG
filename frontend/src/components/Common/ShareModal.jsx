import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IoMdShare } from "react-icons/io";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Copy, X } from "lucide-react";
import api from "@/api/axios";
import debounce from "lodash.debounce";
import toast from "react-hot-toast";

export default function ShareModal({ resourceType = null, resourceId = null, children }) {
  const [open, setOpen] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const fetchUsers = async (query) => {
    if (!query.trim()) return setUsers([]);
    try {
      const response = await api.get("/users/search-user", {
        params: { search: query },
      });
      setUsers(response.data.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchSharedUsers = async () => {
    try {
      const response = await api.get(
        `shares/${resourceType}/${resourceId}/users`
      );
      console.log(response?.data?.sharedUsers, "><><><");
      if (response.status === 200) {
        setSharedUsers(response?.data?.sharedUsers || []);
      } else {
        toast.error("Failed to fetch Shared Users");
      }
    } catch (error) {
      console.error("Error fetching shared users:", error);
      toast.error("Failed to fetch Shared Users");
    }
  };

  const handleRevoke = async (userData) => {
    console.log("Revoking access for user:", userData);
    try {
      const shareId = userData?.shareDetails?.shareId;
      const response = await api.delete(`shares/${shareId}`);
      console.log(response?.data?.sharedUsers, "><><><");
      if (response.status === 200) {
        toast.success("Successfully Revoked!");
        fetchSharedUsers();
      } else {
        toast.error("Failed to Revoke Access!");
      }
    } catch (error) {
      console.error("Error revoking access:", error);
      toast.error("Failed to Revoke Access!");
    }
  };

  const debouncedFetch = debounce(fetchUsers, 300);

  useEffect(() => {
    debouncedFetch(search);
    return () => debouncedFetch.cancel();
  }, [search]);

  useEffect(() => {
    if (open) {
      fetchSharedUsers();
    } else {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (search.trim().length > 0) setIsOpen(true);
    else setIsOpen(false);
    setHighlightedIndex(0);
  }, [search, users]);

  const onKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(users.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev - 1 < 0 ? Math.max(users.length - 1, 0) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (users.length > 0) {
        const u = users[highlightedIndex];
        if (u) handleShare(u);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const selectUser = (u) => {
    handleShare(u);
    setIsOpen(false);
  };

  const handleShare = async (user) => {
    try {
      console.log("Sharing with user:", user._id);

      const payload = {
        resourceType,
        resourceId,
        sharedWithUserId: user._id,
        permission: { read: true }, // Default permission
        notes: "some notes",
      };

      const response = await api.post("/shares", payload);
      if (response.status === 200) {
        toast.success("Invitation Sent Successfully!");
        setSearch("");
        fetchSharedUsers();
      } else {
        toast.error("Failed to send Invitation");
      }
    } catch (error) {
      console.error("Error sharing resource:", error);
      toast.error("Failed to send Invitation");
    }
  };

  const updatePermission = async (shareId, userId, newPermission) => {
    console.log("Updating permission:", {
      shareId,
      userId,
      newPermission,
      resourceType,
      resourceId,
    });
    // TODO: Implement API call to update permission
    try {
      const response = await api.patch(`shares/${shareId}`,{permission:newPermission});
      console.log(response?.data?.sharedUsers, "><><><");
      if (response.status === 200) {
        toast.success("Successfully Updated Permission!");
        fetchSharedUsers();
      } else {
        toast.error("Failed to Update Access!");
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error("Failed to Update Permission!");
    }
  };

  // Helper function to get current permission value
  const getCurrentPermission = (item) => {
    const permissions = item?.shareDetails?.permissions;

    if (!permissions) return "read"; // default fallback

    const { read, edit } = permissions;

    if (edit) return "editor"; // write implies editor
    if (read) return "read"; // only read access
    return "read"; // both false
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         {children || <Button variant="dg_btn"><IoMdShare />Share</Button>}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-0 text-zinc-900">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 p-2 space-y-2">
          <DialogTitle className="text-xl font-semibold mb-0 text-white">
            Share This {resourceType}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Invite your team to review and collaborate on this {resourceType?.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6 space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Add team member"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => search.trim() && setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 120)}
              className="pl-10 pr-10 text-white border-gray-200"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-controls="user-autocomplete-list"
            />

            {isOpen && (
              <div
  id="user-autocomplete-list"
  role="listbox"
  className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white cursor-pointer shadow-lg max-h-60 overflow-y-auto custom-scroll"
  onMouseDown={(e) => e.preventDefault()}
>
  {search.trim().length > 0 && users.length === 0 ? (
    <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
  ) : (
    users.map((user, idx) => {
      const active = idx === highlightedIndex;
      return (
        <button
          type="button"
          key={user._id}
          role="option"
          aria-selected={active}
          className={[
            "w-full px-3 py-2 text-left text-sm transition-colors",
            active
              ? "bg-[#ff00bb] text-white"
              : "bg-white text-gray-900 hover:bg-gray-100",
          ].join(" ")}
          onClick={() => selectUser(user)}
        >
          <div className="font-medium">{user.full_name}</div>
          <div
            className={active ? "text-xs text-blue-100" : "text-xs text-gray-500"}
          >
            {user.email}
          </div>
        </button>
      );
    })
  )}
</div>

            )}
          </div>

          {/* People with access */}
          {sharedUsers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white">
                People with access
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sharedUsers.map((item) => (
                  <div
                    key={item.shareDetails.shareId}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                        {item?.user?.full_name?.charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-200 truncate">
                            {item?.user?.full_name}
                          </p>
                        </div>
                        <p className="text-sm text-gray-300 truncate">
                          {item.user.email}
                        </p>
                      </div>
                    </div>

                    {/* Role Dropdown */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={getCurrentPermission(item)}
                        onValueChange={(newPermission) =>
                          updatePermission(
                            item.shareDetails.shareId,
                            item.user._id,
                            newPermission
                          )
                        }
                      >
                        <SelectTrigger className="w-28 h-9 text-white border-gray-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="read">Viewer</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-gray-600"
                        onClick={() => handleRevoke(item)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-gray-200 flex-row justify-between items-center sm:justify-between">
          <Button
            className="bg-gray-900 text-white hover:bg-gray-800 ml-auto"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

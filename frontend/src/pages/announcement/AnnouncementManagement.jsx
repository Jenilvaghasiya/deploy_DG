import { useEffect, useState } from "react";
import {
  createAnnouncementNotification,
  getAnnouncementNotifications,
  deleteAnnouncementNotification,
} from "../../features/notifications/notificationService";
import { useAuthStore } from "../../store/authStore";
import Button from "../../components/Button";
import { MdDelete } from "react-icons/md";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function AnnouncementManagement() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // For delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await getAnnouncementNotifications();
      console.log("Announcements:", res.data);
      setAnnouncements(res.data);
    } catch (err) {
      if (err?.response?.status === 403) {
        toast.error("Access denied. Only admins can manage announcements.");
        navigate("/user-projects");
      } else {
        console.error("Failed to load announcements", err);
        toast.error("Failed to load announcements.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!message.trim()) return toast.error("Please enter a message");
    try {
      await createAnnouncementNotification({ message });
      setMessage("");
      await fetchAnnouncements();
    } catch (err) {
      toast.error("Error creating announcement");
    }
  };

  const confirmDelete = (announcement) => {
    setAnnouncementToDelete(announcement);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteAnnouncementNotification(announcementToDelete.id);
      await fetchAnnouncements();
      setAnnouncementToDelete(null);
      setShowDeleteConfirm(false);
    } catch {
      toast.error("Error deleting announcement");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold text-white">Announcement Manager</h2>

      <div className="flex flex-col gap-2">
        <textarea
          className="p-2 border border-gray-600 rounded bg-zinc-800 text-white"
          placeholder="Enter announcement message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button onClick={handleCreate} size="small" fullWidth={false}>
            + Send Announcement
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-2">Sent Announcements</h3>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="text-gray-400">No announcements found.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((note) => (
              <div
                key={note.id}
                className="border border-zinc-600 p-4 rounded-md bg-zinc-900 flex justify-between items-center"
              >
                <div>
                  <p className="text-white">{note.message}</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Created at: {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => confirmDelete(note)}
                  className="text-red-400 hover:text-white text-xl"
                >
                  <MdDelete />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-white">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this announcement?
            </p>
            <p className="text-sm italic text-gray-400 mb-6">
              "{announcementToDelete?.message}"
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirmed}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// components/CommentModal.jsx
import React, { useState } from "react";
import { FaRegTrashAlt, FaEdit, FaUserCircle } from "react-icons/fa";
import { useAuthStore } from "@/store/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const CommentModal = ({
  trigger, // optional: a button or element to open modal
  isOpen,
  onClose,
  newComment,
  setNewComment,
  activePost,
  comments,
  handleAddComment,
  handleDeleteComment,
  handleEditComment,
  hasCommentAddPermission,
  hasCommentViewPermission,
}) => {
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const { user } = useAuthStore();

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)}d ago`;
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          {/* Add Comment */}
          {hasCommentAddPermission && (
            <div className="flex space-x-2 mb-4 mt-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 rounded text-white"
              />
              <button
                onClick={() => handleAddComment(activePost)}
                className="px-4 py-2 bg-blue-600 rounded"
              >
                Post
              </button>
            </div>
          )}

          {/* Show Comments */}
          {hasCommentViewPermission && (
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scroll">
              {comments[activePost]?.map((c) => (
                <div
                  key={c._id}
                  className="bg-gray-800 p-2 rounded flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <FaUserCircle size={24} className="text-gray-400" />
                        <span className="text-sm font-semibold">{c.user_id?.nick_name || "User"}</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(c.created_at)}</span>
                    </div>
                    {editingCommentId === c._id ? (
                        <div className="mt-2 flex items-center gap-2">
                            <Input
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                className="flex-1 border-none bg-transparent text-sm focus:ring-0 px-0 text-white"
                            />
                            <button
                                onClick={() => {
                                    handleEditComment(c._id, editedText, activePost);
                                    setEditingCommentId(null);
                                }}
                                className="text-xs text-blue-500 font-semibold"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setEditingCommentId(null)}
                                className="text-xs text-gray-400 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm mt-1 ml-8">
                            {c.text}
                        </p>
                    )}
                </div>

                  {/* Only owner sees Edit/Delete buttons */}
                  { hasCommentAddPermission && c.user_id?.id === user?.id && editingCommentId !== c._id && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingCommentId(c._id);
                          setEditedText(c.text);
                        }}
                        className="text-yellow-400 hover:text-yellow-500"
                        title="Edit Comment"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(c._id, activePost)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete Comment"
                      >
                        <FaRegTrashAlt className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;

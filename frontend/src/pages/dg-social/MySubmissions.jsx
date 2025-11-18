import React, { useEffect, useState } from "react";
import { Pencil, Calendar, Trash2, Eye, X } from "lucide-react";
import EditPostModal from "./EditPostModal"
import api from "@/api/axios";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { useAuthStore } from "@/store/authStore";
import { hasPermission } from "@/lib/utils";
import { FaUserCircle } from "react-icons/fa";
import SmartImage from "@/components/SmartImage";

const MySubmissions = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null); // post being edited
  const [formData, setFormData] = useState({ title: "", description: "", });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map(p => p.key);
  const hasPostCreatePermission = hasPermission(permissionKeys, 'social:post:create');
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/social/post/get?filter=pending");
      const data = response?.data?.data || [];
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err?.response?.data?.message || "Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id) => {
    setDeletingPostId(id);
    try {
      await api.delete(`/social/post/delete/${id}`);
      toast.success("Post deleted successfully!");
      fetchPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
      alert(err?.response?.data?.message || "Failed to delete post.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleEditClick = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      description: post.description || "",
    });
  };

const handleUpdatePost = async (updatedData) => {
  if (!editingPost) return;
  setSaving(true);
console.log(updatedData, 'pppppppppppppp');

  try {
    const formData = new FormData();
    formData.append("title", updatedData.title);
    formData.append("description", updatedData.description);

    // only append if user picked a new image
    if (updatedData.image) {
      formData.append("image", updatedData.image);
    }

    await api.put(`/social/post/update/${editingPost._id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setEditingPost(null);
    fetchPosts();
  } catch (err) {
    console.error("Error updating post:", err);
    alert(err?.response?.data?.message || "Failed to update post.");
  } finally {
    setSaving(false);
  }
};


  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div>
      <div className="max-w-2xl mx-auto border border-solid shadow-sm mt-6 !bg-white/10 border-white/35 rounded-xl border-shadow-blurs">
        {/* Header */}
        <div className="sticky top-0 z-10  p-6 rounded-t-xl border-white/35 bg-zinc-600">
          <h1 className="text-2xl font-bold text-white">My Posts</h1>
          <p className="text-gray-400 text-sm mt-1">{posts.length} posts</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <h3 className="text-red-400 font-medium">Error</h3>
            <p className="text-red-300 text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16 mx-6">
            <div className="w-16 h-16  rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No posts yet</h3>
            <p className="text-gray-500">Your posts will appear here once you create them.</p>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-0">
          {posts
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((post) => (
              <div
                key={post._id}
                className=" border-b border-gray-800"
              >
                

                {/* Post Content */}
                <div className="px-6 pb-4 mt-6">
                  <div className="flex gap-2 items-center">
                    <FaUserCircle size={36} className="text-gray-300" />
                    <h2 className="text-gray-300">
                      {post.user_id.nick_name || "Me"}
                    </h2>
                  </div>
                  {post.title && (
                    <h4 className="text-lg font-medium text-white my-2">{post.title}</h4>
                  )}
                  {post.url && (
                    <SmartImage
                    src={post.url}
                    alt={post.title || "Post image"}
                    className="w-full rounded-xl max-h-max object-cover border border-gray-700 mt-4"
                    />
                  )}
                  {post.description && (
                    <p className="text-gray-400 leading-relaxed whitespace-pre-wrap py-2">{post.description}</p>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeAgo(post.created_at)}</span>
                    </div>
                </div>
                {/* Post Header */}
                <div className="px-6 pb-3">
                  <div className="flex items-center space-x-2">
                    {/* Delete */}
                    {post.user_id?.id === user?.id && (
                        <ConfirmDeleteDialog
                          title="Delete Post"
                          message="Are you sure you want to delete this post?"
                          onDelete={() => handleDeletePost(post._id)} // <-- your delete logic here
                        >
                          <button className={`p-2 text-gray-400 cursor-pointer hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors ${
                            post.user_id?.id !== user?.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}>
                            
                            {deletingPostId === post.id ? (
                              <div className="w-4 h-4 border-2  border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4 text-gray-400 cursor-pointer" />
                            )}
                          </button>
                        </ConfirmDeleteDialog>
                      )}
                    {/* Edit */}
                    {hasPostCreatePermission && (
                      <button
                        onClick={() => handleEditClick(post)}
                        className="p-2 text-gray-400 hover:text-blue-400 cursor-pointer hover:bg-blue-500/10 rounded-full transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Edit Modal */}
      <EditPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleUpdatePost}
        saving={saving}
      />
    </div>
  );
};

export default MySubmissions;

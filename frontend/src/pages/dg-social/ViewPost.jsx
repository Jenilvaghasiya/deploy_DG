import React, { useEffect, useState } from "react";
import { BsPencil, BsHandThumbsUp, BsHandThumbsUpFill, BsHandThumbsDown, BsHandThumbsDownFill } from "react-icons/bs";
import CommentModal from "./CommentModal";
import { FaFlag, FaRegComment, FaStar, FaUserCircle } from "react-icons/fa";
import { MdReviews } from "react-icons/md";
import { MoreHorizontal, User, Calendar, Trash2, Eye } from "lucide-react";
import api from "@/api/axios";
import { useAuthStore } from "@/store/authStore";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { toast } from "react-hot-toast";
import ReportDialog from "./ReportModal";
import ReviewModal from "./ReviewModal";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/lib/utils";
import { SlCalender } from "react-icons/sl";
import ApiTour from "@/components/Tour/ApiTour";
import { socialPostSteps } from "@/components/Tour/TourSteps";
import SmartImage from "@/components/SmartImage";

const StrapiPostList = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [activePost, setActivePost] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [reportingPostId, setReportingPostId] = useState(null);
  const [reportType, setReportType] = useState("");
  const [reportText, setReportText] = useState("");
  const [reviewingPostId, setReviewingPostId] = useState(null);
  const [reviewText, setReviewText] = useState({});
  const [reviewRating, setReviewRating] = useState({});
  const [submittingReview, setSubmittingReview] = useState({});
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map(p => p.key);
  const hasPostViewPermission = hasPermission(permissionKeys, "social:post:view")
  const hasFeedbackAddPermission = hasPermission(permissionKeys, "social:post:feedback:view")
  const hasFeedbackViewPermission = hasPermission(permissionKeys, "social:post:feedback:view")
  const hasCommentAddPermission = hasPermission(permissionKeys, "social:post:comment:create")
  const hasCommentViewPermission = hasPermission(permissionKeys, "social:post:comment:view")
  const hasReviewAddPermission = hasPermission(permissionKeys, "social:post:review:create")
  const hasReviewViewPermission = hasPermission(permissionKeys, "social:post:review:view")
  const hasReportAddPermission = hasPermission(permissionKeys, "social:post:report:create")

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/social/post/get?filter=approved");
      const data = response?.data?.data || [];
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err?.response?.data?.message || "Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    setDeletingPostId(postId);
    try {
      await api.delete(`/social/post/delete/${postId}`);
      fetchPosts();
      toast.success("Post deleted successfully!");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error(err?.response?.data?.message || "Failed to delete post.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.get(`/social/post/like/${postId}`);
      fetchPosts();
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleDislike = async (postId) => {
    try {
      await api.get(`/social/post/unlike/${postId}`);
      fetchPosts();
    } catch (err) {
      console.error("Error disliking post:", err);
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;
    try {
      await api.post("/social/post/comment/add", {
        postId,
        text: newComment,
      });
      setNewComment("");
      fetchComments(postId);
       setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId
          ? { ...post, comments: [...(post.comments || []), { text: newComment }] }
          : post
      )
    );
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Fixed review submission function
  const handleAddReview = async (postId) => {
    const text = reviewText[postId]?.trim();
    const rating = reviewRating[postId];
    
    if (!text || !rating) {
      toast.error("Please provide both a review and rating");
      return;
    }

    setSubmittingReview(prev => ({ ...prev, [postId]: true }));
    
    try {
      await api.post("/social/post/review/add", {
        postId,
        comment: text,
        rating,
        status: "pending",
        useful: 0,
        notUseful: 0,
        reports: []
      });
      
      // Clear form
      setReviewText(prev => ({ ...prev, [postId]: "" }));
      setReviewRating(prev => ({ ...prev, [postId]: 0 }));
      
      // Refresh posts to show new review
      fetchPosts();
      toast.success("Review submitted successfully!");
      
    } catch (err) {
      console.error("Error adding review:", err);
      toast.error(err?.response?.data?.message || "Failed to add review");
    } finally {
      setSubmittingReview(prev => ({ ...prev, [postId]: false }));
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await api.get(`/social/post/comment/get/${postId}`);
      setComments((prev) => ({ ...prev, [postId]: res.data.data || [] }));
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    try {
      await api.delete(`/social/post/comment/delete/${postId}/${commentId}`);
      fetchComments(postId);
      
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };
  
  const handleEditComment = async (commentId, newText, postId) => {
    if (!newText.trim()) return;

    try {
      await api.put(`/social/post/comment/update/${postId}/${commentId}`, {
        text: newText,
        postId,
      });
      fetchComments(postId);
    } catch (err) {
      console.error("Error editing comment:", err);
      alert(err?.response?.data?.message || "Failed to edit comment.");
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

  const getStatusBadge = (status) => {
    const statusColors = {
      published: "bg-green-500/20 text-green-400 border-green-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return statusColors[status] || statusColors.draft;
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const renderStars = (rating, interactive = false, postId = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
            i <= rating ? "text-yellow-400" : "text-gray-400"
          }`}
          onClick={interactive && postId ? () => setReviewRating(prev => ({ ...prev, [postId]: i })) : undefined}
        />
      );
    }
    return stars;
  };

  if (loading && posts?.length < 0){
    return (
      <div className="">
        <div className="max-w-2xl mx-auto p-6 ">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className=" rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-32"></div>
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-64 bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (hasPostViewPermission) {
    return (
        <div className="max-w-2xl mx-auto border border-solid shadow-sm mt-6 !bg-white/10 border-white/35 rounded-xl border-shadow-blurs">
          <ApiTour
            steps={socialPostSteps}
            tourName={`viewPostTour`}
          />
          {/* Header */}
          <div className="sticky top-0 z-10  p-6 rounded-t-xl bg-zinc-50 hover:!bg-black/25 border-shadow-blur">
            <h1 className="text-2xl font-bold text-white">Posts</h1>
            <p className="text-gray-400 text-sm mt-1">{posts.length} posts</p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <h3 className="text-red-400 font-medium">Error</h3>
              </div>
              <p className="text-red-300 text-sm mt-2">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-16 mx-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-500">
                Your posts will appear here once you create them.
              </p>
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-0">
            {posts
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((post) => (
                <div
                  key={post.id}
                  className=" border-b border-gray-800 "
                >               
                  {/* Post Content */}
                  <div className="px-6 mt-4">
                    <div className="flex gap-2 items-center post-owner-name">
                      <FaUserCircle size={36} className="text-gray-300" />
                      <h2 className="text-gray-300">
                        {post.user_id.nick_name}
                      </h2>
                    </div>
                    {post.title && (
                      <div className="mb-4">
                        {/* {post.title && (
                          <h5 className="text-lg font-medium text-white mb-2">
                            {post.title}
                          </h5>
                        )} */}
                        {post.url && (
                          <SmartImage
                            src={post.url}
                            alt={post.title || "Post image"}
                            className="w-full rounded-xl max-h-max object-cover border border-gray-700 mt-4"
                          />
                        )}
                        {post.description && (
                          <p className="text-gray-200 pb-2 leading-relaxed whitespace-pre-wrap mt-4">
                            {post.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeAgo(post.created_at)}</span>
                    </div>
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="px-6 pb-6">
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                      <div className="flex items-center space-x-6">
                        {hasFeedbackViewPermission && (
                          <>
                          <button
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center cursor-pointer space-x-2 px-3 py-2 rounded-full transition-all ${
                              post.likes?.includes(user.id)
                                ? "text-green-500 bg-green-500/10"
                                : "text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                            }`}
                          >
                            {post.likes?.includes(user.id) ? (
                              <BsHandThumbsUpFill className="w-5 h-5" />
                            ) : (
                              <BsHandThumbsUp className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                          </button>
                          <button
                            onClick={() => handleDislike(post._id)}
                            className={`flex items-center cursor-pointer space-x-2 px-3 py-2 rounded-full transition-all ${
                              post.dislikes?.includes(user.id)
                                ? "text-red-500 bg-red-500/10"
                                : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                            }`}
                          >
                            {post.dislikes?.includes(user.id) ? (
                              <BsHandThumbsDownFill className="w-5 h-5" />
                            ) : (
                              <BsHandThumbsDown className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">{post.dislikes?.length || 0}</span>
                          </button>

                          </>
                        )}
                        {(hasCommentAddPermission || hasCommentViewPermission) && (
                          <>
                            <button
                              onClick={() => {
                                setActivePost(post._id);
                                fetchComments(post._id);
                                setShowCommentModal(true);
                              }}
                              className="flex items-center cursor-pointer space-x-2 px-3 py-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all"
                            >
                              <FaRegComment className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {post.comments?.length || 0}
                              </span>
                            </button>
                          </>
                        )}
                        {hasReportAddPermission && (
                        <button
                          onClick={() => setReportingPostId(post._id)}
                          className="flex items-center cursor-pointer space-x-2 px-3 py-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-full transition-all"
                        >
                          <FaFlag className="w-5 h-5" />
                          <span className="text-sm font-medium">Report</span>
                        </button>
                        )}
                        {(hasReviewAddPermission || hasReviewViewPermission) && (
                          <>
                            {/* <button
                              onClick={() => setReviewingPostId(post._id)}
                              className="flex items-center cursor-pointer space-x-2 px-3 py-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all"
                            >
                              <MdReviews className="w-5 h-5" />
                              <span className="text-sm font-medium">Review</span>
                            </button> */}

                            <ReportDialog
                              postId={post._id}
                              userId={user?.id}
                              open={reportingPostId === post._id}
                              onOpenChange={(isOpen) => !isOpen && setReportingPostId(null)}
                              type={post}
                            />
                          </>
                        )}
                        {post.user_id?.id === user?.id && (
                          <ConfirmDeleteDialog
                            title="Delete Post"
                            message="Are you sure you want to delete this post?"
                            onDelete={() => handleDeletePost(post._id)}
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
                        <CommentModal
                          isOpen={!!activePost}
                          onClose={() => setActivePost(null)}
                          newComment={newComment}
                          setNewComment={setNewComment}
                          activePost={activePost}
                          comments={comments}
                          handleAddComment={handleAddComment}
                          handleDeleteComment={handleDeleteComment}
                          handleEditComment={handleEditComment}
                          hasCommentAddPermission={hasCommentAddPermission}
                          hasCommentViewPermission={hasCommentViewPermission}
                        />
                        <ReviewModal
                          isOpen={!!reviewingPostId}
                          postId={reviewingPostId}
                          onClose={() => setReviewingPostId(null)}
                          reviewAddPermisson={hasReviewAddPermission}
                          reviewViewPermisson={hasReviewViewPermission}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
    );
  }
};

export default StrapiPostList;
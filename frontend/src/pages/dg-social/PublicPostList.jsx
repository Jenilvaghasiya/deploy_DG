import React, { useEffect, useState } from "react";
import { BsHandThumbsUp, BsHandThumbsUpFill, BsHandThumbsDown, BsHandThumbsDownFill } from "react-icons/bs";
import { FaFlag, FaRegComment, FaUserCircle } from "react-icons/fa";
import { MdReviews } from "react-icons/md";
import { Trash2, Calendar, Eye } from "lucide-react";
import api from "@/api/axios";
import { useAuthStore } from "@/store/authStore";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { toast } from "react-hot-toast";
import ReportDialog from "./ReportModal";
import ReviewModal from "./ReviewModal";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/lib/utils";
import ApiTour from "@/components/Tour/ApiTour";
import { socialPostSteps } from "@/components/Tour/TourSteps";
import SmartImage from "@/components/SmartImage";
import { BASE_URL } from "@/config/env";
import AuthPromptModal from "@/components/AuthPromptModal";
import CommentModal from "./CommentModal";

const PublicPostList = () => {  
  const { user } = useAuthStore();
  const isUserLoggedIn = !!user; 
  const isPublic = !isUserLoggedIn;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalAction, setAuthModalAction] = useState("interact");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [activePost, setActivePost] = useState(null);
  const [reportingPostId, setReportingPostId] = useState(null);
  const [reviewingPostId, setReviewingPostId] = useState(null);
  const [reviewText, setReviewText] = useState({});
  const [reviewRating, setReviewRating] = useState({});
  const [submittingReview, setSubmittingReview] = useState({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activePostForComment, setActivePostForComment] = useState(null);
  
  const permissions = !isPublic ? (user?.role?.permissions || []) : [];
  const permissionKeys = permissions.map(p => p.key);

  const hasFeedbackAddPermission = isUserLoggedIn && hasPermission(permissionKeys, "social:post:feedback:view");
  const hasCommentAddPermission = isUserLoggedIn && hasPermission(permissionKeys, "social:post:comment:create");
  const hasReviewAddPermission = isUserLoggedIn && hasPermission(permissionKeys, "social:post:review:create");
  const hasReportAddPermission = isUserLoggedIn && hasPermission(permissionKeys, "social:post:report:create");

  // Require auth modal helper
  const requireAuth = (actionType, callback) => {
    if (!isUserLoggedIn) {
      setAuthModalAction(actionType);
      setShowAuthModal(true);
      return false;
    }
    if (callback) callback();
    return true;
  };

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/social/posts?filter=approved`);
      const data = await response.json();
      setPosts(data?.data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err?.response?.data?.message || "Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  };

  // Post actions
  const handleDeletePost = async (postId) => {
    if (!requireAuth("delete")) return;
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
    if (!requireAuth("like")) return;
    try {
      await api.get(`/social/post/like/${postId}`);
      fetchPosts();
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleDislike = async (postId) => {
    if (!requireAuth("like")) return;
    try {
      await api.get(`/social/post/unlike/${postId}`);
      fetchPosts();
    } catch (err) {
      console.error("Error disliking post:", err);
    }
  };

  const handleCommentClick = (postId) => {
    if (!requireAuth("comment")) return;
    setActivePostForComment(postId);
    fetchComments(postId);
    setCommentModalOpen(true);
  };

  const handleReviewClick = (postId) => {
    requireAuth("review", () => {
      setReviewingPostId(postId);
    });
  };

  const handleReportClick = (postId) => {
    requireAuth("report", () => {
      setReportingPostId(postId);
    });
  };

  // Comments
  const fetchComments = async (postId) => {
    try {
      const res = await api.get(`/social/post/comment/get/${postId}`);
      setComments((prev) => ({ ...prev, [postId]: res.data.data || [] }));
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleAddComment = async (postId) => {
    if (!requireAuth("comment")) return;
    if (!newComment.trim()) return;
    try {
      await api.post("/social/post/comment/add", { postId, text: newComment });
      setNewComment("");
      fetchComments(postId);
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleAddReview = async (postId) => {
    if (!requireAuth("review")) return;
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

      setReviewText(prev => ({ ...prev, [postId]: "" }));
      setReviewRating(prev => ({ ...prev, [postId]: 0 }));
      fetchPosts();
      toast.success("Review submitted successfully!");
    } catch (err) {
      console.error("Error adding review:", err);
      toast.error(err?.response?.data?.message || "Failed to add review");
    } finally {
      setSubmittingReview(prev => ({ ...prev, [postId]: false }));
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
      await api.put(`/social/post/comment/update/${postId}/${commentId}`, { text: newText, postId });
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

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="pb-4 min-h-screen bg-black text-white flex flex-col overflow-hidden relative 
      dg-footer 
      before:size-32 sm:before:size-48 md:before:size-56 lg:before:size-80 xl:before:size-96 
      before:bg-no-repeat before:bg-cover before:absolute 
      before:-top-32 sm:before:-top-48 md:before:-top-56 
      before:-right-16 sm:before:-right-20 md:before:-right-28 xl:before:right-10 
      after:size-32 sm:after:size-48 md:after:size-56 lg:after:size-80 xl:after:size-96 
      after:bg-no-repeat after:bg-cover after:absolute 
      after:-bottom-32 sm:after:-bottom-48 md:after:-bottom-72 
      after:-left-10 sm:after:-left-16 md:after:-left-20 
      bg-purple-vectore">
      
      {/* Header */}
      <div className="sticky top-14 sm:top-16 z-10 pt-6 sm:pt-8 md:pt-10 p-4 sm:p-6 rounded-t-xl backdrop-blur-md border-b border-white/30 mb-16 sm:mb-12 md:mb-16">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Gallery Posts</h1>
          <p className="text-gray-200 text-xs sm:text-sm mt-1">{posts.length} posts</p>
        </div>
      </div>
      
      <div className="w-full relative z-10 max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 
        mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="border border-solid shadow-sm mt-3 sm:mt-6 
          !bg-white/10 border-white/35 rounded-lg sm:rounded-xl border-shadow-blurs">

          {/* Error */}
          {error && (
            <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-6 p-3 sm:p-4 
              bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <h3 className="text-red-400 font-medium text-sm sm:text-base">Error</h3>
              </div>
              <p className="text-red-300 text-xs sm:text-sm mt-2">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-8 sm:py-12 md:py-16 mx-3 sm:mx-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 
                rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Eye className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-500" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-1 sm:mb-2">
                No posts yet
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-500 px-4">
                Your posts will appear here once you create them.
              </p>
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-0">
            {posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((post) => (
              <div key={post._id} className="border-gray-800 mt-3 sm:mt-6">
                <div className="px-3 sm:px-4 md:px-6 mt-3 sm:mt-4">
                  <div className="flex gap-2 sm:gap-3 items-center post-owner-name">
                    <FaUserCircle size={window.innerWidth < 640 ? 28 : 36} className="text-gray-300" />
                    <h2 className="text-gray-300 text-sm sm:text-base">{post.user_id.nick_name}</h2>
                  </div>

                  {post.title && (
                    <div className="mb-3 sm:mb-4">
                      {post.url && (
                        <SmartImage 
                          src={post.url} 
                          alt={post.title} 
                          className="w-full rounded-lg sm:rounded-xl max-h-max sm:max-h-max md:max-h-max 
                            object-cover border border-gray-700 mt-3 sm:mt-4" 
                        />
                      )}
                      {post.description && (
                        <p className="text-gray-200 pb-1 sm:pb-2 leading-relaxed whitespace-pre-wrap 
                          mt-3 sm:mt-4 text-xs sm:text-sm md:text-base">
                          {post.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-1 sm:space-x-2 
                        text-xs sm:text-sm text-gray-400">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{formatTimeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                  <div className="flex items-center justify-between pt-2 sm:pt-3 
                    border-t border-gray-800 overflow-x-auto">
                    <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-6 min-w-max">
                      {/* Like/Dislike */}
                      <button 
                        onClick={() => handleLike(post._id)} 
                        className={`flex items-center cursor-pointer space-x-1 sm:space-x-2 
                          px-2 sm:px-3 py-1.5 sm:py-2 rounded-full transition-all 
                          ${post.likes?.includes(user?.id) 
                            ? "text-green-500 bg-green-500/10" 
                            : "text-gray-400 hover:text-green-400 hover:bg-green-500/10"}`}>
                        {post.likes?.includes(user?.id) ? (
                          <BsHandThumbsUpFill className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        ) : (
                          <BsHandThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        )}
                        <span className="text-xs sm:text-sm font-medium">
                          {post.likes?.length || 0}
                        </span>
                      </button>
                      
                      <button 
                        onClick={() => handleDislike(post._id)} 
                        className={`flex items-center cursor-pointer space-x-1 sm:space-x-2 
                          px-2 sm:px-3 py-1.5 sm:py-2 rounded-full transition-all 
                          ${post.dislikes?.includes(user?.id) 
                            ? "text-red-500 bg-red-500/10" 
                            : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"}`}>
                        {post.dislikes?.includes(user?.id) ? (
                          <BsHandThumbsDownFill className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        ) : (
                          <BsHandThumbsDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        )}
                        <span className="text-xs sm:text-sm font-medium">
                          {post.dislikes?.length || 0}
                        </span>
                      </button>

                      {/* Comment */}
                      <button 
                        onClick={() => handleCommentClick(post._id)} 
                        className="flex items-center cursor-pointer space-x-1 sm:space-x-2 
                          px-2 sm:px-3 py-1.5 sm:py-2 text-gray-400 
                          hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all">
                        <FaRegComment className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        <span className="text-xs sm:text-sm font-medium">
                          {post.comments?.length || 0}
                        </span>
                      </button>

                      {/* Report - Hidden on mobile, shown on sm and up */}
                      <button 
                        onClick={() => handleReportClick(post._id)} 
                        className="hidden sm:flex items-center cursor-pointer space-x-1 sm:space-x-2 
                          px-2 sm:px-3 py-1.5 sm:py-2 text-gray-400 
                          hover:text-yellow-400 hover:bg-yellow-500/10 rounded-full transition-all">
                        <FaFlag className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        <span className="text-xs sm:text-sm font-medium">Report</span>
                      </button>

                      {/* Review - Hidden on mobile, shown on md and up */}
                      <button 
                        onClick={() => handleReviewClick(post._id)} 
                        className="hidden md:flex items-center cursor-pointer space-x-1 sm:space-x-2 
                          px-2 sm:px-3 py-1.5 sm:py-2 text-gray-400 
                          hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all">
                        <MdReviews className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        <span className="text-xs sm:text-sm font-medium">Review</span>
                      </button>

                      {/* Delete */}
                      {post.user_id?.id === user?.id && (
                        <ConfirmDeleteDialog 
                          title="Delete Post" 
                          message="Are you sure you want to delete this post?" 
                          onDelete={() => handleDeletePost(post._id)}>
                          <button className="p-1.5 sm:p-2 text-gray-400 cursor-pointer 
                            hover:text-red-400 hover:bg-red-500/10 rounded-full">
                            {deletingPostId === post._id ? (
                              <div className="w-3 h-3 sm:w-4 sm:h-4 
                                border-2 border-gray-400 border-t-transparent 
                                rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 cursor-pointer" />
                            )}
                          </button>
                        </ConfirmDeleteDialog>
                      )}

                      {/* Mobile menu for Report and Review */}
                      <div className="flex sm:hidden items-center space-x-1">
                        <button 
                          onClick={() => handleReportClick(post._id)} 
                          className="p-1.5 text-gray-400 hover:text-yellow-400">
                          <FaFlag className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleReviewClick(post._id)} 
                          className="p-1.5 text-gray-400 hover:text-blue-400">
                          <MdReviews className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Modals */}
                      <ReportDialog 
                        postId={post._id} 
                        userId={user?.id} 
                        open={reportingPostId === post._id} 
                        onOpenChange={(isOpen) => !isOpen && setReportingPostId(null)} 
                        type={post} 
                      />
                      <ReviewModal 
                        isOpen={!!reviewingPostId} 
                        postId={reviewingPostId} 
                        onClose={() => setReviewingPostId(null)} 
                        reviewAddPermisson={hasReviewAddPermission} 
                        reviewViewPermisson={true} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Auth Prompt Modal */}
          <AuthPromptModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            actionType={authModalAction}
          />
          
          <CommentModal
            isOpen={commentModalOpen}
            onClose={() => setCommentModalOpen(false)}
            newComment={newComment}
            setNewComment={setNewComment}
            activePost={activePostForComment}
            comments={comments}
            handleAddComment={handleAddComment}
            handleDeleteComment={handleDeleteComment}
            handleEditComment={handleEditComment}
            hasCommentAddPermission={hasCommentAddPermission}
            hasCommentViewPermission={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PublicPostList;
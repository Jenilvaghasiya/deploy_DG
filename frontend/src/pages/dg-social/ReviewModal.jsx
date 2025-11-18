import React, { useState, useEffect } from "react";
import { FaStar , FaUserCircle, FaFlag, FaTrash } from "react-icons/fa";
import { FaRegThumbsDown } from "react-icons/fa";
import { FaRegThumbsUp } from "react-icons/fa";
import { IoTrash } from "react-icons/io5";
import toast from "react-hot-toast";
import api from "@/api/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import ReviewReportDialog from "./ReviewReportModal";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/config/env";

const ReviewModal = ({ isOpen, onClose, postId, reviewAddPermisson, reviewViewPermisson }) => {
  const { user } = useAuthStore();
  const isUserLoggedIn = !!user; 
  const isPublic = !isUserLoggedIn;

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [reportingPostId, setReportingPostId] = useState(null);
  // Fetch current user review
  useEffect(() => {
    if (!isOpen || !isUserLoggedIn) return;
    const fetchUserReview = async () => {
      try {
        const res = await api.get(`/social/post/review/user/${postId}`);
        if (res.data?.data) {
          setUserReview(res.data.data);
          setReviewText(res.data.data.comment);
          setReviewRating(res.data.data.rating);
        } else {
          setUserReview(null);
          setReviewText("");
          setReviewRating(0);
        }
      } catch (err) {
        console.error("Failed to fetch user review:", err);
      }
    };
    fetchUserReview();
  }, [isOpen, postId, isUserLoggedIn]);

  // Fetch all reviews
  useEffect(() => {
    if (!isOpen) return;
    const fetchAllReviews = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/social/posts/reviews?filter=approved&post_id=${postId}`
        );
        const data = await res.json();
         const reviewsWithUserMark = (data?.data || []).map((r) => ({
        ...r,
        userMark: r.useful?.includes(user?.id)
          ? "useful"
          : r.not_useful?.includes(user?.id)
          ? "not_useful"
          : null,
      }));
        
        setAllReviews(reviewsWithUserMark);
      } catch (err) {
        console.error("Failed to fetch all reviews:", err);
      }
    };
    fetchAllReviews();
  }, [isOpen, postId,user?.id]);
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, value] of Object.entries(intervals)) {
      const count = Math.floor(seconds / value);
      if (count >= 1) {
        return count === 1 ? `1 ${unit} ago` : `${count} ${unit}s ago`;
      }
    }
    return "Just now";
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`cursor-pointer ${i < reviewRating ? "text-yellow-400" : "text-gray-400"}`}
        onClick={() => setReviewRating(i + 1)}
      />
    ));
  };
  const handleSubmit = async () => {
    if (!isUserLoggedIn) {
      toast.error("Please login to submit a review");
      return;
    }
    if (reviewRating === 0) {
      toast.error("Please provide rating");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/social/post/review/create", {
        reviewId: userReview?._id,
        postId,
        comment: reviewText,
        rating: reviewRating,
      });
      toast.success(userReview ? "Review updated successfully!" : "Review submitted successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

 const handleDelete = async (reviewId) => {
    if (isPublic) return;
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/social/post/review/${reviewId}`);
      toast.success("Review deleted successfully");
      setAllReviews(allReviews.filter((r) => r._id !== reviewId));
      if (userReview?._id === reviewId) {
        setUserReview(null);
        setReviewText("");
        setReviewRating(0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete review");
    }
  };

// --- inside ReviewModal component ---
const handleUseful = async (reviewId) => {
  if (isPublic) return;

  setAllReviews((prev) =>
    prev.map((r) => {
      if (r._id !== reviewId) return r;

      let newUseful = r.useful || [];
      let newNotUseful = r.not_useful || [];
      let userMark = r.userMark;

      if (r.userMark === "useful") {
        // toggle off
        newUseful = newUseful.filter((id) => id !== user.id);
        userMark = null;
      } else {
        // mark useful
        newUseful = [...newUseful, user.id];
        newNotUseful = newNotUseful.filter((id) => id !== user.id);
        userMark = "useful";
      }

      return { ...r, useful: newUseful, not_useful: newNotUseful, userMark };
    })
  );

  try {
    await api.get(`/social/post/review/mark-useful/${reviewId}`);
  } catch (err) {
    console.error(err);
    toast.error("Failed to mark useful");
  }
};

const handleNotUseful = async (reviewId) => {
  if (isPublic) return;

  setAllReviews((prev) =>
    prev.map((r) => {
      if (r._id !== reviewId) return r;

      let newUseful = r.useful || [];
      let newNotUseful = r.not_useful || [];
      let userMark = r.userMark;

      if (r.userMark === "not_useful") {
        // toggle off
        newNotUseful = newNotUseful.filter((id) => id !== user.id);
        userMark = null;
      } else {
        // mark not useful
        newNotUseful = [...newNotUseful, user.id];
        newUseful = newUseful.filter((id) => id !== user.id);
        userMark = "not_useful";
      }

      return { ...r, useful: newUseful, not_useful: newNotUseful, userMark };
    })
  );

  try {
    await api.get(`/social/post/review/mark-not-useful/${reviewId}`);
  } catch (err) {
    console.error(err);
    toast.error("Failed to mark not useful");
  }
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=" max-w-md w-full rounded-xl p-6 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold">
            {isPublic
              ? "User Reviews"
              : userReview && userReview.status === "approved"
              ? "Reviews"
              : userReview
              ? "Edit Your Review"
              : "Add Your Review"}
          </DialogTitle>
        </DialogHeader>

        {/* Show form only if review is not approved */}
          {!isPublic && reviewAddPermisson && (!userReview || userReview.status !== "approved") && (
            <>
              {/* Review Form */}
              <div className="flex items-center mb-4">
                {renderStars()}{" "}
                {reviewRating > 0 && (
                  <span className="ml-2 text-gray-400">({reviewRating}/5)</span>
                )}
              </div>
              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review..."
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 resize-none mb-3"
              />
              <div className="flex justify-end space-x-2 mb-6">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white cursor-pointer hover:bg-gray-600"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-lg cursor-pointer text-white ${
                    submitting
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : userReview
                    ? "Update"
                    : "Submit"}
                </button>
              </div>
            </>
          )}
        {/* All Reviews */}
         {reviewViewPermisson && allReviews.length === 0 && (
          <p className="text-gray-400 text-sm">No reviews yet.</p>
        )}
        {reviewViewPermisson && allReviews.length > 0 &&  (
          <div>
            {allReviews.map((review) => (
                <div key={review._id} className="border-b border-gray-700 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex gap-2 items-center">
                        <FaUserCircle className="text-gray-300" />
                        <p className="text-gray-300 text-sm">
                          {review.user_id.nick_name}
                        </p>
                      </div>
                      <div className="flex text-gray-300 items-center">
                        <p className="text-yellow-400 mr-2">
                          {"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}
                        </p>
                        <p className="text-sm">{timeAgo(review.created_at)}</p>
                      </div>
                      <p className="text-gray-400 text-sm">
                        <strong>Review:</strong> {review.comment}
                      </p>
                    </div>
                  {!isPublic && (

                    <div className="flex flex-col gap-2 items-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-black 
                                      data-[state=open]:bg-white data-[state=open]:text-black"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-zinc-200">
                          {review.user_id._id !== user?.id && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => setReportingPostId(review._id)}
                            >
                              <FaFlag className="mr-2 h-4 w-4 text-yellow-500" />
                              Report
                            </DropdownMenuItem>
                          )}
                          {review.user_id._id === user?.id && (
                            <ConfirmDeleteDialog
                              title="Delete Review"
                              message="Are you sure you want to delete your review?"
                              onDelete={async () => {
                                try {
                                  await api.delete(`/social/post/review/${review._id}`);
                                  toast.success("Review deleted successfully!");
                                  setAllReviews((prev) =>
                                    prev.filter((r) => r._id !== review._id)
                                  );
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Failed to delete review");
                                }
                              }}
                            >
                              <DropdownMenuItem className="cursor-pointer text-red-500">
                                <IoTrash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </ConfirmDeleteDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Useful / Not Useful buttons */}
                      {review.user_id._id === user?.id ? (
                        <>
                          <button
                            className="flex items-center justify-center text-sm px-3 py-1 rounded-full transition-all bg-zinc-400 cursor-not-allowed"
                            disabled
                          >
                            Useful {review.usefulCount || 0}
                          </button>

                          <button
                            className="flex items-center text-sm px-2 py-1 rounded-full transition-all bg-zinc-400 cursor-not-allowed"
                            disabled
                          >
                            Not Useful {review.notUsefulCount || 0}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUseful(review._id)}
                            className={`flex items-center text-sm px-2 py-1 rounded-full transition-all cursor-pointer ${
                              review.userMark === "useful"
                                ? "bg-green-600 text-white"
                                : "text-gray-400 hover:text-green-500 hover:bg-green-500/10"
                            }`}
                          >
                            <p className="gap-x-1 flex text-zinc-300">
                              <span className="text-sm">
                                <FaRegThumbsUp size={18} />
                              </span>
                              {`Useful (${review.useful?.length || 0})`}
                            </p>
                          </button>

                          <button
                            onClick={() => handleNotUseful(review._id)}
                            className={`flex items-center text-sm px-2 py-1 rounded-full transition-all cursor-pointer ${
                              review.userMark === "not_useful"
                                ? "bg-red-600 text-white"
                                : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                            }`}
                          >
                            <p className="gap-x-1 flex text-zinc-300">
                              <span className="text-sm">
                                <FaRegThumbsDown size={18} />
                              </span>
                              {`Not Useful (${review.not_useful?.length || 0})`}
                            </p>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              )
            )}

            <ReviewReportDialog
              reviewId={reportingPostId}
              userId={user?.id}
              open={!!reportingPostId}
              onOpenChange={(isOpen) => !isOpen && setReportingPostId(null)}
              existingReport={
                allReviews
                  .find((r) => r._id === reportingPostId)
                  ?.reports?.find((rep) => rep.user_id === user?.id) || null
              }
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;

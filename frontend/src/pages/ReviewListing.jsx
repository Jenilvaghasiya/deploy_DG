import React, { useState, useEffect } from "react";
import { FaUserCircle, FaStar, FaRegStar } from "react-icons/fa";
import { MessageSquare, ChevronLeft, ChevronRight, Calendar, ThumbsUp, Flag } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import { BASE_URL } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import AuthPromptModal from "@/components/AuthPromptModal";
import ImageZoomDialog from "@/components/ImageZoomDialog";
import ReviewModal from "./AddReview";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { BsHandThumbsUp, BsHandThumbsUpFill } from "react-icons/bs";

const ReviewListing = () => {
  const { user } = useAuthStore();
  const isUserLoggedIn = !!user;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalAction, setAuthModalAction] = useState("interact");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    fetchReviews();
  }, [currentPage, sortBy]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/app-review/get?page=${currentPage}&limit=9&sortBy=${sortBy}`
      );
      const data = await response.json();
      setReviews(data?.reviews || []);
      setTotalPages(data?.totalPages || 1);
      setStats(data?.stats || null);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index}>
        {index < rating ? (
          <FaStar className="text-yellow-400" />
        ) : (
          <FaRegStar className="text-gray-600" />
        )}
      </span>
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleHelpfulToggle = async (reviewId) => {
     const response = await api.post(`/social/app-review/${reviewId}/helpful`);

      if (response.status === 200) {
        fetchReviews();
      } 
  }

  const RatingDistribution = ({ distribution, total }) => {
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution?.[star] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm text-gray-400">{star}</span>
                <FaStar className="text-yellow-400 text-sm" />
              </div>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-yellow-400 h-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-400 w-12 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer">
        <div className="overflow-auto flex flex-col h-96 grow relative z-10">
          <div className="md:min-h-64 w-full pt-32 pb-10 mb-10 border-b border-white/30">
            <div className="container px-4 mx-auto text-center animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-96 mx-auto"></div>
            </div>
          </div>
          <div className="container px-4 mx-auto">
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900 rounded-xl p-6">
                  <div className="h-48 bg-gray-700 rounded-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        actionType={authModalAction}
      />

      <div className="overflow-auto flex flex-col h-96 grow relative z-10">
        {/* Header */}
        <div className="md:min-h-64 w-full pt-32 pb-10 mb-10 border-b border-white/30">
          <div className="container px-4 mx-auto text-center">
            <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold mb-2">
              Customer Reviews
            </h1>
            <p className="text-base text-white/80 max-w-4xl mx-auto mb-6">
              Discover authentic reviews from our community. Browse through
              detailed feedback, ratings, and insights to make informed
              decisions.
            </p>
            <div className="flex justify-center">
              {
                isUserLoggedIn ? (
                  <ReviewModal onReviewAdded={fetchReviews} />
                ) : (
                  <Button
                    onClick={() => {
                      setAuthModalAction("add_review");
                      setShowAuthModal(true);
                    }}
                    variant="dg_btn"
                  >
                    Add Review
                  </Button>
                )
              }
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {stats && stats.totalRatings > 0 && (
          <div className="container px-4 mx-auto mb-10">
            <div className="bg-zinc-900/50 backdrop-blur rounded-xl border border-gray-800 p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                    <div className="text-5xl font-bold text-white">
                      {stats.averageRating}
                    </div>
                    <div>
                      <div className="flex gap-1 mb-1">
                        {renderStars(Math.round(stats.averageRating))}
                      </div>
                      <p className="text-sm text-gray-400">
                        {stats.totalRatings} reviews
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <RatingDistribution 
                    distribution={stats.ratingDistribution} 
                    total={stats.totalRatings} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="container px-4 mx-auto mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Reviews</h2>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="createdAt">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="helpfulCount">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="container px-4 mx-auto">
          {reviews.length === 0 && !loading && (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to share your experience!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((item) => (
              <div
                key={item._id}
                className="bg-zinc-900/50 backdrop-blur rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all group"
              >
                {item.url && (
                  <div className="relative aspect-video overflow-hidden bg-gray-800 group">
                    <ImageZoomDialog
                      imageUrl={item.url}
                      triggerLabel=""
                      className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                    />
                    <SmartImage
                      src={item.url}
                      alt={item.title || "Review image"}
                      className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {item.userId?.avatar ? (
                        <img 
                          src={item.userId.avatar} 
                          alt={item.userId.nick_name || "User"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <FaUserCircle size={32} className="text-gray-400" />
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">
                          {item.userId?.nick_name || item.userId?.full_name || "Anonymous"}
                        </p>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {renderStars(item.rating)}
                    </div>
                  </div>

                  {item.title && (
                    <h3 className="text-white font-semibold mb-2 line-clamp-1">
                      {item.title}
                    </h3>
                  )}

                  {item.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                    <button
                                      onClick={() => {
                        if (!isUserLoggedIn) {
                          setAuthModalAction("interact");
                          setShowAuthModal(true);
                        } else {
                          // Handle helpful action
                          handleHelpfulToggle(item._id );
                          console.log(item._id);
                          toast.success("Marked as helpful");
                        }
                      }}
                      className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm cursor-pointer ${item.helpfulUsers?.includes(user?.id) ? 'text-yellow-400' : ''}`}
                    >
                      {item.helpfulUsers?.includes(user?.id) ? <BsHandThumbsUpFill className="w-4 h-4" /> : <BsHandThumbsUp className="w-4 h-4" />}
                      <span>Helpful ({item?.helpfulUsers?.length || 0})</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-zinc-900 border border-gray-800 hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-1">
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-gray-800 hover:border-gray-700 transition-all text-sm"
                    >
                      1
                    </button>
                    {currentPage > 4 && (
                      <span className="px-2 py-2 text-gray-500">...</span>
                    )}
                  </>
                )}

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return page === currentPage || 
                           page === currentPage - 1 || 
                           page === currentPage + 1 ||
                           (currentPage <= 3 && page <= 5) ||
                           (currentPage >= totalPages - 2 && page >= totalPages - 4);
                  })
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                        currentPage === page
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'bg-zinc-900 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="px-2 py-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-gray-800 hover:border-gray-700 transition-all text-sm"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-zinc-900 border border-gray-800 hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewListing;
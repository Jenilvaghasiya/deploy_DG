import React, { useState, useEffect } from "react";

const AppReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
  });
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [updatingReviewId, setUpdatingReviewId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });

      const res = await fetch(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/app-review/get?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error fetching posts");
      const data = await res.json();

      console.log(data, "res");
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 0);
      setTotalReviews(data.totalReviews || 0);
      setStats(data.stats || {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  console.log(reviews, 'reviews');

  useEffect(() => {
    fetchPosts();
  }, [page, limit, sortBy]);

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    console.log(`Changing status for review ${reviewId} to ${newStatus}`);
    
    setUpdatingReviewId(reviewId);
    
    try {
        const res = await fetch(
            `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/app-review/${reviewId}/status`,
            {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                    "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
                },
                body: JSON.stringify({ approvalStatus: newStatus })
            }
        );

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to update review status');
        }

        const data = await res.json();
        console.log('Status updated successfully:', data);

        fetchPosts();
        
    } catch (error) {
        console.error('Error updating review status:', error);
        fetchPosts();
    } finally {
        setUpdatingReviewId(null);
    }
  };

  // Add delete handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
        return;
    }

    console.log(`Deleting review ${reviewId}`);
    setDeletingReviewId(reviewId);

    try {
        const res = await fetch(
            `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/app-review/${reviewId}`,
            {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                    "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
                }
            }
        );

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to delete review');
        }

        const data = await res.json();
        console.log('Review deleted successfully:', data);

        // If we're on the last page and deleting the last item, go to previous page
        if (reviews.length === 1 && page > 1) {
            setPage(page - 1);
        } else {
            fetchPosts();
        }
        
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review. Please try again.');
    } finally {
        setDeletingReviewId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '#10b981'; // green
      case 'rejected':
        return '#ef4444'; // red
      case 'pending':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  const strapiStyles = {
    container: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      backgroundColor: "#181826",
      color: "#f5f5f5",
      minHeight: "100vh",
      padding: "2rem",
    },
    contentBox: {
      backgroundColor: "#181826",
      borderRadius: "4px",
      color: "#f5f5f5",
      boxShadow: "0 2px 4px 0 rgba(227, 233, 243, 0.5)",
      width: "100%",
      maxWidth: "100%",
      margin: "0 auto",
      overflow: "hidden",
    },
    header: {
      padding: "2rem 2rem 1rem 2rem",
      borderBottom: "1px solid #f0f0ff",
      color: "#f5f5f5",
    },
    title: {
      fontSize: "3rem",
      fontWeight: "600",
      color: "#f5f5f5",
      margin: "0 0 0.5rem 0",
    },
    statsSection: {
      margin: "2rem",
      padding: "1.5rem",
      backgroundColor: "#262637",
      borderRadius: "4px",
      border: "1px solid #f0f0ff",
    },
    statsTitle: {
      fontSize: "1.875rem",
      fontWeight: "600",
      color: "#f5f5f5",
      marginBottom: "1rem",
    },
    statsRow: {
      display: "flex",
      gap: "2rem",
      marginBottom: "1rem",
      fontSize: "1.3125rem",
    },
    statItem: {
      color: "#f5f5f5",
    },
    ratingDistribution: {
      display: "flex",
      gap: "1.5rem",
      marginTop: "0.5rem",
      fontSize: "1.3125rem",
    },
    controlsSection: {
      padding: "1rem 2rem",
      borderBottom: "1px solid #f0f0ff",
      display: "flex",
      gap: "2rem",
      alignItems: "center",
    },
    selectWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "1.3125rem",
      color: "#f5f5f5",
    },
    select: {
      padding: "0.5rem 1rem",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      fontSize: "1.3125rem",
      color: "#f5f5f5",
      backgroundColor: "#181826",
      outline: "none",
      cursor: "pointer",
    },
    reviewsContainer: {
      padding: "2rem",
    },
    reviewCard: {
      border: "1px solid #f0f0ff",
      padding: "1.5rem",
      borderRadius: "4px",
      backgroundColor: "#262637",
      marginBottom: "1rem",
    },
    reviewHeader: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "1rem",
    },
    reviewUser: {
      fontSize: "1.3125rem",
      fontWeight: "600",
      color: "#f5f5f5",
    },
    reviewEmail: {
      fontSize: "1.125rem",
      color: "#a1a1aa",
      marginTop: "0.25rem",
    },
    reviewRating: {
      textAlign: "right",
    },
    stars: {
      color: "#fbbf24",
      fontSize: "1.5rem",
    },
    reviewDate: {
      fontSize: "1rem",
      color: "#a1a1aa",
      marginTop: "0.25rem",
    },
    reviewTitle: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#f5f5f5",
      margin: "1rem 0 0.5rem 0",
    },
    reviewComment: {
      fontSize: "1.3125rem",
      color: "#f5f5f5",
      lineHeight: "1.6",
    },
    emptyState: {
      textAlign: "center",
      color: "#f5f5f5",
      padding: "3rem 2rem",
      fontSize: "1.3125rem",
      minHeight: "300px",
    },
    pagination: {
      backgroundColor: "#262637",
      padding: "1rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: "1px solid #f0f0ff",
      color: "#f5f5f5",
    },
    paginationButton: {
      padding: "0.5rem 1rem",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      backgroundColor: "#181826",
      color: "#f5f5f5",
      fontSize: "1.3125rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    paginationButtonDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
      color: "#a1a1aa",
    },
    pageInfo: {
      fontSize: "1.3125rem",
      color: "#f5f5f5",
    },
    loadingText: {
      textAlign: "center",
      color: "#f5f5f5",
      padding: "2rem",
      fontSize: "1.3125rem",
    },
    statusBadge: {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "4px",
      fontSize: "0.875rem",
      fontWeight: "600",
      textTransform: "uppercase",
      marginTop: "0.5rem",
    },
    statusSelect: {
      padding: "0.25rem 0.5rem",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      fontSize: "0.875rem",
      color: "#181826",
      backgroundColor: "#f5f5f5",
      outline: "none",
      cursor: "pointer",
      marginTop: "0.5rem",
      fontWeight: "600",
    },
    actionButtons: {
      display: "flex",
      gap: "0.5rem",
      marginTop: "0.5rem",
    },
    deleteButton: {
      padding: "0.25rem 0.75rem",
      border: "1px solid #ef4444",
      borderRadius: "4px",
      fontSize: "0.875rem",
      color: "#ef4444",
      backgroundColor: "transparent",
      outline: "none",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.2s ease",
    },
    deleteButtonHover: {
      backgroundColor: "#ef4444",
      color: "#ffffff",
    },
  };

  return (
    <div style={strapiStyles.container}>
      <div style={strapiStyles.contentBox}>
        {/* Header */}
        <div style={strapiStyles.header}>
          <h2 style={strapiStyles.title}>App Review Management</h2>
        </div>

        {/* Stats Section */}
        <div style={strapiStyles.statsSection}>
          <h3 style={strapiStyles.statsTitle}>Review Statistics</h3>
          <div style={strapiStyles.statsRow}>
            <div style={strapiStyles.statItem}>
              <strong>Average Rating:</strong> {stats.averageRating.toFixed(1)} / 5
            </div>
            <div style={strapiStyles.statItem}>
              <strong>Total Reviews:</strong> {stats.totalRatings}
            </div>
          </div>
          <div style={strapiStyles.statItem}>
            <strong>Rating Distribution:</strong>
            <div style={strapiStyles.ratingDistribution}>
              {Object.entries(stats.ratingDistribution).map(([star, count]) => (
                <div key={star}>
                  {star}★: {count}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={strapiStyles.controlsSection}>
          <div style={strapiStyles.selectWrapper}>
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={strapiStyles.select}
            >
              <option value="createdAt">Date</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          <div style={strapiStyles.selectWrapper}>
            <label>Show:</label>
            <select 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
              style={strapiStyles.select}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>per page</span>
          </div>
        </div>

        {/* Reviews */}
        <div style={strapiStyles.reviewsContainer}>
          {loadingPosts ? (
            <p style={strapiStyles.loadingText}>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p style={strapiStyles.emptyState}>No reviews found.</p>
          ) : (
            <div>
              {reviews.map((review) => (
                <div key={review._id} style={strapiStyles.reviewCard}>
                  <div style={strapiStyles.reviewHeader}>
                    <div>
                                            <div style={strapiStyles.reviewUser}>
                        {review.userId?.nick_name || review.userId?.full_name || "Anonymous"}
                      </div>
                      <div style={strapiStyles.reviewEmail}>
                        {review.userId?.email}
                      </div>
                    </div>
                    <div style={strapiStyles.reviewRating}>
                      <div style={strapiStyles.stars}>
                        {renderStars(review.rating)}
                      </div>
                      <div style={strapiStyles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                      <div 
                        style={{
                          ...strapiStyles.statusBadge,
                          backgroundColor: getStatusColor(review?.approvalStatus),
                          color: '#ffffff',
                        }}
                      >
                        {review?.approvalStatus || 'pending'}
                      </div>
                      <div style={strapiStyles.actionButtons}>
                        <select
                          value={review?.approvalStatus || 'pending'}
                          onChange={(e) => handleStatusChange(review._id, e.target.value)}
                          disabled={updatingReviewId === review._id}
                          style={{
                              ...strapiStyles.statusSelect,
                              opacity: updatingReviewId === review._id ? 0.5 : 1,
                              cursor: updatingReviewId === review._id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          disabled={deletingReviewId === review._id}
                          style={{
                            ...strapiStyles.deleteButton,
                            opacity: deletingReviewId === review._id ? 0.5 : 1,
                            cursor: deletingReviewId === review._id ? 'not-allowed' : 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            if (deletingReviewId !== review._id) {
                              e.target.style.backgroundColor = '#ef4444';
                              e.target.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#ef4444';
                          }}
                        >
                          {deletingReviewId === review._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                  {review.title && (
                    <h4 style={strapiStyles.reviewTitle}>Title: {review?.title}</h4>
                  )}
                  <p style={strapiStyles.reviewComment}>Description: {review?.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div style={strapiStyles.pagination}>
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            style={{
              ...strapiStyles.paginationButton,
              ...(page === 1 ? strapiStyles.paginationButtonDisabled : {}),
            }}
          >
            Previous
          </button>
          <span style={strapiStyles.pageInfo}>
            Page {page} of {totalPages} ({totalReviews} total reviews)
          </span>
          <button 
            disabled={page === totalPages || totalPages === 0} 
            onClick={() => setPage(page + 1)}
            style={{
              ...strapiStyles.paginationButton,
              ...(page === totalPages || totalPages === 0 
                ? strapiStyles.paginationButtonDisabled 
                : {}),
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppReviewManagement;
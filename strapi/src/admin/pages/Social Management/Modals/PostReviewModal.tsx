import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import toast from "react-hot-toast";
import { text } from "stream/consumers";

const PostReviewModal = ({ post, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch reviews when modal opens
  useEffect(() => {
    if (!post) return;
    fetchReviews();
  }, [post]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/reviews/pending`, {
        headers: {
          "x-node-auth-token": process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN,
        },
      });
      setReviews(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (review) => {
    setSelectedReview(review);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedReview(null);
    setViewModalOpen(false);
  };

  const handleAction = async (reviewId, action) => {
    try {
      setLoading(true);
      let endpoint = "";
      switch (action) {
        case "approve":
          endpoint = `/api/v1/strapi-admin/reviews/approve/${reviewId}`;
          break;
        case "reject":
          endpoint = `/api/v1/strapi-admin/reviews/reject/${reviewId}`;
          break;
        case "delete":
          endpoint = `/api/v1/strapi-admin/reviews/delete/${reviewId}`;
          break;
        default:
          return;
      }

      await axios.get(`${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}${endpoint}`, {
        headers: {
          "x-node-auth-token": process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN,
        },
      });

      toast.success(`Review ${action}d successfully!`);
      fetchReviews(); // refresh the list
    } catch (err) {
      console.error(`Failed to ${action} review:`, err);
      toast.error(`Failed to ${action} review`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center text-2xl mb-4">
            <h2>Reviews</h2>
          <button style={{marginLeft : "auto", cursor: "pointer"}} onClick={onClose}>Close</button>
        </div>

        {loading ? (
          <p>Loading reviews...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Rating</th>
                <th style={styles.th}>Comment</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} style={styles.tr}>
                  <td style={styles.td}>{review?.user_id?.nick_name || "unknown"}</td>
                  <td style={styles.td}>{review.rating}</td>
                  <td style={styles.td}>
                    {review.comment.length > 30
                      ? review.comment.slice(0, 30) + "..."
                      : review.comment}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
                      <button style={styles.viewBtn} onClick={() => openViewModal(review)}>View</button>
                      <button style={styles.approveBtn} onClick={() => handleAction(review._id, "approve")}>Approve</button>
                      <button style={styles.rejectBtn} onClick={() => handleAction(review._id, "reject")}>Reject</button>
                      <button style={styles.deleteBtn} onClick={() => handleAction(review._id, "delete")}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Nested modal for full review */}
        {viewModalOpen && selectedReview && (
          <div style={styles.overlay} onClick={closeViewModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={{marginBottom: "5px", borderBottom:  "1px solid", borderColor: "white"}}>Review by {selectedReview.user_id.nick_name}</h3>
              <p style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <strong>Rating: </strong>  {selectedReview.rating} <FaStar style={{ color: "yellow" }} />
              </p>
              <p><strong>Comment:</strong></p>
              <p>{selectedReview.comment}</p>
              <div className="flex justify-end mt-4">
                <button style={{ cursor: "pointer" }} onClick={closeViewModal}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(33, 33, 52, 0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  modal: {
    backgroundColor: "#212134",
    color: "#f5f5f5",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "700px",
    padding: "2.5rem",
    maxHeight: "80vh",
    overflowY: "auto" as "auto",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    fontSize: "1.5rem",
  },
  th: { borderBottom: "1px solid #ccc", padding: "8px", textAlign: "center" },
  td: { borderBottom: "1px solid #eee", padding: "8px", textAlign: "center" },
  tr: {},
  viewBtn: { backgroundColor: "#333", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" },
  approveBtn: { backgroundColor: "green", color: "#fff", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" },
  rejectBtn: { backgroundColor: "orange", color: "#fff", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" },
  deleteBtn: { backgroundColor: "red", color: "#fff", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" },
};

export default PostReviewModal;

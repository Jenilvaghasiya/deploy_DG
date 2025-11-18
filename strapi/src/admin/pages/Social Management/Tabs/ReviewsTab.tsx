import { useState, useEffect, useRef } from "react";
import { SlCalender } from "react-icons/sl";
import toast, { Toaster } from "react-hot-toast";
import PostReviewModal from "../Modals/PostReviewModal";
import axios from "axios";
import { MdOutlineOpenInNew } from "react-icons/md";
import DateRangePicker from "../Modals/DatePicker";

type SocialPost = {
  _id: string;
  url: string;
  title: string;
  description: string;
  status: string;
  tenant_id: string;
  user_id: {
    nick_name: string;
    id: string;
  };
  likes: string[];
  dislikes: string[];
  comments: any[];
  created_at: string;
  updated_at: string;
};

interface CustomDatePickerProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

const ReviewsTab = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SocialPost | null>(null);
  const [creditToAdd, setCreditToAdd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const popoverRef = useRef(null);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const datePickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [search, page, limit, message]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
      });
      const res = await fetch(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/social-posts/?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );
      if (!res.ok) throw new Error("Error fetching users");
      const { data, meta } = await res.json();
      
      console.log(data, "res");
      setPosts(data);
      setTotalPages(meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setSelectedUser(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

const handleCheckboxChange = (postId: string) => {
  setSelectedPosts(prev => {
    const newSet = new Set(prev);
    if (newSet.has(postId)) {
      newSet.delete(postId);
    } else {
      newSet.add(postId);
    }
    return newSet;
  });
};

  const handleFilterwiseDate = async () => {
    setLoadingPosts(true);
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString(),
      });

      // startDate / endDate are ISO strings like "2025-07-21T00:00:00.000Z"
      if (startDate) params.append("startDate", startDate); // "YYYY-MM-DD"
      if (endDate) params.append("endDate", endDate);   // "YYYY-MM-DD"

      const res = await fetch(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/social-posts/approved?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error fetching users");
      const { data, meta } = await res.json();

      setPosts(data);
      setTotalPages(meta.totalPages);
      setShowDatePicker(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCansel = async () => {
    setStartDate(null);
    setEndDate(null);
    fetchPosts()
    setShowDatePicker(false)
  }

  const strapiStyles = {
    container: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      backgroundColor: "#181826",
      color : "#f5f5f5",
      minHeight: "100vh",
      padding: "2rem",
    },
    contentBox: {
      borderRadius: "4px",
      color : "#f5f5f5",
      boxShadow: "0 2px 4px 0 rgba(227, 233, 243, 0.5)",
      width: "100%",
      maxWidth: "100%",
      margin: "0 auto",
      overflow: "hidden",
    },
    header: {
      padding: "2rem 2rem 1rem 2rem",
      borderBottom: "1px solid #f0f0ff",
    },
    title: {
      fontSize: "3rem", // 1.5x of 2rem
      fontWeight: "600",
      color: "#f5f5f5",
      margin: "0 0 0.5rem 0",
    },
    searchSection: {
      padding: "1rem 2rem",
      borderBottom: "1px solid #f0f0ff",
    },
    searchInput: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
      color: "#f5f5f5",
      // backgroundColor: "#ffffff",
      outline: "none",
      transition: "border-color 0.2s ease",
    },
    tableContainer: {
      padding: "0",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minHeight: "300px",
    },
    tableHeader: {
      // backgroundColor: "#f6f6f9",
      borderBottom: "1px solid #eaeaef",
    },
    th: {
      padding: "1rem 2rem",
      textAlign: "center",
      fontSize: "1.125rem", // 1.5x of 0.75rem
      fontWeight: "600",
      color: "#f5f5f5",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    tr: {
      borderBottom: "1px solid #f0f0ff",
    //   cursor: "pointer",
      transition: "background-color 0.15s ease",
    },
    trSelected: {
      backgroundColor: "#neutral100",
    },
    td: {
      padding: "1rem 2rem",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
      color: "#f5f5f5",
      textAlign: "center",
    },
    creditsBadge: {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "12px",
      fontSize: "1.125rem", // 1.5x of 0.75rem
      fontWeight: "600",
      backgroundColor: "#neutral100",
      color: "#f5f5f5",
      border: "1px solid #bae6fd",
    },
    emptyState: {
      textAlign: "center",
      color: "#f5f5f5",
      padding: "3rem 2rem",
      fontSize: "1.3125rem", // 1.5x of 0.875rem,
      minHeight: "250px",
    },
    pagination: {
      backgroundColor: "#neutral100",
      padding: "1rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: "1px solid #f0f0ff",
    },
    paginationButton: {
      padding: "0.5rem 1rem",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      backgroundColor: "#ffffff",
      color: "#000000",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    paginationButtonDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
      color: "#000000"
    },
    pageInfo: {
      fontSize: "1.3125rem", // 1.5x of 0.875rem
      color: "#f5f5f5",
    },
    formContainer: {
      marginTop: "2rem",
      padding: "2rem",
      backgroundColor: "#f6f6f9",
      borderRadius: "4px",
      border: "1px solid #eaeaef",
    },
    formTitle: {
      fontSize: "1.875rem", // 1.5x of 1.25rem
      fontWeight: "600",
      color: "#f5f5f5",
      margin: "0 0 1.5rem 0",
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
      fontWeight: "500",
      color: "#f5f5f5",
      marginBottom: "0.5rem",
    },
    numberInput: {
      padding: "0.75rem 1rem",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
      color: "#32324d",
      backgroundColor: "#ffffff",
      outline: "none",
      width: "120px",
      marginLeft: "8px",
    },
    buttonGroup: {
      display: "flex",
      gap: "0.75rem",
    },
    primaryButton: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "#4945ff",
      color: "#ffffff",
      border: "none",
      borderRadius: "4px",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    },
    primaryButtonDisabled: {
      backgroundColor: "#9797b3",
      cursor: "not-allowed",
    },
    secondaryButton: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "transparent",
      color: "#32324d",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    message: {
      marginTop: "1rem",
      padding: "0.75rem 1rem",
      borderRadius: "4px",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
    },
    successMessage: {
      backgroundColor: "#f0fdf4",
      color: "#166534",
      border: "1px solid #bbf7d0",
      fontSize: "1.3125rem",
    },
    errorMessage: {
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      border: "1px solid #fecaca",
      fontSize: "1.3125rem",
    },
    loadingText: {
      textAlign: "center",
      color: "#666687",
      padding: "2rem",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
    },
  };

  return (
    <div style={strapiStyles.container}>
      {/* message notification */}
      {message && (
        <div
          style={{
            ...strapiStyles.message,
            ...(message?.includes("Successfully")
              ? strapiStyles.successMessage
              : strapiStyles.errorMessage),
            marginBottom: "1.5rem",
            position: "relative",
          }}
        >
          {message}
          <button
            onClick={() => setMessage(null)}
            style={{
              position: "absolute",
              top: "8px",
              right: "12px",
              background: "transparent",
              border: "none",
              fontWeight: "bold",
              color: "inherit",
              fontSize: "1rem",
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
      {selectedUser && (
      <PostReviewModal
        post={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    )}
    
    </div>
  );
};

export default ReviewsTab;

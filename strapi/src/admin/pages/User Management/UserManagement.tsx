import { useState, useEffect, useRef } from "react";
import DateRangePicker from "../Social Management/Modals/DatePicker";

type User = {
  id: string;
  full_name: string;
  tags?: string[];
  subscription_frequency: string;
  is_active: boolean;
  is_deleted: boolean;
  member_since: string;
  created_at: string;
  updated_at: string;
};

type DeleteOption = 'user_only' | 'user_and_data';

const TenantManagement = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    userId: string | null;
    userName?: string;
  }>({
    show: false,
    userId: null,
  });
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // States for delete functionality
  const [deleteOption, setDeleteOption] = useState<DeleteOption>('user_only');
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [search, page, limit]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/users?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );
      
      if (!res.ok) throw new Error("Error fetching users");
      const { data, meta } = await res.json();

      setUsers(data);
      setTotalPages(meta.totalPages);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    setDeletingUserId(deleteModal.userId);
    try {
      const res = await fetch(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/users/${deleteModal.userId}`,
        {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
          body: JSON.stringify({
            deleteOption: deleteOption,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error deleting user');
      }

      setMessage(
        deleteOption === 'user_only' 
          ? "User deleted successfully (data preserved)" 
          : "User and all associated data deleted successfully"
      );
      resetDeleteModal();
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const resetDeleteModal = () => {
    setDeleteModal({ show: false, userId: null });
    setDeleteOption('user_only');
    setDeleteConfirmText("");
  };

  const handleDeleteClick = (user: User) => {
    setDeleteModal({ 
      show: true, 
      userId: user.id,
      userName: user.full_name 
    });
  };

  const handleFilterwiseDate = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (startDate) params.append("startDate", startDate.slice(0, 10));
      if (endDate) params.append("endDate", endDate.slice(0, 10));

      const res = await fetch(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/users?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error fetching users");
      const { data, meta } = await res.json();

      setUsers(data);
      setTotalPages(meta.totalPages);
      setShowDatePicker(false);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch filtered users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCancel = async () => {
    setStartDate(null);
    setEndDate(null);
    fetchUsers();
    setShowDatePicker(false);
  };

  const strapiStyles = {
    container: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      backgroundColor: "#0f0f1f",
      background: "linear-gradient(135deg, #0f0f1f 0%, #1a1a2e 100%)",
      color: "#f5f5f5",
      minHeight: "100vh",
      padding: "2rem",
    },
    contentBox: {
      backgroundColor: "rgba(24, 24, 38, 0.95)",
      backdropFilter: "blur(10px)",
      borderRadius: "12px",
      color: "#f5f5f5",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      width: "100%",
      maxWidth: "100%",
      margin: "0 auto",
      overflow: "hidden",
    },
    header: {
      padding: "2.5rem 2rem 1.5rem 2rem",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      background: "linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
    },
    title: {
      fontSize: "2.5rem",
      fontWeight: "700",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      margin: "0 0 0.5rem 0",
    },
    searchSection: {
      padding: "1.5rem 2rem",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      background: "rgba(255, 255, 255, 0.02)",
    },
    searchInput: {
      width: "100%",
      padding: "0.875rem 1.25rem",
      border: "2px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "8px",
      fontSize: "1.2rem",
      color: "#f5f5f5",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      outline: "none",
      transition: "all 0.3s ease",
      "&:focus": {
        borderColor: "#667eea",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
      }
    },
    tableContainer: {
      padding: "0",
      overflowX: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minHeight: "300px",
      color: "#f5f5f5",
    },
    tableHeader: {
      backgroundColor: "rgba(79, 70, 229, 0.08)",
      borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
    },
    th: {
      padding: "1.25rem 1.5rem",
      textAlign: "left",
      fontSize: "1.2rem",
      fontWeight: "600",
      color: "#a8a8b3",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    tr: {
      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
      }
    },
    td: {
      padding: "1.25rem 1.5rem",
      fontSize: "1.2rem",
      color: "#e1e1e6",
      textAlign: "left",
    },
    actionButton: {
      padding: "0.5rem 1rem",
      borderRadius: "6px",
      fontSize: "1.2rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "none",
      marginRight: "0.5rem",
    },
    deleteButton: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      color: "#ef4444",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      "&:hover": {
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        transform: "translateY(-1px)",
      }
    },
    editButton: {
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      color: "#3b82f6",
      border: "1px solid rgba(59, 130, 246, 0.3)",
      "&:hover": {
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        transform: "translateY(-1px)",
      }
    },
    datePickerButton: {
      backgroundColor: "rgba(102, 126, 234, 0.1)",
      color: "#667eea",
      padding: "0.5rem 1rem",
      borderRadius: "6px",
      border: "1px solid rgba(102, 126, 234, 0.3)",
      fontSize: "0.875rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "rgba(102, 126, 234, 0.2)",
      }
    },
    modal: {
      position: "fixed" as const,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "rgba(24, 24, 38, 0.98)",
      backdropFilter: "blur(10px)",
      padding: "2rem",
      borderRadius: "12px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      zIndex: 1000,
      minWidth: "500px",
      maxWidth: "600px",
    },
    modalOverlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      zIndex: 999,
    },
    modalTitle: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#f5f5f5",
      marginBottom: "1rem",
    },
    modalText: {
      fontSize: "1.2rem",
      color: "#a8a8b3",
      marginBottom: "1.5rem",
    },
    modalButtonGroup: {
      display: "flex",
      gap: "1rem",
      justifyContent: "flex-end",
    },
    confirmButton: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "#ef4444",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      fontSize: "1.2rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "#dc2626",
      }
    },
    cancelButton: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "transparent",
      color: "#a8a8b3",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "6px",
      fontSize: "1.2rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
      }
    },
    emptyState: {
      textAlign: "center" as const,
      color: "#a8a8b3",
      padding: "4rem 2rem",
      fontSize: "1rem",
      minHeight: "300px",
    },
    pagination: {
      backgroundColor: "rgba(255, 255, 255, 0.02)",
      padding: "1.25rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    },
    paginationButton: {
      padding: "0.625rem 1.25rem",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "6px",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: "#e1e1e6",
      fontSize: "1.2rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "rgba(102, 126, 234, 0.1)",
        borderColor: "rgba(102, 126, 234, 0.3)",
      }
    },
    paginationButtonDisabled: {
      opacity: 0.4,
      cursor: "not-allowed",
      "&:hover": {
        backgroundColor: "transparent",
      }
    },
    pageInfo: {
      fontSize: "1.2rem",
      color: "#a8a8b3",
      fontWeight: "500",
    },
    message: {
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      fontSize: "1.2rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      animation: "slideIn 0.3s ease",
    },
    successMessage: {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      color: "#22c55e",
      border: "1px solid rgba(34, 197, 94, 0.3)",
    },
    errorMessage: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      color: "#ef4444",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
    loadingText: {
      textAlign: "center" as const,
      color: "#a8a8b3",
      padding: "3rem",
      fontSize: "1rem",
    },
    statusBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "12px",
      fontSize: "1.2rem",
      fontWeight: "600",
      display: "inline-block",
    },
    activeBadge: {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      color: "#22c55e",
      border: "1px solid rgba(34, 197, 94, 0.3)",
    },
    inactiveBadge: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      color: "#ef4444",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
    radioGroup: {
      marginBottom: "1.5rem",
    },
    radioOption: {
      display: "flex",
      alignItems: "center",
      marginBottom: "0.75rem",
      cursor: "pointer",
      padding: "0.75rem",
      borderRadius: "8px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      transition: "all 0.2s ease",
    },
    radioInput: {
      marginRight: "0.75rem",
      width: "18px",
      height: "18px",
      cursor: "pointer",
    },
    radioLabel: {
      fontSize: "1.2rem",
      color: "#e1e1e6",
      cursor: "pointer",
      flex: 1,
    },
    radioDescription: {
      fontSize: "1.2rem",
      color: "#a8a8b3",
      marginTop: "0.25rem",
    },
    confirmInput: {
      width: "100%",
      padding: "0.875rem 1.25rem",
      border: "2px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "8px",
      fontSize: "1.2rem",
      color: "#f5f5f5",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      outline: "none",
      transition: "all 0.3s ease",
      marginBottom: "1rem",
    },
    warningBox: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "1.5rem",
    },
    warningText: {
      color: "#ef4444",
      fontSize: "1.2rem",
      lineHeight: "1.5",
    },
  };

  return (
    <div style={strapiStyles.container}>
      {/* Message notification */}
      {message && (
        <div
          style={{
            ...strapiStyles.message,
            ...(message?.includes("success") || message?.includes("Successfully")
              ? strapiStyles.successMessage
              : strapiStyles.errorMessage),
          }}
        >
          {message}
          <button
            onClick={() => setMessage(null)}
            style={{
              background: "transparent",
              border: "none",
              fontWeight: "bold",
              color: "inherit",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0",
              lineHeight: "1",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <>
          <div style={strapiStyles.modalOverlay} onClick={resetDeleteModal} />
          <div style={strapiStyles.modal}>
            <h3 style={strapiStyles.modalTitle}>Delete User: {deleteModal.userName}</h3>
            
            <div style={strapiStyles.warningBox}>
              <p style={strapiStyles.warningText}>
                ⚠️ Warning: This action cannot be undone. Please choose carefully.
              </p>
            </div>

            <div style={strapiStyles.radioGroup}>
              <div 
                style={{
                  ...strapiStyles.radioOption,
                  backgroundColor: deleteOption === 'user_only' ? "rgba(102, 126, 234, 0.1)" : "transparent",
                  borderColor: deleteOption === 'user_only' ? "rgba(102, 126, 234, 0.3)" : "rgba(255, 255, 255, 0.1)",
                }}
                onClick={() => setDeleteOption('user_only')}
              >
                <input
                  type="radio"
                  id="user_only"
                  name="deleteOption"
                  value="user_only"
                  checked={deleteOption === 'user_only'}
                  onChange={() => setDeleteOption('user_only')}
                  style={strapiStyles.radioInput}
                />
                <div>
                  <label htmlFor="user_only" style={strapiStyles.radioLabel}>
                    Delete User Only
                  </label>
                  <p style={strapiStyles.radioDescription}>
                    Remove user access but preserve all their data and content
                  </p>
                </div>
              </div>

              <div 
                style={{
                  ...strapiStyles.radioOption,
                  backgroundColor: deleteOption === 'user_and_data' ? "rgba(239, 68, 68, 0.1)" : "transparent",
                  borderColor: deleteOption === 'user_and_data' ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.1)",
                }}
                onClick={() => setDeleteOption('user_and_data')}
              >
                <input
                  type="radio"
                  id="user_and_data"
                  name="deleteOption"
                  value="user_and_data"
                  checked={deleteOption === 'user_and_data'}
                  onChange={() => setDeleteOption('user_and_data')}
                  style={strapiStyles.radioInput}
                />
                <div>
                  <label htmlFor="user_and_data" style={strapiStyles.radioLabel}>
                    Delete User and All Data
                  </label>
                  <p style={strapiStyles.radioDescription}>
                    Permanently remove user and all associated data
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p style={{ ...strapiStyles.modalText, marginBottom: "0.5rem" }}>
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                style={{
                  ...strapiStyles.confirmInput,
                  borderColor: deleteConfirmText === "DELETE" 
                    ? "rgba(34, 197, 94, 0.3)" 
                    : "rgba(255, 255, 255, 0.1)",
                }}
              />
            </div>

            <div style={strapiStyles.modalButtonGroup}>
              <button
                style={strapiStyles.cancelButton}
                onClick={resetDeleteModal}
              >
                Cancel
              </button>
              <button
                style={{
                  ...strapiStyles.confirmButton,
                  opacity: deleteConfirmText === "DELETE" ? 1 : 0.5,
                  cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed",
                }}
                onClick={handleDeleteUser}
                disabled={deleteConfirmText !== "DELETE"}
              >
                Delete User
              </button>
            </div>
          </div>
        </>
      )}

      <div style={strapiStyles.contentBox}>
        {/* Header */}
        <div style={strapiStyles.header}>
          <h2 style={strapiStyles.title}>User Management</h2>
          <p style={{ color: "#a8a8b3", fontSize: "1.2rem", marginTop: "0.5rem" }}>
            Manage and monitor your platform users
          </p>
        </div>

        {/* Search */}
        <div style={strapiStyles.searchSection}>
          <input
            type="text"
            placeholder="🔍 Search users by name or industry..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              ...strapiStyles.searchInput,
              ...(search ? { 
                fontSize: "1.1rem",
                borderColor: "#667eea",
                backgroundColor: "rgba(102, 126, 234, 0.05)",
              } : {}),
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.backgroundColor = "rgba(102, 126, 234, 0.05)";
            }}
            onBlur={(e) => {
              if (!search) {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }
            }}
          />
        </div>

        {/* Users Table */}
        <div style={strapiStyles.tableContainer}>
          {loadingUsers ? (
            <div style={strapiStyles.loadingText}>
              <div style={{ marginBottom: "1rem" }}>⏳</div>
              Loading users...
            </div>
          ) : (
            <table style={strapiStyles.table}>
              <thead style={strapiStyles.tableHeader}>
                <tr>
                  <th style={strapiStyles.th}>User Name</th>
                  <th style={strapiStyles.th}>Email</th>
                  <th style={strapiStyles.th}>Status</th>
                  <th style={strapiStyles.th}>Signup Date</th>
                  <th style={strapiStyles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    style={{
                      ...strapiStyles.tr,
                      opacity: deletingUserId === user.id ? 0.5 : 1,
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={strapiStyles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                          fontWeight: "600",
                          color: "#fff",
                        }}>
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                        {user.full_name}
                      </div>
                    </td>
                    <td style={strapiStyles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {user.email}
                      </div>
                    </td>
                    <td style={strapiStyles.td}>
                      <span style={{
                        ...strapiStyles.statusBadge,
                        ...(user.is_active ? strapiStyles.activeBadge : strapiStyles.inactiveBadge)
                      }}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={strapiStyles.td}>
                      {new Date(user.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td style={strapiStyles.td}>
                      <button
                        style={{
                          ...strapiStyles.actionButton,
                          ...strapiStyles.deleteButton,
                        }}
                        onClick={() => handleDeleteClick(user)}
                        disabled={deletingUserId === user.id}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {deletingUserId === user.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} style={strapiStyles.emptyState}>
                      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                      <div style={{ fontSize: "1.125rem", fontWeight: "500", color: "#e1e1e6", marginBottom: "0.5rem" }}>
                        No users found
                      </div>
                      <div style={{ fontSize: "1rem", color: "#a8a8b3" }}>
                        Try adjusting your search or filters
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div style={strapiStyles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...strapiStyles.paginationButton,
              ...(page === 1 ? strapiStyles.paginationButtonDisabled : {}),
            }}
            onMouseEnter={(e) => {
              if (page !== 1) {
                e.currentTarget.style.backgroundColor = "rgba(102, 126, 234, 0.1)";
                e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (page !== 1) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }
            }}
          >
            ← Previous
          </button>

          <span style={strapiStyles.pageInfo}>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              ...strapiStyles.paginationButton,
              ...(page === totalPages ? strapiStyles.paginationButtonDisabled : {}),
            }}
            onMouseEnter={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.backgroundColor = "rgba(102, 126, 234, 0.1)";
                e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }
            }}
          >
            Next →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        input[type="radio"] {
          accent-color: #667eea;
        }

        input[type="radio"]:checked {
          background-color: #667eea;
        }

        input[type="text"]::-webkit-input-placeholder {
          color: rgba(168, 168, 179, 0.5);
        }
        
        input[type="text"]::-moz-placeholder {
          color: rgba(168, 168, 179, 0.5);
        }
        
        input[type="text"]:-ms-input-placeholder {
          color: rgba(168, 168, 179, 0.5);
        }
        
        input[type="text"]::placeholder {
          color: rgba(168, 168, 179, 0.5);
        }
      `}</style>
    </div>
  );
};

export default TenantManagement;
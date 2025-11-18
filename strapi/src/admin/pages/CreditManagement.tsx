import React, { useState, useEffect, useRef } from "react";
type User = {
  _id: string;
  name: string;
  // email: string;
  credits?: {
    credits?: number;
    amount?: number;
  };
};

const CreditManagement = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditToAdd, setCreditToAdd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const popoverRef = useRef(null);

  // fetch users whenever search or page changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const params = new URLSearchParams({
          search,
          page: page.toString(),
          limit: limit.toString(),
        });
        const res = await fetch(
          `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/tenants?${params}`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
            },
          }
        );
        console.log(res, "res");
        if (!res.ok) throw new Error("Error fetching users");
        const { data } = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [search, page, limit, message]);

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

  // handle click on a user row
  const handleSelectUser = (user, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setSelectedUser(user);
    setCreditToAdd("");
    setMessage(null);
  };

  // handle adding credits
  const handleAddCredits = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/tenants/add-credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
          body: JSON.stringify({
            tenantId: selectedUser._id,
            credits: Number(creditToAdd),
          }),
        }
      );
      if (!res.ok) {
        setMessage(`❌ Failed to add credits to ${selectedUser.name}`);
        return;
      }
      setMessage(
        `✅ Successfully added ${creditToAdd} credits to ${selectedUser.name}`
      );

      // optional: refresh list or update local state
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id
            ? {
                ...u,
                credits: {
                  ...u.credits,
                  amount: (u.credits?.amount || 0) + Number(creditToAdd),
                },
              }
            : u
        )
      );
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      setMessage("Error adding credits.");
    } finally {
      setSubmitting(false);
    }
  };

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
      backgroundColor: "#181826",
      color: "#f5f5f5",
      borderRadius: "4px",
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
      // backgroundColor: "#181826",
      outline: "none",
      transition: "border-color 0.2s ease",
    },
    tableContainer: {
      padding: "0",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    tableHeader: {
      // backgroundColor: "#181826",
      borderBottom: "1px solid #eaeaef",
    },
    th: {
      padding: "1rem 2rem",
      textAlign: "left",
      fontSize: "1.125rem", // 1.5x of 0.75rem
      fontWeight: "600",
      color: "#f5f5f5",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    tr: {
      borderBottom: "1px solid #f0f0ff",
      cursor: "pointer",
      transition: "background-color 0.15s ease",
    },
    trSelected: {
      backgroundColor: "#neutral100",
    },
    td: {
      padding: "1rem 2rem",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
      color: "#f5f5f5",
    },
    creditsBadge: {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "12px",
      fontSize: "1.125rem", // 1.5x of 0.75rem
      fontWeight: "600",
      backgroundColor: "#181826",
      color: "#ffffff",
      border: "1px solid #bae6fd",
    },
    emptyState: {
      textAlign: "center",
      color: "#f5f5f5",
      padding: "3rem 2rem",
      fontSize: "1.3125rem", // 1.5x of 0.875rem
    },
    pagination: {
      padding: "1rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: "1px solid #f0f0ff",
      backgroundColor: "#neutral100",
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
      color: "#000000",
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
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            zIndex: 999,
            width: "300px",
            backgroundColor: "#181826",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            padding: "1.5rem",
            border: "1px solid #eaeaef",
          }}
        >
          <h3 style={strapiStyles.formTitle}>
            Add credits to: <em>{selectedUser.name}</em>
          </h3>
          <div style={strapiStyles.formGroup}>
            <label style={strapiStyles.label}>Number of Credits</label>
            <input
              type="number"
              min={1}
              value={creditToAdd}
              onChange={(e) => setCreditToAdd(e.target.value)}
              required
              style={strapiStyles.numberInput}
            />
          </div>
          <div style={strapiStyles.buttonGroup}>
            <button
              onClick={handleAddCredits}
              disabled={submitting}
              style={{
                ...strapiStyles.primaryButton,
                ...(submitting ? strapiStyles.primaryButtonDisabled : {}),
              }}
            >
              {submitting ? "Adding..." : "Add Credits"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              style={strapiStyles.secondaryButton}
            >
              Cancel
            </button>
          </div>
          {message && (
            <p
              style={{
                ...strapiStyles.message,
                ...(message.includes("successfully")
                  ? strapiStyles.successMessage
                  : strapiStyles.errorMessage),
              }}
            >
              {message}
            </p>
          )}
        </div>
      )}

      <div style={strapiStyles.contentBox}>
        {/* Header */}
        <div style={strapiStyles.header}>
          <h2 style={strapiStyles.title}>Credit Management</h2>
        </div>

        {/* Search */}
        <div style={strapiStyles.searchSection}>
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              ...strapiStyles.searchInput,
              ...(search ? { borderColor: "#4945ff" } : {}),
            }}
          />
        </div>

        {/* Users Table */}
        <div style={strapiStyles.tableContainer}>
          {loadingUsers ? (
            <p style={strapiStyles.loadingText}>Loading tenants...</p>
          ) : (
            <table style={strapiStyles.table}>
              <thead style={strapiStyles.tableHeader}>
                <tr>
                  <th style={strapiStyles.th}>Name</th>
                  {/* <th style={strapiStyles.th}>Email</th> */}
                  <th style={strapiStyles.th}>Credits</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    onClick={(e) => handleSelectUser(user, e)}
                    style={{
                      ...strapiStyles.tr,
                      backgroundColor:
                        selectedUser?._id === user._id
                          ? "#1e40af"
                          : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedUser?._id !== user._id) {
                        e.currentTarget.style.backgroundColor = "#1e40af";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedUser?._id !== user._id) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <td style={strapiStyles.td}>{user.name}</td>
                    {/* <td style={strapiStyles.td}>{user.email}</td> */}
                    <td style={strapiStyles.td}>
                      <span style={strapiStyles.creditsBadge}>
                        {user.credits?.credits ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} style={strapiStyles.emptyState}>
                      No tenants found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        <div style={strapiStyles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...strapiStyles.paginationButton,
              ...(page === 1 ? strapiStyles.paginationButtonDisabled : {}),
            }}
          >
            Previous
          </button>
          <span style={strapiStyles.pageInfo}>Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            style={strapiStyles.paginationButton}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditManagement;

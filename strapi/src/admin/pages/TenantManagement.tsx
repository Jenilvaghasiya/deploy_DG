import { useState, useEffect, useRef } from "react";
import DateRangePicker from "./Social Management/Modals/DatePicker";

type Tenant = {
  id: string;
  name: string;
  tags?: string[];
  industry_type: string;
  subscription_frequency: string;
  is_active: boolean;
  is_deleted: boolean;
  member_since: string;
  created_at: string;
  updated_at: string;
};

interface CustomDatePickerProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

const TenantManagement = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Tenant | null>(null);
  const [creditToAdd, setCreditToAdd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const popoverRef = useRef(null);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  // date filter state  
  const [showDatePicker, setShowDatePicker] = useState(false);



  useEffect(() => {
    fetchUsers();
  }, [search, page, limit, message]);
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/tenant-users?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );
      console.log(res, "res");
      if (!res.ok) throw new Error("Error fetching users");
      const { data, meta } = await res.json();

      setTenants(data);
      setTotalPages(meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
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

  const handleFilterwiseDate = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString(),
      });

      // startDate / endDate are ISO strings like "2025-07-21T00:00:00.000Z"
      if (startDate) params.append("startDate", startDate.slice(0, 10)); // "YYYY-MM-DD"
      if (endDate) params.append("endDate", endDate.slice(0, 10));   // "YYYY-MM-DD"

      const res = await fetch(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/tenant-users?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error fetching users");
      const { data, meta } = await res.json();

      setTenants(data);
      setTotalPages(meta.totalPages);
      setShowDatePicker(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };


  const handleCansel = async () => {
    setStartDate(null);
    setEndDate(null);
    fetchUsers()
    setShowDatePicker(false)
  }



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
    searchSection: {
      padding: "1rem 2rem",
      borderBottom: "1px solid #f0f0ff",
      color: "#f5f5f5",
    },
    searchInput: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      fontSize: "1.3125rem",
      color: "#f5f5f5",
      backgroundColor: "#181826",
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
      color: "#f5f5f5",
    },
    tableHeader: {
      backgroundColor: "#181826",
      borderBottom: "1px solid #eaeaef",
      color: "#f5f5f5",
    },
    th: {
      padding: "1rem 2rem",
      textAlign: "center",
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#f5f5f5",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    tr: {
      borderBottom: "1px solid #f0f0ff",
      transition: "background-color 0.15s ease",
    },
    trSelected: {
      backgroundColor: "#262637",
    },
    td: {
      padding: "1rem 2rem",
      fontSize: "1.3125rem",
      color: "#f5f5f5",
      textAlign: "center",
      justifyContent: "center",
    },
    creditsBadge: {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "12px",
      fontSize: "1.125rem",
      fontWeight: "600",
      backgroundColor: "#262637",
      color: "#f5f5f5",
      border: "1px solid #bae6fd",
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
    formContainer: {
      marginTop: "2rem",
      padding: "2rem",
      backgroundColor: "#181826",
      borderRadius: "4px",
      border: "1px solid #eaeaef",
      color: "#f5f5f5",
    },
    formTitle: {
      fontSize: "1.875rem",
      fontWeight: "600",
      color: "#f5f5f5",
      margin: "0 0 1.5rem 0",
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      fontSize: "1.3125rem",
      fontWeight: "500",
      color: "#f5f5f5",
      marginBottom: "0.5rem",
    },
    numberInput: {
      padding: "0.75rem 1rem",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      fontSize: "1.3125rem",
      color: "#f5f5f5",
      backgroundColor: "#181826",
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
      fontSize: "1.3125rem",
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
      color: "#f5f5f5",
      border: "1px solid #dcdce4",
      borderRadius: "4px",
      fontSize: "1.3125rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    message: {
      marginTop: "1rem",
      padding: "0.75rem 1rem",
      borderRadius: "4px",
      fontSize: "1.3125rem",
      color: "#f5f5f5",
    },
    successMessage: {
      backgroundColor: "#166534",
      color: "#f5f5f5",
      border: "1px solid #bbf7d0",
      fontSize: "1.3125rem",
    },
    errorMessage: {
      backgroundColor: "#dc2626",
      color: "#f5f5f5",
      border: "1px solid #fecaca",
      fontSize: "1.3125rem",
    },
    loadingText: {
      textAlign: "center",
      color: "#f5f5f5",
      padding: "2rem",
      fontSize: "1.3125rem",
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

      <div style={strapiStyles.contentBox}>
        {/* Header */}
        <div style={strapiStyles.header}>
          <h2 style={strapiStyles.title}>Tenant Management</h2>
        </div>

        {/* Search */}
        <div style={strapiStyles.searchSection}>
          <input
            type="text"
            placeholder="Search users..."
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
                  <th style={strapiStyles.th}>Tenant Name</th>
                  <th style={strapiStyles.th}>Industry</th>
                  <th
                    style={{ ...strapiStyles.th, cursor: "pointer", position: "relative" }}
                    // onClick={() => setShowDatePicker((prev) => !prev)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDatePicker((prev) => !prev);
                      }}
                      style={{ marginLeft: "8px"}}
                    >
                      Signup Date 📅
                    </button>
                    {showDatePicker && (
                      <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onApply={handleFilterwiseDate}
                        onCancel={handleCansel}
                      />
                    )}
                  </th>


                  {/* <th style={strapiStyles.th}>Updated At</th> */}
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} style={strapiStyles.tr}>
                    <td style={strapiStyles.td}>{tenant.name}</td>
                    <td style={strapiStyles.td}>{tenant.industry_type}</td>
                    <td style={strapiStyles.td}>
                      {new Date(tenant.member_since).toLocaleDateString()}

                    </td>
                    {/* <td style={strapiStyles.td}>
                      {new Date(tenant.updated_at).toLocaleDateString()}
                    </td> */}
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={10} style={strapiStyles.emptyState}>
                      No tenants found.
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
          >
            Previous
          </button>

          <span style={strapiStyles.pageInfo}>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              ...strapiStyles.paginationButton,
              ...(page === totalPages ? strapiStyles.paginationButtonDisabled : {}),
            }}
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
};

export default TenantManagement;


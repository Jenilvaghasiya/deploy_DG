// Tabs/ViewFeaturesTab.tsx
import React, { useEffect, useState } from "react";
import "../ViewAnnouncementsPage.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { ConfirmationModal } from "../../Social Management/Modals/ConfirmationModal";
import DateRangePicker from "../../Social Management/Modals/DatePicker";

type Feature = {
  id: string;
  message: string;
  startDate: string;
  endDate: string;
  created_at: string;
};

const ViewFeaturesTab: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      borderBottom: "1px solid #32324d",
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
      borderBottom: "1px solid #32324d",
      color: "#f5f5f5",
    },
    searchInput: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #32324d",
      borderRadius: "4px",
      fontSize: "1.3125rem",
      color: "#f5f5f5",
      backgroundColor: "#212134",
      outline: "none",
      transition: "border-color 0.2s ease",
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
      backgroundColor: "#212134",
      borderBottom: "1px solid #32324d",
      color: "#f5f5f5",
    },
    th: {
      padding: "1rem 2rem",
      textAlign: "left" as const,
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#f5f5f5",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    },
    tr: {
      borderBottom: "1px solid #32324d",
      transition: "background-color 0.15s ease",
    },
    trHover: {
      backgroundColor: "#262637",
    },
    td: {
      padding: "1rem 2rem",
      fontSize: "1.3125rem",
      color: "#f5f5f5",
      textAlign: "left" as const,
    },
    categoryBadge: {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "12px",
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#fff",
    },
    statusBadge: {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "4px",
      fontSize: "1.125rem",
      fontWeight: "600",
    },
    active: {
      backgroundColor: "#10b981",
      color: "#fff",
    },
    inactive: {
      backgroundColor: "#6b7280",
      color: "#fff",
    },
    actions: {
      display: "flex",
      gap: "0.5rem",
    },
    actionButton: {
      cursor: "pointer",
      fontSize: "1.1rem",
      padding: "0.4rem 0.8rem",
      borderRadius: "4px",
      border: "none",
      display: "flex",
      alignItems: "center",
      gap: "0.3rem",
      transition: "opacity 0.2s ease",
    },
    editBtn: {
      backgroundColor: "#2563eb",
      color: "#fff",
    },
    deleteBtn: {
      backgroundColor: "#dc2626",
      color: "#fff",
    },
    emptyState: {
      textAlign: "center" as const,
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
      borderTop: "1px solid #32324d",
      color: "#f5f5f5",
    },
    paginationButton: {
      padding: "0.5rem 1rem",
      border: "1px solid #32324d",
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
      textAlign: "center" as const,
      color: "#f5f5f5",
      padding: "2rem",
      fontSize: "1.3125rem",
    },
    datePickerButton: {
      marginLeft: "8px",
      cursor: "pointer",
      background: "transparent",
      border: "none",
      color: "#f5f5f5",
      fontSize: "1.125rem",
    },
  };

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString(),
        type: "announcement",
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await axios.get(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/get-announcement?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );

      if (res?.data?.data) {
        setFeatures(res.data.data);
        setTotalPages(res.data.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [search, page, limit]);

  const handleFilterwiseDate = async () => {
    setShowDatePicker(false);
    fetchFeatures();
  };

  const handleCancel = async () => {
    setStartDate(null);
    setEndDate(null);
    setShowDatePicker(false);
    fetchFeatures();
  };

  const confirmDelete = (id: string) => {
    setFeatureToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!featureToDelete) return;
    try {
      await axios.delete(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/delete-announcement/${featureToDelete}`,
        {
          headers: {
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );
      fetchFeatures();
      setIsModalOpen(false);
      setFeatureToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={strapiStyles.container}>
      <div style={strapiStyles.contentBox}>
        {/* Header */}
        <div style={strapiStyles.header}>
          <h2 style={strapiStyles.title}>Feature Announcements</h2>
        </div>

        {/* Search */}
        <div style={strapiStyles.searchSection}>
          <input
            type="text"
            placeholder="Search features by message"
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

        {/* Table */}
        <div style={strapiStyles.tableContainer}>
          {loading ? (
            <p style={strapiStyles.loadingText}>Loading features...</p>
          ) : (
            <table style={strapiStyles.table}>
              <thead style={strapiStyles.tableHeader}>
                <tr>
                  <th style={strapiStyles.th}>Message</th>
                  <th style={strapiStyles.th}>Start Date/Time</th>
                  <th style={strapiStyles.th}>End Date/Time</th>
                  <th
                    style={{
                      ...strapiStyles.th,
                      position: "relative",
                    }}
                  >
                    <span>Created At</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDatePicker((prev) => !prev);
                      }}
                      style={strapiStyles.datePickerButton}
                    >
                      📅
                    </button>
                    {showDatePicker && (
                      <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onApply={handleFilterwiseDate}
                        onCancel={handleCancel}
                      />
                    )}
                  </th>
                  <th style={strapiStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr
                    key={feature.id}
                    style={strapiStyles.tr}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        strapiStyles.trHover.backgroundColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={strapiStyles.td}>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {feature?.message}
                        </div>
                      </div>
                    </td>
                    <td style={strapiStyles.td}>
                      {
                        feature.startDate ? new Date(feature.startDate).toLocaleString() : "—"
                      }
                    </td>
                    <td style={strapiStyles.td}>
                      {
                        feature.endDate ? new Date(feature.endDate).toLocaleString() : "—"
                      }
                    </td>
                    <td style={strapiStyles.td}>
                      {new Date(feature?.created_at).toLocaleDateString()}
                    </td>
                    <td style={strapiStyles.td}>
                      <div style={strapiStyles.actions}>
                        <button
                          style={{
                            ...strapiStyles.actionButton,
                            ...strapiStyles.deleteBtn,
                          }}
                          onClick={() => confirmDelete(feature.id)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = "0.8")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = "1")
                          }
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {features.length === 0 && (
                  <tr>
                    <td colSpan={6} style={strapiStyles.emptyState}>
                      No feature announcements found.
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
              ...(page === totalPages
                ? strapiStyles.paginationButtonDisabled
                : {}),
            }}
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmationModal
        message="Are you sure you want to delete this feature announcement?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
      />
    </div>
  );
};

export default ViewFeaturesTab;

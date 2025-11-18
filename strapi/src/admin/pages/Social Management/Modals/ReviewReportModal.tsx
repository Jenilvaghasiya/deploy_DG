import React, { useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";

const REPORT_TYPES = [
  { value: "false_information", label: "False Information" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];
const ReviewReportModal = ({ review, onClose, onDeleteReport }) => {
  const styles = {
    overlay: {
      position: "fixed" as "fixed",
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
      fontSize: "1.1rem", // increased default font size
    },
    header: {
      fontSize: "1.75rem", // increased header size
      fontWeight: 600,
      marginBottom: "1.5rem",
      color: "#f5f5f5",
    },
    reportItem: {
      border: "1px solid #4945ff",
      borderRadius: "4px",
      padding: "1.25rem",
      marginBottom: "1rem",
      backgroundColor: "#2c2c3d",
      color: "#f5f5f5",
      fontSize: "1.5rem", // larger text inside each report
    },
    closeBtn: {
      padding: "0.75rem 2rem",
      backgroundColor: "#4945ff",
      color: "#f5f5f5",
      border: "none",
      borderRadius: "4px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      fontSize: "1.1rem",
    },
    deleteBtn: {
      marginTop: "1rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#ff4d4f",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "1rem",
      alignSelf: "flex-start",
    },
    emptyText: {
      color: "#c3c3d1",
      fontStyle: "italic",
      textAlign: "center" as "center",
      marginTop: "2rem",
      fontSize: "1.1rem",
    },
  };
  
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [actionToConfirm, setActionToConfirm] = useState<() => void | null>(null);
    const getReportLabel = (type: string) => {
        const found = REPORT_TYPES.find((r) => r.value === type);
        return found ? found.label : type || "No reason provided";
    };
    const openConfirmation = (message: string, action: () => void) => {
    setModalMessage(message);
    setActionToConfirm(() => action);
    setModalOpen(true);
    };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.header}>Reports</h2>

        {review.reports && review.reports.length > 0 ? (
          <ul>
            {review.reports.map((report: any, idx: number) => (
              <li key={idx} style={styles.reportItem}>
                <div style={styles.reportInfo}>
                  <p>
                    <strong>Reported By:</strong> {report?.user_id?.nick_name || "Unknown"}
                  </p>
                  <p>
                    <strong>Reason:</strong> {getReportLabel(report.type)}
                  </p>
                  {report.text && (
                    <p>
                      <strong>Additional Details:</strong> {report.text}
                    </p>
                  )}
                  <p>
                    <strong>Date:</strong> {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  style={styles.deleteBtn}
                  onClick={() =>
                            openConfirmation("Are you sure you want to delete this report?", () => onDeleteReport(review._id, report._id))
                          }>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={styles.emptyText}>No reports for this review.</p>
        )}

        <div className="mt-4 flex justify-end">
          <button style={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
        <ConfirmationModal
    isOpen={modalOpen}
    message={modalMessage}
    onConfirm={() => {
        actionToConfirm?.();
        setModalOpen(false);
    }}
    onCancel={() => setModalOpen(false)}
    />
    </div>
  );
};

export default ReviewReportModal;

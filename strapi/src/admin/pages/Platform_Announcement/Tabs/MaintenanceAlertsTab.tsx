// Tabs/MaintenanceAlertsTab.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmationModal } from "../../Social Management/Modals/ConfirmationModal";

interface MaintenanceFormState {
  message: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

// Helper function to get current date/time in local timezone
const getCurrentDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
};

// Helper function to get minimum date (today)
const getMinDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to get minimum time for a given date
const getMinTime = (selectedDate: string) => {
  const now = new Date();
  const selected = new Date(selectedDate);
  
  // If selected date is today, return current time + 1 minute
  if (selected.toDateString() === now.toDateString()) {
    const minTime = new Date(now.getTime() + 60000); // Add 1 minute
    return minTime.toTimeString().slice(0, 5);
  }
  
  // If selected date is in the future, no time restriction
  return "00:00";
};

const defaultState: MaintenanceFormState = (() => {
  const { date, time } = getCurrentDateTime();
  // Set default start time to 1 hour from now
  const futureTime = new Date();
  futureTime.setHours(futureTime.getHours() + 1);
  
  return {
    message: "",
    startDate: date,
    startTime: futureTime.toTimeString().slice(0, 5),
    endDate: date,
    endTime: "23:59",
  };
})();

const styles: { [key: string]: React.CSSProperties } = {
  Maincontainer: {
    backgroundColor: "#181826",
    color: "#ffffff",
    minHeight: "100vh",
    padding: "2rem",
  },
  container: {
    maxWidth: "760px",
    margin: "40px auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    background: "#212134",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    color: "white",
  },
  heading: {
    fontSize: "28px",
    fontWeight: 600,
    marginBottom: "20px",
    textAlign: "center",
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: "15px",
    fontWeight: 500,
  },
  input: {
    padding: "10px",
    fontSize: "14px",
    marginTop: "6px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    outline: "none",
    transition: "border 0.2s",
    backgroundColor: "#181826",
    color: "#ffffff",
  },
  textarea: {
    padding: "10px",
    fontSize: "14px",
    marginTop: "6px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    resize: "vertical",
    backgroundColor: "#181826",
    color: "#ffffff",
    minHeight: "120px",
  },
  select: {
    padding: "10px",
    fontSize: "14px",
    marginTop: "6px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#181826",
    color: "#ffffff",
  },
  row: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  button: {
    padding: "12px 16px",
    fontSize: "15px",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    background: "#007bff",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: "12px",
    marginTop: "4px",
  },
};

export default function MaintenanceAlertsTab() {
  const [form, setForm] = useState<MaintenanceFormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<MaintenanceFormState>>({});

 // Update minimum values when dates change
  useEffect(() => {
    validateDates();
  }, [form.startDate, form.startTime, form.endDate, form.endTime]);

  const validateDates = () => {
    const newErrors: Partial<MaintenanceFormState> = {};
    const now = new Date();
    const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
    const endDateTime = new Date(`${form.endDate}T${form.endTime}`);

    // Check if start date/time is in the past
    if (startDateTime <= now) {
      newErrors.startDate = "Start date/time must be in the future";
    }

    // Check if end date/time is before or equal to start date/time
    if (endDateTime <= startDateTime) {
      newErrors.endDate = "End date/time must be after start date/time";
    }

    // Check if end date/time is in the past
    if (endDateTime <= now) {
      newErrors.endDate = "End date/time must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  const setField = <K extends keyof MaintenanceFormState>(k: K, v: MaintenanceFormState[K]) => {
    setForm((s) => {
      const newForm = { ...s, [k]: v };
      
      // Auto-adjust related fields
      if (k === "startDate" || k === "startTime") {
        const startDateTime = new Date(`${k === "startDate" ? v : s.startDate}T${k === "startTime" ? v : s.startTime}`);
        const endDateTime = new Date(`${newForm.endDate}T${newForm.endTime}`);
        
        // If end is before or equal to start, adjust end to be 1 hour after start
        if (endDateTime <= startDateTime) {
          const newEndDateTime = new Date(startDateTime.getTime() + 3600000); // Add 1 hour
          newForm.endDate = newEndDateTime.toISOString().split('T')[0];
          newForm.endTime = newEndDateTime.toTimeString().slice(0, 5);
        }
      }
      
      return newForm;
    });
  };

  const sendAnnouncement = async () => {
    setLoading(true);
    try {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
      const endDateTime = new Date(`${form.endDate}T${form.endTime}`);

      // Final validation before sending
      const now = new Date();
      if (startDateTime <= now) {
        toast.error("Start date/time must be in the future");
        setLoading(false);
        setIsConfirmOpen(false);
        return;
      }

      if (endDateTime <= startDateTime) {
        toast.error("End date/time must be after start date/time");
        setLoading(false);
        setIsConfirmOpen(false);
        return;
      }

      const payload = {
        message: form.message,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        type: "maintenance",
      };

      await axios.post(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/create-announcement`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );

      toast.success("Alert scheduled successfully!");
      setForm(defaultState);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || err.message || "Unknown error");
    } finally {
      setLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDates()) {
      toast.error("Please set the right date/time");
      return;
    }
    
    setIsConfirmOpen(true);
  };

  return (
    <div style={styles.Maincontainer}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Announce Maintenance Alert</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Alert Message
            <input
              style={styles.input}
              value={form.message}
              onChange={(e) => setField("message", e.target.value)}
              required
              placeholder="e.g., Scheduled Database Maintenance"
            />
          </label>

                    <div style={styles.row}>
            <label style={styles.label}>
              Start Date
              <input
                type="date"
                style={{
                  ...styles.input,
                  borderColor: errors.startDate ? "#ff6b6b" : "#ccc",
                }}
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                min={getMinDate()}
                required
              />
            </label>
            <label style={styles.label}>
              Start Time
              <input
                type="time"
                style={{
                  ...styles.input,
                  borderColor: errors.startDate ? "#ff6b6b" : "#ccc",
                }}
                value={form.startTime}
                onChange={(e) => setField("startTime", e.target.value)}
                min={form.startDate === getMinDate() ? getMinTime(form.startDate) : undefined}
                required
                />
            </label>
            {errors.startDate && (
              <span style={styles.errorText}>{errors.startDate}</span>
            )}
          </div>

          <div style={styles.row}>
            <label style={styles.label}>
              End Date
              <input
                type="date"
                style={{
                  ...styles.input,
                  borderColor: errors.endDate ? "#ff6b6b" : "#ccc",
                }}
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                min={form.startDate}
                required
              />

            </label>
            <label style={styles.label}>
              End Time
              <input
                type="time"
                style={{
                  ...styles.input,
                  borderColor: errors.endDate ? "#ff6b6b" : "#ccc",
                }}
                value={form.endTime}
                onChange={(e) => setField("endTime", e.target.value)}
                required
              />
            </label>
            {errors.endDate && (
              <span style={styles.errorText}>{errors.endDate}</span>
            )}
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.button,
              opacity: Object.keys(errors).length > 0 ? 0.6 : 1,
              cursor: Object.keys(errors).length > 0 ? "not-allowed" : "pointer",
            }} 
            disabled={loading || Object.keys(errors).length > 0}
          >
            {loading ? "Processing…" : "Schedule Alert"}
          </button>
        </form>
      </div>

      {/* Confirmation modal */}
      <ConfirmationModal
        message={`Are you sure you want to schedule this alert?`}
        onConfirm={sendAnnouncement}
        onCancel={() => setIsConfirmOpen(false)}
        isOpen={isConfirmOpen}
      />

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}
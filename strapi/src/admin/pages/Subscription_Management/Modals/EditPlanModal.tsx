import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TbBorderRadius } from "react-icons/tb";

type Plan = {
  id: string;
  name: string;
  description : string;
  price: number;
  credits : number;
  is_active: boolean;
};

type EditPlanModalProps = {
  plan: Plan | null;
  onClose: () => void;
  onUpdate: (updatedPlan: Plan) => void;
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#181826",
    padding: "2rem",
    borderRadius: "10px",
    width: "500px",
    color: "#fff",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
    cursor: "pointer",
    fontSize: "1.2rem",
    color: "#fff",
    border: "none",
    background: "transparent",
  },
  heading: {
    fontSize: "1.8rem",
    fontWeight: 600,
    marginBottom: "1rem",
    textAlign: "center" as const,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    marginBottom: "1rem",
  },
  label: {
    marginBottom: "0.3rem",
    fontWeight: 500,
    fontSize :"1.3rem"
  },
  input: {
    padding: "0.5rem",
    borderRadius: "5px",
    border: "1px solid #32324d",
    backgroundColor: "#212134",
    color: "#fff",
    fontSize: "1.3rem",
  },
  checkbox: {
    marginRight: "0.5rem",
    cursor: "pointer"
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "0.5rem 1rem",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    width: "100%",
    fontSize: "1.3rem",
    fontWeight: 600,
  },
  customToast: {
    fontSize: "1.3rem",
    fontWeight: 500,
    background: "#ffffff",
    color: "#fff",
    borderRadius: "8px",
    zIndex: 10
  }
};

const EditPlanModal: React.FC<EditPlanModalProps> = ({ plan, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<Plan | null>(plan);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(plan);
  }, [plan]);

  if (!plan || !formData) return null;

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!formData) return;
  const { name, value, type, checked } = e.target;
  setFormData({
    ...formData,
    [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
  });
};

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      const res = await axios.put(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/stripe/plan/${formData.id}`,
        {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          credits : formData.credits,
          is_active: formData.is_active,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );
      if (res.status === 200) {
        toast.success("Plan updated successfully!");
        onUpdate(res.data.data); // pass updated plan back
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || err.message || "Failed to update plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>
          <FaTimes />
        </button>
        <h2 style={styles.heading}>Edit Plan</h2>
        <div style={styles.formGroup}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <input
            style={styles.input}
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Price</label>
          <input
            style={styles.input}
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Credits</label>
          <input
            style={styles.input}
            type="number"
            name="credits"
            value={formData.credits}
            onChange={handleChange}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <input
              style={styles.checkbox}
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            Active
          </label>
        </div>
        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
        <ToastContainer position="top-center" hideProgressBar  toastClassName="customToast" />
    </>
  );
};

export default EditPlanModal;

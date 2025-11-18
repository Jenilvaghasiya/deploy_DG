import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface PlanFormState {
  name: string;
  description: string;
  price: number;
  credits: number;
}

const defaultState: PlanFormState = {
  name: "",
  description: "",
  price: 0,
  credits: 1,
};

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
  },
  textarea: {
    padding: "10px",
    fontSize: "14px",
    marginTop: "6px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    resize: "vertical",
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
  error: {
    color: "crimson",
    fontWeight: 500,
  },
  success: {
    color: "green",
    fontWeight: 500,
    fontSize: "1.3rem"
  },
};

export default function CreateStripePlanForm() {
  const [form, setForm] = useState<PlanFormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setField = <K extends keyof PlanFormState>(k: K, v: PlanFormState[K]) => {
    setForm((s) => ({ ...s, [k]: v }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        credits: form.credits,
      };

      const res = await axios.post(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/stripe/plan`, payload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );

 toast.success("Plan created successfully!");
       setForm(defaultState);
      console.log("Created plan response:", res.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.Maincontainer}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Create Monthly Stripe Plan</h2>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            Plan name
            <input
              style={styles.input}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
              placeholder="Plan name"
            />
          </label>

          <label style={styles.label}>
            Description
            <textarea
              style={styles.textarea}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Short description"
            />
          </label>

          <div style={styles.row}>
            <label style={styles.label}>
              Price (₹)
              <input
                type="number"
                style={styles.input}
                value={form.price}
                onChange={(e) => setField("price", Number(e.target.value))}
                required
              />
            </label>

            <label style={styles.label}>
              Credits
              <input
                type="number"
                min={1}
                style={styles.input}
                value={form.credits}
                onChange={(e) => setField("credits", Number(e.target.value))}
              />
            </label>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating…" : "Create Plan"}
          </button>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
        </form>
      </div>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
  );
}

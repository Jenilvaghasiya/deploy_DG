import React, { useEffect, useState } from "react";
import './ViewPlansPage.css';
import { useNavigate } from "react-router-dom";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import axios from "axios";
import EditPlanModal from "../Modals/EditPlanModal";
import { ConfirmationModal } from "../../Social Management/Modals/ConfirmationModal";

type Plan = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
  backgroundColor: "#181826",
  minHeight: "100vh",
  color: "#ffffff",
  display: "flex",
  flexDirection: "column",
  padding: "0", // remove padding to avoid interfering with sticky
  overflowY: "auto",
  },
 heading: {
  fontSize: "28px",
  fontWeight: 600,
  margin: 0,
  padding: "1rem 0",
  textAlign: "center",
  position: "sticky",
  top: 0,
  backgroundColor: "#181826",
  zIndex: 10,
  borderBottom: "1px solid #32324d", // optional, for visual separation
},
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "#212134",
    border: "1px solid #32324d",
    borderRadius: "10px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center" as const,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  planName: {
    fontSize: "1.8rem",
    fontWeight: 600,
    marginBottom: "0.8rem",
  },
  planPrice: {
    fontSize: "1.6rem",
    fontWeight: 500,
    marginBottom: "0.5rem",
  },
  active: {
    color: "#4ade80",
    fontWeight: 600,
    fontSize: '1.5rem',
    marginTop: "0.5rem",
  },
  inactive: {
    color: "#f87171",
    fontWeight: 600,
    fontSize: '1.5rem',
    marginTop: "0.5rem",
  }, 
  actions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "10px",
  },
  actionButton: {
    cursor: "pointer",
    fontSize: "1.2rem",
    padding: "0.3rem 0.5rem",
    borderRadius: "5px",
    border: "none",
  },
  editBtn: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },
  deleteBtn: {
    backgroundColor: "#dc2626",
    color: "#fff",
  }
};

const ViewPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const navigate = useNavigate();

  // 🔹 Move fetchPlans here
  const fetchPlans = async () => {
    try {
      const res = await axios.get(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/stripe/plans`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );

      if (res?.data?.data) {
        setPlans(res.data.data);
      } else {
        setError("No plans available.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const confirmDelete = (id: string) => {
    setPlanToDelete(id);
    setIsModalOpen(true);
  };


  const handleDelete = async () => {
        if (!planToDelete) return;
    try {
      await axios.delete(
        `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/stripe/plan/${planToDelete}`,
        {
          headers: {
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        }
      );
      setPlans(plans.filter((plan) => plan.id !== planToDelete));
      setIsModalOpen(false);
      setPlanToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete plan.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Stripe Plans</h1>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
          <div className="loader"></div>
        </div>
      ) : plans.length === 0 ? (
        <p>{error || "No plans available."}</p>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
          <div style={styles.grid}>
            {plans.map((plan) => (
              <div key={plan.id} style={styles.card}>
                <h2 style={styles.planName}>{plan.name}</h2>
                <p style={styles.planPrice}>₹{plan.price}</p>
                <span style={plan.is_active ? styles.active : styles.inactive}>
                  {plan.is_active ? "Active" : "Inactive"}
                </span>

                <div style={styles.actions}>
                  <button
                    style={{ ...styles.actionButton, ...styles.editBtn }}
                    onClick={() => setEditPlan(plan)}
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    style={{ ...styles.actionButton, ...styles.deleteBtn }}
                    onClick={() => confirmDelete(plan.id)}
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>
            ))}

            {/* Add new card */}
            <div
              style={{
                ...styles.card,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "3rem",
                cursor: "pointer",
                color: "#d385b8",
                border: "2px dashed #d385b8",
              }}
              onClick={() => navigate("/subscription-management/create")}
            >
              <FaPlus />
            </div>
          </div>
        </div>
      )}

      {editPlan && (
        <EditPlanModal
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onUpdate={fetchPlans} // 🔹 refresh after save
        />
      )}
         <ConfirmationModal
          message="Are you sure you want to delete this plan?"
          onConfirm={handleDelete}
          onCancel={() => setIsModalOpen(false)}
          isOpen={isModalOpen}
        />
    </div>
  );
};

export default ViewPlansPage;

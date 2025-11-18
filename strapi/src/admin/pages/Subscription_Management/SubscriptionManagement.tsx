import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { BsCardList } from "react-icons/bs";
import { TbCardsFilled } from "react-icons/tb";
import CreateStripePlanForm from "./Tabs/CreatePlanTab";
import ViewPlansPage from "./Tabs/ViewPlansTab";
import StripeLogo from "../../../../public/assets/PoweredByStripe.svg";

const SubscriptionManagement = () => {
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#212134",
    color: "#ffffff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  },
  sidebar: {
    position: "fixed" as const,      // fix the sidebar
    top: 0,
    width: "250px",
    height: "100vh",                 // full viewport height
    backgroundColor: "#212134",
    borderRight: "1px solid #32324d",
    display: "flex",
    flexDirection: "column" as const,
    overflowY: "auto",               // scroll inside sidebar if content overflows
    paddingBottom: "1rem",
    zIndex: 100,
  },
  sidebarHeader: {
    height: "57px",
    paddingLeft: "2rem",
    display: "flex",
    fontSize: "1.8rem",
    fontWeight: "600",
    alignItems: "center",
    flexShrink: 0,
    borderBottom : "1px solid",
    borderColor : "#32324d"
  },

  navSection: {
    display: "flex",
    flexDirection: "column" as const,
    flexShrink: 0,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    cursor: "pointer",
    borderRadius: "4px",
    margin: "0.25rem 0",
    textDecoration: "none",
    fontSize: "1.4rem",
    flexShrink: 0,
  },
  activeNav: {
    backgroundColor: "#181826",
    color: "#ffffff",
    fontWeight: 600,
  },
  inactiveNav: {
    color: "#cfcfe8",
    fontWeight: 400,
  },
  mainContent: {
    marginLeft: "250px",            // leave space for fixed sidebar
    flex: 1,
    backgroundColor: "#212134",
    minHeight: "100vh",
    overflowY: "auto",              // scroll main content if needed
  },
  logo: {
    position: "fixed" as const,
    bottom: "20px",
    right: "80px",
    width: "130px",
    height: "130px",
    objectFit: "contain",
    opacity: 0.9,
    transition: "opacity 0.2s ease-in-out",
  },
  icon: {
    width: "16px",
    height: "16px",
  },
};

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>Subscription Management</div>
        <div style={styles.navSection}>
          <NavLink
            to="/subscription-management/create"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.activeNav : styles.inactiveNav),
            })}
          >
            <TbCardsFilled style={styles.icon} /> Create Plan
          </NavLink>

          <NavLink
            to="/subscription-management/view"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.activeNav : styles.inactiveNav),
            })}
          >
            <BsCardList style={styles.icon} /> View Plans
          </NavLink>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Navigate to="create" replace />} />  {/* default */}
          <Route path="create" element={<CreateStripePlanForm />} />
          <Route path="view" element={<ViewPlansPage />} />
        </Routes>
      </div>

      <img src={StripeLogo} alt="Logo" style={styles.logo} />
    </div>
  );
};

export default SubscriptionManagement;

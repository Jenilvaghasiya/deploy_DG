import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import PostsTab from "./Tabs/PostTab";
import ReportsTab from "./Tabs/PostReportsTab";
import ReviewsTab from "./Tabs/ReviewsTab";
import ReviewReportsTab from "./Tabs/ReviewReportsTab";
import { VscReport } from "react-icons/vsc";
import { BsFillFilePostFill } from "react-icons/bs";
import { MdOutlineReviews } from "react-icons/md";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useState } from "react";

const SocialPostManagement = () => {
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);

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
    position: "fixed" as const,   // sidebar stays fixed
    top: 0,
    width: "250px",
    height: "100vh",              // full viewport height
    backgroundColor: "#212134",
    borderRight: "1px solid #32324d",
    display: "flex",
    flexDirection: "column" as const,
    overflowY: "auto",            // scroll when content overflows
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
    borderColor : "#32324d"        // prevent shrinking while scrolling
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
  subNavLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 2.5rem",
    cursor: "pointer",
    borderRadius: "4px",
    margin: "0.15rem 0",
    textDecoration: "none",
    fontSize: "1.3rem",
    flexShrink: 0,
  },
  mainContent: {
    marginLeft: "250px",         // leave space for fixed sidebar
    flex: 1,
    backgroundColor: "#212134",
    minHeight: "100vh",
    overflowY: "auto",           // scroll main content
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
        <div style={styles.sidebarHeader}>Social Post Management</div>
        <div style={styles.navSection}>
          <NavLink
            to="/social-management/posts"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.activeNav : styles.inactiveNav),
            })}
          >
            <BsFillFilePostFill style={styles.icon} /> Posts
          </NavLink>

          {/* Reports dropdown */}
          <div
            style={{
              ...styles.navLink,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              ...(reportDropdownOpen ? styles.activeNav : styles.inactiveNav),
            }}
            onClick={() => setReportDropdownOpen(!reportDropdownOpen)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <VscReport style={styles.icon} /> Reports
            </div>
            {reportDropdownOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>

          {reportDropdownOpen && (
            <>
              <NavLink
                to="/social-management/reports/post-reports"
                style={({ isActive }) => ({
                  ...styles.subNavLink,
                  ...(isActive ? styles.activeNav : styles.inactiveNav),
                })}
              >
                Post Reports
              </NavLink>
              <NavLink
                to="/social-management/reports/review-reports"
                style={({ isActive }) => ({
                  ...styles.subNavLink,
                  ...(isActive ? styles.activeNav : styles.inactiveNav),
                })}
              >
                Review Reports
              </NavLink>
            </>
          )}
{/* 
          <NavLink
            to="/social-management/reviews"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.activeNav : styles.inactiveNav),
            })}
          >
            <MdOutlineReviews style={styles.icon} /> Reviews
          </NavLink> */}
        </div>
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Navigate to="posts" replace />} />
          <Route path="posts" element={<PostsTab />} />
          <Route path="reviews" element={<ReviewsTab />} />
          <Route path="reports/post-reports" element={<ReportsTab />} />
          <Route path="reports/review-reports" element={<ReviewReportsTab />} />
        </Routes>
      </div>
    </div>
  );
};

export default SocialPostManagement;

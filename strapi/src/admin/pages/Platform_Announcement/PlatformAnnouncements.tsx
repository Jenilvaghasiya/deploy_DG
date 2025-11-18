// PlatformAnnouncements.tsx
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { MdNewReleases, MdBuildCircle } from "react-icons/md";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FaList, FaPlus } from "react-icons/fa";
import { useState } from "react";
import NewFeaturesTab from "./Tabs/NewFeaturesTab";
import MaintenanceAlertsTab from "./Tabs/MaintenanceAlertsTab";
import ViewFeaturesTab from "./Tabs/ViewFeaturesTab";
import ViewMaintenanceTab from "./Tabs/ViewMaintenanceTab";

const PlatformAnnouncements = () => {
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [maintenanceDropdownOpen, setMaintenanceDropdownOpen] = useState(false);

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
      position: "fixed" as const,
      top: 0,
      width: "250px",
      height: "100vh",
      backgroundColor: "#212134",
      borderRight: "1px solid #32324d",
      display: "flex",
      flexDirection: "column" as const,
      overflowY: "auto",
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
      borderBottom: "1px solid",
      borderColor: "#32324d"
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
      marginLeft: "250px",
      flex: 1,
      backgroundColor: "#212134",
      minHeight: "100vh",
      overflowY: "auto",
    },
    icon: {
      width: "16px",
      height: "16px",
    },
    subIcon: {
      width: "14px",
      height: "14px",
    },
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>Platform Announcements</div>
        <div style={styles.navSection}>
          
          {/* New Features Dropdown */}
          <div
            style={{
              ...styles.navLink,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              ...(featuresDropdownOpen ? styles.activeNav : styles.inactiveNav),
            }}
            onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MdNewReleases style={styles.icon} /> New Features
            </div>
            {featuresDropdownOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>

          {featuresDropdownOpen && (
            <>
              <NavLink
                to="/platform-announcements/features/create"
                style={({ isActive }) => ({
                  ...styles.subNavLink,
                  ...(isActive ? styles.activeNav : styles.inactiveNav),
                })}
              >
                <FaPlus style={styles.subIcon} />Send Feature Announcement
              </NavLink>
              <NavLink
                to="/platform-announcements/features/list"
                style={({ isActive }) => ({
                  ...styles.subNavLink,
                  ...(isActive ? styles.activeNav : styles.inactiveNav),
                })}
              >
                <FaList style={styles.subIcon} /> View Features Announcement
              </NavLink>
            </>
          )}

          {/* Maintenance Alerts Dropdown */}
          <div
            style={{
              ...styles.navLink,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              ...(maintenanceDropdownOpen ? styles.activeNav : styles.inactiveNav),
            }}
            onClick={() => setMaintenanceDropdownOpen(!maintenanceDropdownOpen)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MdBuildCircle style={styles.icon} /> Maintenance Alerts
            </div>
            {maintenanceDropdownOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>

          {maintenanceDropdownOpen && (
            <>
              <NavLink
                to="/platform-announcements/maintenance/create"
                style={({ isActive }) => ({
                  ...styles.subNavLink,
                  ...(isActive ? styles.activeNav : styles.inactiveNav),
                })}
              >
                <FaPlus style={styles.subIcon} /> Send Alert
              </NavLink>
              <NavLink
                to="/platform-announcements/maintenance/list"
                style={({ isActive }) => ({
                  ...styles.subNavLink,
                  ...(isActive ? styles.activeNav : styles.inactiveNav),
                })}
              >
                <FaList style={styles.subIcon} /> View Alerts
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Navigate to="features/list" replace />} />
          <Route path="features/create" element={<NewFeaturesTab />} />
          <Route path="features/list" element={<ViewFeaturesTab />} />
          <Route path="maintenance/create" element={<MaintenanceAlertsTab />} />
          <Route path="maintenance/list" element={<ViewMaintenanceTab />} />
        </Routes>
      </div>
    </div>
  );
};

export default PlatformAnnouncements;
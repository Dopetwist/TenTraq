import { useAuth } from "../context/AuthContext.jsx";
import { Bell, Settings, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import "./Topbar.css";

function Topbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-content">
        {/* Left side - Page title would go here if needed */}
        <div className="topbar-left" />

        {/* Right side - User info and actions */}
        <div className="topbar-right">
          {/* Notifications */}
          <button className="topbar-icon-btn">
            <Bell size={20} />
            <span className="notification-dot" />
          </button>

          {/* Divider */}
          <div className="topbar-divider" />

          {/* User Profile */}
          <div className="topbar-profile">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="profile-btn"
            >
              <div className="profile-avatar">
                <User size={18} />
              </div>
              <div className="profile-info">
                <p className="profile-name">
                  {user?.full_name || "User"}
                </p>
                <p className="profile-role">Landlord</p>
              </div>
            </button>

            {/* Profile Menu */}
            {showProfileMenu && (
              <div className="profile-menu">
                <button
                  onClick={() => {
                    navigate("/settings");
                    setShowProfileMenu(false);
                  }}
                  className="menu-item"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <div className="menu-divider" />
                <button
                  onClick={handleLogout}
                  className="menu-item menu-item-logout"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

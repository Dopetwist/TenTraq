import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserPlus,
  Mail,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/tenants", label: "Tenants", icon: Users },
    { path: "/properties", label: "Properties", icon: Building2 },
    { path: "/register", label: "Register Tenant", icon: UserPlus },
    { path: "/emails", label: "Emails", icon: Mail },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="mobile-header">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-btn"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link to="/" className="sidebar-logo-link" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="logo-box">
              <span className="logo-text">TR</span>
            </div>
            <h1 className="logo-title">TenTraq</h1>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="nav-items">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`nav-item ${active ? 'active' : ''}`}
                >
                  <Icon size={20} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            <LogOut size={20} className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { Menu, User, X } from "lucide-react";
import Navbar from "./Navbar";
import GetStartedButton from "../components/GetStartedButton";
import { useState } from "react";

function Header() {

    const { user } = useAuth();
    const navigate = useNavigate();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const isMobile = window.innerWidth <= 768;

    return (
        <div className="header">
            <div className="app-name">
                <Link to={"/"} className="header-logo-link">
                    <div className="logo-box">
                        <span className="logo-text">TR</span>
                    </div>
                    <h1>TenTraq</h1>
                </Link>
            </div>

            <Navbar
                isMobileNavOpen={isMobileNavOpen}
                onNavigate={() => setIsMobileNavOpen(false)}
            />

            <div className="mobile-nav-icons-container">
                {user ? (
                    <button
                    onClick={() => navigate("/dashboard")}
                    className="profile-btn"
                    >
                        <div className="profile-avatar">
                            <User size={18} />
                        </div>
                        <div className="profile-info">
                            <p className="profile-name">
                                {user?.full_name || "User"}
                            </p>
                        </div>
                    </button>
                ) : (
                    <div className="header-action-btns">
                        <Link to={"/login"}>
                            <p className="login">Login</p>
                        </Link>
                        {!isMobile && <GetStartedButton />}
                    </div>
                )}

                <button
                    type="button"
                    className="mobile-nav-toggle"
                    aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={isMobileNavOpen}
                    onClick={() => setIsMobileNavOpen((isOpen) => !isOpen)}
                >
                    {isMobileNavOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>
        </div>
    )
}

export default Header;
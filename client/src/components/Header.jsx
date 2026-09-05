import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { User } from "lucide-react";
import Navbar from "./Navbar";
import GetStartedButton from "../components/GetStartedButton";

function Header() {

    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="header">
            <div className="app-name">
                <Link to={"/"}>
                    <h1>TenTraq</h1>
                </Link>
            </div>

            <Navbar />

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
                    <GetStartedButton />
                </div>
            )}
        </div>
    )
}

export default Header;
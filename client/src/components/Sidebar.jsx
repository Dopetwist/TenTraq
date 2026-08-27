import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

function Sidebar() {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    /* const landlordId = localStorage.getItem("tentraq-user") ? JSON.parse(localStorage.getItem("tentraq-user")).id : null; */

    return (
        <div className="sidebar">
            <Link to={"/"}><h1>TenTraq</h1></Link>
                
            <div className="sidebar-contents">
                <Link to={"/dashboard"} className="sidebar-item">Dashboard</Link>
                <Link to={"/tenants"} className="sidebar-item">Tenants</Link>
                <Link to={"/properties"} className="sidebar-item">Properties</Link>
                <Link to={"/register"} className="sidebar-item">Register Tenant</Link>
                <Link to={"/emails"} className="sidebar-item">Emails</Link>
                <Link to={"/settings"} className="sidebar-item">Settings</Link>
                <button type="button" className="sidebar-item sidebar-logout" onClick={() => { signOut(); navigate("/login", { replace: true }); }}>Logout</button>
            </div>
        </div>
    )
}

export default Sidebar;
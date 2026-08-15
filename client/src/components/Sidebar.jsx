import { Link } from "react-router";

function Sidebar() {
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
                <Link to={"/logout"} className="sidebar-item">Logout</Link>
            </div>
        </div>
    )
}

export default Sidebar;
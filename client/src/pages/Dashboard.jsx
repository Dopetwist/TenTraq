import { useAuth } from "../context/AuthContext.jsx";

function Dashboard() {
    /* const { user } = useAuth(); */

    return (
        <div id="dashboard">
            
            <div className="dashboard-container">
                <h1>Dashboard</h1>

                <div className="tenants-box">
                    <div className="total-tenants inner-box">
                        <h2>Total Tenants</h2>
                        <span>32</span>
                    </div>
                    <div className="total-properties inner-box">
                        <h2>Total Properties</h2>
                        <span>4</span>
                    </div>
                    <div className="documents-uploaded inner-box">
                        <h2>Documents Uploaded</h2>
                        <span>55</span>
                    </div>
                    <div className="recent-tenants inner-box">
                        <h2>Recent Tenants</h2>
                        <span>2</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;
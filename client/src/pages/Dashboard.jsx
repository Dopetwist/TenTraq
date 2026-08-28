import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";

function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState("");

    const { user } = useAuth();

    console.log(user);

    const landlordId = user ? user.id : null;

    useEffect(() => {
        if (!landlordId) return;

        let isCurrentRequest = true;

        const fetchUserData = async () => {
            try {
                const data = await apiRequest(`/api/landlords/${landlordId}`);

                if (isCurrentRequest) {
                    setDashboardData(data);
                    setError("");
                }
            } catch (requestError) {
                console.error("Unable to load dashboard data:", requestError);
                if (isCurrentRequest) setError("Unable to load dashboard data.");
            }
        };

        fetchUserData();

        return () => {
            isCurrentRequest = false;
        };
    }, [landlordId]);

    return (
        <div id="dashboard">
            
            <div className="dashboard-container">
                <h1 className="dashboard-title">Welcome, {user?.full_name}</h1>
                <h1>Dashboard</h1>

                {error && <p className="dashboard-error" role="alert">{error}</p>}

                <div className="tenants-box">
                    <div className="total-tenants inner-box">
                        <h2>Total Tenants</h2>
                        <span>{dashboardData?.totalTenants ?? 0}</span>
                    </div>
                    <div className="total-properties inner-box">
                        <h2>Total Properties</h2>
                        <span>{dashboardData?.totalProperties ?? 0}</span>
                    </div>
                    <div className="documents-uploaded inner-box">
                        <h2>Documents Uploaded</h2>
                        <span>{dashboardData?.documentsUploaded ?? 0}</span>
                    </div>
                    <div className="recent-tenants inner-box">
                        <h2>Recent Tenants</h2>
                        <span>{dashboardData?.recentTenants?.length ?? 0}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";
import StatCard from "../components/UI/StatCard.jsx";
import LoadingState from "../components/UI/LoadingState.jsx";
import { Users, Building2, FileText, Clock } from "lucide-react";
import "./Dashboard.css";

function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const { user } = useAuth();

    const landlordId = user ? user.id : null;

    useEffect(() => {
        if (!landlordId) return;

        let isCurrentRequest = true;

        const fetchUserData = async () => {
            try {
                setLoading(true);
                const data = await apiRequest(`/api/landlords/${landlordId}`);

                if (isCurrentRequest) {
                    setDashboardData(data);
                    setError("");
                }
            } catch (requestError) {
                console.error("Unable to load dashboard data:", requestError);
                if (isCurrentRequest) setError("Unable to load dashboard data.");
            } finally {
                if (isCurrentRequest) setLoading(false);
            }
        };

        fetchUserData();

        return () => {
            isCurrentRequest = false;
        };
    }, [landlordId]);

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">
                    Welcome back, {user?.full_name}
                </h1>
                <p className="dashboard-subtitle">Here's what's happening with your properties today.</p>
            </div>

            {/* Error State */}
            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <LoadingState />
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="dashboard-stats">
                        <StatCard
                            icon={Users}
                            label="Total Tenants"
                            value={dashboardData?.totalTenants ?? 0}
                        />
                        <StatCard
                            icon={Building2}
                            label="Total Properties"
                            value={dashboardData?.totalProperties ?? 0}
                        />
                        <StatCard
                            icon={FileText}
                            label="Documents Uploaded"
                            value={dashboardData?.documentsUploaded ?? 0}
                        />
                        <StatCard
                            icon={Clock}
                            label="Recent Tenants"
                            value={dashboardData?.recentTenants?.length ?? 0}
                        />
                    </div>

                    {/* Recent Activity */}
                    {dashboardData?.recentTenants && dashboardData.recentTenants.length > 0 && (
                        <div className="dashboard-recent">
                            <h2 className="dashboard-section-title">Recent Tenants</h2>
                            <div className="recent-tenants-list">
                                {dashboardData.recentTenants.map((tenant, idx) => (
                                    <div key={idx} className="tenant-item">
                                        <div>
                                            <p className="tenant-name">{tenant.full_name}</p>
                                            <p className="tenant-email">{tenant.email}</p>
                                        </div>
                                        <span className="tenant-badge">Recently Added</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default Dashboard;
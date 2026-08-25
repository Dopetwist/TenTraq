import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { apiRequest } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const data = await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify(formData)
            });
            signIn(data);
            navigate(location.state?.from || "/dashboard", { replace: true });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-panel">
                <Link className="auth-brand" to="/">TenTraq</Link>
                <p className="auth-eyebrow">Landlord workspace</p>
                <h1>Welcome back.</h1>
                <p className="auth-copy">Sign in to keep your properties and tenants moving smoothly.</p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="login-email">Email address</label>
                    <input id="login-email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required autoComplete="email" />
                    <label htmlFor="login-password">Password</label>
                    <input id="login-password" type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required autoComplete="current-password" />
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
                </form>
                <p className="auth-switch">New to TenTraq? <Link to="/register-landlord">Create an account</Link></p>
            </section>
        </main>
    );
}

export default Login;
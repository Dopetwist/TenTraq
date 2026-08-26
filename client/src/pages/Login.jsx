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

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    }

    return (
        <main className="auth-page">
            <div className="auth-panel">
                <Link className="auth-brand" to="/">TenTraq</Link>
                <p className="auth-eyebrow">Landlord workspace</p>
                <h1>Welcome back.</h1>
                <p className="auth-copy">Sign in to keep your properties and tenants moving smoothly.</p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="login-email">Email address</label>
                    <input id="login-email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                    
                    <label htmlFor="login-password">Password</label>
                    <input id="login-password" type="password" name="password" value={formData.password} onChange={handleChange} required autoComplete="current-password" />
                    <Link to="/forgot-password" className="auth-link">
                        Forgot your password?
                    </Link>
                    
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
                </form>
                <p className="auth-switch">New to TenTraq? <Link to="/register-landlord">Create an account</Link></p>
            </div>
        </main>
    );
}

export default Login;
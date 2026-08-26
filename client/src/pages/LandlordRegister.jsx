import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiRequest } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function LandlordRegister() {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({ full_name: "", email: "", password: "", confirmPassword: "", secret_word: "" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsSubmitting(true);
        try {
            const data = await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ full_name: formData.full_name, email: formData.email, password: formData.password, secret_word: formData.secret_word })
            });
            signIn(data);
            navigate("/dashboard", { replace: true });
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
            <div className="auth-panel auth-panel-wide">
                <Link className="auth-brand" to="/">TenTraq</Link>
                <p className="auth-eyebrow">A clearer way to manage rentals</p>
                <h1>Make room for better management.</h1>
                <p className="auth-copy">Create your landlord account and bring your properties, tenants, and records into one calm workspace.</p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="register-name">Full name</label>
                    <input id="register-name" type="text" name="full_name" value={formData.full_name} onChange={handleChange} required autoComplete="name" />
                    
                    <label htmlFor="register-email">Email address</label>
                    <input id="register-email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                    
                    <label htmlFor="register-password">Password</label>
                    <input id="register-password" type="password" name="password" minLength="8" value={formData.password} onChange={handleChange} required autoComplete="new-password" />
                    
                    <label htmlFor="register-confirm-password">Confirm password</label>
                    <input id="register-confirm-password" type="password" name="confirmPassword" minLength="8" value={formData.confirmPassword} onChange={handleChange} required autoComplete="new-password" />
                    
                    <label htmlFor="register-secret-word">Secret word (for account recovery)</label>
                    <p className="auth-copy-text">This word will help you recover your account if you ever forget your password. Do not share it with anyone.</p>
                    <input id="register-secret-word" type="text" name="secret_word" value={formData.secret_word} onChange={handleChange} required autoComplete="off" />
                    
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create landlord account"}</button>
                </form>
                <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </main>
    );
}

export default LandlordRegister;
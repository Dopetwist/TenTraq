import { useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../services/api.js";
import PasswordInput from "../components/PasswordInput.jsx";

function ForgotPassword() {
    const [formData, setFormData] = useState({ email: "", secret_word: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await apiRequest("/api/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({
                    email: formData.email,
                    secret_word: formData.secret_word,
                    password: formData.password
                })
            });
            setSuccess(data.message);
            setFormData({ email: "", secret_word: "", password: "", confirmPassword: "" });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-panel">
                <Link className="auth-brand" to="/">TenTraq</Link>
                <p className="auth-eyebrow">Account recovery</p>
                <h1>Set a new password.</h1>
                <p className="auth-copy">Confirm your email and secret word to restore access to your landlord workspace.</p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="forgot-email">Email address</label>
                    <input 
                        id="forgot-email" 
                        type="email" 
                        name="email" 
                        placeholder="e.g. user@example.com"
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        autoComplete="email" 
                    />

                    <label htmlFor="forgot-secret-word">Secret word</label>
                    <input 
                        id="forgot-secret-word" 
                        type="text" 
                        name="secret_word" 
                        placeholder="e.g. MyFirstPet"
                        value={formData.secret_word} 
                        onChange={handleChange} 
                        required 
                        autoComplete="off" 
                    />

                    <label htmlFor="forgot-password">New password</label>
                    <PasswordInput 
                        id="forgot-password" 
                        name="password" 
                        minLength="8" 
                        placeholder="Enter your new password"
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                        autoComplete="new-password" 
                    />

                    <label htmlFor="forgot-confirm-password">Confirm new password</label>
                    <PasswordInput 
                        id="forgot-confirm-password" 
                        name="confirmPassword" 
                        minLength="8" 
                        placeholder="Confirm your new password"
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                        required 
                        autoComplete="new-password" 
                    />

                    {error && <p className="auth-error" role="alert">{error}</p>}
                    {success && <p className="auth-success" role="status">{success}</p>}
                    <button 
                    className="auth-submit" 
                    type="submit" 
                    disabled={isSubmitting}>
                        {isSubmitting ? "Updating password..." : "Update password"}
                    </button>
                </form>
                <p className="auth-switch">Remembered your password? <Link to="/login">Sign in</Link></p>
            </div>
        </main>
    );
}

export default ForgotPassword;

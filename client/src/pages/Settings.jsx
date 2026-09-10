import { useState } from "react";
import { LockKeyhole, SquarePen, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api.js";
import { useNavigate } from "react-router";

function Settings() {

    const { user, updateUser, signOut } = useAuth();
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const [modalError, setModalError] = useState("");
    const [formData, setFormData] = useState({
        full_name: user?.full_name || "",
        email: user?.email || "",
        secret_word: "",
        old_password: "",
        new_password: "",
        confirm_password: "",
        password: ""
    });
    
    const openModal = (modal) => {
        setActiveModal(modal);
        setModalError("");
        setFormData({
            full_name: user?.full_name || "",
            email: user?.email || "",
            secret_word: "",
            old_password: "",
            new_password: "",
            confirm_password: "",
            password: ""
        });
    };

    const closeModal = () => {
        if (!isSubmitting) setActiveModal(null);
    };

    const updateField = (e) => {
        const { name, value } = e.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError("");

        try {
            if (activeModal === "name") {
                if (!formData.full_name.trim()) {
                    setModalError("Name cannot be empty.");
                    return;
                }

                const data = await apiRequest(`/api/landlords/edit/${user?.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ full_name: formData.full_name.trim() })
                });
                updateUser(data.landlord);
            } else if (activeModal === "email") {
                const data = await apiRequest("/api/landlords/email", {
                    method: "PUT",
                    body: JSON.stringify({ email: formData.email, secret_word: formData.secret_word })
                });
                updateUser(data.landlord);
            } else if (activeModal === "password") {
                await apiRequest("/api/landlords/password", {
                    method: "PUT",
                    body: JSON.stringify({
                        old_password: formData.old_password,
                        new_password: formData.new_password,
                        confirm_password: formData.confirm_password
                    })
                });
            } else {
                await apiRequest("/api/landlords/account", {
                    method: "DELETE",
                    body: JSON.stringify({ secret_word: formData.secret_word, password: formData.password })
                });
                signOut();
                navigate("/login", { replace: true });
                return;
            }
            setActiveModal(null);
        } catch (requestError) {
            console.error(`Failed to update ${activeModal}:`, requestError);
            setModalError(requestError.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalDetails = activeModal ? {
        name: { eyebrow: "Account name", title: "Change name", confirm: "Update name" },
        email: { eyebrow: "Account security", title: "Change email", confirm: "Update email" },
        password: { eyebrow: "Account security", title: "Change password", confirm: "Update password" },
        delete: { eyebrow: "Permanent action", title: "Delete account", confirm: "Delete account" }
    }[activeModal] : null;

    return (
        <div id="settings-section">
            <h2>Settings</h2>
            
            <div className="settings-container">
                <div className="settings-box">
                    <p className="settings-title">Account name:</p>
                    <div className="settings-details">
                        <p>{user?.full_name || "John Doe"}</p>

                        <button
                        type="button"
                        className="settings-edit-btn"
                        onClick={() => openModal("name")}
                        aria-label="Change name"
                        >
                            <SquarePen size={18} />
                        </button>
                    </div>
                </div>
                <div className="settings-box">
                    <p className="settings-title">Email:</p>
                    <div className="settings-details">
                        <div className="settings-modify">
                            <p>{user?.email || "No email available"}</p>
                        </div> 
                        <button
                        type="button"
                        className="settings-edit-btn"
                        onClick={() => openModal("email")}
                        aria-label="Change email"
                        >
                            <SquarePen size={18} />
                        </button>
                    </div>
                </div>
                <button type="button" className="settings-box settings-option" onClick={() => openModal("password")}>
                    <span className="settings-title">Change Password</span>
                    <LockKeyhole size={18} />
                </button>
                <button type="button" className="settings-box settings-option settings-danger" onClick={() => openModal("delete")}>
                    <span className="settings-title">Delete Account</span>
                    <Trash2 size={18} />
                </button>
            </div>

            {activeModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-heading">
                            <div>
                                <p className="modal-eyebrow">{modalDetails.eyebrow}</p>
                                <h2>{modalDetails.title}</h2>
                            </div>
                            <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close modal">
                                <X size={20} />
                            </button>
                        </div>

                        {activeModal === "email" && <p className="modal-description">Verify your secret word before changing the email connected to your account.</p>}
                        {activeModal === "delete" && <p className="modal-description">This permanently deletes your account and all associated properties and tenant records.</p>}

                        <form className="settings-form" onSubmit={handleModalSubmit}>
                            {activeModal === "name" && <>
                                <label>Full name<input type="text" name="full_name" value={formData.full_name} onChange={updateField} autoFocus /></label>
                            </>}
                            {activeModal === "email" && <>
                                <label>Email<input type="email" name="email" value={formData.email} onChange={updateField} required autoFocus /></label>
                                <label>Secret word<input type="password" name="secret_word" value={formData.secret_word} onChange={updateField} required /></label>
                            </>}
                            {activeModal === "password" && <>
                                <label>Old password<input type="password" name="old_password" value={formData.old_password} onChange={updateField} required autoFocus /></label>
                                <label>New password<input type="password" name="new_password" value={formData.new_password} onChange={updateField} minLength={8} required /></label>
                                <label>Confirm new password<input type="password" name="confirm_password" value={formData.confirm_password} onChange={updateField} minLength={8} required /></label>
                            </>}
                            {activeModal === "delete" && <>
                                <label>Secret word<input type="password" name="secret_word" value={formData.secret_word} onChange={updateField} required autoFocus /></label>
                                <label>Password<input type="password" name="password" value={formData.password} onChange={updateField} required /></label>
                            </>}

                            {modalError && <p className="form-error" role="alert">{modalError}</p>}
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={closeModal} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className={activeModal === "delete" ? "delete-btn" : "confirm-btn"} disabled={isSubmitting}>
                                    {isSubmitting ? "Please wait..." : modalDetails.confirm}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Settings;
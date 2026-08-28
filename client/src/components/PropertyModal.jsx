import { useState } from "react";
import { X } from "lucide-react";
import { apiRequest } from "../services/api.js";

function PropertyModal({ isOpen, onClose, onCreated }) {
    const [formData, setFormData] = useState({ property_name: "", address: "" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((currentData) => ({ ...currentData, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const property = await apiRequest("/api/properties", {
                method: "POST",
                body: JSON.stringify({
                    property_name: formData.property_name.trim(),
                    address: formData.address.trim()
                })
            });
            setFormData({ property_name: "", address: "" });
            onCreated(property);
            onClose();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal property-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-heading">
                    <div>
                        <p className="modal-eyebrow">Property details</p>
                        <h2>Add Property</h2>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <form className="property-form" onSubmit={handleSubmit}>
                    <label htmlFor="property-name">Property name</label>
                    <input
                        id="property-name"
                        type="text"
                        name="property_name"
                        placeholder="e.g. Maple Court"
                        value={formData.property_name}
                        onChange={handleChange}
                        required
                        autoFocus
                    />

                    <label htmlFor="property-address">Address</label>
                    <textarea
                        id="property-address"
                        name="address"
                        placeholder="Enter the property's full address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        required
                    />

                    {error && <p className="form-error" role="alert">{error}</p>}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                        <button type="submit" className="confirm-btn" disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Property"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PropertyModal;

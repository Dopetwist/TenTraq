import { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

const initialData = {
    document_title: "",
    document: null
}

function DocumentModal({ isOpen, onClose, tenantId }) {
    const [formData, setFormData] = useState(initialData);
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

        const payload = new FormData(); // Create a FormData object to handle file upload
        payload.append("tenant_id", tenantId); // Append tenant ID to FormData

        // Append form data to FormData object
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== "") {
            payload.append(key, value);
            }
        });

        try {
            // Send POST request to backend API to add document
            const token = localStorage.getItem("tentraq-token");
            await axios.post("http://localhost:5000/api/documents/upload", payload, {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                    "Content-Type": "multipart/form-data" // Set content type for file upload
                }
            });

            setFormData(initialData);
            onClose();
        } catch (requestError) {
            setError("Something went wrong. Please try again!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => {onClose(); setFormData(initialData); setError("");}}>
            <div className="modal document-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-heading">
                    <div>
                        <p className="modal-eyebrow">Document details</p>
                        <h2>Add Document</h2>
                    </div>
                    <button 
                    type="button" 
                    className="modal-close-btn" 
                    onClick={() => {
                        onClose();
                        setFormData(initialData);
                        setError("");
                    }} 
                    aria-label="Close modal"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <form className="document-form" onSubmit={handleSubmit}>
                    <div className="document-box">
                        <div className="title-box">
                            <input 
                                type="text" 
                                id="upload-title" 
                                name="document_title" 
                                placeholder="Enter document title"
                                value={formData.document_title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <input 
                            type="file" 
                            id="upload-doc" 
                            name="document" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    document: e.target.files[0]
                                }))
                            } 
                        />
                    </div>

                    {error && <p className="form-error" role="alert">{error}</p>}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                        <button type="submit" className="confirm-btn" disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Document"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DocumentModal;
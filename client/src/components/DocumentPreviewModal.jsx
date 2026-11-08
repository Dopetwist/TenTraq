import { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../services/api.js";

function getDocumentExtension(documentUrl, documentTitle) {
    const titleExtension = documentTitle?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    if (titleExtension) return titleExtension;

    try {
        return new URL(documentUrl).pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || "";
    } catch {
        return "";
    }
}

function DocumentPreviewModal({ isOpen, previewDocument, onClose }) {
    const [documentUrl, setDocumentUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen || !previewDocument?.id) return undefined;

        const controller = new AbortController();
        const fetchDocument = async () => {
            setIsLoading(true);
            setDocumentUrl("");
            setError("");

            try {
                const token = localStorage.getItem("tentraq-token");
                const response = await axios.get(`${API_BASE_URL}/api/documents/${previewDocument.id}/view`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    signal: controller.signal
                });

                if (!response.data?.url) {
                    throw new Error("The document preview is unavailable.");
                }

                setDocumentUrl(response.data.url);
            } catch (requestError) {
                if (!axios.isCancel(requestError)) {
                    setError(requestError.response?.data?.error || requestError.message || "Unable to load document preview.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchDocument();
        return () => controller.abort();
    }, [previewDocument?.id, isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        const previousOverflow = window.document.body.style.overflow;
        window.document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const extension = getDocumentExtension(documentUrl, previewDocument?.document_title);
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
    const isPdf = extension === "pdf";
    const isPreviewable = isImage || isPdf;

    return (
        <div className="modal-overlay document-preview-overlay" onClick={onClose}>
            <div
                className="modal document-preview-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="document-preview-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="modal-heading">
                    <div>
                        <p className="modal-eyebrow">Document preview</p>
                        <h2 id="document-preview-title">{previewDocument?.document_title || "Uploaded document"}</h2>
                    </div>
                    <button
                        type="button"
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Close document preview"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="document-preview-content" aria-live="polite">
                    {isLoading && <p className="document-preview-message">Loading document preview...</p>}
                    {!isLoading && error && <p className="document-preview-message form-error" role="alert">{error}</p>}
                    {!isLoading && !error && documentUrl && isImage && (
                        <img
                            className="document-preview-image"
                            src={documentUrl}
                            alt={previewDocument?.document_title || "Uploaded document"}
                            onError={() => setError("Unable to display this image preview.")}
                        />
                    )}
                    {!isLoading && !error && documentUrl && isPdf && (
                        <iframe
                            className="document-preview-frame"
                            src={documentUrl}
                            title={`Preview of ${previewDocument?.document_title || "uploaded document"}`}
                        />
                    )}
                    {!isLoading && !error && documentUrl && !isPreviewable && (
                        <div className="document-preview-message">
                            <p>This file type cannot be previewed in the browser.</p>
                            <a className="confirm-btn document-preview-download" href={documentUrl} download>
                                Download document
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DocumentPreviewModal;

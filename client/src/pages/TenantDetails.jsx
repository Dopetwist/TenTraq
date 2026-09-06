import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import axios from "axios";
import Modal from "../components/Modal";
import DocumentModal from "../components/DocumentModal";

function TenantDetails() {
    const { id } = useParams();

    const [ tenant, setTenant ] = useState(null);
    const [ tenantDocs, setTenantDocs ] = useState(null);
    const [ showModal, setShowModal ] = useState(false);
    const [ showDocumentModal, setShowDocumentModal ] = useState(false);
    const [ documentDelete, setDocumentDelete ] = useState(false);
    const [ selectedTenantId, setSelectedTenantId ] = useState(null);
    const [ selectedDocumentId, setSelectedDocumentId ] = useState(null);
    const [ isDeleting, setIsDeleting ] = useState(false);

    const navigate = useNavigate();

    const message = documentDelete ? "Are you sure you want to delete this document?" : "Are you sure you want to delete this tenant?";
    const title = documentDelete ? "Delete Document" : "Delete Tenant";

    const handleEdit = () => {
        navigate(`/tenants/edit/${id}`, { state: tenant });
    };

    const formatDate = (date) => {
        return new Date(date)
            .toLocaleDateString("en-US", { 
                year: "numeric",
                month: "long",
                day: "numeric" 
            });
    };

    const resetDocumentDelete = () => {
        if (documentDelete) {
            setDocumentDelete(false);
        }
    };

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/tenants/${id}`);
                setTenant(response.data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchTenant();
    }, [id]);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/documents/${id}`);
            setTenantDocs(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [id]);

    if (!tenant) return <p className="ten-details-loading">Loading...</p>;

    // Map currency code to symbol
    const currencyMap = {
        NGN: "₦",
        USD: "$",
        EUR: "€",
        GBP: "£"
    };

    // Get symbol for tenant's currency, fallback to code if symbol not found
    const symbol = currencyMap[tenant.currency] || tenant.currency;

    // Delete tenant from database
    const handleDelete = async () => {
        try {
            setIsDeleting(true);

            await axios.delete(`http://localhost:5000/api/tenants/${selectedTenantId}`);

            navigate("/properties");

            setShowModal(false);
            setSelectedTenantId(null);
        } catch (error) {
            console.error("Error deleting tenant:", error.response?.data || error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // Delete document from database
    const handleDocumentDelete = async () => {
        try {
            setIsDeleting(true);

            await axios.delete(`http://localhost:5000/api/documents/delete/${selectedDocumentId}`);

            setShowModal(false);
            fetchDocuments();
            setSelectedDocumentId(null);
        } catch (error) {
            console.error("Error deleting document:", error.response?.data || error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div id="details-container">
            <h2>Tenant Details</h2>

            <div className="info-section">
                <div className="name-btns">
                    <h1 className="name">{tenant.full_name}</h1>

                    <div className="details-btns">
                        <button 
                        className="edit-btn" 
                        onClick={handleEdit}
                        >
                            Edit Tenant
                        </button>
                        <button className="send-email">Send Email</button>
                        <button 
                        className="delete-btn"
                        onClick={() => {
                            setSelectedTenantId(id);
                            setShowModal(true);
                        }}
                        >
                            Delete Tenant
                        </button>
                    </div>
                </div>

                <p><strong>Property:</strong> <span>{tenant.property_name}</span></p>
                <p><strong>Room:</strong> <span>{tenant.room_number}</span></p>
                <p><strong>Email:</strong> <span>{tenant.email}</span></p>
                <p><strong>Phone:</strong> <span>{tenant.phone}</span></p>
                <p><strong>Rent:</strong> <span>{tenant.rent_amount ? symbol : ""}{tenant.rent_amount}</span></p>
                <p><strong>Status:</strong> <span className={`status ${tenant.status}`}>{tenant.status}</span></p>
                <p><strong>Lease Start Date:</strong> <span>{formatDate(tenant.lease_start_date)}</span></p>
                <p><strong>Lease End Date:</strong> <span>{formatDate(tenant.lease_end_date)}</span></p>
            </div>

            <div className="document-section">
                <div className="uploaded">
                    <div className="upload-header-container">
                        <p className="docs-header"> Uploaded Documents: </p>

                        <button
                        className="add-doc-btn"
                        type="submit"
                        onClick={() => setShowDocumentModal(true)}
                        >
                            <Plus size={18} />
                            Add Document
                        </button>
                    </div>

                    <div className="documents-list">
                        {tenantDocs && tenantDocs.length > 0 ? (
                            tenantDocs.map((doc) => (
                                <div key={doc.id} className="document-item">
                                    <div className="single-doc">
                                        <p>{doc.document_title}</p>
                                        <div className="document-action-btns">
                                            <button 
                                            className="document-view-btn" 
                                            onClick={() => window.open(doc.document_url, "_blank")}
                                            >
                                                View Document
                                            </button>

                                            <button
                                            className="document-delete-btn"
                                            title="Delete Document"
                                            onClick={() => {
                                                setShowModal(true);
                                                setDocumentDelete(true);
                                                setSelectedDocumentId(doc.id);
                                            }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No documents uploaded.</p>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showModal}
                title={title}
                message={message}
                onConfirm={documentDelete ? handleDocumentDelete : handleDelete}
                onCancel={() => {
                    setShowModal(false);
                    resetDocumentDelete();
                }}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
            />

            <DocumentModal
                isOpen={showDocumentModal}
                tenantId={id}
                onCreated={fetchDocuments}
                onClose={() => setShowDocumentModal(false)}
            />
        </div>
    )
}

export default TenantDetails;
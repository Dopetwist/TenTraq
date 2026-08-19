import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import axios from "axios";
import Modal from "../components/Modal";

function TenantDetails() {
    const { id } = useParams();

    const [tenant, setTenant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState(null);
    const [ isDeleting, setIsDeleting ] = useState(false);

    const navigate = useNavigate();

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
        setIsDeleting(true);

        try {
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
                <p><strong>Move-in Date:</strong> <span>{formatDate(tenant.move_in_date)}</span></p>
                <p><strong>Lease End:</strong> <span>{formatDate(tenant.lease_end)}</span></p>
            </div>

            <div className="document-section">
                <div className="uploaded">
                    <p className="docs-header"> Uploaded Documents </p>

                    <p>- ID Card</p>
                    <p>- Lease Agreement</p>
                    <p>- Payment Receipt</p>
                </div>
            </div>

            <Modal
                isOpen={showModal}
                title="Delete Tenant"
                message="Are you sure you want to delete this tenant?"
                onConfirm={handleDelete}
                onCancel={() => setShowModal(false)}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
            />
        </div>
    )
}

export default TenantDetails;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import Modal from "./Modal";

function PropertyAccordion() {

    const [ expandedProperty, setExpandedProperty ] = useState(null);
    const [ properties, setProperties ] = useState([]);
    const [ tenants, setTenants ] = useState([]);
    const [ showModal, setShowModal ] = useState(false);
    const [ selectedTenantId, setSelectedTenantId ] = useState(null);
    const [ isDeleting, setIsDeleting ] = useState(false);

    const navigate = useNavigate();

    /* const landlordId = localStorage.getItem("tentraq-user") ? JSON.parse(localStorage.getItem("tentraq-user")).id : null; */

    const toggleProperty = (propertyId) => {
        if (expandedProperty === propertyId) {
            setExpandedProperty(null);
        } else {
            setExpandedProperty(propertyId);
        }
    };

    // Fetch All properties from backend database
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/properties");
                setProperties(res.data);
            } catch (error) {
                console.error(error.message);
            }
        }

        fetchProperties();
    }, []);

    // Fetch All tenants from backend database
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/tenants");
                setTenants(res.data);
            } catch (error) {
                console.error("Error fetching tenants:", error);
            }
        };

        fetchTenants();
    }, []);

    // Delete tenant from database
    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            await axios.delete(`http://localhost:5000/api/tenants/${selectedTenantId}`);

            // Remove from UI immediately
            setTenants((prev) => 
                prev.filter((tenant) => tenant.id !== selectedTenantId)
            );

            setShowModal(false);
            setSelectedTenantId(null);
        } catch (error) {
            console.error("Error deleting tenant:", error.response?.data || error.message);
        } finally {
            setIsDeleting(false);
        }
    };


    return (
        <div id="property-container">

            {properties.length > 0 && (
                <p className="your-props">Your Properties</p>
            )}

            {properties.length === 0 ? (
                <p className="loading">Loading properties...</p>
            ) : (
                    properties.map(property => (
                        <div key={property.id} className="property-item">
                            <h3 onClick={() => toggleProperty(property.id)}>
                                {property.property_name}
                            </h3>

                            {expandedProperty === property.id && (
                                <div>
                                    {tenants
                                        .filter(t => t.property_id === property.id)
                                        .map(tenant => (
                                            <div key={tenant.id} className="tenant-item">
                                                <div className="tenant-name">
                                                    <p>{tenant.full_name}</p>
                                                    <p className="phone">{tenant.phone}</p>
                                                </div>

                                                <div className="action-btns">
                                                    <button 
                                                    className="view-btn"
                                                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                                                    >
                                                        View Details
                                                    </button>
                                                    <button 
                                                    className="delete-btn"
                                                    onClick={() => {
                                                        setSelectedTenantId(tenant.id);
                                                        setShowModal(true);
                                                    }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    ))
            )}

            <Modal
                isOpen={showModal}
                title="Delete Tenant"
                message="Are you sure you want to delete this tenant? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setShowModal(false)}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
            />
            
        </div>
    )
}

export default PropertyAccordion;
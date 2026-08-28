import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";
import axios from "axios";
import Modal from "./Modal";
import PropertyModal from "./PropertyModal";

function PropertyAccordion() {

    const [ expandedProperty, setExpandedProperty ] = useState(null);
    const [ properties, setProperties ] = useState([]);
    const [ tenants, setTenants ] = useState([]);
    const [ showModal, setShowModal ] = useState(false);
    const [ showPropertyModal, setShowPropertyModal ] = useState(false);
    const [ selectedTenantId, setSelectedTenantId ] = useState(null);
    const [ isDeleting, setIsDeleting ] = useState(false);

    const { user } = useAuth();

    const navigate = useNavigate();

    const location = useLocation();

    // Toggle the expanded state of a property
    const toggleProperty = (propertyId) => {
        if (expandedProperty === propertyId) {
            setExpandedProperty(null);
        } else {
            setExpandedProperty(propertyId);
        }
    };

    const landlordId = user ? user.id : null; // Get landlord ID from user context

    // Fetch user properties from backend database
    const fetchProperties = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/properties");

                const filteredProperties = res.data.filter(property => property.landlord_id === landlordId);
                setProperties(filteredProperties);
            } catch (error) {
                console.error("Error fetching properties:", error.message);
            }
    };

    useEffect(() => {
        fetchProperties();
    }, [landlordId]);
    

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

            <div className="property-header">
                {properties.length > 0 && (
                    <p className="your-props">Your Properties</p>
                )}

                {location.pathname === "/properties" && (
                    <button 
                    className="add-property-btn" 
                    onClick={() => setShowPropertyModal(true)}
                    >
                        Add Property
                    </button>
                )}
            </div>

            {properties.length === 0 ? (
                <p className="loading">No properties found.</p>
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

                                                <div className={`status ${tenant.status}`}>{tenant.status}</div>

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

            <PropertyModal
                isOpen={showPropertyModal}
                onClose={() => setShowPropertyModal(false)}
                onCreated={fetchProperties}
            />
            
        </div>
    )
}

export default PropertyAccordion;
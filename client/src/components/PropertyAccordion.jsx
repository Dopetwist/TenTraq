import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";
import axios from "axios";
import { ChevronDown, Plus, Trash2, Eye } from "lucide-react";
import Modal from "./Modal";
import PropertyModal from "./PropertyModal";
import Badge from "./UI/Badge.jsx";

function PropertyAccordion() {

    const [ expandedProperty, setExpandedProperty ] = useState(null);
    const [ properties, setProperties ] = useState([]);
    const [ tenants, setTenants ] = useState([]);
    const [ showModal, setShowModal ] = useState(false);
    const [ showPropertyModal, setShowPropertyModal ] = useState(false);
    const [ selectedTenantId, setSelectedTenantId ] = useState(null);
    const [ isDeleting, setIsDeleting ] = useState(false);
    const [ loading, setLoading ] = useState(true);

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

    const landlordId = user ? user.id : null;

    // Fetch user properties from backend database
    const fetchProperties = async () => {
            try {
                setLoading(true);
                const res = await axios.get("http://localhost:5000/api/properties");

                const filteredProperties = res.data.filter(property => property.landlord_id === landlordId);
                setProperties(filteredProperties);
            } catch (error) {
                console.error("Error fetching properties:", error.message);
            } finally {
                setLoading(false);
            }
    };

    useEffect(() => {
        if (landlordId) {
            fetchProperties();
        }
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

    const getStatusBadge = (status) => {
        switch(status) {
            case 'active':
                return <Badge variant="success">{status}</Badge>;
            case 'quitted':
                return <Badge variant="warning">{status}</Badge>;
            case 'packed':
                return <Badge variant="destructive">{status}</Badge>;
            default:
                return <Badge variant="neutral">{status}</Badge>;
        }
    };


    return (
        <div id="property-container">

            <div className="property-header">
                {properties.length > 0 && (
                    <p className="your-props">Your Properties ({properties.length})</p>
                )}

                {location.pathname === "/properties" && (
                    <button 
                    className="add-property-btn" 
                    onClick={() => setShowPropertyModal(true)}
                    >
                        <Plus size={18} />
                        Add Property
                    </button>
                )}
            </div>

            {loading ? (
                <p className="loading">Loading properties...</p>
            ) : properties.length === 0 ? (
                <p className="loading">No properties found. Add your first property to get started.</p>
            ) : (
                    properties.map(property => (
                        <div key={property.id} className="property-item">
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleProperty(property.id)}>
                                <div>
                                    <h3>{property.property_name}</h3>
                                    <p className="text-sm text-[#555] mt-1">{property.property_address || "No address provided"}</p>
                                </div>
                                <ChevronDown 
                                    size={20} 
                                    className={`text-[#555] transition-transform duration-200 ${
                                        expandedProperty === property.id ? 'rotate-180' : ''
                                    }`}
                                />
                            </div>

                            {expandedProperty === property.id && (
                                <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                                    {tenants.filter(t => t.property_id === property.id).length === 0 ? (
                                        <p className="text-sm text-[#555] py-4 text-center">No tenants in this property</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {tenants
                                                .filter(t => t.property_id === property.id)
                                                .map(tenant => (
                                                    <div key={tenant.id} className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] flex items-center justify-between gap-3 flex-wrap">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-[#1E293B]">{tenant.full_name}</p>
                                                            <p className="text-sm text-[#555]">{tenant.email}</p>
                                                            <p className="text-xs text-[#555] mt-1">📞 {tenant.phone}</p>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {getStatusBadge(tenant.status)}
                                                            <button 
                                                                className="p-2 hover:bg-[#e2e8f0] rounded-lg transition-colors text-[#2563EB]"
                                                                onClick={() => navigate(`/tenants/${tenant.id}`)}
                                                                title="View details"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button 
                                                                className="p-2 hover:bg-[#fee2e2] rounded-lg transition-colors text-[#EF4444]"
                                                                onClick={() => {
                                                                    setSelectedTenantId(tenant.id);
                                                                    setShowModal(true);
                                                                }}
                                                                title="Delete tenant"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}
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
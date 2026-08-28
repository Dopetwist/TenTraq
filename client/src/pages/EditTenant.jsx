import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import axios from "axios";
import Toast from "../components/Toast";

function EditTenant() {
    const { id } = useParams();

    const [ properties, setProperties ] = useState([]);
    const [ toast, setToast ] = useState(null); // toast state
    const [ clicked, setClicked ] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const { user } = useAuth();

    const landlordId = user ? user.id : null; // Get landlord ID from user context

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        property: "",
        room: "",
        currency: "NGN",
        rent: "",
        status: "active",
        lease_start_date: "",
        lease_end_date: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Activate 'Please wait...' modal
            setClicked(true);

            await axios.put(`http://localhost:5000/api/tenants/edit/${id}`, formData);

            // Show success toast
            setToast({
                message: "Tenant updated successfully",
                type: "success"
            });

            // Clear form on success
            setFormData({ 
                full_name: "", 
                email: "", 
                phone: "",
                property: "",
                room: "",
                currency: "NGN",
                rent: "",
                status: "active",
                lease_start_date: "",
                lease_end_date: ""
            });

            // Redirect to tenant details page after short delay
            setTimeout(() => {
                navigate(`/tenants/${id}`);
            }, 2000);

        } catch (err) {
            // Deactivate 'Please wait...' modal
            setClicked(false);

            // Show error toast
            setToast({
                message: err.response?.data?.error || "Something went wrong",
                type: "error"
            });
            console.error(err.response?.data || err.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            currency: "NGN",
            [name]: value
        });
    };

    useEffect(() => {
        if (location.state) {
            const tenant = location.state;

            setFormData({
                ...tenant,
                property: tenant.property_id, // Tenant property_id field
                room: tenant.room_number,
                rent: tenant.rent_amount,
                status: tenant.status,
                lease_start_date: tenant.lease_start_date,
                lease_end_date: tenant.lease_end_date
            });
        }
    }, [location.state]);

    // Fetch all properties from backend database and filter by landlord ID
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/properties");
                const filteredProperties = res.data.filter(property => property.landlord_id === landlordId);
                setProperties(filteredProperties);
            } catch (error) {
                console.error(error.message);
            }
        }

        fetchProperties();
    }, []);


    return (
        <div className="edit-container">
            {clicked && (
                <div className="wait">
                    <p>Please wait...</p>
                </div>
            )}

            <h2>Edit Tenant</h2>

            <form onSubmit={handleSubmit} className="edit-form">
                <div className="edit-form-sub">
                    <label> Name: </label>
                    <input 
                    type="text" 
                    name="full_name" 
                    value={formData.full_name} 
                    onChange={handleChange} 
                    />
                </div>
                
                <div className="edit-form-sub">
                    <label>Email:</label>
                    <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    />  
                </div>  
                
                <div className="edit-form-sub">
                    <label>Phone:</label>
                    <input 
                    type="number" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} />
                </div>   
                 
                <div className="edit-form-sub">
                    <label>Property:</label>
                    <select 
                    name="property" 
                    id="properties" 
                    value={formData.property} 
                    onChange={handleChange}
                    >
                        {properties.length === 0 ? (
                            <option value={""} disabled>Loading properties...</option>
                        ) : (
                            properties.map(prop => (
                                <option key={prop.id} value={prop.id}>
                                    {prop.property_name}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                    
                <div className="edit-form-sub">
                    <label>Room:</label>
                    <input
                    name="room" 
                    value={formData.room} 
                    onChange={handleChange} />    
                </div>
                
                <div className="edit-form-sub">
                    <label>Rent:</label>
                    <div className="rent-con">
                        <select
                        name="currency" 
                        id="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        >
                            <option value={"USD"}>$</option>
                            <option value={"EUR"}>€</option>
                            <option value={"GBP"}>£</option>
                            <option value={"NGN"}>₦</option>
                        </select>
                        <input 
                        type="number" 
                        name="rent" 
                        value={formData.rent} 
                        onChange={handleChange} />
                    </div>
                </div>

                <div className="edit-form-sub">
                    <label>Status:</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="active">Active</option>
                        <option value="packed">Packed</option>
                        <option value="quitted">Quitted</option>
                    </select>
                </div>

                <div className="edit-form-sub">
                    <label>Lease Start Date:</label>
                    <input 
                    type="date" 
                    name="lease_start_date" 
                    value={formData.lease_start_date} 
                    onChange={handleChange} />
                </div>
                    
                <div className="edit-form-sub">
                    <label>Lease End Date:</label>
                    <input 
                    type="date" 
                    name="lease_end_date" 
                    value={formData.lease_end_date} 
                    onChange={handleChange} />
                </div>

                <div className="edit-form-btns">
                    <button 
                    type="submit" 
                    id="saveButton"
                    >
                        Save
                    </button>

                    <button 
                    type="button"
                    id="cancelButton"
                    onClick={() => navigate(`/tenants/${id}`)}
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* Render Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}

export default EditTenant;
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import axios from "axios";
import { API_BASE_URL } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { formatRentInput, sanitizeRentInput } from "../utils/formatCurrency.js";
import { REMINDER_OPTIONS } from "../constants/reminderOptions.js";

function EditTenant() {
    const { id } = useParams();

    const [ properties, setProperties ] = useState([]);
    const [ clicked, setClicked ] = useState(false);
    const [ isTenantLoading, setIsTenantLoading ] = useState(true);
    const [ loadError, setLoadError ] = useState("");

    const navigate = useNavigate();

    const { user } = useAuth();
    const { showToast } = useToast();

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
        lease_end_date: "",
        reminder_durations: []
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Activate 'Please wait...' modal
            setClicked(true);

            await axios.put(`${API_BASE_URL}/api/tenants/edit/${id}`, formData);

            showToast("Tenant updated successfully.");

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
                lease_end_date: "",
                reminder_durations: []
            });

            // Redirect to tenant details page after short delay
            setTimeout(() => {
                navigate(`/tenants/${id}`);
            }, 2000);

        } catch (err) {
            // Deactivate 'Please wait...' modal
            setClicked(false);

            showToast(err.response?.data?.error || "Something went wrong", "error");
            console.error(err.response?.data || err.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: name === "rent" ? sanitizeRentInput(value) : value
        });
    };

    const handleReminderChange = (e) => {
        const { checked, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            reminder_durations: checked
                ? [...previous.reminder_durations, value]
                : previous.reminder_durations.filter((duration) => duration !== value)
        }));
    };

    useEffect(() => {
        let isCurrent = true;

        const fetchTenant = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/tenants/${id}`);
                const tenant = response.data;

                if (!isCurrent) return;

                setFormData({
                    ...tenant,
                    property: tenant.property_id,
                    room: tenant.room_number,
                    rent: tenant.rent_amount,
                    status: tenant.status,
                    lease_start_date: tenant.lease_start_date,
                    lease_end_date: tenant.lease_end_date,
                    reminder_durations: tenant.reminder_durations || []
                });
            } catch (error) {
                console.error(error.response?.data || error.message);
                if (isCurrent) {
                    setLoadError("Unable to load tenant details.");
                }
            } finally {
                if (isCurrent) {
                    setIsTenantLoading(false);
                }
            }
        };

        fetchTenant();

        return () => {
            isCurrent = false;
        };
    }, [id]);

    // Fetch all properties from backend database and filter by landlord ID
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/properties`);
                const filteredProperties = res.data.filter(property => property.landlord_id === landlordId);
                setProperties(filteredProperties);
            } catch (error) {
                console.error(error.message);
            }
        }

        fetchProperties();
    }, [landlordId]);

    if (isTenantLoading) {
        return <p className="ten-details-loading">Loading tenant...</p>;
    }

    if (loadError) {
        return (
            <div className="edit-container">
                <p className="form-error" role="alert">{loadError}</p>
                <button type="button" onClick={() => navigate(`/tenants/${id}`)}>Back to tenant</button>
            </div>
        );
    }

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
                        type="text"
                        inputMode="decimal"
                        name="rent" 
                        value={formatRentInput(formData.rent)} 
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

                <fieldset className="reminder-options">
                    <legend>Rent reminders</legend>
                    <p>Choose when to remind this tenant before their lease ends.</p>
                    <div className="reminder-options-list">
                        {REMINDER_OPTIONS.map((duration) => (
                            <label className="reminder-option" key={duration}>
                                <input
                                    type="checkbox"
                                    name="reminder_durations"
                                    value={duration}
                                    checked={formData.reminder_durations.includes(duration)}
                                    onChange={handleReminderChange}
                                />
                                {duration}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="edit-form-btns">
                    <button 
                    type="button"
                    id="cancelButton"
                    onClick={() => navigate(`/tenants/${id}`)}
                    >
                        Cancel
                    </button>

                    <button 
                    type="submit" 
                    id="saveButton"
                    >
                        Save
                    </button>
                </div>
            </form>

        </div>
    )
}

export default EditTenant;
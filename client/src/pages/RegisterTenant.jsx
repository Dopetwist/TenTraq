import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import Toast from "../components/Toast";

function RegisterTenant() {
    const [ properties, setProperties ] = useState([]);

    const navigate = useNavigate();

    const [ formData, setFormData ] = useState({
        full_name: "",
        email: "",
        phone: "",
        property: "",
        room: "",
        currency: "NGN",
        rent: "",
        lease_start_date: "",
        lease_end_date: ""
    });

    const [ toast, setToast ] = useState(null); // toast state

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post("http://localhost:5000/api/tenants", formData);

            // Show success toast
            setToast({
                message: "Tenant registered successfully!",
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
                lease_start_date: "",
                lease_end_date: ""
            });

            // Redirect to tenant details page after short delay
            setTimeout(() => {
                navigate(`/tenants/${res.data.id}`);
            }, 2000);

        } catch (err) {
            // Show error toast
            setToast({
                message: err.response?.data?.error || "Something went wrong",
                type: "error"
            });
            console.error(err.response?.data || err.message);
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

    return (
        <div id="register-section">
            <h2> Register Tenant </h2>

            <div className="register-container">
                <form onSubmit={handleSubmit} className="register-form">

                    <label htmlFor="full-name">Full Name:</label>
                    <input 
                        type="text" 
                        name="full_name" 
                        id="full-name" 
                        placeholder="Enter full name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="email">Email:</label>
                    <input 
                        type="email" 
                        name="email" 
                        id="email" 
                        placeholder="Enter a valid email address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="phone-number">Phone Number:</label>
                    <input 
                        type="number" 
                        name="phone" 
                        id="phone-number" 
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="properties">Choose a property: </label>
                    <select 
                    name="property" 
                    id="properties"
                    value={formData.property}
                    onChange={handleChange}
                    required
                    >
                        <option value={""}>-- Select Property --</option>
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

                    <div className="inner-div">
                        <div className="small-input">
                            <label htmlFor="room-number">Room Number:</label>
                            <input 
                                name="room" 
                                id="room-number" 
                                placeholder="Enter room number"
                                value={formData.room}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="small-input">
                            <label htmlFor="rent-amount">Rent Amount:</label>
                            <div className="amount-con">
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
                                    id="rent-amount" 
                                    placeholder="Enter rent amount"
                                    value={formData.rent}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="small-input">
                            <label htmlFor="lease-start">Lease Start Date:</label>
                            <input 
                                type="date" 
                                name="lease_start_date" 
                                id="lease-start"
                                value={formData.lease_start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="small-input">
                            <label htmlFor="lease-end">Lease End Date:</label>
                            <input 
                                type="date" 
                                name="lease_end_date" 
                                id="lease-end"
                                value={formData.lease_end_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <label htmlFor="upload-doc">Upload Document:</label>
                    <input type="file" id="upload-doc" />

                    <div className="register-btns">
                        <button 
                        type="submit" 
                        id="save"
                        >
                            Save Tenant
                        </button>
                        <button 
                        id="cancel"
                        onClick={() => navigate("/dashboard")}
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
        </div>
    )
}

export default RegisterTenant;
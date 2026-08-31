import { Link } from "react-router";
import { Search, UserPlus, Mail } from "lucide-react";
import PropertyAccordion from "../components/PropertyAccordion";
import Button from "../components/UI/Button.jsx";

function Tenants() {
    return (
        <div className="tenants">
            <h2>All Tenants</h2>

            <div className="search-con">
                <div className="search-icon">
                    <Search size={20} color="#555" />
                </div>
                <input 
                    type="text" 
                    name="search" 
                    id="search" 
                    placeholder="Search tenant by name or email..." 
                />
            </div>

            <div className="tenants-btns">
                <Link to="/register">
                    <Button variant="success" size="md">
                        <UserPlus size={18} />
                        Register Tenant
                    </Button>
                </Link>
                <Link to="/emails">
                    <Button variant="primary" size="md">
                        <Mail size={18} />
                        Send Email
                    </Button>
                </Link>
            </div>

            <PropertyAccordion />
        </div>
    )
}

export default Tenants;
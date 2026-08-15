import { Link } from "react-router";
import { Search } from "lucide-react";
import PropertyAccordion from "../components/PropertyAccordion";

function Tenants() {
    return (
        <div className="tenants">
            <h2>All Tenants</h2>

            <div className="search-con">
                <div className="search-icon">
                    <Search size={20} />
                </div>
                <input type="text" name="search" id="search" placeholder="Search tenant..." />
            </div>
            <div className="tenants-btns">
                <Link to="/register">
                    <button id="reg-tenant">Register Tenant</button>
                </Link>
                <Link to="/emails">
                    <button className="send-email">Send Email</button>
                </Link>
            </div>

            <PropertyAccordion />
        </div>
    )
}

export default Tenants;
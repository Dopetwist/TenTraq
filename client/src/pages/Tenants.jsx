import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, UserPlus, Mail } from "lucide-react";
import axios from "axios";
import PropertyAccordion from "../components/PropertyAccordion";
import Button from "../components/UI/Button.jsx";

function Tenants() {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchError, setSearchError] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const trimmedSearchTerm = searchTerm.trim();

        if (!trimmedSearchTerm) {
            setSearchResults([]);
            setSearchError("");
            setIsSearching(false);
            return undefined;
        }

        const searchTimeout = setTimeout(async () => {
            setIsSearching(true);
            setSearchError("");

            try {
                const response = await axios.get("http://localhost:5000/api/tenants/search", {
                    params: { q: trimmedSearchTerm }
                });

                setSearchResults(response.data);

                if (response.data.length === 0) {
                    setSearchError("No tenant found.");
                }
            } catch (error) {
                setSearchResults([]);
                setSearchError(error.response?.data?.error || "Unable to search tenants.");
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [searchTerm]);

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
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search tenant by name or email..." 
                />

                {searchTerm.trim() && (
                    <div className="tenant-search-results" role="status">
                        {isSearching ? (
                            <p className="tenant-search-message">Searching...</p>
                        ) : searchError ? (
                            <p className="tenant-search-message error">{searchError}</p>
                        ) : (
                            searchResults.map((tenant) => (
                                <Link
                                    key={tenant.id}
                                    to={`/tenants/${tenant.id}`}
                                    className="tenant-search-result"
                                    onClick={() => setSearchTerm("")}
                                >
                                    <strong>{tenant.full_name}</strong>
                                    <span>{tenant.email}</span>
                                </Link>
                            ))
                        )}
                    </div>
                )}
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
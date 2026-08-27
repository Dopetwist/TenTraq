import { BookText, House, FileUp, Mail, Search } from "lucide-react";

function SolutionSection() {
    return (
        <div id="solution-section">
            <h1>One Dashboard For Everything</h1>

            <div className="solution-section-cards">
                <div className="card1 solution-card">
                    <span><BookText size={34} /></span>
                    <h2 className="title">Tenant Registry</h2>

                    <p>Store tenants records in one place</p>
                </div>
                <div className="card2 solution-card">
                    <span><House size={34} /></span>
                    <h2 className="title">Property Grouping</h2>
                    
                    <p>Organize tenants by property</p>
                </div>
                <div className="card3 solution-card">
                    <span><FileUp size={34} /></span>
                    <h2 className="title">Document Upload</h2>

                    <p>Save tenants documents and IDs</p>
                </div>
                <div className="card4 solution-card">
                    <span><Mail size={34} /></span>
                    <h2 className="title">Email Tenants</h2>

                    <p>Send email to one tenant or all</p>
                </div>
                <div className="card5 solution-card">
                    <span><Search size={34} /></span>
                    <h2 className="title">Smart Search</h2>

                    <p>Find tenants instantly</p>
                </div>
            </div>
        </div>
    )
}

export default SolutionSection;
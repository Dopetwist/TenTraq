import { Users, Building2, FileUp, Mail, Search } from "lucide-react";

function SolutionSection() {
    const features = [
        {
            icon: Users,
            title: "Tenant Registry",
            description: "Store and manage all tenant records in one secure place"
        },
        {
            icon: Building2,
            title: "Property Grouping",
            description: "Organize tenants by property for better management"
        },
        {
            icon: FileUp,
            title: "Document Upload",
            description: "Save tenant documents, IDs, and agreements"
        },
        {
            icon: Mail,
            title: "Email Tenants",
            description: "Send emails to individual tenants or all at once"
        },
        {
            icon: Search,
            title: "Smart Search",
            description: "Find any tenant or document in seconds"
        }
    ];

    return (
        <div id="solution-section">
            <h1>One Dashboard For Everything</h1>
            <p>Powerful features to streamline tenant management</p>

            <div className="solution-section-cards">
                {features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                        <div key={idx} className="solution-card">
                            <div className="solution-icon">
                                <Icon size={32} />
                            </div>
                            <h3 className="title">{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default SolutionSection;
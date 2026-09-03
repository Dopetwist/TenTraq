import { FileX, FileText, Mail } from "lucide-react";

function ProblemSection() {
    const problems = [
        {
            icon: FileX,
            title: "Lost Tenant Records",
            description: "Tenant information scattered across notebooks and spreadsheets"
        },
        {
            icon: FileText,
            title: "Document Confusion",
            description: "Hard to track tenant agreements, IDs and uploaded files"
        },
        {
            icon: Mail,
            title: "Communication Problems",
            description: "Sending messages to tenants manually wastes time"
        }
    ];

    return (
        <div id="problem-section">
            <h1>Still Managing Tenants With Spreadsheets?</h1>
            <p>The traditional way of managing tenants is inefficient and error-prone</p>

            <div className="problem-section-cards">
                {problems.map((problem, idx) => {
                    const Icon = problem.icon;
                    return (
                        <div key={idx} className="problem-card">
                            <div className="problem-icon">
                                <Icon size={32} />
                            </div>
                            <h3 className="title">{problem.title}</h3>
                            <p className="problem-card-text">{problem.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default ProblemSection;
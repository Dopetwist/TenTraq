import { useEffect } from "react";
import { FileX, FileText, Mail } from "lucide-react";
import { revealCards } from "../utils/reveal";

function ProblemSection() {

    useEffect(() => {
        revealCards(".problem-card");
    }, []);

    const problems = [
        {
            icon: FileX,
            title: "Lost Tenant Records",
            description: "Tenant information scattered across notebooks and spreadsheets",
            image: "/images/lost-tenant-records.png"
        },
        {
            icon: FileText,
            title: "Document Confusion",
            description: "Hard to track tenant agreements, IDs and uploaded files",
            image: "/images/document-confusion.png"
        },
        {
            icon: Mail,
            title: "Communication Problems",
            description: "Sending messages to tenants manually wastes time",
            image: "/images/communication-problems.png"
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
                            <img src={problem.image} alt={problem.title} className="problem-image" />
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
import { UserPlus, BookOpen, Mail } from "lucide-react";

function HowItWorks() {
    const steps = [
        {
            number: 1,
            icon: UserPlus,
            title: "Register & Add",
            description: "Add tenant details including property, rent info and documents"
        },
        {
            number: 2,
            icon: BookOpen,
            title: "Manage Records",
            description: "View, update and organize tenants by property"
        },
        {
            number: 3,
            icon: Mail,
            title: "Communicate",
            description: "Send emails to tenants individually or in bulk"
        }
    ];

    return (
        <div id="how-section">
            <h2>How It Works</h2>
            <p>Three simple steps to better tenant management</p>

            <div className="how-container">
                {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.number} className="how-box">
                            <div className="icon-box">
                                <Icon size={32} />
                            </div>
                            <h3 className="step-number">Step {step.number}</h3>
                            <h4 className="step-title">{step.title}</h4>
                            <p className="step-description">{step.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default HowItWorks;
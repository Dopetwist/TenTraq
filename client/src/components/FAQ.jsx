import { useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";

const faqs = [
    {
        question: "How does TenTraq simplify tenant management for landlords and property managers?",
        answer:
            "TenTraq centralizes tenant records, property information, documents, communication, and follow-ups in a single platform. This reduces manual admin work, helps you stay organized, and allows you to manage every tenancy more efficiently from one dashboard."
    },
    {
        question: "Can I organize tenants by property or unit?",
        answer:
            "Yes. The system is designed to group tenants by property, making it easy to track occupancy, manage rooms or units, and review tenant information in context. This gives you a clear overview of each property without having to sort through disconnected records."
    },
    {
        question: "Is it possible to store tenant documents and agreements in one place?",
        answer:
            "Absolutely. TenTraq allows you to upload and store key tenant documents such as IDs, lease agreements, and supporting paperwork. Keeping documents centralized improves compliance, reduces lost files, and makes reference and renewals much easier."
    },
    {
        question: "Can I send updates and reminders to tenants directly from the platform?",
        answer:
            "Yes. The platform supports direct communication with individual tenants or groups, which is ideal for rent reminders, maintenance updates, and important notices. This keeps communication consistent and helps you maintain a professional landlord-tenant relationship."
    },
    {
        question: "How does the system help with rent tracking and follow-ups?",
        answer:
            "By keeping tenant records and payment-related details in one place, TenTraq makes it easier to monitor payment status, track outstanding balances, and follow up on renewals or missed payments on time. This improves cash flow visibility and reduces the risk of missed communications."
    },
    {
        question: "Is TenTraq suitable for both small landlords and larger property portfolios?",
        answer:
            "Yes. The platform is built to support efficient management whether you oversee a single rental property or a larger portfolio. Its structure helps streamline routine tasks while remaining flexible enough for growing property operations."
    }
];

function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);

    const toggleItem = (index) => {
        setOpenIndex((currentIndex) => (currentIndex === index ? -1 : index));
    };

    return (
        <section id="faq-section">
            <div className="faq-header">
                <span className="faq-kicker">Frequently asked questions</span>
                <h2>Everything you need to know about modern tenant management.</h2>
                <p>
                    From record keeping to communication and renewals, TenTraq helps property professionals
                    manage day-to-day operations with clarity and confidence.
                </p>
            </div>

            <div className="faq-list">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;

                    return (
                        <div key={index} className={`faq-item ${isOpen ? "open" : ""}`}>
                            <button
                                type="button"
                                className="faq-question"
                                onClick={() => toggleItem(index)}
                                aria-expanded={isOpen}
                                aria-controls={`faq-answer-${index}`}
                            >
                                <div className="faq-question-content">
                                    <span className="faq-icon">
                                        <CircleHelp size={18} />
                                    </span>
                                    <span>{faq.question}</span>
                                </div>
                                <ChevronDown className={`faq-chevron ${isOpen ? "rotated" : ""}`} size={18} />
                            </button>

                            <div
                                id={`faq-answer-${index}`}
                                className={`faq-answer ${isOpen ? "visible" : ""}`}
                                aria-hidden={!isOpen}
                            >
                                <p>{faq.answer}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default FAQ;

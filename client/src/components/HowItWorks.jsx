import { UserPlus, BookOpen, MessagesSquare } from "lucide-react";

function HowItWorks() {
    return (
        <div id="how-section">
            <h2>How It Works</h2>

            <div className="how-container">
                <div className="how-box">
                    <div className="icon-box">
                        <span><UserPlus size={30} /></span>
                        <h3>Step 1</h3>
                    </div>

                    <p>Register Property and Tenant</p>

                    <p className="sub-paragraph">Add tenant details including property, rent info and documents.</p>
                </div>
                <div className="how-box">
                    <div className="icon-box">
                        <span><BookOpen size={30} /></span>
                        <h3>Step 2</h3>
                    </div>

                    <p>Manage Records</p>

                    <p className="sub-paragraph">View, update and organize tenants by property.</p>
                </div>
                <div className="how-box">
                    <div className="icon-box">
                        <span><MessagesSquare size={30} /></span>
                        <h3>Step 3</h3>
                    </div>

                    <p>Communicate Easily</p>

                    <p className="sub-paragraph">Send emails to tenants individually or in bulk.</p>
                </div>
            </div>
        </div>
    )
}

export default HowItWorks;
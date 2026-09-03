import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

function CallToAction() {
    return (
        <div id="cta">
            <h2>Start Managing Tenants Smarter Today</h2>
            <p>Join landlords and property managers who are saving time and staying organized</p>

            <Link to={"/register-landlord"} className="cta-container">
                <button 
                    className="cta-btn"
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                > 
                    Create Free Account
                    <ArrowRight size={18} />
                </button>
            </Link>
        </div>
    )
}

export default CallToAction;
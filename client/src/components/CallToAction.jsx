import { Link } from "react-router";

function CallToAction() {
    return (
        <div id="cta">
            <h1>Start Managing Tenants Smarter</h1>

            <Link to={"/register-landlord"}>
                <button 
                className="cta-btn"
                onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                > 
                    Create free Account 
                </button>
            </Link>
        </div>
    )
}

export default CallToAction;
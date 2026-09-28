import { Link } from "react-router";

function GetStartedButton() {

    const isMobile = window.innerWidth < 768;

    return (
        <div className={`get-started-button ${isMobile ? 'mobile' : ''}`}>
            <Link to={"/register-landlord"}>
                <button className="get-started">Sign Up</button>
            </Link>
        </div>
    )
}

export default GetStartedButton;
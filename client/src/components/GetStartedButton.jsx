import { Link } from "react-router";

function GetStartedButton() {

    const isMobile = window.innerWidth < 768;
    const smallDevice = window.innerWidth < 480;

    return (
        <div className={`get-started-button ${isMobile ? 'mobile' : ''}`}>
            <Link to={"/register-landlord"}>
                <button className={`get-started ${smallDevice ? "small-device" : ""}`}>Sign Up</button>
            </Link>
        </div>
    )
}

export default GetStartedButton;
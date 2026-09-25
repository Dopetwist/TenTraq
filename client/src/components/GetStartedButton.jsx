import { Link } from "react-router";

function GetStartedButton() {
    return (
        <div>
            <Link to={"/register-landlord"}>
                <button className="get-started">Sign Up</button>
            </Link>
        </div>
    )
}

export default GetStartedButton;
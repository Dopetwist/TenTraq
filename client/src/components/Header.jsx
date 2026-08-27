import { Link } from "react-router";
import Navbar from "./Navbar";

function Header() {
    return (
        <div className="header">
            <div className="app-name">
                <Link to={"/"}>
                    <h1>TenTraq</h1>
                </Link>
            </div>

            <Navbar />

            <div>
                <Link to={"/login"}>
                    <button className="sign-in">Sign in</button>
                </Link>
            </div>
        </div>
    )
}

export default Header;
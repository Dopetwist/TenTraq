import { Link } from "react-router";
import Navbar from "./Navbar";
import GetStartedButton from "../components/GetStartedButton";

function Header() {
    return (
        <div className="header">
            <div className="app-name">
                <Link to={"/"}>
                    <h1>TenTraq</h1>
                </Link>
            </div>

            <Navbar />

            <div className="header-action-btns">
                <Link to={"/login"}>
                    <p className="login">Login</p>
                </Link>
                <GetStartedButton />
            </div>
        </div>
    )
}

export default Header;
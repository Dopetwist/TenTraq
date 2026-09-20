import { Link } from "react-router";
import { HashLink } from "react-router-hash-link";

function Navbar() {
    return (
        <nav id="navbar">
            <HashLink className="nav-link" to="/#solution-section">Features</HashLink>
            <HashLink className="nav-link" to="/#how-section">How it Works</HashLink>
            <HashLink className="nav-link" to="/#faq-section">FAQs</HashLink>
            <Link className="nav-link" to="/about">About</Link>
            <Link className="nav-link" to="/contact">Contact</Link>
        </nav>
    )
}

export default Navbar;
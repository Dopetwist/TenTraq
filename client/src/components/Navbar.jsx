import { HashLink } from "react-router-hash-link";

function Navbar() {
    return (
        <nav id="navbar">
            <HashLink className="nav-link" to="/#solution-section">Features</HashLink>
            <HashLink className="nav-link" to="/#how-section">How it Works</HashLink>
            <HashLink className="nav-link" to="/#faq-section">FAQs</HashLink>
        </nav>
    )
}

export default Navbar;
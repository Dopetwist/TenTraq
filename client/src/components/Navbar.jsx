import { Link } from "react-router";

function Navbar() {
    return (
        <nav id="navbar">
            <Link className="nav-link" to="/features">Features</Link>
            <Link className="nav-link" to="/howitworks">How it Works</Link>
            <Link className="nav-link" to="/faq">FAQs</Link>
        </nav>
    )
}

export default Navbar;
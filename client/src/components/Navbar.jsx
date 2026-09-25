import { Link } from "react-router";
import { HashLink } from "react-router-hash-link";
import GetStartedButton from "./GetStartedButton.jsx";

function Navbar({ isMobileNavOpen, onNavigate }) {

    const isMobile = window.innerWidth <= 768;

    return (
        <nav id="navbar" className={isMobileNavOpen ? "mobile-nav-open" : ""}>
            <HashLink className="nav-link" to="/#solution-section" onClick={onNavigate}>Features</HashLink>
            <HashLink className="nav-link" to="/#how-section" onClick={onNavigate}>How it Works</HashLink>
            <HashLink className="nav-link" to="/#faq-section" onClick={onNavigate}>FAQs</HashLink>
            <Link className="nav-link" to="/about" onClick={onNavigate}>About</Link>
            <Link className="nav-link" to="/contact" onClick={onNavigate}>Contact</Link>

            {isMobile && <GetStartedButton />}
        </nav>
    )
}

export default Navbar;
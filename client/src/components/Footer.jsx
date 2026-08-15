import { Link } from "react-router";

function Footer() {
    return (
        <footer id="footer">
            <h3>Links</h3>

            <Link to={"/about"} className="footer-link">About</Link>
            <Link to={"/contact"} className="footer-link">Contact</Link>
            <Link to={"/privacy"} className="footer-link">Privacy</Link>
            <Link to={"/terms"} className="footer-link">Terms</Link>

            <div className="copyright-container">
                <p className="copyright">
                    &copy; {new Date().getFullYear()} TenTraq. All rights reserved.
                </p>
            </div>
        </footer>
        
    )
}

export default Footer;
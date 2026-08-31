import { Link } from "react-router";

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer id="footer">
            <div className="footer-content">
                <div>
                    <h3>Product</h3>
                    <Link to={"/"} className="footer-link">Features</Link>
                    <Link to={"/"} className="footer-link">Pricing</Link>
                    <Link to={"/"} className="footer-link">Security</Link>
                </div>

                <div>
                    <h3>Company</h3>
                    <Link to={"/"} className="footer-link">About Us</Link>
                    <Link to={"/"} className="footer-link">Blog</Link>
                    <Link to={"/"} className="footer-link">Contact</Link>
                </div>

                <div>
                    <h3>Legal</h3>
                    <Link to={"/"} className="footer-link">Privacy Policy</Link>
                    <Link to={"/"} className="footer-link">Terms of Service</Link>
                    <Link to={"/"} className="footer-link">Cookie Policy</Link>
                </div>

                <div>
                    <h3>TenTraq</h3>
                    <p className="footer-description">
                        Smart property management for modern landlords.
                    </p>
                </div>
            </div>

            <div className="copyright-container">
                <p className="copyright">
                    &copy; {currentYear} TenTraq. All rights reserved.
                </p>
            </div>
        </footer>
        
    )
}

export default Footer;
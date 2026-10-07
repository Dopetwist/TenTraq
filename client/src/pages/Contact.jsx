import { useState } from "react";
import { ArrowRight, Clock3, Mail, MessageSquare } from "lucide-react";
import { Link } from "react-router";
import { apiRequest } from "../services/api.js";
import { useToast } from "../context/ToastContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Contact() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);

    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        topic: "general",
        message: ""
    });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => { 
        event.preventDefault(); 
        setIsSubmitting(true); 

        try {
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());
            
            await apiRequest("/api/contact", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
            });

            setFormSubmitted(true);
            showToast("Your message has been sent. We'll get back to you soon.", "success");
        } catch (error) {
            console.error("Error submitting contact form:", error.message);
            setFormSubmitted(false);
            showToast("Failed to send your message. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="public-page">
            <Header />
            <main className="contact-page">
                <section className="contact-intro">
                    <div>
                        <p className="page-kicker">Contact TenTraq</p>
                        <h1>Let’s make property management feel lighter.</h1>
                        <p className="page-lede">Have a question, an idea, or a problem we can help untangle? Send us a note and our team will get back to you.</p>
                    </div>
                    <div className="contact-response-note">
                        <span>Usually replying within</span><strong>1 business day</strong>
                    </div>
                </section>

                <section className="contact-grid page-section">
                    <div className="contact-details">
                        <h2>We’re here to help.</h2><p>Choose the route that works best for you. We read every message and route it to the right person.</p>
                        <a className="contact-detail" href="mailto:hello@tentraq.com">
                            <span className="contact-icon"><Mail size={19} /></span><span><strong>Email us</strong><small>hello@tentraq.com</small></span>
                        </a>
                        <div className="contact-detail">
                            <span className="contact-icon"><Clock3 size={19} /></span><span><strong>Support hours</strong><small>Monday to Friday, 9am–5pm</small></span>
                        </div>
                        <div className="contact-detail">
                            <span className="contact-icon"><MessageSquare size={19} /></span><span><strong>Product feedback</strong><small>Tell us what would make TenTraq better</small></span>
                        </div>
                        <p className="contact-signoff">Already have an account? <Link to="/login">Sign in to your workspace</Link>.</p>
                    </div>

                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-heading"><p className="page-kicker">Send a message</p><h2>How can we help?</h2></div>
                        {formSubmitted ? 
                            <div className="contact-success" role="status">
                                <div className="success-mark">✓</div><h3>Thanks for reaching out.</h3>
                                <p>Your message is on its way. We’ll be in touch within one business day.</p>
                                <button 
                                type="button" 
                                className="form-reset" 
                                onClick={() => setFormSubmitted(false)}
                                >
                                    Send another message
                                </button>
                            </div> : 
                            <>
                                <div className="contact-form-row">
                                    <label>Full name
                                        <input 
                                            type="text" 
                                            name="name" 
                                            placeholder="Your name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required 
                                        />
                                    </label>
                                    <label>Email address
                                        <input 
                                            type="email" 
                                            name="email" 
                                            placeholder="you@example.com" 
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required 
                                        />
                                    </label>
                                </div>
                                <label>What can we help with?
                                    <select 
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleInputChange}
                                    >
                                        <option value="general">General question</option>
                                        <option value="support">Account support</option>
                                        <option value="feedback">Product feedback</option>
                                        <option value="partnership">Partnership enquiry</option>
                                    </select>
                                </label>
                                <label>Message
                                    <textarea 
                                        name="message" 
                                        placeholder="Tell us a little more..." 
                                        rows="6" 
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                </label>
                                <button 
                                className="form-submit" 
                                type="submit"
                                >
                                    {isSubmitting ? "Sending..." : "Send message"}
                                    <ArrowRight size={17} />
                                </button>
                            </>
                        }
                    </form>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default Contact;
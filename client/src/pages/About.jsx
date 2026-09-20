import { ArrowRight, Check, ClipboardList, HeartHandshake, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";

const principles = [
    { icon: ClipboardList, title: "Clarity over clutter", text: "The right information should be easy to find, understand, and act on." },
    { icon: HeartHandshake, title: "Built for real relationships", text: "Property management is personal. TenTraq helps communication stay thoughtful." },
    { icon: ShieldCheck, title: "Trust by default", text: "Your records deserve a dependable home with privacy and security in mind." }
];

function About() {
    return (
        <div className="public-page">
            <Header />
            <main>
                <section className="about-hero">
                    <div className="about-hero-content">
                        <p className="page-kicker">About TenTraq</p>
                        <h1>More time for people, less time chasing paperwork.</h1>
                        <p className="page-lede">TenTraq gives landlords and property managers one calm, reliable place to keep tenant records, documents, and conversations moving forward.</p>
                        <Link className="page-primary-link" to="/register-landlord">Start managing smarter <ArrowRight size={17} /></Link>
                    </div>
                    <div className="about-hero-note" aria-label="TenTraq mission">
                        <span className="note-line" />
                        <p>Good systems make room for good service.</p>
                        <span className="note-caption">Our guiding idea</span>
                    </div>
                </section>

                <section className="about-story page-section">
                    <div className="section-heading"><p className="page-kicker">Why we exist</p><h2>Property management should feel organized, not overwhelming.</h2></div>
                    <div className="story-copy">
                        <p>We created TenTraq after seeing how much energy gets lost between spreadsheets, inboxes, and scattered files. The work matters, but the tools often make it harder than it needs to be.</p>
                        <p>Our goal is simple: bring the everyday work of managing tenants into a workspace that feels clear, capable, and easy to return to. Less searching. Fewer loose ends. Better experiences for everyone involved.</p>
                    </div>
                </section>

                <section className="about-principles page-section">
                    <div className="section-heading centered-heading"><p className="page-kicker">What guides us</p><h2>Thoughtful software for meaningful work.</h2></div>
                    <div className="principles-grid">
                        {principles.map(({ icon: Icon, title, text }) => (
                            <article 
                            key={title}
                            className="principle-card"
                            >
                                <div className="principle-icon">
                                    <Icon size={21} />
                                </div>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="about-promise">
                    <div>
                        <p className="page-kicker">The TenTraq promise</p>
                        <h2>Make every detail easier to handle.</h2>
                    </div>
                    <ul>
                        <li><Check size={17} /> A clearer view of every tenancy</li>
                        <li><Check size={17} /> Fewer repetitive admin tasks</li>
                        <li><Check size={17} /> More confidence in what happens next</li>
                    </ul>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default About;
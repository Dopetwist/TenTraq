import GetStartedButton from "./GetStartedButton";
import { ArrowRight } from "lucide-react";

function Hero() {
    return (
        <section id="hero">
            <div className="hero-texts">
                <h2 className="hero-heading">
                    Manage <span className="text-[#10B981]">Tenants</span>
                    <br />
                    Without the Chaos
                </h2>
                <p className="hero-description">
                    TenTraq helps landlords and property managers organize tenant records,
                    documents, and communication in one simple, intuitive dashboard.
                </p>

                <div className="hero-btns">
                    <GetStartedButton /> 
                    <button className="view-demo">
                        View Demo
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Hero;
import Header from "../components/Header";
import Hero from "../components/Hero";
import Stats from "../components/Stats";
import Demo from "../components/Demo";
import ProblemSection from "../components/ProblemSection";
import SolutionSection from "../components/SolutionSection";
import HowItWorks from "../components/HowItWorks";
import FAQ from "../components/FAQ";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";

function Landing() {
    return (
        <div>
            <Header />
            <Hero />
            <Stats />
            <Demo />
            <ProblemSection />
            <SolutionSection />
            <HowItWorks />
            <FAQ />
            <CallToAction />
            <Footer />
        </div>
    )
}

export default Landing;
import {
    Building2,
    CircleDollarSign,
    UsersRound,
    WalletCards
} from "lucide-react";
import "./Stats.css";

const stats = [
    {
        icon: UsersRound,
        value: "24",
        label: "Active tenants",
        detail: "Across the portfolio"
    },
    {
        icon: Building2,
        value: "8",
        label: "Managed properties",
        detail: "Organized in one place"
    },
    {
        icon: CircleDollarSign,
        value: "$32,400",
        label: "Yearly rent",
        detail: "Scheduled across all tenants"
    },
    {
        icon: WalletCards,
        value: "96%",
        label: "Rent collected",
        detail: "For the current year"
    }
];

function Stats() {
    return (
        <section className="stats-section" aria-labelledby="stats-heading">
            <div className="stats-heading">
                <p className="stats-eyebrow">A portfolio at a glance</p>
                <h2 id="stats-heading">Every important record, in one place</h2>
                <p className="stats-caption">Illustrative sample portfolio snapshot</p>
            </div>

            <div className="stats-grid">
                {stats.map(({ icon: Icon, value, label, detail }) => (
                    <article className="stats-card" key={label}>
                        <div className="stats-icon" aria-hidden="true">
                            <Icon size={22} strokeWidth={1.8} />
                        </div>
                        <div className="stats-content">
                            <p className="stats-value">{value}</p>
                            <h3 className="stats-label">{label}</h3>
                            <p className="stats-detail">{detail}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default Stats;

import { useEffect, useState } from "react";
import { CircleDollarSign, Plus, Search, RotateCcw } from "lucide-react";
import { useToast } from "../context/ToastContext.jsx";
import Badge from "../components/UI/Badge.jsx";
import LoadingState from "../components/UI/LoadingState.jsx";
import RecordPaymentModal from "../components/RecordPaymentModal.jsx";
import PaymentDetailsModal from "../components/PaymentDetailsModal.jsx";
import { getPaymentSummary, getPayments, getPaymentTenants, reversePayment } from "../services/paymentService.js";
import "./Payments.css";

const money = (value) => Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusVariant = (status) => status === "completed" || status === "paid" ? "success" : status === "reversed" || status === "overdue" ? "destructive" : status === "partial" || status === "pending" ? "warning" : "neutral";

function Payments() {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [filters, setFilters] = useState({ search: "", status: "", paymentMethod: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const { showToast } = useToast();

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [paymentRows, summaryData] = await Promise.all([getPayments(filters), getPaymentSummary()]);
            setPayments(paymentRows);
            setSummary(summaryData);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [filters.status, filters.paymentMethod]);
    useEffect(() => { getPaymentTenants().then(setTenants).catch((requestError) => setError(requestError.message)); }, []);

    const handleSearch = (event) => {
        event.preventDefault();
        loadData();
    };

    const handleReverse = async (id) => {
        if (!window.confirm("Reverse this payment? The financial record will remain in history.")) return;
        try {
            await reversePayment(id);
            showToast("Payment reversed.");
            loadData();
        } catch (requestError) {
            showToast(requestError.message, "error");
        }
    };

    return (
        <div className="payments-page">
            <div className="payments-header"><div><p className="page-eyebrow">Financial ledger</p><h1>Payments</h1><p>Track rent collected across your properties.</p></div><button className="primary-action" onClick={() => setShowModal(true)}><Plus size={18} /> Record Payment</button></div>
            {error && <div className="payments-error" role="alert">{error}</div>}
            <div className="payment-summary-grid"><SummaryCard label="Total Expected" value={summary?.totalExpected} /><SummaryCard label="Total Collected" value={summary?.totalCollected} /><SummaryCard label="Outstanding" value={summary?.totalOutstanding} /><SummaryCard label="Paid / Partial / Overdue" value={summary ? `${summary.paidCount} / ${summary.partialCount} / ${summary.overdueCount}` : "-"} /></div>
            <form className="payment-filters" onSubmit={handleSearch}><div className="payment-search"><Search size={18} /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search tenant" /></div><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="reversed">Reversed</option></select><select value={filters.paymentMethod} onChange={(event) => setFilters({ ...filters, paymentMethod: event.target.value })}><option value="">All methods</option><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="pos">POS</option><option value="online">Online</option><option value="other">Other</option></select><button className="filter-submit" type="submit">Search</button></form>
            {loading ? <LoadingState message="Loading payments..." /> : payments.length === 0 ? <div className="payments-empty"><CircleDollarSign size={34} /><h2>No payments found</h2><p>Record a payment to start building the ledger.</p></div> : <div className="payments-table-wrap"><table className="payments-table"><thead><tr><th>Tenant</th><th>Property</th><th>Amount</th><th>Date</th><th>Method</th><th>Reference</th><th>Status</th><th>Actions</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} onClick={() => setSelectedPayment(payment)}><td>{payment.tenantName}</td><td>{payment.propertyName}</td><td>₦{money(payment.amount)}</td><td>{payment.paymentDate}</td><td>{payment.paymentMethod.replace("_", " ")}</td><td>{payment.reference || "-"}</td><td><Badge variant={statusVariant(payment.status)}>{payment.status}</Badge></td><td>{payment.status !== "reversed" && <button className="icon-action" title="Reverse payment" onClick={(event) => { event.stopPropagation(); handleReverse(payment.id); }}><RotateCcw size={16} /></button>}</td></tr>)}</tbody></table></div>}
            <RecordPaymentModal isOpen={showModal} onClose={() => setShowModal(false)} tenants={tenants} onCreated={loadData} />
            <PaymentDetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
        </div>
    );
}

function SummaryCard({ label, value }) { return <div className="payment-summary-card"><span>{label}</span><strong>{value === undefined ? "-" : label === "Paid / Partial / Overdue" ? value : `₦${money(value)}`}</strong></div>; }

export default Payments;

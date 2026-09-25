import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Badge from "./UI/Badge.jsx";
import LoadingState from "./UI/LoadingState.jsx";
import RecordPaymentModal from "./RecordPaymentModal.jsx";
import CreateRentObligationModal from "./CreateRentObligationModal.jsx";
import { getRentObligations, getTenantPayments, getPaymentTenants } from "../services/paymentService.js";
import "./TenantPaymentHistory.css";

const money = (value) => Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const variant = (status) => status === "paid" || status === "completed" ? "success" : status === "overdue" || status === "reversed" ? "destructive" : status === "partial" ? "warning" : "neutral";

function TenantPaymentHistory({ tenantId }) {

    const [obligations, setObligations] = useState([]);
    const [payments, setPayments] = useState([]);
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recordOpen, setRecordOpen] = useState(false);
    const [obligationOpen, setObligationOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        try { 
            const [obligationRows, paymentRows] = await Promise.all([getRentObligations(tenantId), getTenantPayments(tenantId)]); 
            setObligations(obligationRows); 
            setPayments(paymentRows); 
        } catch (requestError) { 
            setError(requestError.message); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        load(); 
        getPaymentTenants().then((rows) => setTenant(rows.find((row) => String(row.id) === String(tenantId)))).catch(() => {}); 
    }, [tenantId]);

    if (loading) return <LoadingState message="Loading payment history..." />;
    return (
        <section className="tenant-payment-history">
            <div className="payment-history-heading">
                <div>
                    <h2>Payment history</h2>
                    <p>Rent obligations and recorded payments for this tenant.</p>
                </div>
                <div className="payment-history-actions">
                    <button 
                    className="add-doc-btn" 
                    onClick={() => setObligationOpen(true)}
                    >
                        <Plus size={17} /> 
                        New obligation
                    </button>
                    <button 
                    className="add-doc-btn" 
                    onClick={() => setRecordOpen(true)}
                    >
                        <Plus size={17} /> 
                        Record payment
                    </button>
                </div>
            </div>
            {error && <p className="form-error">{error}</p>}

            {obligations.length === 0 ? 
                <p>No rent obligations recorded yet.</p> : 
                <div className="tenant-obligations">
                    {obligations.map((obligation) => 
                        <div className="tenant-obligation" key={obligation.id}>
                            <div>
                                <strong>{obligation.periodStart} to {obligation.periodEnd}</strong>
                                <p>Due {obligation.dueDate}</p>
                            </div>
                            <div className="obligation-numbers">
                                <span>Due ₦{money(obligation.amountDue)}</span>
                                <span>Paid ₦{money(obligation.amountPaid)}</span>
                                <span>Outstanding ₦{money(obligation.outstanding)}</span>
                                <Badge variant={variant(obligation.status)}>
                                    {obligation.status}
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>
            }
            
            <h3 className="history-subheading">Recorded payments</h3>
            {payments.length === 0 ? 
                <p>No payments recorded for this tenant.</p> : 
                <div className="tenant-payment-list">
                    {payments.map((payment) => 
                        <div className="tenant-payment-row" key={payment.id}>
                            <span>{payment.paymentDate}</span>
                            <strong>₦{money(payment.amount)}</strong>
                            <span>{payment.paymentMethod.replace("_", " ")}</span>
                            <span>{payment.reference || "-"}</span>
                            <Badge variant={variant(payment.status)}>
                                {payment.status}
                            </Badge>
                        </div>
                    )}
                </div>}
                <RecordPaymentModal 
                isOpen={recordOpen} 
                onClose={() => setRecordOpen(false)} 
                tenants={tenant ? [tenant] : []} 
                onCreated={load} 
                />
                
                <CreateRentObligationModal 
                isOpen={obligationOpen} 
                tenantId={tenantId} 
                onClose={() => setObligationOpen(false)} 
                onCreated={load} 
                />
        </section>
    );
}

export default TenantPaymentHistory;

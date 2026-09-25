import { X } from "lucide-react";
import Badge from "./UI/Badge.jsx";

function PaymentDetailsModal({ payment, onClose }) {
    if (!payment) return null;
    return <div className="modal-overlay" onClick={onClose}>
        <div className="modal payment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading">
                <div>
                    <p className="modal-eyebrow">Ledger record</p>
                    <h2>Payment Details</h2>
                </div>
                <button 
                type="button" 
                className="modal-close-btn" 
                onClick={onClose} 
                aria-label="Close modal"
                >
                    <X size={18} />
                </button>
            </div>
            
            <div className="payment-detail-list">
                <p><strong>Tenant</strong><span>{payment.tenantName}</span></p>
                <p><strong>Property</strong><span>{payment.propertyName}</span></p>
                <p><strong>Amount</strong><span>₦{Number(payment.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span></p>
                <p><strong>Payment date</strong><span>{payment.paymentDate}</span></p>
                <p><strong>Method</strong><span>{payment.paymentMethod.replace("_", " ")}</span></p>
                <p><strong>Reference</strong><span>{payment.reference || "-"}</span></p>
                <p><strong>Status</strong><span><Badge variant={payment.status === "completed" ? "success" : payment.status === "reversed" ? "destructive" : "warning"}>{payment.status}</Badge></span></p>
                <p><strong>Notes</strong><span>{payment.notes || "-"}</span></p>
                <p><strong>Recorded</strong><span>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}</span></p>
            </div>
            <div className="modal-actions">
                <button type="button" onClick={onClose} className="cancel-btn">Close</button>
            </div>
        </div>
    </div>;
}

export default PaymentDetailsModal;
